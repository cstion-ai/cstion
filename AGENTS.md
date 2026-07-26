# Repository Instructions

## Purpose

This repository is a privacy-aware TypeScript and PostgreSQL reference platform for turning Kakao travel inquiries into CRM customers and booking leads.

## Required checks

Run from the repository root before reporting completion:

```bash
npm ci
npm test
npm run typecheck
npm run build
npm audit --audit-level=high
cmp src/repositories/migrations/001_harden_existing_schema.sql dist/src/repositories/migrations/001_harden_existing_schema.sql
```

## Safety rules

- Never add real customer messages, credentials, tokens, phone numbers, or email addresses to source, tests, issues, or logs.
- Validate external input at the HTTP, environment, OAuth response, and database row boundaries.
- Before changing observable behavior, add a regression test that fails without the change.
- Keep source and test files under 250 non-blank, non-comment lines.
- Do not weaken Kakao webhook authentication, body limits, PII redaction, customer identity ownership constraints, event idempotency, or lease-token fencing.
- Keep production startup fail-closed until real CRM and Google Sheets adapters have bounded timeouts, cancellation, typed retry classification, downstream idempotency, and integration tests.
- Database changes require a recorded migration, an upgrade test, a deployment note, and a rollback plan.

## Evidence

Do not report an AI-generated finding as a defect until it has been reproduced. Do not claim a check passed unless it was run.
