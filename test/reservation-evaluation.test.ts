import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ReservationEvaluationDatasetSchema } from "../src/evaluation/reservation-evaluation-schema.js";
import { evaluateReservationExtractor } from "../src/evaluation/reservation-evaluator.js";
import { runReservationEvaluationCli } from "../src/evaluation/run-reservation-evaluation.js";
import { parseKakaoReservation } from "../src/kakao/reservation-parser.js";

const SYNTHETIC_DATASET = {
  schemaVersion: 1,
  name: "synthetic-kakao-baseline",
  createdAt: "2026-07-31",
  languages: ["ko"],
  domain: "travel-reservation-inquiry",
  provenance: {
    source: "synthetic",
    containsPersonalData: false,
    description: "Hand-authored Korean travel inquiries; no customer records."
  },
  cases: [
    {
      id: "complete-osaka",
      input: {
        providerEventId: "evaluation-event-1",
        providerUserId: "evaluation-user-1",
        text: "2026년 9월 3일 오사카 패키지 2명 예약하고 싶어요.",
        receivedAt: "2026-07-31T00:00:00.000Z"
      },
      expected: {
        destination: "오사카",
        startDate: "2026-09-03",
        travelers: 2,
        productName: "패키지",
        issues: []
      }
    },
    {
      id: "missing-travelers",
      input: {
        providerEventId: "evaluation-event-2",
        providerUserId: "evaluation-user-2",
        text: "2026년 10월 11일 제주 호텔 예약 문의",
        receivedAt: "2026-07-31T00:00:00.000Z"
      },
      expected: {
        destination: "제주",
        startDate: "2026-10-11",
        travelers: null,
        productName: "호텔",
        issues: ["travelers"]
      }
    }
  ]
};

test("Given a synthetic dataset, when the deterministic parser is evaluated, then the baseline is reproducible", async () => {
  const report = await evaluateReservationExtractor(
    SYNTHETIC_DATASET,
    parseKakaoReservation
  );

  assert.deepEqual(report.summary.cases, { passed: 2, total: 2, accuracy: 1 });
  assert.deepEqual(report.summary.requiredFields, {
    exactMatches: 8,
    total: 8,
    accuracy: 1,
    byField: {
      destination: { matches: 2, total: 2, accuracy: 1 },
      startDate: { matches: 2, total: 2, accuracy: 1 },
      travelers: { matches: 2, total: 2, accuracy: 1 },
      productName: { matches: 2, total: 2, accuracy: 1 }
    }
  });
  assert.deepEqual(report.summary.abstentions, { correct: 1, total: 1 });
  assert.equal(report.summary.requiredFieldFalsePositives, 0);
  assert.deepEqual(report.summary.confirmationRouting, {
    matches: 2,
    total: 2,
    accuracy: 1
  });
  assert.equal(report.summary.invalidOutputs, 0);
  assert.equal(report.summary.extractorErrors, 0);
  assert.deepEqual(report.failures, []);
});

test("Given an evaluation fixture with profile data, when the boundary parses it, then it is rejected", () => {
  const datasetWithContactData = structuredClone(SYNTHETIC_DATASET);
  const firstCase = datasetWithContactData.cases[0];
  assert.ok(firstCase);
  Object.assign(firstCase.input, { profile: {
    nickname: "Jane Doe"
  } });

  assert.throws(() => ReservationEvaluationDatasetSchema.parse(datasetWithContactData));
});

test("Given a fixture whose expected issues contradict its fields, when it is parsed, then it is rejected", () => {
  const inconsistentDataset = structuredClone(SYNTHETIC_DATASET);
  const secondCase = inconsistentDataset.cases[1];
  assert.ok(secondCase);
  secondCase.expected.issues = [];

  assert.throws(() => ReservationEvaluationDatasetSchema.parse(inconsistentDataset));
});

test("Given duplicate fixture IDs or issues, when the dataset is parsed, then it is rejected", () => {
  const duplicateIds = structuredClone(SYNTHETIC_DATASET);
  const firstCase = duplicateIds.cases[0];
  const secondCase = duplicateIds.cases[1];
  assert.ok(firstCase && secondCase);
  secondCase.id = firstCase.id;

  const duplicateIssues = structuredClone(SYNTHETIC_DATASET);
  const missingCase = duplicateIssues.cases[1];
  assert.ok(missingCase);
  missingCase.expected.issues = ["travelers", "travelers"];

  assert.throws(() => ReservationEvaluationDatasetSchema.parse(duplicateIds));
  assert.throws(() => ReservationEvaluationDatasetSchema.parse(duplicateIssues));
});

