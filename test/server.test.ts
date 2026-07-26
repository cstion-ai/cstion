import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import { connect } from "node:net";
import test from "node:test";
import { z } from "zod";
import type { KakaoMessage } from "../src/kakao/reservation-parser.js";
import type { PipelineResult } from "../src/pipelines/kakao-to-crm.js";
import { createAppServer } from "../src/server/http-server.js";
import { createConnectCheck, createConnectCookie } from "../src/server/oauth-state.js";
import { loadConfig } from "../src/shared/config.js";

const WEBHOOK_SECRET = "test-webhook-secret";
const TEST_CONFIG = loadConfig({
  NODE_ENV: "test",
  KAKAO_REST_API_KEY: "test-rest-key",
  KAKAO_REDIRECT_URI: "http://localhost/auth/kakao/callback",
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

test("Given a malformed request target, when it reaches the app server, then it returns a client error", async (context) => {
  const { server } = await startServer();
  context.after(() => closeServer(server));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const socket = connect(address.port, "127.0.0.1");
  socket.setEncoding("utf8");
  socket.end(
    "GET http://[ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n"
  );

  let response = "";
  for await (const chunk of socket) {
    response += chunk;
  }

  assert.match(response, /^HTTP\/1\.1 400 /);
});

test("Given Kakao login, when OAuth starts, then the state cookie omits the raw state", async (context) => {
  const { server, baseUrl } = await startServer();
  context.after(() => closeServer(server));

  const response = await fetch(`${baseUrl}/auth/kakao/login`);
  const body = z.object({ redirectUrl: z.string().url() }).parse(await response.json());
  const cookie = response.headers.get("set-cookie") ?? "";
  const state = new URL(body.redirectUrl).searchParams.get("state");

  assert.equal(response.status, 200);
  assert.ok(state);
  assert.doesNotMatch(cookie, new RegExp(state));
  assert.match(cookie, /kakao_connect_check=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("Given a mismatched OAuth state, when Kakao calls back, then token exchange is rejected", async (context) => {
  let exchangedCount = 0;
  const { server, baseUrl } = await startServer(
    async () => createdResult(),
    async () => {
      exchangedCount += 1;
      return {
        token_type: "bearer",
        access_token: "access-token",
        expires_in: 3600
      };
    }
  );
  context.after(() => closeServer(server));

  const response = await fetch(`${baseUrl}/auth/kakao/callback?code=code-1&state=wrong-state`, {
    headers: {
      cookie: createConnectCookie(createConnectCheck("expected-state", WEBHOOK_SECRET), false)
    }
  });

  assert.equal(response.status, 400);
  assert.equal(exchangedCount, 0);
});

test("Given a matching OAuth state, when Kakao calls back, then the state cookie is consumed", async (context) => {
  let exchangedCount = 0;
  const { server, baseUrl } = await startServer(
    async () => createdResult(),
    async () => {
      exchangedCount += 1;
      return {
        token_type: "bearer",
        access_token: "access-token",
        expires_in: 3600
      };
    }
  );
  context.after(() => closeServer(server));

  const response = await fetch(`${baseUrl}/auth/kakao/callback?code=code-1&state=expected-state`, {
    headers: {
      cookie: createConnectCookie(createConnectCheck("expected-state", WEBHOOK_SECRET), false)
    }
  });

  assert.equal(response.status, 200);
  assert.equal(exchangedCount, 1);
  assert.match(response.headers.get("set-cookie") ?? "", /kakao_connect_check=;/);
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

test("Given test mode without a secret, when a Kakao webhook is posted, then it fails closed", async (context) => {
  let handledCount = 0;
  const configWithoutSecret = loadConfig({ NODE_ENV: "test" });
  const { server, baseUrl } = await startServer(
    async () => {
      handledCount += 1;
      return createdResult();
    },
    undefined,
    configWithoutSecret
  );
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
  handleKakaoWebhook: (message: KakaoMessage) => Promise<PipelineResult> = async () => createdResult(),
  exchangeKakaoCode = async () => ({
    token_type: "bearer",
    access_token: "access-token",
    expires_in: 3600
  }),
  config = TEST_CONFIG
): Promise<{ readonly server: Server; readonly baseUrl: string }> {
  const server = createAppServer({ config, handleKakaoWebhook, exchangeKakaoCode });
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
