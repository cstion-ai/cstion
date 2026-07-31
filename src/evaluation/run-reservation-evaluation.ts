import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseKakaoReservation } from "../kakao/reservation-parser.js";
import { isMainModule } from "../shared/main-module.js";
import {
  ReservationEvaluationDatasetSchema,
  type ReservationEvaluationDataset
} from "./reservation-evaluation-schema.js";
import { evaluateReservationExtractor } from "./reservation-evaluator.js";

const MAX_DATASET_BYTES = 1024 * 1024;
const DEFAULT_DATASET_URL = new URL(
  "../../evaluation/reservation-cases.v1.json",
  import.meta.url
);

type TextWriter = (text: string) => void;

export async function loadReservationEvaluationDataset(
  location: string | URL
): Promise<ReservationEvaluationDataset> {
  const fileStats = await stat(location);
  if (fileStats.size > MAX_DATASET_BYTES) {
    throw new Error("Evaluation dataset exceeds the 1 MiB limit");
  }

  const source = await readFile(location, "utf8");
  const parsed: unknown = JSON.parse(source);
  return ReservationEvaluationDatasetSchema.parse(parsed);
}

export async function runReservationEvaluationCli(
  args: string[],
  writeOutput: TextWriter,
  writeError: TextWriter
): Promise<number> {
  try {
    if (args.length > 1) throw new Error("Expected at most one dataset path");
    const requestedPath = args.at(0);
    const location = requestedPath
      ? resolve(requestedPath)
      : DEFAULT_DATASET_URL;
    const dataset = await loadReservationEvaluationDataset(location);
    const report = await evaluateReservationExtractor(
      dataset,
      parseKakaoReservation
    );
    writeOutput(`${JSON.stringify(report, null, 2)}\n`);
    return report.failures.length === 0 ? 0 : 1;
  } catch {
    writeError(`${JSON.stringify({ error: "evaluation_failed" })}\n`);
    return 2;
  }
}

if (isMainModule(import.meta.url)) {
  void runReservationEvaluationCli(
    process.argv.slice(2),
    (text) => process.stdout.write(text),
    (text) => process.stderr.write(text)
  ).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
