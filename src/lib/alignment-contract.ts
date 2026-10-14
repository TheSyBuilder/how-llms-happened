import { validateAlignmentFixture, type AlignmentFixture } from "./alignment-engine.ts";
import type { Corpus, JourneyManifest } from "./site-data.ts";

export const ALIGNMENT_WORK_IDS = [
  "cho-2014-rnn-encoder-decoder",
  "sutskever-vinyals-le-2014-sequence-to-sequence",
  "bahdanau-cho-bengio-2014-neural-machine-translation",
  "luong-pham-manning-2015-effective-attention-nmt",
] as const;

const OPERATIONS = {
  "conditional-output": {
    stage: "cho-2014", version: "cho-2014-emnlp-version", sources: ["cho-2014-acl-full-text"],
    claims: ["cho-2014-conditional-objective", "cho-2014-generation-and-scoring"],
  },
  "cho-reset": {
    stage: "cho-2014", version: "cho-2014-emnlp-version", sources: ["cho-2014-acl-full-text", "cho-2014-acl-attachment"],
    claims: ["cho-2014-reset-update-gates", "cho-2014-reset-equation-version-boundary"],
  },
  "source-reversal": {
    stage: "sutskever-2014", version: "sutskever-2014-nips-version", sources: ["sutskever-2014-neurips-full-text"],
    claims: ["sutskever-2014-reversal-intervention", "sutskever-2014-reversal-explanation-boundary"],
  },
  "bahdanau-read": {
    stage: "bahdanau-2014-2015", version: "bahdanau-2014-arxiv-v5-version", sources: ["bahdanau-2014-arxiv-v5-full-text"],
    claims: ["bahdanau-2014-soft-attention-context", "bahdanau-2014-bidirectional-annotations", "bahdanau-2014-equation-version-boundary"],
  },
} as const;

function equalSet(actual: string[], expected: string[], label: string): void {
  if (JSON.stringify([...new Set(actual)].sort()) !== JSON.stringify([...new Set(expected)].sort())) {
    throw new Error(`${label} must retain its complete source-scoped inventory.`);
  }
}

/** A calculation binding covers operations; the manifest also owns experimental and historical evidence. */
export function validateAlignmentContract(corpus: Corpus, manifest: JourneyManifest, fixture: AlignmentFixture): void {
  validateAlignmentFixture(fixture);
  if (manifest.id !== "encoder-decoder-alignment"
    || JSON.stringify(manifest.stages.map((stage) => stage.workId)) !== JSON.stringify(ALIGNMENT_WORK_IDS)) {
    throw new Error("Alignment teaching order must retain the selected four works.");
  }
  for (const stage of manifest.stages) {
    const allClaims = corpus.claims.filter((claim) => claim.workId === stage.workId).map((claim) => claim.id);
    equalSet(stage.blocks.expert.flatMap((block) => block.claimIds), allClaims, `${stage.slug} expert claims`);
    for (const mode of ["beginner", "expert"] as const) {
      const objective = corpus.learningObjectives.find((item) => item.id === stage.objectiveIds[mode]);
      if (objective === undefined || objective.mode !== mode || !objective.workIds.includes(stage.workId)) {
        throw new Error(`${stage.slug} must bind its ${mode} objective.`);
      }
      const assigned = new Set(stage.blocks[mode].flatMap((block) => block.claimIds));
      if (objective.claimIds.some((id) => !assigned.has(id))) throw new Error(`${stage.slug} omits a ${mode} objective claim.`);
    }
  }
  equalSet(fixture.scenarios.map((scenario) => scenario.kind), Object.keys(OPERATIONS), "Calculation families");
  equalSet(fixture.scenarios.filter((scenario) => scenario.kind === "bahdanau-read").map((scenario) => scenario.case),
    ["changing-query", "equal-energies", "identical-annotations"], "Read safeguards");
  equalSet(fixture.scenarios.map((scenario) => scenario.bindingId), fixture.bindings.map((binding) => binding.id), "Used bindings");
  for (const scenario of fixture.scenarios) {
    const operation = OPERATIONS[scenario.kind];
    const stage = manifest.stages.find((item) => item.slug === scenario.sourceStage);
    const binding = fixture.bindings.find((item) => item.id === scenario.bindingId)!;
    if (scenario.sourceStage !== operation.stage || stage === undefined) throw new Error(`${scenario.id} belongs to a different source stage.`);
    equalSet(binding.versionIds, [operation.version], `${scenario.id} versions`);
    equalSet(binding.sourceIds, [...operation.sources], `${scenario.id} sources`);
    equalSet(binding.claimIds, [...operation.claims], `${scenario.id} operation claims`);
    const version = corpus.works.flatMap((work) => work.versions).find((item) => item.id === operation.version);
    if (version === undefined) throw new Error(`Unknown operation version ${operation.version}.`);
    for (const sourceId of binding.sourceIds) {
      if (!version.sourceIds.includes(sourceId) || !corpus.sources.some((source) => source.id === sourceId && source.versionIds.includes(version.id))) {
        throw new Error(`${scenario.id} source does not belong to the operation version.`);
      }
    }
    for (const claimId of binding.claimIds) {
      const claim = corpus.claims.find((item) => item.id === claimId);
      if (claim === undefined || claim.workId !== stage.workId
        || !claim.evidence.some((evidence) => binding.sourceIds.includes(evidence.sourceId))) {
        throw new Error(`${scenario.id} claim ${claimId} lacks operation-source evidence.`);
      }
    }
  }
}
