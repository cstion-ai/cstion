import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createCustomerFromReservation, InMemoryCustomerRepository } from "../src/crm/customer-service.js";
import type { ReservationIntent } from "../src/shared/schemas.js";

describe("createCustomerFromReservation", () => {
  it("keeps two Kakao users separate when their nicknames match and contact fields are missing", async () => {
    // Given: two Kakao reservations with the same display nickname but different channel identities.
    const repository = new InMemoryCustomerRepository();
    const firstReservation: ReservationIntent = {
      channel: "kakao",
      channelCustomerId: "kakao-user-a",
      customerName: "여행고객",
      destination: "제주",
      startDate: "2026-10-03",
      travelers: 2,
      productId: "jeju-private-tour",
      productName: "제주 프라이빗 투어",
      confidence: 0.86
    };
    const secondReservation: ReservationIntent = {
      ...firstReservation,
      channelCustomerId: "kakao-user-b"
    };

    // When: both reservations are upserted into CRM.
    const firstCustomer = await createCustomerFromReservation(firstReservation, repository);
    const secondCustomer = await createCustomerFromReservation(secondReservation, repository);

    // Then: CRM identity is keyed by stable Kakao user ID, not nickname.
    assert.equal(firstCustomer.id, "kakao:kakao-user-a");
    assert.equal(secondCustomer.id, "kakao:kakao-user-b");
    assert.notEqual(firstCustomer.id, secondCustomer.id);
    assert.deepEqual(firstCustomer.tags, ["travel-lead", "제주", "kakao", "jeju-private-tour"]);
  });
});
