import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateCorpus } from "../scripts/lib/validate-corpus.mjs";

const [corpus, schema] = await Promise.all(
  [
    new URL("../data/corpus.json", import.meta.url),
    new URL("../schemas/corpus.schema.json", import.meta.url),
  ].map(async (url) => JSON.parse(await readFile(url, "utf8"))),
);

function copyCorpus() {
  return JSON.parse(JSON.stringify(corpus));
}

function assertRejected(candidate, expectedMessage) {
  const errors = validateCorpus(candidate, schema);
  assert.ok(
    errors.some((error) => error.includes(expectedMessage)),
    `Expected an error containing "${expectedMessage}". Received:\n${errors.join("\n")}`,
  );
}

test("accepts the checked-in corpus", () => {
  assert.deepEqual(validateCorpus(corpus, schema), []);
});

test("binds the corpus to the current schema contract", () => {
  const candidate = copyCorpus();
  candidate.schemaVersion = "0.3.0";

  assertRejected(candidate, "must equal \"0.4.0\"");
});

test("retains the sourced 1975 statistical-decoder bridge", () => {
  const work = corpus.works.find(
    (item) => item.id === "jelinek-1975-statistical-decoder",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "shannon-1948-to-jelinek-1975",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.inclusion.status, "branch");
  assert.deepEqual(relationship?.from, {
    kind: "work",
    id: "shannon-1948-communication",
  });
  assert.deepEqual(relationship?.to, {
    kind: "work",
    id: "jelinek-1975-statistical-decoder",
  });
  assert.equal(relationship?.evidenceClass, "inherited-mechanism");
  assert.equal(relationship?.causalLanguage, "prohibited");
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains the guarded 1980 deleted-interpolation branch", () => {
  const work = corpus.works.find(
    (item) => item.id === "jelinek-mercer-1980-interpolation",
  );
  const version = work?.versions.find(
    (item) => item.id === "jelinek-mercer-1980-proceedings-version",
  );
  const scan = corpus.sources.find(
    (item) => item.id === "jelinek-mercer-1980-full-text",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "jelinek-1975-to-jelinek-mercer-1980",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.chronology.events[0].kind, "proceedings-publication");
  assert.deepEqual(version?.bibliography.pages, ["381-397"]);
  assert.equal(scan?.sourceClass, "primary-full-text");
  assert.equal(scan?.authority, "third-party-host");
  assert.deepEqual(scan?.pagination, {
    scheme: "printed",
    pageStart: 381,
    pageEnd: 397,
  });
  assert.equal(work?.preferredSourceIds.includes(scan?.id), false);
  assert.equal(relationship?.connectionType, "addresses");
  assert.equal(relationship?.evidenceClass, "editorial-synthesis");
  assert.equal(relationship?.causalLanguage, "prohibited");
  assert.ok(
    work?.limitations.some((item) =>
      item.includes("depend implicitly on all data"),
    ),
  );
  assert.ok(
    work?.limitations.some((item) =>
      item.includes("does not present the recursive higher-order-to-lower-order"),
    ),
  );
  assert.ok(
    work?.limitations.some((item) =>
      item.includes("gives no simulation table, dataset specification"),
    ),
  );
  assert.ok(
    corpus.claims.some(
      (claim) => claim.id === "jelinek-mercer-1980-fixed-shortcut",
    ),
  );
  assert.ok(
    corpus.claims.some(
      (claim) => claim.id === "jelinek-mercer-1980-open-settings",
    ),
  );
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains the sourced 1982 word-trigram application bridge", () => {
  const work = corpus.works.find(
    (item) => item.id === "jelinek-mercer-bahl-1982-statistical-methods",
  );
  const version = work?.versions.find(
    (item) => item.id === "jelinek-mercer-bahl-1982-book-chapter",
  );
  const archive = corpus.sources.find(
    (item) => item.id === "jelinek-mercer-bahl-1982-internet-archive-scan",
  );
  const snippets = corpus.sources.find(
    (item) => item.id === "jelinek-mercer-bahl-1982-google-books-snippets",
  );
  const referenceList = corpus.sources.find(
    (item) => item.id === "jelinek-mercer-bahl-1982-crossref-record",
  );
  const relationship = corpus.relationships.find(
    (item) =>
      item.id === "jelinek-mercer-1980-to-jelinek-mercer-bahl-1982",
  );
  const unseenClaim = corpus.claims.find(
    (item) => item.id === "jelinek-mercer-bahl-1982-unseen-trigram-rate",
  );
  const trigramClaim = corpus.claims.find(
    (item) =>
      item.id === "jelinek-mercer-bahl-1982-four-way-trigram-interpolation",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.artifactType, "book-chapter");
  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.chronology.events[0].kind, "book-publication");
  assert.equal(version?.kind, "book-chapter");
  assert.deepEqual(version?.bibliography.editors, [
    "Paruchuri R. Krishnaiah",
    "Laveen N. Kanal",
  ]);
  assert.equal(
    version?.bibliography.publisher,
    "North-Holland Publishing Company",
  );
  assert.equal(version?.bibliography.series, "Handbook of Statistics");
  assert.equal(version?.bibliography.chapter, "25");
  assert.deepEqual(version?.bibliography.pages, ["549-573"]);
  assert.ok(
    version?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "issn" && identifier.value === "0169-7161",
    ),
  );
  assert.equal(archive?.sourceClass, "institutional-archive");
  assert.deepEqual(archive?.supports, ["metadata"]);
  assert.equal(archive?.pagination, undefined);
  assert.equal(snippets?.sourceClass, "primary-snippet");
  assert.equal(snippets?.authority, "third-party-host");
  assert.deepEqual(snippets?.supports, ["claim-location"]);
  assert.deepEqual(snippets?.pagination, {
    scheme: "printed",
    pageStart: 549,
    pageEnd: 573,
  });
  assert.equal(work?.preferredSourceIds.includes(archive?.id), false);
  assert.equal(work?.preferredSourceIds.includes(snippets?.id), false);
  assert.deepEqual(referenceList?.supports, ["metadata", "reference-list"]);
  assert.equal(referenceList?.pagination, undefined);
  assert.equal(relationship?.connectionType, "builds-on");
  assert.equal(relationship?.evidenceClass, "documented-influence");
  assert.equal(relationship?.causalLanguage, "qualified");
  assert.ok(relationship?.rationale.includes("overlapping preparation"));
  assert.ok(
    unseenClaim?.limitations.some((item) =>
      item.includes("corpus-specific occurrence statistic"),
    ),
  );
  assert.ok(
    trigramClaim?.statement.includes("four component contexts"),
  );
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains the 1983 article as a versioned companion, not a second lineage node", () => {
  const work = corpus.works.find(
    (item) => item.id === "jelinek-mercer-bahl-1982-statistical-methods",
  );
  const companion = work?.versions.find(
    (item) => item.id === "bahl-jelinek-mercer-1983-journal-companion",
  );
  const received = work?.chronology.events.find(
    (item) => item.id === "bahl-jelinek-mercer-1983-manuscript-received",
  );
  const revised = work?.chronology.events.find(
    (item) => item.id === "bahl-jelinek-mercer-1983-manuscript-revised",
  );
  const published = work?.chronology.events.find(
    (item) => item.id === "bahl-jelinek-mercer-1983-journal-publication",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "bahl-jelinek-mercer-1983-author-full-text",
  );
  const overlapClaimIds = [
    "jelinek-mercer-bahl-1982-word-ngram-state",
    "jelinek-mercer-bahl-1982-trigram-training-scale",
    "jelinek-mercer-bahl-1982-unseen-trigram-rate",
    "jelinek-mercer-bahl-1982-training-prediction-gap",
    "jelinek-mercer-bahl-1982-linear-interpolation",
    "jelinek-mercer-bahl-1982-deleted-weight-estimation",
    "jelinek-mercer-bahl-1982-deleted-interpolation-name",
    "jelinek-mercer-bahl-1982-four-way-trigram-interpolation",
  ];

  assert.equal(
    work?.canonicalVersionId,
    "jelinek-mercer-bahl-1982-book-chapter",
  );
  assert.equal(
    work?.chronology.orderingEventId,
    "jelinek-mercer-bahl-1982-book-publication",
  );
  assert.equal(companion?.kind, "journal");
  assert.equal(
    companion?.title,
    "A Maximum Likelihood Approach to Continuous Speech Recognition",
  );
  assert.deepEqual(companion?.authors, [
    "Lalit R. Bahl",
    "Frederick Jelinek",
    "Robert L. Mercer",
  ]);
  assert.deepEqual(companion?.bibliography.pages, ["179-190"]);
  assert.ok(
    companion?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "doi" &&
        identifier.value === "10.1109/TPAMI.1983.4767370",
    ),
  );
  assert.equal(received?.date.value, "1981-02-23");
  assert.equal(revised?.kind, "manuscript-revised");
  assert.equal(revised?.date.value, "1982-09-28");
  assert.equal(published?.date.value, "1983-03");
  assert.equal(fullText?.sourceClass, "primary-full-text");
  assert.equal(fullText?.authority, "author");
  assert.equal(work?.preferredSourceIds.includes(fullText?.id), false);
  assert.ok(fullText?.accessNote.includes("not described as openly licensed"));
  assert.equal(
    corpus.works.some(
      (item) => item.id === "bahl-jelinek-mercer-1983-maximum-likelihood",
    ),
    false,
  );
  for (const claimId of overlapClaimIds) {
    const claim = corpus.claims.find((item) => item.id === claimId);
    assert.ok(
      claim?.evidence.some((item) => item.sourceId === fullText?.id),
      `${claimId} must retain its companion-version locator`,
    );
  }
});

