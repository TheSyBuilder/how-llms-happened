import assert from "node:assert/strict";
import test from "node:test";
import {
  getBuiltReferenceWorkIds,
  getBuiltStagePaths,
  getJourneyOverview,
  getStageView,
  getWorkLearningRoutes,
} from "../src/lib/site-data.ts";

test("the recurrent journey exposes carried, protected, and adaptive state in both modes", () => {
  assert.equal(getJourneyOverview("recurrent-memory").stages.length, 6);
  assert.deepEqual(getBuiltStagePaths("recurrent-memory"), [
    { params: { mode: "beginner", stage: "elman-1988-1990" } },
    { params: { mode: "expert", stage: "elman-1988-1990" } },
    { params: { mode: "beginner", stage: "hochreiter-schmidhuber-1995-1997" } },
    { params: { mode: "expert", stage: "hochreiter-schmidhuber-1995-1997" } },
    { params: { mode: "beginner", stage: "gers-1999-2000" } },
    { params: { mode: "expert", stage: "gers-1999-2000" } },
  ]);
  for (const slug of getJourneyOverview("recurrent-memory").stages.slice(3).map((stage) => stage.slug)) {
    assert.throws(() => getStageView("beginner", slug, "recurrent-memory"), /not built yet/);
  }
  assert.throws(() => getStageView("expert", "elman-1988-1990"), /Unknown journey stage/);
});

test("Elman shares factual identity while mode tasks and source bindings differ", () => {
  const beginner = getStageView("beginner", "elman-1988-1990", "recurrent-memory");
  const expert = getStageView("expert", "elman-1988-1990", "recurrent-memory");
  assert.equal(beginner.work.id, expert.work.id);
  assert.notEqual(beginner.objective.id, expert.objective.id);
  assert.notDeepEqual(beginner.blocks.map((block) => block.id), expert.blocks.map((block) => block.id));
  assert.equal(expert.canonicalVersion.id, "elman-1990-cognitive-science-journal-version");
  assert.equal(expert.evidence.length, 10);
  assert.equal(beginner.alternateMode.href, "/journeys/recurrent-memory/expert/elman-1988-1990/");
  assert.equal(expert.alternateMode.href, "/journeys/recurrent-memory/beginner/elman-1988-1990/");
  for (const view of [beginner, expert]) {
    assert.equal(view.previous, undefined);
    assert.equal(view.next.href, `/journeys/recurrent-memory/${view.mode}/hochreiter-schmidhuber-1995-1997/`);
    assert.equal(view.elmanScenario.kind, "elman-history-contrast");
    assert.ok(view.blocks.every((block) => block.evidence.every((claim) => claim.workId === view.work.id)));
    assert.doesNotMatch(JSON.stringify(view.elmanScenario), /forgetGate|peephole|protectedLocalFactors/);
    assert.equal(view.katzFixture, undefined);
    assert.equal(view.originalCellScenario, undefined);
  }
});

test("every built work links back to its own chapter and journey", () => {
  const workIds = getBuiltReferenceWorkIds();
  assert.equal(workIds.length, 7);
  for (const journeyId of ["smoothing", "recurrent-memory"]) {
    for (const stage of getJourneyOverview(journeyId).stages.filter((item) => item.status === "built")) {
      const routes = getWorkLearningRoutes(stage.work.id);
      for (const mode of ["beginner", "expert"]) {
        assert.equal(routes[mode].href, `/journeys/${journeyId}/${mode}/${stage.slug}/`);
      }
    }
  }
  assert.throws(() => getWorkLearningRoutes("mikolov-2010-recurrent-language-model"), /No built learning route/);
});

