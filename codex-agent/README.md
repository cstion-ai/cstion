# Codex maintainer workflows

Codex is used for code review and repository maintenance. Its output is
advisory: maintainers reproduce findings and remain responsible for merge,
release, and disclosure decisions.

If API credits become available, planned uses include:

- CI failure summaries and issue triage;
- multilingual release-note drafts;
- security regression analysis;
- evaluation of optional model-assisted reservation extraction on synthetic or
  documented de-identified fixtures.

No runtime model path exists today.

## Privacy and review

- Do not send real customer messages, credentials, access tokens, or private
  application data to models.
- Reproduce findings and run the relevant tests before accepting changes.
- Require human review for merge, release, and coordinated disclosure.
- Report observed evidence; do not claim adoption, production validation, or
  passed checks without records.

See the [repository instructions](../AGENTS.md),
[maintainer guide](../docs/maintainer-guide.md),
[roadmap](../docs/roadmap.md), and
[Codex application draft](../docs/codex-for-oss-application.md).
