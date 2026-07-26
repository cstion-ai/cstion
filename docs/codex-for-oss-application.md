# Codex for Open Source Application

This draft targets the **Codex for Open Source** maintainer program. Its public form prioritizes active projects with meaningful usage, broad adoption, or clear ecosystem importance. This project does not yet show those signals.

## Verified public state

As of 2026-07-26:

- Pull request #4 is merged into public `main` at commit `02816097365bb57dd523e9400ee66dab5b1eade7`.
- Release `v0.1.0` is published and its tag resolves to the reviewed merge commit.
- CI and CodeQL pass on the merge commit. The CI run includes the real PostgreSQL 16 integration job.
- The three original Codex review threads and two later CodeQL threads are resolved.
- The repository has 0 stars, 0 forks, and no documented adopters or download data.
- The maintainer profile `cstion-ai` is public.

Refresh these facts immediately before using any draft answer.

## Submission gate

Do not submit until all checked facts are visible on the public repository:

- [x] The hardened pull request is merged into `main`.
- [x] `main` contains the Apache-2.0 license and community files.
- [x] CI and CodeQL pass on the public merge commit, and dependency review passed on the merged pull request.
- [x] The three original Codex review threads are resolved.
- [x] At least one tagged release exists.
- [x] A real PostgreSQL integration scenario is documented and passing.
- [ ] Any claimed adopter, pilot, star, fork, or usage number has public or permissioned evidence.
- [x] The applicant's GitHub profile is public.

No wording change can substitute for missing public usage or adoption evidence.

## Form fields

### Role

Primary maintainer

### Why does this repository qualify? — draft

Travel AI Automation Platform is an Apache-2.0 TypeScript and PostgreSQL project for authenticated, duplicate-safe handling of Kakao travel inquiries into CRM customers and booking leads. Its public `v0.1.0` baseline documents and tests privacy, recovery, migration, and concurrency controls against PostgreSQL 16. The project currently has no public adopters, stars, forks, or download data, so no adoption claim is made.

### How will you use API credits? — draft

Use credits for Codex-assisted PR review, issue triage, CI failure summaries, multilingual release notes, and security regression analysis. For core product work, evaluate reservation extraction on synthetic or de-identified fixtures and convert failures into deterministic tests. Real customer messages, credentials, and access tokens will not be sent to models. Results will be reported in public maintenance notes.

### Anything else we should know? — draft

Codex identified two P1 and one P2 issues in pull request #4: ephemeral webhook state, missing webhook authentication, and an identity race. Public commits `8642aa2` through `b41fb7b` address them with PostgreSQL-backed state, HMAC verification, transactional identity locking, migration and lease hardening, and HMAC-protected OAuth state cookies. All review threads are resolved, the pull request is merged, and the release commit passes CI, CodeQL, dependency review, and the PostgreSQL 16 integration suite.

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
- Reviewed merge commit: `https://github.com/cstion-ai/cstion/commit/02816097365bb57dd523e9400ee66dab5b1eade7`
- First release: `https://github.com/cstion-ai/cstion/releases/tag/v0.1.0`
- Main CI: `https://github.com/cstion-ai/cstion/actions/runs/30183068811`
- Main CodeQL: `https://github.com/cstion-ai/cstion/actions/runs/30183068816`
- PostgreSQL 16 integration job: `https://github.com/cstion-ai/cstion/actions/runs/30183068811/job/89742897735`
- Merged pull-request dependency review: `https://github.com/cstion-ai/cstion/actions/runs/30183026080`
- Public maintenance notes or adopter evidence: add when real

## Official program sources

- Codex for Open Source: `https://openai.com/form/codex-for-oss/`
- Codex Open Source Fund: `https://openai.com/form/codex-open-source-fund/`