test("Given an invalid extractor response, when it is evaluated, then the failure is reported without fixture content", async () => {
  const report = await evaluateReservationExtractor(
    {
      ...SYNTHETIC_DATASET,
      cases: [SYNTHETIC_DATASET.cases[0]]
    },
    () => ({ destination: "오사카" })
  );

  assert.equal(report.summary.invalidOutputs, 1);
  assert.deepEqual(report.failures, [{
    id: "complete-osaka",
    reasons: ["invalid_output"]
  }]);
  assert.doesNotMatch(JSON.stringify(report), /예약하고 싶어요/);
});

test("Given a false positive or extractor error, when it is evaluated, then both failure classes are measured", async () => {
  const missingCase = SYNTHETIC_DATASET.cases[1];
  assert.ok(missingCase);
  const oneCaseDataset = { ...SYNTHETIC_DATASET, cases: [missingCase] };
  const falsePositive = await evaluateReservationExtractor(
    oneCaseDataset,
    (message) => ({
      ...parseKakaoReservation(message),
      travelers: 2,
      issues: []
    })
  );
  const extractorError = await evaluateReservationExtractor(
    oneCaseDataset,
    () => { throw new Error("private fixture content"); }
  );

  assert.equal(falsePositive.summary.requiredFieldFalsePositives, 1);
  assert.deepEqual(falsePositive.failures, [{
    id: "missing-travelers",
    reasons: ["travelers", "issues"]
  }]);
  assert.equal(extractorError.summary.extractorErrors, 1);
  assert.deepEqual(extractorError.failures, [{
    id: "missing-travelers",
    reasons: ["extractor_error"]
  }]);
  assert.doesNotMatch(JSON.stringify(extractorError), /private fixture content/);
});

test("Given the versioned synthetic fixture, when the evaluation command runs, then it publishes a passing report", async () => {
  let stdout = "";
  let stderr = "";

  const exitCode = await runReservationEvaluationCli(
    [],
    (text) => { stdout += text; },
    (text) => { stderr += text; }
  );

  const report = JSON.parse(stdout) as {
    dataset: { cases: number; containsPersonalData: boolean };
    summary: { cases: { passed: number; total: number } };
  };
  assert.equal(exitCode, 0);
  assert.equal(stderr, "");
  assert.equal(report.dataset.containsPersonalData, false);
  assert.equal(report.dataset.cases, 10);
  assert.deepEqual(report.summary.cases, { passed: 10, total: 10, accuracy: 1 });
});

test("Given a malformed private fixture, when the evaluation command runs, then it fails without echoing content", async (context) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "cstion-evaluation-"));
  context.after(() => rm(temporaryDirectory, { recursive: true, force: true }));
  const fixturePath = join(temporaryDirectory, "private.json");
  await writeFile(fixturePath, "{\"private\":\"do-not-echo\"}", "utf8");
  let stderr = "";

  const exitCode = await runReservationEvaluationCli(
    [fixturePath],
    () => {},
    (text) => { stderr += text; }
  );

  assert.equal(exitCode, 2);
  assert.match(stderr, /evaluation_failed/);
  assert.doesNotMatch(stderr, /do-not-echo/);
});

test("Given a valid dataset with a regression, when the evaluation command runs, then it returns a failing report", async (context) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "cstion-regression-"));
  context.after(() => rm(temporaryDirectory, { recursive: true, force: true }));
  const fixturePath = join(temporaryDirectory, "regression.json");
  const regressedDataset = structuredClone(SYNTHETIC_DATASET);
  const firstCase = regressedDataset.cases[0];
  assert.ok(firstCase);
  firstCase.expected.destination = "제주";
  await writeFile(fixturePath, JSON.stringify(regressedDataset), "utf8");
  let stdout = "";

  const exitCode = await runReservationEvaluationCli(
    [fixturePath],
    (text) => { stdout += text; },
    () => {}
  );

  assert.equal(exitCode, 1);
  assert.match(stdout, /complete-osaka/);
  assert.doesNotMatch(stdout, /예약하고 싶어요/);
});
