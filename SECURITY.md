# Security Policy

## Supported versions

This project is pre-1.0 and has no supported release line. Security fixes target the current `main` branch; older commits and forks are not supported.

## Report a vulnerability

Do not open a public issue, discussion, or pull request for a suspected vulnerability.

Email the primary maintainer at [cstion1@gmail.com](mailto:cstion1@gmail.com) with the subject `[SECURITY] cstion vulnerability`. Do not send production credentials, access tokens, customer data, or unredacted logs. Include:

- the affected commit;
- impact, prerequisites, and a realistic attack path;
- minimal reproduction steps using synthetic or redacted data;
- a suggested fix, if known.

Response targets are an acknowledgement within 5 business days and an initial triage update within 10 business days. These are not guaranteed deadlines; complex reports or upstream dependencies may take longer. Before public disclosure, contact the maintainer to coordinate timing based on impact, fix availability, and upstream dependencies.

## Scope and research boundaries

Project source code and maintained configuration are in scope. Third-party services and customer deployments are outside the project's control; report an issue here only when it is caused by this project's integration code.

The project's trust boundaries, deployment gates, known gaps, and security controls are documented in the [threat model](docs/threat-model.md).

When validating a report:

- use only accounts, systems, and data you own or have explicit permission to test;
- do not access, retain, or alter another person's data;
- avoid service disruption, social engineering, and persistence;
- stop if you encounter customer data or credentials, and report their presence without copying them.

This policy does not authorize testing against third-party systems and cannot bind third parties.
