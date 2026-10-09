import {
  getBuiltReferenceWorkIds,
  getJourneyOverview,
  getValidatedCorpus,
  getWorkLearningRoutes,
  type Claim,
  type Corpus,
  type Mode,
  type RouteRef,
  type Work,
} from "./site-data.ts";

export type AtlasAvailability = {
  referenceHref?: string;
  learning?: { kind: "chapter" | "prerequisite"; routes: Record<Mode, RouteRef> };
};

export type AtlasWork = {
  record: Work;
  orderingEvent: Work["chronology"]["events"][number];
  canonicalVersion: Work["versions"][number];
  claims: Claim[];
  relationshipIds: string[];
  availability: AtlasAvailability;
};

type DateGroup = { unresolved: boolean; label: string; works: AtlasWork[] };
export type AtlasYear = { year: number; groups: DateGroup[]; gapBefore?: { start: number; end: number } };

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`Missing atlas ${label}.`);
  return value;
}

// Compare printed components only. Month intervals overlap all known days in that month.
function components(work: AtlasWork): { start: number; end: number } {
  const date = work.orderingEvent.date;
  const [, month, day] = date.value.split("-").map(Number);
  const base = required(month, "month") * 100;
  return date.precision === "month" ? { start: base, end: base + 32 }
    : { start: base + required(day, "day"), end: base + required(day, "day") };
}

export function groupAtlasYears(works: AtlasWork[]): AtlasYear[] {
  const years = [...new Set(works.map((work) => Number(work.orderingEvent.date.value.slice(0, 4))))].sort((a, b) => a - b);
  return years.map((year, index) => {
    const members = works.filter((work) => Number(work.orderingEvent.date.value.slice(0, 4)) === year);
    const known = members.filter((work) => work.orderingEvent.date.precision !== "year")
      .map((work) => ({ work, ...components(work) })).sort((a, b) => a.start - b.start);
    const groups: DateGroup[] = [];
    let end = -1;
    for (const entry of known) {
      if (entry.start > end) {
        groups.push({ unresolved: false, label: "Established date components", works: [entry.work] });
        end = entry.end;
      } else {
        required(groups.at(-1), "date group").works.push(entry.work);
        end = Math.max(end, entry.end);
      }
    }
    for (const group of groups) {
      if (group.works.length > 1) {
        group.label = "Equal or overlapping dates · reading order does not establish research priority";
        group.works.sort((a, b) => members.indexOf(a) - members.indexOf(b));
      }
    }
    const unresolved = members.filter((work) => work.orderingEvent.date.precision === "year");
    if (unresolved.length > 0) groups.push({ unresolved: true, label: "Month and day not established · position does not assert within-year order", works: unresolved });
    const previous = years[index - 1];
    return {
      year,
      groups,
      ...(previous !== undefined && year - previous > 1 ? { gapBefore: { start: previous + 1, end: year - 1 } } : {}),
    };
  });
}

/** Retain original objects, including every date and relationship evidence field. */
export function projectAtlas(corpus: Corpus, destinations: Map<string, AtlasAvailability>) {
  const works: AtlasWork[] = corpus.works.map((record) => ({
    record,
    orderingEvent: required(record.chronology.events.find((event) => event.id === record.chronology.orderingEventId), `${record.id} ordering event`),
    canonicalVersion: required(record.versions.find((version) => version.id === record.canonicalVersionId), `${record.id} canonical version`),
    claims: corpus.claims.filter((claim) => claim.workId === record.id),
    relationshipIds: corpus.relationships.filter((relation) => relation.from.id === record.id || relation.to.id === record.id).map((relation) => relation.id),
    availability: destinations.get(record.id) ?? {},
  }));
  const byId = new Map(works.map((work) => [work.record.id, work]));
  const claimsById = new Map(corpus.claims.map((claim) => [claim.id, claim]));
  const relationships = corpus.relationships.map((record) => ({
    record,
    from: required(byId.get(record.from.id), `${record.id} from endpoint`),
    to: required(byId.get(record.to.id), `${record.id} to endpoint`),
    claims: record.claimIds.map((id) => required(claimsById.get(id), `${record.id} claim ${id}`)),
  }));
  const countField = (field: "evidenceClass" | "causalLanguage") => Object.fromEntries(
    [...new Set(corpus.relationships.map((relation) => relation[field]))].map((value) => [value, corpus.relationships.filter((relation) => relation[field] === value).length]),
  );
  return {
    record: corpus,
    works,
    byId,
    years: groupAtlasYears(works),
    relationships,
    sources: corpus.sources,
    counts: {
      works: works.length,
      relationships: relationships.length,
      chapters: works.filter((work) => work.availability.learning?.kind === "chapter").length,
      prerequisites: works.filter((work) => work.availability.learning?.kind === "prerequisite").length,
      references: works.filter((work) => work.availability.referenceHref !== undefined).length,
      corpusOnly: works.filter((work) => work.availability.referenceHref === undefined).length,
      evidenceClass: countField("evidenceClass"),
      causalLanguage: countField("causalLanguage"),
    },
  };
}

export type Atlas = ReturnType<typeof projectAtlas>;
export type AtlasRelation = Atlas["relationships"][number];

export function getAtlas(): Atlas {
  const chapters = new Set(["smoothing", "recurrent-memory"].flatMap((id) =>
    getJourneyOverview(id as "smoothing" | "recurrent-memory").stages.filter((stage) => stage.status === "built").map((stage) => stage.work.id),
  ));
  const destinations = new Map<string, AtlasAvailability>(getBuiltReferenceWorkIds().map((id) => [id, {
    referenceHref: `/reference/works/${id}/`,
    learning: { kind: chapters.has(id) ? "chapter" : "prerequisite", routes: getWorkLearningRoutes(id) },
  }]));
  return projectAtlas(getValidatedCorpus(), destinations);
}

export const atlasHref = (mode: Mode, workId: string) => `/atlas/${mode}/#work-${workId}`;

export function authorSummary(authors: string[]): string {
  return authors.length > 2 ? `${authors[0]} et al.` : authors.join(" & ");
}
