import { CrmAdapter, SheetsAdapter } from "../adapters/interfaces.js";
import { FakeCrmAdapter, FakeSheetsAdapter } from "../adapters/fakes.js";
import { decideBookingLead } from "../booking/reservation-service.js";
import { createCustomerFromReservation } from "../crm/customer-service.js";
import { KakaoMessage, parseKakaoReservation, toKakaoChannelMessage } from "../kakao/reservation-parser.js";
import { runWithRetry, RetryPolicy, defaultRetryPolicy } from "../platform/retry.js";
import { safeLogPayload } from "../platform/redaction.js";
import { FakeBookingRepository, FakeCustomerRepository, FakePostgresIdempotencyRepository } from "../repositories/fakes.js";
import { BookingRepository, CustomerRepository, IdempotencyRepository } from "../repositories/interfaces.js";

export type PipelineDependencies = {
  idempotencyRepository: IdempotencyRepository;
  customerRepository: CustomerRepository;
  bookingRepository: BookingRepository;
  crmAdapter: CrmAdapter;
  sheetsAdapter: SheetsAdapter;
  retryPolicy?: RetryPolicy;
};

export type PipelineResult =
  | { status: "duplicate"; idempotencyKey: string }
  | { status: "needs_confirmation"; idempotencyKey: string; missingFields: string[]; customerId: string }
  | { status: "created"; idempotencyKey: string; customerId: string; bookingId: string };

export function createKakaoPipeline(dependencies: PipelineDependencies) {
  return async function handleKakaoMessage(message: KakaoMessage): Promise<PipelineResult> {
    const channelMessage = toKakaoChannelMessage(message);
    const decision = await dependencies.idempotencyRepository.begin(channelMessage);
    if (decision.status === "duplicate") return { status: "duplicate", idempotencyKey: decision.key };

    const retryPolicy = dependencies.retryPolicy ?? defaultRetryPolicy;

    try {
      const reservation = parseKakaoReservation(channelMessage);
      const customer = await createCustomerFromReservation(reservation, dependencies.customerRepository);
      const bookingDecision = decideBookingLead(customer, reservation);
      const context = { idempotencyKey: decision.key, retryPolicy };

      await runWithRetry(() => dependencies.crmAdapter.syncCustomer(customer, context), retryPolicy);

      if (bookingDecision.status === "needs_confirmation") {
        await dependencies.idempotencyRepository.complete(decision.key);
        return { status: "needs_confirmation", idempotencyKey: decision.key, missingFields: bookingDecision.missingFields, customerId: customer.id };
      }

      const booking = await dependencies.bookingRepository.createLead(bookingDecision.booking);
      await runWithRetry(() => dependencies.sheetsAdapter.appendBookingLead(booking, context), retryPolicy);
      await dependencies.idempotencyRepository.complete(decision.key);
      return { status: "created", idempotencyKey: decision.key, customerId: customer.id, bookingId: booking.id };
    } catch (error) {
      await dependencies.idempotencyRepository.fail(decision.key, error instanceof Error ? error.message : "unknown");
      console.error(safeLogPayload({ event: "kakao_pipeline_failed", error }));
      throw error;
    }
  };
}

export function createInMemoryDemoPipeline() {
  return createKakaoPipeline({
    idempotencyRepository: new FakePostgresIdempotencyRepository(),
    customerRepository: new FakeCustomerRepository(),
    bookingRepository: new FakeBookingRepository(),
    crmAdapter: new FakeCrmAdapter(),
    sheetsAdapter: new FakeSheetsAdapter()
  });
}

export const handleKakaoMessage = createInMemoryDemoPipeline();

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await handleKakaoMessage({
    providerEventId: "demo-event-1",
    providerUserId: "demo-user",
    text: "홍길동입니다. 2026년 8월 12일 제주 패키지 여행 3명 예약 문의합니다.",
    receivedAt: new Date().toISOString(),
    profile: { nickname: "홍길동", phone: "+82-10-0000-0000" }
  });

  console.log(safeLogPayload(result));
}
