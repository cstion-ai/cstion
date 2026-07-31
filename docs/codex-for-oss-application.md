# Codex for Open Source Application

This draft targets the **Codex for Open Source** maintainer program. Its public
form considers usage, ecosystem importance, and evidence of active maintenance.
CSTION does not yet have meaningful usage or broad adoption. The application
therefore relies on verifiable active maintenance and clearly labeled ecosystem
context, not an adoption claim.

## Verified public state

Verified on 2026-08-01:

- Pull requests #4, #12, #20, #22, #23, and #25 are merged into public `main`;
  the `v0.1.3` release merge commit is
  `95616a4f63576ef1ef4958aafbe869632a6d98a1`.
- Releases `v0.1.0`, `v0.1.1`, `v0.1.2`, and `v0.1.3` are published; the
  annotated latest tag resolves to that exact merge commit.
- Main CI and CodeQL pass on the merge commit. CI enforces coverage thresholds,
  both synthetic evaluations, exact source/build report parity, and a real
  PostgreSQL 16 job.
- The `v0.1.3` tag-triggered release workflow succeeded after rechecking main
  ancestry, release metadata, the full quality gate, and PostgreSQL 16.
- The public install-free sandbox runs the real deterministic parser locally in
  the browser without an account, API key, server, or network request.
- Codex found a Windows line-ending risk on #25. It was reproduced, fixed with
  a regression test, resolved publicly, and cleanly re-reviewed on the final
  head; all #25 review threads are resolved.
- Private vulnerability reporting, Dependabot, and automated security updates
  are enabled; the alert API reports zero open alerts.
- At this snapshot, the repository has 0 stars, 0 forks, 0 watchers, one
  contributor, and no documented adopters or download data.
- The maintainer profile `cstion-ai` is public.
- Kakao reports 50 million KakaoTalk users. This is ecosystem context only; it
  is not evidence that Kakao or its users have adopted CSTION.

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
- [x] The `v0.1.3` tag-triggered release and PostgreSQL 16 gate pass publicly.
- [x] The frozen 48-case challenge, exact baseline identity, and source/build
  parity gate are merged and reproducible.
- [x] The install-free synthetic browser sandbox is deployed publicly.
- [x] Adoption, star, fork, and usage claims remain zero unless public or
  permissioned evidence exists.
- [x] The applicant's GitHub profile is public.
- [x] Draft form answers are within 500 characters (462, 470, and 370 at this
  snapshot).

No wording change can substitute for missing public usage or adoption evidence.

## Form fields

The drafts below reflect the published `v0.1.3` state. Refresh mutable counts,
links, and form limits immediately before submission.

### Role

Primary maintainer

### Why does this repository qualify? — draft

CSTION is an Apache-2.0 reference implementation for safer KakaoTalk travel-inquiry automation. It combines signed webhook ingestion, crash-safe idempotency, identity-conflict protection, a real PostgreSQL 16 concurrency suite, and an install-free synthetic sandbox. Public Codex review/fix history, four releases, CI/CodeQL, and a fail-closed production gate show active maintenance. KakaoTalk scale is ecosystem context only; CSTION has zero verified adopters.

### How will you use API credits? — draft

Over 90 days, credits would expand the 48-case synthetic Korean challenge to about 200 reviewed cases and compare the deterministic parser with up to two version-pinned model candidates behind the same Zod boundary. We will publish exact match, false positives, abstention, route accuracy, invalid output, cost, p50/p95 latency, failure cases, and regression fixtures. No customer messages, identifiers, credentials, tokens, or production traffic will be sent to models.

### Anything else we should know? — draft

Codex review/fix history is public and includes event-lease, webhook HMAC,
identity-locking, OAuth-state, and browser-race hardening. Main passes Node 22,
PostgreSQL 16, CodeQL, dependency review, and tag release gates. The 48-case
challenge publishes known failures instead of claiming perfect quality.
Production remains closed while CRM and Sheets adapters are fakes.

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

Over 90 days, credits would extend the 48-case challenge toward about 200
reviewed synthetic Korean cases and compare the deterministic parser with up to
two version-pinned model candidates behind the same Zod boundary. Published
reports would include exact match, false positives, abstention, route accuracy,
invalid output, cost, p50/p95 latency, failure cases, and regression fixtures.
No customer messages, identifiers, credentials, access tokens, production
traffic, or private application data would be sent to models.

## Personal fields still required

- First and last name
- Email associated with the ChatGPT account
- Public GitHub username
- OpenAI Organization ID
- Interest selection: API credits, Codex Security, or both

Do not store the OpenAI Organization ID, account email, or other private application data in this public repository.

## Public evidence

- Canonical evidence snapshot: `https://github.com/cstion-ai/cstion/blob/main/docs/public-evidence.md`
- Public repository: `https://github.com/cstion-ai/cstion`
- Public browser sandbox: `https://cstion-ai.github.io/cstion/#sandbox`
- Hardened pull request: `https://github.com/cstion-ai/cstion/pull/4`
- Maintenance pull request: `https://github.com/cstion-ai/cstion/pull/12`
- Fund-readiness pull request: `https://github.com/cstion-ai/cstion/pull/20`
- Browser-sandbox and release pull request: `https://github.com/cstion-ai/cstion/pull/22`
- Browser-race evidence pull request: `https://github.com/cstion-ai/cstion/pull/23`
- Frozen-challenge and v0.1.3 pull request: `https://github.com/cstion-ai/cstion/pull/25`
- Evaluation privacy decision: `https://github.com/cstion-ai/cstion/issues/24`
- `v0.1.3` release merge commit: `https://github.com/cstion-ai/cstion/commit/95616a4f63576ef1ef4958aafbe869632a6d98a1`
- First release: `https://github.com/cstion-ai/cstion/releases/tag/v0.1.0`
- Current release: `https://github.com/cstion-ai/cstion/releases/tag/v0.1.3`
- Main CI: `https://github.com/cstion-ai/cstion/actions/runs/30668586589`
- Main CodeQL: `https://github.com/cstion-ai/cstion/actions/runs/30668586661`
- PostgreSQL 16 integration job: `https://github.com/cstion-ai/cstion/actions/runs/30668586589/job/91281208082`
- Release workflow and PostgreSQL recheck: `https://github.com/cstion-ai/cstion/actions/runs/30668702897`
- Merged pull-request dependency review: `https://github.com/cstion-ai/cstion/actions/runs/30668331186/job/91280414382`
- Final Codex re-review: `https://github.com/cstion-ai/cstion/pull/25#issuecomment-5147836357`
- Kakao ecosystem source: `https://www.kakaocorp.com/page/detail/11725?lang=ENG`
- Public maintenance notes or adopter evidence: add when real

## Official program sources

- Codex for Open Source: `https://openai.com/form/codex-for-oss/`
- Codex for Open Source program details: `https://developers.openai.com/community/codex-for-oss`
- Codex Open Source Fund: `https://openai.com/form/codex-open-source-fund/`
