import { randomUUID } from "node:crypto";
import type { ErrorClassification } from "../platform/retry.js";
import { IdempotencyLeaseLostError } from "./interfaces.js";
import type {
  IdempotencyDecision,
  IdempotencyRepository
} from "./interfaces.js";
import {
  PostgresInvariantError,
  type SqlClient
} from "./postgres-types.js";

const PROCESSING_LEASE_INTERVAL = "5 minutes";

export class PostgresIdempotencyRepository implements IdempotencyRepository {
  constructor(private readonly client: SqlClient) {}

  async begin(message: {
    readonly channel: string;
    readonly providerEventId: string;
  }): Promise<IdempotencyDecision> {
    const key = `${message.channel}:${message.providerEventId}`;
    const leaseToken = randomUUID();
    const result = await this.client.query(
      `INSERT INTO channel_events (channel, provider_event_id, processing_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (channel, provider_event_id)
       DO UPDATE SET
         status = 'processing',
         error_classification = NULL,
         completed_at = NULL,
         processing_started_at = now(),
         processing_token = EXCLUDED.processing_token,
         attempt_count = channel_events.attempt_count + 1
       WHERE channel_events.status = 'failed'
          OR (
            channel_events.status = 'processing'
            AND channel_events.processing_started_at < now() - $4::interval
          )
       RETURNING TRUE AS inserted`,
      [
        message.channel,
        message.providerEventId,
        leaseToken,
        PROCESSING_LEASE_INTERVAL
      ]
    );

    if (result.rowCount === 1) return { status: "started", key, leaseToken };
    if (result.rowCount === 0) return { status: "duplicate", key };
    throw new PostgresInvariantError("Event insert returned an invalid row count");
  }

  async complete(key: string, leaseToken: string): Promise<void> {
    const [channel, providerEventId] = splitKey(key);
    const result = await this.client.query(
      `UPDATE channel_events
       SET status = 'completed', completed_at = now()
       WHERE channel = $1
         AND provider_event_id = $2
         AND status = 'processing'
         AND processing_token = $3`,
      [channel, providerEventId, leaseToken]
    );
    if (result.rowCount !== 1) throw new IdempotencyLeaseLostError(key);
  }

  async fail(
    key: string,
    leaseToken: string,
    classification: ErrorClassification
  ): Promise<void> {
    const [channel, providerEventId] = splitKey(key);
    const result = await this.client.query(
      `UPDATE channel_events
       SET status = 'failed', error_classification = $4
       WHERE channel = $1
         AND provider_event_id = $2
         AND status = 'processing'
         AND processing_token = $3`,
      [channel, providerEventId, leaseToken, classification]
    );
    if (result.rowCount !== 1) throw new IdempotencyLeaseLostError(key);
  }
}

function splitKey(key: string): [string, string] {
  const separator = key.indexOf(":");
  return [key.slice(0, separator), key.slice(separator + 1)];
}
