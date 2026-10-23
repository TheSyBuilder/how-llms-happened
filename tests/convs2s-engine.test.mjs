import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateConvS2S, validateConvS2SExpected } from "../src/lib/convs2s-engine.ts";
import { validateConvS2SContract } from "../src/lib/sequence-contract.ts";
const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const fixture = read("../data/fixtures/convs2s-layers.json");
const corpus = read("../data/corpus.json");
const near = (a, b, epsilon = 2e-12) => assert.ok(Math.abs(a - b) < epsilon, `${a} != ${b}`);

test("all paper reads, signed terms and two Lua layers agree with independent Decimal arithmetic", () => {
  validateConvS2SContract(corpus, fixture);
  validateConvS2SExpected(fixture);
  const r = calculateConvS2S(fixture);
  assert.equal(r.luaLayers.reduce((n, l) => n + l.rows.length, 0), 8);
  assert.deepEqual(r.targetEmbeddings[0], [0.2, 0]);
  near(r.paperValues[1][0], 0.3); near(r.paperValues[1][1], 0.4);
  assert.deepEqual(r.luaLayers[0].rows[0].a, [0.2, 0]);
  assert.deepEqual(r.luaLayers[0].rows[0].b, [0, -0.05]);
  assert.deepEqual(r.luaLayers[0].rows[0].glu, [0.1, 0]);
  near(r.luaLayers[1].rows[3].output[0], 1.5755120569988463);
  assert.ok(r.luaLayers[0].rows[2].glu[0] < 0, "GLU retains signed A; no tanh or ReLU substitution");
});

test("paper crop prose and Torch negative-length indexing are not silently equated", () => {
  const r = calculateConvS2S(fixture);
  assert.deepEqual(r.crop, { paddedLength: 8, convolutionLength: 6, literalPaperLength: 3, luaLength: 4, removedLuaRows: [4, 5] });
  assert.deepEqual(r.luaLayers[0].rows[0].window, [0, 0, 0, 0, 0.2, 0]);
  assert.deepEqual(r.luaLayers[0].rows[1].zeroPadding, [-1]);
  assert.deepEqual(r.luaLayers[0].rows[3].predecessors, [1, 2, 3]);
  assert.deepEqual(r.encoderReach.map((l) => l.span), [3, 5]);
  assert.deepEqual(r.encoderReach[0].rows[0].inputSlots, [0, 1]);
  assert.deepEqual(r.encoderReach[1].rows[0].inputSlots, [0, 1, 2]);
  assert.deepEqual(r.decoderReach[1].rows[3].inputSlots, [0, 1, 2, 3]);
  for (const layer of r.luaLayers) for (const row of layer.rows) {
    assert.equal(row.predictedIndex, row.row + 1);
    assert.ok(row.predecessors.every((i) => i < row.predictedIndex));
  }
});

test("altering or appending future targets cannot change either layer's past outputs", () => {
  const original = calculateConvS2S(fixture);
  for (let boundary = 1; boundary < fixture.target.length; boundary++) {
    const f = structuredClone(fixture);
    f.target.slice(boundary).forEach((t) => { t.word = [100, -80]; t.position = [-7, 9]; });
    const changed = calculateConvS2S(f);
    for (let l = 0; l < 2; l++) assert.deepEqual(changed.luaLayers[l].rows.slice(0, boundary), original.luaLayers[l].rows.slice(0, boundary));
  }
  const f = structuredClone(fixture);
  f.target.push({ id: "T4", token: "y4", word: [90, -99], position: [1, 2] });
  const extended = calculateConvS2S(f);
  for (let l = 0; l < 2; l++) assert.deepEqual(extended.luaLayers[l].rows.slice(0, 4), original.luaLayers[l].rows);
});

test("keys determine scores, z plus e determines values, and later layers receive prior reads", () => {
  const original = calculateConvS2S(fixture);
  const f = structuredClone(fixture); f.source[1].word[0] += 2;
  const changed = calculateConvS2S(f);
  for (let i = 0; i < 4; i++) {
    assert.deepEqual(changed.luaLayers[0].rows[i].read.weights, original.luaLayers[0].rows[i].read.weights);
    assert.notDeepEqual(changed.luaLayers[0].rows[i].read.context, original.luaLayers[0].rows[i].read.context);
  }
  assert.notDeepEqual(changed.luaLayers[1].rows[0].read.weights, original.luaLayers[1].rows[0].read.weights);
  assert.notDeepEqual(original.luaLayers[1].rows[0].read.weights, original.luaLayers[0].rows[0].read.weights);
  assert.ok(original.luaLayers.every((l) => l.rows[0].read.weights.length === 3 && l.rows[0].read.weights.every((v) => v > 0)), "source bank is global even at BOS");
});

test("uniform scores and identical values expose normalization and context invariants", () => {
  const f = structuredClone(fixture);
  f.paperStates.forEach((p) => {
    p.projection.weights = [[0, 0], [0, 0]];
    const t = f.target[p.embeddingRow]; p.projection.bias = t.word.map((x, j) => -x - t.position[j]);
  });
  const uniform = calculateConvS2S(f);
  for (const r of uniform.paperReads) {
    r.weights.forEach((w) => near(w, 1 / 3));
    near(r.context[0], 0.4); near(r.context[1], 1.85 / 3);
    near(r.scaledContext[0], 0.4 * Math.sqrt(3));
  }
  const identical = structuredClone(fixture);
  identical.source.forEach((t) => { t.word = t.key.map((x, j) => [0.75, -0.5][j] - x - t.position[j]); });
  const result = calculateConvS2S(identical);
  assert.notDeepEqual(result.paperReads[0].weights, result.paperReads[1].weights);
  for (const r of result.paperReads) { near(r.context[0], 0.75); near(r.context[1], -0.5); }
});

