import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { handleKakaoMessage } from "../src/pipelines/kakao-to-crm.js";

describe("handleKakaoMessage", () => {
  it("runs a catalog product path from Kakao message to CRM customer and booking lead", async () => {
    const message = {
      userId: "catalog-test-user",
      text: "이수진입니다. 2026년 10월 3일 제주 프라이빗 투어 2명 상담 원합니다.",
      receivedAt: "2026-06-25T01:00:00.000Z",
      profile: { nickname: "이수진" }
    };

    const result = await handleKakaoMessage(message);

    assert.equal(result.reservation.destination, "제주");
    assert.equal(result.reservation.productId, "jeju-private-tour");
    assert.equal(result.reservation.productName, "제주 프라이빗 투어");
    assert.equal(result.customer.id, "kakao:catalog-test-user");
    assert.equal(result.customer.channelCustomerId, "catalog-test-user");
    assert.deepEqual(result.customer.tags, ["travel-lead", "제주", "kakao", "jeju-private-tour"]);
    assert.equal(result.booking.customerId, "kakao:catalog-test-user");
    assert.equal(result.booking.destination, "제주");
    assert.equal(result.booking.productId, "jeju-private-tour");
    assert.match(result.booking.id, /^lead_[0-9a-f-]{36}$/u);
  });
});
