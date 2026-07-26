# Maintainer Guide

## Weekly maintenance

1. Triage new issues and apply the `bug`, `enhancement`, or `question` label after confirming the report type.
2. Redirect suspected vulnerabilities to the private process in [SECURITY.md](../SECURITY.md); never copy confidential details into a public issue.
3. Review dependency update pull requests and upstream release notes.
4. Check CI, CodeQL, dependency review, and open security advisories.
5. Close duplicates with a link to the canonical issue.

## Pull request review

Review in this order:

1. user-visible behavior and scope;
2. privacy, authentication, idempotency, and migration impact;
3. regression tests that reproduce the problem and cover the changed behavior;
4. implementation and strict types;
5. documentation and rollback impact;
6. recorded results from the required checks.

Automated review findings are advisory. Reproduce a finding before acting on it, and reject claims without a realistic impact path.

## Release readiness

The project publishes reviewed GitHub releases from `main`. Before proposing a release:

1. Update the package version and `CHANGELOG.md` in a reviewed pull request.
2. Confirm the release commit is on `main`, its applicable GitHub Actions checks passed, and the worktree used for verification is clean.
3. Run the repository checks:

   ```bash
   npm ci
   npm run check:all
   cmp src/repositories/migrations/001_harden_existing_schema.sql dist/src/repositories/migrations/001_harden_existing_schema.sql
   ```

4. Review `CHANGELOG.md`; remove unsupported claims and distinguish unit-tested behavior from live integration or production validation.
5. Prepare release notes that cover relevant migrations, security changes, known limitations, and rollback considerations.
6. Create the release only after required checks pass on the merged commit, and verify that its tag resolves to that commit.

Do not claim production readiness while the runtime blocks production startup for incomplete external adapters.

## Security response

Follow [SECURITY.md](../SECURITY.md). Keep validation and fix work private until disclosure is coordinated. Use synthetic or redacted data, record the affected commit and realistic attack path, add a regression test for the fix, and agree on disclosure timing with the reporter.

## Evidence rules

- Do not claim a check passed unless its result was recorded.
- Support public maintenance and release claims with links to commits, issues, pull requests, CI runs, releases, or published security notices.
- Distinguish implemented or unit-tested behavior from live integration, deployment, adoption, and production validation.
- Do not manufacture activity, create placeholder issues, or describe prospective users as adopters.
