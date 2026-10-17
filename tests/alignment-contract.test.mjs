import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { ALIGNMENT_WORK_IDS, validateAlignmentContract } from "../src/lib/alignment-contract.ts";
import { getBuiltReferenceWorkIds, getBuiltStagePaths, getJourneyOverview, getStageView, getWorkLearningRoutes } from "../src/lib/site-data.ts";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const corpus = read("../data/corpus.json");
const manifest = read("../data/journeys/encoder-decoder-alignment.json");
const fixture = read("../data/fixtures/encoder-decoder-alignment.json");

test("the manifest binds all 65 claims, 21 versions and eight distinct mode objectives", () => {
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(read("../schemas/journey.schema.json"));
  assert.ok(validate(manifest), JSON.stringify(validate.errors));
  validateAlignmentContract(corpus, manifest, fixture);
  assert.deepEqual(manifest.stages.map((stage) => stage.workId), ALIGNMENT_WORK_IDS);
  const claims = corpus.claims.filter((claim) => ALIGNMENT_WORK_IDS.includes(claim.workId));
  assert.equal(claims.length, 65);
  assert.equal(new Set(manifest.stages.flatMap((stage) => stage.blocks.expert.flatMap((block) => block.claimIds))).size, 65);
  assert.equal(corpus.works.filter((work) => ALIGNMENT_WORK_IDS.includes(work.id)).reduce((n, work) => n + work.versions.length, 0), 21);
  assert.equal(new Set(manifest.stages.flatMap((stage) => Object.values(stage.objectiveIds))).size, 8);
  for (const stage of manifest.stages) {
    assert.notDeepEqual(stage.blocks.beginner.map((block) => block.kind), stage.blocks.expert.map((block) => block.kind));
    for (const block of [...stage.blocks.beginner, ...stage.blocks.expert]) {
      assert.ok(block.claimIds.length > 0);
      for (const id of block.claimIds) assert.equal(corpus.claims.find((claim) => claim.id === id).workId, stage.workId);
    }
  }
});

test("the reviewed Cho and Sutskever chapters become available in both modes and the source register", () => {
  assert.equal(getJourneyOverview("encoder-decoder-alignment").stages.length, 4);
  assert.deepEqual(getBuiltStagePaths("encoder-decoder-alignment"), [
    { params: { mode: "beginner", stage: "cho-2014" } },
    { params: { mode: "expert", stage: "cho-2014" } },
    { params: { mode: "beginner", stage: "sutskever-2014" } },
    { params: { mode: "expert", stage: "sutskever-2014" } },
  ]);
  const cho = manifest.stages[0];
  assert.equal(cho.status, "built");
  assert.ok(getBuiltReferenceWorkIds().includes(cho.workId));
  for (const mode of ["beginner", "expert"]) {
    const view = getStageView(mode, cho.slug, manifest.id);
    assert.equal(view.evidence.length, 14);
    assert.deepEqual(view.conditionalOutput, fixture.scenarios.find((item) => item.kind === "conditional-output"));
    assert.deepEqual(view.choReset, fixture.scenarios.find((item) => item.kind === "cho-reset"));
    assert.deepEqual(view.interludes.map((item) => item.id), ["conditional-sequence-prerequisite"]);
    assert.equal(view.next.href, `/journeys/${manifest.id}/${mode}/sutskever-2014/`);
    assert.equal(view.alternateMode.href, `/journeys/${manifest.id}/${mode === "beginner" ? "expert" : "beginner"}/cho-2014/`);
    assert.equal(getWorkLearningRoutes(cho.workId)[mode].href, `/journeys/${manifest.id}/${mode}/cho-2014/`);
  }
  assert.match(getWorkLearningRoutes("mikolov-2010-recurrent-neural-language-model").expert.href, /recurrent-memory\/expert\/mikolov-2010\/$/);
  for (const stage of manifest.stages.slice(2)) {
    assert.equal(stage.status, "planned");
    assert.ok(!getBuiltReferenceWorkIds().includes(stage.workId));
    for (const mode of ["beginner", "expert"]) assert.throws(() => getStageView(mode, stage.slug, manifest.id), /not built yet/);
    assert.throws(() => getWorkLearningRoutes(stage.workId), /No built learning route/);
  }
  assert.ok(getBuiltReferenceWorkIds().includes("graves-2013-generating-sequences-recurrent-neural-networks"));
  for (const mode of ["beginner", "expert"]) {
    const view = getStageView(mode, "sutskever-2014", manifest.id);
    assert.equal(view.evidence.length, 15);
    assert.deepEqual(view.sourceReversal, fixture.scenarios.find((item) => item.kind === "source-reversal"));
    assert.deepEqual(view.interludes.map((item) => item.id), ["graves-formulation-prerequisite"]);
    assert.equal(view.previous.href, `/journeys/${manifest.id}/${mode}/cho-2014/`);
    assert.equal(view.next, undefined);
    assert.equal(getWorkLearningRoutes(view.work.id)[mode].href, `/journeys/${manifest.id}/${mode}/sutskever-2014/`);
    assert.equal(getWorkLearningRoutes("graves-2013-generating-sequences-recurrent-neural-networks")[mode].href, `/journeys/${manifest.id}/${mode}/sutskever-2014/#graves-formulation-prerequisite`);
  }
});

