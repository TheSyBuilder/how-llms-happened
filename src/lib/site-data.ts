import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import Ajv2020, { type AnySchema, type ErrorObject } from "ajv/dist/2020.js";

import { validateCorpus } from "../../scripts/lib/validate-corpus.mjs";
import {
  calculateChenScenario,
  type ChenFixture,
  validateChenScenario,
} from "./chen-goodman-engine.ts";
import {
  assertKatzExpected,
  calculateKatzScenario,
  type KatzFixture,
} from "./katz-engine.ts";
import {
  type KneserFixture,
  validateKneserScenario,
} from "./kneser-ney-engine.ts";
import {
  type ElmanScenario,
  type OriginalCellScenario,
  type RecurrentFixture,
  validateRecurrentFixture,
} from "./recurrent-memory-engine.ts";

export type Mode = "beginner" | "expert";
export type StageStatus = "built" | "planned";

type UnknownRecord = Record<string, unknown>;

type DateValue = {
  value: string;
  precision: "day" | "month" | "year";
  calendar: string;
};

type ChronologyEvent = {
  id: string;
  kind: string;
  label: string;
  date: DateValue;
  versionId?: string;
};

type Version = {
  id: string;
  title: string;
  authors: string[];
  kind: string;
  label: string;
  bibliography: { citation: string };
  sourceIds: string[];
  notes?: string;
};

type Work = {
  id: string;
  title: string;
  authors: string[];
  displayCitation: string;
  chronology: {
    orderingEventId: string;
    events: ChronologyEvent[];
  };
  versions: Version[];
  canonicalVersionId: string;
  sourceIds: string[];
  preferredSourceIds: string[];
  ideaIds: string[];
  inclusion: {
    status: string;
    confidence: "high" | "medium" | "low";
    rationale: string;
  };
  significance: Record<Mode, string>;
  limitations: string[];
  uncertainties: Array<{ status: string; note: string; resolutionCondition?: string }>;
};

type Source = {
  id: string;
  relatedWorkIds: string[];
  title: string;
  url: string;
  accessDate: string;
  sourceClass: string;
  authority: string;
  versionIds: string[];
  accessNote: string;
};

type Locator = {
  label: string;
  section?: string;
  pageStart?: number;
  pageEnd?: number;
  equation?: string;
  table?: string;
  paragraph?: string;
};

type ClaimEvidence = {
  sourceId: string;
  locator: Locator;
  support: string;
};

type Claim = {
  id: string;
  workId: string;
  ideaIds: string[];
  statement: string;
  directness: "direct" | "editorial-inference";
  confidence: "high" | "medium" | "low";
  evidence: ClaimEvidence[];
  limitations: string[];
  uncertainties: Array<{ status: string; note: string; resolutionCondition?: string }>;
  checkedDate: string;
};

type LearningObjective = {
  id: string;
  mode: Mode;
  objective: string;
  workIds: string[];
  ideaIds: string[];
  claimIds: string[];
  prerequisites: string[];
  successCriterion: string;
};

type Relationship = {
  id: string;
  from: { kind: string; id: string };
  to: { kind: string; id: string };
  connectionType: string;
  evidenceClass: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
  claimIds: string[];
  causalLanguage: string;
};

type Idea = {
  id: string;
  name: string;
  kind: string;
  description: string;
  claimIds: string[];
  uncertainties: Array<{ status: string; note: string }>;
};

type Corpus = {
  title: string;
  schemaVersion: string;
  asOf: string;
  works: Work[];
  sources: Source[];
  claims: Claim[];
  relationships: Relationship[];
  ideas: Idea[];
  learningObjectives: LearningObjective[];
};

export type ManifestBlock = {
  id: string;
  kind:
    | "instruction"
    | "prompt"
    | "navigation"
    | "explanation"
    | "comparison"
    | "equation"
    | "result"
    | "limitation"
    | "lineage";
  heading: string;
  body: string;
  claimIds: string[];
};

type StageManifest = {
  slug: string;
  workId: string;
  status: StageStatus;
  objectiveIds: Record<Mode, string>;
  contribution: { text: string; claimIds: string[] };
  blocks: Record<Mode, ManifestBlock[]>;
};

type JourneyInterlude = {
  id: string;
  kind: "prerequisite" | "bridge";
  placement: "before" | "after";
  stageSlug: string;
  title: string;
  relatedJourneyId?: string;
  workIds: string[];
  blocks: Record<Mode, ManifestBlock[]>;
};

