# Codex for Open Source Application

This draft targets the **Codex for Open Source** maintainer program. Its public form prioritizes active projects with meaningful usage, broad adoption, or clear ecosystem importance. This project does not yet show those signals.

## Verified public state

As of 2026-07-26:

- `main` still contains the earlier restaurant landing page; pull request #4 is open and unmerged.
- The repository has 0 stars, 0 forks, no releases, and no documented adopters or download data.
- The three Codex review threads are outdated but unresolved. Their replies cite public commit `8642aa2`.

Refresh these facts immediately before using any draft answer.

## Submission gate

Do not submit until all checked facts are visible on the public repository:

- [ ] The hardened pull request is merged into `main`.
- [ ] `main` contains the Apache-2.0 license and community files.
- [ ] CI, CodeQL, and dependency review pass on the public commit.
- [ ] The three original Codex review threads are resolved.
- [ ] At least one tagged release exists.
- [ ] A real PostgreSQL integration scenario is documented and passing.
- [ ] Any claimed adopter, pilot, star, fork, or usage number has public or permissioned evidence.
- [ ] The applicant's GitHub profile is public.

No wording change can substitute for missing public usage or adoption evidence.

## Form fields

### Role

Primary maintainer

### Why does this repository qualify? — draft

Travel AI Automation Platform is an Apache-2.0 TypeScript and PostgreSQL project for authenticated, duplicate-safe handling of Kakao travel inquiries into CRM customers and booking leads. It documents and tests privacy, recovery, and migration controls. Hardening is still in progress; the project currently has no releases, public adopters, stars, forks, or download data.

### How will you use API credits? — draft

Use credits for Codex-assisted PR review, issue triage, CI failure summaries, multilingual release notes, and security regression analysis. For core product work, evaluate reservation extraction on synthetic or de-identified fixtures and convert failures into deterministic tests. Real customer messages, credentials, and access tokens will not be sent to models. Results will be reported in public maintenance notes.

### Anything else we should know? — draft

Codex identified two P1 and one P2 issues in pull request #4: ephemeral webhook state, missing webhook authentication, and an identity race. Public commit `8642aa2` addresses them with PostgreSQL-backed state, HMAC verification, and transactional identity locking. The threads remain unresolved, and further hardening must pass the submission gate above.

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

## Evidence links to add after publication

- Public repository: `https://github.com/cstion-ai/cstion`
- Hardened pull request: `https://github.com/cstion-ai/cstion/pull/4`
- First release: add after publication
- PostgreSQL integration workflow: add after publication
- Public maintenance notes or adopter evidence: add when real

## Official program sources

- Codex for Open Source: `https://openai.com/form/codex-for-oss/`
- Codex Open Source Fund: `https://openai.com/form/codex-open-source-fund/`
