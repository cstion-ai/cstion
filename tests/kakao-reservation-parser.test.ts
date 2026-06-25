import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseKakaoReservation } from "../src/kakao/reservation-parser.js";

describe("parseKakaoReservation", () => {
  it("extracts Yangzhou tour details when the Kakao message requests 양저우투어", () => {
    // Given: a Kakao inquiry for the Yangzhou tour test path.
    const message = {
      userId: "yangzhou-user-1",
      text: "김민지입니다. 2026년 10월 3일 양저우투어 2명 예약 가능한가요?",
      receivedAt: "2026-06-25T01:00:00.000Z",
      profile: { nickname: "김민지" }
    };

    // When: the reservation parser analyzes the message.
    const reservation = parseKakaoReservation(message);

    // Then: the MVP fields are normalized for CRM and booking handoff.
    assert.equal(reservation.channel, "kakao");
    assert.equal(reservation.channelCustomerId, "yangzhou-user-1");
    assert.equal(reservation.customerName, "김민지");
    assert.equal(reservation.destination, "양저우");
    assert.equal(reservation.productName, "양저우 투어");
    assert.equal(reservation.startDate, "2026-10-03");
    assert.equal(reservation.travelers, 2);
    assert.equal(reservation.confidence, 0.86);
  });

  it("recognizes English and Chinese Yangzhou aliases as the same destination", () => {
    // Given: two channel messages that use non-Korean aliases for Yangzhou.
    const englishMessage = {
      userId: "yangzhou-user-2",
      text: "Yangzhou tour on 2026.10.04 for 3 pax",
      receivedAt: "2026-06-25T01:00:00.000Z"
    };
    const chineseMessage = {
      userId: "yangzhou-user-3",
      text: "2026-10-05 扬州 tour 4 pax",
      receivedAt: "2026-06-25T01:00:00.000Z"
    };

    // When: both aliases are parsed.
    const englishReservation = parseKakaoReservation(englishMessage);
    const chineseReservation = parseKakaoReservation(chineseMessage);

    // Then: both feed the same canonical destination used by downstream modules.
    assert.equal(englishReservation.destination, "양저우");
    assert.equal(chineseReservation.destination, "양저우");
  });
});