export type JourneyManifest = {
  id: string;
  slug: string;
  title: string;
  question: string;
  estimatedMinutes: Record<Mode, number>;
  stages: StageManifest[];
  interludes?: JourneyInterlude[];
};

export type GoodFixture = {
  id: string;
  kind: "good-unseen-mass";
  label: "Synthetic example";
  description: string;
  representedClaimIds: string[];
  observedTypes: Array<{ label: string; count: number }>;
  expected: {
    sampleSize: number;
    singletonTypes: number;
    representedMass: number;
    unseenMass: number;
  };
};

export type WorkSummary = {
  id: string;
  title: string;
  authors: string[];
  citation: string;
  chronologyLabel: string;
  chronologyDate: string;
  inclusionStatus: string;
  inclusionConfidence: "high" | "medium" | "low";
  inclusionRationale: string;
  significance: Record<Mode, string>;
};

export type VersionSummary = {
  id: string;
  label: string;
  kind: string;
  citation: string;
  notes?: string;
};

export type ObjectiveView = LearningObjective;

export type EvidenceView = {
  claimId: string;
  statement: string;
  directness: "direct" | "editorial-inference";
  confidence: "high" | "medium" | "low";
  workId: string;
  versionIds: string[];
  sources: Array<{
    sourceId: string;
    title: string;
    url: string;
    locator: string;
    support: string;
    accessDate: string;
    authority: string;
    accessNote: string;
  }>;
  limitations: string[];
  uncertainties: string[];
};

export type ResolvedBlock = ManifestBlock & {
  evidence: EvidenceView[];
};

export type RouteRef = {
  href: string;
  label: string;
};

export type StageView = {
  journeyId: string;
  mode: Mode;
  stage: { slug: string; position: number; total: number };
  work: WorkSummary;
  canonicalVersion: VersionSummary;
  objective: ObjectiveView;
  contribution: string;
  blocks: ResolvedBlock[];
  limitations: string[];
  uncertainties: string[];
  evidence: EvidenceView[];
  goodFixture?: GoodFixture;
  katzFixture?: KatzFixture;
  kneserFixture?: KneserFixture;
  chenFixture?: ChenFixture;
  elmanScenario?: ElmanScenario;
  originalCellScenario?: OriginalCellScenario;
  previous?: RouteRef;
  next?: RouteRef;
  alternateMode: RouteRef;
};

export type JourneyStageSummary = {
  slug: string;
  status: StageStatus;
  position: number;
  work: WorkSummary;
  contribution: string;
};

export type JourneyOverview = {
  id: string;
  slug: string;
  title: string;
  question: string;
  estimatedMinutes: Record<Mode, number>;
  stages: JourneyStageSummary[];
};

export type WorkReferenceView = {
  work: WorkSummary;
  canonicalVersion: VersionSummary;
  versions: VersionSummary[];
  ideas: Idea[];
  claims: EvidenceView[];
  limitations: string[];
  uncertainties: Array<{ status: string; note: string; resolutionCondition?: string }>;
  relationships: Relationship[];
};

type Indexes = {
  works: Map<string, Work>;
  versions: Map<string, Version>;
  sources: Map<string, Source>;
  claims: Map<string, Claim>;
  relationships: Map<string, Relationship>;
  objectives: Map<string, LearningObjective>;
  ideas: Map<string, Idea>;
};

const FACTUAL_BLOCK_KINDS = new Set<ManifestBlock["kind"]>([
  "explanation",
  "comparison",
  "equation",
  "result",
  "limitation",
  "lineage",
]);

function readJson(relativePath: string): unknown {
  const path = resolve(process.cwd(), relativePath);
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function formatSchemaErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
    .join("; ");
}

function assertRecord(value: unknown, label: string): asserts value is UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertUnique<T extends { id: string }>(items: T[], label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`Duplicate ${label} id: ${item.id}`);
    }
    seen.add(item.id);
  }
}

function required<T>(map: Map<string, T>, id: string, label: string): T {
  const value = map.get(id);
  if (value === undefined) {
    throw new Error(`Missing ${label}: ${id}`);
  }
  return value;
}

function closeEnough(left: number, right: number): boolean {
  return Math.abs(left - right) <= 1e-9;
}

