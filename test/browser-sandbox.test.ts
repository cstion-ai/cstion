import test from "node:test";
import assert from "node:assert/strict";
import {
  SandboxInputError,
  evaluateSyntheticReservation
} from "../src/web/reservation-sandbox.js";

test("Given a complete synthetic message, when the browser sandbox parses it, then it shows a created route", () => {
  const result = evaluateSyntheticReservation(
    "2026년 9월 3일 오사카 패키지 2명 예약하고 싶어요."
  );

  assert.deepEqual(result, {
    destination: "오사카",
    startDate: "2026-09-03",
    travelers: 2,
    productName: "패키지",
    route: "created",
    missingFields: [],
    confidence: 0.86
  });
});

test("Given an incomplete synthetic message, when the browser sandbox parses it, then it names the confirmation fields", () => {
  const result = evaluateSyntheticReservation("다낭 자유여행 2명 문의");

  assert.equal(result.route, "needs_confirmation");
  assert.deepEqual(result.missingFields, ["startDate"]);
  assert.equal(result.startDate, null);
});

test("Given an impossible date, when the browser sandbox parses it, then the real booking rule requires confirmation", () => {
  const result = evaluateSyntheticReservation(
    "2026년 2월 31일 제주 호텔 3명 예약"
  );

  assert.equal(result.route, "needs_confirmation");
  assert.deepEqual(result.missingFields, ["startDate"]);
});

test("Given empty or oversized input, when the browser sandbox parses it, then a typed input error is returned", () => {
  assert.throws(
    () => evaluateSyntheticReservation("   "),
    SandboxInputError
  );
  assert.throws(
    () => evaluateSyntheticReservation("가".repeat(4_001)),
    SandboxInputError
  );
});

test("Given a synthetic message, when a result is serialized, then the original message and internal IDs are absent", () => {
  const message = "2026년 9월 3일 파리 패키지 2명 예약";

  const serialized = JSON.stringify(evaluateSyntheticReservation(message));

  assert.doesNotMatch(serialized, /파리 패키지/);
  assert.doesNotMatch(serialized, /providerEventId|providerUserId|memo/);
});
