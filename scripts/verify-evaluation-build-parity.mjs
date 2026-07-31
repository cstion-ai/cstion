import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const evaluations = [
  ["deterministic parser", "evaluate:parser", "evaluate:parser:prod"],
  ["reservation challenge", "evaluate:challenge", "evaluate:challenge:prod"]
];

for (const [name, sourceScript, buildScript] of evaluations) {
  const source = run(sourceScript);
  const build = run(buildScript);
  if (source !== build) {
    process.stderr.write(`Evaluation source/build parity failed: ${name}.\n`);
    process.exitCode = 1;
    break;
  }
}

if (process.exitCode !== 1) {
  process.stdout.write("Evaluation source/build reports match.\n");
}

function run(script) {
  const result = spawnSync(
    npmCommand,
    ["run", "--silent", script],
    { encoding: "utf8", maxBuffer: 5 * 1024 * 1024 }
  );
  if (result.status !== 0) {
    process.stderr.write(`Evaluation parity command failed: ${script}.\n`);
    process.exit(1);
  }
  return result.stdout;
}
