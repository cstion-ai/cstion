# Codex for Open Source Application

This draft targets the **Codex for Open Source** maintainer program. Its public
form considers usage, ecosystem importance, and evidence of active maintenance.
CSTION does not yet have meaningful usage or broad adoption. The application
therefore relies on verifiable active maintenance and clearly labeled ecosystem
context, not an adoption claim.

## Verified public state

Verified on 2026-07-31:

- Pull requests #4, #12, #20, and #22 are merged into public `main`; the
  `v0.1.2` release merge commit is
  `327a243b9ed0343aac43429693258d7747a63148`.
- Releases `v0.1.0`, `v0.1.1`, and `v0.1.2` are published; the annotated latest
  tag resolves to that exact merge commit.
- Main CI and CodeQL pass on the merge commit. CI enforces coverage thresholds,
  the synthetic evaluation, source/build parity, and a real PostgreSQL 16 job.
- The first live tag-triggered release workflow succeeded after rechecking main
  ancestry, release metadata, the full quality gate, and PostgreSQL 16.
- The public install-free sandbox runs the real deterministic parser locally in
  the browser without an account, API key, server, or network request.
- Earlier review findings are preserved on the public pull requests and tied to
  reproducing checks; unresolved-thread state must be refreshed before use.
- Dependabot alerts and automated security updates are enabled; the alert API reports zero open alerts.
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
- [x] The `v0.1.2` tag-triggered release and PostgreSQL 16 gate pass publicly.
- [x] The install-free synthetic browser sandbox is deployed publicly.
- [x] Adoption, star, fork, and usage claims remain zero unless public or
  permissioned evidence exists.
- [x] The applicant's GitHub profile is public.

No wording change can substitute for missing public usage or adoption evidence.

## Form fields

### Role

Primary maintainer

### Why does this repository qualify? — draft (495 characters)

CSTION is an Apache-2.0 safety reference for KakaoTalk travel automation. Kakao reports a 50M-user KakaoTalk ecosystem; that is context, not CSTION adoption. The project combines signed webhook ingestion, crash-safe idempotency, identity-conflict protection, real PostgreSQL 16 concurrency tests, and an install-free synthetic sandbox. I am the primary maintainer. Three releases, reviewed PRs, CI/CodeQL, and a fail-closed production gate show active maintenance. It has zero verified adopters.

### How will you use API credits? — draft (467 characters)

Credits would fund a public, offline comparison of deterministic and optional model-assisted reservation extraction. We will expand the versioned synthetic set, measure per-field exact match, required-field false positives, abstention, invalid output, latency, and cost, and publish failures as regression tests and maintenance notes. Credits will also support PR review and CI triage. No customer messages, identifiers, credentials, or tokens will be sent to models.

### Anything else we should know? — draft (359 characters)

Codex reviews found and helped close durable event-lease, HMAC webhook,
identity-locking, OAuth-state, and browser race issues. Public main passes Node
22 CI, PostgreSQL 16, CodeQL, and the tag-triggered release gate. The browser
sandbox and evaluator use synthetic, profile-free input only. Production
remains blocked while CRM and Sheets adapters are fakes.

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

- Canonical evidence snapshot: `https://github.com/cstion-ai/cstion/blob/main/docs/public-evidence.md`
- Public repository: `https://github.com/cstion-ai/cstion`
- Public browser sandbox: `https://cstion-ai.github.io/cstion/#sandbox`
- Hardened pull request: `https://github.com/cstion-ai/cstion/pull/4`
- Maintenance pull request: `https://github.com/cstion-ai/cstion/pull/12`
- Fund-readiness pull request: `https://github.com/cstion-ai/cstion/pull/20`
- Browser-sandbox and release pull request: `https://github.com/cstion-ai/cstion/pull/22`
- `v0.1.2` release merge commit: `https://github.com/cstion-ai/cstion/commit/327a243b9ed0343aac43429693258d7747a63148`
- First release: `https://github.com/cstion-ai/cstion/releases/tag/v0.1.0`
- Current release: `https://github.com/cstion-ai/cstion/releases/tag/v0.1.2`
- Main CI: `https://github.com/cstion-ai/cstion/actions/runs/30623841372`
- Main CodeQL: `https://github.com/cstion-ai/cstion/actions/runs/30623841383`
- PostgreSQL 16 integration job: `https://github.com/cstion-ai/cstion/actions/runs/30623841372/job/91134377310`
- Release workflow and PostgreSQL recheck: `https://github.com/cstion-ai/cstion/actions/runs/30623954739`
- Merged pull-request dependency review: `https://github.com/cstion-ai/cstion/actions/runs/30623762209`
- Kakao ecosystem source: `https://www.kakaocorp.com/page/detail/11725?lang=ENG`
- Public maintenance notes or adopter evidence: add when real

## Official program sources

- Codex for Open Source: `https://openai.com/form/codex-for-oss/`
- Codex for Open Source program details: `https://developers.openai.com/community/codex-for-oss`
- Codex Open Source Fund: `https://openai.com/form/codex-open-source-fund/`
