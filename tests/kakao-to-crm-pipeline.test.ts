import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { handleKakaoMessage } from "../src/pipelines/kakao-to-crm.js";

describe("handleKakaoMessage", () => {
  it("runs the Yangzhou tour MVP path from Kakao message to CRM customer and booking lead", async () => {
    // Given: a Yangzhou tour inquiry without phone or email contact fields.
    const message = {
      userId: "yangzhou-test-user",
      text: "이수진입니다. 2026년 10월 3일 양저우투어 2명 상담 원합니다.",
      receivedAt: "2026-06-25T01:00:00.000Z",
      profile: { nickname: "이수진" }
    };

    // When: the MVP pipeline handles the Kakao message.
    const result = await handleKakaoMessage(message);

    // Then: each module receives the Yangzhou reservation with stable customer and booking IDs.
    assert.equal(result.reservation.destination, "양저우");
    assert.equal(result.reservation.productName, "양저우 투어");
    assert.equal(result.customer.id, "kakao:yangzhou-test-user");
    assert.equal(result.customer.channelCustomerId, "yangzhou-test-user");
    assert.equal(result.booking.customerId, "kakao:yangzhou-test-user");
    assert.equal(result.booking.destination, "양저우");
    assert.match(result.booking.id, /^lead_[0-9a-f-]{36}$/u);
  });
});
