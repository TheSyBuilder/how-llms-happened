import assert from "node:assert/strict";
import test from "node:test";

import {
  getBuiltStagePaths,
  getCorpusSummary,
  getFixtureForTests,
  getJourneyOverview,
  getStageView,
  getWorkReference,
} from "../src/lib/site-data.ts";

test("the smoothing manifest resolves four ordered corpus works", () => {
  const journey = getJourneyOverview();
  assert.equal(journey.stages.length, 4);
  assert.deepEqual(
    journey.stages.map((stage) => stage.slug),
    ["good-1953", "katz-1987", "kneser-ney-1995", "chen-goodman-1998"],
  );
  assert.equal(journey.stages[0].status, "built");
  assert.ok(journey.stages.slice(1).every((stage) => stage.status === "planned"));
});

test("built routes expose separate beginner and expert Good pages", () => {
  assert.deepEqual(getBuiltStagePaths(), [
    { params: { mode: "beginner", stage: "good-1953" } },
    { params: { mode: "expert", stage: "good-1953" } },
  ]);

  const beginner = getStageView("beginner", "good-1953");
  const expert = getStageView("expert", "good-1953");
  assert.equal(beginner.work.id, expert.work.id);
  assert.notEqual(beginner.objective.id, expert.objective.id);
  assert.notDeepEqual(
    beginner.blocks.map((block) => block.id),
    expert.blocks.map((block) => block.id),
  );
  assert.equal(beginner.alternateMode.href, "/journeys/smoothing/expert/good-1953/");
  assert.equal(expert.alternateMode.href, "/journeys/smoothing/beginner/good-1953/");
});

test("every factual Good block resolves evidence from the same work", () => {
  for (const mode of ["beginner", "expert"]) {
    const stage = getStageView(mode, "good-1953");
    for (const block of stage.blocks) {
      assert.ok(block.claimIds.length > 0);
      assert.equal(block.claimIds.length, block.evidence.length);
      assert.ok(block.evidence.every((evidence) => evidence.workId === stage.work.id));
      assert.ok(block.evidence.every((evidence) => evidence.sources.length > 0));
    }
  }
});

test("the Good fixture preserves sample, singleton, and mass invariants", () => {
  const fixture = getFixtureForTests();
  const sampleSize = fixture.observedTypes.reduce((sum, item) => sum + item.count, 0);
  const singletons = fixture.observedTypes.filter((item) => item.count === 1).length;
  assert.equal(sampleSize, 12);
  assert.equal(singletons, 3);
  assert.equal(singletons / sampleSize, fixture.expected.unseenMass);
  assert.equal(fixture.expected.unseenMass + fixture.expected.representedMass, 1);
});

test("the reference view contains all Good claims and source locators", () => {
  const record = getWorkReference("good-1953-population-frequencies");
  assert.equal(record.claims.length, 3);
  assert.ok(record.claims.every((claim) => claim.sources.every((source) => source.locator.length > 0)));
});

test("corpus validation completed before the adapter exposed totals", () => {
  const summary = getCorpusSummary();
  assert.equal(summary.workCount, 66);
  assert.equal(summary.claimCount, 969);
  assert.equal(summary.sourceCount, 602);
});
