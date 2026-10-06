import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import Ajv2020 from "ajv/dist/2020.js";

import {
  calculateElmanScenario,
  calculateForgetScenario,
  calculateOriginalCellScenario,
  calculatePeepholeVariant,
  validateRecurrentFixture,
} from "../src/lib/recurrent-memory-engine.ts";
import {
  getRecurrentFixtureForTests,
  getRecurrentManifestForTests,
} from "../src/lib/site-data.ts";

const fixturePath = new URL("../data/fixtures/recurrent-memory-trace.json", import.meta.url);
const schemaPath = new URL("../schemas/recurrent-memory-fixture.schema.json", import.meta.url);
const fixtureText = readFileSync(fixturePath, "utf8");
const rawFixture = JSON.parse(fixtureText);
const rawSchema = JSON.parse(readFileSync(schemaPath, "utf8"));

function scenario(kind) {
  const value = rawFixture.scenarios.find((item) => item.kind === kind);
  assert.ok(value, `missing ${kind}`);
  return value;
}

test("the recurrent fixture stays below 8 KiB and matches all reviewed traces", () => {
  assert.ok(Buffer.byteLength(fixtureText) < 8 * 1024);
  validateRecurrentFixture(rawFixture);
  assert.equal(rawFixture.scenarios.length, 4);
  assert.deepEqual(
    rawFixture.scenarios.map((item) => item.kind),
    ["elman-history-contrast", "original-cell-credit", "forget-retention", "peephole-inspection"],
  );
});

test("the same Elman token reaches different states after different histories", () => {
  const value = scenario("elman-history-contrast");
  const traces = calculateElmanScenario(value);
  assert.equal(value.histories[0].tokens[value.activeStep], "turn");
  assert.equal(value.histories[1].tokens[value.activeStep], "turn");
  assert.notEqual(traces[0].states[value.activeStep], traces[1].states[value.activeStep]);
  assert.deepEqual(traces, value.expected.histories);
});

test("the original cell keeps forward state and backward credit separate", () => {
  const value = scenario("original-cell-credit");
  const result = calculateOriginalCellScenario(value);
  assert.equal(result.steps.at(-1).state, 0.7);
  assert.equal(result.steps.at(-1).exposedOutput, value.expected.steps.at(-1).exposedOutput);
  assert.deepEqual(result.credit, value.expected.credit);
  assert.deepEqual(result.credit.map((point) => point.ordinaryPath), [1, 0.6, 0.36, 0.216, 0.1296]);
  assert.ok(result.credit.every((point) => point.protectedPath === 1));
  assert.doesNotMatch(JSON.stringify(value), /forget|peephole|cellStateToGate/i);
});

test("forget presets change retention while the input-gated write stays fixed", () => {
  const value = scenario("forget-retention");
  const result = calculateForgetScenario(value);
  assert.equal(result.inputGatedWrite, 0.2);
  assert.deepEqual(
    result.presets.map((preset) => preset.retainedContribution),
    value.expected.presets.map((preset) => preset.retainedContribution),
  );
  assert.ok(result.presets[0].retainedContribution > result.presets[1].retainedContribution);
  assert.ok(result.presets[1].retainedContribution > result.presets[2].retainedContribution);
});

test("peepholes read previous state for input and forget and updated state for output", () => {
  const value = scenario("peephole-inspection");
  const without = calculatePeepholeVariant(value.parameters, false);
  const withPeepholes = calculatePeepholeVariant(value.parameters, true);
  assert.deepEqual(without, value.expected.withoutPeepholes);
  assert.deepEqual(withPeepholes, value.expected.withPeepholes);
  assert.equal(withPeepholes.inputInspectedState, value.parameters.previousState);
  assert.equal(withPeepholes.forgetInspectedState, value.parameters.previousState);
  assert.equal(withPeepholes.outputInspectedState, withPeepholes.state);
  assert.equal(withPeepholes.retainedContribution, withPeepholes.forgetGate * value.parameters.previousState);
});

test("semantic validation rejects historical-variant leakage and broken trace invariants", () => {
  const leaked = structuredClone(rawFixture);
  leaked.scenarios.find((item) => item.kind === "original-cell-credit").forgetGate = 0.5;
  assert.throws(() => validateRecurrentFixture(leaked), /leaks a later forget or peephole mechanism/);

  const nonUnit = structuredClone(rawFixture);
  nonUnit.scenarios.find((item) => item.kind === "original-cell-credit").protectedLocalFactors[1] = 0.9;
  assert.throws(() => validateRecurrentFixture(nonUnit), /unit local factors/);

  const wrongToken = structuredClone(rawFixture);
  wrongToken.scenarios.find((item) => item.kind === "elman-history-contrast").histories[1].tokens[2] = "stop";
  assert.throws(() => validateRecurrentFixture(wrongToken), /share the active token/);

  const reordered = structuredClone(rawFixture);
  reordered.scenarios.find((item) => item.kind === "forget-retention").presets.reverse();
  assert.throws(() => validateRecurrentFixture(reordered), /reviewed preset order/);
});

test("the fixture schema rejects a later gate inserted into the original cell", () => {
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(rawSchema);
  const mutated = structuredClone(rawFixture);
  mutated.scenarios.find((item) => item.kind === "original-cell-credit").forgetGate = 0.5;
  assert.equal(validate(mutated), false);
  assert.ok(validate.errors.some((error) => error.keyword === "unevaluatedProperties"));
});

test("the recurrent journey builds its first five stages and preserves pedagogy paths and static interludes", () => {
  const manifest = getRecurrentManifestForTests();
  assert.deepEqual(
    manifest.stages.map((stage) => stage.slug),
    [
      "elman-1988-1990",
      "hochreiter-schmidhuber-1995-1997",
      "gers-1999-2000",
      "gers-2002",
      "mikolov-2010",
      "sundermeyer-2012",
    ],
  );
  assert.deepEqual(manifest.stages.map((stage) => stage.status), ["built", "built", "built", "built", "built", "planned"]);
  assert.ok(manifest.stages.every((stage) => stage.objectiveIds.beginner !== stage.objectiveIds.expert));
  assert.ok(manifest.stages.every((stage) => {
    const beginner = stage.blocks.beginner.map((block) => block.id);
    const expert = stage.blocks.expert.map((block) => block.id);
    return beginner.every((id) => !expert.includes(id));
  }));
  const stageClaimIds = new Set(manifest.stages.flatMap((stage) => [
    ...stage.contribution.claimIds,
    ...stage.blocks.beginner.flatMap((block) => block.claimIds),
    ...stage.blocks.expert.flatMap((block) => block.claimIds),
  ]));
  const objectiveIds = new Set(manifest.stages.flatMap((stage) => Object.values(stage.objectiveIds)));
  assert.equal(stageClaimIds.size, 62);
  assert.equal(objectiveIds.size, 12);
  assert.deepEqual(
    manifest.interludes.map((interlude) => [
      interlude.id,
      interlude.stageSlug,
      interlude.kind,
      interlude.relatedJourneyId ?? null,
    ]),
    [
      ["bengio-fixed-window-prerequisite", "mikolov-2010", "prerequisite", null],
      ["smoothing-to-sundermeyer-bridge", "sundermeyer-2012", "bridge", "smoothing"],
    ],
  );
});

test("the interactive fixture excludes static convergence panels", () => {
  const fixture = getRecurrentFixtureForTests();
  assert.equal(fixture.representedClaimIds.length, 18);
  assert.equal(fixture.representedObjectiveIds.length, 8);
  assert.doesNotMatch(JSON.stringify(fixture), /bengio-2003|mikolov-2010|sundermeyer-2012/);
});
