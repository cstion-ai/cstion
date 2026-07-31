import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function isMainModule(
  moduleUrl: string,
  entrypointPath: string | undefined = process.argv[1]
): boolean {
  if (!entrypointPath) return false;
  return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(entrypointPath);
}
