import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  calculateAlignmentScenario, calculateBahdanauRead, calculateChoReset,
  calculateConditionalOutput, calculateSourceReversal, stableSoftmax, validateAlignmentFixture,
} from "../src/lib/alignment-engine.ts";

const raw = readFileSync(new URL("../data/fixtures/encoder-decoder-alignment.json", import.meta.url), "utf8");
const fixture = JSON.parse(raw);
const schema = JSON.parse(readFileSync(new URL("../schemas/alignment-fixture.schema.json", import.meta.url), "utf8"));
const validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
const scenario = (id) => structuredClone(fixture.scenarios.find((item) => item.id === id));
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test("all six independent expected ledgers pass the strict schema and 12 KiB budget", () => {
  assert.ok(validateSchema(fixture), JSON.stringify(validateSchema.errors));
  assert.ok(Buffer.byteLength(raw) <= 12 * 1024);
  assert.equal(fixture.scenarios.length, 6);
  validateAlignmentFixture(fixture);
});

test("conditional scoring uses observed prefixes, vocabulary normalization and target EOS", () => {
  const input = scenario("conditional-output-score");
  const snapshot = structuredClone(input);
  const result = calculateConditionalOutput(input);
  near(result.sequenceProbability, 0.6 * 0.6 * 0.8);
  near(result.negativeLogLikelihood, -Math.log(0.6) - Math.log(0.6) - Math.log(0.8));
  for (const row of result.probabilities) near(row.reduce((a, b) => a + b), 1);
  assert.deepEqual(input, snapshot);
  input.steps[1].prefix = ["Y"];
  assert.throws(() => calculateConditionalOutput(input), /observed target prefix/);
  const noEos = scenario("conditional-output-score");
  noEos.observedTarget.pop();
  assert.throws(() => calculateConditionalOutput(noEos), /EOS-terminated/);
});

test("Cho's non-diagonal reset example distinguishes both source expressions and z roles", () => {
  const input = scenario("cho-reset-placement");
  const result = calculateChoReset(input);
  near(result.main.recurrentTerm[0], -0.45);
  near(result.main.recurrentTerm[1], -0.375);
  near(result.attachment.recurrentTerm[0], -0.05);
  near(result.attachment.recurrentTerm[1], -0.525);
  near(result.main.state[0], 0.8 * 0.6 + 0.2 * Math.tanh(-0.25));
  near(result.main.state[1], 0.3 * -0.4 + 0.7 * Math.tanh(-0.475));
  assert.notDeepEqual(result.main.state, result.attachment.state);
  input.gateConvention = "z-weights-candidate";
  assert.throws(() => calculateChoReset(input), /z must weight the old state/);
});

test("matrix shapes and nonfinite inputs cannot silently broadcast or drop coordinates", () => {
  const reset = scenario("cho-reset-placement");
  reset.recurrentMatrix[0].pop();
  assert.throws(() => calculateChoReset(reset), /shape/);
  const read = scenario("bahdanau-two-reads");
  read.queryMatrix[0].push(1);
  assert.throws(() => calculateBahdanauRead(read), /shape/);
  const infinite = scenario("bahdanau-two-reads");
  infinite.annotations[0].forward[0] = Infinity;
  assert.throws(() => calculateBahdanauRead(infinite), /finite/);
});

test("reversal retains original source IDs and EOS while exposing early and late gaps", () => {
  const input = scenario("source-reversal-gaps");
  const snapshot = structuredClone(input);
  const result = calculateSourceReversal(input);
  assert.deepEqual(result.forwardGaps, [5, 5, 5, 5]);
  assert.deepEqual(result.reversedGaps, [2, 4, 6, 8]);
  assert.equal(result.forwardMean, result.reversedMean);
  assert.ok(result.reversedGaps[0] < result.forwardGaps[0]);
  assert.ok(result.reversedGaps[3] > result.forwardGaps[3]);
  assert.equal(result.reversedOrder.at(-1), "<eos>");
  assert.deepEqual(result.targetOrder, ["W", "X", "Y", "Z", "<eos>"]);
  assert.deepEqual(input, snapshot);
  input.eosConvention = "ignore-source-eos";
  assert.throws(() => calculateSourceReversal(input), /EOS distance convention/);
});

test("unchanged reversal mean is scoped to paired coverage, not forced for arbitrary links", () => {
  const input = scenario("source-reversal-gaps");
  input.pairs = [{ sourceIndex: 0, targetIndex: 0 }];
  const result = calculateSourceReversal(input);
  assert.equal(result.forwardMean, 5);
  assert.equal(result.reversedMean, 2);
  input.pairs[0].sourceIndex = 4;
  assert.throws(() => calculateSourceReversal(input), /outside/);
});

