import assert from "node:assert/strict";
import test from "node:test";
import {
  getBuiltReferenceWorkIds,
  getBuiltStagePaths,
  getJourneyOverview,
  getStageView,
  getWorkLearningRoutes,
} from "../src/lib/site-data.ts";

test("the recurrent journey exposes six source-dated chapters in both modes", () => {
  assert.equal(getJourneyOverview("recurrent-memory").stages.length, 6);
  assert.deepEqual(getBuiltStagePaths("recurrent-memory"), [
    { params: { mode: "beginner", stage: "elman-1988-1990" } },
    { params: { mode: "expert", stage: "elman-1988-1990" } },
    { params: { mode: "beginner", stage: "hochreiter-schmidhuber-1995-1997" } },
    { params: { mode: "expert", stage: "hochreiter-schmidhuber-1995-1997" } },
    { params: { mode: "beginner", stage: "gers-1999-2000" } },
    { params: { mode: "expert", stage: "gers-1999-2000" } },
    { params: { mode: "beginner", stage: "gers-2002" } },
    { params: { mode: "expert", stage: "gers-2002" } },
    { params: { mode: "beginner", stage: "mikolov-2010" } },
    { params: { mode: "expert", stage: "mikolov-2010" } },
    { params: { mode: "beginner", stage: "sundermeyer-2012" } },
    { params: { mode: "expert", stage: "sundermeyer-2012" } },
  ]);
  assert.ok(getJourneyOverview("recurrent-memory").stages.every((stage) => stage.status === "built"));
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
  assert.equal(workIds.length, 14);
  for (const journeyId of ["smoothing", "recurrent-memory", "encoder-decoder-alignment"]) {
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
    assert.equal(view.next.href, `/journeys/recurrent-memory/${view.mode}/gers-2002/`);
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

test("peepholes preserve JMLR identity, timing evidence, and distinct mode tasks", () => {
  const beginner = getStageView("beginner", "gers-2002", "recurrent-memory");
  const expert = getStageView("expert", "gers-2002", "recurrent-memory");
  assert.equal(beginner.work.id, expert.work.id);
  assert.equal(expert.canonicalVersion.id, "gers-schraudolph-schmidhuber-2002-jmlr-version");
  assert.equal(expert.evidence.length, 9);
  assert.ok(expert.evidence.every((claim) => claim.sources.every((source) => source.sourceId === "gers-2002-jmlr-full-text")));
  assert.notEqual(beginner.objective.id, expert.objective.id);
  assert.notDeepEqual(beginner.blocks.map((block) => block.id), expert.blocks.map((block) => block.id));
  for (const view of [beginner, expert]) {
    assert.equal(view.previous.href, `/journeys/recurrent-memory/${view.mode}/gers-1999-2000/`);
    assert.equal(view.next.href, `/journeys/recurrent-memory/${view.mode}/mikolov-2010/`);
    assert.equal(view.alternateMode.href, `/journeys/recurrent-memory/${view.mode === "beginner" ? "expert" : "beginner"}/gers-2002/`);
    assert.ok(view.blocks.every((block) => block.evidence.every((claim) => claim.workId === view.work.id)));
  }
});

test("Mikolov resolves only its source claims and the separately scoped Bengio prerequisite", () => {
  const beginner = getStageView("beginner", "mikolov-2010", "recurrent-memory");
  const expert = getStageView("expert", "mikolov-2010", "recurrent-memory");
  assert.equal(beginner.work.id, expert.work.id);
  assert.equal(expert.canonicalVersion.id, "mikolov-2010-interspeech-version");
  assert.equal(expert.evidence.length, 13);
  assert.ok(expert.evidence.every((claim) => claim.workId === expert.work.id
    && claim.sources.every((source) => source.sourceId === "mikolov-2010-isca-full-text")));
  assert.notEqual(beginner.objective.id, expert.objective.id);
  assert.notDeepEqual(beginner.blocks.map((block) => block.id), expert.blocks.map((block) => block.id));
  for (const view of [beginner, expert]) {
    assert.equal(view.previous.href, `/journeys/recurrent-memory/${view.mode}/gers-2002/`);
    assert.equal(view.next.href, `/journeys/recurrent-memory/${view.mode}/sundermeyer-2012/`);
    assert.equal(view.interludes.length, 1);
    const prerequisite = view.interludes[0];
    assert.equal(prerequisite.id, "bengio-fixed-window-prerequisite");
    assert.equal(prerequisite.placement, "before");
    assert.deepEqual([...new Set(prerequisite.blocks.flatMap((block) => block.claimIds))].sort(), [
      "bengio-2003-feedforward-softmax-architecture", "bengio-2003-fixed-window-factorization", "bengio-2003-recurrent-future-boundary",
    ]);
    assert.ok(prerequisite.blocks.every((block) => block.evidence.every((claim) => claim.workId === prerequisite.workIds[0])));
    for (const key of ["elmanScenario", "originalCellScenario", "forgetScenario", "peepholeScenario", "goodFixture", "katzFixture", "kneserFixture", "chenFixture"]) assert.equal(view[key], undefined);
  }
  assert.notDeepEqual(beginner.interludes[0].blocks.map((block) => block.id), expert.interludes[0].blocks.map((block) => block.id));
});

test("prerequisite references return to the owner stage and the final chapter owns its smoothing return", () => {
  const workId = "bengio-2000-neural-probabilistic-language-model";
  assert.ok(getBuiltReferenceWorkIds().includes(workId));
  const routes = getWorkLearningRoutes(workId);
  for (const mode of ["beginner", "expert"]) {
    assert.equal(routes[mode].href, `/journeys/recurrent-memory/${mode}/mikolov-2010/#bengio-fixed-window-prerequisite`);
    for (const stage of getJourneyOverview("recurrent-memory").stages.slice(0, 4)) {
      assert.deepEqual(getStageView(mode, stage.slug, "recurrent-memory").interludes, []);
    }
  }
  const finalRoutes = getWorkLearningRoutes("sundermeyer-2012-lstm-language-model");
  for (const mode of ["beginner", "expert"]) assert.equal(finalRoutes[mode].href, `/journeys/recurrent-memory/${mode}/sundermeyer-2012/`);
});

test("only the state-inspection chapter receives the reviewed peephole comparison", () => {
  const view = getStageView("expert", "gers-2002", "recurrent-memory");
  assert.equal(view.peepholeScenario.kind, "peephole-inspection");
  assert.equal(view.peepholeScenario.sourceStage, view.stage.slug);
  for (const key of ["elmanScenario", "originalCellScenario", "forgetScenario", "goodFixture", "katzFixture", "kneserFixture", "chenFixture"]) {
    assert.equal(view[key], undefined);
  }
  for (const stage of getJourneyOverview("recurrent-memory").stages.slice(0, 3)) {
    assert.equal(getStageView("expert", stage.slug, "recurrent-memory").peepholeScenario, undefined);
  }
});

test("the composite chapter preserves fifteen source claims without receiving an earlier numeric cell", () => {
  const beginner = getStageView("beginner", "sundermeyer-2012", "recurrent-memory");
  const expert = getStageView("expert", "sundermeyer-2012", "recurrent-memory");
  assert.equal(beginner.work.id, expert.work.id);
  assert.equal(expert.canonicalVersion.id, "sundermeyer-2012-interspeech-version");
  assert.equal(expert.evidence.length, 15);
  assert.ok(expert.evidence.every((claim) => claim.workId === expert.work.id
    && claim.sources.some((source) => source.sourceId === "sundermeyer-2012-isca-full-text")));
  const attribution = expert.evidence.find((claim) => claim.claimId === "sundermeyer-2012-lstm-antecedent-and-variant");
  assert.equal(attribution.directness, "editorial-inference");
  assert.deepEqual([...new Set(attribution.sources.map((source) => source.sourceId))].sort(), [
    "gers-1999-icann-full-text", "gers-2002-jmlr-full-text", "sundermeyer-2012-isca-full-text",
  ]);
  assert.notEqual(beginner.objective.id, expert.objective.id);
  assert.notDeepEqual(beginner.blocks.map((block) => block.id), expert.blocks.map((block) => block.id));
  for (const view of [beginner, expert]) {
    assert.equal(view.previous.href, `/journeys/recurrent-memory/${view.mode}/mikolov-2010/`);
    assert.equal(view.next, undefined);
    assert.equal(view.alternateMode.href, `/journeys/recurrent-memory/${view.mode === "beginner" ? "expert" : "beginner"}/sundermeyer-2012/`);
    for (const key of ["elmanScenario", "originalCellScenario", "forgetScenario", "peepholeScenario", "goodFixture", "katzFixture", "kneserFixture", "chenFixture"]) assert.equal(view[key], undefined);
  }
});

test("the static smoothing return binds only the target's setup and mixture claims", () => {
  for (const mode of ["beginner", "expert"]) {
    const view = getStageView(mode, "sundermeyer-2012", "recurrent-memory");
    assert.equal(view.interludes.length, 1);
    const bridge = view.interludes[0];
    assert.equal(bridge.id, "smoothing-to-sundermeyer-bridge");
    assert.equal(bridge.relatedJourneyId, "smoothing");
    assert.equal(bridge.placement, "before");
    assert.deepEqual([...new Set(bridge.blocks.flatMap((block) => block.claimIds))].sort(), [
      "sundermeyer-2012-french-asr-setup", "sundermeyer-2012-french-wer-results",
    ]);
    assert.ok(bridge.blocks.every((block) => block.evidence.every((claim) => claim.workId === view.work.id)));
    assert.ok(bridge.blocks.every((block) => block.evidence.every((claim) => claim.sources.every((source) => source.sourceId === "sundermeyer-2012-isca-full-text"))));
  }
});
