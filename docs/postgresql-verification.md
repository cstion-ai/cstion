# PostgreSQL Verification

The CI workflow includes a `PostgreSQL 16 integration` job backed by a disposable PostgreSQL service. It runs the same production database driver and SQL used by the application.

## Covered scenarios

[`test/postgres-live.integration.ts`](../test/postgres-live.integration.ts) creates an isolated schema for each scenario and verifies:

- a legacy nullable-provider schema upgrades through the recorded migration;
- duplicate identities owned by one customer are normalized before `provider` becomes `NOT NULL`;
- running the migration twice records one application;
- event lease columns exist after the upgrade;
- concurrent same-identity customer upserts converge on one customer;
- concurrent event delivery produces one active lease;
- failed events restart with a new lease;
- duplicate booking IDs produce one stored lead.

The CI job and its PostgreSQL image digest are defined in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Reproduce

Use a disposable PostgreSQL database containing no valuable data:

```bash
npm ci
DATABASE_URL=postgresql://travel_ai:local-only@127.0.0.1:5432/travel_ai_test npm run test:postgres
```

The tests create and remove randomly named schemas. They do not use customer messages or production credentials.

## Limits

This suite does not establish production readiness. It does not test backup and restore, migration rollback, recovery from identities already owned by different customers, sustained load, network interruption, or real CRM and Google Sheets adapters.
