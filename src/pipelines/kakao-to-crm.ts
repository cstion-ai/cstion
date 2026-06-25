import { createBookingLead } from "../booking/reservation-service.js";
import { createCustomerFromReservation, InMemoryCustomerRepository } from "../crm/customer-service.js";
import { KakaoMessage, parseKakaoReservation } from "../kakao/reservation-parser.js";

export async function handleKakaoMessage(message: KakaoMessage) {
  const reservation = parseKakaoReservation(message);
  const repository = new InMemoryCustomerRepository();
  const customer = await createCustomerFromReservation(reservation, repository);
  const booking = createBookingLead(customer, reservation);

  return { reservation, customer, booking };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await handleKakaoMessage({
    userId: "demo-user",
    text: "홍길동입니다. 2026년 8월 12일 제주 여행 3명 예약 문의합니다.",
    receivedAt: new Date().toISOString(),
    profile: { nickname: "홍길동", phone: "+82-10-0000-0000" }
  });

  console.log(JSON.stringify(result, null, 2));
}
