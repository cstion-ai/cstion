import test from "node:test";
import assert from "node:assert/strict";
import { buildKakaoLoginUrl } from "../src/kakao/oauth.js";
import { parseKakaoReservation } from "../src/kakao/reservation-parser.js";

test("parseKakaoReservation extracts complete reservation draft", () => {
  const reservation = parseKakaoReservation({
    providerEventId: "event-1",
    providerUserId: "user-1",
    text: "김여행입니다. 2026년 9월 3일 오사카 패키지 2명 예약하고 싶어요.",
    receivedAt: "2026-07-09T00:00:00.000Z",
    profile: { nickname: "김여행", phone: "+82-10-1111-2222" }
  });

  assert.equal(reservation.providerEventId, "event-1");
  assert.equal(reservation.providerUserId, "user-1");
  assert.equal(reservation.customerName, "김여행");
  assert.equal(reservation.destination, "오사카");
  assert.equal(reservation.startDate, "2026-09-03");
  assert.equal(reservation.travelers, 2);
  assert.equal(reservation.productName, "패키지");
  assert.equal(reservation.confidence, 0.86);
});

test("buildKakaoLoginUrl includes OAuth parameters and scopes", () => {
  const url = new URL(
    buildKakaoLoginUrl(
      { clientId: "rest-key", redirectUri: "https://travel.example.com/auth/kakao/callback" },
      "state-token"
    )
  );

  assert.equal(url.origin, "https://kauth.kakao.com");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("client_id"), "rest-key");
  assert.equal(url.searchParams.get("state"), "state-token");
  assert.match(url.searchParams.get("scope") ?? "", /profile_nickname/);
});
