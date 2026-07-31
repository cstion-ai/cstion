import { FakeCrmAdapter, FakeSheetsAdapter } from "../adapters/fakes.js";
import type { CrmAdapter, SheetsAdapter } from "../adapters/interfaces.js";
import { decideBookingLead } from "../booking/reservation-service.js";
import { createCustomerFromReservation } from "../crm/customer-service.js";
import { parseKakaoReservation, toKakaoChannelMessage } from "../kakao/reservation-parser.js";
import type { KakaoMessage } from "../kakao/reservation-parser.js";
import { safeLogPayload } from "../platform/redaction.js";
import { ClassifiedError, defaultRetryPolicy, runWithRetry } from "../platform/retry.js";
import type { RetryPolicy } from "../platform/retry.js";
import { FakeBookingRepository, FakeCustomerRepository, FakePostgresIdempotencyRepository } from "../repositories/fakes.js";
import type { BookingRepository, CustomerRepository, IdempotencyRepository } from "../repositories/interfaces.js";
import { isMainModule } from "../shared/main-module.js";

export type PipelineDependencies = {
  readonly idempotencyRepository: IdempotencyRepository;
  readonly customerRepository: CustomerRepository;
  readonly bookingRepository: BookingRepository;
  readonly crmAdapter: CrmAdapter;
  readonly sheetsAdapter: SheetsAdapter;
  readonly retryPolicy?: RetryPolicy;
};

export type PipelineResult =
  | { readonly status: "duplicate"; readonly idempotencyKey: string }
  | {
      readonly status: "needs_confirmation";
      readonly idempotencyKey: string;
      readonly missingFields: string[];
      readonly customerId: string;
    }
  | {
      readonly status: "created";
      readonly idempotencyKey: string;
      readonly customerId: string;
      readonly bookingId: string;
    };

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
        await dependencies.idempotencyRepository.complete(decision.key, decision.leaseToken);
        return { status: "needs_confirmation", idempotencyKey: decision.key, missingFields: bookingDecision.missingFields, customerId: customer.id };
      }

      const booking = await dependencies.bookingRepository.createLead(bookingDecision.booking);
      await runWithRetry(() => dependencies.sheetsAdapter.appendBookingLead(booking, context), retryPolicy);
      await dependencies.idempotencyRepository.complete(decision.key, decision.leaseToken);
      return { status: "created", idempotencyKey: decision.key, customerId: customer.id, bookingId: booking.id };
    } catch (error) {
      const classification = error instanceof ClassifiedError
        ? error.classification
        : "permanent";
      await dependencies.idempotencyRepository.fail(
        decision.key,
        decision.leaseToken,
        classification
      );
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

if (isMainModule(import.meta.url)) {
  const result = await handleKakaoMessage({
    providerEventId: "demo-event-1",
    providerUserId: "demo-user",
    text: "홍길동입니다. 2026년 8월 12일 제주 패키지 여행 3명 예약 문의합니다.",
    receivedAt: new Date().toISOString(),
    profile: { nickname: "홍길동", phone: "+82-10-0000-0000" }
  });

  console.log(safeLogPayload(result));
}
