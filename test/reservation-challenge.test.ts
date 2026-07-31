import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  createReservationChallengeBaseline,
  verifyReservationChallengeBaseline
} from "../src/evaluation/reservation-challenge-baseline.js";
import { evaluateReservationChallenge } from "../src/evaluation/reservation-challenge-evaluator.js";
import { ReservationChallengeDatasetSchema } from "../src/evaluation/reservation-challenge-schema.js";
import {
  loadReservationChallengeDataset,
  runReservationChallengeCli
} from "../src/evaluation/run-reservation-challenge.js";
import { parseKakaoReservation } from "../src/kakao/reservation-parser.js";
import { RESERVATION_CHALLENGE_TEST_DATA as CHALLENGE } from "./support/reservation-challenge-data.js";

test("Given v2 challenge metadata, when the boundary parses it, then only consistent Korean cases are accepted", () => {
  const englishCase = structuredClone(CHALLENGE);
  const firstEnglishCase = englishCase.cases.at(0);
  assert.ok(firstEnglishCase);
  firstEnglishCase.language = "en";
  const contradictoryRoute = structuredClone(CHALLENGE);
  const secondContradictoryCase = contradictoryRoute.cases.at(1);
  assert.ok(secondContradictoryCase);
  secondContradictoryCase.expected.route = "created";
  const duplicateFeatures = structuredClone(CHALLENGE);
  const firstFeatureCase = duplicateFeatures.cases.at(0);
  assert.ok(firstFeatureCase?.features);
  firstFeatureCase.features.push("korean-date");

  assert.doesNotThrow(() => ReservationChallengeDatasetSchema.parse(CHALLENGE));
  assert.throws(() => ReservationChallengeDatasetSchema.parse(englishCase));
  assert.throws(() => ReservationChallengeDatasetSchema.parse(contradictoryRoute));
  assert.throws(() => ReservationChallengeDatasetSchema.parse(duplicateFeatures));
});

test("Given extraction and abstention mistakes, when evaluated, then every rate has explicit denominators and Wilson intervals", async () => {
  const fourCases = structuredClone(CHALLENGE);
  const completeCase = fourCases.cases.at(0);
  assert.ok(completeCase);
  fourCases.cases.push({
    ...structuredClone(completeCase),
    id: "missing-product",
    category: "adversarial",
    input: { ...completeCase.input, providerEventId: "challenge-event-3" }
  }, {
    ...structuredClone(completeCase),
    id: "wrong-destination",
    category: "adversarial",
    input: { ...completeCase.input, providerEventId: "challenge-event-4" }
  });
  const report = await evaluateReservationChallenge(fourCases, (message) => {
    const parsed = parseKakaoReservation(message);
    if (message.providerEventId === "challenge-event-2") {
      return { ...parsed, travelers: 2, issues: [] };
    }
    if (message.providerEventId === "challenge-event-3") {
      const { productName: _productName, ...missingProduct } = parsed;
      return { ...missingProduct, issues: [] };
    }
    if (message.providerEventId === "challenge-event-4") {
      return { ...parsed, destination: "제주" };
    }
    return parsed;
  });

  assert.deepEqual(report.summary.fields.aggregate.exact, {
    numerator: 13,
    denominator: 16,
    rate: 0.8125,
    wilson95: { low: 0.5699, high: 0.9341 }
  });
  assert.deepEqual(report.summary.fields.byField.travelers.falsePositive, {
    numerator: 1,
    denominator: 1,
    rate: 1,
    wilson95: { low: 0.2065, high: 1 }
  });
  assert.deepEqual(report.summary.fields.byField.productName.falseNegative, {
    numerator: 1,
    denominator: 4,
    rate: 0.25,
    wilson95: { low: 0.0456, high: 0.6994 }
  });
  assert.deepEqual(report.summary.abstention.precision, {
    numerator: 0,
    denominator: 1,
    rate: 0,
    wilson95: { low: 0, high: 0.7935 }
  });
  assert.deepEqual(report.summary.abstention.recall, {
    numerator: 0,
    denominator: 1,
    rate: 0,
    wilson95: { low: 0, high: 0.7935 }
  });
  assert.deepEqual(report.summary.route.confusion, {
    expectedCreated: { actualCreated: 2, actualNeedsConfirmation: 1 },
    expectedNeedsConfirmation: { actualCreated: 1, actualNeedsConfirmation: 0 }
  });
  assert.equal(report.summary.route.accuracy.rate, 0.5);
  assert.equal(report.summary.confirmationSetExact.rate, 0.5);
  assert.equal(report.summary.byCategory["adversarial"]?.cases, 2);
  assert.equal(report.summary.invalidOutputs, 0);
  assert.equal(report.summary.extractorErrors, 0);
});

