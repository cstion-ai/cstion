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

The compatibility maintenance commit
`138b7be138bbca67c90ba15781895ea0186cc7ad` passed the public
[`PostgreSQL 16 integration` job](https://github.com/cstion-ai/cstion/actions/runs/31281987301/job/93164701268)
on 2026-08-09 after the production `pg` driver and development toolchain were
refreshed. The same workflow also checked both the declared minimum Node.js
version and the current Node.js 22 release.

The security maintenance commit
`ed5e0a99f14a9d3930b8abee37af9f14f7d2cb86` passed the public
[`PostgreSQL 16 integration` job](https://github.com/cstion-ai/cstion/actions/runs/31252509297/job/93090926926)
on 2026-08-08 after a development-dependency security refresh.

The `v0.1.3` release commit `95616a4f63576ef1ef4958aafbe869632a6d98a1`
passed the public main
[`PostgreSQL 16 integration` job](https://github.com/cstion-ai/cstion/actions/runs/30668586589/job/91281208082).
The tag-triggered
[`v0.1.3` release run](https://github.com/cstion-ai/cstion/actions/runs/30668702897)
then ran the suite again before creating the public release; every step in its
combined [verification job](https://github.com/cstion-ai/cstion/actions/runs/30668702897/job/91281567187)
passed. Both jobs initialized a disposable PostgreSQL 16 service, installed the
locked Node dependencies, and completed the scenarios above through the
production `pg` driver.

The earlier `v0.1.2` evidence remains available in its
[main PostgreSQL job](https://github.com/cstion-ai/cstion/actions/runs/30623841372/job/91134377310)
and [first live release run](https://github.com/cstion-ai/cstion/actions/runs/30623954739).

## Reproduce

Use a disposable PostgreSQL database containing no valuable data:

```bash
npm ci
DATABASE_URL=postgresql://travel_ai:local-only@127.0.0.1:5432/travel_ai_test npm run test:postgres
```

The tests create and remove randomly named schemas. They do not use customer messages or production credentials.

## Limits

This suite does not establish production readiness. It does not test backup and restore, migration rollback, recovery from identities already owned by different customers, sustained load, network interruption, or real CRM and Google Sheets adapters.
