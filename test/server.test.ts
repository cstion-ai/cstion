import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import test from "node:test";
import { z } from "zod";
import type { KakaoMessage } from "../src/kakao/reservation-parser.js";
import type { PipelineResult } from "../src/pipelines/kakao-to-crm.js";
import { createAppServer } from "../src/server/http-server.js";
import { loadConfig } from "../src/shared/config.js";

const WEBHOOK_SECRET = "test-webhook-secret";
const TEST_CONFIG = loadConfig({
  NODE_ENV: "test",
  KAKAO_WEBHOOK_SECRET: WEBHOOK_SECRET
});
const KAKAO_MESSAGE = {
  providerEventId: "event-1",
  providerUserId: "user-1",
  text: "2026년 9월 3일 오사카 패키지 2명 예약",
  receivedAt: "2026-07-24T00:00:00.000Z"
};
const HealthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.string()
});

test("Given the app server, when health is requested, then it returns service status", async (context) => {
  const { server, baseUrl } = await startServer();
  context.after(() => closeServer(server));

  const response = await fetch(`${baseUrl}/health`);
  const body = HealthResponseSchema.parse(await response.json());

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "travel-ai-automation");

});

test("Given no signature, when a Kakao webhook is posted, then it is rejected before processing", async (context) => {
  let handledCount = 0;
  const { server, baseUrl } = await startServer(async () => {
    handledCount += 1;
    return createdResult();
  });
  context.after(() => closeServer(server));

  const response = await fetch(`${baseUrl}/webhooks/kakao`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(KAKAO_MESSAGE)
  });

  assert.equal(response.status, 401);
  assert.equal(handledCount, 0);

});

test("Given a valid signature, when a Kakao webhook is posted, then it is processed", async (context) => {
  let handledCount = 0;
  const { server, baseUrl } = await startServer(async () => {
    handledCount += 1;
    return createdResult();
  });
  context.after(() => closeServer(server));
  const body = JSON.stringify(KAKAO_MESSAGE);

  const response = await fetch(`${baseUrl}/webhooks/kakao`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-kakao-signature": sign(body)
    },
    body
  });

  assert.equal(response.status, 201);
  assert.equal(handledCount, 1);

});

test("Given signed malformed JSON, when a Kakao webhook is posted, then it returns a client error", async (context) => {
  let handledCount = 0;
  const { server, baseUrl } = await startServer(async () => {
    handledCount += 1;
    return createdResult();
  });
  context.after(() => closeServer(server));
  const body = "{not-json";

  const response = await fetch(`${baseUrl}/webhooks/kakao`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-kakao-signature": sign(body)
    },
    body
  });

  assert.equal(response.status, 400);
  assert.equal(handledCount, 0);

});

test("Given an oversized body, when a Kakao webhook is posted, then it is rejected", async (context) => {
  let handledCount = 0;
  const { server, baseUrl } = await startServer(async () => {
    handledCount += 1;
    return createdResult();
  });
  context.after(() => closeServer(server));
  const body = JSON.stringify({ ...KAKAO_MESSAGE, text: "x".repeat(256 * 1024) });

  const response = await fetch(`${baseUrl}/webhooks/kakao`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-kakao-signature": sign(body)
    },
    body
  });

  assert.equal(response.status, 413);
  assert.equal(handledCount, 0);

});

async function startServer(
  handleKakaoWebhook: (message: KakaoMessage) => Promise<PipelineResult> = async () => createdResult()
): Promise<{ readonly server: Server; readonly baseUrl: string }> {
  const server = createAppServer({ config: TEST_CONFIG, handleKakaoWebhook });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

function sign(body: string): string {
  return `sha256=${createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex")}`;
}

function createdResult(): PipelineResult {
  return {
    status: "created",
    idempotencyKey: "kakao:event-1",
    customerId: "44b235aa-9706-4916-872f-0256effbe7bc",
    bookingId: "lead_kakao_event-1"
  };
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
