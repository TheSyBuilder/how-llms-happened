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
const [corpusFormat, historicalScope] = await Promise.all(
  [
    new URL("../docs/corpus-format.md", import.meta.url),
    new URL("../docs/historical-scope.md", import.meta.url),
  ].map((url) => readFile(url, "utf8")),
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
  candidate.schemaVersion = "0.5.0";

  assertRejected(candidate, "must equal \"0.6.0\"");
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

test("retains Good attribution and Katz recursive backoff as distinct contributions", () => {
  const good = corpus.works.find(
    (item) => item.id === "good-1953-population-frequencies",
  );
  const katz = corpus.works.find(
    (item) => item.id === "katz-1987-sparse-data",
  );
  const katzVersion = katz?.versions.find(
    (item) => item.id === "katz-1987-journal-version",
  );
  const katzFullText = corpus.sources.find(
    (item) => item.id === "katz-1987-full-text",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "good-1953-to-katz-1987",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(katz?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(good?.inclusion.status, "context");
  assert.ok(
    good?.limitations.some((item) =>
      item.includes("credits A. M. Turing"),
    ),
  );
  assert.equal(katz?.inclusion.status, "branch");
  assert.equal(katz?.chronology.orderingEventId, "katz-1987-journal-publication");
  assert.equal(
    katz?.chronology.events.find(
      (item) => item.id === "katz-1987-journal-publication",
    )?.date.value,
    "1987-03",
  );
  assert.deepEqual(katzVersion?.bibliography.pages, ["400-401"]);
  assert.ok(
    katzVersion?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "doi" &&
        identifier.value === "10.1109/TASSP.1987.1165125",
    ),
  );
  assert.equal(katzFullText?.authority, "institutional-host");
  assert.equal(katz?.preferredSourceIds.includes(katzFullText?.id), false);
  assert.ok(katzFullText?.accessNote.includes("not described as openly licensed"));
  assert.equal(relationship?.connectionType, "extends");
  assert.equal(relationship?.evidenceClass, "documented-influence");
  assert.equal(relationship?.causalLanguage, "qualified");
  assert.ok(
    relationship?.uncertainties.some((item) =>
      item.note.includes("credits Turing"),
    ),
  );
  assert.ok(
    corpus.claims
      .find((item) => item.id === "katz-1987-zero-estimate-gate")
      ?.statement.includes("retained higher-order estimate is zero"),
  );
  assert.ok(
    corpus.claims
      .find((item) => item.id === "katz-1987-novelty-boundary")
      ?.statement.includes("not in the use of Turing’s formulas"),
  );
  assert.equal(
    corpus.relationships.some(
      (item) =>
        item.from.id === "jelinek-mercer-bahl-1982-statistical-methods" &&
        item.to.id === "katz-1987-sparse-data",
    ),
    false,
  );
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains the original Kneser–Ney backoff distributions without later variants", () => {
  const work = corpus.works.find(
    (item) => item.id === "kneser-ney-1995-improved-backing-off",
  );
  const version = work?.versions.find(
    (item) => item.id === "kneser-ney-1995-proceedings-version",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "kneser-ney-1995-full-text",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "katz-1987-to-kneser-ney-1995",
  );
  const contextClaim = corpus.claims.find(
    (item) => item.id === "kneser-ney-1995-context-diversity",
  );
  const discountClaim = corpus.claims.find(
    (item) => item.id === "kneser-ney-1995-absolute-discount",
  );
  const singletonClaim = corpus.claims.find(
    (item) => item.id === "kneser-ney-1995-singleton-distribution",
  );
  const datasetScope = corpus.claims.find(
    (item) => item.id === "kneser-ney-1995-dataset-and-evaluation-scope",
  );
  const estimatorSetup = corpus.claims.find(
    (item) => item.id === "kneser-ney-1995-estimator-setup",
  );
  const tableOne = corpus.claims.find(
    (item) => item.id === "kneser-ney-1995-table-one-results",
  );
  const arpaComparison = corpus.claims.find(
    (item) => item.id === "kneser-ney-1995-arpa-comparison",
  );
  const recursiveBackoff = corpus.ideas.find(
    (item) => item.id === "recursive-ngram-backoff",
  );
  const beginnerObjective = corpus.learningObjectives.find(
    (item) => item.id === "beginner-kneser-ney-1995-context-diversity",
  );
  const expertObjective = corpus.learningObjectives.find(
    (item) => item.id === "expert-kneser-ney-1995-estimator",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(
    work?.chronology.orderingEventId,
    "kneser-ney-1995-proceedings-publication",
  );
  assert.equal(work?.chronology.events[0].date.value, "1995");
  assert.equal(work?.chronology.events[0].date.precision, "year");
  assert.deepEqual(version?.bibliography.pages, ["181-184"]);
  assert.ok(
    version?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "doi" &&
        identifier.value === "10.1109/ICASSP.1995.479394",
    ),
  );
  assert.ok(
    version?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "isbn" && identifier.value === "0-7803-2431-5",
    ),
  );
  assert.deepEqual(fullText?.pagination, {
    scheme: "printed",
    pageStart: 181,
    pageEnd: 184,
  });
  assert.equal(fullText?.authority, "institutional-host");
  assert.equal(work?.preferredSourceIds.includes(fullText?.id), false);
  assert.ok(fullText?.accessNote.includes("not described as openly licensed"));
  assert.equal(relationship?.connectionType, "extends");
  assert.equal(relationship?.evidenceClass, "documented-influence");
  assert.equal(relationship?.confidence, "medium");
  assert.equal(relationship?.causalLanguage, "qualified");
  assert.deepEqual(
    relationship?.claimIds.filter((claimId) =>
      claimId.startsWith("katz-1987-"),
    ),
    ["katz-1987-novelty-boundary"],
  );
  assert.ok(
    relationship?.uncertainties.some((item) =>
      item.note.includes("neither labeled as the experimental baseline"),
    ),
  );
  assert.ok(contextClaim?.statement.includes("N₊(·,ĥ,w)"));
  assert.ok(contextClaim?.statement.includes("repeated token frequency"));
  assert.ok(
    discountClaim?.limitations.some((item) =>
      item.includes("does not claim it as a new contribution"),
    ),
  );
  assert.ok(singletonClaim?.statement.includes("N₁(·,ĥ,w)/N₁(·,ĥ,·)"));
  assert.ok(
    singletonClaim?.limitations.some((item) =>
      item.includes("second sum in equation (16)"),
    ),
  );
  assert.ok(
    datasetScope?.statement.includes(
      "official 1992 and 1993 evaluation material",
    ),
  );
  assert.ok(datasetScope?.statement.includes("trigram rescoring"));
  assert.ok(
    estimatorSetup?.statement.includes(
      "every fallback distribution is itself smoothed",
    ),
  );
  assert.equal(
    tableOne?.statement,
    "Table 1 reports standard, singleton, and marginal-constraint perplexity/error-rate pairs of 161.0/11.9%, 145.7/11.2%, and 144.3/11.1% for full WSJ 45k models; 169.4/11.9%, 152.6/11.4%, and 150.6/11.5% after removing singleton trigrams; and Verbmobil perplexities of 105.4, 97.9, and 96.2.",
  );
  assert.equal(
    arpaComparison?.statement,
    "Using the same WSJ training data and 20,000-word vocabulary as the official ARPA 1993 model, Table 2 reports bigram perplexities of 213.3 for ARPA and 207.5 for the marginal-constraint model, and trigram perplexities of 147.0 and 134.0 respectively.",
  );
  assert.ok(
    work?.limitations.some(
      (item) =>
        item.includes("later interpolated Kneser–Ney") &&
        item.includes("modified Kneser–Ney"),
    ),
  );
  assert.ok(
    work?.significance.expert.includes("while a separate leave-one-out path"),
  );
  assert.ok(
    work?.limitations.some((item) =>
      item.includes("final ARPA comparison adds one bigram row"),
    ),
  );
  assert.ok(
    work?.limitations.some(
      (item) => item.includes("up to about 10%") && item.includes("11.1%"),
    ),
  );
  assert.ok(
    recursiveBackoff?.uncertainties.some((item) =>
      item.note.startsWith("In Katz’s estimator"),
    ),
  );
  assert.equal(
    beginnerObjective?.claimIds.includes(
      "kneser-ney-1995-table-one-results",
    ),
    false,
  );
  assert.ok(
    expertObjective?.successCriterion.includes(
      "unbenchmarked author report",
    ),
  );
  assert.equal(
    corpus.relationships.some(
      (item) =>
        item.from.id === "jelinek-mercer-1980-interpolation" &&
        item.to.id === work?.id,
    ),
    false,
  );
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains modified Kneser–Ney as a separately versioned later extension", () => {
  const work = corpus.works.find(
    (item) => item.id === "chen-goodman-1998-empirical-smoothing",
  );
  const report = work?.versions.find(
    (item) => item.id === "chen-goodman-1998-technical-report-version",
  );
  const journal = work?.versions.find(
    (item) => item.id === "chen-goodman-1999-journal-version",
  );
  const boundarySource = corpus.sources.find(
    (item) => item.id === "chen-goodman-1996-acl-boundary",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "kneser-ney-1995-to-chen-goodman-1998",
  );
  const fixedDiscounts = corpus.claims.find(
    (item) => item.id === "chen-goodman-1998-fixed-discount-estimates",
  );
  const recursiveLowerOrders = corpus.claims.find(
    (item) => item.id === "chen-goodman-1998-recursive-lower-orders",
  );
  const evaluationScope = corpus.claims.find(
    (item) => item.id === "chen-goodman-1998-evaluation-scope",
  );
  const interpolationComparison = corpus.claims.find(
    (item) => item.id === "chen-goodman-1998-interpolation-comparison",
  );
  const heldoutComparison = corpus.claims.find(
    (item) => item.id === "chen-goodman-1998-heldout-fixed-comparison",
  );
  const countDiagnostic = corpus.claims.find(
    (item) => item.id === "chen-goodman-1998-count-diagnostic",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.artifactType, "technical-report");
  assert.equal(
    work?.canonicalVersionId,
    "chen-goodman-1998-technical-report-version",
  );
  assert.equal(
    work?.chronology.orderingEventId,
    "chen-goodman-1998-technical-report",
  );
  assert.equal(work?.chronology.events[0].date.value, "1998-08");
  assert.equal(
    work?.chronology.events.find(
      (event) => event.id === "chen-goodman-1999-manuscript-accepted",
    )?.date.value,
    "1999-07-08",
  );
  assert.equal(report?.kind, "technical-report");
  assert.ok(
    report?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "report-number" &&
        identifier.value === "TR-10-98",
    ),
  );
  assert.equal(journal?.kind, "journal");
  assert.deepEqual(journal?.bibliography.pages, ["359-394"]);
  assert.ok(
    journal?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "doi" &&
        identifier.value === "10.1006/csla.1999.0128",
    ),
  );
  assert.deepEqual(boundarySource?.versionIds, []);
  assert.ok(boundarySource?.supports.includes("version-boundary"));
  assert.ok(
    boundarySource?.accessNote.includes("contain no Kneser–Ney discussion"),
  );
  assert.equal(relationship?.connectionType, "extends");
  assert.equal(relationship?.evidenceClass, "documented-influence");
  assert.equal(relationship?.confidence, "high");
  assert.equal(relationship?.causalLanguage, "qualified");
  assert.ok(fixedDiscounts?.statement.includes("D₁ = 1 − 2Y(n₂/n₁)"));
  assert.ok(
    recursiveLowerOrders?.statement.includes(
      "replaces ordinary top-order counts",
    ),
  );
  assert.ok(evaluationScope?.statement.includes("most tunable parameters"));
  assert.ok(
    interpolationComparison?.statement.includes(
      "hard-backoff counterpart",
    ),
  );
  assert.deepEqual(heldoutComparison?.evidence[0].locator, {
    label: "Held-out versus fixed-discount comparison, printed pp. 39–41",
    section: "5.1.4 Kneser-Ney Smoothing and Variations",
    pageStart: 39,
    pageEnd: 41,
    figure: "20–21",
  });
  assert.equal(
    countDiagnostic?.evidence[0].locator.section,
    "5.2.1 Expected vs. Actual Counts, Overall",
  );
  assert.ok(
    relationship?.sourceEvidence.some(
      (evidence) => evidence.locator.pageStart === 23,
    ),
  );
  assert.ok(
    work?.limitations.some((item) =>
      item.includes("attributed to Klaus Ries"),
    ),
  );
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains the guarded Hinton 1986 distributed-representation branch", () => {
  const work = corpus.works.find(
    (item) => item.id === "hinton-1986-learning-distributed-representations",
  );
  const presentation = work?.chronology.events.find(
    (item) => item.id === "hinton-1986-conference-presentation",
  );
  const publication = work?.chronology.events.find(
    (item) => item.id === "hinton-1986-proceedings-publication",
  );
  const version = work?.versions.find(
    (item) => item.id === "hinton-1986-proceedings-version",
  );
  const repositoryRecord = corpus.sources.find(
    (item) => item.id === "hinton-1986-escholarship-record",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "hinton-1986-author-full-text",
  );
  const heldout = corpus.claims.find(
    (item) => item.id === "hinton-1986-held-out-family-generalization",
  );
  const wordBoundary = corpus.claims.find(
    (item) => item.id === "hinton-1986-word-meaning-boundary",
  );
  const theoryBoundary = corpus.claims.find(
    (item) => item.id === "hinton-1986-generalization-theory-limit",
  );
  const training = corpus.claims.find(
    (item) => item.id === "hinton-1986-squared-error-batch-training",
  );
  const implementationBoundaries = corpus.claims.find(
    (item) => item.id === "hinton-1986-implementation-boundaries",
  );
  const representationIdea = corpus.ideas.find(
    (item) => item.id === "learned-distributed-symbol-representations",
  );
  const expertObjective = corpus.learningObjectives.find(
    (item) => item.id === "expert-hinton-1986-family-tree-evidence",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "hinton-1986-to-bengio-2000",
  );
  const directElmanEdge = corpus.relationships.find(
    (item) =>
      item.from.id === "hinton-1986-learning-distributed-representations" &&
      item.to.id === "elman-1988-finding-structure-in-time",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(corpus.asOf, "2026-08-09");
  assert.equal(work?.artifactType, "conference-paper");
  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.versions.length, 1);
  assert.equal(
    work?.chronology.orderingEventId,
    "hinton-1986-conference-presentation",
  );
  assert.equal(presentation?.kind, "conference-presentation");
  assert.equal(presentation?.label.includes("Scheduled"), true);
  assert.equal(presentation?.date.value, "1986-08-15");
  assert.equal(publication?.kind, "proceedings-publication");
  assert.equal(publication?.date.value, "1986");
  assert.equal(version?.kind, "proceedings");
  assert.deepEqual(version?.bibliography.pages, ["1-12"]);
  assert.ok(
    version?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "isbn" && identifier.value === "0-89859-864-8",
      ),
  );
  assert.equal(repositoryRecord?.accessNote.includes("pp. 1–12"), false);
  assert.equal(fullText?.authority, "author");
  assert.equal(
    fullText?.url,
    "https://www.cs.toronto.edu/~hinton/absps/families.pdf",
  );
  assert.deepEqual(fullText?.pagination, {
    scheme: "printed",
    pageStart: 1,
    pageEnd: 12,
  });
  assert.ok(heldout?.statement.includes("4 of 4"));
  assert.ok(heldout?.statement.includes("3 of 4"));
  assert.deepEqual(
    heldout?.evidence.map((evidence) => ({
      pageStart: evidence.locator.pageStart,
      pageEnd: evidence.locator.pageEnd,
      section: evidence.locator.section,
    })),
    [
      {
        pageStart: 6,
        pageEnd: 6,
        section: "3. A Network that Learns Distributed Representations",
      },
      {
        pageStart: 9,
        pageEnd: 9,
        section: "3.3 Generalization",
      },
    ],
  );
  assert.ok(heldout?.limitations.some((item) => item.includes("two runs")));
  assert.ok(wordBoundary?.statement.includes("bank"));
  assert.equal(
    theoryBoundary?.evidence[0].locator.section,
    "3.3 Generalization",
  );
  assert.equal(training?.statement.includes("summed squared-error"), true);
  assert.equal(training?.statement.includes("all cases"), true);
  assert.equal(training?.statement.includes("momentum term"), true);
  assert.deepEqual(
    training?.evidence.map((evidence) => evidence.locator.equation),
    ["3", "8–9"],
  );
  assert.equal(
    implementationBoundaries?.statement.includes("somewhat arbitrary"),
    true,
  );
  assert.equal(
    implementationBoundaries?.statement.includes("biologically implausible"),
    true,
  );
  assert.deepEqual(
    implementationBoundaries?.evidence.map(
      (evidence) => evidence.locator.pageStart,
    ),
    [6, 11],
  );
  assert.ok(
    work?.limitations.some((item) =>
      item.includes("feed-forward, not recurrent"),
    ),
  );
  assert.ok(
    work?.limitations.some((item) => item.includes("somewhat arbitrary")),
  );
  for (const claimId of [
    "hinton-1986-squared-error-batch-training",
    "hinton-1986-implementation-boundaries",
  ]) {
    assert.ok(representationIdea?.claimIds.includes(claimId));
    assert.ok(expertObjective?.claimIds.includes(claimId));
  }
  assert.ok(expertObjective?.successCriterion.includes("batch-gradient"));
  assert.ok(expertObjective?.successCriterion.includes("momentum"));
  assert.ok(expertObjective?.successCriterion.includes("arbitrary-design"));
  assert.ok(
    expertObjective?.successCriterion.includes("biological-plausibility"),
  );
  assert.deepEqual(relationship?.from, { kind: "work", id: work?.id });
  assert.deepEqual(relationship?.to, {
    kind: "work",
    id: "bengio-2000-neural-probabilistic-language-model",
  });
  assert.equal(relationship?.connectionType, "combines");
  assert.equal(relationship?.evidenceClass, "documented-influence");
  assert.equal(relationship?.confidence, "high");
  assert.equal(relationship?.causalLanguage, "qualified");
  assert.ok(relationship?.rationale.includes("representation-learning principle"));
  assert.deepEqual(
    new Set(
      relationship?.sourceEvidence.map((evidence) => evidence.sourceId),
    ),
    new Set([
      "bengio-2000-neurips-full-text",
      "bengio-2003-jmlr-full-text",
    ]),
  );
  const neuripsEvidence = relationship?.sourceEvidence.filter(
    (evidence) => evidence.sourceId === "bengio-2000-neurips-full-text",
  );
  assert.equal(neuripsEvidence?.length, 2);
  assert.ok(
    neuripsEvidence?.every(
      (evidence) =>
        evidence.locator.pageStart === undefined &&
        evidence.locator.pageEnd === undefined,
    ),
  );
  assert.equal(directElmanEdge, undefined);
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains the versioned and quantitatively bounded Elman 1988/1990 branch", () => {
  const work = corpus.works.find(
    (item) => item.id === "elman-1988-finding-structure-in-time",
  );
  const reportEvent = work?.chronology.events.find(
    (item) => item.id === "elman-1988-crl-report-publication",
  );
  const journalEvent = work?.chronology.events.find(
    (item) => item.id === "elman-1990-cognitive-science-publication",
  );
  const report = work?.versions.find(
    (item) => item.id === "elman-1988-crl-report-version",
  );
  const journal = work?.versions.find(
    (item) => item.id === "elman-1990-cognitive-science-journal-version",
  );
  const reportAbstract = corpus.sources.find(
    (item) => item.id === "elman-1988-crl-report-abstract",
  );
  const authorRecord = corpus.sources.find(
    (item) => item.id === "elman-1990-author-publications-record",
  );
  const crossrefRecord = corpus.sources.find(
    (item) => item.id === "elman-1990-crossref-record",
  );
  const scienceDirectRecord = corpus.sources.find(
    (item) => item.id === "elman-1990-sciencedirect-record",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "elman-1990-ucsd-full-text",
  );
  const recurrence = corpus.claims.find(
    (item) => item.id === "elman-1990-simple-recurrent-context",
  );
  const setup = corpus.claims.find(
    (item) => item.id === "elman-1990-next-word-prediction-setup",
  );
  const taskMemory = corpus.claims.find(
    (item) => item.id === "elman-1990-task-dependent-memory",
  );
  const contextualTokens = corpus.claims.find(
    (item) => item.id === "elman-1990-contextual-token-representations",
  );
  const clusteringCheck = corpus.claims.find(
    (item) => item.id === "elman-1990-clustering-artifact-check",
  );
  const memoryBoundary = corpus.claims.find(
    (item) => item.id === "elman-1990-memory-boundary",
  );
  const fit = corpus.claims.find(
    (item) => item.id === "elman-1990-successor-likelihood-fit",
  );
  const targetClaim = corpus.claims.find(
    (item) => item.id === "bengio-2003-distributed-representation-precursors",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "elman-1988-to-bengio-2000",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.artifactType, "journal-article");
  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.versions.length, 2);
  assert.equal(
    work?.chronology.orderingEventId,
    "elman-1988-crl-report-publication",
  );
  assert.equal(reportEvent?.kind, "technical-report");
  assert.equal(reportEvent?.date.value, "1988-04");
  assert.deepEqual(reportEvent?.sourceIds, ["elman-1988-crl-report-abstract"]);
  assert.deepEqual(
    reportEvent?.dateEvidence,
    [
      {
        sourceId: "elman-1988-crl-report-abstract",
        precision: "month",
        locator:
          "CRL Newsletter 2(4), printed p. 3, Technical Report 8801/April entry",
      },
    ],
  );
  assert.equal(journalEvent?.kind, "journal-publication");
  assert.equal(journalEvent?.date.value, "1990-03");
  assert.equal(report?.kind, "technical-report");
  assert.ok(report?.notes.includes("unavailable and superseded"));
  assert.equal(
    work?.canonicalVersionId,
    "elman-1990-cognitive-science-journal-version",
  );
  assert.equal(journal?.kind, "journal");
  assert.deepEqual(journal?.bibliography.pages, ["179-211"]);
  assert.deepEqual(
    journal?.bibliography.identifiers.filter(
      (identifier) => identifier.type === "doi",
    ),
    [
      {
        type: "doi",
        value: "10.1207/s15516709cog1402_1",
        label: "Current article DOI",
      },
      {
        type: "doi",
        value: "10.1016/0364-0213(90)90002-E",
        label: "Legacy Elsevier DOI",
      },
    ],
  );
  assert.ok(journal?.notes.includes("ScienceDirect legacy publisher record"));
  assert.equal(
    authorRecord?.accessNote.includes("calls CRL Technical Report 8801, April"),
    false,
  );
  assert.ok(authorRecord?.accessNote.includes("does not supply the report’s April 1988 date"));
  assert.equal(crossrefRecord?.accessNote.includes("10.1016/"), false);
  assert.ok(
    crossrefRecord?.accessNote.includes(
      "does not supply the legacy Elsevier DOI",
    ),
  );
  assert.equal(scienceDirectRecord?.sourceClass, "publisher-record");
  assert.equal(scienceDirectRecord?.authority, "publisher");
  assert.equal(
    scienceDirectRecord?.url,
    "https://www.sciencedirect.com/science/article/pii/036402139090002E",
  );
  assert.deepEqual(scienceDirectRecord?.relatedWorkIds, [work?.id]);
  assert.deepEqual(scienceDirectRecord?.versionIds, [journal?.id]);
  assert.ok(work?.sourceIds.includes(scienceDirectRecord?.id));
  assert.ok(work?.preferredSourceIds.includes(scienceDirectRecord?.id));
  assert.ok(journal?.sourceIds.includes(scienceDirectRecord?.id));
  assert.ok(scienceDirectRecord?.accessNote.includes("April–June 1990"));
  assert.ok(
    scienceDirectRecord?.accessNote.includes("10.1016/0364-0213(90)90002-E"),
  );
  assert.equal(reportAbstract?.sourceClass, "primary-snippet");
  assert.deepEqual(reportAbstract?.supports, ["metadata"]);
  assert.deepEqual(fullText?.pagination, {
    scheme: "printed",
    pageStart: 179,
    pageEnd: 211,
  });
  assert.ok(recurrence?.statement.includes("fixed connections of weight 1.0"));
  assert.ok(
    recurrence?.limitations.some((item) =>
      item.includes("full backpropagation through time"),
    ),
  );
  for (const sourceCount of ["27,534", "27,354", "27,454"]) {
    assert.ok(setup?.limitations.some((item) => item.includes(sourceCount)));
  }
  assert.ok(
    setup?.statement.includes("150 hidden units plus 150 context units"),
  );
  assert.ok(
    work?.limitations.some((item) =>
      item.includes("150 hidden units plus 150 context units"),
    ),
  );
  assert.ok(
    work?.limitations.some((item) => item.includes("practically bounded")),
  );
  assert.ok(historicalScope.includes("its memory is practically bounded"));
  assert.equal(historicalScope.includes("its memory is explicitly bounded"), false);
  assert.ok(
    corpusFormat.includes(
      "ScienceDirect legacy publisher record supplies the April–June issue coverage and legacy Elsevier DOI",
    ),
  );
  assert.equal(
    corpusFormat.includes("Crossref’s legacy Elsevier DOI alias"),
    false,
  );
  assert.equal(taskMemory?.evidence[1].locator.section, "Conclusions");
  assert.deepEqual(
    contextualTokens?.evidence.map((evidence) => evidence.locator),
    [
      {
        label: "Context-dependent hidden representations, printed pp. 198–199",
        section: "Discovering Lexical Classes From Word Order",
        pageStart: 198,
        pageEnd: 199,
      },
      {
        label: "Similar but nonidentical contextual tokens, printed pp. 205–206",
        section: "Types, Tokens, and Structured Representations",
        pageStart: 205,
        pageEnd: 206,
        figure: "9",
      },
    ],
  );
  assert.deepEqual(
    clusteringCheck?.evidence.map((evidence) => evidence.locator),
    [
      {
        label: "Averaging-artifact warning, printed p. 199",
        section: "Discovering Lexical Classes From Word Order",
        pageStart: 199,
        pageEnd: 199,
        paragraph: "Footnote 6",
      },
      {
        label: "Completed all-token clustering check, printed p. 205",
        section: "Types, Tokens, and Structured Representations",
        pageStart: 205,
        pageEnd: 205,
      },
    ],
  );
  assert.deepEqual(
    memoryBoundary?.evidence.map((evidence) => evidence.locator.section),
    ["Types, Tokens, and Structured Representations", "Conclusions"],
  );
  assert.ok(fit?.statement.includes("0.88"));
  assert.ok(fit?.statement.includes("1.0"));
  assert.ok(fit?.statement.includes("0.053"));
  assert.ok(fit?.statement.includes("0.916"));
  assert.ok(
    fit?.limitations.some((item) =>
      item.includes("not a normalized next-word probability distribution"),
    ),
  );
  assert.deepEqual(targetClaim?.evidence[0].locator, {
    label: "Distributed-symbol representation precursors, printed p. 1140",
    section: "1.2 Relation to Previous Work",
    pageStart: 1140,
    pageEnd: 1140,
    paragraph: "Second paragraph",
  });
  assert.equal(
    targetClaim?.evidence.every(
      (evidence) => evidence.sourceId === "bengio-2003-jmlr-full-text",
    ),
    true,
  );
  assert.equal(relationship?.connectionType, "combines");
  assert.equal(relationship?.evidenceClass, "documented-influence");
  assert.equal(relationship?.confidence, "high");
  assert.equal(relationship?.causalLanguage, "qualified");
  assert.ok(
    relationship?.rationale.includes(
      "explicitly excludes Elman’s recurrent context mechanism",
    ),
  );
  assert.ok(
    relationship?.sourceEvidence.every(
      (evidence) => evidence.sourceId === "bengio-2003-jmlr-full-text",
    ),
  );
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains the guarded NIPS 1999, IDIAP, and IEEE neural joint-distribution family", () => {
  const work = corpus.works.find(
    (item) => item.id === "bengio-bengio-1999-neural-joint-distributions",
  );
  const conference = work?.chronology.events.find(
    (item) => item.id === "bengio-bengio-1999-nips-conference",
  );
  const journalPublication = work?.chronology.events.find(
    (item) => item.id === "bengio-bengio-2000-ieee-publication",
  );
  const proceedingsPublication = work?.chronology.events.find(
    (item) => item.id === "bengio-bengio-2000-nips-proceedings",
  );
  const nips = work?.versions.find(
    (item) => item.id === "bengio-bengio-1999-neurips-version",
  );
  const report = work?.versions.find(
    (item) => item.id === "bengio-bengio-2000-idiap-report-version",
  );
  const journal = work?.versions.find(
    (item) => item.id === "bengio-bengio-2000-ieee-journal-version",
  );
  const nipsFullText = corpus.sources.find(
    (item) => item.id === "bengio-bengio-1999-neurips-full-text",
  );
  const idiapFullText = corpus.sources.find(
    (item) => item.id === "bengio-bengio-2000-idiap-full-text",
  );
  const factorization = corpus.claims.find(
    (item) => item.id === "bengio-bengio-1999-factorized-joint-model",
  );
  const sharedNetwork = corpus.claims.find(
    (item) => item.id === "bengio-bengio-1999-shared-conditional-network",
  );
  const results = corpus.claims.find(
    (item) => item.id === "bengio-bengio-2000-pruned-network-results",
  );
  const featureBridge = corpus.claims.find(
    (item) => item.id === "bengio-bengio-2000-language-feature-bridge",
  );
  const training = corpus.claims.find(
    (item) => item.id === "bengio-bengio-1999-likelihood-map-training",
  );
  const adaptation = corpus.claims.find(
    (item) => item.id === "bengio-2003-joint-distribution-adaptation",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "bengio-bengio-1999-to-bengio-2000",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );
  const expertObjective = corpus.learningObjectives.find(
    (objective) =>
      objective.id === "expert-bengio-bengio-1999-model-and-evidence",
  );
  const languageSpecificIdeas = [
    "conditional-stochastic-language-source",
    "jointly-learned-word-representations",
    "feedforward-neural-language-modeling",
    "full-vocabulary-softmax-normalization",
  ];

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.displayCitation.includes("NIPS"), false);
  assert.equal(work?.versions.length, 3);
  assert.equal(
    work?.canonicalVersionId,
    "bengio-bengio-2000-ieee-journal-version",
  );
  assert.equal(
    work?.chronology.orderingEventId,
    "bengio-bengio-1999-nips-conference",
  );
  assert.equal(conference?.date.value, "1999");
  assert.equal(journalPublication?.date.value, "2000-05");
  assert.equal(proceedingsPublication?.date.value, "2000-06-20");
  assert.deepEqual(nips?.authors, ["Yoshua Bengio", "Samy Bengio"]);
  assert.deepEqual(journal?.authors, ["Samy Bengio", "Yoshua Bengio"]);
  assert.equal(report?.kind, "technical-report");
  assert.deepEqual(nips?.bibliography.pages, ["400-406"]);
  assert.ok(
    journal?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "doi" && identifier.value === "10.1109/72.846725",
    ),
  );
  assert.deepEqual(nipsFullText?.pagination, {
    scheme: "printed",
    pageStart: 400,
    pageEnd: 406,
  });
  assert.deepEqual(idiapFullText?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 8,
  });
  assert.ok(idiapFullText?.accessNote.includes("no visible printed IEEE folios"));
  assert.ok(idiapFullText?.accessNote.includes("no work-level open license"));
  assert.deepEqual(featureBridge?.ideaIds, [
    "low-dimensional-feature-encoding-for-large-domains",
  ]);
  assert.ok(
    work?.ideaIds.includes("low-dimensional-feature-encoding-for-large-domains"),
  );
  assert.equal(training?.evidence[0].locator.section, "2.1. Discussion");
  assert.ok(
    expertObjective?.claimIds.includes(
      "bengio-bengio-1999-likelihood-map-training",
    ),
  );
  for (const claim of corpus.claims.filter((item) =>
    item.evidence.some(
      (evidence) =>
        evidence.sourceId === "bengio-bengio-2000-idiap-full-text",
    ),
  )) {
    for (const evidence of claim.evidence.filter(
      (item) => item.sourceId === "bengio-bengio-2000-idiap-full-text",
    )) {
      assert.equal(evidence.locator.pageStart, undefined);
      assert.equal(evidence.locator.pageEnd, undefined);
    }
  }
  for (const claim of [factorization, sharedNetwork]) {
    assert.deepEqual(
      new Set(claim?.evidence.map((evidence) => evidence.sourceId)),
      new Set([
        "bengio-bengio-1999-neurips-full-text",
        "bengio-bengio-2000-idiap-full-text",
      ]),
    );
  }
  assert.equal(sharedNetwork?.evidence[0].locator.pageStart, 401);
  assert.equal(sharedNetwork?.evidence[1].locator.figure, "2");
  assert.ok(results?.statement.includes("p = .20"));
  assert.ok(results?.statement.includes("16.55 for Soybean"));
  assert.deepEqual(
    results?.evidence.map((evidence) => evidence.sourceId),
    ["bengio-bengio-2000-idiap-full-text"],
  );
  assert.equal(
    adaptation?.evidence.every(
      (evidence) => evidence.sourceId === "bengio-2003-jmlr-full-text",
    ),
    true,
  );
  assert.equal(
    languageSpecificIdeas.some((ideaId) => work?.ideaIds.includes(ideaId)),
    false,
  );
  assert.deepEqual(relationship?.from, {
    kind: "work",
    id: work?.id,
  });
  assert.deepEqual(relationship?.to, {
    kind: "work",
    id: "bengio-2000-neural-probabilistic-language-model",
  });
  assert.equal(relationship?.connectionType, "builds-on");
  assert.equal(relationship?.evidenceClass, "documented-influence");
  assert.equal(relationship?.confidence, "high");
  assert.equal(relationship?.causalLanguage, "qualified");
  assert.ok(
    relationship?.claimIds.includes("bengio-2003-joint-distribution-adaptation"),
  );
  assert.ok(
    relationship?.sourceEvidence.every(
      (evidence) => evidence.sourceId === "bengio-2003-jmlr-full-text",
    ),
  );
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains Miikkulainen and Dyer as a version-aware neural NLP branch", () => {
  const work = corpus.works.find(
    (item) =>
      item.id === "miikkulainen-dyer-1991-modular-pdp-language-processing",
  );
  const event = work?.chronology.events.find(
    (item) => item.id === "miikkulainen-dyer-1991-journal-publication",
  );
  const journal = work?.versions.find(
    (item) => item.id === "miikkulainen-dyer-1991-journal-version",
  );
  const manuscript = work?.versions.find(
    (item) => item.id === "miikkulainen-dyer-1991-author-manuscript-version",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "miikkulainen-dyer-1991-author-manuscript",
  );
  const sequential = corpus.claims.find(
    (item) =>
      item.id === "miikkulainen-dyer-1991-sequential-case-role-evaluation",
  );
  const storyResults = corpus.claims.find(
    (item) => item.id === "miikkulainen-dyer-1991-incomplete-story-results",
  );
  const storyScope = corpus.claims.find(
    (item) =>
      item.id === "miikkulainen-dyer-1991-scripted-story-evaluation-scope",
  );
  const probabilityBoundary = corpus.claims.find(
    (item) => item.id === "miikkulainen-dyer-1991-probability-model-boundary",
  );
  const elmanRelationship = corpus.relationships.find(
    (item) => item.id === "elman-1988-to-miikkulainen-dyer-1991",
  );
  const bengioRelationship = corpus.relationships.find(
    (item) => item.id === "miikkulainen-dyer-1991-to-bengio-2000",
  );
  const claims = corpus.claims.filter((item) => item.workId === work?.id);
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.chronology.orderingEventId, event?.id);
  assert.equal(event?.date.value, "1991-07");
  assert.equal(event?.date.precision, "month");
  assert.equal(work?.canonicalVersionId, journal?.id);
  assert.equal(manuscript?.kind, "preprint");
  assert.deepEqual(manuscript?.bibliography.pages, ["1-46"]);
  assert.deepEqual(fullText?.pagination, {
    scheme: "printed",
    pageStart: 1,
    pageEnd: 46,
  });
  assert.equal(work?.preferredSourceIds.includes(fullText?.id), false);
  assert.deepEqual(
    journal?.bibliography.identifiers
      .filter((identifier) => identifier.type === "doi")
      .map((identifier) => identifier.value),
    [
      "10.1207/s15516709cog1503_2",
      "10.1016/0364-0213(91)80002-M",
    ],
  );
  for (const ideaId of [
    "next-item-prediction-training",
    "jointly-learned-word-representations",
    "feedforward-neural-language-modeling",
  ]) {
    assert.equal(work?.ideaIds.includes(ideaId), false);
  }
  for (const claim of claims) {
    assert.equal(
      claim.evidence.every(
        (evidence) =>
          evidence.sourceId === fullText?.id &&
          evidence.locator.pageStart >= 1 &&
          evidence.locator.pageEnd <= 46,
      ),
      true,
      `${claim.id} must retain manuscript-only locators within pp. 1–46`,
    );
  }
  assert.ok(sequential?.statement.includes("97% correct output words"));
  assert.ok(sequential?.statement.includes("95% correct cloned-synonym words"));
  assert.ok(sequential?.statement.includes("93% of output values within 0.15"));
  assert.ok(sequential?.statement.includes("average error 0.045"));
  assert.equal(
    sequential?.evidence[0].locator.section,
    "7.3 Case-role assignment from sequential input",
  );
  for (const row of [
    "sentence parser (99/99% words, 99/99% cloned instances, 99/98% values within 0.15, 0.017/0.019 error)",
    "story parser (99/96, 99/97, 96/93, 0.023/0.041)",
    "story generator (99/99, 99/97, 97/97, 0.021/0.027)",
    "sentence generator (99/99, 99/97, 96/95, 0.037/0.044)",
  ]) {
    assert.ok(storyResults?.statement.includes(row));
  }
  assert.equal(storyResults?.evidence[0].locator.section, "10.7 Paraphrasing");
  assert.ok(
    storyScope?.evidence.some(
      (evidence) => evidence.locator.section === "11.4 Implementing control with networks",
    ),
  );
  assert.equal(
    probabilityBoundary?.evidence[0].locator.section,
    "12.4 Parallel distributed inference",
  );
  assert.ok(
    probabilityBoundary?.limitations.some((item) =>
      item.includes("no normalized next-word"),
    ),
  );
  assert.ok(
    work?.uncertainties.some((item) => item.note.includes("1,439 training")),
  );
  assert.equal(elmanRelationship?.connectionType, "builds-on");
  assert.equal(elmanRelationship?.evidenceClass, "documented-influence");
  assert.equal(elmanRelationship?.confidence, "high");
  assert.equal(elmanRelationship?.causalLanguage, "qualified");
  assert.equal(bengioRelationship?.connectionType, "addresses");
  assert.equal(bengioRelationship?.evidenceClass, "documented-influence");
  assert.equal(bengioRelationship?.confidence, "high");
  assert.equal(bengioRelationship?.causalLanguage, "qualified");
  assert.ok(bengioRelationship?.rationale.includes("does not transfer FGREP"));
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains Xu and Rudnicky as an independent direct-softmax bigram branch", () => {
  const work = corpus.works.find(
    (item) => item.id === "xu-rudnicky-2000-neural-bigram-language-model",
  );
  const event = work?.chronology.events.find(
    (item) => item.id === "xu-rudnicky-2000-icslp-presentation",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "xu-rudnicky-2000-isca-full-text",
  );
  const bigram = corpus.claims.find(
    (item) => item.id === "xu-rudnicky-2000-bigram-probability-objective",
  );
  const architecture = corpus.claims.find(
    (item) => item.id === "xu-rudnicky-2000-direct-softmax-architecture",
  );
  const likelihood = corpus.claims.find(
    (item) => item.id === "xu-rudnicky-2000-likelihood-and-early-stopping",
  );
  const training = corpus.claims.find(
    (item) => item.id === "xu-rudnicky-2000-batch-training-and-sparse-updates",
  );
  const scope = corpus.claims.find(
    (item) => item.id === "xu-rudnicky-2000-communicator-evaluation-scope",
  );
  const results = corpus.claims.find(
    (item) => item.id === "xu-rudnicky-2000-table-one-results",
  );
  const cost = corpus.claims.find(
    (item) => item.id === "xu-rudnicky-2000-training-cost",
  );
  const analysis = corpus.claims.find(
    (item) => item.id === "xu-rudnicky-2000-early-stopping-analysis",
  );
  const futureBoundary = corpus.claims.find(
    (item) => item.id === "xu-rudnicky-2000-future-architecture-boundary",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "xu-rudnicky-2000-to-bengio-2000",
  );
  const claims = corpus.claims.filter((item) => item.workId === work?.id);
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(event?.date.value, "2000-10");
  assert.equal(event?.date.precision, "month");
  assert.deepEqual(fullText?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 4,
  });
  for (const ideaId of [
    "jointly-learned-word-representations",
    "feedforward-neural-language-modeling",
    "simple-recurrent-context-memory",
  ]) {
    assert.equal(work?.ideaIds.includes(ideaId), false);
  }
  for (const claim of claims) {
    for (const evidence of claim.evidence) {
      assert.equal(evidence.sourceId, fullText?.id);
      assert.equal(evidence.locator.pageStart, undefined);
      assert.equal(evidence.locator.pageEnd, undefined);
      assert.equal(
        ["section", "equation", "table", "figure", "paragraph"].some(
          (key) => evidence.locator[key],
        ),
        true,
        `${claim.id} must retain a structural locator`,
      );
    }
  }
  assert.equal(bigram?.evidence[0].locator.section, "2. Basic of language modeling");
  assert.equal(
    architecture?.evidence[0].locator.section,
    "3.1 Input and output encoding; 3.3 Activation function; 3.4 Network structure",
  );
  assert.equal(
    likelihood?.evidence[0].locator.section,
    "3.2 Error function; 3.6 Training method",
  );
  assert.equal(
    training?.evidence[0].locator.section,
    "3.5 An issue on computation cost; 3.6 Training method",
  );
  assert.equal(scope?.evidence[0].locator.section, "4. Experiment result");
  assert.equal(results?.evidence[0].locator.section, "4. Experiment result");
  assert.ok(architecture?.statement.includes("V(V+1)"));
  assert.ok(architecture?.statement.includes("no hidden units"));
  assert.ok(scope?.statement.includes("2,500 vocabulary items"));
  assert.ok(scope?.statement.includes("1,200 classes"));
  assert.ok(scope?.statement.includes("exclude within-class word probabilities"));
  assert.ok(results?.statement.includes("9.84/11.89/12.20/10.26"));
  assert.ok(results?.statement.includes("9.50/11.76/11.99/not reported"));
  assert.ok(results?.statement.includes("9.58/11.19/11.17/9.68"));
  assert.ok(results?.statement.includes("9.82/11.24/11.16/9.58"));
  assert.ok(cost?.statement.includes("one minute"));
  assert.ok(cost?.statement.includes("thousands of epochs"));
  assert.ok(cost?.statement.includes("under 30 seconds"));
  assert.ok(analysis?.statement.includes("12.17/14.63/19.24"));
  assert.ok(analysis?.statement.includes("19.24"));
  assert.ok(
    analysis?.statement.includes("softmax network's interpolation form unknown"),
  );
  assert.ok(futureBoundary?.statement.includes("future work"));
  assert.ok(
    work?.uncertainties.some((item) =>
      item.note.includes("large-count discussion refers to equation (5.3)"),
    ),
  );
  assert.equal(relationship?.connectionType, "conceptual-parallel");
  assert.equal(relationship?.evidenceClass, "editorial-synthesis");
  assert.equal(relationship?.confidence, "high");
  assert.equal(relationship?.causalLanguage, "prohibited");
  assert.ok(relationship?.rationale.includes("No influence or priority"));
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains the guarded NIPS 2000 and JMLR 2003 neural language-model family", () => {
  const work = corpus.works.find(
    (item) => item.id === "bengio-2000-neural-probabilistic-language-model",
  );
  const conference = work?.chronology.events.find(
    (item) => item.id === "bengio-2000-nips-conference",
  );
  const proceedings = work?.chronology.events.find(
    (item) => item.id === "bengio-2001-nips-proceedings",
  );
  const nips = work?.versions.find(
    (item) => item.id === "bengio-2000-nips-version",
  );
  const jmlr = work?.versions.find(
    (item) => item.id === "bengio-2003-jmlr-version",
  );
  const nipsFullText = corpus.sources.find(
    (item) => item.id === "bengio-2000-neurips-full-text",
  );
  const jmlrFullText = corpus.sources.find(
    (item) => item.id === "bengio-2003-jmlr-full-text",
  );
  const priorArtBoundary = corpus.claims.find(
    (item) => item.id === "bengio-2003-prior-neural-language-models",
  );
  const brown = corpus.claims.find(
    (item) => item.id === "bengio-2003-brown-comparison",
  );
  const ap = corpus.claims.find(
    (item) => item.id === "bengio-2003-ap-comparison",
  );
  const directPath = corpus.claims.find(
    (item) => item.id === "bengio-2003-direct-path-inconclusive",
  );
  const jointAdaptation = corpus.claims.find(
    (item) => item.id === "bengio-2003-joint-distribution-adaptation",
  );
  const representationPrecursors = corpus.claims.find(
    (item) => item.id === "bengio-2003-distributed-representation-precursors",
  );
  const auditedPrecursorResolution = work?.uncertainties.find((item) =>
    item.note.includes("Miikkulainen and Dyer 1991"),
  );
  const promotedClaims = corpus.claims.filter(
    (item) => item.workId === work?.id,
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "jelinek-mercer-1980-to-bengio-2000",
  );
  const precursorRelationship = corpus.relationships.find(
    (item) => item.id === "bengio-bengio-1999-to-bengio-2000",
  );
  const miikkulainenRelationship = corpus.relationships.find(
    (item) => item.id === "miikkulainen-dyer-1991-to-bengio-2000",
  );
  const xuRelationship = corpus.relationships.find(
    (item) => item.id === "xu-rudnicky-2000-to-bengio-2000",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );
  const modes = new Set(objectives.map((objective) => objective.mode));

  assert.equal(work?.artifactType, "journal-article");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(
    work?.chronology.orderingEventId,
    "bengio-2000-nips-conference",
  );
  assert.equal(conference?.kind, "conference-presentation");
  assert.equal(conference?.date.value, "2000");
  assert.equal(proceedings?.kind, "proceedings-publication");
  assert.equal(proceedings?.date.value, "2001-05-11");
  assert.equal(
    work?.chronology.events.some(
      (event) => event.id === "bengio-2002-jmlr-submission",
    ),
    false,
  );
  assert.equal(work?.canonicalVersionId, "bengio-2003-jmlr-version");
  assert.deepEqual(nips?.authors, [
    "Yoshua Bengio",
    "Réjean Ducharme",
    "Pascal Vincent",
  ]);
  assert.deepEqual(jmlr?.authors, [
    "Yoshua Bengio",
    "Réjean Ducharme",
    "Pascal Vincent",
    "Christian Jauvin",
  ]);
  assert.deepEqual(nips?.bibliography.pages, ["932-938"]);
  assert.deepEqual(jmlr?.bibliography.pages, ["1137-1155"]);
  assert.ok(jmlr?.notes.includes("submission in April 2002"));
  assert.deepEqual(nipsFullText?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 7,
  });
  assert.equal(nipsFullText?.supports.includes("claim-location"), true);
  assert.deepEqual(jmlrFullText?.pagination, {
    scheme: "printed",
    pageStart: 1137,
    pageEnd: 1155,
  });
  assert.ok(nipsFullText?.accessNote.includes("not described as openly licensed"));
  assert.ok(jmlrFullText?.accessNote.includes("no verified open license"));
  assert.ok(priorArtBoundary?.statement.includes("was not new"));
  assert.ok(brown?.statement.includes("unreported/265/252"));
  assert.ok(brown?.statement.includes("19.2% reduction relative to 312"));
  assert.ok(ap?.statement.includes("104/109"));
  assert.ok(ap?.statement.includes("6.8%"));
  assert.ok(
    directPath?.statement.includes("100 hidden units rather than 50"),
  );
  assert.ok(
    work?.ideaIds.includes("neural-joint-distribution-factorization"),
  );
  assert.ok(
    work?.ideaIds.includes("learned-distributed-symbol-representations"),
  );
  assert.ok(jointAdaptation?.statement.includes("variable-length word sequences"));
  assert.ok(representationPrecursors?.statement.includes("Hinton 1986"));
  assert.ok(representationPrecursors?.statement.includes("Elman 1990"));
  assert.equal(auditedPrecursorResolution?.status, "resolved");
  assert.equal(auditedPrecursorResolution?.resolutionCondition, undefined);
  assert.ok(auditedPrecursorResolution?.note.includes("Xu and Rudnicky 2000"));
  for (const objective of objectives) {
    assert.ok(
      objective.ideaIds.includes("learned-distributed-symbol-representations"),
    );
    assert.ok(
      objective.claimIds.includes(
        "bengio-2003-distributed-representation-precursors",
      ),
    );
    assert.ok(objective.successCriterion.includes("Hinton"));
    assert.ok(objective.successCriterion.includes("Elman"));
    assert.ok(objective.successCriterion.includes("Bengio"));
  }
  for (const claim of promotedClaims) {
    const sourceId = claim.id.startsWith("bengio-2000-conference-")
      ? "bengio-2000-neurips-full-text"
      : "bengio-2003-jmlr-full-text";
    assert.ok(
      claim.evidence.every(
        (evidence) => evidence.sourceId === sourceId,
      ),
      `${claim.id} must retain its version-specific evidence scope`,
    );
  }
  assert.deepEqual(relationship?.from, {
    kind: "work",
    id: "jelinek-mercer-1980-interpolation",
  });
  assert.deepEqual(relationship?.to, {
    kind: "work",
    id: work?.id,
  });
  assert.equal(relationship?.connectionType, "combines");
  assert.equal(relationship?.evidenceClass, "documented-influence");
  assert.equal(relationship?.causalLanguage, "qualified");
  assert.ok(
    relationship?.rationale.includes(
      "not to the feed-forward architecture as a whole",
    ),
  );
  assert.deepEqual(precursorRelationship?.to, {
    kind: "work",
    id: work?.id,
  });
  assert.equal(precursorRelationship?.connectionType, "builds-on");
  assert.equal(precursorRelationship?.evidenceClass, "documented-influence");
  assert.deepEqual(miikkulainenRelationship?.to, {
    kind: "work",
    id: work?.id,
  });
  assert.equal(miikkulainenRelationship?.connectionType, "addresses");
  assert.equal(miikkulainenRelationship?.causalLanguage, "qualified");
  assert.deepEqual(xuRelationship?.to, {
    kind: "work",
    id: work?.id,
  });
  assert.equal(xuRelationship?.connectionType, "conceptual-parallel");
  assert.equal(xuRelationship?.evidenceClass, "editorial-synthesis");
  assert.equal(xuRelationship?.causalLanguage, "prohibited");
  for (const comparatorId of [
    "katz-1987-sparse-data",
    "kneser-ney-1995-improved-backing-off",
    "chen-goodman-1998-empirical-smoothing",
  ]) {
    assert.equal(
      corpus.relationships.some(
        (item) => item.from.id === comparatorId && item.to.id === work?.id,
      ),
      false,
    );
  }
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains Schmidhuber 1993 as a separate neural-compression antecedent", () => {
  const work = corpus.works.find(
    (item) =>
      item.id === "schmidhuber-1993-neural-redundancy-text-compression",
  );
  const source = corpus.sources.find(
    (item) => item.id === "schmidhuber-1993-author-full-text",
  );
  const authorRecord = corpus.sources.find(
    (item) => item.id === "schmidhuber-1993-author-record",
  );
  const result = corpus.claims.find(
    (item) => item.id === "schmidhuber-1993-merkur-results",
  );
  const collaboration = corpus.claims.find(
    (item) => item.id === "schmidhuber-1993-heil-collaboration",
  );
  const boundary = corpus.claims.find(
    (item) => item.id === "schmidhuber-1993-online-recurrent-boundary",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "schmidhuber-1993-to-schmidhuber-heil-1994",
  );
  const claims = corpus.claims.filter((item) => item.workId === work?.id);
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.title, "“Neural” Redundancy Reduction for Text Compression");
  assert.deepEqual(work?.authors, ["Jürgen Schmidhuber"]);
  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.chronology.events[0].date.value, "1993");
  assert.equal(work?.chronology.events[0].date.precision, "year");
  assert.equal(work?.versions.length, 1);
  assert.deepEqual(work?.versions[0].bibliography.pages, ["849-853"]);
  assert.equal(
    source?.url,
    "https://sferics.idsia.ch/pub/juergen/ascona.ps.gz",
  );
  assert.equal(
    authorRecord?.url,
    "https://people.idsia.ch/~juergen/onlinepub.html",
  );
  assert.ok(work?.preferredSourceIds.includes(authorRecord?.id));
  assert.deepEqual(source?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 6,
  });
  assert.equal(claims.length, 5);
  for (const claim of claims) {
    assert.equal(claim.evidence.length > 0, true);
    for (const evidence of claim.evidence) {
      assert.equal(evidence.sourceId, source?.id);
      assert.equal(evidence.locator.pageStart, undefined);
      assert.equal(evidence.locator.pageEnd, undefined);
      assert.ok(evidence.locator.section);
    }
  }
  for (const value of ["1.41", "1.98", "2.25", "2.68"]) {
    assert.ok(result?.statement.includes(value));
  }
  assert.ok(collaboration?.statement.includes("Stefan Heil"));
  assert.ok(boundary?.statement.includes("two orders of magnitude"));
  assert.deepEqual(relationship?.from, { kind: "work", id: work?.id });
  assert.deepEqual(relationship?.to, {
    kind: "work",
    id: "schmidhuber-heil-1994-sequential-neural-text-compression",
  });
  assert.equal(relationship?.connectionType, "extends");
  assert.equal(relationship?.evidenceClass, "editorial-synthesis");
  assert.equal(relationship?.causalLanguage, "prohibited");
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains Schmidhuber and Heil as a dual-sourced version-aware compression branch", () => {
  const work = corpus.works.find(
    (item) =>
      item.id ===
      "schmidhuber-heil-1994-sequential-neural-text-compression",
  );
  const conference = work?.chronology.events.find(
    (item) => item.id === "schmidhuber-heil-1994-nips-conference",
  );
  const nips = work?.versions.find(
    (item) => item.id === "schmidhuber-heil-1994-nips-version",
  );
  const preprint = work?.versions.find(
    (item) => item.id === "schmidhuber-heil-1994-author-preprint-version",
  );
  const journal = work?.versions.find(
    (item) => item.id === "schmidhuber-heil-1996-journal-version",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "schmidhuber-heil-1994-author-preprint",
  );
  const conferenceText = corpus.sources.find(
    (item) => item.id === "schmidhuber-heil-1994-neurips-full-text",
  );
  const predictor = corpus.claims.find(
    (item) => item.id === "schmidhuber-heil-1994-character-probability-predictor",
  );
  const residualMethod = corpus.claims.find(
    (item) => item.id === "schmidhuber-heil-1994-deterministic-residual-method",
  );
  const sameSource = corpus.claims.find(
    (item) => item.id === "schmidhuber-heil-1994-same-source-results",
  );
  const crossSource = corpus.claims.find(
    (item) => item.id === "schmidhuber-heil-1994-cross-source-results",
  );
  const modelBoundary = corpus.claims.find(
    (item) => item.id === "schmidhuber-heil-1994-frozen-model-boundary",
  );
  const recurrenceBoundary = corpus.claims.find(
    (item) => item.id === "schmidhuber-heil-1994-online-recurrent-boundary",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "schmidhuber-heil-1994-to-bengio-2000",
  );
  const claims = corpus.claims.filter((item) => item.workId === work?.id);
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );
  const beginnerObjective = corpus.learningObjectives.find(
    (objective) =>
      objective.id === "beginner-schmidhuber-heil-1994-predict-and-code",
  );

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.chronology.orderingEventId, conference?.id);
  assert.equal(conference?.date.value, "1994");
  assert.equal(conference?.date.precision, "year");
  assert.equal(work?.versions.length, 3);
  assert.equal(
    nips?.title,
    "Predictive Coding with Neural Nets: Application to Text Compression",
  );
  assert.deepEqual(nips?.bibliography.pages, ["1047-1054"]);
  assert.deepEqual(nips?.bibliography.editors, [
    "Gerald Tesauro",
    "David S. Touretzky",
    "Todd K. Leen",
  ]);
  assert.ok(nips?.notes.includes("Method 3"));
  assert.ok(nips?.notes.includes("variances"));
  assert.equal(preprint?.kind, "preprint");
  assert.deepEqual(preprint?.bibliography.pages, ["1-9"]);
  assert.ok(
    preprint?.notes.includes(
      "not treated as a verified public-release event",
    ),
  );
  assert.equal(work?.canonicalVersionId, journal?.id);
  assert.equal(
    journal?.bibliography.identifiers[0].value,
    "10.1109/72.478398",
  );
  assert.deepEqual(fullText?.pagination, {
    scheme: "printed",
    pageStart: 1,
    pageEnd: 9,
  });
  assert.deepEqual(conferenceText?.pagination, {
    scheme: "printed",
    pageStart: 1047,
    pageEnd: 1054,
  });
  assert.ok(conferenceText?.accessNote.includes("1048–1054"));
  assert.equal(claims.length, 12);
  for (const claim of claims) {
    const preprintEvidence = claim.evidence.filter(
      (evidence) => evidence.sourceId === fullText?.id,
    );
    assert.ok(preprintEvidence.length > 0, `${claim.id} needs preprint evidence`);
    for (const evidence of preprintEvidence) {
      assert.ok(evidence.locator.pageStart >= 1);
      assert.ok(evidence.locator.pageEnd <= 9);
      assert.doesNotMatch(
        evidence.locator.section,
        /The Approach|The Architecture|Simulation Results|Online Methods|The Objective Function/,
      );
    }
    for (const evidence of claim.evidence.filter(
      (item) => item.sourceId === conferenceText?.id,
    )) {
      assert.ok(evidence.locator.pageStart >= 1048);
      assert.ok(evidence.locator.pageEnd <= 1053);
    }
  }
  for (const claimId of [
    "schmidhuber-heil-1994-character-probability-predictor",
    "schmidhuber-heil-1994-squared-error-normalization",
    "schmidhuber-heil-1994-lossless-predictive-coding",
    "schmidhuber-heil-1994-frozen-model-boundary",
    "schmidhuber-heil-1994-network-capacity-rationale",
    "schmidhuber-heil-1994-experimental-scope",
    "schmidhuber-heil-1994-same-source-results",
    "schmidhuber-heil-1994-cross-source-results",
    "schmidhuber-heil-1994-training-runtime-cost",
    "schmidhuber-heil-1994-online-recurrent-boundary",
  ]) {
    const claim = corpus.claims.find((item) => item.id === claimId);
    assert.ok(
      claim?.evidence.some((evidence) => evidence.sourceId === conferenceText?.id),
      `${claimId} must retain conference-version evidence`,
    );
  }
  for (const claimId of [
    "schmidhuber-heil-1994-deterministic-residual-method",
    "schmidhuber-heil-1994-hidden-unit-human-comparison",
  ]) {
    const claim = corpus.claims.find((item) => item.id === claimId);
    assert.equal(
      claim?.evidence.some((evidence) => evidence.sourceId === conferenceText?.id),
      false,
      `${claimId} must remain longer-manuscript-only`,
    );
  }
  assert.ok(
    predictor?.evidence.some(
      (evidence) =>
        evidence.sourceId === fullText?.id &&
        evidence.locator.section === "IV. Simulations" &&
        evidence.locator.pageStart === 6 &&
        evidence.locator.pageEnd === 6,
    ),
  );
  assert.ok(residualMethod?.statement.includes("does not use the full"));
  assert.ok(residualMethod?.statement.includes("UNIX pack"));
  for (const value of [
    "1.74/.0002",
    "1.99/.0014",
    "2.20/.0014",
    "2.29/.0033",
    "2.70/.0158",
    "2.72/.0234",
  ]) {
    assert.ok(sameSource?.statement.includes(value));
  }
  for (const value of [
    "1.67/.0003",
    "1.71/.0036",
    "1.99/.0013",
    "2.03/.0099",
    "2.25/.0077",
    "2.20/.0112",
  ]) {
    assert.ok(crossSource?.statement.includes(value));
  }
  assert.ok(modelBoundary?.statement.includes("trained weights"));
  assert.ok(modelBoundary?.statement.includes("compressed length"));
  assert.ok(recurrenceBoundary?.statement.includes("possible extensions"));
  assert.ok(
    beginnerObjective?.claimIds.includes(
      "schmidhuber-heil-1994-same-source-results",
    ),
  );
  assert.equal(relationship?.connectionType, "conceptual-parallel");
  assert.equal(relationship?.evidenceClass, "editorial-synthesis");
  assert.equal(relationship?.causalLanguage, "prohibited");
  assert.deepEqual(relationship?.to, {
    kind: "work",
    id: "bengio-2000-neural-probabilistic-language-model",
  });
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains Schwenk and Gauvain as a bounded LVCSR extension branch", () => {
  const work = corpus.works.find(
    (item) => item.id === "schwenk-gauvain-2002-connectionist-lvcsr",
  );
  const event = work?.chronology.events.find(
    (item) => item.id === "schwenk-gauvain-2002-icassp-conference",
  );
  const version = work?.versions.find(
    (item) => item.id === "schwenk-gauvain-2002-icassp-version",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "schwenk-gauvain-2002-author-full-text",
  );
  const crossref = corpus.sources.find(
    (item) => item.id === "schwenk-gauvain-2002-crossref-record",
  );
  const reportBoundaryIds = [
    "schwenk-2001-author-bibliography-2003",
    "schwenk-2001-author-bibliography-2006",
    "schwenk-2007-sciencedirect-record",
    "schwenk-2007-continuous-space-reading-copy",
  ];
  const reportBoundaries = reportBoundaryIds.map((sourceId) =>
    corpus.sources.find((item) => item.id === sourceId),
  );
  const reportUncertainty = work?.uncertainties.find((uncertainty) =>
    uncertainty.note.includes("Technical Report 2001-20"),
  );
  const motivation = corpus.claims.find(
    (item) => item.id === "schwenk-gauvain-2002-unseen-ngram-motivation",
  );
  const extension = corpus.claims.find(
    (item) => item.id === "schwenk-gauvain-2002-bengio-extension-scope",
  );
  const projection = corpus.claims.find(
    (item) => item.id === "schwenk-gauvain-2002-projection-softmax-architecture",
  );
  const complexity = corpus.claims.find(
    (item) => item.id === "schwenk-gauvain-2002-full-output-complexity",
  );
  const hybrid = corpus.claims.find(
    (item) => item.id === "schwenk-gauvain-2002-shortlist-hybrid-normalization",
  );
  const cache = corpus.claims.find(
    (item) => item.id === "schwenk-gauvain-2002-caching-optimized-evaluation",
  );
  const shortlist = corpus.claims.find(
    (item) => item.id === "schwenk-gauvain-2002-shortlist-results",
  );
  const perplexity = corpus.claims.find(
    (item) =>
      item.id === "schwenk-gauvain-2002-connectionist-perplexity-results",
  );
  const recognition = corpus.claims.find(
    (item) => item.id === "schwenk-gauvain-2002-broadcast-word-error-results",
  );
  const evidenceBoundary = corpus.claims.find(
    (item) => item.id === "schwenk-gauvain-2002-evidence-long-context-boundary",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "bengio-2000-to-schwenk-gauvain-2002",
  );
  const claims = corpus.claims.filter((item) => item.workId === work?.id);
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(
    work?.chronology.orderingEventId,
    "schwenk-gauvain-2002-icassp-conference",
  );
  assert.equal(event?.date.value, "2002-05");
  assert.equal(event?.date.precision, "month");
  assert.equal(work?.versions.length, 1);
  assert.equal(work?.canonicalVersionId, version?.id);
  assert.deepEqual(version?.bibliography.pages, ["I-765-I-768"]);
  assert.equal(
    version?.bibliography.identifiers[0].value,
    "10.1109/ICASSP.2002.5743830",
  );
  assert.deepEqual(fullText?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 4,
  });
  assert.ok(crossref?.accessNote.includes("full given names"));
  assert.deepEqual(
    reportBoundaries.map((source) => source?.versionIds),
    reportBoundaryIds.map(() => []),
  );
  for (const [index, source] of reportBoundaries.entries()) {
    assert.ok(source, `${reportBoundaryIds[index]} must remain recorded`);
    assert.ok(source.supports.includes("version-boundary"));
    assert.ok(work?.sourceIds.includes(source.id));
    assert.equal(work?.preferredSourceIds.includes(source.id), false);
    assert.equal(version?.sourceIds.includes(source.id), false);
  }
  assert.ok(reportBoundaries[0]?.accessNote.includes("21 December 2001"));
  assert.ok(reportBoundaries[0]?.accessNote.includes("H. Schwenk alone"));
  assert.ok(
    reportBoundaries[1]?.accessNote.includes(
      "Holger Schwenk and Jean-Luc Gauvain",
    ),
  );
  assert.ok(reportBoundaries[1]?.accessNote.includes("conflicts"));
  assert.equal(reportBoundaries[3]?.sourceClass, "primary-full-text");
  assert.equal(reportBoundaries[3]?.authority, "third-party-host");
  assert.ok(reportBoundaries[3]?.accessNote.includes("Printed p. 493"));
  assert.ok(reportBoundaries[3]?.accessNote.includes("printed p. 517"));
  assert.ok(reportBoundaries[3]?.accessNote.includes("not independent priority"));
  assert.equal(reportUncertainty?.status, "open");
  assert.ok(reportUncertainty?.note.includes("disagree on authorship"));
  assert.ok(reportUncertainty?.note.includes("no complete report was located"));
  assert.ok(reportUncertainty?.note.includes("version-boundary evidence"));
  assert.equal(claims.length, 12);
  const visibleSections = new Set([
    "1. Introduction",
    "2. Architecture of the Approach",
    "2.1. Complexity Analysis",
    "3. Results on HUB5",
    "3.1. Importance of the Shortlist",
    "3.2. Decoding Experiments",
    "4. Discussion and Future Work",
    "5. Acknowledgments",
    "6. References",
    "3. Results on HUB5; 3.1. Importance of the Shortlist",
  ]);
  for (const claim of claims) {
    for (const evidence of claim.evidence) {
      assert.equal(evidence.sourceId, fullText?.id);
      assert.equal(evidence.locator.pageStart, undefined);
      assert.equal(evidence.locator.pageEnd, undefined);
      assert.equal(
        ["section", "equation", "table", "paragraph"].some(
          (key) => evidence.locator[key],
        ),
        true,
        `${claim.id} must retain a structural locator`,
      );
      assert.ok(
        visibleSections.has(evidence.locator.section),
        `${claim.id} must use an exact visible section heading`,
      );
    }
  }
  const promotedSourceIds = new Set([
    ...claims.flatMap((claim) =>
      claim.evidence.map((evidence) => evidence.sourceId),
    ),
    ...corpus.relationships.flatMap((item) =>
      item.sourceEvidence.map((evidence) => evidence.sourceId),
    ),
    ...work.chronology.events.flatMap((item) => [
      ...item.sourceIds,
      ...item.dateEvidence.map((evidence) => evidence.sourceId),
    ]),
  ]);
  for (const sourceId of reportBoundaryIds) {
    assert.equal(
      promotedSourceIds.has(sourceId),
      false,
      `${sourceId} must not support promoted claims, relationships, or chronology`,
    );
  }
  assert.ok(motivation?.ideaIds.includes("sparse-language-model-estimation"));
  assert.equal(hybrid?.ideaIds.includes("sparse-language-model-estimation"), false);
  assert.ok(projection?.statement.includes("jointly learns the word vectors"));
  assert.ok(extension?.limitations.join(" ").includes("Morgan Kaufmann"));
  assert.ok(extension?.limitations.join(" ").includes("no pages"));
  assert.ok(complexity?.statement.includes("13 million"));
  assert.ok(complexity?.statement.includes("N=64,000"));
  assert.ok(cache?.statement.includes("full-output thought experiment"));
  assert.ok(cache?.statement.includes("2,000-word-shortlist decoder"));
  assert.ok(cache?.statement.includes("12,100"));
  assert.ok(cache?.statement.includes("2.17 million"));
  for (const value of [
    "141.6/77.1%",
    "138.5/80.1%",
    "134.7/82.3%",
    "134.5/83.2%",
  ]) {
    assert.ok(shortlist?.statement.includes(value));
  }
  for (const value of [
    "215.3 to 196.2",
    "152.1 to 141.7",
    "143.8 to 134.5",
    "138.8 to 132.4",
  ]) {
    assert.ok(perplexity?.statement.includes(value));
  }
  assert.ok(recognition?.statement.includes("46.3% to 45.8%"));
  assert.ok(recognition?.statement.includes("42.8% to 42.5%"));
  for (const value of ["119.1/76.8", "113.8/73.7", "118.5/76.4", "113.3/73.4"]) {
    assert.ok(recognition?.statement.includes(value));
  }
  assert.ok(evidenceBoundary?.statement.includes("about 47%"));
  const limitations = work?.limitations.join(" ") ?? "";
  for (const value of [
    "minus sign",
    "n=2",
    "265 hours",
    "46.6%",
    "0.5 percentage points",
    "0.3 percentage points",
    "4.9%",
    "4.6%",
  ]) {
    assert.ok(limitations.includes(value), `missing Schwenk boundary: ${value}`);
  }
  assert.equal(relationship?.connectionType, "extends");
  assert.equal(relationship?.evidenceClass, "documented-influence");
  assert.equal(relationship?.confidence, "high");
  assert.equal(relationship?.causalLanguage, "qualified");
  assert.deepEqual(relationship?.from, {
    kind: "work",
    id: "bengio-2000-neural-probabilistic-language-model",
  });
  assert.equal(
    relationship?.claimIds.some((claimId) => claimId.startsWith("bengio-2003-")),
    false,
  );
  for (const claimId of [
    "bengio-2000-conference-architecture-scaling",
    "bengio-2000-conference-shortlist-proposal",
    "bengio-2000-conference-recognition-lookup-proposal",
  ]) {
    assert.ok(relationship?.claimIds.includes(claimId));
    const claim = corpus.claims.find((item) => item.id === claimId);
    assert.ok(
      claim?.evidence.every(
        (evidence) => evidence.sourceId === "bengio-2000-neurips-full-text",
      ),
    );
  }
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains Mikolov 2010 as a bounded recurrent word-LM convergence milestone", () => {
  const work = corpus.works.find(
    (item) => item.id === "mikolov-2010-recurrent-neural-language-model",
  );
  const event = work?.chronology.events.find(
    (item) => item.id === "mikolov-2010-interspeech-conference",
  );
  const version = work?.versions.find(
    (item) => item.id === "mikolov-2010-interspeech-version",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "mikolov-2010-isca-full-text",
  );
  const claims = corpus.claims.filter((item) => item.workId === work?.id);
  const architecture = claims.find(
    (item) => item.id === "mikolov-2010-elman-recurrent-architecture",
  );
  const temporalBoundary = claims.find(
    (item) => item.id === "mikolov-2010-truncated-bptt-boundary",
  );
  const tableOne = claims.find(
    (item) => item.id === "mikolov-2010-wsj-scaling-results",
  );
  const tableTwo = claims.find(
    (item) => item.id === "mikolov-2010-wsj-ensemble-results",
  );
  const tableThree = claims.find(
    (item) => item.id === "mikolov-2010-wsj-cross-data-results",
  );
  const tableFour = claims.find(
    (item) => item.id === "mikolov-2010-rt05-evaluation-results",
  );
  const elmanRelationship = corpus.relationships.find(
    (item) => item.id === "elman-1988-to-mikolov-2010",
  );
  const bengioRelationship = corpus.relationships.find(
    (item) => item.id === "bengio-2000-to-mikolov-2010",
  );
  const schwenkRelationship = corpus.relationships.find(
    (item) =>
      item.from.id === "schwenk-gauvain-2002-connectionist-lvcsr" &&
      item.to.id === work?.id,
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.chronology.orderingEventId, event?.id);
  assert.equal(event?.date.value, "2010-09");
  assert.equal(event?.date.precision, "month");
  assert.equal(work?.versions.length, 1);
  assert.equal(work?.canonicalVersionId, version?.id);
  assert.deepEqual(version?.bibliography.pages, ["1045-1048"]);
  assert.ok(
    version?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "doi" &&
        identifier.value === "10.21437/Interspeech.2010-343",
    ),
  );
  assert.deepEqual(fullText?.pagination, {
    scheme: "printed",
    pageStart: 1045,
    pageEnd: 1048,
  });
  assert.ok(fullText?.accessNote.includes("16.3"));
  assert.ok(fullText?.accessNote.includes("footnote 4"));
  assert.equal(claims.length, 13);
  const visibleSections = new Set([
    "2. Model description",
    "2.1. Optimization",
    "3. WSJ experiments",
    "4. NIST RT05 experiments",
    "5. Conclusion and future work",
    "7. References",
  ]);
  const expectedClaimSections = new Map([
    ["mikolov-2010-fixed-window-motivation", ["2. Model description", "7. References"]],
    ["mikolov-2010-elman-recurrent-architecture", ["2. Model description", "7. References"]],
    ["mikolov-2010-training-objective", ["2. Model description"]],
    ["mikolov-2010-truncated-bptt-boundary", ["2. Model description"]],
    ["mikolov-2010-dynamic-adaptation", ["2. Model description", "3. WSJ experiments"]],
    ["mikolov-2010-rare-word-probability", ["2.1. Optimization"]],
    ["mikolov-2010-training-cost-comparison", ["2.1. Optimization"]],
    ["mikolov-2010-wsj-evaluation-scope", ["3. WSJ experiments"]],
    ["mikolov-2010-wsj-scaling-results", ["3. WSJ experiments"]],
    ["mikolov-2010-wsj-ensemble-results", ["3. WSJ experiments", "3. WSJ experiments"]],
    ["mikolov-2010-wsj-cross-data-results", ["3. WSJ experiments"]],
    ["mikolov-2010-rt05-evaluation-results", ["4. NIST RT05 experiments"]],
    ["mikolov-2010-long-context-and-evidence-boundary", ["5. Conclusion and future work"]],
  ]);
  for (const claim of claims) {
    assert.ok(claim.evidence.length > 0);
    for (const evidence of claim.evidence) {
      assert.equal(evidence.sourceId, fullText?.id);
      assert.ok(evidence.locator.pageStart >= 1045);
      assert.ok(evidence.locator.pageEnd <= 1048);
      assert.ok(
        visibleSections.has(evidence.locator.section),
        `${claim.id} must use an exact visible section heading`,
      );
    }
    assert.deepEqual(
      claim.evidence.map((evidence) => evidence.locator.section),
      expectedClaimSections.get(claim.id),
    );
  }
  assert.ok(architecture?.statement.includes("simple recurrent architecture"));
  assert.ok(architecture?.statement.includes("Elman"));
  assert.ok(temporalBoundary?.statement.includes("temporal depth of one"));
  for (const value of [
    "336/16.4%",
    "271/15.4%",
    "287/15.1%",
    "225/14.0%",
    "221/13.5%",
    "156/11.7%",
  ]) {
    assert.ok(tableOne?.statement.includes(value));
  }
  for (const value of [
    "229/13.2",
    "186/12.6",
    "202/12.8",
    "173/12.2",
    "173/12.3",
    "155/11.7",
    "176/12.0",
    "156/11.9",
    "171/12.5",
    "152/12.1",
    "151/11.6",
    "143/11.3",
    "128/11.3",
    "121/11.1",
  ]) {
    assert.ok(tableTwo?.statement.includes(value));
  }
  assert.ok(tableTwo?.limitations.join(" ").includes("221-to-112"));
  assert.ok(tableTwo?.limitations.join(" ").includes("49.3%"));
  for (const value of [
    "12.9%/18.4%",
    "12.2%/17.2%",
    "11.5%/16.9%",
    "16.7%",
    "11.0%/15.5%",
    "10.7%/16.3%",
  ]) {
    assert.ok(tableThree?.statement.includes(value));
  }
  assert.ok(tableThree?.limitations.join(" ").includes("not 16.34"));
  assert.ok(tableThree?.limitations.join(" ").includes("nonconsecutive"));
  assert.ok(tableThree?.limitations.join(" ").includes("probably"));
  for (const value of ["24.5%", "24.1%", "25.7%", "22.9%", "22.8%"]) {
    assert.ok(tableFour?.statement.includes(value));
  }
  assert.equal(elmanRelationship?.connectionType, "builds-on");
  assert.equal(elmanRelationship?.evidenceClass, "documented-influence");
  assert.equal(elmanRelationship?.causalLanguage, "qualified");
  assert.deepEqual(elmanRelationship?.from, {
    kind: "work",
    id: "elman-1988-finding-structure-in-time",
  });
  assert.equal(bengioRelationship?.connectionType, "addresses");
  assert.equal(bengioRelationship?.evidenceClass, "documented-influence");
  assert.equal(bengioRelationship?.causalLanguage, "qualified");
  assert.deepEqual(bengioRelationship?.from, {
    kind: "work",
    id: "bengio-2000-neural-probabilistic-language-model",
  });
  assert.ok(
    [...elmanRelationship.sourceEvidence, ...bengioRelationship.sourceEvidence]
      .every((evidence) => evidence.sourceId === fullText?.id),
  );
  assert.deepEqual(
    elmanRelationship?.sourceEvidence.map(
      (evidence) => evidence.locator.section,
    ),
    ["2. Model description; 7. References"],
  );
  assert.deepEqual(
    bengioRelationship?.sourceEvidence.map(
      (evidence) => evidence.locator.section,
    ),
    ["2. Model description; 7. References"],
  );
  assert.equal(schwenkRelationship, undefined);
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains the original, revised, and journal LSTM versions without transferring later gates", () => {
  const work = corpus.works.find(
    (item) =>
      item.id === "hochreiter-schmidhuber-1995-long-short-term-memory",
  );
  const originalVersion = work?.versions.find(
    (item) => item.id === "hochreiter-schmidhuber-1995-fki-report-version",
  );
  const revisedVersion = work?.versions.find(
    (item) => item.id === "hochreiter-schmidhuber-1996-fki-revised-version",
  );
  const journalVersion = work?.versions.find(
    (item) =>
      item.id === "hochreiter-schmidhuber-1997-neural-computation-version",
  );
  const originalEvent = work?.chronology.events.find(
    (item) => item.id === "hochreiter-schmidhuber-1995-fki-report",
  );
  const revisionEvent = work?.chronology.events.find(
    (item) => item.id === "hochreiter-schmidhuber-1996-report-revision",
  );
  const journalEvent = work?.chronology.events.find(
    (item) =>
      item.id === "hochreiter-schmidhuber-1997-journal-publication",
  );
  const originalText = corpus.sources.find(
    (item) => item.id === "hochreiter-schmidhuber-1995-author-original-scan",
  );
  const revisedText = corpus.sources.find(
    (item) => item.id === "hochreiter-schmidhuber-1995-jku-report-full-text",
  );
  const journalText = corpus.sources.find(
    (item) => item.id === "hochreiter-schmidhuber-1997-jku-journal-full-text",
  );
  const claims = corpus.claims.filter((item) => item.workId === work?.id);
  const longLag = claims.find(
    (item) =>
      item.id === "hochreiter-schmidhuber-1997-long-lag-experimental-scope",
  );
  const cellBoundary = claims.find(
    (item) =>
      item.id === "hochreiter-schmidhuber-1997-original-cell-domain-boundary",
  );
  const gradient = claims.find(
    (item) =>
      item.id === "hochreiter-schmidhuber-1997-vanishing-exploding-error",
  );
  const localRule = claims.find(
    (item) =>
      item.id ===
      "hochreiter-schmidhuber-1997-local-truncated-gradient-algorithm",
  );
  const elmanRelationship = corpus.relationships.find(
    (item) => item.id === "elman-1988-to-hochreiter-schmidhuber-1995",
  );
  const sundermeyerRelationship = corpus.relationships.find(
    (item) =>
      item.id === "hochreiter-schmidhuber-1995-to-sundermeyer-2012",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.versions.length, 3);
  assert.equal(work?.canonicalVersionId, journalVersion?.id);
  assert.equal(work?.chronology.orderingEventId, originalEvent?.id);
  assert.equal(originalEvent?.date.value, "1995-08-21");
  assert.equal(originalEvent?.versionId, originalVersion?.id);
  assert.equal(originalVersion?.title, "Long Short Term Memory");
  assert.equal(revisionEvent?.date.value, "1996-12");
  assert.equal(revisionEvent?.date.precision, "month");
  assert.equal(revisionEvent?.versionId, revisedVersion?.id);
  assert.equal(revisedVersion?.title, "Long Short-Term Memory");
  assert.equal(journalEvent?.date.value, "1997-11-15");
  assert.ok(
    journalEvent?.dateEvidence.some(
      (evidence) =>
        evidence.sourceId === "hochreiter-schmidhuber-1997-pubmed-record" &&
        evidence.precision === "day",
    ),
  );
  assert.ok(
    journalEvent?.dateEvidence.some(
      (evidence) =>
        evidence.sourceId === "hochreiter-schmidhuber-1997-crossref-record" &&
        evidence.precision === "month" &&
        evidence.locator.includes("conflicts at day precision"),
    ),
  );
  assert.deepEqual(originalText?.pagination, {
    scheme: "printed",
    pageStart: 1,
    pageEnd: 8,
  });
  assert.deepEqual(revisedText?.pagination, {
    scheme: "printed",
    pageStart: 1,
    pageEnd: 32,
  });
  assert.deepEqual(journalText?.pagination, {
    scheme: "printed",
    pageStart: 1,
    pageEnd: 32,
  });
  assert.ok(originalText?.accessNote.includes("12-leaf"));
  assert.ok(originalText?.accessNote.includes("rights notice"));
  assert.ok(revisedText?.accessNote.includes("version 3.0"));
  assert.ok(revisedText?.accessNote.includes("does not display"));
  assert.equal(claims.length, 6);
  for (const claim of claims) {
    assert.ok(claim.evidence.length > 0);
    assert.equal(
      claim.evidence.some((evidence) => evidence.sourceId === originalText?.id),
      false,
    );
    for (const evidence of claim.evidence) {
      assert.ok([revisedText?.id, journalText?.id].includes(evidence.sourceId));
      assert.ok(evidence.locator.pageStart >= 1);
      assert.ok(evidence.locator.pageEnd <= 32);
    }
  }
  assert.deepEqual(
    gradient?.evidence.map((evidence) => evidence.locator.section),
    [
      "3 CONSTANT ERROR BACKPROP",
      "1 INTRODUCTION; 2 CONSTANT ERROR BACKPROP",
    ],
  );
  assert.equal(
    localRule?.evidence[1].locator.section,
    "3 LONG SHORT-TERM MEMORY",
  );
  assert.deepEqual(
    localRule?.evidence[1].locator,
    {
      label: "Report version of the local learning rule",
      section: "3 LONG SHORT-TERM MEMORY",
      pageStart: 6,
      pageEnd: 8,
      paragraph: "Truncation rules and local update discussion",
    },
  );
  for (const value of [
    "minimal lag of 1,001",
    "20 trials for each reported",
    "49,000 for p=1,000",
    "49,000 for p=500",
    "75,000 for p=200",
    "135,000 for p=100",
    "203,000 for p=50",
  ]) {
    assert.ok(longLag?.statement.includes(value));
  }
  assert.equal(longLag?.evidence[0].locator.table, "3");
  assert.deepEqual(
    longLag?.evidence[0].locator,
    {
      label: "Thousand-step synthetic results",
      section:
        "5 EXPERIMENTS; 5.2 Experiment 2: Local, Distributed, Real-Valued Representations",
      pageStart: 14,
      pageEnd: 15,
      table: "3",
    },
  );
  assert.ok(cellBoundary?.statement.includes("no learned forget gate"));
  assert.ok(cellBoundary?.statement.includes("cell-state-to-gate"));
  assert.ok(
    cellBoundary?.evidence.some((evidence) =>
      evidence.support.includes(
        "predominantly positive or predominantly negative",
      ),
    ),
  );
  const boundaryLocations = cellBoundary?.evidence.map((evidence) => ({
    section: evidence.locator.section,
    pageStart: evidence.locator.pageStart,
    pageEnd: evidence.locator.pageEnd,
  }));
  assert.ok(
    boundaryLocations?.some(
      (location) =>
        location.section === "4 LONG SHORT-TERM MEMORY" &&
        location.pageStart === 6 &&
        location.pageEnd === 7,
    ),
  );
  assert.ok(
    boundaryLocations?.some(
      (location) =>
        location.section === "4 LONG SHORT-TERM MEMORY" &&
        location.pageStart === 9 &&
        location.pageEnd === 9,
    ),
  );
  assert.ok(
    boundaryLocations?.some(
      (location) =>
        location.section === "6 DISCUSSION" &&
        location.pageStart === 22 &&
        location.pageEnd === 23,
    ),
  );
  assert.equal(elmanRelationship?.connectionType, "addresses");
  assert.equal(elmanRelationship?.evidenceClass, "documented-influence");
  assert.equal(elmanRelationship?.causalLanguage, "qualified");
  assert.equal(sundermeyerRelationship?.connectionType, "builds-on");
  assert.equal(
    sundermeyerRelationship?.evidenceClass,
    "documented-influence",
  );
  assert.equal(sundermeyerRelationship?.causalLanguage, "qualified");
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains Sundermeyer 2012 as a composite-cell language-model convergence", () => {
  const work = corpus.works.find(
    (item) => item.id === "sundermeyer-2012-lstm-language-model",
  );
  const event = work?.chronology.events.find(
    (item) => item.id === "sundermeyer-2012-interspeech-conference",
  );
  const version = work?.versions.find(
    (item) => item.id === "sundermeyer-2012-interspeech-version",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "sundermeyer-2012-isca-full-text",
  );
  const rwthRecord = corpus.sources.find(
    (item) => item.id === "sundermeyer-2012-rwth-record",
  );
  const treebankRecord = corpus.sources.find(
    (item) => item.id === "sundermeyer-2012-ldc-treebank-record",
  );
  const claims = corpus.claims.filter((item) => item.workId === work?.id);
  const variant = claims.find(
    (item) => item.id === "sundermeyer-2012-lstm-antecedent-and-variant",
  );
  const mechanism = claims.find(
    (item) => item.id === "sundermeyer-2012-memory-cell-mechanism",
  );
  const inputNormalization = claims.find(
    (item) => item.id === "sundermeyer-2012-input-normalization",
  );
  const perplexity = claims.find(
    (item) => item.id === "sundermeyer-2012-rnn-lstm-perplexity",
  );
  const projection = claims.find(
    (item) => item.id === "sundermeyer-2012-projection-results",
  );
  const longContext = claims.find(
    (item) => item.id === "sundermeyer-2012-long-context-results",
  );
  const clustering = claims.find(
    (item) => item.id === "sundermeyer-2012-output-clustering-results",
  );
  const frenchSetup = claims.find(
    (item) => item.id === "sundermeyer-2012-french-asr-setup",
  );
  const frenchResults = claims.find(
    (item) => item.id === "sundermeyer-2012-french-wer-results",
  );
  const evidenceBoundary = claims.find(
    (item) =>
      item.id === "sundermeyer-2012-evidence-reproducibility-boundary",
  );
  const incoming = corpus.relationships.filter(
    (item) => item.to.id === work?.id,
  );
  const gatedIdea = corpus.ideas.find(
    (item) => item.id === "gated-recurrent-memory-access",
  );
  const modes = new Set(
    corpus.learningObjectives
      .filter((objective) => objective.workIds.includes(work?.id))
      .map((objective) => objective.mode),
  );
  const expertObjective = corpus.learningObjectives.find(
    (objective) => objective.id === "expert-sundermeyer-2012-model-and-evidence",
  );

  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.versions.length, 1);
  assert.equal(work?.canonicalVersionId, version?.id);
  assert.equal(event?.date.value, "2012-09");
  assert.equal(event?.date.precision, "month");
  assert.ok(event?.date.note.includes("9–13 September"));
  assert.deepEqual(version?.bibliography.pages, ["194-197"]);
  assert.ok(
    version?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "doi" &&
        identifier.value === "10.21437/Interspeech.2012-65",
    ),
  );
  assert.deepEqual(fullText?.pagination, {
    scheme: "printed",
    pageStart: 194,
    pageEnd: 197,
  });
  assert.ok(rwthRecord?.accessNote.includes("does not display"));
  assert.equal(treebankRecord?.url, "https://catalog.ldc.upenn.edu/LDC99T42");
  assert.ok(treebankRecord?.accessNote.includes("LDC user agreement"));
  assert.ok(work?.sourceIds.includes(treebankRecord?.id));
  assert.equal(claims.length, 15);
  const visibleSections = new Set([
    "1. Introduction",
    "1. Introduction; 2. LSTM neural networks",
    "2. LSTM neural networks",
    "3. Neural network language models",
    "3. Neural network language models; 4. Experimental results",
    "4. Experimental results",
    "5. Conclusions",
    "7. References",
  ]);
  for (const claim of claims) {
    assert.ok(claim.evidence.length > 0);
    for (const evidence of claim.evidence) {
      assert.equal(evidence.sourceId, fullText?.id);
      assert.ok(evidence.locator.pageStart >= 194);
      assert.ok(evidence.locator.pageEnd <= 197);
      assert.ok(
        visibleSections.has(evidence.locator.section),
        `${claim.id} must use exact printed section headings`,
      );
      assert.equal("equation" in evidence.locator, false);
    }
  }
  assert.ok(variant?.statement.includes("Hochreiter and Schmidhuber 1997"));
  assert.ok(variant?.statement.includes("references 12 and 13"));
  assert.ok(variant?.statement.includes("neither"));
  assert.ok(variant?.statement.includes("one-to-one"));
  assert.equal(mechanism?.evidence[0].locator.figure, "1");
  assert.ok(
    mechanism?.limitations.some((item) =>
      item.includes("explicitly omits the extensive LSTM equations"),
    ),
  );
  assert.deepEqual(inputNormalization?.ideaIds, [
    "recurrent-neural-word-language-modeling",
  ]);
  assert.ok(
    inputNormalization?.statement.includes("already lie between zero and one"),
  );
  assert.equal(
    inputNormalization?.statement.includes("restricting nonzero"),
    false,
  );
  assert.equal(perplexity?.evidence[0].locator.figure, "3(a)");
  assert.ok(perplexity?.statement.includes("about eight percent"));
  assert.ok(perplexity?.statement.includes("7.6 million"));
  assert.ok(perplexity?.statement.includes("3.0 million"));
  assert.ok(perplexity?.statement.includes("7.1-million-parameter"));
  assert.equal(projection?.evidence[0].locator.figure, "3(b)");
  assert.equal(longContext?.evidence[0].locator.figure, "3(c)");
  assert.ok(longContext?.statement.includes("one to two sentences"));
  assert.ok(longContext?.statement.includes("eventually worsen"));
  assert.equal(clustering?.evidence[0].locator.figure, "3(d)");
  assert.ok(
    clustering?.limitations.some((item) => item.includes("twenty times")),
  );
  assert.ok(frenchSetup?.statement.includes("1,000-best"));
  assert.ok(frenchSetup?.statement.includes("27 million"));
  assert.ok(frenchSetup?.statement.includes("more than four billion"));
  assert.equal(frenchSetup?.evidence[0].locator.pageEnd, 196);
  assert.ok(
    frenchSetup?.limitations.some((item) =>
      item.includes("complete acoustic-system specification"),
    ),
  );
  for (const value of ["19.7%", "17.6%", "19.2%", "17.3%", "0.5", "0.3"])
    assert.ok(frenchResults?.statement.includes(value));
  assert.equal(frenchResults?.evidence[0].locator.table, "2");
  assert.ok(
    evidenceBoundary?.statement.includes("without numeric point tables"),
  );
  assert.ok(evidenceBoundary?.statement.includes("repeated-run summaries"));
  assert.ok(evidenceBoundary?.statement.includes("development or test split"));
  assert.deepEqual(
    incoming.map((relationship) => relationship.id).sort(),
    [
      "hochreiter-schmidhuber-1995-to-sundermeyer-2012",
      "mikolov-2010-to-sundermeyer-2012",
    ],
  );
  for (const relationship of incoming) {
    assert.equal(relationship.connectionType, "builds-on");
    assert.equal(relationship.evidenceClass, "documented-influence");
    assert.equal(relationship.confidence, "high");
    assert.equal(relationship.causalLanguage, "qualified");
    assert.ok(
      relationship.sourceEvidence.every(
        (evidence) => evidence.sourceId === fullText?.id,
      ),
    );
  }
  assert.ok(
    gatedIdea?.description.includes(
      "later variants add a learned control over state retention",
    ),
  );
  assert.ok(
    expertObjective?.successCriterion.includes("modern reconstruction"),
  );
  assert.equal(
    expertObjective?.successCriterion.includes("equations 1–5"),
    false,
  );
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("rejects an unbound primary-work source without a version-boundary role", () => {
  const candidate = copyCorpus();
  const source = candidate.sources.find(
    (item) => item.id === "chen-goodman-1996-acl-boundary",
  );
  source.supports = source.supports.filter(
    (support) => support !== "version-boundary",
  );

  assertRejected(candidate, "primary work sources need a version binding");
});

