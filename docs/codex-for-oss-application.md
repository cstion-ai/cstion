# Codex for Open Source Application

This draft targets the **Codex for Open Source** maintainer program. Its public form prioritizes active projects with meaningful usage, broad adoption, or clear ecosystem importance. This project does not yet show those signals.

## Verified public state

Verified on 2026-07-31:

- Pull requests #4, #12, and #20 are merged into public `main`; the fund
  readiness merge commit is `bd5fe69674bf0ab0905c72ad7f1997359e848135`.
- Releases `v0.1.0` and `v0.1.1` are published; the latest tag resolves to
  `b280574d064f9702eef05798f7832998aaeec5f4`.
- CI and CodeQL pass on the fund-readiness merge commit. CI enforces coverage
  thresholds, the synthetic evaluation, and the real PostgreSQL 16 integration
  job.
- All five review threads from pull request #4 and the one review thread from
  pull request #12 are resolved; pull request #20 has no review threads.
- The tag-triggered release workflow is merged but has not yet run for a new
  release.
- Dependabot alerts and automated security updates are enabled; the alert API reports zero open alerts.
- At this snapshot, the repository has 0 stars, 0 forks, 0 watchers, one
  contributor, and no documented adopters or download data.
- The maintainer profile `cstion-ai` is public.

Refresh these facts immediately before using any draft answer.

## Submission gate

Do not submit until all checked facts are visible on the public repository:

- [x] The hardened pull request is merged into `main`.
- [x] `main` contains the Apache-2.0 license and community files.
- [x] CI and CodeQL pass on the public merge commit, and dependency review passed on the merged pull request.
- [x] All review threads on the hardened pull request are resolved.
- [x] At least one tagged release exists.
- [x] A real PostgreSQL integration scenario is documented and passing.
- [x] The versioned evaluation baseline and release workflow are merged into
  public `main`; main CI and CodeQL pass.
- [ ] Any claimed adopter, pilot, star, fork, or usage number has public or permissioned evidence.
- [x] The applicant's GitHub profile is public.

No wording change can substitute for missing public usage or adoption evidence.

## Form fields

### Role

Primary maintainer

### Why does this repository qualify? — draft

Travel AI Automation Platform is an Apache-2.0 TypeScript/PostgreSQL reference project for authenticated, duplicate-safe Kakao inquiry processing. Public main has two published releases, coverage-gated CI, CodeQL, and PostgreSQL 16 migration/concurrency tests. A versioned synthetic evaluation reports parser regressions without customer data. The project has no public adopters, stars, forks, or download data, so no adoption claim is made.

### How will you use API credits? — draft

Credits would fund a public, offline comparison of deterministic and optional model-assisted reservation extraction. We will expand the versioned synthetic set, measure per-field exact match, required-field false positives, abstention, invalid output, latency, and cost, and publish failures as regression tests and maintenance notes. Credits will also support PR review and CI triage. No customer messages, identifiers, credentials, or tokens will be sent to models.

### Anything else we should know? — draft

Codex review of PR #4 led to durable event leases, HMAC webhook verification, transactional identity locking, and protected OAuth state; all five threads are resolved. Public main passes Node 22 CI, PostgreSQL 16, and CodeQL. The offline evaluator accepts only synthetic, profile-free fixtures. The runtime still blocks production while CRM and Sheets adapters are fakes.

## Alternative current fit: Codex Open Source Fund

The separate Codex Open Source Fund form asks for a project description,
repository, collaborators, and proposed API-credit use. The Codex for Open
Source form separately emphasizes usage, adoption, ecosystem importance, and
active maintenance. Because this project lacks public adoption evidence, the
Fund form supports a more direct project-plan answer. Selection is not implied.

Do not use the Fund draft until the public repository contains the project described below.

### Project

Travel AI Automation Platform

### Brief description

An Apache-2.0 TypeScript and PostgreSQL project that turns Kakao travel inquiries into CRM customers and booking leads. It includes authenticated webhook ingestion, duplicate-event handling, customer identity ownership checks, PII-redacted errors, processing leases, and database migrations. Production startup remains blocked until real external adapters satisfy the documented failure-handling and privacy requirements.

### How would API credits be used?

Credits would extend the checked-in offline evaluator with a broader synthetic
set and optional model candidates behind the same typed output boundary.
Published reports would compare exact match, false positives, abstention,
invalid output, latency, and cost; failures would become deterministic tests.
Credits would also support PR review and CI triage. No customer messages,
identifiers, credentials, access tokens, or private application data would be
sent to models.

## Personal fields still required

- First and last name
- Email associated with the ChatGPT account
- Public GitHub username
- OpenAI Organization ID
- Interest selection: API credits, Codex Security, or both

Do not store the OpenAI Organization ID, account email, or other private application data in this public repository.

## Public evidence

- Public repository: `https://github.com/cstion-ai/cstion`
- Hardened pull request: `https://github.com/cstion-ai/cstion/pull/4`
- Maintenance pull request: `https://github.com/cstion-ai/cstion/pull/12`
- Fund-readiness pull request: `https://github.com/cstion-ai/cstion/pull/20`
- Fund-readiness merge commit: `https://github.com/cstion-ai/cstion/commit/bd5fe69674bf0ab0905c72ad7f1997359e848135`
- `v0.1.1` reviewed merge commit: `https://github.com/cstion-ai/cstion/commit/b280574d064f9702eef05798f7832998aaeec5f4`
- First release: `https://github.com/cstion-ai/cstion/releases/tag/v0.1.0`
- Current release: `https://github.com/cstion-ai/cstion/releases/tag/v0.1.1`
- Main CI: `https://github.com/cstion-ai/cstion/actions/runs/30592682870`
- Main CodeQL: `https://github.com/cstion-ai/cstion/actions/runs/30592682838`
- PostgreSQL 16 integration job: `https://github.com/cstion-ai/cstion/actions/runs/30592682870/job/91038185723`
- Merged pull-request dependency review: `https://github.com/cstion-ai/cstion/actions/runs/30592576122`
- Public maintenance notes or adopter evidence: add when real

## Official program sources

- Codex for Open Source: `https://openai.com/form/codex-for-oss/`
- Codex for Open Source program details: `https://developers.openai.com/community/codex-for-oss`
- Codex Open Source Fund: `https://openai.com/form/codex-open-source-fund/`
