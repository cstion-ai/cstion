# Reservation extraction evaluation

This directory contains the versioned, offline baseline for the deterministic
Kakao reservation parser. It is an evaluation artifact, not production data and
not evidence of model quality or third-party adoption.

For an install-free single-message check, use the public
[browser sandbox](https://cstion-ai.github.io/cstion/#sandbox). It reuses the
same deterministic parser and booking-field decision, runs without a network
request, and returns an input-free JSON result. It is not the ten-case baseline,
a PostgreSQL test, or a live CRM integration.

## Run the baseline

```bash
npm ci
npm run --silent evaluate:parser
```

The command validates the dataset and extractor output, prints a JSON report,
and exits nonzero when a case fails. After `npm run build`, the copied artifact
can also be checked with:

```bash
npm run --silent evaluate:parser:prod
```

Pass a different dataset as the only argument to evaluate a compatible local
fixture:

```bash
npm run --silent evaluate:parser -- ./path/to/synthetic-cases.json
```

## Run the frozen challenge

```bash
npm run --silent evaluate:challenge
```

This evaluates `reservation-challenge.v2.json` through the production
deterministic parser and the production missing-field/calendar decision, then
compares the result with `baselines/deterministic-parser.v2.json`. The command
exits `0` when the exact dataset and evaluator identities match and there is no
new regression, `1` for a regression, and `2` for invalid or unreadable input.
After a build, run the copied artifacts with:

```bash
npm run --silent evaluate:challenge:prod
```

The frozen 48-case result has 30/48 whole cases exact, 167/192 fields exact,
31/48 routes correct, and 18 published known-failure cases. Those counts expose
the current rule-based parser's limits; the passing gate means only that the
known result did not regress. It does not mean that all challenge cases pass.

To evaluate another compatible fixture and baseline without changing the
published files:

```bash
npm run --silent evaluate:challenge -- ./challenge.json ./baseline.json
```

## Dataset boundary

Both checked-in datasets are hand-authored and contain no customer records,
contact details, copied conversations, credentials, or access tokens. Their
schemas:

- accepts only datasets declared as synthetic and free of personal data;
- rejects phone and email fields, unknown keys, duplicate case IDs, and
  contradictory expected missing-field labels;
- limits each message to 4,000 characters, each dataset to 10,000 cases, and
  each input file to 1 MiB; and
- records creation date, language coverage, domain, and provenance.

Do not add real customer messages. A future de-identified dataset requires a
separate privacy review and schema change; changing the label alone is not
sufficient.

## Reported measures

- exact match for destination, start date, travelers, and product name;
- per-field and whole-case accuracy;
- required-field false positives;
- abstentions and whether they match the expected missing field;
- confirmation-routing agreement;
- invalid extractor outputs and extractor errors.

The v2 challenge additionally reports explicit numerators and denominators,
Wilson 95% intervals, abstention precision/recall, a route confusion matrix,
confirmation-field-set agreement, category summaries, the exact dataset SHA-256,
and a failure list containing case IDs and reason codes only. Raw messages and
provider identifiers are not included in the report.

The ten-case v1 set is a smoke-test baseline for supported Korean patterns. Its
perfect score means only that the current deterministic parser reproduces these
checked-in cases. It is too small and narrow to establish general accuracy.

The 48-case v2 challenge is broader but remains maintainer-authored, synthetic,
Korean-domain data. It is not an independent holdout, a representative sample,
a multilingual result, a model comparison, or evidence of deployment or
adoption. Its labels and baseline change only through reviewed repository
history; improving production behavior should reduce a documented failure, not
silently rewrite the expected result.

Any future model candidate must run through the same typed, offline interface.
Provider retention, training use, logging, data residency, deletion controls,
latency, cost, and broader multilingual coverage remain separate exit
requirements in the [roadmap](../docs/roadmap.md).