test("rejects binding version-boundary evidence into the promoted version family", () => {
  const candidate = copyCorpus();
  const source = candidate.sources.find(
    (item) => item.id === "chen-goodman-1996-acl-boundary",
  );
  source.versionIds = ["chen-goodman-1998-technical-report-version"];

  assertRejected(
    candidate,
    "version-boundary sources must remain outside the work's version family",
  );
});

test("rejects version-boundary sources as promoted relationship evidence", () => {
  const candidate = copyCorpus();
  const relationship = candidate.relationships.find(
    (item) => item.id === "kneser-ney-1995-to-chen-goodman-1998",
  );
  relationship.sourceEvidence[0].sourceId =
    "chen-goodman-1996-acl-boundary";

  assertRejected(
    candidate,
    "cannot support promoted claims or relationships",
  );
});

test("rejects version-boundary sources as promoted claim evidence", () => {
  const candidate = copyCorpus();
  const source = candidate.sources.find(
    (item) => item.id === "chen-goodman-1996-acl-boundary",
  );
  const claim = candidate.claims.find(
    (item) => item.id === "chen-goodman-1998-interpolated-form",
  );
  source.supports.push("claim-location");
  source.pagination = {
    scheme: "printed",
    pageStart: 310,
    pageEnd: 318,
  };
  claim.evidence[0] = {
    sourceId: source.id,
    locator: {
      label: "Mutated boundary evidence",
      pageStart: 310,
      pageEnd: 310,
    },
    support: "Mutation fixture.",
  };

  assertRejected(
    candidate,
    "cannot support promoted claims or relationships",
  );
});

