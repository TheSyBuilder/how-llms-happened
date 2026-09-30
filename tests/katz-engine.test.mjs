import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKatzExpected,
  calculateKatzScenario,
} from "../src/lib/katz-engine.ts";
import { getKatzFixtureForTests } from "../src/lib/site-data.ts";

const fixture = getKatzFixtureForTests();

test("every reviewed Katz scenario is nonnegative and normalized", () => {
  for (const scenario of fixture.scenarios) {
    const result = calculateKatzScenario(scenario);
    assertKatzExpected(scenario, result);
    assert.ok(Math.abs(result.total - 1) <= 1e-9);
    assert.ok(result.continuations.every((item) => item.finalProbability >= 0));
  }
});

test("the observed-history branch sends lower-order mass only through zero estimates", () => {
  const scenario = fixture.scenarios.find((item) => item.id === "rare-continuation");
  assert.ok(scenario);
  const result = calculateKatzScenario(scenario);
  assert.deepEqual(result.eligibleLabels, ["improved", "today"]);
  assert.ok(Math.abs(result.reservedMass - 0.1) <= 1e-9);
  assert.equal(result.eligibleLowerOrderMass, 0.5);
  assert.ok(Math.abs(result.alpha - 0.2) <= 1e-9);
  assert.ok(result.continuations.filter((item) => item.gate === "keep").every((item) => item.lowerOrderContribution === 0));
});

test("alpha is a normalizer rather than a convex mixture weight", () => {
  const scenario = fixture.scenarios.find((item) => item.id === "narrow-eligible-set");
  assert.ok(scenario);
  const result = calculateKatzScenario(scenario);
  assert.equal(result.alpha, 2.5);
  assert.deepEqual(result.eligibleLabels, ["adapts"]);
  assert.equal(result.continuations.find((item) => item.label === "adapts")?.finalProbability, 0.25);
});

test("a zero-count history uses the lower-order estimator without beta or alpha", () => {
  const scenario = fixture.scenarios.find((item) => item.id === "unseen-history");
  assert.ok(scenario);
  const result = calculateKatzScenario(scenario);
  assert.equal(result.branch, "unseen-history");
  assert.equal(result.reservedMass, null);
  assert.equal(result.alpha, null);
  assert.ok(result.continuations.every((item) => item.gate === "drop-history"));
  assert.deepEqual(
    result.continuations.map((item) => item.finalProbability),
    scenario.continuations.map((item) => item.lowerOrderProbability),
  );
});

test("invalid fixtures fail instead of emitting an unnormalized distribution", () => {
  const scenario = structuredClone(fixture.scenarios[0]);
  scenario.continuations[0].lowerOrderProbability = 0.9;
  assert.throws(() => calculateKatzScenario(scenario), /sum to one/);
});
