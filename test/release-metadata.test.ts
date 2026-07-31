import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const PREPARE_RELEASE_SCRIPT = join(
  PROJECT_ROOT,
  "scripts/prepare-release-notes.mjs"
);

test("Given the container build stage, when build assets are copied, then the frozen evaluation input is available", async () => {
  const dockerfile = await readFile(join(PROJECT_ROOT, "Dockerfile"), "utf8");

  assert.match(dockerfile, /^COPY evaluation \.\/evaluation$/m);
  assert.match(dockerfile, /^RUN npm run build$/m);
});

test("Given a cross-platform checkout, when evaluation JSON is materialized, then exact-byte identity keeps LF endings", async () => {
  const attributes = await readFile(join(PROJECT_ROOT, ".gitattributes"), "utf8");

  assert.match(attributes, /^evaluation\/\*\*\/\*\.json text eol=lf$/m);
});

test("Given a version tag matching package metadata, when release notes are prepared, then only that changelog section is written", async (context) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "cstion-release-"));
  context.after(() => rm(temporaryDirectory, { recursive: true, force: true }));
  const notesPath = join(temporaryDirectory, "release-notes.md");

  execFileSync(
    process.execPath,
    [PREPARE_RELEASE_SCRIPT, "v0.1.3", notesPath],
    { cwd: PROJECT_ROOT }
  );

  const notes = await readFile(notesPath, "utf8");
  assert.match(notes, /frozen synthetic challenge/);
  assert.match(notes, /clipboard completions/);
  assert.match(notes, /Roll back the application/);
  assert.doesNotMatch(notes, /browser-based synthetic reservation sandbox/);
  assert.doesNotMatch(notes, /Upgraded Zod/);
  assert.doesNotMatch(notes, /Apache-2\.0 licensing/);
});

test("Given a tag that differs from package metadata, when release notes are prepared, then publication is blocked", () => {
  const result = spawnSync(
    process.execPath,
    [PREPARE_RELEASE_SCRIPT, "v9.9.9", "release-notes.md"],
    { cwd: PROJECT_ROOT, encoding: "utf8" }
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not match package version/);
});
