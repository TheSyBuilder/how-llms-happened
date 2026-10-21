import Ajv2020 from "ajv/dist/2020.js";
import journeySchema from "../../schemas/journey.schema.json" with { type: "json" };
import fixtureSchema from "../../schemas/parikh-fixture.schema.json" with { type: "json" };
import type { Corpus, JourneyManifest } from "./site-data.ts";
import { validateParikhExpected, type ParikhFixture } from "./parikh-engine.ts";

export const SEQUENCE_WORK_IDS = [
  "parikh-2016-decomposable-attention-nli",
  "kalchbrenner-2016-neural-machine-translation-linear-time",
  "gehring-2017-convolutional-sequence-to-sequence-learning",
  "vaswani-2017-attention-is-all-you-need",
] as const;
export const SEQUENCE_BRIDGE_WORK_IDS = [
  "cheng-dong-lapata-2016-lstmn-machine-reading",
  "sukhbaatar-2015-end-to-end-memory-networks",
] as const;
const STAGES = ["parikh-2016", "bytenet-2016", "convs2s-2017", "transformer-2017"];
const BRIDGES = [
  { id: "cheng-recurrent-read", stage: STAGES[0], workIds: [SEQUENCE_BRIDGE_WORK_IDS[0], SEQUENCE_WORK_IDS[0]],
    claims: ["cheng-2016-lstmn-memory-tape", "cheng-2016-intra-attention-update", "parikh-2016-cheng-intra-attention-adaptation"] },
  { id: "memory-hop-comparison", stage: STAGES[2], workIds: [SEQUENCE_BRIDGE_WORK_IDS[1], SEQUENCE_WORK_IDS[2]],
    claims: ["sukhbaatar-2015-soft-memory-read", "sukhbaatar-2015-multi-hop-update", "sukhbaatar-2015-weight-tying", "gehring-2017-attention-antecedent-boundary"] },
];
const OPERATION_CLAIMS = [
  "parikh-2016-attend-soft-alignment", "parikh-2016-compare-and-aggregate", "parikh-2016-vanilla-word-order-boundary",
  "parikh-2016-distance-biased-intra-attention", "parikh-2016-version-boundary",
];
const ajv = new Ajv2020({ allErrors: true, strict: true });
const journeyShape = ajv.compile(journeySchema);
const fixtureShape = ajv.compile(fixtureSchema);

function inventory(actual: string[], expected: string[], label: string): void {
  if (JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort())) {
    throw new Error(`${label} must retain the exact inventory without duplicate ownership.`);
  }
}

/** A planned source bundle is separate from the site's built chapter/reference registry. */
export function getSequenceSourcePlan(corpus: Corpus) {
  const ids: string[] = [...SEQUENCE_WORK_IDS, ...SEQUENCE_BRIDGE_WORK_IDS];
  const references = ids.map((id) => {
    const work = corpus.works.find((item) => item.id === id);
    if (!work) throw new Error(`Missing sequence work ${id}.`);
    const claims = corpus.claims.filter((claim) => claim.workId === id);
    const sources = work.sourceIds.map((sourceId) => {
      const source = corpus.sources.find((item) => item.id === sourceId);
      if (!source) throw new Error(`Missing source ${sourceId}.`);
      return source;
    });
    return { work, claims, sources, objectives: corpus.learningObjectives.filter((item) => item.workIds.includes(id)) };
  });
  // Include the admitted incoming relationships, not an inferred chain of teaching neighbors.
  const relationships = corpus.relationships.filter((edge) => edge.to.kind === "work" && ids.includes(edge.to.id));
  return { references, relationships };
}

