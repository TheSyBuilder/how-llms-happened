import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  assertKneserExpected,
  calculateKneserState,
  validateKneserScenario,
} from "../src/lib/kneser-ney-engine.ts";

const fixture = JSON.parse(readFileSync(new URL("../data/fixtures/kneser-ney-context-coverage.json", import.meta.url), "utf8"));
const scenario = fixture.scenarios[0];

test("every authored Kneser–Ney state matches its reviewed output and normalizes", () => {
  validateKneserScenario(scenario);
  for (const state of scenario.states) {
    const result = calculateKneserState(state);
    assertKneserExpected(state, result);
    for (const key of ["ordinaryProbability", "distinctContextProbability", "singletonContextProbability"]) {
      const total = result.candidates.reduce((sum, candidate) => sum + candidate[key], 0);
      assert.ok(Math.abs(total - 1) <= 1e-9, `${state.id} ${key} totals ${total}`);
    }
  }
});

test("moving one occurrence changes coverage but never token frequency", () => {
  const results = scenario.states.map(calculateKneserState);
  const dollars = results.map((result) => result.candidates.find((candidate) => candidate.label === "dollars"));
  const adapts = results.map((result) => result.candidates.find((candidate) => candidate.label === "adapts"));
  assert.deepEqual(dollars.map((candidate) => candidate.rawCount), [6, 6, 6]);
  assert.deepEqual(dollars.map((candidate) => candidate.distinctContextCount), [2, 3, 4]);
  assert.deepEqual(adapts.map((candidate) => candidate.rawCount), [4, 4, 4]);
  assert.deepEqual(adapts.map((candidate) => candidate.distinctContextCount), [3, 3, 3]);
});

test("ordinary frequency and distinct-context fallback can reverse their ranking", () => {
  const concentrated = calculateKneserState(scenario.states[0]);
  const dollars = concentrated.candidates.find((candidate) => candidate.label === "dollars");
  const adapts = concentrated.candidates.find((candidate) => candidate.label === "adapts");
  assert.ok(dollars.ordinaryProbability > adapts.ordinaryProbability);
  assert.ok(dollars.distinctContextProbability < adapts.distinctContextProbability);
});

test("the singleton alternative responds to the same controlled move", () => {
  const singletonProbabilities = scenario.states.map((state) => {
    const result = calculateKneserState(state);
    return result.candidates.find((candidate) => candidate.label === "dollars").singletonContextProbability;
  });
  assert.deepEqual(singletonProbabilities, [0, 1 / 3, 1 / 2]);
});

test("transition validation rejects a raw-count change", () => {
  const mutated = structuredClone(scenario);
  mutated.states[1].candidates[0].contexts[0].count += 1;
  assert.throws(() => validateKneserScenario(mutated), /total tokens|raw count|exactly one/);
});
