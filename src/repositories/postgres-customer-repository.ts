import { z } from "zod";
import type { CrmCustomer, CustomerIdentity } from "../shared/schemas.js";
import { CustomerIdentityConflictError } from "./interfaces.js";
import type {
  CustomerRepository,
  CustomerUpsertInput
} from "./interfaces.js";
import {
  PostgresInvariantError,
  type SqlClient,
  type SqlTransactionRunner
} from "./postgres-types.js";

const CustomerIdRowSchema = z.object({ id: z.string().uuid() });
const CustomerIdentityRowSchema = z.object({
  identity_type: z.enum(["channel", "phone", "email"]),
  provider: z.string(),
  identity_value: z.string().min(1)
});

export class PostgresCustomerRepository implements CustomerRepository {
  constructor(private readonly transactions: SqlTransactionRunner) {}

  async upsertByIdentities(input: CustomerUpsertInput): Promise<CrmCustomer> {
    return this.transactions.transaction(async (client) => {
      const orderedIdentities = [...input.identities].sort((left, right) =>
        identityLockKey(left).localeCompare(identityLockKey(right))
      );

      for (const identity of orderedIdentities) {
        await client.query(
          `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
          [identityLockKey(identity)]
        );
      }

      const ownerIds = await this.findOwnerIds(client, orderedIdentities);
      if (ownerIds.length > 1) {
        throw new CustomerIdentityConflictError(ownerIds);
      }
      const customerId = ownerIds[0] ?? (await this.insertCustomer(client, input));

      await client.query(
        `UPDATE customers SET name = $2, tags = $3, updated_at = now() WHERE id = $1`,
        [customerId, input.name, input.tags]
      );

      for (const identity of orderedIdentities) {
        await client.query(
          `INSERT INTO customer_identities (customer_id, identity_type, provider, identity_value)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (identity_type, provider, identity_value) DO NOTHING`,
          [customerId, identity.type, identity.provider ?? "", identity.value]
        );
      }

      const identityResult = await client.query(
        `SELECT identity_type, provider, identity_value
         FROM customer_identities
         WHERE customer_id = $1
         ORDER BY identity_type, provider, identity_value`,
        [customerId]
      );
      const identities = z.array(CustomerIdentityRowSchema)
        .parse(identityResult.rows)
        .map((row) => ({
          type: row.identity_type,
          value: row.identity_value,
          ...(row.provider ? { provider: row.provider } : {})
        }));

      return {
        id: customerId,
        name: input.name,
        sourceChannel: input.sourceChannel,
        identities,
        tags: input.tags
      };
    });
  }

  private async findOwnerIds(
    client: SqlClient,
    identities: readonly CustomerIdentity[]
  ): Promise<readonly string[]> {
    const ownerIds = new Set<string>();
    for (const identity of identities) {
      const result = await client.query(
        `SELECT c.id
         FROM customers c
         JOIN customer_identities ci ON ci.customer_id = c.id
         WHERE ci.identity_type = $1 AND ci.provider = $2 AND ci.identity_value = $3
         LIMIT 1`,
        [identity.type, identity.provider ?? "", identity.value]
      );
      const owner = result.rows[0];
      if (owner) ownerIds.add(CustomerIdRowSchema.parse(owner).id);
    }
    return [...ownerIds];
  }

  private async insertCustomer(
    client: SqlClient,
    input: CustomerUpsertInput
  ): Promise<string> {
    const result = await client.query(
      `INSERT INTO customers (name, source_channel, tags) VALUES ($1, $2, $3) RETURNING id`,
      [input.name, input.sourceChannel, input.tags]
    );
    const customer = result.rows[0];
    if (!customer) throw new PostgresInvariantError("Customer insert returned no id");
    return CustomerIdRowSchema.parse(customer).id;
  }
}

function identityLockKey(identity: CustomerIdentity): string {
  return `${identity.type}:${identity.provider ?? ""}:${identity.value}`;
}