function makeIndexes(corpus: Corpus): Indexes {
  const versions = corpus.works.flatMap((work) => work.versions);
  assertUnique(corpus.works, "work");
  assertUnique(versions, "version");
  assertUnique(corpus.sources, "source");
  assertUnique(corpus.claims, "claim");
  assertUnique(corpus.relationships, "relationship");
  assertUnique(corpus.learningObjectives, "learning objective");
  assertUnique(corpus.ideas, "idea");

  return {
    works: new Map(corpus.works.map((item) => [item.id, item])),
    versions: new Map(versions.map((item) => [item.id, item])),
    sources: new Map(corpus.sources.map((item) => [item.id, item])),
    claims: new Map(corpus.claims.map((item) => [item.id, item])),
    relationships: new Map(corpus.relationships.map((item) => [item.id, item])),
    objectives: new Map(corpus.learningObjectives.map((item) => [item.id, item])),
    ideas: new Map(corpus.ideas.map((item) => [item.id, item])),
  };
}

function validateManifest(manifest: JourneyManifest, indexes: Indexes): void {
  const stageSlugs = new Set<string>();
  const blockIds = new Set<string>();

  for (const stage of manifest.stages) {
    if (stageSlugs.has(stage.slug)) {
      throw new Error(`Duplicate journey stage slug: ${stage.slug}`);
    }
    stageSlugs.add(stage.slug);
    required(indexes.works, stage.workId, "stage work");

    for (const mode of ["beginner", "expert"] as const) {
      const objective = required(
        indexes.objectives,
        stage.objectiveIds[mode],
        `${mode} stage objective`,
      );
      if (objective.mode !== mode) {
        throw new Error(`${objective.id} has mode ${objective.mode}, expected ${mode}.`);
      }
      if (!objective.workIds.includes(stage.workId)) {
        throw new Error(`${objective.id} is not bound to stage work ${stage.workId}.`);
      }

      for (const block of stage.blocks[mode]) {
        if (blockIds.has(block.id)) {
          throw new Error(`Duplicate journey block id: ${block.id}`);
        }
        blockIds.add(block.id);
        if (FACTUAL_BLOCK_KINDS.has(block.kind) && block.claimIds.length === 0) {
          throw new Error(`Factual block ${block.id} must declare at least one claim.`);
        }
        for (const claimId of block.claimIds) {
          const claim = required(indexes.claims, claimId, `claim for block ${block.id}`);
          if (claim.workId !== stage.workId) {
            throw new Error(
              `Block ${block.id} binds ${claimId} from ${claim.workId}, not ${stage.workId}.`,
            );
          }
        }
      }
    }

    for (const claimId of stage.contribution.claimIds) {
      const claim = required(indexes.claims, claimId, `contribution claim for ${stage.slug}`);
      if (claim.workId !== stage.workId) {
        throw new Error(`Stage ${stage.slug} contribution claim ${claimId} belongs to another work.`);
      }
    }
  }

  const interludeIds = new Set<string>();
  for (const interlude of manifest.interludes ?? []) {
    if (interludeIds.has(interlude.id)) {
      throw new Error(`Duplicate journey interlude id: ${interlude.id}`);
    }
    interludeIds.add(interlude.id);
    if (!stageSlugs.has(interlude.stageSlug)) {
      throw new Error(`Interlude ${interlude.id} targets unknown stage ${interlude.stageSlug}.`);
    }
    if (interlude.kind === "bridge" && interlude.relatedJourneyId === undefined) {
      throw new Error(`Bridge ${interlude.id} must declare a related journey.`);
    }
    for (const workId of interlude.workIds) required(indexes.works, workId, "interlude work");
    for (const mode of ["beginner", "expert"] as const) {
      for (const block of interlude.blocks[mode]) {
        if (blockIds.has(block.id)) throw new Error(`Duplicate journey block id: ${block.id}`);
        blockIds.add(block.id);
        if (FACTUAL_BLOCK_KINDS.has(block.kind) && block.claimIds.length === 0) {
          throw new Error(`Factual block ${block.id} must declare at least one claim.`);
        }
        for (const claimId of block.claimIds) {
          const claim = required(indexes.claims, claimId, `claim for interlude block ${block.id}`);
          if (!interlude.workIds.includes(claim.workId)) {
            throw new Error(
              `Interlude ${interlude.id} does not declare work ${claim.workId} for claim ${claimId}.`,
            );
          }
        }
      }
    }
  }
}

