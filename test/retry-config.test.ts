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
