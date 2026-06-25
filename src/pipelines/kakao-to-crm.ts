import { createBookingLead } from "../booking/reservation-service.js";
import { createCustomerFromReservation, InMemoryCustomerRepository } from "../crm/customer-service.js";
import { parseKakaoReservation, type KakaoMessage } from "../kakao/reservation-parser.js";

export async function handleKakaoMessage(message: KakaoMessage) {
  const reservation = parseKakaoReservation(message);
  const repository = new InMemoryCustomerRepository();
  const customer = await createCustomerFromReservation(reservation, repository);
  const booking = createBookingLead(customer, reservation);

  return { reservation, customer, booking };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await handleKakaoMessage({
    userId: "yangzhou-test-user",
    text: "이수진입니다. 2026년 10월 3일 양저우투어 2명 상담 원합니다.",
    receivedAt: "2026-06-25T01:00:00.000Z",
    profile: { nickname: "이수진" }
  });

  console.log(JSON.stringify(result, null, 2));
}
