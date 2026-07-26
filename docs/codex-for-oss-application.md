# Codex for Open Source Application

This draft targets the **Codex for Open Source** maintainer program. Its public form prioritizes active projects with meaningful usage, broad adoption, or clear ecosystem importance. This project does not yet show those signals.

## Verified public state

As of 2026-07-27:

- Pull requests #4 and #12 are merged into public `main`; the `v0.1.1` release merge commit is `b280574d064f9702eef05798f7832998aaeec5f4`.
- Releases `v0.1.0` and `v0.1.1` are published, and the latest tag resolves to that release merge commit.
- CI and CodeQL pass on the release merge commit. CI enforces coverage thresholds and includes the real PostgreSQL 16 integration job.
- All five review threads from pull request #4 are resolved, and pull request #12 has no review threads.
- Dependabot alerts and automated security updates are enabled; the alert API reports zero open alerts.
- The repository has 0 stars, 0 forks, and no documented adopters or download data.
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
- [ ] Any claimed adopter, pilot, star, fork, or usage number has public or permissioned evidence.
- [x] The applicant's GitHub profile is public.

No wording change can substitute for missing public usage or adoption evidence.

## Form fields

### Role

Primary maintainer

### Why does this repository qualify? — draft

Travel AI Automation Platform is an Apache-2.0 TypeScript/PostgreSQL project for authenticated, duplicate-safe Kakao travel inquiry processing. Its public `v0.1.1` release tests privacy, crash recovery, schema migration, and identity concurrency against PostgreSQL 16, with coverage gates, CodeQL, and dependency review. It has no public adopters, stars, forks, or download data, so no adoption claim is made.

### How will you use API credits? — draft

Use credits for Codex-assisted PR review, issue triage, CI failure summaries, multilingual release notes, and security regression analysis. For core product work, evaluate reservation extraction on synthetic or de-identified fixtures and convert failures into deterministic tests. Real customer messages, credentials, and access tokens will not be sent to models. Results will be reported in public maintenance notes.

### Anything else we should know? — draft

Codex review of PR #4 found ephemeral webhook state, missing webhook authentication, and an identity race. Public fixes added PostgreSQL-backed leases, HMAC verification, transactional identity locking, and protected OAuth state. PR #12 then upgraded the toolchain and enforced coverage thresholds. All review threads are resolved; the `v0.1.1` merge passes Node 22 CI, PostgreSQL 16, CodeQL, and dependency review.

## Better current fit: Codex Open Source Fund

Consider the separate Codex Open Source Fund first. Its public application accepts project proposals for using Codex CLI and OpenAI models and does not publish the usage or adoption criteria listed by Codex for Open Source. Because this project lacks public adoption evidence, the Fund may be the better current fit. Selection is not implied.

Do not use the Fund draft until the public repository contains the project described below.

### Project

Travel AI Automation Platform

### Brief description

An Apache-2.0 TypeScript and PostgreSQL project that turns Kakao travel inquiries into CRM customers and booking leads. It includes authenticated webhook ingestion, duplicate-event handling, customer identity ownership checks, PII-redacted errors, processing leases, and database migrations. Production startup remains blocked until real external adapters satisfy the documented failure-handling and privacy requirements.

### How would API credits be used?

Credits would support Codex-assisted maintenance, pull request review, issue triage, security regression analysis, multilingual documentation, and evaluation of optional model-assisted reservation extraction on synthetic or de-identified fixtures. Failures would be converted into deterministic tests and public maintenance notes. No real customer messages, credentials, access tokens, or private application data would be sent to models.

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
- `v0.1.1` reviewed merge commit: `https://github.com/cstion-ai/cstion/commit/b280574d064f9702eef05798f7832998aaeec5f4`
- First release: `https://github.com/cstion-ai/cstion/releases/tag/v0.1.0`
- Current release: `https://github.com/cstion-ai/cstion/releases/tag/v0.1.1`
- Main CI: `https://github.com/cstion-ai/cstion/actions/runs/30224005904`
- Main CodeQL: `https://github.com/cstion-ai/cstion/actions/runs/30224005903`
- PostgreSQL 16 integration job: `https://github.com/cstion-ai/cstion/actions/runs/30224005904/job/89851166795`
- Merged pull-request dependency review: `https://github.com/cstion-ai/cstion/actions/runs/30223952858`
- Public maintenance notes or adopter evidence: add when real

## Official program sources

- Codex for Open Source: `https://openai.com/form/codex-for-oss/`
- Codex Open Source Fund: `https://openai.com/form/codex-open-source-fund/`