function validateFixture(fixture: GoodFixture, indexes: Indexes): void {
  for (const claimId of fixture.representedClaimIds) {
    const claim = required(indexes.claims, claimId, "fixture claim");
    if (claim.workId !== "good-1953-population-frequencies") {
      throw new Error(`Good fixture cannot represent claim from ${claim.workId}.`);
    }
  }

  const sampleSize = fixture.observedTypes.reduce((total, item) => total + item.count, 0);
  const singletonTypes = fixture.observedTypes.filter((item) => item.count === 1).length;
  const unseenMass = singletonTypes / sampleSize;
  const representedMass = 1 - unseenMass;

  if (sampleSize !== fixture.expected.sampleSize) {
    throw new Error(`Fixture ${fixture.id} sample-size invariant failed.`);
  }
  if (singletonTypes !== fixture.expected.singletonTypes) {
    throw new Error(`Fixture ${fixture.id} singleton-count invariant failed.`);
  }
  if (!closeEnough(unseenMass, fixture.expected.unseenMass)) {
    throw new Error(`Fixture ${fixture.id} unseen-mass invariant failed.`);
  }
  if (!closeEnough(representedMass, fixture.expected.representedMass)) {
    throw new Error(`Fixture ${fixture.id} represented-mass invariant failed.`);
  }
  if (!closeEnough(unseenMass + representedMass, 1)) {
    throw new Error(`Fixture ${fixture.id} normalization invariant failed.`);
  }
}

function validateKatzFixture(fixture: KatzFixture, indexes: Indexes): void {
  const scenarioIds = new Set<string>();
  for (const claimId of fixture.representedClaimIds) {
    const claim = required(indexes.claims, claimId, "Katz fixture claim");
    if (claim.workId !== "katz-1987-sparse-data") {
      throw new Error(`Katz fixture cannot represent claim from ${claim.workId}.`);
    }
  }

  for (const scenario of fixture.scenarios) {
    if (scenarioIds.has(scenario.id)) {
      throw new Error(`Duplicate Katz scenario id: ${scenario.id}`);
    }
    scenarioIds.add(scenario.id);
    const result = calculateKatzScenario(scenario);
    assertKatzExpected(scenario, result);
    if (!closeEnough(result.total, 1)) {
      throw new Error(`Katz fixture ${scenario.id} normalization invariant failed.`);
    }
    if (result.continuations.some((item) => item.finalProbability < 0)) {
      throw new Error(`Katz fixture ${scenario.id} produced a negative probability.`);
    }
  }

  if (!fixture.scenarios.some((scenario) => scenario.modes.includes("beginner"))) {
    throw new Error("Katz fixture must expose at least one beginner scenario.");
  }
  if (!fixture.scenarios.some((scenario) => scenario.modes.includes("expert"))) {
    throw new Error("Katz fixture must expose at least one expert scenario.");
  }
}

function validateKneserFixture(fixture: KneserFixture, indexes: Indexes): void {
  const scenarioIds = new Set<string>();
  const stateIds = new Set<string>();
  for (const claimId of fixture.representedClaimIds) {
    const claim = required(indexes.claims, claimId, "Kneser–Ney fixture claim");
    if (claim.workId !== "kneser-ney-1995-improved-backing-off") {
      throw new Error(`Kneser–Ney fixture cannot represent claim from ${claim.workId}.`);
    }
  }

  for (const scenario of fixture.scenarios) {
    if (scenarioIds.has(scenario.id)) throw new Error(`Duplicate Kneser–Ney scenario id: ${scenario.id}`);
    scenarioIds.add(scenario.id);
    for (const state of scenario.states) {
      if (stateIds.has(state.id)) throw new Error(`Duplicate Kneser–Ney state id: ${state.id}`);
      stateIds.add(state.id);
    }
    validateKneserScenario(scenario);
  }

  if (!fixture.scenarios.some((scenario) => scenario.modes.includes("beginner"))) {
    throw new Error("Kneser–Ney fixture must expose at least one beginner scenario.");
  }
  if (!fixture.scenarios.some((scenario) => scenario.modes.includes("expert"))) {
    throw new Error("Kneser–Ney fixture must expose at least one expert scenario.");
  }
}

