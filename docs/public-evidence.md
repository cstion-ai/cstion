# Public Evidence Snapshot

Verified on 2026-08-08 against the public repository. This page separates
reproducible project evidence from ecosystem context and from adoption claims.

## Snapshot identity

- Public repository: [`cstion-ai/cstion`](https://github.com/cstion-ai/cstion)
- Security maintenance merge: [`ed5e0a9`](https://github.com/cstion-ai/cstion/commit/ed5e0a99f14a9d3930b8abee37af9f14f7d2cb86)
  from [pull request #28](https://github.com/cstion-ai/cstion/pull/28)
- `v0.1.3` release merge: [`95616a4`](https://github.com/cstion-ai/cstion/commit/95616a4f63576ef1ef4958aafbe869632a6d98a1)
  from [pull request #25](https://github.com/cstion-ai/cstion/pull/25)
- Current release: [`v0.1.3`](https://github.com/cstion-ai/cstion/releases/tag/v0.1.3),
  whose annotated tag resolves to
  `95616a4f63576ef1ef4958aafbe869632a6d98a1`
- Published releases: four (`v0.1.0`, `v0.1.1`, `v0.1.2`, and `v0.1.3`)

## Automated gates

- [Main CI](https://github.com/cstion-ai/cstion/actions/runs/31252509297)
  passed on the exact merge commit. Its
  [Node.js 22 job](https://github.com/cstion-ai/cstion/actions/runs/31252509297/job/93090926943)
  enforced tests, coverage, both deterministic evaluations, type checks,
  build, exact source/build report parity, metadata checks, and dependency
  audit.
- The separate
  [PostgreSQL 16 job](https://github.com/cstion-ai/cstion/actions/runs/31252509297/job/93090926926)
  passed against a disposable real database on the same commit.
- [CodeQL](https://github.com/cstion-ai/cstion/actions/runs/31252509310)
  passed on the same commit, and
  [dependency review](https://github.com/cstion-ai/cstion/actions/runs/31252257301/job/93090306622)
  passed on the final head of pull request #28.
- The
  [tag-triggered release run](https://github.com/cstion-ai/cstion/actions/runs/30668702897)
  rechecked main ancestry, tag/package/changelog alignment, the full quality
  gate, and PostgreSQL 16 before creating the GitHub release. Its combined
  [verification job](https://github.com/cstion-ai/cstion/actions/runs/30668702897/job/91281567187)
  passed every step.
- [GitHub Pages deployment](https://github.com/cstion-ai/cstion/actions/runs/31252508929)
  passed for the merge commit.

## Runnable evaluation evidence

- The [install-free browser sandbox](https://cstion-ai.github.io/cstion/#sandbox)
  runs the checked-in deterministic reservation parser without an account, API
  key, server, or network request. It accepts synthetic text only and emits a
  safe result that omits the input and internal identifiers.
- The checked-in v1 evaluation contains ten hand-authored synthetic Korean
  cases. CI validates its privacy schema, typed outputs, reported metrics, and
  source/build parity. A perfect result is regression evidence for those ten
  cases only; it is not a general accuracy claim.
- The frozen v2 challenge contains 48 maintainer-authored synthetic
  Korean-domain cases across eight balanced categories. The current
  deterministic baseline records 30/48 case exact, 167/192 field exact, 31/48
  route accuracy, 18 known-failure cases, and zero invalid outputs or extractor
  errors. `npm run --silent evaluate:challenge` reproduces the report and gate.
- The sandbox and evaluator do not test Kakao, CRM, Google Sheets, or production
  traffic. Real CRM and Sheets adapters remain fakes, and production startup
  remains fail-closed.

## PostgreSQL evidence

The real PostgreSQL 16 job exercises the recorded legacy-schema migration,
concurrent same-identity customer upserts, concurrent duplicate event delivery,
lease restart fencing, and booking idempotency through the production `pg`
driver. The scenarios and local reproduction command are documented in the
[PostgreSQL verification guide](postgresql-verification.md).

## Maintenance and security evidence

- Review history is public on pull requests
  [#4](https://github.com/cstion-ai/cstion/pull/4),
  [#12](https://github.com/cstion-ai/cstion/pull/12),
  [#20](https://github.com/cstion-ai/cstion/pull/20),
  [#22](https://github.com/cstion-ai/cstion/pull/22),
  [#23](https://github.com/cstion-ai/cstion/pull/23),
  [#25](https://github.com/cstion-ai/cstion/pull/25), and
  [#28](https://github.com/cstion-ai/cstion/pull/28). On #25, Codex identified
  a Windows line-ending risk; the maintainer reproduced it, added an LF policy
  and regression test, resolved the thread, and received a
  [clean re-review](https://github.com/cstion-ai/cstion/pull/25#issuecomment-5147836357)
  on the final head.
- On #28, a fresh audit reproduced
  [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895)
  after the original bot checks had passed. The lock was refreshed to the
  patched dependency, the Node minimum was aligned with `c8` 12, and Codex
  returned a [clean review](https://github.com/cstion-ai/cstion/pull/28#issuecomment-5225674656).
- Release notes preserve compatibility changes, known limitations, and rollback
  guidance. Releases are created only after the checked-in release gate passes.
- The evaluation privacy decision and alternatives are recorded in
  [issue #24](https://github.com/cstion-ai/cstion/issues/24). Private
  vulnerability reporting and automated security updates are enabled. The
  GitHub alert API reported zero open Dependabot and CodeQL alerts, while the
  latest main CI independently completed `npm audit --audit-level=high` with
  zero vulnerabilities.

## Ecosystem context is not adoption

[Kakao reports that KakaoTalk serves 50 million users](https://www.kakaocorp.com/page/detail/11725?lang=ENG).
That supports the inference that safe KakaoTalk automation is relevant to a
large ecosystem; it does **not** show that Kakao, its users, or any travel
business uses this project. CSTION is independent and is not affiliated with or
endorsed by Kakao.

At this snapshot, the repository has 0 stars, 0 forks, 0 watchers, one listed
contributor, and 0 verified third-party adopters. No download or deployment
count is claimed. The permission and evidence rules for any future report are
in [`ADOPTERS.md`](../ADOPTERS.md).

## Reproduce locally

```bash
npm ci
npm run check:all
```

For the real database suite, use a disposable PostgreSQL instance and follow
the [PostgreSQL verification guide](postgresql-verification.md). Never use real
customer messages, credentials, or production data for these checks.

Refresh every mutable count and run link immediately before reusing this
snapshot in an application.
