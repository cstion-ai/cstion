import assert from "node:assert/strict";
import test from "node:test";
import {
  createReservationChallengeBaseline,
  verifyReservationChallengeBaseline
} from "../src/evaluation/reservation-challenge-baseline.js";
import { evaluateReservationChallenge } from "../src/evaluation/reservation-challenge-evaluator.js";
import { proportionMetric } from "../src/evaluation/reservation-challenge-report.js";
import { parseKakaoReservation } from "../src/kakao/reservation-parser.js";
import { RESERVATION_CHALLENGE_TEST_DATA as CHALLENGE } from "./support/reservation-challenge-data.js";

test("Given changed dataset or evaluator identity, when gated, then the exact identity regression is reported", async () => {
  const report = await evaluateReservationChallenge(
    CHALLENGE,
    parseKakaoReservation,
    "a".repeat(64)
  );
  const baseline = createReservationChallengeBaseline(report);
  const changedDataset = await evaluateReservationChallenge(
    CHALLENGE,
    parseKakaoReservation,
    "b".repeat(64)
  );
  const changedEvaluator = structuredClone(report);
  Object.defineProperty(changedEvaluator.evaluator, "version", { value: "2" });

  assert.ok(verifyReservationChallengeBaseline(
    changedDataset,
    baseline
  ).regressions.includes("dataset_identity"));
  assert.ok(verifyReservationChallengeBaseline(
    changedEvaluator,
    baseline
  ).regressions.includes("evaluator_identity"));
});

test("Given offsetting route outcomes, when aggregate accuracy is unchanged, then the worsened confusion cell regresses", async () => {
  const report = await evaluateReservationChallenge(CHALLENGE, parseKakaoReservation);
  const baselineReport = {
    ...report,
    summary: {
      ...report.summary,
      route: {
        confusion: {
          expectedCreated: { actualCreated: 0, actualNeedsConfirmation: 1 },
          expectedNeedsConfirmation: { actualCreated: 0, actualNeedsConfirmation: 1 }
        },
        accuracy: proportionMetric(1, 2)
      }
    }
  };
  const changedReport = {
    ...baselineReport,
    summary: {
      ...baselineReport.summary,
      route: {
        ...baselineReport.summary.route,
        confusion: {
          expectedCreated: { actualCreated: 1, actualNeedsConfirmation: 0 },
          expectedNeedsConfirmation: { actualCreated: 1, actualNeedsConfirmation: 0 }
        }
      }
    }
  };
  const gate = verifyReservationChallengeBaseline(
    changedReport,
    createReservationChallengeBaseline(baselineReport)
  );

  assert.ok(gate.regressions.includes("route:expected_needs_confirmation:actual_created"));
});

test("Given a category abstention regression, when aggregate metrics are unchanged, then the category gate fails", async () => {
  const report = await evaluateReservationChallenge(CHALLENGE, parseKakaoReservation);
  const category = report.summary.byCategory["missing-field"];
  assert.ok(category);
  const changedReport = {
    ...report,
    summary: {
      ...report.summary,
      byCategory: {
        ...report.summary.byCategory,
        "missing-field": {
          ...category,
          abstention: {
            precision: proportionMetric(0, 1),
            recall: proportionMetric(0, 1)
          }
        }
      }
    }
  };
  const gate = verifyReservationChallengeBaseline(
    changedReport,
    createReservationChallengeBaseline(report)
  );

  assert.ok(gate.regressions.includes("category:missing-field:abstention_precision"));
  assert.ok(gate.regressions.includes("category:missing-field:abstention_recall"));
});
