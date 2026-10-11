import assert from "node:assert/strict";
import test from "node:test";
import { atlasCases } from "../src/lib/atlas-cases.ts";
import { getAtlas, projectAtlas, projectAtlasNeighborhood } from "../src/lib/atlas-data.ts";

const atlas = getAtlas();

test("each admitted work has a lossless incident view with distinct neighbor identities", () => {
  const before = structuredClone(atlas.record);
  for (const work of atlas.works) {
    const view = projectAtlasNeighborhood(atlas, work.record.id);
    const expected = atlas.relationships.filter(({ record }) => [record.from.id, record.to.id].includes(work.record.id));
    assert.equal(view.focus, work);
    assert.deepEqual(view.relationships, expected);
    assert.equal(view.counts.incident + view.counts.outside, atlas.counts.relationships);
    assert.equal(new Set(view.neighbors.map(({ work }) => work.record.id)).size, view.counts.neighbors);
    assert.deepEqual(view.neighbors.flatMap((neighbor) => neighbor.relationships).map(({ record }) => record.id).sort(), expected.map(({ record }) => record.id).sort());
    for (const neighbor of view.neighbors) {
      assert.equal(neighbor.work, atlas.byId.get(neighbor.work.record.id));
      for (const relation of neighbor.relationships) {
        assert.equal(relation, atlas.relationships.find(({ record }) => record.id === relation.record.id));
        assert.ok([relation.from.record.id, relation.to.record.id].includes(work.record.id));
        assert.ok([relation.from.record.id, relation.to.record.id].includes(neighbor.work.record.id));
      }
    }
  }
  assert.deepEqual(atlas.record, before);
});

test("parallel records remain separate even with different orientation, evidence and permission", () => {
  const corpus = structuredClone(atlas.record);
  const original = corpus.relationships.find(({ id }) => id === "graves-2013-to-bahdanau-2014");
  const parallel = { ...structuredClone(original), id: "parallel-scope-example", from: original.to, to: original.from, connectionType: "conceptual-parallel", evidenceClass: "editorial-synthesis", causalLanguage: "qualified" };
  corpus.relationships.push(parallel);
  const projected = projectAtlas(corpus, new Map());
  const view = projectAtlasNeighborhood(projected, original.from.id);
  const neighbor = view.neighbors.find(({ work }) => work.record.id === original.to.id);
  assert.equal(view.counts.neighbors, 3);
  assert.equal(view.counts.incident, 4);
  assert.equal(neighbor.relationships.length, 2);
  assert.equal(neighbor.relationships[0].record, original);
  assert.equal(neighbor.relationships[1].record, parallel);
  assert.deepEqual(neighbor.relationships.map(({ record }) => record.causalLanguage), ["prohibited", "qualified"]);
  assert.deepEqual(neighbor.relationships.map(({ record }) => record.sourceEvidence), [original.sourceEvidence, parallel.sourceEvidence]);
});

test("a neighborhood does not expand neighbors or include links between them", () => {
  const view = projectAtlasNeighborhood(atlas, "elman-1988-finding-structure-in-time");
  const ids = new Set(view.neighbors.map(({ work }) => work.record.id));
  const neighborEdges = atlas.relationships.filter(({ record }) => ids.has(record.from.id) && ids.has(record.to.id));
  assert.ok(neighborEdges.length > 0, "the test must exercise real neighbor-to-neighbor links");
  for (const relation of neighborEdges) assert.ok(!view.relationships.includes(relation));
  const laterGateId = "gers-schmidhuber-cummins-1999-learning-to-forget";
  assert.ok(atlas.byId.has(laterGateId));
  assert.ok(!ids.has(laterGateId));
});

test("missing works fail explicitly while admitted isolated works retain identity", () => {
  assert.throws(() => projectAtlasNeighborhood(atlas, "missing"), /neighborhood work/);
  const projected = projectAtlas({ ...atlas.record, relationships: [] }, new Map());
  const view = projectAtlasNeighborhood(projected, atlas.works[0].record.id);
  assert.equal(view.focus, projected.works[0]);
  assert.deepEqual(view.neighbors, []);
  assert.deepEqual(view.relationships, []);
  assert.deepEqual(view.counts, { incident: 0, neighbors: 0, outside: 0 });
});

test("self-connections require explicit treatment instead of becoming neighbor marks", () => {
  const corpus = structuredClone(atlas.record);
  corpus.relationships[0].to = corpus.relationships[0].from;
  assert.throws(() => projectAtlasNeighborhood(projectAtlas(corpus, new Map()), corpus.relationships[0].from.id), /Self-connection/);
});

test("grounded cases bind one real focus and target without narrowing dates or evidence", () => {
  assert.equal(new Set(atlasCases.map(({ key }) => key)).size, 4);
  for (const item of atlasCases) {
    const view = projectAtlasNeighborhood(atlas, item.workId);
    assert.equal(view.relationships.filter(({ record }) => record.id === item.id).length, 1);
    assert.equal(view.focus.orderingEvent, atlas.byId.get(item.workId).orderingEvent);
    assert.equal(view.focus.canonicalVersion, atlas.byId.get(item.workId).canonicalVersion);
    assert.notEqual(item.prompt, item.audit);
  }
  assert.equal(projectAtlasNeighborhood(atlas, atlasCases[1].workId).focus.orderingEvent.date.value, "1988-04");
});
