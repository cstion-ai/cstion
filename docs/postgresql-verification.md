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

## Public evidence

The `v0.1.2` release commit `327a243b9ed0343aac43429693258d7747a63148`
passed the public main
[`PostgreSQL 16 integration` job](https://github.com/cstion-ai/cstion/actions/runs/30623841372/job/91134377310).
The tag-triggered
[`v0.1.2` release run](https://github.com/cstion-ai/cstion/actions/runs/30623954739)
then ran the suite again before creating the public release; every step in its
combined [verification job](https://github.com/cstion-ai/cstion/actions/runs/30623954739/job/91134739388)
passed. Both jobs initialized a disposable PostgreSQL 16 service, installed the
locked Node dependencies, and completed the scenarios above through the
production `pg` driver.

## Reproduce

Use a disposable PostgreSQL database containing no valuable data:

```bash
npm ci
DATABASE_URL=postgresql://travel_ai:local-only@127.0.0.1:5432/travel_ai_test npm run test:postgres
```

The tests create and remove randomly named schemas. They do not use customer messages or production credentials.

## Limits

This suite does not establish production readiness. It does not test backup and restore, migration rollback, recovery from identities already owned by different customers, sustained load, network interruption, or real CRM and Google Sheets adapters.
