import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateParikh, calculateParikhIntra, validateParikhExpected } from "../src/lib/parikh-engine.ts";

const fixture = JSON.parse(readFileSync(new URL("../data/fixtures/parikh-attention.json", import.meta.url), "utf8"));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
const vectorClose = (a, b) => { assert.equal(a.length, b.length); a.forEach((value, i) => close(value, b[i])); };
const permutations = (items) => items.length ? items.flatMap((item, i) => permutations(items.filter((_, j) => i !== j)).map((rest) => [item, ...rest])) : [[]];

test("complete forward ledgers agree with independently derived Decimal arithmetic", () => {
  validateParikhExpected(fixture);
  const r = calculateParikh(fixture);
  assert.deepEqual(r.scores, [[0, 0, 0], [0, 0, Math.log(2)]]);
  vectorClose(r.beta[0].weights, [1 / 3, 1 / 3, 1 / 3]);
  vectorClose(r.beta[1].weights, [1 / 4, 1 / 4, 1 / 2]);
  vectorClose(r.alpha[0].weights, [1 / 2, 1 / 2]);
  vectorClose(r.alpha[1].weights, [1 / 2, 1 / 2]);
  vectorClose(r.alpha[2].weights, [1 / 3, 2 / 3]);
  vectorClose(r.beta[0].context, [Math.log(2) / 3, 0]);
  vectorClose(r.beta[1].context, [Math.log(2) / 2, -1 / 4]);
  vectorClose(r.alpha[2].context, [2 / 3, -2 / 3]);
  for (const read of [...r.beta, ...r.alpha]) {
    close(read.weights.reduce((a, b) => a + b), 1);
    read.context.forEach((value, j) => close(value, read.contributions.reduce((sum, row) => sum + row[j], 0)));
  }
  assert.ok(r.beta[1].contributions.some((row) => row.some((value) => value < 0)));
  assert.equal(r.classScores.length, 3);
  assert.ok(r.classScores.some((score) => score < 0)); // Scores are not a probability distribution.
});

test("every independent within-sentence permutation preserves identity-specific reads and final scores", () => {
  const original = calculateParikh(fixture);
  for (const a of permutations(fixture.a)) for (const b of permutations(fixture.b)) {
    const result = calculateParikh({ ...fixture, a, b });
    vectorClose(result.classScores, original.classScores);
    vectorClose(result.sumA, original.sumA); vectorClose(result.sumB, original.sumB);
    a.forEach((token, i) => vectorClose(result.beta[i].context, original.beta[fixture.a.findIndex((t) => t.id === token.id)].context));
    b.forEach((token, j) => vectorClose(result.alpha[j].context, original.alpha[fixture.b.findIndex((t) => t.id === token.id)].context));
  }
  const swapped = calculateParikh({ ...fixture, a: fixture.b, b: fixture.a });
  assert.notDeepEqual(swapped.classScores, original.classScores); // Premise/hypothesis roles remain ordered.
});

test("corrected distance biases survive normalization and depend on the new token positions", () => {
  const r = calculateParikhIntra(fixture);
  vectorClose(r.reads[0].weights, [4 / 7, 2 / 7, 1 / 7]);
  // The first row has zero content scores. Repeating d_(i-j) in every
  // denominator term, as v1 prints, cancels that term and gives 1/3 each.
  assert.notDeepEqual(r.reads[0].weights, [1 / 3, 1 / 3, 1 / 3]);
  for (const row of r.reads) close(row.weights.reduce((a, b) => a + b), 1);
  const changed = structuredClone(fixture);
  changed.intra.tokens = [fixture.intra.tokens[1], fixture.intra.tokens[0], fixture.intra.tokens[2]];
  assert.notDeepEqual(calculateParikhIntra(changed).reads[1].context, r.reads[0].context);
  const shifted = structuredClone(fixture);
  for (const key of Object.keys(shifted.intra.distanceBias)) shifted.intra.distanceBias[key] += 1000;
  calculateParikhIntra(shifted).reads.forEach((row, i) => vectorClose(row.weights, r.reads[i].weights));
});

test("uniform scores and identical values preserve their separate invariants", () => {
  const uniform = structuredClone(fixture);
  uniform.f[1].weights = [[0, 0], [0, 0]];
  const u = calculateParikh(uniform);
  u.beta.forEach((row) => vectorClose(row.weights, [1 / 3, 1 / 3, 1 / 3]));
  u.alpha.forEach((row) => vectorClose(row.weights, [1 / 2, 1 / 2]));
  const identical = structuredClone(fixture);
  identical.b.forEach((token) => { token.vector = [2, -3]; });
  calculateParikh(identical).beta.forEach((row) => vectorClose(row.context, [2, -3]));
});

test("empty, ragged, mismatched, nonfinite and historical-variant inputs are rejected", () => {
  const cases = [
    [(f) => { f.a = []; }, /nonempty bank/],
    [(f) => { f.b[1].vector.pop(); }, /shapes/],
    [(f) => { f.a.forEach((t) => t.vector.push(0)); }, /shapes/],
    [(f) => { f.g[0].weights[0].pop(); }, /shape/],
    [(f) => { f.f.pop(); }, /two shared/],
    [(f) => { f.a[1].vector[0] = NaN; }, /finite/],
    [(f) => { f.output.bias[0] = Infinity; }, /finite/],
    [(f) => { f.f[0].weights[0][0] = Number.MAX_VALUE; f.a[1].vector[0] = 2; }, /finite/],
    [(f) => { f.b[1].id = f.b[0].id; }, /unique/],
    [(f) => { f.variant = "arxiv-v1"; }, /corrected/],
  ];
  for (const [mutate, message] of cases) { const f = structuredClone(fixture); mutate(f); assert.throws(() => calculateParikh(f), message); }
  for (const mutate of [
    (f) => { delete f.intra.distanceBias["-1"]; },
    (f) => { f.intra.distanceBias["10"] = 0; },
    (f) => { f.intra.tokens = []; },
    (f) => { f.intra.distanceBias["0"] = -Infinity; },
  ]) { const f = structuredClone(fixture); mutate(f); assert.throws(() => calculateParikhIntra(f)); }
});

test("changed expected values, missing intermediate terms and fabricated shapes fail", () => {
  for (const mutate of [
    (f) => { f.expected.alpha[2].weights[0] = 0.5; },
    (f) => { delete f.expected.comparisonA[0].layers[0].affine; },
    (f) => { f.expected.beta[0].contributions.pop(); },
    (f) => { f.intra.expected.reads[0].normalizer = Infinity; },
  ]) { const f = structuredClone(fixture); mutate(f); assert.throws(() => validateParikhExpected(f)); }
});
