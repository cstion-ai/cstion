import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { removeTourProduct } from "../src/catalog/tour-catalog.js";
import { parseKakaoReservation } from "../src/kakao/reservation-parser.js";

describe("parseKakaoReservation", () => {
  it("extracts selected catalog product details from a Kakao message", () => {
    const message = {
      userId: "jeju-user-1",
      text: "김민지입니다. 2026년 10월 3일 제주 프라이빗 투어 2명 예약 가능한가요?",
      receivedAt: "2026-06-25T01:00:00.000Z",
      profile: { nickname: "김민지" }
    };

    const reservation = parseKakaoReservation(message);

    assert.equal(reservation.channel, "kakao");
    assert.equal(reservation.channelCustomerId, "jeju-user-1");
    assert.equal(reservation.customerName, "김민지");
    assert.equal(reservation.destination, "제주");
    assert.equal(reservation.productId, "jeju-private-tour");
    assert.equal(reservation.productName, "제주 프라이빗 투어");
    assert.equal(reservation.startDate, "2026-10-03");
    assert.equal(reservation.travelers, 2);
    assert.equal(reservation.confidence, 0.86);
  });

  it("recognizes configured aliases as the same catalog product", () => {
    const englishMessage = {
      userId: "osaka-user-2",
      text: "Osaka family package on 2026.10.04 for 3 pax",
      receivedAt: "2026-06-25T01:00:00.000Z"
    };
    const koreanMessage = {
      userId: "osaka-user-3",
      text: "2026-10-05 오사카 패키지 4명",
      receivedAt: "2026-06-25T01:00:00.000Z"
    };

    const englishReservation = parseKakaoReservation(englishMessage);
    const koreanReservation = parseKakaoReservation(koreanMessage);

    assert.equal(englishReservation.productId, "osaka-family-package");
    assert.equal(koreanReservation.productId, "osaka-family-package");
    assert.equal(englishReservation.destination, "오사카");
    assert.equal(koreanReservation.destination, "오사카");
  });

  it("does not recognize a deleted product", () => {
    const catalog = removeTourProduct("jeju-private-tour");
    const message = {
      userId: "jeju-user-removed",
      text: "2026년 10월 3일 제주 프라이빗 투어 2명 상담 원합니다.",
      receivedAt: "2026-06-25T01:00:00.000Z"
    };

    const reservation = parseKakaoReservation(message, catalog);

    assert.equal(reservation.destination, "미분류");
    assert.equal(reservation.productId, undefined);
    assert.equal(reservation.productName, undefined);
    assert.equal(reservation.confidence, 0.45);
  });
});
