import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { startServer } from "../src/server.js";
import { loadConfig } from "../src/shared/config.js";

const DemoOutputSchema = z.object({
  status: z.literal("created"),
  idempotencyKey: z.literal("kakao:demo-event-1"),
  customerId: z.string().uuid(),
  bookingId: z.literal("lead_kakao_demo-event-1")
}).strict();

test("Given the public demo command, when it runs, then it returns a redacted created result", () => {
  const npmExecPath = process.env["npm_execpath"];
  assert.ok(npmExecPath);

  const output = execFileSync(
    process.execPath,
    [npmExecPath, "run", "--silent", "demo"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );
  const result = DemoOutputSchema.parse(JSON.parse(output));

  assert.equal(result.status, "created");
  assert.doesNotMatch(output, /(?:\+82|홍길동|phone)/i);
});

test("Given a project path with spaces, when the demo entrypoint runs, then it returns a result", async (context) => {
  const temporaryProject = await mkdtemp(join(tmpdir(), "cstion demo "));
  context.after(() => rm(temporaryProject, { recursive: true, force: true }));
  await cp(
    fileURLToPath(new URL("../src", import.meta.url)),
    join(temporaryProject, "src"),
    { recursive: true }
  );
  await cp(
    fileURLToPath(new URL("../package.json", import.meta.url)),
    join(temporaryProject, "package.json")
  );
  await symlink(
    fileURLToPath(new URL("../node_modules", import.meta.url)),
    join(temporaryProject, "node_modules"),
    "dir"
  );

  const output = execFileSync(
    process.execPath,
    [
      fileURLToPath(new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url)),
      join(temporaryProject, "src/pipelines/kakao-to-crm.ts")
    ],
    { encoding: "utf8" }
  );

  assert.equal(DemoOutputSchema.parse(JSON.parse(output)).status, "created");
});

test("Given a test configuration, when the server entrypoint starts, then health is reachable", async (context) => {
  const config = {
    ...loadConfig({ NODE_ENV: "test" }),
    port: 0
  };
  const server = await startServer(config);
  context.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const response = await fetch(`http://${address.address}:${address.port}/health`);

  assert.equal(response.status, 200);
});
