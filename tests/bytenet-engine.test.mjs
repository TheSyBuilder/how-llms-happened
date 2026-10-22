import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateByteNetReach, calculateByteNetUnfolding, validateByteNetExpected } from "../src/lib/bytenet-engine.ts";
import { validateByteNetContract } from "../src/lib/sequence-contract.ts";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const fixture = read("../data/fixtures/bytenet-reach.json");
const corpus = read("../data/corpus.json");

test("all finite access ledgers agree with independently enumerated complete paths", () => {
  validateByteNetContract(corpus, fixture);
  validateByteNetExpected(fixture);
  const r = calculateByteNetReach(fixture);
  assert.equal([...r.encoder, ...r.decoder].reduce((n, layer) => n + layer.rows.length, 0), 90);
  assert.deepEqual(r.encoder.map((l) => l.span), [3, 7, 15, 31, 63, 65]);
  assert.deepEqual(r.decoder.map((l) => l.span), [3, 7, 15, 31, 63, 65]);
  assert.deepEqual(r.encoder.at(-1).infiniteOffsets, Array.from({ length: 65 }, (_, i) => i - 32));
  assert.deepEqual(r.decoder.at(-1).infiniteOffsets, Array.from({ length: 65 }, (_, i) => i - 64));
});

test("sparse direct taps, cumulative reach and boundary zeros remain distinct across reset", () => {
  const r = calculateByteNetReach(fixture);
  assert.deepEqual(r.encoder[1].rows[0], { position: 0, predecessors: [0, 2], zeroPadding: [-2], inputSlots: [0, 1, 2, 3] });
  assert.deepEqual(r.decoder[1].rows[4], { position: 4, predecessors: [0, 2, 4], zeroPadding: [], inputSlots: [0, 1, 2, 3, 4] });
  assert.deepEqual(r.encoder[4].offsets, [-16, 0, 16]);
  assert.deepEqual(r.encoder[4].rows[3].predecessors, [3]);
  assert.deepEqual(r.encoder[4].rows[3].zeroPadding, [-13, 19]);
  assert.deepEqual(r.encoder[4].rows[3].inputSlots, [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(r.decoder[4].offsets, [-32, -16, 0]);
  assert.deepEqual(r.decoder[5].offsets, [-2, -1, 0]);
  assert.deepEqual(r.decoder[5].rows[4].predecessors, [2, 3, 4]);
  assert.equal(r.decoder[5].span - r.decoder[4].span, 2);
  assert.equal(r.decoder[5].rows[0].inputSlots.length, 1);
  assert.equal(r.decoder[5].rows[8].inputSlots.length, 9);
});

test("every target path is causal under the explicit prediction shift", () => {
  const r = calculateByteNetReach(fixture);
  for (const layer of r.decoder) for (const row of layer.rows) {
    assert.ok(row.predecessors.every((p) => p <= row.position));
    assert.ok(row.inputSlots.every((p) => p <= row.position));
    assert.ok(row.zeroPadding.every((p) => p < 0));
  }
  for (const row of r.sourceReads) {
    assert.equal(row.inputIndex, row.row);
    assert.equal(row.predictedIndex, row.row + 1);
    assert.ok(r.decoder.at(-1).rows[row.row].inputSlots.every((p) => p < row.predictedIndex));
  }
  // A source column already encodes later source tokens; source access is not triangular.
  assert.deepEqual(r.sourceReads[0].reachableEncoderColumns, [0]);
  assert.deepEqual(r.sourceReads[0].sourceTokenSlots, [0, 1, 2, 3, 4]);
  assert.deepEqual(r.sourceReads[0].sourcePaddingSlots, [5]);
  // No aligned current column beyond width, while earlier columns remain reachable.
  assert.equal(r.sourceReads[6].alignedEncoderColumn, null);
  assert.deepEqual(r.sourceReads[6].reachableEncoderColumns, [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(r.sourceReads[8].sourceTokenSlots, [0, 1, 2, 3, 4]);
});

test("longer finite banks retain the same unrestricted span without granting future access", () => {
  const r = calculateByteNetReach({ ...fixture, sourceLength: 64, encoderWidth: 64, decoderWidth: 64 });
  assert.deepEqual(r.decoder[4].rows[40].predecessors, [8, 24, 40]);
  assert.deepEqual(r.decoder[5].rows[40].predecessors, [38, 39, 40]);
  assert.deepEqual(r.decoder[5].rows[63].inputSlots, Array.from({ length: 64 }, (_, i) => i));
  assert.deepEqual(r.encoder[5].rows[0].inputSlots, Array.from({ length: 33 }, (_, i) => i));
});

test("EOS can occur before, at or beyond the estimate; missing EOS remains incomplete", () => {
  const results = fixture.unfolding.map((example) => calculateByteNetUnfolding(fixture, example));
  assert.deepEqual(results.map((r) => r.status), ["eos", "eos", "eos", "incomplete", "unresolved-width"]);
  assert.deepEqual(results.map((r) => r.steps.length), [2, 6, 8, 8, 0]);
  assert.equal(results[2].steps[5].alignedEncoderColumn, 5);
  assert.equal(results[2].steps[6].alignedEncoderColumn, null);
  assert.equal(results[2].steps[7].stop, true);
  assert.equal(results[3].steps.at(-1).stop, false);
  assert.equal(results[4].estimate, 4.8);
  for (const r of results) r.steps.forEach((step, i) => {
    assert.equal(step.inputToken, i === 0 ? "BOS" : r.steps[i - 1].outputToken);
    assert.equal(step.predictedIndex, i + 1);
  });
});

test("historical, shifted, future-tap, dimension and nonfinite substitutions fail", () => {
  for (const mutate of [
    (f) => { f.variant = "arxiv-v1"; },
    (f) => { f.conventions.decoderOffsets = [-1, 0, 1]; },
    (f) => { f.conventions.inputShift = "unshifted"; },
    (f) => { f.conventions.sourceInjection = "every-layer"; },
    (f) => { f.conventions.block = "multiplicative-language-model"; },
    (f) => { f.conventions.boundary = "wraparound"; },
    (f) => { f.dilations[5] = 32; },
    (f) => { f.dilations.pop(); },
    (f) => { f.decoderWidth = 0; },
    (f) => { f.encoderWidth = 4; },
    (f) => { f.sourceLength = 3.5; },
    (f) => { f.decoderWidth = Infinity; },
    (f) => { f.dilations[0] = NaN; },
    (f) => { f.encoderWidth = 1000000; },
  ]) { const f = structuredClone(fixture); mutate(f); assert.throws(() => calculateByteNetReach(f)); }
});

test("rounding, width mismatch, after-EOS output and changed parameters fail", () => {
  for (const [index, mutate] of [
    [4, (e) => { e.representationWidth = 5; }],
    [4, (e) => { e.generated = ["EOS"]; }],
    [0, (e) => { e.representationWidth = 7; }],
    [0, (e) => { e.generated.push("later"); }],
    [0, (e) => { e.generated = ["BOS"]; }],
    [0, (e) => { e.generated = [""]; }],
    [0, (e) => { e.factor = NaN; }],
    [0, (e) => { e.factor = Infinity; }],
    [0, (e) => { e.intercept = 1; }],
    [0, (e) => { e.sourceLength = 0; }],
  ]) { const e = structuredClone(fixture.unfolding[index]); mutate(e); assert.throws(() => calculateByteNetUnfolding(fixture, e)); }
});

test("closed ledger and evidence binding reject omitted terms, source swaps and hidden fields", () => {
  for (const mutate of [
    (f) => { f.expected.decoder[5].rows[0].inputSlots.push(1); },
    (f) => { f.expected.encoder[4].rows[3].zeroPadding.pop(); },
    (f) => { delete f.expected.sourceReads[6].reachableEncoderColumns; },
    (f) => { f.expected.decoder[5].span = 127; },
    (f) => { f.expected.sourceReads[0].sourceTokenSlots = [0]; },
    (f) => { f.expected.encoder[0].rows[0].weight = 0.5; },
    (f) => { f.unfolding[0].expected.steps[0].predictedIndex = 0; },
    (f) => { f.unfolding[4].expected.estimate = Infinity; },
    (f) => { f.unfolding.pop(); },
    (f) => { f.unfolding[1].id = f.unfolding[0].id; },
    (f) => { f.binding.sourceId = f.contrast.sourceId; },
    (f) => { f.contrast.versionId = f.binding.versionId; },
    (f) => { f.binding.claimIds[0] = "kalchbrenner-2016-translation-results"; },
    (f) => { f.contrast.claimIds.pop(); },
    (f) => { f.provenance = "paper-experiment"; },
    (f) => { f.conventions.rounding = "ceil"; },
    (f) => { f.encoderWidth = 7; },
  ]) { const f = structuredClone(fixture); mutate(f); assert.throws(() => validateByteNetContract(corpus, f)); }
  for (const mutate of [
    (c) => { c.sources.find((s) => s.id === fixture.binding.sourceId).versionIds = []; },
    (c) => { c.claims.find((c) => c.id === fixture.contrast.claimIds[0]).evidence = []; },
  ]) { const c = structuredClone(corpus); mutate(c); assert.throws(() => validateByteNetContract(c, fixture)); }
});