test("conditional and Graves bridges retain separate source scopes and owning stages", () => {
  assert.deepEqual(manifest.interludes.map((item) => [item.id, item.stageSlug]), [
    ["conditional-sequence-prerequisite", "cho-2014"],
    ["graves-formulation-prerequisite", "sutskever-2014"],
    ["graves-window-comparison", "bahdanau-2014-2015"],
  ]);
  for (const bridge of manifest.interludes) {
    for (const block of [...bridge.blocks.beginner, ...bridge.blocks.expert]) {
      for (const id of block.claimIds) assert.ok(bridge.workIds.includes(corpus.claims.find((claim) => claim.id === id).workId));
    }
  }
  assert.equal(manifest.interludes[0].relatedJourneyId, "recurrent-memory");
  const formulationClaims = manifest.interludes[1].blocks.expert.flatMap((block) => block.claimIds);
  assert.ok(formulationClaims.includes("sutskever-2014-graves-lstm-formulation"));
  assert.ok(!formulationClaims.includes("graves-2013-monotonic-window-mechanism"));
});

test("teaching order neither rewrites posting order nor creates a causal parallel edge", () => {
  const works = manifest.stages.map((stage) => corpus.works.find((work) => work.id === stage.workId));
  const dates = works.map((work) => work.chronology.events.find((event) => event.id === work.chronology.orderingEventId).date.value);
  assert.deepEqual(dates, ["2014-06-03", "2014-09-10", "2014-09-01", "2015-08-17"]);
  const internal = corpus.relationships.filter((edge) => ALIGNMENT_WORK_IDS.includes(edge.from.id) && ALIGNMENT_WORK_IDS.includes(edge.to.id));
  assert.equal(internal.length, 4);
  const parallel = internal.find((edge) => edge.id === "cho-2014-to-sutskever-2014");
  assert.equal(parallel.evidenceClass, "editorial-synthesis");
  assert.equal(parallel.causalLanguage, "prohibited");
  assert.ok(internal.filter((edge) => edge !== parallel).every((edge) => edge.evidenceClass === "documented-influence" && edge.causalLanguage === "qualified"));
});

test("omitted evidence and swapped objective or calculation versions fail before page generation", () => {
  const incomplete = structuredClone(manifest);
  incomplete.stages[0].blocks.expert.pop();
  assert.throws(() => validateAlignmentContract(corpus, incomplete, fixture), /complete source-scoped inventory/);
  const wrongMode = structuredClone(manifest);
  wrongMode.stages[0].objectiveIds.beginner = wrongMode.stages[0].objectiveIds.expert;
  assert.throws(() => validateAlignmentContract(corpus, wrongMode, fixture), /beginner objective/);
  const swapped = structuredClone(fixture);
  swapped.bindings.find((binding) => binding.id === "bahdanau-v5-read").versionIds = ["bahdanau-2014-arxiv-v7-version"];
  assert.throws(() => validateAlignmentContract(corpus, manifest, swapped), /versions/);
  const transplant = structuredClone(fixture);
  transplant.scenarios.find((scenario) => scenario.kind === "cho-reset").sourceStage = "luong-2015";
  assert.throws(() => validateAlignmentContract(corpus, manifest, transplant), /different source stage/);
  const foreignClaim = structuredClone(fixture);
  foreignClaim.bindings[0].claimIds.push("luong-2015-global-attention");
  assert.throws(() => validateAlignmentContract(corpus, manifest, foreignClaim), /operation claims/);
  const empiricalClaim = structuredClone(fixture);
  empiricalClaim.bindings[0].claimIds.push("cho-2014-bleu-results");
  assert.throws(() => validateAlignmentContract(corpus, manifest, empiricalClaim), /operation claims/);
});