test("Bahdanau uses additive prior-state scores and a separate denominator for each source read", () => {
  const input = scenario("bahdanau-two-reads");
  const snapshot = structuredClone(input);
  const reads = calculateBahdanauRead(input);
  // First annotation U[.4,-.2]=[.3,-.3]; W[-.6]=[-.6,.3].
  near(reads[0].energies[0], 1.2 * Math.tanh(-0.3));
  assert.deepEqual(reads[0].queryProjection, [-0.6, 0.3]);
  assert.deepEqual(reads[1].queryProjection, [0.7, -0.35]);
  assert.deepEqual(reads[0].annotationProjections, reads[1].annotationProjections);
  assert.notDeepEqual(reads[0].weights, reads[1].weights);
  for (const read of reads) {
    near(read.weights.reduce((a, b) => a + b), 1);
    assert.equal(read.weights.length, 3);
    assert.equal(read.context.length, 2);
    for (let coordinate = 0; coordinate < 2; coordinate++) {
      near(read.context[coordinate], read.contributions.reduce((sum, row) => sum + row[coordinate], 0));
      const values = input.annotations.map((row) => [...row.forward, ...row.backward][coordinate]);
      assert.ok(read.context[coordinate] >= Math.min(...values) && read.context[coordinate] <= Math.max(...values));
    }
    assert.ok(read.contributions.some((row) => row.some((value) => value < 0)));
  }
  assert.deepEqual(input, snapshot);
});

test("equal scores and identical annotations prevent obligatory-focus-change stories", () => {
  const uniform = calculateBahdanauRead(scenario("bahdanau-uniform"));
  for (const read of uniform) {
    for (const weight of read.weights) near(weight, 1 / 3);
    near(read.context[0], 0.3);
    near(read.context[1], 1 / 6);
  }
  const identical = calculateBahdanauRead(scenario("bahdanau-identical"));
  for (const read of identical) {
    for (const weight of read.weights) near(weight, 1 / 3);
    near(read.context[0], 0.4);
    near(read.context[1], -0.2);
  }
  assert.notDeepEqual(identical[0].energies, identical[1].energies);
  assert.deepEqual(identical[0].context, identical[1].context);
});

test("stable softmax preserves common-offset invariance without overflowing", () => {
  const values = [-0.7, 0.1, 1.3];
  const ordinary = stableSoftmax(values);
  const shifted = stableSoftmax(values.map((value) => value + 1000));
  ordinary.weights.forEach((weight, index) => near(weight, shifted.weights[index]));
  assert.throws(() => stableSoftmax([]), /finite/);
  assert.throws(() => stableSoftmax([NaN]), /finite/);
});

test("wrong axes, generated-state attribution and transplanted mechanisms are rejected", () => {
  for (const [key, value] of [["normalizationAxis", "target-vocabulary"], ["stateProvenance", "trained-decoder-states"]]) {
    const input = scenario("bahdanau-two-reads");
    input[key] = value;
    assert.throws(() => calculateBahdanauRead(input), /source normalization and supplied prior/);
  }
  for (const [id, field] of [["cho-reset-placement", "forgetGate"], ["bahdanau-two-reads", "heads"], ["bahdanau-two-reads", "outputProbabilities"]]) {
    const modified = structuredClone(fixture);
    modified.scenarios.find((item) => item.id === id)[field] = 1;
    assert.equal(validateSchema(modified), false);
  }
  assert.throws(() => calculateAlignmentScenario({ kind: "luong-local-p" }), /not admitted/);
});

test("corrupted expected values, identity and provenance fail the calculation contract", () => {
  const changed = structuredClone(fixture);
  changed.scenarios.find((item) => item.id === "bahdanau-two-reads").expected[0].weights[0] += 0.001;
  assert.throws(() => validateAlignmentFixture(changed), /Expected arithmetic/);
  const duplicate = structuredClone(fixture);
  duplicate.scenarios[1].id = duplicate.scenarios[0].id;
  assert.throws(() => validateAlignmentFixture(duplicate), /unique/);
  const learned = structuredClone(fixture);
  learned.provenance = "paper-parameters";
  assert.throws(() => validateAlignmentFixture(learned), /synthetic provenance/);
});

test("mislabelled safeguard cases fail even if their altered arithmetic is self-consistent", () => {
  const altered = structuredClone(fixture);
  const uniform = altered.scenarios.find((item) => item.id === "bahdanau-uniform");
  uniform.scoreVector[0] = 1;
  uniform.expected = calculateBahdanauRead(uniform);
  assert.throws(() => validateAlignmentFixture(altered), /Equal-energy safeguard/);
  const alteredIdentical = structuredClone(fixture);
  const identical = alteredIdentical.scenarios.find((item) => item.id === "bahdanau-identical");
  identical.annotations[0].forward[0] = -0.4;
  identical.expected = calculateBahdanauRead(identical);
  assert.throws(() => validateAlignmentFixture(alteredIdentical), /Identical-annotation safeguard/);
});