test("original LSTM preserves source identity and mode-specific tasks", () => {
  const slug = "hochreiter-schmidhuber-1995-1997";
  const beginner = getStageView("beginner", slug, "recurrent-memory");
  const expert = getStageView("expert", slug, "recurrent-memory");
  assert.equal(beginner.work.id, expert.work.id);
  assert.equal(expert.canonicalVersion.id, "hochreiter-schmidhuber-1997-neural-computation-version");
  assert.equal(expert.evidence.length, 6);
  assert.notEqual(beginner.objective.id, expert.objective.id);
  assert.notDeepEqual(beginner.blocks.map((block) => block.id), expert.blocks.map((block) => block.id));
  assert.equal(beginner.alternateMode.href, `/journeys/recurrent-memory/expert/${slug}/`);
  assert.equal(expert.alternateMode.href, `/journeys/recurrent-memory/beginner/${slug}/`);
  for (const view of [beginner, expert]) {
    assert.equal(view.previous.href, `/journeys/recurrent-memory/${view.mode}/elman-1988-1990/`);
    assert.equal(view.next.href, `/journeys/recurrent-memory/${view.mode}/gers-1999-2000/`);
    assert.ok(view.blocks.every((block) => block.evidence.every((claim) => claim.workId === view.work.id)));
  }
});

test("the original-cell chapter receives only its protected-path scenario", () => {
  const view = getStageView("expert", "hochreiter-schmidhuber-1995-1997", "recurrent-memory");
  const scenario = view.originalCellScenario;
  assert.equal(scenario.kind, "original-cell-credit");
  assert.equal(scenario.sourceStage, view.stage.slug);
  assert.deepEqual(scenario.protectedLocalFactors, [1, 1, 1, 1]);
  assert.doesNotMatch(JSON.stringify(scenario), /forget|peephole|cellStateToGate/i);
  for (const key of ["elmanScenario", "forgetScenario", "goodFixture", "katzFixture", "kneserFixture", "chenFixture"]) {
    assert.equal(view[key], undefined);
  }
});

test("forget gates preserve journal identity, exact evidence, and mode-specific tasks", () => {
  const slug = "gers-1999-2000";
  const beginner = getStageView("beginner", slug, "recurrent-memory");
  const expert = getStageView("expert", slug, "recurrent-memory");
  assert.equal(beginner.work.id, expert.work.id);
  assert.equal(expert.canonicalVersion.id, "gers-schmidhuber-cummins-2000-neural-computation-version");
  assert.equal(expert.evidence.length, 9);
  assert.ok(expert.evidence.every((claim) => claim.sources.every((source) => source.sourceId === "gers-2000-author-journal-full-text")));
  assert.notEqual(beginner.objective.id, expert.objective.id);
  assert.notDeepEqual(beginner.blocks.map((block) => block.id), expert.blocks.map((block) => block.id));
  for (const view of [beginner, expert]) {
    assert.equal(view.previous.href, `/journeys/recurrent-memory/${view.mode}/hochreiter-schmidhuber-1995-1997/`);
    assert.equal(view.next, undefined);
    assert.ok(view.blocks.every((block) => block.evidence.every((claim) => claim.workId === view.work.id)));
    assert.equal(view.alternateMode.href, `/journeys/recurrent-memory/${view.mode === "beginner" ? "expert" : "beginner"}/${slug}/`);
  }
});

test("the retention chapter receives the fixed-write scenario without credit or peephole state", () => {
  const view = getStageView("expert", "gers-1999-2000", "recurrent-memory");
  const scenario = view.forgetScenario;
  assert.equal(scenario.kind, "forget-retention");
  assert.equal(scenario.sourceStage, view.stage.slug);
  assert.equal(scenario.previousState, 0.8);
  assert.equal(scenario.candidate, 0.25);
  assert.equal(scenario.inputGate, 0.8);
  assert.deepEqual(scenario.presets.map((preset) => preset.forgetGate), [0.9, 0.5, 0.1]);
  assert.doesNotMatch(JSON.stringify(scenario), /peephole|protectedLocalFactors|outputGate|eligibility/i);
  for (const key of ["elmanScenario", "originalCellScenario", "goodFixture", "katzFixture", "kneserFixture", "chenFixture"]) {
    assert.equal(view[key], undefined);
  }
  for (const slug of ["elman-1988-1990", "hochreiter-schmidhuber-1995-1997"]) {
    assert.equal(getStageView("expert", slug, "recurrent-memory").forgetScenario, undefined);
  }
});
