import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getAtlas, groupAtlasYears, projectAtlas } from "../src/lib/atlas-data.ts";
import { getBuiltReferenceWorkIds, getBuiltStagePaths } from "../src/lib/site-data.ts";

const corpus = JSON.parse(readFileSync("data/corpus.json", "utf8"));
const atlas = getAtlas();

test("the atlas retains the complete validated corpus without narrowing evidence objects", () => {
  assert.deepEqual(atlas.record, corpus);
  assert.deepEqual(atlas.works.map((work) => work.record), corpus.works);
  assert.deepEqual(atlas.relationships.map((relation) => relation.record), corpus.relationships);
  assert.deepEqual(atlas.sources, corpus.sources);
  assert.equal(atlas.counts.works, 66);
  assert.equal(atlas.counts.relationships, 109);
  assert.equal(new Set(atlas.years.flatMap((year) => year.groups.flatMap((group) => group.works.map((work) => work.record.id)))).size, 66);
  assert.equal(atlas.works.flatMap((work) => work.claims).length, corpus.claims.length);
});

test("dates preserve precision, calendar notes, ordering evidence and canonical-version differences", () => {
  const markov = atlas.byId.get("markov-1913-onegin");
  assert.deepEqual(markov.orderingEvent, corpus.works[0].chronology.events[0]);
  assert.equal(markov.orderingEvent.date.calendar, "source-as-printed");
  assert.match(markov.orderingEvent.date.note, /does not state the calendar/);
  const elman = atlas.byId.get("elman-1988-finding-structure-in-time");
  assert.equal(elman.orderingEvent.date.value, "1988-04");
  assert.equal(elman.canonicalVersion.id, "elman-1990-cognitive-science-journal-version");
  assert.deepEqual(elman.record.chronology, corpus.works.find((work) => work.id === elman.record.id).chronology);
  const precisionCounts = Object.fromEntries(["day", "month", "year"].map((precision) => [precision, atlas.works.filter((work) => work.orderingEvent.date.precision === precision).length]));
  assert.deepEqual(precisionCounts, { day: 46, month: 12, year: 8 });
});

test("global chronology corrects insertion order without treating year-only dates as January", () => {
  const ids = atlas.years.flatMap((year) => year.groups.flatMap((group) => group.works.map((work) => work.record.id)));
  assert.ok(ids.indexOf("fedus-2021-switch-transformers-scaling-trillion-parameter-models") < ids.indexOf("wei-2021-finetuned-language-models-zero-shot-learners"));
  assert.ok(ids.indexOf("rafailov-2023-direct-preference-optimization") < ids.indexOf("deepseek-ai-2025-deepseek-r1-incentivizes-reasoning-reinforcement-learning"));
  const roots = atlas.years.find((year) => year.year === 2022).groups.find((group) => group.unresolved);
  assert.deepEqual(roots.works.map((work) => work.orderingEvent.date.value), ["2022"]);
  assert.match(roots.label, /does not assert within-year order/);
  assert.deepEqual(atlas.years.find((year) => year.year === 1948).gapBefore, { start: 1914, end: 1947 });
});

test("overlapping months and equal days retain editorial reading order instead of inventing priority", () => {
  const fixture = (id, value, precision) => ({ ...atlas.works[0], record: { ...atlas.works[0].record, id }, orderingEvent: { ...atlas.works[0].orderingEvent, date: { value, precision, calendar: "gregorian" } } });
  const input = [fixture("late-day", "2000-04-27", "day"), fixture("year-only", "2000", "year"), fixture("month", "2000-04", "month"), fixture("early-day", "2000-04-02", "day"), fixture("march", "2000-03-01", "day"), fixture("equal", "2000-03-01", "day")];
  const [year] = groupAtlasYears(input);
  assert.deepEqual(year.groups.map((group) => group.works.map((work) => work.record.id)), [["march", "equal"], ["late-day", "month", "early-day"], ["year-only"]]);
  assert.match(year.groups[0].label, /does not establish research priority/);
  assert.match(year.groups[1].label, /overlapping dates/);
  assert.equal(year.groups[2].unresolved, true);
});

