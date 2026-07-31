# Changelog

Notable changes are recorded in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.3] - 2026-08-01

### Added

- Added a frozen synthetic challenge with 48 Korean-domain cases across eight
  categories, balanced between expected creation and human-confirmation routes.
- Added a deterministic known-failure baseline so CI rejects challenge
  regressions while allowing measured improvements to known failures.
- Added field error denominators, abstention measures, route confusion,
  confirmation-field agreement, category results, and Wilson intervals to the
  challenge report.

### Fixed

- Prevent delayed clipboard completions from overwriting a newer browser
  sandbox status after the input or parsed result changes.
- Measure challenge routing through the production missing-field and calendar
  validation decision instead of treating parser issue equality as routing.

### Documentation

- Updated the project page and reviewer-facing evidence to the published
  `v0.1.2` release, exact main CI and CodeQL runs, release-workflow run, and
  real PostgreSQL 16 job.
- Added a canonical public evidence snapshot that separates reproducible
  maintenance evidence, KakaoTalk ecosystem context, and the current zero-adopter
  state.
- Added a focused ten-minute independent-evaluation invitation and enabled
  GitHub private vulnerability reporting with email as a fallback.

### Compatibility

- No runtime API or database schema change is included in 0.1.3. The new
  challenge command and report are additive evaluation surfaces.

### Rollback

- Roll back the application to the reviewed `v0.1.2` release if the additive
  evaluation assets or command cause a release-environment problem. No database
  rollback or data deletion is required because 0.1.3 adds no migration.

### Known limitations

- The challenge is maintainer-authored synthetic data, not an independent
  holdout, general accuracy estimate, multilingual result, or adoption signal.
- Real CRM and Google Sheets adapters remain fakes, so production startup
  remains blocked.

## [0.1.2] - 2026-07-31

### Added

- Added a browser-based synthetic reservation sandbox that runs the real
  deterministic parser without an account, API key, server, or network request
  and exposes only a safe, input-free result for copying or download.
- Added a public project page, social preview, crawler metadata, Node.js 22 dev
  container, repository-template path, and permissioned evaluation-report form
  so third parties can inspect and try the project with less setup.
- Added a versioned, offline reservation-parser evaluation with ten synthetic
  Korean cases, strict privacy and output schemas, machine-readable metrics,
  source/build parity, and a CI gate.
- Added a tag-triggered release workflow that verifies main-branch ancestry,
  package and changelog version alignment, and the complete quality gate before
  creating a GitHub release.

### Changed

- Coverage now includes unimported executable TypeScript entrypoints and keeps
  the 90% line, 80% branch, and 85% function thresholds.
- Hardened provider identifiers, Kakao token responses, PostgreSQL URLs,
  deterministic PostgreSQL lock ordering, executable entrypoint detection,
  reservation traveler parsing, and PII redaction edge cases.

### Compatibility

- Provider event and user identifiers must now contain 1–255 characters;
  non-PostgreSQL `DATABASE_URL` values, empty or non-positive Kakao token fields,
  and non-positive or non-integer traveler expressions are rejected earlier.
- The browser sandbox evaluates parser and confirmation-routing behavior only.
  It does not exercise PostgreSQL, Kakao, CRM, or Google Sheets connectivity.

### Known limitations

- The checked-in evaluation has ten synthetic Korean cases and cannot establish
  general accuracy. Real CRM and Google Sheets adapters remain fakes, so
  production startup remains blocked.
- No database schema migration is included in 0.1.2. If the stricter application
  boundaries are incompatible with a development client, roll the application
  back to v0.1.1 using the normal deployment rollback process.

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

[Unreleased]: https://github.com/cstion-ai/cstion/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/cstion-ai/cstion/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/cstion-ai/cstion/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/cstion-ai/cstion/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/cstion-ai/cstion/releases/tag/v0.1.0