test("rejects version-boundary sources as promoted chronology evidence", () => {
  const candidate = copyCorpus();
  const work = candidate.works.find(
    (item) => item.id === "chen-goodman-1998-empirical-smoothing",
  );
  const event = work.chronology.events.find(
    (item) => item.id === "chen-goodman-1998-technical-report",
  );
  event.sourceIds = ["chen-goodman-1996-acl-boundary"];
  event.dateEvidence = [
    {
      sourceId: "chen-goodman-1996-acl-boundary",
      precision: "month",
      locator: "Mutation fixture",
    },
  ];

  assertRejected(
    candidate,
    "cannot establish chronology for the promoted version family",
  );
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

test("rejects reversed addresses and challenges edges", () => {
  for (const connectionType of ["addresses", "challenges"]) {
    const candidate = copyCorpus();
    const relationship = candidate.relationships.find(
      (item) => item.connectionType === "addresses",
    );
    assert.ok(relationship);
    relationship.connectionType = connectionType;
    [relationship.from, relationship.to] = [
      relationship.to,
      relationship.from,
    ];

    assertRejected(candidate, "must run from the earlier work to the later work");
  }
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

test("rejects PDF page positions as locators for an unpaginated manuscript", () => {
  const candidate = copyCorpus();
  const claim = candidate.claims.find(
    (item) => item.id === "bengio-bengio-2000-language-feature-bridge",
  );
  claim.evidence[0].locator.pageStart = 4;
  claim.evidence[0].locator.pageEnd = 4;

  assertRejected(
    candidate,
    "unpaginated PDF evidence must use stable structural anchors",
  );
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
  candidate.works
    .find((work) => work.id === "jelinek-1975-statistical-decoder")
    .versions[0].authors.reverse();

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