test("rejects an incomplete source record", () => {
  const candidate = copyCorpus();
  delete candidate.sources[0].accessDate;

  assertRejected(candidate, "accessDate: is required");
});

test("rejects a date whose precision does not match its value", () => {
  const candidate = copyCorpus();
  candidate.works[0].chronology.events[0].date = {
    value: "1913-01",
    precision: "day",
    calendar: "source-as-printed",
  };

  assertRejected(candidate, "not a valid day-precision date");
});

test("rejects an invalid relationship type", () => {
  const candidate = copyCorpus();
  candidate.relationships[0].connectionType = "inspired-by";

  assertRejected(candidate, "unknown relationship type");
});

test("rejects a relationship without source evidence", () => {
  const candidate = copyCorpus();
  candidate.relationships[0].sourceEvidence = [];

  assertRejected(candidate, "sourceEvidence: must contain at least 1 item");
});

test("rejects causal rendering without documented influence", () => {
  const candidate = copyCorpus();
  candidate.relationships[0].causalLanguage = "qualified";

  assertRejected(candidate, "only documented influence");
});

test("rejects causal prose on an editorial-synthesis edge", () => {
  const candidate = copyCorpus();
  candidate.relationships[0].rationale =
    "The earlier study led directly to the later framework.";

  assertRejected(candidate, "strong causal wording exceeds");
});

