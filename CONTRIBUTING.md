# Contributing

## Before you start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md) and [Security Policy](SECURITY.md).
- Discuss larger changes in an issue first, following the project’s [governance process](GOVERNANCE.md).
- Never include real customer messages, credentials, access tokens, phone numbers, or email addresses in an issue, fixture, log, or pull request.

## Development

Use Node.js 22. Install dependencies and run the repository checks with:

```bash
npm ci
npm run check:all
cmp src/repositories/migrations/001_harden_existing_schema.sql dist/src/repositories/migrations/001_harden_existing_schema.sql
```

- Add a failing test before changing behavior.
- Use strict TypeScript and validate external input with Zod at HTTP, environment, OAuth, and database boundaries.
- Keep source and test files below 250 non-blank, non-comment lines.
- Preserve Kakao webhook authentication and body limits, webhook idempotency and lease-token fencing, customer identity ownership and database constraints, PII redaction, and production fail-closed behavior.
- Do not enable production startup until real CRM and Google Sheets adapters have bounded timeouts, cancellation, retry classification, downstream idempotency, and integration tests.
- Database changes require a recorded migration, an upgrade test, deployment notes, and rollback consideration.

## Pull request evidence

Include:

1. the problem and user impact;
2. the chosen design and important tradeoffs;
3. tests added or changed;
4. commands run and their results;
5. migration, security, privacy, and rollback notes when relevant.

All CI checks must pass before merge.

## License

By submitting a contribution, you agree that it is licensed under the [Apache License 2.0](LICENSE).
