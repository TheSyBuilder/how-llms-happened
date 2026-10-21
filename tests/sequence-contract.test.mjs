import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getSequenceSourcePlan, SEQUENCE_WORK_IDS, SEQUENCE_BRIDGE_WORK_IDS, validateSequenceContract } from "../src/lib/sequence-contract.ts";
import { getBuiltReferenceWorkIds, getWorkLearningRoutes } from "../src/lib/site-data.ts";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const corpus = read("../data/corpus.json");
const manifest = read("../data/journeys/sequence-computation.json");
const fixture = read("../data/fixtures/parikh-attention.json");

test("four planned mode paths assign every stage claim once and retain eight distinct objectives", () => {
  validateSequenceContract(corpus, manifest, fixture);
  assert.equal(manifest.stages.flatMap((s) => s.blocks.expert.flatMap((b) => b.claimIds)).length, 73);
  assert.equal(new Set(manifest.stages.flatMap((s) => Object.values(s.objectiveIds))).size, 8);
  const plan = getSequenceSourcePlan(corpus);
  const full = plan.references.filter((r) => SEQUENCE_WORK_IDS.includes(r.work.id));
  assert.equal(full.reduce((n, r) => n + r.work.versions.length, 0), 17);
  assert.equal(new Set(full.flatMap((r) => r.sources.map((s) => s.id))).size, 33);
  assert.equal(plan.references.reduce((n, r) => n + r.claims.length, 0), 103);
  assert.equal(plan.references.reduce((n, r) => n + r.work.versions.length, 0), 31);
  assert.equal(new Set(plan.references.flatMap((r) => r.sources.map((s) => s.id))).size, 58);
});

test("bounded prerequisites preserve complete references without importing all their teaching objectives", () => {
  const plan = getSequenceSourcePlan(corpus);
  for (const id of SEQUENCE_BRIDGE_WORK_IDS) {
    const record = plan.references.find((r) => r.work.id === id);
    assert.equal(record.claims.length, 15);
    assert.deepEqual(record.work, corpus.works.find((w) => w.id === id));
    assert.deepEqual(record.claims, corpus.claims.filter((c) => c.workId === id));
    record.sources.forEach((source) => assert.deepEqual(source, corpus.sources.find((s) => s.id === source.id)));
  }
  for (const bridge of manifest.interludes) {
    assert.equal(bridge.blocks.beginner.length, 1);
    assert.ok(bridge.blocks.expert[0].claimIds.length < 15);
  }
  for (const record of plan.references) for (const claim of record.claims) for (const evidence of claim.evidence) {
    assert.ok(record.sources.some((s) => s.id === evidence.sourceId), evidence.sourceId);
    assert.ok(evidence.locator.label);
    assert.ok(Array.isArray(claim.uncertainties));
  }
});

test("all admitted incoming relationships retain exact evidence class, causal permission and locators", () => {
  const plan = getSequenceSourcePlan(corpus);
  assert.equal(plan.relationships.length, 13);
  const ids = [...SEQUENCE_WORK_IDS, ...SEQUENCE_BRIDGE_WORK_IDS];
  const internal = plan.relationships.filter((r) => ids.includes(r.from.id));
  assert.equal(internal.length, 4);
  for (const edge of plan.relationships) assert.deepEqual(edge, corpus.relationships.find((r) => r.id === edge.id));
  assert.equal(plan.relationships.find((r) => r.id === "bahdanau-2014-to-kalchbrenner-2016").causalLanguage, "prohibited");
  const memory = internal.find((r) => r.id === "sukhbaatar-2015-to-gehring-2017");
  assert.equal(memory.evidenceClass, "editorial-synthesis");
  assert.equal(memory.causalLanguage, "prohibited");
  assert.deepEqual(internal.filter((r) => SEQUENCE_WORK_IDS.includes(r.from.id) && SEQUENCE_WORK_IDS.includes(r.to.id)).map((r) => r.id), ["gehring-2017-to-vaswani-2017"]);
});

test("planned source bundles create no public learning or reference destinations", () => {
  for (const id of [...SEQUENCE_WORK_IDS, ...SEQUENCE_BRIDGE_WORK_IDS]) {
    assert.ok(!getBuiltReferenceWorkIds().includes(id));
    assert.throws(() => getWorkLearningRoutes(id), /No built learning route/);
  }
  assert.equal(getBuiltReferenceWorkIds().length, 16);
});

test("omissions, foreign claims, wrong mode, duplicate ownership and premature built status fail", () => {
  for (const mutate of [
    (m) => { m.stages[0].blocks.expert.pop(); },
    (m) => { m.stages[0].blocks.beginner[0].claimIds.pop(); },
    (m) => { m.stages[0].objectiveIds.beginner = m.stages[0].objectiveIds.expert; },
    (m) => { m.stages[0].blocks.expert.push(m.stages[0].blocks.expert[0]); },
    (m) => { m.stages[0].contribution.claimIds = ["cheng-2016-lstmn-memory-tape"]; },
    (m) => { m.stages[1].status = "built"; },
    (m) => { m.stages.reverse(); },
    (m) => { m.interludes[0].stageSlug = "convs2s-2017"; },
    (m) => { m.interludes[1].blocks.expert[0].claimIds.push("sukhbaatar-2015-qa-results"); },
    (m) => { m.interludes[0].workIds.pop(); },
    (m) => { m.stages[1].blocks.expert[0].id = m.stages[0].blocks.expert[0].id; },
    (m) => { m.interludes[0].hiddenNotes = "unexpected"; },
  ]) { const m = structuredClone(manifest); mutate(m); assert.throws(() => validateSequenceContract(corpus, m, fixture)); }
});

test("closed source/variant/ledger shapes reject swapped provenance and unexplained fields", () => {
  for (const mutate of [
    (f) => { f.binding.versionId = "parikh-2016-arxiv-v1-version"; },
    (f) => { f.binding.sourceId = "parikh-2016-arxiv-v1-full-text"; },
    (f) => { f.binding.claimIds[0] = "parikh-2016-snli-results"; },
    (f) => { f.provenance = "paper-experiment"; },
    (f) => { f.a[0].padding = true; },
    (f) => { f.expected.beta[0].mask = []; },
    (f) => { f.expected.classScores = []; },
    (f) => { f.output.weights.pop(); f.output.bias.pop(); f.expected.classScores.pop(); },
    (f) => { f.intra.distanceBias["bucket-policy"] = 0; },
  ]) { const f = structuredClone(fixture); mutate(f); assert.throws(() => validateSequenceContract(corpus, manifest, f)); }
  const broken = structuredClone(corpus);
  broken.sources.find((s) => s.id === fixture.binding.sourceId).versionIds = [];
  assert.throws(() => validateSequenceContract(broken, manifest, fixture), /reciprocally/);
});
