# Reservation extraction evaluation

This directory contains the versioned, offline baseline for the deterministic
Kakao reservation parser. It is an evaluation artifact, not production data and
not evidence of model quality or third-party adoption.

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

## Dataset boundary

`reservation-cases.v1.json` is hand-authored and contains no customer records,
contact details, copied conversations, credentials, or access tokens. The
schema:

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

The ten-case v1 set is a smoke-test baseline for supported Korean patterns. Its
perfect score means only that the current deterministic parser reproduces these
checked-in cases. It is too small and narrow to establish general accuracy.

Any future model candidate must run through the same typed, offline interface.
Provider retention, training use, logging, data residency, deletion controls,
latency, cost, and broader multilingual coverage remain separate exit
requirements in the [roadmap](../docs/roadmap.md).
