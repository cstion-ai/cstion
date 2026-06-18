# Control Tower Tools

Use placeholders for local tools:

- `<WORKSPACE_ROOT>` - private workspace root.
- `<MEMORY_INDEX>` - optional local knowledge index.
- `<AGENT_CONFIG>` - private agent/router configuration file.
- `<APPROVAL_OWNER>` - human approver for external actions.

Safe routine checks:

- prompt drift across agent `AGENTS.md` files
- broken relative links
- stale TODO/backlog references
- ignored-file coverage for secrets, memory, logs, sessions, and media

Do not publish exact local paths, usernames, tokens, account IDs, phone numbers, or authenticated browser details.