test("rejects strong causal prose even on documented influence", () => {
  const candidate = copyCorpus();
  candidate.relationships[1].rationale =
    "The 1948 paper made the 1951 experiment possible.";

  assertRejected(candidate, "strong causal wording exceeds");
});

test("rejects causal verbs hidden behind a prohibited rendering flag", () => {
  const candidate = copyCorpus();
  candidate.relationships[0].rationale =
    "The Markov study enabled Shannon’s framework.";

  assertRejected(candidate, "strong causal wording exceeds");
});

test("rejects motivational causality on a prohibited edge", () => {
  const candidate = copyCorpus();
  candidate.relationships[0].rationale =
    "The earlier study motivated Shannon’s framework.";

  assertRejected(candidate, "strong causal wording exceeds");
});

test("rejects qualified causal verbs on a prohibited edge", () => {
  for (const verb of ["influenced", "prompted", "drove"]) {
    const candidate = copyCorpus();
    candidate.relationships[0].rationale =
      `The earlier study ${verb} Shannon’s framework.`;
    assertRejected(candidate, "causal wording is prohibited");
  }
});

test("rejects causal overclaims hidden in relationship evidence support", () => {
  const candidate = copyCorpus();
  candidate.relationships[0].sourceEvidence[0].support =
    "The earlier study caused the later framework.";

  assertRejected(candidate, "strong causal wording exceeds");
});

test("rejects evidence from a source unrelated to the claim work", () => {
  const candidate = copyCorpus();
  const claim = candidate.claims.find(
    (item) => item.id === "shannon-1951-entropy-bounds",
  );
  claim.evidence[0].sourceId = "markov-2006-open-translation";

  assertRejected(candidate, "unrelated to the evidenced work");
});

test("limits reference-list records to relationship evidence", () => {
  const candidate = copyCorpus();
  const claim = candidate.claims.find(
    (item) => item.id === "jelinek-mercer-bahl-1982-training-prediction-gap",
  );
  claim.evidence[0].sourceId = "jelinek-mercer-bahl-1982-crossref-record";

  assertRejected(candidate, "not marked for an allowed evidence location");
});

test("rejects relationship edges that reverse chronology", () => {
  const candidate = copyCorpus();
  const relationship = candidate.relationships[1];
  [relationship.from, relationship.to] = [relationship.to, relationship.from];

  assertRejected(candidate, "must run from the earlier work to the later work");
});