function validateChenFixture(fixture: ChenFixture, indexes: Indexes): void {
  const scenarioIds = new Set<string>();
  for (const claimId of fixture.representedClaimIds) {
    const claim = required(indexes.claims, claimId, "Chen–Goodman fixture claim");
    if (claim.workId !== "chen-goodman-1998-empirical-smoothing") {
      throw new Error(`Chen–Goodman fixture cannot represent claim from ${claim.workId}.`);
    }
  }
  for (const scenario of fixture.scenarios) {
    if (scenarioIds.has(scenario.id)) throw new Error(`Duplicate Chen–Goodman scenario id: ${scenario.id}`);
    scenarioIds.add(scenario.id);
    validateChenScenario(scenario);
    for (const variant of ["single", "modified"] as const) {
      const result = calculateChenScenario(scenario, variant);
      if (result.continuations.some((item) => item.finalProbability < 0)) {
        throw new Error(`Chen–Goodman fixture ${scenario.id} produced a negative probability.`);
      }
    }
  }
  if (!fixture.scenarios.some((scenario) => scenario.modes.includes("beginner"))) {
    throw new Error("Chen–Goodman fixture must expose at least one beginner scenario.");
  }
  if (!fixture.scenarios.some((scenario) => scenario.modes.includes("expert"))) {
    throw new Error("Chen–Goodman fixture must expose at least one expert scenario.");
  }
}

function validateRecurrentFixtureBindings(
  fixture: RecurrentFixture,
  recurrentManifest: JourneyManifest,
  indexes: Indexes,
): void {
  validateRecurrentFixture(fixture);
  const interactiveWorkIds = new Set([
    "elman-1988-finding-structure-in-time",
    "hochreiter-schmidhuber-1995-long-short-term-memory",
    "gers-schmidhuber-cummins-1999-learning-to-forget",
    "gers-schraudolph-schmidhuber-2002-precise-timing",
  ]);
  for (const claimId of fixture.representedClaimIds) {
    const claim = required(indexes.claims, claimId, "recurrent fixture claim");
    if (!interactiveWorkIds.has(claim.workId)) {
      throw new Error(`Recurrent fixture cannot represent interactive claim from ${claim.workId}.`);
    }
  }
  for (const objectiveId of fixture.representedObjectiveIds) {
    const objective = required(indexes.objectives, objectiveId, "recurrent fixture objective");
    if (objective.workIds.length !== 1 || !interactiveWorkIds.has(objective.workIds[0] ?? "")) {
      throw new Error(`Recurrent fixture objective ${objectiveId} is outside the interactive stages.`);
    }
  }
  const stageSlugs = new Set(recurrentManifest.stages.map((stage) => stage.slug));
  const expectedStageByKind = new Map<RecurrentFixture["scenarios"][number]["kind"], string>([
    ["elman-history-contrast", "elman-1988-1990"],
    ["original-cell-credit", "hochreiter-schmidhuber-1995-1997"],
    ["forget-retention", "gers-1999-2000"],
    ["peephole-inspection", "gers-2002"],
  ]);
  for (const scenario of fixture.scenarios) {
    if (!stageSlugs.has(scenario.sourceStage)) {
      throw new Error(`Recurrent scenario ${scenario.id} targets unknown stage ${scenario.sourceStage}.`);
    }
    if (scenario.sourceStage !== expectedStageByKind.get(scenario.kind)) {
      throw new Error(`Recurrent scenario ${scenario.id} is bound to the wrong historical stage.`);
    }
  }
}

