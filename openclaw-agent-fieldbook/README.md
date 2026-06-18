# OpenClaw Agent Fieldbook

Public-safe agent workspace templates for a small-business multi-agent setup.

This repository is a sanitized fieldbook extracted from a private OpenClaw installation. It keeps the reusable operating patterns and removes private runtime state, credentials, customer/staff data, local paths, browser profiles, media, databases, and live publishing details.

## Contents

- `agents/control-tower` - coordinator agent for routing, shared policy, memory hygiene, and cross-agent work.
- `agents/store-ops` - store operations agent for inventory, attendance, schedules, and day-to-day operational facts.
- `agents/marketing` - marketing agent for campaigns, content systems, SEO/channel work, and design direction.
- `agents/automation-dev` - development agent for scripts, integrations, dashboards, and publishing workflow tooling.
- `agents/tax-ops` - tax operations agent for bookkeeping support, VAT/expense review, and accountant handoff.
- `agents/labor-ops` - labor operations agent for attendance exceptions, payroll-prep checklists, and workforce issue intake.
- `agents/cardnews` - card-news content agent for structured carousel packages.
- `references` - shared quality, upgrade, and professional handoff protocols.

## What Was Excluded

The private installation contains many files that should not be published:

- credentials, OAuth tokens, Telegram bindings, API keys, and device auth
- SQLite databases, WAL/SHM files, browser profiles, logs, memory journals, and session transcripts
- media inputs/outputs, generated drafts, exported customer or staff artifacts
- exact local machine paths and personal account names
- live posting, live spreadsheet, or authenticated browser-session details

Use this repository as a template. Replace placeholders such as `<BUSINESS_NAME>`, `<WORKSPACE_ROOT>`, `<PUBLIC_CHANNEL>`, and `<APPROVAL_OWNER>` before adopting it in another environment.

## Safety Defaults

- External publishing, sending, filing, deleting, credential changes, and production writes require explicit approval.
- Legal, tax, labor, payroll, and inventory answers must separate verified facts from assumptions.
- High-risk work should end in a handoff packet rather than a confident final answer.
- Code or automation changes are not complete until a relevant check, test, or smoke run has been performed.

## Suggested Layout

```text
workspace/
  AGENTS.md
  SOUL.md
  TOOLS.md
  references/
  agents/
    control-tower/
    store-ops/
    marketing/
    automation-dev/
    tax-ops/
    labor-ops/
    cardnews/
```

## License

No license is granted by default. Add a license only after confirming how you want these templates reused.