test("does not reject lineage when imprecise date intervals overlap", () => {
  const candidate = copyCorpus();
  const fromEvent = candidate.works[1].chronology.events.find(
    (event) => event.id === "shannon-1948-july",
  );
  const toEvent = candidate.works[2].chronology.events.find(
    (event) => event.id === "shannon-1951-january",
  );
  fromEvent.date = {
    value: "1951-12",
    precision: "month",
    calendar: "gregorian",
  };
  toEvent.date = {
    value: "1951",
    precision: "year",
    calendar: "gregorian",
  };

  assert.deepEqual(validateCorpus(candidate, schema), []);
});

test("requires relationship claims to support both endpoints", () => {
  const candidate = copyCorpus();
  candidate.relationships[0].claimIds = ["markov-observed-dependence"];

  assertRejected(candidate, "no claim supports the work endpoint");
});

test("scopes idea-edge evidence to the works supporting those ideas", () => {
  const candidate = copyCorpus();
  const relationship = candidate.relationships[0];
  relationship.from = {
    kind: "idea",
    id: "text-as-dependent-sequence",
  };
  relationship.to = {
    kind: "idea",
    id: "conditional-stochastic-language-source",
  };
  relationship.claimIds = [
    "markov-observed-dependence",
    "shannon-1948-discrete-source",
  ];
  relationship.sourceEvidence[0] = {
    sourceId: "shannon-1951-full-text",
    locator: {
      label: "Unrelated source, printed p. 50",
      pageStart: 50,
      pageEnd: 50,
    },
    support: "This source does not support either endpoint idea.",
  };

  assertRejected(candidate, "unrelated to the evidenced work");
});

test("rejects documented influence on a conceptual parallel", () => {
  const candidate = copyCorpus();
  candidate.relationships[0].evidenceClass = "documented-influence";

  assertRejected(candidate, "conceptual parallel cannot claim documented influence");
});

test("rejects day precision inferred from month-level evidence", () => {
  const candidate = copyCorpus();
  const event = candidate.works
    .find((work) => work.id === "shannon-1951-prediction")
    .chronology.events.find((item) => item.id === "shannon-1951-january");
  event.date = {
    value: "1951-01-01",
    precision: "day",
    calendar: "gregorian",
  };

  assertRejected(candidate, "declared precision is finer than its source evidence");
});

test("honors Julian leap-day rules", () => {
  const candidate = copyCorpus();
  candidate.works[0].chronology.events[0].date = {
    value: "1900-02-29",
    precision: "day",
    calendar: "julian",
  };

  assert.deepEqual(validateCorpus(candidate, schema), []);
});

test("rejects a Julian-only leap day in the Gregorian calendar", () => {
  const candidate = copyCorpus();
  candidate.works[0].chronology.events[0].date = {
    value: "1900-02-29",
    precision: "day",
    calendar: "gregorian",
  };

  assertRejected(candidate, "not a valid day-precision date");
});

test("rejects evidence pages outside the source pagination", () => {
  const candidate = copyCorpus();
  const claim = candidate.claims.find(
    (item) => item.id === "shannon-1951-entropy-bounds",
  );
  claim.evidence[0].locator.pageStart = 999;
  claim.evidence[0].locator.pageEnd = 999;

  assertRejected(candidate, "falls outside source pagination");
});

test("requires pageStart whenever a locator supplies pageEnd", () => {
  const candidate = copyCorpus();
  const locator = candidate.claims[0].evidence[0].locator;
  delete locator.pageStart;

  assertRejected(candidate, "pageStart: is required");
});

test("rejects an incomplete HTTPS source URL", () => {
  const candidate = copyCorpus();
  candidate.sources[0].url = "https://";

  assertRejected(candidate, "does not match");
});

test("rejects malformed or whitespace-bearing HTTPS source URLs", () => {
  for (const url of ["https://?", "https://example.org/a path"]) {
    const candidate = copyCorpus();
    candidate.sources[0].url = url;
    assertRejected(candidate, "must be a complete public HTTPS URL");
  }
});

test("rejects a preferred source from a noncanonical version", () => {
  const candidate = copyCorpus();
  candidate.works[0].preferredSourceIds = ["markov-2006-open-translation"];

  assertRejected(candidate, "does not belong to canonical version");
});

test("rejects version IDs reused by different works", () => {
  const candidate = copyCorpus();
  candidate.works[2].versions[0].id = "shannon-1948-original";

  assertRejected(candidate, "is already used by work");
});

test("requires structured title and authors on every version", () => {
  const candidate = copyCorpus();
  delete candidate.works[0].versions[0].title;
  delete candidate.works[0].versions[0].authors;

  assertRejected(candidate, "title: is required");
  assertRejected(candidate, "authors: is required");
});

