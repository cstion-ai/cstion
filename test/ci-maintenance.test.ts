import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const PROJECT_ROOT = new URL("..", import.meta.url);

test("Given the CodeQL workflow, when its actions are loaded, then initialization and analysis use the same pinned version", async () => {
  const workflow = await readFile(
    new URL(".github/workflows/codeql.yml", PROJECT_ROOT),
    "utf8"
  );

  const actions = [...workflow.matchAll(
    /^\s+uses: github\/codeql-action\/(?<action>init|analyze)@(?<sha>[a-f0-9]{40})(?:\s+#.*)?$/gm
  )];

  assert.deepEqual(actions.map((action) => action.groups?.["action"]), ["init", "analyze"]);
  assert.equal(actions[0]?.groups?.["sha"], actions[1]?.groups?.["sha"]);
});

test("Given Dependabot action updates, when CodeQL changes, then both steps belong to one update group", async () => {
  const configuration = await readFile(
    new URL(".github/dependabot.yml", PROJECT_ROOT),
    "utf8"
  );

  const actionsUpdate = /^  - package-ecosystem: github-actions\n(?<body>(?:(?: {4,}.*)?\n)*)/m
    .exec(configuration)?.groups?.["body"];
  assert.ok(actionsUpdate);
  const groups = /^    groups:\n(?<body>(?:(?: {6,}.*)?\n)*)/m
    .exec(actionsUpdate)?.groups?.["body"];
  assert.ok(groups, "CodeQL sub-actions must be updated together");
  assert.match(groups, /^      codeql:\n        patterns:\n          - "github\/codeql-action\/\*"$/m);
});
