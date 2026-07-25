import assert from "node:assert/strict";
import test from "node:test";
import { FakePostgresIdempotencyRepository } from "../src/repositories/fakes.js";
import { IdempotencyLeaseLostError } from "../src/repositories/interfaces.js";

test("처리 중 서버가 종료돼도 lease 만료 후 재처리하고 이전 작업 완료는 거부", async () => {
  let nowMs = 1_000;
  const repository = new FakePostgresIdempotencyRepository({
    processingLeaseMs: 5 * 60 * 1_000,
    now: () => nowMs
  });
  const message: {
    readonly channel: "kakao";
    readonly providerEventId: string;
  } = { channel: "kakao", providerEventId: "evt-crash-recovery" };

  const abandoned = await repository.begin(message);
  assert.equal(abandoned.status, "started");
  assert.equal((await repository.begin(message)).status, "duplicate");

  nowMs += 5 * 60 * 1_000 + 1;
  const recovered = await repository.begin(message);
  assert.equal(recovered.status, "started");
  if (abandoned.status !== "started" || recovered.status !== "started") {
    assert.fail("Expected started decisions");
  }

  await assert.rejects(
    repository.complete(abandoned.key, abandoned.leaseToken),
    IdempotencyLeaseLostError
  );
  await repository.complete(recovered.key, recovered.leaseToken);
  assert.equal((await repository.begin(message)).status, "duplicate");
});
