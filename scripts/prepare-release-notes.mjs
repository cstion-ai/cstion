import { readFile, writeFile } from "node:fs/promises";

const [tag, outputPath] = process.argv.slice(2);

try {
  if (!tag || !outputPath) {
    throw new Error("Usage: prepare-release-notes <version-tag> <output-path>");
  }
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
    throw new Error("Release tag must use the v<major>.<minor>.<patch> format");
  }

  const packageMetadata = JSON.parse(await readFile("package.json", "utf8"));
  const version = packageMetadata.version;
  if (typeof version !== "string" || tag !== `v${version}`) {
    throw new Error(`Release tag ${tag} does not match package version`);
  }

  const changelog = await readFile("CHANGELOG.md", "utf8");
  const lines = changelog.split(/\r?\n/);
  const heading = `## [${version}] - `;
  const start = lines.findIndex((line) => line.startsWith(heading));
  if (start < 0) {
    throw new Error(`CHANGELOG.md has no dated section for ${version}`);
  }
  const nextSection = lines.findIndex(
    (line, index) => index > start && line.startsWith("## [")
  );
  const notes = lines
    .slice(start + 1, nextSection < 0 ? undefined : nextSection)
    .join("\n")
    .trim();
  if (!notes) throw new Error(`CHANGELOG.md section for ${version} is empty`);

  await writeFile(outputPath, `${notes}\n`, "utf8");
} catch (error) {
  const message = error instanceof Error ? error.message : "Release metadata failed";
  console.error(message);
  process.exitCode = 1;
}