export function validateSequenceContract(corpus: Corpus, manifest: JourneyManifest, fixture: ParikhFixture): void {
  if (!journeyShape(manifest)) throw new Error(`Sequence manifest shape: ${ajv.errorsText(journeyShape.errors)}`);
  if (!fixtureShape(fixture)) throw new Error(`Parikh fixture shape: ${ajv.errorsText(fixtureShape.errors)}`);
  if (manifest.id !== "sequence-computation" || manifest.slug !== manifest.id
    || JSON.stringify(manifest.stages.map((stage) => stage.workId)) !== JSON.stringify(SEQUENCE_WORK_IDS)
    || JSON.stringify(manifest.stages.map((stage) => stage.slug)) !== JSON.stringify(STAGES)) {
    throw new Error("Retain the selected sequence teaching order and stage identities.");
  }
  const blockIds: string[] = [];
  for (const stage of manifest.stages) {
    if (stage.status !== "planned") throw new Error("Sequence chapters remain planned until all source, fixture and rendered gates pass.");
    const claims = corpus.claims.filter((claim) => claim.workId === stage.workId);
    const ids = claims.map((claim) => claim.id);
    inventory(stage.blocks.expert.flatMap((block) => block.claimIds), ids, `${stage.slug} expert claims`);
    if (stage.contribution.claimIds.length === 0 || stage.contribution.claimIds.some((id) => !ids.includes(id))) throw new Error("Contribution claims must belong to the owning stage.");
    for (const mode of ["beginner", "expert"] as const) {
      const objective = corpus.learningObjectives.find((item) => item.id === stage.objectiveIds[mode]);
      if (!objective || objective.mode !== mode || !objective.workIds.includes(stage.workId)) throw new Error(`Bind the owning ${mode} objective.`);
      const assigned = stage.blocks[mode].flatMap((block) => block.claimIds);
      if (objective.claimIds.some((id) => !assigned.includes(id))) throw new Error(`Missing ${mode} objective evidence.`);
      for (const block of stage.blocks[mode]) {
        blockIds.push(block.id);
        if (!block.claimIds.length || block.claimIds.some((id) => !ids.includes(id))) throw new Error("Every block needs owning-work evidence.");
      }
    }
    if (JSON.stringify(stage.blocks.beginner.map((block) => block.kind)) === JSON.stringify(stage.blocks.expert.map((block) => block.kind))) {
      throw new Error("The two modes need distinct teaching tasks.");
    }
  }
  inventory((manifest.interludes ?? []).map((item) => item.id), BRIDGES.map((item) => item.id), "Prerequisite comparisons");
  for (const bridge of manifest.interludes ?? []) {
    const scope = BRIDGES.find((item) => item.id === bridge.id)!;
    if (bridge.stageSlug !== scope.stage || bridge.kind !== "prerequisite" || bridge.placement !== "before") throw new Error("A prerequisite must retain its owning stage and placement.");
    inventory(bridge.workIds, scope.workIds, "Prerequisite works");
    for (const mode of ["beginner", "expert"] as const) {
      inventory(bridge.blocks[mode].flatMap((block) => block.claimIds), scope.claims, `${bridge.id} ${mode} teaching scope`);
      blockIds.push(...bridge.blocks[mode].map((block) => block.id));
    }
  }
  if (new Set(blockIds).size !== blockIds.length) throw new Error("Block identities must be unique across modes and comparisons.");
  const binding = fixture.binding;
  inventory(binding.claimIds, OPERATION_CLAIMS, "Parikh calculation claims");
  const work = corpus.works.find((item) => item.id === SEQUENCE_WORK_IDS[0])!;
  const version = work.versions.find((item) => item.id === binding.versionId);
  const source = corpus.sources.find((item) => item.id === binding.sourceId);
  if (!version || !source || !version.sourceIds.includes(source.id) || !source.versionIds.includes(version.id)) throw new Error("Calculation source and version must agree reciprocally.");
  for (const id of binding.claimIds) {
    const claim = corpus.claims.find((item) => item.id === id);
    if (!claim || claim.workId !== work.id || !claim.evidence.some((item) => item.sourceId === source.id)) throw new Error("Calculation claims need evidence in the admitted source.");
  }
  if (fixture.a.length !== 2 || fixture.b.length !== 3) throw new Error("Retain the asymmetric rectangular comparison.");
  validateParikhExpected(fixture);
  getSequenceSourcePlan(corpus);
}
