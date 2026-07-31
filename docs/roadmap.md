# Roadmap

Work advances through evidence gates, not promised dates or speculative version
numbers. A gate closes only when its evidence is linked from the public
repository.

## 0.1.0 — Public baseline release gate

Current state: met on 2026-07-26.

Evidence:

- public `main` commit
  [`0281609`](https://github.com/cstion-ai/cstion/commit/02816097365bb57dd523e9400ee66dab5b1eade7)
  contains the service, Apache-2.0 license, community files, and workflows;
- [main CI](https://github.com/cstion-ai/cstion/actions/runs/30183068811)
  passed tests, type checks, build, metadata checks, dependency audit, and the
  PostgreSQL 16 integration suite;
- [CodeQL](https://github.com/cstion-ai/cstion/actions/runs/30183068816)
  passed on the merge commit, and
  [dependency review](https://github.com/cstion-ai/cstion/actions/runs/30183026080)
  passed on the merged pull request;
- the documented
  [PostgreSQL job](https://github.com/cstion-ai/cstion/actions/runs/30183068811/job/89742897735)
  exercised migrations, duplicate delivery, identity races, lease recovery,
  and booking idempotency through the production database driver;
- public release
  [`v0.1.0`](https://github.com/cstion-ai/cstion/releases/tag/v0.1.0)
  resolves to the reviewed merge commit and records verification commands and
  known limitations.

## 0.1.2 — Install-free evaluation and automated release gate

Current state: met on 2026-07-31.

Evidence:

- [pull request #22](https://github.com/cstion-ai/cstion/pull/22) added an
  install-free synthetic browser sandbox, browser/source parity checks, and the
  `v0.1.2` release preparation before merging as
  [`327a243`](https://github.com/cstion-ai/cstion/commit/327a243b9ed0343aac43429693258d7747a63148);
- [main CI](https://github.com/cstion-ai/cstion/actions/runs/30623841372),
  [PostgreSQL 16](https://github.com/cstion-ai/cstion/actions/runs/30623841372/job/91134377310),
  and [CodeQL](https://github.com/cstion-ai/cstion/actions/runs/30623841383)
  passed on that exact merge commit;
- the first live
  [release workflow](https://github.com/cstion-ai/cstion/actions/runs/30623954739)
  revalidated the complete gate and PostgreSQL 16 before publishing
  [`v0.1.2`](https://github.com/cstion-ai/cstion/releases/tag/v0.1.2);
- the [browser sandbox](https://cstion-ai.github.io/cstion/#sandbox) runs the real
  deterministic parser locally without an account, API key, server, or network
  request. It remains synthetic evaluation, not production connectivity.

The exact run and claim boundaries are collected in the
[public evidence snapshot](public-evidence.md).

## Production adapter gate

Current state: blocked. CRM and Google Sheets adapters are fakes; production
startup correctly fails closed. Adapter context carries an idempotency key and
retry policy, but not cancellation, and OAuth state uses a client-held HMAC
check rather than a server-side one-time record.

Each adapter must qualify independently, but production remains closed until
both a real CRM adapter and a real Google Sheets adapter qualify.

Required work:

- propagate downstream idempotency keys and structured cancellation, bound each
  request and retry sequence, and classify failures by typed retry policy;
- record pending writes durably before dispatch, verify lease ownership, and
  make replay safe at the downstream API;
- replace the client-held OAuth state check with an atomic server-side TTL
  store;
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

Current state: the deterministic offline baseline is implemented; no runtime
model path exists. This gate authorizes evaluation, not a model feature or
release.

Implemented starting point:

- `evaluation/reservation-cases.v1.json` contains ten hand-authored Korean
  smoke cases and a provenance manifest with no profile or contact fields;
- `evaluation/reservation-challenge.v2.json` adds 48 balanced synthetic cases
  across eight Korean-domain categories and publishes the deterministic
  parser's 18 known-failure cases instead of tuning the fixture to a perfect
  result;
- `npm run --silent evaluate:parser` validates the dataset and output schemas,
  then reports per-field exact match, false positives, abstentions,
  confirmation routing, invalid output, and extractor errors;
- `npm run --silent evaluate:challenge` binds the exact dataset SHA-256 and
  evaluator identity to a regression gate with Wilson intervals, route
  confusion, confirmation-set agreement, and category summaries;
- CI runs both commands, and the build contains the same versioned datasets and
  challenge baseline.

A perfect score on this small checked-in set is regression evidence only, not a
general accuracy, multilingual quality, or model-comparison claim.

Required work:

- expand the challenge toward about 200 reviewed synthetic cases before drawing
  comparative conclusions;
- document any de-identification process before admitting a non-synthetic
  fixture;
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

Baseline as of 2026-07-31:

- tagged releases: 3 (`v0.1.0`, `v0.1.1`, and `v0.1.2`);
- GitHub stars and forks: 0 and 0;
- verified external deployments or adopters: 0;

Future updates report observed values only. GitHub counts include a source and
measurement date. External pull-request counts exclude maintainer-authored
work. Issue response time is reported as a median with its measurement window
and sample size, not as an SLA. Deployments or adopters are counted only with
permission and verifiable evidence. Zeros remain visible; there are no adoption
targets.