const rawCorpus = readJson("data/corpus.json");
const rawCorpusSchema = readJson("schemas/corpus.schema.json");
const corpusErrors = validateCorpus(rawCorpus, rawCorpusSchema);
if (corpusErrors.length > 0) {
  throw new Error(`Corpus validation failed before page generation:\n${corpusErrors.join("\n")}`);
}
assertRecord(rawCorpus, "Corpus");
const corpus = rawCorpus as Corpus;
const indexes = makeIndexes(corpus);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const rawJourneySchema = readJson("schemas/journey.schema.json");
const rawFixtureSchema = readJson("schemas/fixture.schema.json");
const rawKatzFixtureSchema = readJson("schemas/katz-fixture.schema.json");
const rawKneserFixtureSchema = readJson("schemas/kneser-ney-fixture.schema.json");
const rawChenFixtureSchema = readJson("schemas/chen-goodman-fixture.schema.json");
const rawRecurrentFixtureSchema = readJson("schemas/recurrent-memory-fixture.schema.json");
const rawManifest = readJson("data/journeys/smoothing.json");
const rawRecurrentManifest = readJson("data/journeys/recurrent-memory.json");
const rawFixture = readJson("data/fixtures/good-singleton-reserve.json");
const rawKatzFixture = readJson("data/fixtures/katz-probability-mass.json");
const rawKneserFixture = readJson("data/fixtures/kneser-ney-context-coverage.json");
const rawChenFixture = readJson("data/fixtures/chen-goodman-interpolation-discounts.json");
const rawRecurrentFixture = readJson("data/fixtures/recurrent-memory-trace.json");
const journeyValidator = ajv.compile(rawJourneySchema as AnySchema);
const fixtureValidator = ajv.compile(rawFixtureSchema as AnySchema);
const katzFixtureValidator = ajv.compile(rawKatzFixtureSchema as AnySchema);
const kneserFixtureValidator = ajv.compile(rawKneserFixtureSchema as AnySchema);
const chenFixtureValidator = ajv.compile(rawChenFixtureSchema as AnySchema);
const recurrentFixtureValidator = ajv.compile(rawRecurrentFixtureSchema as AnySchema);

if (!journeyValidator(rawManifest)) {
  throw new Error(`Journey schema failed: ${formatSchemaErrors(journeyValidator.errors)}`);
}
if (!journeyValidator(rawRecurrentManifest)) {
  throw new Error(`Recurrent journey schema failed: ${formatSchemaErrors(journeyValidator.errors)}`);
}
if (!fixtureValidator(rawFixture)) {
  throw new Error(`Fixture schema failed: ${formatSchemaErrors(fixtureValidator.errors)}`);
}
if (!katzFixtureValidator(rawKatzFixture)) {
  throw new Error(`Katz fixture schema failed: ${formatSchemaErrors(katzFixtureValidator.errors)}`);
}
if (!kneserFixtureValidator(rawKneserFixture)) {
  throw new Error(`Kneser–Ney fixture schema failed: ${formatSchemaErrors(kneserFixtureValidator.errors)}`);
}
if (!chenFixtureValidator(rawChenFixture)) {
  throw new Error(`Chen–Goodman fixture schema failed: ${formatSchemaErrors(chenFixtureValidator.errors)}`);
}
if (!recurrentFixtureValidator(rawRecurrentFixture)) {
  throw new Error(`Recurrent fixture schema failed: ${formatSchemaErrors(recurrentFixtureValidator.errors)}`);
}

const manifest = rawManifest as JourneyManifest;
const recurrentManifest = rawRecurrentManifest as JourneyManifest;
const goodFixture = rawFixture as GoodFixture;
const katzFixture = rawKatzFixture as KatzFixture;
const kneserFixture = rawKneserFixture as KneserFixture;
const chenFixture = rawChenFixture as ChenFixture;
const recurrentFixture = rawRecurrentFixture as RecurrentFixture;
validateManifest(manifest, indexes);
validateManifest(recurrentManifest, indexes);
validateFixture(goodFixture, indexes);
validateKatzFixture(katzFixture, indexes);
validateKneserFixture(kneserFixture, indexes);
validateChenFixture(chenFixture, indexes);
validateRecurrentFixtureBindings(recurrentFixture, recurrentManifest, indexes);
if (Buffer.byteLength(readFileSync(resolve(process.cwd(), "data/fixtures/recurrent-memory-trace.json"), "utf8")) >= 8 * 1024) {
  throw new Error("Recurrent fixture must stay below 8 KB.");
}

function chronologySummary(work: Work): { label: string; date: string } {
  const event = work.chronology.events.find((item) => item.id === work.chronology.orderingEventId);
  if (event === undefined) {
    throw new Error(`Work ${work.id} is missing its ordering event.`);
  }
  return { label: event.label, date: event.date.value };
}

function workSummary(work: Work): WorkSummary {
  const chronology = chronologySummary(work);
  return {
    id: work.id,
    title: work.title,
    authors: work.authors,
    citation: work.displayCitation,
    chronologyLabel: chronology.label,
    chronologyDate: chronology.date,
    inclusionStatus: work.inclusion.status,
    inclusionConfidence: work.inclusion.confidence,
    inclusionRationale: work.inclusion.rationale,
    significance: work.significance,
  };
}

