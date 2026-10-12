import corpusSchema from "../../schemas/corpus.schema.json" with { type: "json" };
import type { Atlas, AtlasRelation } from "./atlas-data.ts";

export const evidenceLensValues = {
  evidenceClass: corpusSchema.$defs.relationship.properties.evidenceClass.enum,
  causalLanguage: corpusSchema.$defs.relationship.properties.causalLanguage.enum,
  connectionType: corpusSchema.$defs.relationship.properties.connectionType.enum,
};
export type EvidenceLensField = keyof typeof evidenceLensValues;
export type EvidenceConstraints = Partial<Pick<AtlasRelation["record"], EvidenceLensField>>;
export const evidenceLensFields = Object.keys(evidenceLensValues) as EvidenceLensField[];
export const evidenceLensLabels: Record<EvidenceLensField, string> = {
  evidenceClass: "Evidence class", causalLanguage: "Causal permission", connectionType: "Connection type",
};

function checkedConstraints(input: EvidenceConstraints): EvidenceConstraints {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Evidence lens constraints must be an object.");
  }
  for (const [field, value] of Object.entries(input)) {
    if (!evidenceLensFields.includes(field as EvidenceLensField)) throw new Error(`Unknown evidence lens field: ${field}.`);
    if (typeof value !== "string" || !evidenceLensValues[field as EvidenceLensField].includes(value)) {
      throw new Error(`Invalid evidence lens ${field}: ${String(value)}.`);
    }
  }
  return { ...input };
}

/** Intersect independent fields without replacing evidence or expanding a focus's neighborhood. */
export function projectAtlasEvidenceLens(atlas: Atlas, input: EvidenceConstraints = {}, workId?: string) {
  const constraints = checkedConstraints(input);
  const focus = workId === undefined ? undefined : atlas.byId.get(workId);
  if (workId !== undefined && focus === undefined) throw new Error(`Missing atlas ${workId} evidence lens work.`);
  const isLocal = (relation: AtlasRelation) => workId === undefined || relation.record.from.id === workId || relation.record.to.id === workId;
  const failures = (relation: AtlasRelation) => evidenceLensFields.filter((field) =>
    constraints[field] !== undefined && relation.record[field] !== constraints[field],
  );
  const relationships: AtlasRelation[] = [];
  const excluded: { relation: AtlasRelation; failedFields: EvidenceLensField[] }[] = [];
  const outsideMatches: AtlasRelation[] = [];
  let outsideTotal = 0;
  for (const relation of atlas.relationships) {
    const failedFields = failures(relation);
    if (isLocal(relation)) {
      if (failedFields.length === 0) relationships.push(relation);
      else excluded.push({ relation, failedFields });
    } else {
      outsideTotal++;
      if (failedFields.length === 0) outsideMatches.push(relation);
    }
  }
  return {
    scope: workId === undefined ? "global" as const : "neighborhood" as const,
    focus,
    constraints,
    relationships,
    excluded,
    outsideMatches,
    counts: {
      matched: relationships.length,
      total: relationships.length + excluded.length,
      excluded: excluded.length,
      outsideMatched: outsideMatches.length,
      outsideTotal,
      globalMatched: relationships.length + outsideMatches.length,
      globalTotal: atlas.relationships.length,
    },
  };
}

export type AtlasEvidenceLens = ReturnType<typeof projectAtlasEvidenceLens>;

export const atlasEvidenceLenses: { key: string; label: string; constraints: EvidenceConstraints }[] = [
  { key: "all", label: "All records", constraints: {} },
  { key: "documented", label: "Documented", constraints: { evidenceClass: "documented-influence" } },
  { key: "inherited", label: "Inherited mechanism", constraints: { evidenceClass: "inherited-mechanism" } },
  { key: "editorial", label: "Editorial synthesis", constraints: { evidenceClass: "editorial-synthesis" } },
  { key: "prohibited", label: "Causal prohibition", constraints: { causalLanguage: "prohibited" } },
  { key: "documented-prohibited", label: "Documented + prohibition", constraints: { evidenceClass: "documented-influence", causalLanguage: "prohibited" } },
  { key: "editorial-prohibited", label: "Editorial + prohibition", constraints: { evidenceClass: "editorial-synthesis", causalLanguage: "prohibited" } },
  { key: "documented-qualified-builds", label: "Documented + qualified + builds-on", constraints: { evidenceClass: "documented-influence", causalLanguage: "qualified", connectionType: "builds-on" } },
];

export const atlasLensTasks: Record<string, { prompt: string; explanation: string }> = {
  opening: {
    prompt: "Compare Documented with Editorial + prohibition. Reconcile local and global matches, then explain why a local zero cannot establish that historical influence was absent.",
    explanation: "The sole incident bridge is editorial and prohibits causal language. The Documented lens has no local match; its global matches are elsewhere. Missing reviewed evidence does not prove that influence never occurred. Inspect the bridge's exact rationale and calendar boundary.",
  },
  "carried-state": {
    prompt: "Apply the three-field lens: documented, qualified and builds-on. Identify both retained records, explain every excluded field, and audit which architectural mechanism the Mikolov connection carries.",
    explanation: "The Miikkulainen–Dyer and Mikolov records remain. Bengio's combines and the original-LSTM addresses records fail only the builds-on constraint. Exclusion describes this lens, not false evidence or lower importance. Elman's ordering report is April 1988; its canonical article is March 1990. The Mikolov link does not transfer training, data or results.",
  },
  "documented-comparison": {
    prompt: "Compare Documented with Documented + prohibition. Explain why the Bahdanau record survives, then name every field it fails in the three-field lens. Reach the v1 and v7 comparison locators.",
    explanation: "The Bahdanau comparison is documented and still prohibits causal language. It fails the three-field lens on permission (prohibited rather than qualified) and type (addresses rather than builds-on). The comparison is bound to Bahdanau v1 article p. 9 and v7 article p. 8, section 6.1. It does not establish derivation or inspiration.",
  },
  "parallel-development": {
    prompt: "Compare Documented with Editorial + prohibition. Locate the Sutskever parallel-development record. Then reconcile the Inherited mechanism lens's local zero with its global count and delimit what the posting dates establish.",
    explanation: "The Sutskever conceptual parallel is editorial and causal wording is prohibited. Its parallel-development evidence is version-1-specific. The inherited-mechanism record elsewhere is outside Cho's incident list. June and September posting dates establish public posting order, not conception priority or direct derivation.",
  },
};
