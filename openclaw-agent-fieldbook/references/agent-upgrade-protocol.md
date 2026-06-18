# Agent Upgrade Protocol

Reusable upgrade standard for a multi-agent small-business workspace.

## 1. Role And Prompt Precision

- Each agent checks facts from its own source of truth first.
- High-impact answers must show input date, missing range, and review requirement.
- Repeated decisions should be captured in private memory or backlog files, not in public templates.
- External sending, posting, filing, deletion, and permission changes must separate draft, review, and approval.

## 2. Verification-Led Development

Development, automation, script, dashboard, and workflow work belongs to `automation-dev`.

- Ambiguous or large work needs a short plan and acceptance criteria.
- Clear bug fixes or workflow changes should run through edit, test, and verification.
- Completion should include one relevant check: test, build, lint, syntax check, JSON/CSV validation, screenshot, smoke run, or direct file inspection.
- Autonomous permissions should stay conservative. External deployment and destructive commands need explicit approval.

## 3. Cross-Agent Connection Rules

When one fact affects multiple domains, do not blur ownership:

- store facts, inventory, schedules, attendance records -> `store-ops`
- leave, attendance exceptions, payroll prep, workforce policy -> `labor-ops`
- sales, expenses, VAT, tax reports -> `tax-ops`
- legal disputes, contracts, high-risk interpretation -> legal counsel or legal agent
- campaigns, content, channel SEO, design direction -> `marketing`
- code, automation, internal tools, publishing pipeline -> `automation-dev`
- shared policy, routing, configuration -> `control-tower`

## Reporting

Final reports should name:

- changed behavior
- changed files if any
- evidence checked
- remaining blocker
- next owner if any