function versionSummary(version: Version): VersionSummary {
  return {
    id: version.id,
    label: version.label,
    kind: version.kind,
    citation: version.bibliography.citation,
    ...(version.notes === undefined ? {} : { notes: version.notes }),
  };
}

function evidenceView(claim: Claim): EvidenceView {
  const sources = claim.evidence.map((evidence) => {
    const source = required(indexes.sources, evidence.sourceId, `source for ${claim.id}`);
    return {
      sourceId: source.id,
      title: source.title,
      url: source.url,
      locator: evidence.locator.label,
      support: evidence.support,
      accessDate: source.accessDate,
      authority: source.authority,
      accessNote: source.accessNote,
    };
  });

  return {
    claimId: claim.id,
    statement: claim.statement,
    directness: claim.directness,
    confidence: claim.confidence,
    workId: claim.workId,
    versionIds: [...new Set(sources.flatMap((source) => required(indexes.sources, source.sourceId, "source").versionIds))],
    sources,
    limitations: claim.limitations,
    uncertainties: claim.uncertainties.map((item) => item.note),
  };
}

export type JourneyId = "smoothing" | "recurrent-memory";

function journeyManifest(id: JourneyId): JourneyManifest {
  if (id === "smoothing") return manifest;
  if (id === "recurrent-memory") return recurrentManifest;
  throw new Error(`Unknown journey: ${id}`);
}

function stageRoute(mode: Mode, slug: string, journey: JourneyManifest): string {
  return `/journeys/${journey.slug}/${mode}/${slug}/`;
}

export function getJourneyOverview(journeyId: JourneyId = "smoothing"): JourneyOverview {
  const manifest = journeyManifest(journeyId);
  return {
    id: manifest.id,
    slug: manifest.slug,
    title: manifest.title,
    question: manifest.question,
    estimatedMinutes: manifest.estimatedMinutes,
    stages: manifest.stages.map((stage, index) => ({
      slug: stage.slug,
      status: stage.status,
      position: index + 1,
      work: workSummary(required(indexes.works, stage.workId, "stage work")),
      contribution: stage.contribution.text,
    })),
  };
}

export function getBuiltStagePaths(journeyId: JourneyId = "smoothing"): Array<{ params: { mode: Mode; stage: string } }> {
  const manifest = journeyManifest(journeyId);
  return manifest.stages
    .filter((stage) => stage.status === "built")
    .flatMap((stage) =>
      (["beginner", "expert"] as const).map((mode) => ({
        params: { mode, stage: stage.slug },
      })),
    );
}

