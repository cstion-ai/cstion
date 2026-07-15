import test from "node:test";
import assert from "node:assert/strict";
import { FakeCrmAdapter, FakeSheetsAdapter } from "../src/adapters/fakes.js";
import { FakeBookingRepository, FakeCustomerRepository, FakePostgresIdempotencyRepository } from "../src/repositories/fakes.js";
import { createKakaoPipeline } from "../src/pipelines/kakao-to-crm.js";

test("handleKakaoMessage runs Kakao to CRM to Booking pipeline", async () => {
  const bookingRepository = new FakeBookingRepository();
  const result = await createKakaoPipeline({
    idempotencyRepository: new FakePostgresIdempotencyRepository(),
    customerRepository: new FakeCustomerRepository(),
    bookingRepository,
    crmAdapter: new FakeCrmAdapter(),
    sheetsAdapter: new FakeSheetsAdapter()
  })({
    providerEventId: "pipeline-event",
    providerUserId: "pipeline-user",
    text: "2026년 12월 24일 하와이 신혼여행 2명 문의",
    receivedAt: "2026-07-09T00:00:00.000Z",
    profile: { nickname: "신혼고객", email: "honeymoon@example.com" }
  });

  assert.equal(result.status, "created");
  assert.equal(await bookingRepository.count(), 1);
});
