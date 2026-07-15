import test from "node:test";
import assert from "node:assert/strict";
import { FakeCrmAdapter, FakeSheetsAdapter } from "../src/adapters/fakes.js";
import { FakeBookingRepository, FakeCustomerRepository, FakePostgresIdempotencyRepository } from "../src/repositories/fakes.js";
import { createKakaoPipeline } from "../src/pipelines/kakao-to-crm.js";
import { defaultRetryPolicy } from "../src/platform/retry.js";
import { safeLogPayload } from "../src/platform/redaction.js";

function createDeps(sheetsAdapter = new FakeSheetsAdapter()) {
  return {
    idempotencyRepository: new FakePostgresIdempotencyRepository(),
    customerRepository: new FakeCustomerRepository(),
    bookingRepository: new FakeBookingRepository(),
    crmAdapter: new FakeCrmAdapter(),
    sheetsAdapter,
    retryPolicy: { ...defaultRetryPolicy, timeoutMs: 200 }
  };
}

test("동일 이벤트 2회 수신 시 예약 1건", async () => {
  const deps = createDeps();
  const pipeline = createKakaoPipeline(deps);
  const message = {
    providerEventId: "evt-dup",
    providerUserId: "kakao-user-1",
    text: "2026년 8월 12일 제주 패키지 2명 예약",
    receivedAt: "2026-07-09T00:00:00.000Z"
  };

  const first = await pipeline(message);
  const second = await pipeline(message);

  assert.equal(first.status, "created");
  assert.equal(second.status, "duplicate");
  assert.equal(await deps.bookingRepository.count(), 1);
});

test("날짜 누락 시 Booking 미생성", async () => {
  const deps = createDeps();
  const result = await createKakaoPipeline(deps)({
    providerEventId: "evt-no-date",
    providerUserId: "kakao-user-2",
    text: "제주 패키지 2명 예약",
    receivedAt: "2026-07-09T00:00:00.000Z"
  });

  assert.equal(result.status, "needs_confirmation");
  assert.deepEqual(result.missingFields, ["startDate"]);
  assert.equal(await deps.bookingRepository.count(), 0);
});

test("인원 누락 시 Booking 미생성", async () => {
  const deps = createDeps();
  const result = await createKakaoPipeline(deps)({
    providerEventId: "evt-no-travelers",
    providerUserId: "kakao-user-3",
    text: "2026년 8월 12일 제주 패키지 예약",
    receivedAt: "2026-07-09T00:00:00.000Z"
  });

  assert.equal(result.status, "needs_confirmation");
  assert.deepEqual(result.missingFields, ["travelers"]);
  assert.equal(await deps.bookingRepository.count(), 0);
});

test("2026-02-31 거부", async () => {
  const deps = createDeps();
  const result = await createKakaoPipeline(deps)({
    providerEventId: "evt-invalid-date",
    providerUserId: "kakao-user-4",
    text: "2026년 2월 31일 제주 패키지 2명 예약",
    receivedAt: "2026-07-09T00:00:00.000Z"
  });

  assert.equal(result.status, "needs_confirmation");
  assert.deepEqual(result.missingFields, ["startDate"]);
  assert.equal(await deps.bookingRepository.count(), 0);
});

test("CRM 성공 후 Sheets 실패 재시도", async () => {
  const sheets = new FakeSheetsAdapter(1, "transient");
  const deps = createDeps(sheets);
  const result = await createKakaoPipeline(deps)({
    providerEventId: "evt-retry-sheets",
    providerUserId: "kakao-user-5",
    text: "2026년 8월 12일 제주 패키지 2명 예약",
    receivedAt: "2026-07-09T00:00:00.000Z"
  });

  assert.equal(result.status, "created");
  assert.equal(deps.crmAdapter.syncedCustomers.length, 1);
  assert.equal(sheets.attempts, 2);
  assert.equal(sheets.contexts[0].idempotencyKey, "kakao:evt-retry-sheets");
  assert.equal(sheets.appendedLeads.length, 1);
});

test("서로 다른 Kakao ID 고객 분리", async () => {
  const deps = createDeps();
  const pipeline = createKakaoPipeline(deps);
  const first = await pipeline({
    providerEventId: "evt-user-a",
    providerUserId: "kakao-user-a",
    text: "2026년 8월 12일 제주 패키지 2명 예약",
    receivedAt: "2026-07-09T00:00:00.000Z",
    profile: { nickname: "동명이인" }
  });
  const second = await pipeline({
    providerEventId: "evt-user-b",
    providerUserId: "kakao-user-b",
    text: "2026년 8월 13일 제주 패키지 2명 예약",
    receivedAt: "2026-07-09T00:00:00.000Z",
    profile: { nickname: "동명이인" }
  });

  assert.equal(first.status, "created");
  assert.equal(second.status, "created");
  assert.notEqual(first.customerId, second.customerId);
});

test("전화번호가 나중에 추가돼도 기존 고객 ID 유지", async () => {
  const deps = createDeps();
  const pipeline = createKakaoPipeline(deps);
  const first = await pipeline({
    providerEventId: "evt-phone-later-1",
    providerUserId: "kakao-user-phone",
    text: "2026년 8월 12일 제주 패키지 2명 예약",
    receivedAt: "2026-07-09T00:00:00.000Z"
  });
  const second = await pipeline({
    providerEventId: "evt-phone-later-2",
    providerUserId: "kakao-user-phone",
    text: "2026년 8월 13일 제주 패키지 2명 예약",
    receivedAt: "2026-07-09T00:00:00.000Z",
    profile: { phone: "+82-10-9999-0000" }
  });

  assert.equal(first.status, "created");
  assert.equal(second.status, "created");
  assert.equal(first.customerId, second.customerId);
});

test("로그 PII 마스킹", () => {
  const redacted = safeLogPayload({
    message: "예약자 test@example.com +82-10-1234-5678",
    KAKAO_REST_API_KEY: "secret-key",
    nested: { token: "secret-token" }
  });

  assert.match(redacted, /t\*\*\*@example.com/);
  assert.match(redacted, /\[REDACTED_PHONE\]/);
  assert.doesNotMatch(redacted, /secret-key/);
  assert.doesNotMatch(redacted, /secret-token/);
});