test("Given parser issues that contradict populated fields, when routed, then production missing-field logic controls the result", async () => {
  const oneCase = { ...CHALLENGE, cases: [CHALLENGE.cases[0]] };
  const report = await evaluateReservationChallenge(oneCase, (message) => ({
    ...parseKakaoReservation(message),
    issues: ["travelers"]
  }));

  assert.deepEqual(report.summary.route.confusion, {
    expectedCreated: { actualCreated: 0, actualNeedsConfirmation: 1 },
    expectedNeedsConfirmation: { actualCreated: 0, actualNeedsConfirmation: 0 }
  });
  assert.equal(report.summary.confirmationSetExact.rate, 0);
  assert.deepEqual(report.failures, [{
    id: "complete-osaka",
    category: "complete",
    reasons: ["route", "confirmation_fields"]
  }]);
});

test("Given invalid output and an extractor error, when evaluated, then both are isolated from proportions and counted", async () => {
  const report = await evaluateReservationChallenge(CHALLENGE, (message) => {
    if (message.providerEventId === "challenge-event-1") return { destination: "오사카" };
    throw new Error("private fixture content");
  });

  assert.equal(report.summary.validOutputs, 0);
  assert.equal(report.summary.invalidOutputs, 1);
  assert.equal(report.summary.extractorErrors, 1);
  assert.equal(report.summary.route.accuracy.rate, null);
  assert.equal(report.summary.fields.aggregate.exact.wilson95, null);
  assert.doesNotMatch(JSON.stringify(report), /private fixture content|예약 문의/);
});

test("Given a deterministic known-failure baseline, when results stay equal or improve, then the gate passes but new failures regress", async () => {
  const knownFailureReport = await evaluateReservationChallenge(CHALLENGE, (message) => ({
    ...parseKakaoReservation(message),
    issues: ["travelers"]
  }));
  const baseline = createReservationChallengeBaseline(knownFailureReport);
  const impossibleBaseline = {
    ...baseline,
    summary: {
      ...baseline.summary,
      caseExact: { ...baseline.summary.caseExact, numerator: 3 }
    }
  };
  const stableGate = verifyReservationChallengeBaseline(knownFailureReport, baseline);
  const improvedReport = await evaluateReservationChallenge(CHALLENGE, parseKakaoReservation);
  const improvedGate = verifyReservationChallengeBaseline(improvedReport, baseline);
  const regressedReport = await evaluateReservationChallenge(CHALLENGE, () => ({ destination: "오사카" }));
  const regressionGate = verifyReservationChallengeBaseline(regressedReport, baseline);

  assert.equal(stableGate.passed, true);
  assert.throws(() => verifyReservationChallengeBaseline(
    knownFailureReport,
    impossibleBaseline
  ));
  assert.equal(stableGate.knownFailures, 1);
  assert.equal(improvedGate.passed, true);
  assert.equal(improvedGate.knownFailures, 0);
  assert.equal(regressionGate.passed, false);
  assert.ok(regressionGate.regressions.includes("invalid_outputs"));
});

test("Given dataset and baseline paths, when the challenge CLI runs, then it exits zero for the frozen deterministic result", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "cstion-challenge-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const datasetPath = join(directory, "challenge.json");
  const baselinePath = join(directory, "baseline.json");
  await writeFile(datasetPath, JSON.stringify(CHALLENGE), "utf8");
  const loaded = await loadReservationChallengeDataset(datasetPath);
  const report = await evaluateReservationChallenge(
    loaded.dataset,
    parseKakaoReservation,
    loaded.sha256
  );
  await writeFile(baselinePath, JSON.stringify(createReservationChallengeBaseline(report)), "utf8");
  let output = "";

  const exitCode = await runReservationChallengeCli(
    [datasetPath, baselinePath],
    (text) => { output += text; },
    () => {}
  );

  assert.equal(exitCode, 0, output);
  assert.equal(JSON.parse(output).gate.passed, true);
});
