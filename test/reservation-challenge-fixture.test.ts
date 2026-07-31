import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { z } from "zod";
import { ReservationChallengeDatasetSchema } from "../src/evaluation/reservation-challenge-schema.js";
import { runReservationChallengeCli } from "../src/evaluation/run-reservation-challenge.js";

const DATASET_URL = new URL(
  "../evaluation/reservation-challenge.v2.json",
  import.meta.url
);

test("Given the published challenge fixture, when validated, then its frozen composition is balanced and synthetic", async () => {
  const source = await readFile(DATASET_URL, "utf8");
  const input: unknown = JSON.parse(source);
  const dataset = ReservationChallengeDatasetSchema.parse(input);
  const categories = new Map<string, number>();
  const routes = new Map<string, number>();

  for (const challengeCase of dataset.cases) {
    categories.set(challengeCase.category, (categories.get(challengeCase.category) ?? 0) + 1);
    routes.set(challengeCase.expected.route, (routes.get(challengeCase.expected.route) ?? 0) + 1);
  }

  assert.equal(dataset.cases.length, 48);
  assert.equal(categories.size, 8);
  assert.ok([...categories.values()].every((count) => count === 6));
  assert.deepEqual(Object.fromEntries(routes), { created: 24, needs_confirmation: 24 });
  assert.equal(new Set(dataset.cases.map((entry) => entry.id)).size, 48);
  assert.equal(new Set(dataset.cases.map((entry) => entry.input.providerEventId)).size, 48);
  assert.equal(new Set(dataset.cases.map((entry) => entry.input.providerUserId)).size, 48);
  assert.doesNotMatch(source, /"profile"|@[a-z0-9.-]+\.[a-z]{2,}|01[016789]-?\d{3,4}-?\d{4}/i);
});

test("Given the frozen baseline, when the production parser is evaluated, then the public metrics reproduce without leaking messages", async () => {
  let output = "";
  let error = "";
  const exitCode = await runReservationChallengeCli(
    [],
    (text) => { output += text; },
    (text) => { error += text; }
  );
  const result: unknown = JSON.parse(output);
  const parsed = PublishedResultSchema.parse(result);

  assert.equal(exitCode, 0, error);
  assert.equal(parsed.gate.passed, true);
  assert.equal(parsed.gate.knownFailures, 18);
  assert.deepEqual(parsed.gate.regressions, []);
  assert.equal(parsed.report.dataset.cases, 48);
  assert.equal(parsed.report.summary.caseExact.numerator, 30);
  assert.equal(parsed.report.summary.fields.aggregate.exact.numerator, 167);
  assert.equal(parsed.report.summary.route.accuracy.numerator, 31);
  assert.doesNotMatch(output, /providerEventId|providerUserId|예약|문의/);
});

const MetricSchema = z.object({ numerator: z.number().int().nonnegative() });
const PublishedResultSchema = z.strictObject({
  report: z.object({
    dataset: z.object({ cases: z.number().int().positive() }),
    summary: z.object({
      caseExact: MetricSchema,
      fields: z.object({ aggregate: z.object({ exact: MetricSchema }) }),
      route: z.object({ accuracy: MetricSchema })
    })
  }),
  gate: z.strictObject({
    passed: z.boolean(),
    knownFailures: z.number().int().nonnegative(),
    regressions: z.array(z.string())
  })
});
