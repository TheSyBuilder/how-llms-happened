import assert from "node:assert/strict";
import test from "node:test";
import { atlasCases } from "../src/lib/atlas-cases.ts";
import { getAtlas, projectAtlas } from "../src/lib/atlas-data.ts";
import { atlasEvidenceLenses, atlasLensTasks, evidenceLensFields, evidenceLensValues, projectAtlasEvidenceLens } from "../src/lib/atlas-evidence-lens.ts";

const atlas = getAtlas();

test("every admitted intersection partitions global and all focused scopes without evidence loss", () => {
  const before = structuredClone(atlas.record);
  for (const evidenceClass of [undefined, ...evidenceLensValues.evidenceClass])
  for (const causalLanguage of [undefined, ...evidenceLensValues.causalLanguage])
  for (const connectionType of [undefined, ...evidenceLensValues.connectionType]) {
    const constraints = Object.fromEntries(Object.entries({ evidenceClass, causalLanguage, connectionType }).filter(([, value]) => value !== undefined));
    const matches = atlas.relationships.filter(({ record }) => Object.entries(constraints).every(([key, value]) => record[key] === value));
    for (const workId of [undefined, ...atlas.works.map(({ record }) => record.id)]) {
      const view = projectAtlasEvidenceLens(atlas, constraints, workId);
      const local = (relation) => workId === undefined || [relation.record.from.id, relation.record.to.id].includes(workId);
      assert.deepEqual(view.relationships, matches.filter(local));
      assert.deepEqual(view.outsideMatches, matches.filter((relation) => !local(relation)));
      assert.deepEqual(view.excluded.map(({ relation }) => relation), atlas.relationships.filter((relation) => local(relation) && !matches.includes(relation)));
      assert.equal(view.scope, workId === undefined ? "global" : "neighborhood");
      assert.equal(view.focus, atlas.byId.get(workId));
      assert.equal(view.counts.matched + view.counts.excluded, view.counts.total);
      assert.equal(view.counts.total + view.counts.outsideTotal, view.counts.globalTotal);
      assert.equal(view.counts.matched + view.counts.outsideMatched, view.counts.globalMatched);
      assert.equal(view.counts.globalMatched, matches.length);
      for (const entry of [...view.relationships, ...view.outsideMatches, ...view.excluded.map(({ relation }) => relation)]) {
        assert.equal(entry, atlas.relationships.find(({ record }) => record.id === entry.record.id));
        assert.equal(entry.record.sourceEvidence, atlas.record.relationships.find(({ id }) => id === entry.record.id).sourceEvidence);
      }
      for (const { relation, failedFields } of view.excluded) assert.deepEqual(failedFields, evidenceLensFields.filter((field) => constraints[field] !== undefined && relation.record[field] !== constraints[field]));
    }
  }
  assert.deepEqual(atlas.record, before);
});

test("documented evidence and causal prohibition intersect independently", () => {
  assert.equal(projectAtlasEvidenceLens(atlas).counts.matched, 109);
  assert.equal(projectAtlasEvidenceLens(atlas, { evidenceClass: "editorial-synthesis" }).counts.matched, 8);
  assert.equal(projectAtlasEvidenceLens(atlas, { causalLanguage: "prohibited" }).counts.matched, 14);
  const documented = projectAtlasEvidenceLens(atlas, { evidenceClass: "documented-influence", causalLanguage: "prohibited" });
  assert.equal(documented.counts.matched, 5);
  assert.ok(documented.relationships.some(({ record }) => record.id === atlasCases[2].id));
  assert.deepEqual(projectAtlasEvidenceLens(atlas, { evidenceClass: "editorial-synthesis", causalLanguage: "prohibited" }).counts.matched, 8);
  assert.equal(projectAtlasEvidenceLens(atlas, { evidenceClass: "inherited-mechanism", causalLanguage: "prohibited" }).counts.matched, 1);
});

test("the three-field Elman lens preserves two matches and complete exclusion reasons", () => {
  const lens = atlasEvidenceLenses.at(-1);
  const view = projectAtlasEvidenceLens(atlas, lens.constraints, atlasCases[1].workId);
  assert.deepEqual(view.relationships.map(({ record }) => record.id), ["elman-1988-to-miikkulainen-dyer-1991", "elman-1988-to-mikolov-2010"]);
  assert.equal(view.counts.total, 4);
  assert.deepEqual(view.excluded.map(({ relation, failedFields }) => [relation.record.connectionType, failedFields]), [["combines", ["connectionType"]], ["addresses", ["connectionType"]]]);
  const graves = projectAtlasEvidenceLens(atlas, lens.constraints, atlasCases[2].workId);
  assert.deepEqual(graves.excluded.find(({ relation }) => relation.record.id === atlasCases[2].id).failedFields, ["causalLanguage", "connectionType"]);
});

