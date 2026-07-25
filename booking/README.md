# Booking leads

This module creates and stores booking leads from reservation drafts. It does not make reservations with a travel supplier.

## Implemented

- The [reservation service](../src/booking/reservation-service.ts) returns `needs_confirmation` when destination, start date, traveler count, or product name is missing, or when a supplied date is not a real calendar date.
- Created leads use `lead_<channel>_<providerEventId>` IDs, redact the source memo, and start in `lead` or `quoted` status according to extraction confidence.
- The [in-memory repository](../src/repositories/fakes.ts) and [PostgreSQL repository](../src/repositories/postgres-booking-repository.ts) keep the first lead for an ID. On a PostgreSQL conflict, the stored row is returned.
- The [Kakao pipeline](../src/pipelines/kakao-to-crm.ts) writes a lead only after the reservation service returns `created`.

These paths are covered by the [safety tests](../test/p0-safety.test.ts), [pipeline test](../test/pipeline.test.ts), [repository tests](../test/postgres-repositories.test.ts), and the [PostgreSQL integration suite](../test/postgres-live.integration.ts).

## Not implemented

- inventory, availability, pricing, or supplier/OTA integration;
- status transitions, confirmation, payment, cancellation, refund, or audit history.

The project [roadmap](../docs/roadmap.md) tracks the production adapter gate. It does not yet define a delivery gate for supplier booking or payment workflows.