test("rejects a canonical version title that disagrees with its work", () => {
  const candidate = copyCorpus();
  candidate.works[0].versions[0].title = "Different canonical title";

  assertRejected(candidate, "canonical version title must match the work title");
});

test("rejects canonical version authors that disagree with its work", () => {
  const candidate = copyCorpus();
  candidate.works[3].versions[0].authors.reverse();

  assertRejected(
    candidate,
    "canonical version authors must match the work authors in order",
  );
});

test("treats reordered duplicate objects as equal", () => {
  const candidate = copyCorpus();
  const identifiers =
    candidate.works[2].versions[0].bibliography.identifiers;
  identifiers.push({
    value: identifiers[0].value,
    type: identifiers[0].type,
  });

  assertRejected(candidate, "must not contain duplicate items");
});

test("rejects a version source without reciprocal provenance links", () => {
  const candidate = copyCorpus();
  candidate.works[2].versions[0].sourceIds.push(
    "markov-1913-rvb-facsimile",
  );

  assertRejected(candidate, "is unrelated to work");
});

test("rejects priority language without a defined prior-art review", () => {
  const candidate = copyCorpus();
  candidate.claims[0].statement =
    "This was the first statistical treatment of literary text.";

  assertRejected(candidate, "priority language requires");
});

test("rejects priority language outside a reviewed claim", () => {
  const candidate = copyCorpus();
  candidate.works[0].significance.beginner =
    "Markov introduced dependence analysis for literary text.";

  assertRejected(candidate, "priority wording must live in a claim");
});

test("does not confuse instructional sequence with historical priority", () => {
  const candidate = copyCorpus();
  candidate.learningObjectives[0].objective =
    "First, compare the two conditional rates; then explain their limits.";

  assert.deepEqual(validateCorpus(candidate, schema), []);
});

test("rejects priority language hidden in evidence support", () => {
  const candidate = copyCorpus();
  candidate.claims[0].evidence[0].support =
    "Shows the first statistical study of literary text.";

  assertRejected(candidate, "priority language requires");
});

test("requires rationale when a work is marked excluded", () => {
  const candidate = copyCorpus();
  candidate.works[0].inclusion.status = "excluded";

  assertRejected(candidate, "exclusionRationale: is required");
});

test("rejects provenance dates later than the corpus asOf date", () => {
  for (const mutate of [
    (candidate) => {
      candidate.sources[0].accessDate = "2099-01-01";
    },
    (candidate) => {
      candidate.claims[0].checkedDate = "2099-01-01";
    },
  ]) {
    const candidate = copyCorpus();
    mutate(candidate);
    assertRejected(candidate, "is later than corpus asOf");
  }
});

test("rejects a learning objective backed by another work's claim", () => {
  const candidate = copyCorpus();
  candidate.learningObjectives[0].claimIds = ["shannon-1951-entropy-bounds"];

  assertRejected(candidate, "unrelated to the objective work");
});

test("does not let multi-work objectives pad mode coverage", () => {
  const candidate = copyCorpus();
  candidate.learningObjectives = candidate.learningObjectives.filter(
    (objective) => !objective.workIds.includes("markov-1913-onegin"),
  );
  for (const objective of candidate.learningObjectives.filter((item) =>
    item.workIds.includes("shannon-1948-communication"),
  )) {
    objective.workIds.push("markov-1913-onegin");
  }

  assertRejected(candidate, "has no supporting claim in this objective");
  assertRejected(candidate, 'has no beginner objective');
  assertRejected(candidate, 'has no expert objective');
});

test("requires both learning modes for every included work", () => {
  const candidate = copyCorpus();
  candidate.learningObjectives = candidate.learningObjectives.filter(
    (objective) =>
      !(
        objective.mode === "expert" &&
        objective.workIds.includes("markov-1913-onegin")
      ),
  );

  assertRejected(candidate, 'has no expert objective');
});

test("reports malformed records instead of throwing", () => {
  const candidate = copyCorpus();
  candidate.works[0] = null;

  assertRejected(candidate, "expected object");
});

test("reports malformed containers instead of throwing", () => {
  for (const mutate of [
    (candidate) => {
      candidate.works = "not-an-array";
    },
    (candidate) => {
      candidate.works[0].versions = "not-an-array";
    },
    (candidate) => {
      candidate.sources[0].relatedWorkIds = "not-an-array";
    },
    (candidate) => {
      candidate.learningObjectives[0].claimIds = "not-an-array";
    },
  ]) {
    const candidate = copyCorpus();
    mutate(candidate);
    assert.doesNotThrow(() => validateCorpus(candidate, schema));
    assertRejected(candidate, "expected array");
  }
});
