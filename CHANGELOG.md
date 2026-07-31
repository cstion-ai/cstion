# Changelog

Notable changes are recorded in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Added a versioned, offline reservation-parser evaluation with ten synthetic
  Korean cases, strict privacy and output schemas, machine-readable metrics,
  source/build parity, and a CI gate.
- Added a tag-triggered release workflow that verifies main-branch ancestry,
  package and changelog version alignment, and the complete quality gate before
  creating a GitHub release.

### Changed

- Hardened provider identifiers, Kakao token responses, configuration URLs,
  deterministic PostgreSQL lock ordering, executable entrypoint detection, and
  PII redaction edge cases.

## [0.1.1] - 2026-07-27

### Changed

- Upgraded Zod to 4.4.3, TypeScript to 7.0.2, tsx to 4.23.1, and aligned Node.js types with the supported Node.js 22 runtime.
- Updated the commit-pinned checkout and Node.js setup actions to their current major releases.
- Configuration tests now assert structured Zod issue data instead of unstable human-readable validation messages.

### Security

- CI now rejects unit and repository test runs below 90% line, 80% branch, or 85% function coverage.

## [0.1.0] - 2026-07-26

### Added

- Apache-2.0 licensing, contribution and security policies, governance and support documents, and issue and pull request templates.
- A transactional PostgreSQL migration runner, recorded schema migration, Compose migration service, and build verification for migration assets.
- A PostgreSQL 16 CI integration suite for legacy-schema upgrades, concurrent identity upserts, event retry fencing, and booking idempotency.
- CodeQL, dependency review, Dependabot, high-severity dependency auditing, and commit-pinned GitHub Actions.

### Changed

- Failed or expired event processing can restart with a new lease token; completion and failure updates require the active token and record a typed failure classification.
- Booking inserts are idempotent by booking ID, and customer upserts reject identity sets owned by multiple customers.
- Production startup fails while only fake CRM and Google Sheets adapters are available, and production configuration requires HTTPS CRM and Kakao redirect URLs.
- Development servers bind to loopback by default, container deployments opt in to an external bind address, and configuration rejects ports outside the TCP range.
- Kakao token exchange requests have a five-second timeout and typed provider, response, network, and timeout failures.
- TypeScript checks cover source and tests with stricter compiler options.

### Security

- Kakao webhook requests without a configured signing secret fail closed outside development; missing or invalid signatures are rejected before payload processing.
- Kakao OAuth stores a domain-separated HMAC check instead of raw state in its HttpOnly, SameSite cookie, validates callbacks with a timing-safe comparison, uses no-store responses, and clears the cookie after callback.
- Kakao login no longer requests additional profile, email, or phone scopes before those features exist.
- PostgreSQL constraints restrict event statuses, failure classifications, and attempt counts; the migration aborts on cross-customer identity conflicts.
- Error logging redacts sensitive values in error messages.
- Malformed HTTP request targets return a client error instead of terminating the server process.
- Checkout credentials are not persisted in CI, CodeQL, or dependency-review jobs.

[Unreleased]: https://github.com/cstion-ai/cstion/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/cstion-ai/cstion/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/cstion-ai/cstion/releases/tag/v0.1.0
