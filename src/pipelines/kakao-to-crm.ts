import { createBookingLead } from "../booking/reservation-service.js";
import { DEFAULT_TOUR_PRODUCTS, getPrimaryTourProduct, type TourProduct } from "../catalog/tour-catalog.js";
import { createCustomerFromReservation, InMemoryCustomerRepository } from "../crm/customer-service.js";
import { parseKakaoReservation, type KakaoMessage } from "../kakao/reservation-parser.js";

export async function handleKakaoMessage(
  message: KakaoMessage,
  products: readonly TourProduct[] = DEFAULT_TOUR_PRODUCTS
) {
  const reservation = parseKakaoReservation(message, products);
  const repository = new InMemoryCustomerRepository();
  const customer = await createCustomerFromReservation(reservation, repository);
  const booking = createBookingLead(customer, reservation);

  return { reservation, customer, booking };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const demoProduct = getPrimaryTourProduct();
  const result = await handleKakaoMessage({
    userId: "catalog-test-user",
    text: demoProduct.sampleMessage,
    receivedAt: "2026-06-25T01:00:00.000Z",
    profile: { nickname: "이수진" }
  });

  console.log(JSON.stringify(result, null, 2));
}