test("paper query/value sums and Lua variance factors retain separate ledgers", () => {
  const r = calculateConvS2S(fixture);
  near(r.paperReads[0].query[0], 1.45); near(r.paperReads[0].query[1], -0.65);
  assert.deepEqual(r.paperReads[0].query, r.paperReads[0].querySum);
  for (const layer of r.luaLayers) for (const row of layer.rows) {
    for (let j = 0; j < 2; j++) {
      near(row.read.query[j], row.read.querySum[j] * Math.SQRT1_2);
      near(row.attentionResidual[j], row.attentionSum[j] * Math.SQRT1_2);
      near(row.output[j], row.residualSum[j] * Math.SQRT1_2);
      near(row.read.scaledContext[j], row.read.context[j] * Math.sqrt(3));
    }
    near(row.read.weights.reduce((s, x) => s + x, 0), 1);
  }
  near(r.luaValues[0][0], r.paperValues[0][0] * Math.SQRT1_2);
});

test("the Lua wrapper scales parameter accumulation, excludes embedding gradients and preserves forward values", () => {
  const g = calculateConvS2S(fixture).gradient;
  assert.equal(g.moduleCount, 2); assert.equal(g.paperModuleCount, 2);
  assert.equal(g.luaParameterScale, 1 / (2 * g.moduleCount));
  assert.deepEqual(g.parameterOutput, [2, -1]);
  assert.deepEqual(g.embeddingOutput, [3, -2]); assert.equal(g.forwardScale, 1);
  const f = structuredClone(fixture); f.gradientInputs.parameters = [-12, 4];
  const changed = calculateConvS2S(f);
  assert.deepEqual(changed.gradient.parameterOutput, [-3, 1]);
  assert.deepEqual(changed.luaLayers, calculateConvS2S(fixture).luaLayers);
});

test("variants, BOS, nonfinite values, invalid dimensions and forbidden source-bank conventions fail", () => {
  for (const mutate of [
    (f) => { f.variant = "paper-full-model"; },
    (f) => { f.conventions.stackOrder = "residual-before-attention"; },
    (f) => { f.conventions.sourceBank = "triangular"; },
    (f) => { f.conventions.inputShift = "unshifted"; },
    (f) => { f.conventions.embeddingProjection = "unreported-map"; },
    (f) => { f.target[0].token = "y1"; },
    (f) => { f.target[1].token = "BOS"; },
    (f) => { f.source = []; },
    (f) => { f.source[0].key.pop(); },
    (f) => { f.source[0].id = f.source[1].id; },
    (f) => { f.target[0].word[0] = Infinity; },
    (f) => { f.source[0].position[0] = NaN; },
    (f) => { f.layers[0].convolution.weights[0].pop(); },
    (f) => { f.layers[0].convolution.bias.pop(); },
    (f) => { f.layers.pop(); },
    (f) => { f.layers[0].query.weights[0][0] = 1e308; f.target[0].word[0] = 1e308; },
    (f) => { f.paperStates[0].embeddingRow = 4; },
    (f) => { f.paperStates[0].embeddingRow = 0.5; },
    (f) => { f.gradientInputs.embeddings[0] = NaN; },
  ]) { const f = structuredClone(fixture); mutate(f); assert.throws(() => calculateConvS2S(f)); }
});

test("closed source and ledger contracts reject revisions, invented padding and altered terms", () => {
  for (const mutate of [
    (f) => { f.binding.sourceId = f.contrast.sourceId; },
    (f) => { f.contrast.versionId = f.binding.versionId; },
    (f) => { f.binding.claimIds.pop(); },
    (f) => { f.implementation.revision = "main"; },
    (f) => { f.provenance = "paper-experiment"; },
    (f) => { f.source[0].padding = true; },
    (f) => { f.expected.luaLayers[0].rows[0].read.mask = [0]; },
    (f) => { f.expected.luaLayers[0].rows[0].convolution.terms[0][4] += 0.01; },
    (f) => { f.expected.crop.literalPaperLength = 4; },
    (f) => { f.expected.gradient.luaParameterScale = 0.5; },
    (f) => { f.expected.luaLayers[0].rows.pop(); },
    (f) => { f.expected.paperReads[0].weights[0] = Infinity; },
    (f) => { delete f.expected.paperReads[0].scaledContext; },
    (f) => { f.source.pop(); },
  ]) { const f = structuredClone(fixture); mutate(f); assert.throws(() => validateConvS2SContract(corpus, f)); }
  for (const mutate of [
    (c) => { c.sources.find((s) => s.id === fixture.binding.sourceId).versionIds = []; },
    (c) => { c.claims.find((s) => s.id === fixture.binding.claimIds[0]).evidence = []; },
    (c) => { c.claims.find((s) => s.id === fixture.contrast.claimIds[0]).evidence = []; },
  ]) { const c = structuredClone(corpus); mutate(c); assert.throws(() => validateConvS2SContract(c, fixture)); }
});
