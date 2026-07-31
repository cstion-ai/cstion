import { cpSync } from "node:fs";

cpSync(
  "src/repositories/migrations",
  "dist/src/repositories/migrations",
  { recursive: true }
);

cpSync("evaluation", "dist/evaluation", { recursive: true });
