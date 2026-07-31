import { createHash } from "node:crypto";
import { open } from "node:fs/promises";
import { resolve } from "node:path";
import { parseKakaoReservation } from "../kakao/reservation-parser.js";
import { isMainModule } from "../shared/main-module.js";
import {
  ReservationChallengeBaselineSchema,
  verifyReservationChallengeBaseline,
  type ReservationChallengeBaseline
} from "./reservation-challenge-baseline.js";
import { evaluateReservationChallenge } from "./reservation-challenge-evaluator.js";
import {
  ReservationChallengeDatasetSchema,
  type ReservationChallengeDataset
} from "./reservation-challenge-schema.js";

const MAX_INPUT_BYTES = 1024 * 1024;
const DEFAULT_DATASET_URL = new URL(
  "../../evaluation/reservation-challenge.v2.json",
  import.meta.url
);
const DEFAULT_BASELINE_URL = new URL(
  "../../evaluation/baselines/deterministic-parser.v2.json",
  import.meta.url
);

type TextWriter = (text: string) => void;

type LoadedChallengeDataset = {
  readonly dataset: ReservationChallengeDataset;
  readonly sha256: string;
};

export async function loadReservationChallengeDataset(
  location: string | URL
): Promise<LoadedChallengeDataset> {
  const source = await readBoundedInput(location);
  const parsed: unknown = JSON.parse(source.toString("utf8"));
  return {
    dataset: ReservationChallengeDatasetSchema.parse(parsed),
    sha256: createHash("sha256").update(source).digest("hex")
  };
}

export async function loadReservationChallengeBaseline(
  location: string | URL
): Promise<ReservationChallengeBaseline> {
  const source = await readBoundedInput(location);
  const parsed: unknown = JSON.parse(source.toString("utf8"));
  return ReservationChallengeBaselineSchema.parse(parsed);
}

export async function runReservationChallengeCli(
  args: readonly string[],
  writeOutput: TextWriter,
  writeError: TextWriter
): Promise<number> {
  try {
    if (args.length > 2) {
      throw new ReservationChallengeInputError("Expected dataset and baseline paths only");
    }
    const datasetLocation = args.at(0) === undefined
      ? DEFAULT_DATASET_URL
      : resolve(args.at(0) ?? "");
    const baselineLocation = args.at(1) === undefined
      ? DEFAULT_BASELINE_URL
      : resolve(args.at(1) ?? "");
    const loaded = await loadReservationChallengeDataset(datasetLocation);
    const baseline = await loadReservationChallengeBaseline(baselineLocation);
    const report = await evaluateReservationChallenge(
      loaded.dataset,
      parseKakaoReservation,
      loaded.sha256
    );
    const gate = verifyReservationChallengeBaseline(report, baseline);
    writeOutput(`${JSON.stringify({ report, gate }, null, 2)}\n`);
    return gate.passed ? 0 : 1;
  } catch {
    writeError(`${JSON.stringify({ error: "challenge_evaluation_failed" })}\n`);
    return 2;
  }
}

async function readBoundedInput(location: string | URL): Promise<Buffer> {
  const handle = await open(location, "r");
  try {
    const source = Buffer.alloc(MAX_INPUT_BYTES + 1);
    let offset = 0;
    while (offset < source.length) {
      const { bytesRead } = await handle.read(
        source,
        offset,
        source.length - offset,
        offset
      );
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset > MAX_INPUT_BYTES) {
      throw new ReservationChallengeInputError("Challenge input exceeds the 1 MiB limit");
    }
    return source.subarray(0, offset);
  } finally {
    await handle.close();
  }
}

class ReservationChallengeInputError extends Error {
  readonly code = "invalid_challenge_input";
}

if (isMainModule(import.meta.url)) {
  void runReservationChallengeCli(
    process.argv.slice(2),
    (text) => process.stdout.write(text),
    (text) => process.stderr.write(text)
  ).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