test("relationship fields, full source locators and qualifications remain independent", () => {
  assert.deepEqual(atlas.counts.evidenceClass, { "editorial-synthesis": 8, "inherited-mechanism": 1, "documented-influence": 100 });
  assert.deepEqual(atlas.counts.causalLanguage, { prohibited: 14, qualified: 95 });
  const cases = new Map(atlas.relationships.map((relation) => [relation.record.id, relation]));
  assert.equal(cases.get("markov-1913-to-shannon-1948").record.causalLanguage, "prohibited");
  assert.equal(cases.get("elman-1988-to-mikolov-2010").record.connectionType, "builds-on");
  const comparison = cases.get("graves-2013-to-bahdanau-2014").record;
  assert.equal(comparison.evidenceClass, "documented-influence");
  assert.equal(comparison.causalLanguage, "prohibited");
  assert.equal(comparison.sourceEvidence.length, 2);
  assert.deepEqual(comparison, corpus.relationships.find((relation) => relation.id === comparison.id));
  assert.ok(cases.get("cho-2014-to-sutskever-2014").record.uncertainties.length > 0);
  for (const relation of atlas.relationships) {
    assert.deepEqual(relation.claims.map((claim) => claim.id), relation.record.claimIds);
    for (const evidence of relation.record.sourceEvidence) assert.ok(atlas.sources.some((source) => source.id === evidence.sourceId));
    assert.ok(relation.from.relationshipIds.includes(relation.record.id));
    assert.ok(relation.to.relationshipIds.includes(relation.record.id));
  }
});

test("availability follows generated routes, with prerequisites distinct from complete chapters", () => {
  assert.equal(atlas.counts.chapters, 12);
  assert.equal(atlas.counts.prerequisites, 2);
  assert.equal(atlas.counts.references, 14);
  assert.equal(atlas.counts.corpusOnly, 52);
  assert.deepEqual(atlas.works.filter((work) => work.availability.referenceHref).map((work) => work.record.id).sort(), getBuiltReferenceWorkIds().sort());
  const rendered = ["smoothing", "recurrent-memory", "encoder-decoder-alignment"].flatMap((id) => getBuiltStagePaths(id).map(({ params }) => `/journeys/${id}/${params.mode}/${params.stage}/`));
  for (const work of atlas.works) {
    if (work.availability.learning?.kind === "chapter") for (const route of Object.values(work.availability.learning.routes)) assert.ok(rendered.includes(route.href));
    if (!work.availability.referenceHref) {
      assert.equal(work.availability.learning, undefined);
      assert.ok(work.claims.length > 0);
    }
  }
  const bengio = atlas.byId.get("bengio-2000-neural-probabilistic-language-model");
  assert.equal(bengio.availability.learning.kind, "prerequisite");
  assert.match(bengio.availability.learning.routes.expert.href, /#bengio-fixed-window-prerequisite$/);
  assert.deepEqual(projectAtlas(corpus, new Map()).counts.references, 0);
});

test("the projection rejects missing event, version, endpoint and claim references", () => {
  for (const [mutate, message] of [
    [(copy) => { copy.works[0].chronology.orderingEventId = "missing"; }, /ordering event/],
    [(copy) => { copy.works[0].canonicalVersionId = "missing"; }, /canonical version/],
    [(copy) => { copy.relationships[0].to.id = "missing"; }, /to endpoint/],
    [(copy) => { copy.relationships[0].claimIds.push("missing"); }, /claim missing/],
  ]) {
    const copy = structuredClone(corpus);
    mutate(copy);
    assert.throws(() => projectAtlas(copy, new Map()), message);
  }
  assert.deepEqual(atlas.record, corpus);
});
