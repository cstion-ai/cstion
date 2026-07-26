# CRM module

The CRM service turns reservation drafts into customer upsert requests. Customer matching and persistence are provided through the repository boundary.

## Implemented

- [`customer-service.ts`](../src/crm/customer-service.ts) builds channel, phone, and email identities. Email values are lowercased before the upsert.
- [`CustomerRepository`](../src/repositories/interfaces.ts) has both an [in-memory implementation](../src/repositories/fakes.ts) and a [PostgreSQL implementation](../src/repositories/postgres-customer-repository.ts).
- The PostgreSQL repository sorts identity keys, acquires transaction-scoped advisory locks, and rejects an upsert when the supplied identities already belong to multiple customers.
- The [PostgreSQL integration suite](../test/postgres-live.integration.ts) runs concurrent same-identity upserts through the production database driver and checks that they converge on one customer.
- The [runtime](../src/server/runtime.ts) uses fake external adapters and refuses to start in production.

## Planned, not implemented

- [`CrmAdapter`](../src/adapters/interfaces.ts) has no provider implementation. [`FakeCrmAdapter`](../src/adapters/fakes.ts) only records calls in memory.
- Recovery of a legacy database with identities already split across multiple owners is not automated against PostgreSQL.
- A production adapter still needs bounded requests and retries, cancellation, typed failure classification, downstream idempotency, privacy documentation, and non-production provider tests. See the [production adapter gate](../docs/roadmap.md#production-adapter-gate).
