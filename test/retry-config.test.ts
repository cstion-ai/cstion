import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { ClassifiedError, runWithRetry } from "../src/platform/retry.js";
import { createAppRuntime } from "../src/server/runtime.js";
import { loadConfig } from "../src/shared/config.js";

test("permanent errors are classified and not retried", async () => {
  let attempts = 0;

  await assert.rejects(
    runWithRetry(
      async () => {
        attempts += 1;
        throw new ClassifiedError("bad request", "permanent");
      },
      { maxAttempts: 3, timeoutMs: 100, shouldRetry: (error, attempt) => error.classification !== "permanent" && attempt < 3 }
    ),
    /bad request/
  );

  assert.equal(attempts, 1);
});

test("production config rejects missing secrets", () => {
  assert.throws(() => loadConfig({ NODE_ENV: "production", CRM_BASE_URL: "https://crm.example.com" }), /required in production/);
});

test("Given an out-of-range port, when config loads, then it rejects the value", () => {
  assert.throws(
    () => loadConfig({ NODE_ENV: "test", PORT: "65536" }),
    (error: unknown) =>
      error instanceof z.ZodError &&
      error.issues.some(
        (issue) =>
          issue.code === "too_big" &&
          issue.path.length === 1 &&
          issue.path[0] === "PORT" &&
          issue.maximum === 65_535
      )
  );
});

test("Given development config, when no host is set, then it binds to loopback", () => {
  const config = loadConfig({ NODE_ENV: "development" });

  assert.equal(config.host, "127.0.0.1");
});

test("Given every other production secret, when DATABASE_URL is missing, then config rejects in-memory persistence", () => {
  assert.throws(
    () =>
      loadConfig({
        NODE_ENV: "production",
        CRM_BASE_URL: "https://crm.example.com",
        CRM_API_KEY: "crm-secret",
        KAKAO_REST_API_KEY: "kakao-key",
        KAKAO_REDIRECT_URI: "https://travel.example.com/auth/kakao/callback",
        KAKAO_CLIENT_SECRET: "kakao-client-secret",
        KAKAO_WEBHOOK_SECRET: "kakao-webhook-secret",
        GOOGLE_SHEET_ID: "sheet-id"
      }),
    /DATABASE_URL is required in production/
  );
});

test("Given fake external adapters, when production runtime starts, then startup fails closed", () => {
  const config = loadConfig({
    NODE_ENV: "production",
    CRM_BASE_URL: "https://crm.example.com",
    CRM_API_KEY: "crm-secret",
    KAKAO_REST_API_KEY: "kakao-key",
    KAKAO_REDIRECT_URI: "https://travel.example.com/auth/kakao/callback",
    KAKAO_CLIENT_SECRET: "kakao-client-secret",
    KAKAO_WEBHOOK_SECRET: "kakao-webhook-secret",
    GOOGLE_SHEET_ID: "sheet-id",
    DATABASE_URL: "postgresql://travel:secret@localhost:5432/travel"
  });

  assert.throws(
    () => createAppRuntime(config),
    /Production CRM and Sheets adapters are not implemented/
  );
});

test("production config rejects insecure external URLs", () => {
  assert.throws(
    () =>
      loadConfig({
        NODE_ENV: "production",
        CRM_BASE_URL: "http://crm.example.com",
        CRM_API_KEY: "crm-secret",
        KAKAO_REST_API_KEY: "kakao-key",
        KAKAO_REDIRECT_URI: "http://travel.example.com/auth/kakao/callback",
        KAKAO_CLIENT_SECRET: "kakao-client-secret",
        KAKAO_WEBHOOK_SECRET: "kakao-webhook-secret",
        GOOGLE_SHEET_ID: "sheet-id",
        DATABASE_URL: "postgresql://travel:secret@localhost:5432/travel"
      }),
    /must use HTTPS in production/
  );
});
