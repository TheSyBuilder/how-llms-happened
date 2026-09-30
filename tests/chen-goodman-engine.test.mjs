import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  calculateChenScenario,
  calculateFixedDiscounts,
  validateChenScenario,
} from "../src/lib/chen-goodman-engine.ts";

const fixture = JSON.parse(readFileSync(new URL("../data/fixtures/chen-goodman-interpolation-discounts.json", import.meta.url), "utf8"));
const scenario = fixture.scenarios[0];

test("both Chen–Goodman variants match reviewed outputs and normalize", () => {
  validateChenScenario(scenario);
  for (const variant of ["single", "modified"]) {
    const result = calculateChenScenario(scenario, variant);
    assert.ok(Math.abs(result.total - 1) <= 1e-9);
    assert.ok(Math.abs(result.lowerOrderMass - result.interpolationWeight) <= 1e-9);
    assert.ok(result.continuations.every((item) => item.finalProbability >= 0));
  }
});

test("interpolation sends lower-order evidence to seen and unseen continuations", () => {
  const result = calculateChenScenario(scenario, "modified");
  assert.ok(result.continuations.some((item) => item.count === 0 && item.lowerOrderContribution > 0));
  assert.ok(result.continuations.some((item) => item.count > 0 && item.lowerOrderContribution > 0));
  assert.ok(result.continuations.every((item) => item.lowerOrderContribution > 0));
});

test("the modified variant exposes zero, one, two, and three-plus branches", () => {
  const result = calculateChenScenario(scenario, "modified");
  assert.deepEqual(result.continuations.map((item) => item.tier), ["D1", "D2", "D3+", "zero"]);
  assert.deepEqual(result.continuations.map((item) => item.discount), [0.5, 1, 2, 0]);
});

test("the single-discount comparison keeps one shared D across every seen count", () => {
  const result = calculateChenScenario(scenario, "single");
  assert.deepEqual(result.continuations.filter((item) => item.count > 0).map((item) => item.discount), [0.75, 0.75, 0.75]);
  assert.equal(result.continuations.find((item) => item.count === 0).discount, 0);
});

test("the fixed count-of-counts equations reproduce all three discounts", () => {
  assert.deepEqual(calculateFixedDiscounts(scenario.countOfCounts), {
    y: 0.5,
    d1: 0.5,
    d2: 1,
    d3Plus: 2,
  });
});

test("fixture validation rejects a non-normalized lower-order distribution", () => {
  const mutated = structuredClone(scenario);
  mutated.continuations[0].lowerOrderProbability += 0.1;
  assert.throws(() => validateChenScenario(mutated), /lower-order probabilities do not normalize/);
});

test("fixture validation rejects a discount that removes an entire observed count", () => {
  const mutated = structuredClone(scenario);
  mutated.singleDiscount = 1;
  assert.throws(() => validateChenScenario(mutated), /discount is outside/);
});

test("fixed estimation rejects a degenerate count-of-counts result", () => {
  assert.throws(
    () => calculateFixedDiscounts({ n1: 2, n2: 1, n3: 1, n4: 0 }),
    /count-tier bounds/,
  );
});