test("a local zero preserves active constraints and matching records outside the neighborhood", () => {
  const constraints = { evidenceClass: "inherited-mechanism" };
  const view = projectAtlasEvidenceLens(atlas, constraints, atlasCases[3].workId);
  assert.deepEqual(view.relationships, []);
  assert.deepEqual(view.constraints, constraints);
  assert.equal(view.counts.total, 5);
  assert.equal(view.counts.outsideMatched, 1);
  assert.equal(view.outsideMatches[0].record.id, "shannon-1948-to-jelinek-1975");
  assert.equal(view.counts.outsideTotal, 104);
  assert.equal(view.counts.globalTotal, 109);
  assert.ok(!view.relationships.some(({ record }) => record.id === view.outsideMatches[0].record.id));
});

test("parallel and reversed records are retained and rejected separately, without expansion", () => {
  const corpus = structuredClone(atlas.record);
  const original = corpus.relationships.find(({ id }) => id === atlasCases[2].id);
  const parallel = { ...structuredClone(original), id: "parallel-scope-example", from: original.to, to: original.from, connectionType: "builds-on", causalLanguage: "qualified" };
  corpus.relationships.push(parallel);
  const projected = projectAtlas(corpus, new Map());
  const all = projectAtlasEvidenceLens(projected, {}, atlasCases[2].workId);
  assert.equal(all.counts.total, 4);
  assert.ok(all.relationships.some(({ record }) => record === original));
  assert.ok(all.relationships.some(({ record }) => record === parallel));
  const view = projectAtlasEvidenceLens(projected, { causalLanguage: "qualified" }, atlasCases[2].workId);
  assert.ok(view.relationships.some(({ record }) => record === parallel));
  assert.equal(view.excluded[0].relation.record, original);
  assert.equal(view.excluded[0].relation.record.sourceEvidence, original.sourceEvidence);
  assert.equal(view.relationships.find(({ record }) => record === parallel).record.uncertainties, parallel.uncertainties);
  const elman = projectAtlasEvidenceLens(projected, {}, atlasCases[1].workId);
  const neighborIds = new Set(elman.relationships.flatMap(({ record }) => [record.from.id, record.to.id]));
  const betweenNeighbors = projected.relationships.filter(({ record }) => neighborIds.has(record.from.id) && neighborIds.has(record.to.id) && ![record.from.id, record.to.id].includes(atlasCases[1].workId));
  assert.ok(betweenNeighbors.length > 0);
  assert.ok(betweenNeighbors.every((relation) => !elman.relationships.includes(relation)));
});

test("valid empty lenses and isolated works remain distinct from invalid constraints", () => {
  const isolated = projectAtlas({ ...atlas.record, relationships: atlas.record.relationships.filter((record) => ![record.from.id, record.to.id].includes(atlasCases[0].workId)) }, new Map());
  const view = projectAtlasEvidenceLens(isolated, { evidenceClass: "documented-influence" }, atlasCases[0].workId);
  assert.equal(view.counts.total, 0);
  assert.equal(view.focus.record.id, atlasCases[0].workId);
  assert.equal(view.counts.outsideMatched, 100);
  const empty = projectAtlas({ ...atlas.record, relationships: [] }, new Map());
  assert.equal(projectAtlasEvidenceLens(empty, { connectionType: "enables" }).counts.matched, 0);
  assert.throws(() => projectAtlasEvidenceLens(atlas, {}, "missing"), /evidence lens work/);
  for (const input of [null, [], "documented", { evidenceClass: "unknown" }, { causalLanguage: "influence" }, { connectionType: "cites" }, { confidence: "high" }, { evidenceClass: undefined }, { causalLanguage: 0 }]) {
    assert.throws(() => projectAtlasEvidenceLens(atlas, input), /lens/);
  }
});

test("the static comparison has unique grounded lenses and differentiated case tasks", () => {
  assert.equal(new Set(atlasEvidenceLenses.map(({ key }) => key)).size, 8);
  for (const item of atlasCases) {
    assert.ok(atlasLensTasks[item.key].prompt.length > 0);
    assert.notEqual(atlasLensTasks[item.key].prompt, item.audit);
    for (const lens of atlasEvidenceLenses) {
      const view = projectAtlasEvidenceLens(atlas, lens.constraints, item.workId);
      assert.deepEqual(view.constraints, lens.constraints);
      assert.equal(view.counts.total, projectAtlasEvidenceLens(atlas, {}, item.workId).counts.total);
    }
  }
});
