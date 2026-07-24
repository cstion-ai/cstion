import test from "node:test";
import assert from "node:assert/strict";
import { ClassifiedError, runWithRetry } from "../src/platform/retry.js";
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
