import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createBookingLead } from "../src/booking/reservation-service.js";
import type { CrmCustomer, ReservationIntent } from "../src/shared/schemas.js";

describe("createBookingLead", () => {
  it("uses collision-resistant IDs for repeated lead creation", () => {
    // Given: the same customer and reservation can generate multiple independent leads.
    const customer: CrmCustomer = {
      id: "kakao:jeju-user-1",
      name: "김민지",
      sourceChannel: "kakao",
      channelCustomerId: "jeju-user-1",
      tags: ["travel-lead", "제주", "kakao", "jeju-private-tour"]
    };
    const reservation: ReservationIntent = {
      channel: "kakao",
      channelCustomerId: "jeju-user-1",
      customerName: "김민지",
      destination: "제주",
      startDate: "2026-10-03",
      travelers: 2,
      productId: "jeju-private-tour",
      productName: "제주 프라이빗 투어",
      memo: "제주 프라이빗 투어 2명",
      confidence: 0.86
    };

    // When: two booking leads are created back-to-back.
    const firstLead = createBookingLead(customer, reservation);
    const secondLead = createBookingLead(customer, reservation);

    // Then: the lead IDs are unique UUID-backed values, not millisecond timestamps.
    assert.match(firstLead.id, /^lead_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    assert.match(secondLead.id, /^lead_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    assert.notEqual(firstLead.id, secondLead.id);
    assert.equal(firstLead.productId, "jeju-private-tour");
  });
});