export function getStageView(mode: Mode, slug: string, journeyId: JourneyId = "smoothing"): StageView {
  const manifest = journeyManifest(journeyId);
  const position = manifest.stages.findIndex((item) => item.slug === slug);
  if (position < 0) {
    throw new Error(`Unknown journey stage: ${slug}`);
  }
  const stage = manifest.stages[position];
  if (stage === undefined) {
    throw new Error(`Journey stage index ${position} is unavailable.`);
  }
  if (stage.status !== "built") {
    throw new Error(`Journey stage ${slug} is not built yet.`);
  }

  const work = required(indexes.works, stage.workId, "stage work");
  const canonicalVersion = required(indexes.versions, work.canonicalVersionId, "canonical version");
  const objective = required(indexes.objectives, stage.objectiveIds[mode], "stage objective");
  const blocks = stage.blocks[mode].map((block) => ({
    ...block,
    evidence: block.claimIds.map((id) => evidenceView(required(indexes.claims, id, "block claim"))),
  }));
  const evidence = [
    ...new Set([
      ...objective.claimIds,
      ...stage.contribution.claimIds,
      ...blocks.flatMap((block) => block.claimIds),
    ]),
  ].map((id) => evidenceView(required(indexes.claims, id, "stage evidence")));

  const previousStage = manifest.stages[position - 1];
  const nextStage = manifest.stages[position + 1];
  const previous = previousStage?.status === "built"
    ? { href: stageRoute(mode, previousStage.slug, manifest), label: previousStage.slug }
    : undefined;
  const next = nextStage?.status === "built"
    ? { href: stageRoute(mode, nextStage.slug, manifest), label: nextStage.slug }
    : undefined;
  const elmanScenario = stage.slug === "elman-1988-1990"
    ? recurrentFixture.scenarios.find(
      (scenario): scenario is ElmanScenario => scenario.kind === "elman-history-contrast",
    )
    : undefined;
  if (stage.slug === "elman-1988-1990" && elmanScenario === undefined) {
    throw new Error("Elman is missing its reviewed history contrast.");
  }
  const originalCellScenario = stage.slug === "hochreiter-schmidhuber-1995-1997"
    ? recurrentFixture.scenarios.find(
      (scenario): scenario is OriginalCellScenario => scenario.kind === "original-cell-credit",
    )
    : undefined;
  if (stage.slug === "hochreiter-schmidhuber-1995-1997" && originalCellScenario === undefined) {
    throw new Error("Original LSTM is missing its reviewed state-and-credit trace.");
  }

  return {
    journeyId: manifest.id,
    mode,
    stage: { slug: stage.slug, position: position + 1, total: manifest.stages.length },
    work: workSummary(work),
    canonicalVersion: versionSummary(canonicalVersion),
    objective,
    contribution: stage.contribution.text,
    blocks,
    limitations: work.limitations,
    uncertainties: work.uncertainties.map((item) => item.note),
    evidence,
    ...(stage.slug === "good-1953" ? { goodFixture } : {}),
    ...(stage.slug === "katz-1987" ? { katzFixture } : {}),
    ...(stage.slug === "kneser-ney-1995" ? { kneserFixture } : {}),
    ...(stage.slug === "chen-goodman-1998" ? { chenFixture } : {}),
    ...(elmanScenario === undefined ? {} : { elmanScenario }),
    ...(originalCellScenario === undefined ? {} : { originalCellScenario }),
    ...(previous === undefined ? {} : { previous }),
    ...(next === undefined ? {} : { next }),
    alternateMode: {
      href: stageRoute(mode === "beginner" ? "expert" : "beginner", stage.slug, manifest),
      label: mode === "beginner" ? "Open the expert reconstruction" : "Open the beginner explanation",
    },
  };
}

export function getWorkReference(workId: string): WorkReferenceView {
  const work = required(indexes.works, workId, "reference work");
  return {
    work: workSummary(work),
    canonicalVersion: versionSummary(required(indexes.versions, work.canonicalVersionId, "canonical version")),
    versions: work.versions.map(versionSummary),
    ideas: work.ideaIds.map((id) => required(indexes.ideas, id, "work idea")),
    claims: corpus.claims.filter((claim) => claim.workId === workId).map(evidenceView),
    limitations: work.limitations,
    uncertainties: work.uncertainties,
    relationships: corpus.relationships.filter(
      (relationship) => relationship.from.id === workId || relationship.to.id === workId,
    ),
  };
}

export function getBuiltReferenceWorkIds(): string[] {
  return [...new Set([manifest, recurrentManifest].flatMap((journey) => journey.stages
    .filter((stage) => stage.status === "built")
    .map((stage) => stage.workId)))];
}

export function getWorkLearningRoutes(workId: string): Record<Mode, RouteRef> {
  for (const journey of [manifest, recurrentManifest]) {
    const stage = journey.stages.find((item) => item.workId === workId && item.status === "built");
    if (stage !== undefined) {
      return {
        beginner: { href: stageRoute("beginner", stage.slug, journey), label: "Learn with intuition" },
        expert: { href: stageRoute("expert", stage.slug, journey), label: "Audit the mechanism" },
      };
    }
  }
  throw new Error(`No built learning route for work: ${workId}`);
}

export function getFixtureForTests(): GoodFixture {
  return goodFixture;
}

export function getKatzFixtureForTests(): KatzFixture {
  return katzFixture;
}

export function getKneserFixtureForTests(): KneserFixture {
  return kneserFixture;
}

export function getChenFixtureForTests(): ChenFixture {
  return chenFixture;
}

export function getRecurrentFixtureForTests(): RecurrentFixture {
  return recurrentFixture;
}

export function getRecurrentManifestForTests(): JourneyManifest {
  return recurrentManifest;
}

export function getCorpusSummary(): {
  schemaVersion: string;
  asOf: string;
  workCount: number;
  claimCount: number;
  sourceCount: number;
} {
  return {
    schemaVersion: corpus.schemaVersion,
    asOf: corpus.asOf,
    workCount: corpus.works.length,
    claimCount: corpus.claims.length,
    sourceCount: corpus.sources.length,
  };
}
