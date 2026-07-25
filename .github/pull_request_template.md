## Problem

<!-- Link the issue or reproduction evidence, then state the user or system impact. -->

## Change

<!-- Describe the smallest meaningful change and its important tradeoffs. -->

## Verification

<!-- Name tests added or changed. Record results; do not mark a command complete unless it ran. -->

- [ ] `npm ci`
- [ ] `npm run check:all`
- [ ] `cmp src/repositories/migrations/001_harden_existing_schema.sql dist/src/repositories/migrations/001_harden_existing_schema.sql`

Regression tests and command results:

## Safety and rollout

<!-- Provide evidence, or write "N/A" with a reason. -->

- [ ] This PR contains no real customer messages, credentials, tokens, phone numbers, email addresses, or unredacted logs.
- Privacy/security impact and tests (input validation, webhook authentication/body limits, PII redaction, identity ownership, fail-closed startup):
- Idempotency, retries, and external side effects (duplicate handling, lease fencing, downstream writes):
- Database changes (recorded migration, upgrade test, deployment note, rollback plan):
- Documentation updated:
