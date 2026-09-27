import assert from "node:assert/strict";
import test from "node:test";

import {
  getBuiltStagePaths,
  getChenFixtureForTests,
  getCorpusSummary,
  getFixtureForTests,
  getJourneyOverview,
  getKatzFixtureForTests,
  getKneserFixtureForTests,
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
  assert.deepEqual(journey.stages.map((stage) => stage.status), ["built", "built", "built", "built"]);
});

test("built routes expose separate beginner and expert pages through Chen–Goodman", () => {
  assert.deepEqual(getBuiltStagePaths(), [
    { params: { mode: "beginner", stage: "good-1953" } },
    { params: { mode: "expert", stage: "good-1953" } },
    { params: { mode: "beginner", stage: "katz-1987" } },
    { params: { mode: "expert", stage: "katz-1987" } },
    { params: { mode: "beginner", stage: "kneser-ney-1995" } },
    { params: { mode: "expert", stage: "kneser-ney-1995" } },
    { params: { mode: "beginner", stage: "chen-goodman-1998" } },
    { params: { mode: "expert", stage: "chen-goodman-1998" } },
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

test("every factual built-stage block resolves evidence from the same work", () => {
  for (const slug of ["good-1953", "katz-1987", "kneser-ney-1995", "chen-goodman-1998"]) {
    for (const mode of ["beginner", "expert"]) {
      const stage = getStageView(mode, slug);
      for (const block of stage.blocks) {
        assert.ok(block.claimIds.length > 0);
        assert.equal(block.claimIds.length, block.evidence.length);
        assert.ok(block.evidence.every((evidence) => evidence.workId === stage.work.id));
        assert.ok(block.evidence.every((evidence) => evidence.sources.length > 0));
      }
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

test("the Katz fixture stays bound to Katz claims and never exposes later interpolation", () => {
  const fixture = getKatzFixtureForTests();
  assert.equal(fixture.scenarios.length, 3);
  assert.ok(fixture.representedClaimIds.every((id) => id.startsWith("katz-1987-")));
  assert.ok(fixture.scenarios.every((scenario) => !JSON.stringify(scenario).includes("interpol")));
  assert.equal(getStageView("beginner", "katz-1987").katzFixture?.scenarios.length, 3);
  assert.equal(getStageView("expert", "katz-1987").objective.id, "expert-katz-1987-estimator");
});

test("the Kneser–Ney fixture preserves original hard-backoff boundaries", () => {
  const fixture = getKneserFixtureForTests();
  assert.equal(fixture.scenarios.length, 1);
  assert.equal(fixture.scenarios[0].states.length, 3);
  assert.ok(fixture.representedClaimIds.every((id) => id.startsWith("kneser-ney-1995-")));
  assert.ok(!JSON.stringify(fixture).match(/D₁|D₁\/D₂|three-discount|interpolated/i));
  assert.equal(getStageView("beginner", "kneser-ney-1995").kneserFixture?.scenarios.length, 1);
  assert.equal(getStageView("expert", "kneser-ney-1995").objective.id, "expert-kneser-ney-1995-estimator");
});

test("the Chen–Goodman fixture keeps interpolation and discount tiers separable", () => {
  const fixture = getChenFixtureForTests();
  assert.equal(fixture.scenarios.length, 1);
  assert.ok(fixture.representedClaimIds.every((id) => id.startsWith("chen-goodman-1998-")));
  assert.equal(fixture.scenarios[0].continuations.length, 4);
  assert.equal(getStageView("beginner", "chen-goodman-1998").chenFixture?.scenarios.length, 1);
  assert.equal(getStageView("expert", "chen-goodman-1998").objective.id, "expert-chen-goodman-1998-modified-estimator");
});

test("the reference view contains all Good claims and source locators", () => {
  const record = getWorkReference("good-1953-population-frequencies");
  assert.equal(record.claims.length, 3);
  assert.ok(record.claims.every((claim) => claim.sources.every((source) => source.locator.length > 0)));
});

test("the Katz reference view contains its complete source-bound claim set", () => {
  const record = getWorkReference("katz-1987-sparse-data");
  assert.equal(record.claims.length, 14);
  assert.ok(record.claims.every((claim) => claim.sources.every((source) => source.locator.length > 0)));
});

test("the Kneser–Ney reference view contains its complete source-bound claim set", () => {
  const record = getWorkReference("kneser-ney-1995-improved-backing-off");
  assert.equal(record.claims.length, 12);
  assert.ok(record.claims.every((claim) => claim.sources.every((source) => source.locator.length > 0)));
});

test("corpus validation completed before the adapter exposed totals", () => {
  const summary = getCorpusSummary();
  assert.equal(summary.workCount, 66);
  assert.equal(summary.claimCount, 969);
  assert.equal(summary.sourceCount, 602);
});
