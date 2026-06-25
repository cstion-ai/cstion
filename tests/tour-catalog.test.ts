import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addTourProduct,
  findTourProduct,
  removeTourProduct,
  type TourProduct
} from "../src/catalog/tour-catalog.js";
import { parseKakaoReservation } from "../src/kakao/reservation-parser.js";

describe("tour catalog", () => {
  it("finds products by configured product aliases", () => {
    const product = findTourProduct("2026.12.05 danang resort 3 pax");

    assert.equal(product?.productId, "danang-resort-product");
    assert.equal(product?.destination, "다낭");
  });

  it("adds custom products and routes parser output through the custom catalog", () => {
    const customProduct: TourProduct = {
      productId: "taipei-food-walk",
      productName: "타이베이 미식 워크",
      destination: "타이베이",
      aliases: ["타이베이", "taipei food walk"],
      sampleMessage: "2026년 9월 9일 타이베이 미식 워크 2명"
    };
    const catalog = addTourProduct(customProduct, []);
    const reservation = parseKakaoReservation(
      {
        userId: "taipei-user",
        text: "2026년 9월 9일 taipei food walk 2 pax",
        receivedAt: "2026-06-25T01:00:00.000Z"
      },
      catalog
    );

    assert.equal(reservation.productId, "taipei-food-walk");
    assert.equal(reservation.productName, "타이베이 미식 워크");
    assert.equal(reservation.destination, "타이베이");
  });

  it("removes products so parser output no longer uses deleted catalog entries", () => {
    const catalog = removeTourProduct("danang-resort-product");
    const product = findTourProduct("2026.12.05 danang resort 3 pax", catalog);

    assert.equal(product, undefined);
  });
});
