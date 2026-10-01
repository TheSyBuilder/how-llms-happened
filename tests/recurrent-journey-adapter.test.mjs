import assert from "node:assert/strict";
import test from "node:test";
import {
  getBuiltReferenceWorkIds,
  getBuiltStagePaths,
  getJourneyOverview,
  getStageView,
  getWorkLearningRoutes,
} from "../src/lib/site-data.ts";

test("the recurrent journey exposes only Elman in both modes", () => {
  assert.equal(getJourneyOverview("recurrent-memory").stages.length, 6);
  assert.deepEqual(getBuiltStagePaths("recurrent-memory"), [
    { params: { mode: "beginner", stage: "elman-1988-1990" } },
    { params: { mode: "expert", stage: "elman-1988-1990" } },
  ]);
  for (const slug of getJourneyOverview("recurrent-memory").stages.slice(1).map((stage) => stage.slug)) {
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
    assert.equal(view.next, undefined);
    assert.equal(view.elmanScenario.kind, "elman-history-contrast");
    assert.ok(view.blocks.every((block) => block.evidence.every((claim) => claim.workId === view.work.id)));
    assert.doesNotMatch(JSON.stringify(view.elmanScenario), /forgetGate|peephole|protectedLocalFactors/);
    assert.equal(view.katzFixture, undefined);
  }
});

test("every built work links back to its own chapter and journey", () => {
  const workIds = getBuiltReferenceWorkIds();
  assert.equal(workIds.length, 5);
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
