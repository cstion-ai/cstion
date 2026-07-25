# Roadmap

Work advances through evidence gates, not promised dates or speculative version
numbers. A gate closes only when its evidence is linked from the public
repository.

## 0.1.0 — Public baseline release gate

Current state: not met. `origin/main` still contains the old landing page, the
service and community changes are unmerged, and no tag exists. The candidate
branch defines a PostgreSQL 16 integration job, but it is not public evidence
until the branch is pushed and the required check passes.

Required work:

- merge the service, Apache-2.0 license, community files, and workflows into
  `main`;
- pass CI, CodeQL, and dependency review;
- run migrations, duplicate delivery, identity races, and lease takeover
  against a disposable PostgreSQL instance through the production database
  driver;
- publish the `0.1.0` tag and release notes.

Exit evidence:

- the public `main` commit SHA contains the documented service and project
  files;
- links to green required checks are recorded for that SHA;
- one documented command runs the live PostgreSQL suite from a clean checkout
  with Node.js 22 and a disposable database, and the same command passes in CI;
- the public `0.1.0` tag resolves to that reviewed commit, and its release notes
  include the verification commands and known limitations.

## Production adapter gate

Current state: blocked. CRM and Google Sheets adapters are fakes; production
startup correctly fails closed. Adapter context carries an idempotency key and
retry policy, but not cancellation, and OAuth state is cookie-only.

Each adapter must qualify independently, but production remains closed until
both a real CRM adapter and a real Google Sheets adapter qualify.

Required work:

- propagate downstream idempotency keys and structured cancellation, bound each
  request and retry sequence, and classify failures by typed retry policy;
- record pending writes durably before dispatch, verify lease ownership, and
  make replay safe at the downstream API;
- replace cookie-only OAuth state with an atomic server-side TTL store;
- document the data flow, rollback procedure, credential handling, and privacy
  boundary.

Exit evidence:

- automated tests call each provider's real API in a non-production tenant and
  correlate the inbound event, persisted lead, CRM record, and Sheets row by
  idempotency key;
- duplicate delivery, transient retry, a stop after dispatch, and lease
  takeover each leave one logical CRM record and one Sheets row for that key;
- timeout, cancellation, rate-limit, and revoked-credential tests terminate
  within the documented bounds and return typed failures;
- OAuth state replay, expiry, and concurrent redemption tests pass against the
  server-side store;
- production startup remains closed unless both qualified adapters and their
  required safeguards are configured;
- the privacy and rollback runbook is published with the test evidence.

## Model privacy and usefulness evaluation gate

Current state: no runtime model path exists. This gate authorizes evaluation,
not a model feature or release.

Required work:

- define the decision criteria and deterministic baseline before adding a
  provider;
- build a versioned synthetic or documented de-identified multilingual
  evaluation set;
- evaluate through an offline typed interface with no production traffic;
- compare deterministic and model-assisted extraction on per-field exact
  match, required-field false positives, abstention, invalid output, p50/p95
  latency, and cost per evaluated item;
- assess provider retention, training use, logging, data residency, and
  deletion controls;
- keep uncertain required fields on the human-confirmation path.

Exit evidence:

- the dataset manifest records provenance, de-identification method, language
  and domain strata, sample counts, and privacy review; no raw customer
  conversation or identifier is present;
- a provider privacy record captures the evaluated settings and terms for
  training use, retention, logging, data residency, and deletion;
- a pinned command and configuration reproduce the published results, including
  sample sizes and uncertainty;
- typed validation and `needs_confirmation` fallback behavior have
  deterministic regression tests for accepted and rejected model outputs;
- a decision record documents no-go or the limits of a separately reviewed
  rollout. No runtime model path is enabled by this gate alone.

## Community evidence

Baseline as of 2026-07-26:

- tagged releases: 0;
- GitHub stars and forks: 0 and 0;
- verified external deployments or adopters: 0;

Future updates report observed values only. GitHub counts include a source and
measurement date. External pull-request counts exclude maintainer-authored
work. Issue response time is reported as a median with its measurement window
and sample size, not as an SLA. Deployments or adopters are counted only with
permission and verifiable evidence. Zeros remain visible; there are no adoption
targets.
