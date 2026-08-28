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
const [readme, corpusFormat, historicalScope] = await Promise.all(
  [
    new URL("../README.md", import.meta.url),
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
  candidate.schemaVersion = "0.7.0";

  assertRejected(candidate, "must equal \"0.8.0\"");
});

test("keeps the documented corpus totals synchronized", () => {
  const versions = corpus.works.reduce(
    (total, work) => total + work.versions.length,
    0,
  );
  const summary = `${corpus.works.length} works, ${versions} versions, ${corpus.ideas.length} ideas, ${corpus.sources.length} sources, ${corpus.claims.length} claims, ${corpus.relationships.length} relationships, and ${corpus.learningObjectives.length} learning objectives`;

  assert.ok(corpusFormat.includes(`As of ${corpus.asOf}`));
  assert.ok(corpusFormat.includes(summary));
  assert.ok(
    readme.includes(
      `${summary.replace(" learning objectives", " beginner/expert learning objectives")}.`,
    ),
  );
});

test("preserves T5 paper, C4, and lineage boundaries", () => {
  const workId =
    "raffel-2019-exploring-limits-transfer-learning-unified-text-to-text-transformer";
  const work = corpus.works.find((item) => item.id === workId);
  const jmlr = work?.versions.find(
    (item) => item.id === "raffel-2020-jmlr-version",
  );
  const latest = work?.versions.find(
    (item) => item.id === "raffel-2023-arxiv-v4-version",
  );
  const canonicalText = corpus.sources.find(
    (item) => item.id === "raffel-2020-jmlr-full-text",
  );
  const launchTasks = corpus.sources.find(
    (item) => item.id === "raffel-2019-t5-launch-tasks",
  );
  const launchPreprocessors = corpus.sources.find(
    (item) => item.id === "raffel-2019-t5-launch-preprocessors",
  );
  const launchUtils = corpus.sources.find(
    (item) => item.id === "raffel-2019-t5-launch-utils",
  );
  const checksumSnapshot = corpus.sources.find(
    (item) => item.id === "raffel-2022-c4-input-checksums",
  );
  const currentC4 = corpus.sources.find(
    (item) => item.id === "raffel-2026-tfds-c4-catalog",
  );
  const relativePosition = corpus.claims.find(
    (item) => item.id === "raffel-2020-relative-position-bias",
  );
  const paperSentinel = corpus.claims.find(
    (item) => item.id === "raffel-2020-sentinel-denoising-objective",
  );
  const codeSentinel = corpus.claims.find(
    (item) => item.id === "raffel-2019-span-preprocessor-boundary",
  );
  const corpusClaim = corpus.claims.find(
    (item) =>
      item.id === "raffel-2020-c4-construction-and-launch-provenance",
  );
  const conflicts = corpus.claims.find(
    (item) => item.id === "raffel-2020-internal-table-conflicts",
  );
  const incoming = corpus.relationships.filter(
    (item) => item.to.kind === "work" && item.to.id === workId,
  );
  const objectives = corpus.learningObjectives.filter((item) =>
    item.workIds.includes(workId),
  );

  assert.equal(work?.chronology.orderingEventId, "raffel-2019-arxiv-v1-posted");
  assert.equal(work?.versions.length, 5);
  assert.equal(work?.canonicalVersionId, "raffel-2020-jmlr-version");
  assert.deepEqual(jmlr?.bibliography.pages, ["1-67"]);
  assert.equal(canonicalText?.pagination.scheme, "printed");
  assert.match(latest?.notes ?? "", /fewer than three sentences/);
  assert.match(latest?.notes ?? "", /fewer than five words/);
  assert.deepEqual(launchTasks?.versionIds, ["raffel-2019-arxiv-v1-version"]);
  assert.match(launchTasks?.accessNote ?? "", /c4\/en:1\.0\.0/);
  assert.doesNotMatch(launchPreprocessors?.accessNote ?? "", /EOS handling/);
  assert.deepEqual(launchUtils?.versionIds, ["raffel-2019-arxiv-v1-version"]);
  assert.match(launchUtils?.accessNote ?? "", /Task\.preprocess_tokens/);
  assert.match(launchUtils?.accessNote ?? "", /appends EOS=1/);
  assert.deepEqual(checksumSnapshot?.versionIds, []);
  assert.ok(checksumSnapshot?.supports.includes("version-boundary"));
  assert.match(checksumSnapshot?.url ?? "", /generation=1657619879665857/);
  assert.match(checksumSnapshot?.accessNote ?? "", /12 July 2022/);
  assert.deepEqual(currentC4?.versionIds, []);
  assert.ok(currentC4?.supports.includes("version-boundary"));
  assert.match(relativePosition?.statement ?? "", /self-attention logit/);
  assert.match(paperSentinel?.statement ?? "", /paper prose additionally requires/);
  assert.match(codeSentinel?.statement ?? "", /required by the paper text/);
  assert.ok(
    codeSentinel?.evidence.some(
      (item) => item.sourceId === "raffel-2019-t5-launch-utils",
    ),
  );
  assert.match(corpusClaim?.statement ?? "", /CC-MAIN-2019-18/);
  assert.match(conflicts?.statement ?? "", /82\.62\/18\.30\/79\.40/);
  assert.match(conflicts?.statement ?? "", /28\.57/);
  assert.match(conflicts?.statement ?? "", /28\.09/);
  assert.deepEqual(
    incoming.map((item) => item.id).sort(),
    ["devlin-2018-to-raffel-2019", "vaswani-2017-to-raffel-2019"],
  );
  assert.ok(
    !incoming
      .find((item) => item.id === "devlin-2018-to-raffel-2019")
      ?.claimIds.includes("devlin-2018-full-parameter-task-adaptation"),
  );
  assert.deepEqual(
    objectives.map((item) => item.mode).sort(),
    ["beginner", "expert"],
  );
  assert.ok(readme.includes("launch-time TFDS C4 1.0.0"));
  assert.ok(corpusFormat.includes("T5 is represented by arXiv versions 1–4"));
  assert.ok(historicalScope.includes("The T5 family was checked on 2026-08-28"));
});

test("accepts arXiv identifiers and rejects unknown identifier types", () => {
  const workId = "graves-2013-generating-sequences-recurrent-neural-networks";
  const versionId = "graves-2013-arxiv-v1-version";
  const arxivIdentifier = corpus.works
    .find((work) => work.id === workId)
    ?.versions.find((version) => version.id === versionId)
    ?.bibliography.identifiers.find(
      (identifier) => identifier.type === "arxiv",
    );
  const candidate = copyCorpus();
  const version = candidate.works
    .find((work) => work.id === workId)
    .versions.find((item) => item.id === versionId);
  const identifier = version.bibliography.identifiers.find(
    (item) => item.type === "arxiv",
  );

  assert.equal(arxivIdentifier?.value, "1308.0850v1");
  identifier.type = "preprint-id";
  assertRejected(candidate, "must be one of");
});

test("accepts preprints and rejects unsupported work artifact types", () => {
  const workId = "graves-2013-generating-sequences-recurrent-neural-networks";
  const work = corpus.works.find((item) => item.id === workId);
  const candidate = copyCorpus();
  const candidateWork = candidate.works.find((item) => item.id === workId);

  assert.equal(work?.artifactType, "preprint");
  candidateWork.artifactType = "working-paper";
  assertRejected(candidate, "must be one of");
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

test("retains the version-bound forget-gate bridge and journal results", () => {
  const work = corpus.works.find(
    (item) =>
      item.id === "gers-schmidhuber-cummins-1999-learning-to-forget",
  );
  const reportVersion = work?.versions.find(
    (item) =>
      item.id === "gers-schmidhuber-cummins-1999-idsia-report-version",
  );
  const proceedingsVersion = work?.versions.find(
    (item) => item.id === "gers-schmidhuber-cummins-1999-icann-version",
  );
  const journalVersion = work?.versions.find(
    (item) =>
      item.id ===
      "gers-schmidhuber-cummins-2000-neural-computation-version",
  );
  const reportEvent = work?.chronology.events.find(
    (item) => item.id === "gers-schmidhuber-cummins-1999-idsia-report",
  );
  const journalEvent = work?.chronology.events.find(
    (item) =>
      item.id === "gers-schmidhuber-cummins-2000-journal-publication",
  );
  const proceedingsText = corpus.sources.find(
    (item) => item.id === "gers-1999-icann-full-text",
  );
  const journalText = corpus.sources.find(
    (item) => item.id === "gers-2000-author-journal-full-text",
  );
  const mechanism = corpus.claims.find(
    (item) => item.id === "gers-2000-forget-gate-mechanism",
  );
  const cergResults = corpus.claims.find(
    (item) => item.id === "gers-2000-cerg-results",
  );
  const cntoResults = corpus.claims.find(
    (item) => item.id === "gers-2000-cnto-results",
  );
  const objectives = corpus.learningObjectives
    .filter((objective) => objective.workIds.includes(work?.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(
    work?.chronology.orderingEventId,
    "gers-schmidhuber-cummins-1999-idsia-report",
  );
  assert.deepEqual(
    work?.versions.map((version) => [version.id, version.kind]),
    [
      [
        "gers-schmidhuber-cummins-1999-idsia-report-version",
        "technical-report",
      ],
      ["gers-schmidhuber-cummins-1999-icann-version", "proceedings"],
      [
        "gers-schmidhuber-cummins-2000-neural-computation-version",
        "journal",
      ],
    ],
  );
  assert.equal(work?.canonicalVersionId, journalVersion?.id);
  assert.equal(reportEvent?.date.value, "1999-01-26");
  assert.equal(reportEvent?.versionId, reportVersion?.id);
  assert.equal(journalEvent?.date.value, "2000-10-01");
  assert.equal(journalEvent?.versionId, journalVersion?.id);
  assert.deepEqual(proceedingsVersion?.bibliography.pages, ["850-855"]);
  assert.ok(
    proceedingsVersion?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "doi" &&
        identifier.value === "10.1049/cp:19991218",
    ),
  );
  assert.deepEqual(journalVersion?.bibliography.pages, ["2451-2471"]);
  assert.ok(
    journalVersion?.bibliography.identifiers.some(
      (identifier) =>
        identifier.type === "doi" &&
        identifier.value === "10.1162/089976600300015015",
    ),
  );
  assert.deepEqual(proceedingsText?.pagination, {
    scheme: "printed",
    pageStart: 850,
    pageEnd: 855,
  });
  assert.deepEqual(journalText?.pagination, {
    scheme: "printed",
    pageStart: 1,
    pageEnd: 19,
  });
  assert.deepEqual(mechanism?.evidence[0].locator, {
    label: "Adaptive forget-gate recurrence",
    section:
      "3 Solution: Forget Gates; 3.1 Forward Pass of Extended LSTM with Forget Gates",
    pageStart: 5,
    pageEnd: 5,
    equation: "6–7",
    figure: "1",
  });
  assert.deepEqual(cergResults?.evidence[0].locator, {
    label: "Continual embedded-Reber results",
    section: "4.3 CERG Results",
    pageStart: 12,
    pageEnd: 12,
    table: "2",
  });
  for (const value of [
    "74%",
    "7,441",
    "18%",
    "18,889",
    "29%",
    "62%",
    "14,087",
    "6%",
  ]) {
    assert.ok(cergResults?.statement.includes(value));
  }
  assert.deepEqual(cntoResults?.evidence[0].locator, {
    label: "Continual noisy temporal-order results",
    section: "4.5 Continual Noisy Temporal Order Problem",
    pageStart: 15,
    pageEnd: 16,
    table: "3",
  });
  for (const value of [
    "4.6",
    "24%",
    "18,077",
    "12.2",
    "37%",
    "22,654",
    "11.8",
    "1,000",
  ]) {
    assert.ok(cntoResults?.statement.includes(value));
  }
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-gers-1999-adaptive-forgetting",
      "expert-gers-1999-mechanism-versions-and-evidence",
    ],
  );
  assert.deepEqual(
    objectives.map((objective) => objective.mode),
    ["beginner", "expert"],
  );
  assert.ok(objectives[1]?.successCriterion.includes("Table 2 and Table 3"));
  assert.ok(objectives[1]?.successCriterion.includes("424-weight"));
});

test("retains the peephole timing evidence without promoting the deleted DOI", () => {
  const work = corpus.works.find(
    (item) => item.id === "gers-schraudolph-schmidhuber-2002-precise-timing",
  );
  const version = work?.versions.find(
    (item) => item.id === "gers-schraudolph-schmidhuber-2002-jmlr-version",
  );
  const event = work?.chronology.events.find(
    (item) =>
      item.id === "gers-schraudolph-schmidhuber-2002-journal-publication",
  );
  const fullText = corpus.sources.find(
    (item) => item.id === "gers-2002-jmlr-full-text",
  );
  const deletedDoi = corpus.sources.find(
    (item) => item.id === "gers-2002-crossref-deleted-doi",
  );
  const mechanism = corpus.claims.find(
    (item) => item.id === "gers-2002-peephole-mechanism",
  );
  const timedSpikes = corpus.claims.find(
    (item) => item.id === "gers-2002-gts-results-and-ablation",
  );
  const periodicGeneration = corpus.claims.find(
    (item) => item.id === "gers-2002-pfg-results",
  );
  const objectives = corpus.learningObjectives
    .filter((objective) => objective.workIds.includes(work?.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.versions.length, 1);
  assert.equal(work?.canonicalVersionId, version?.id);
  assert.equal(event?.date.value, "2002-08");
  assert.equal(event?.date.precision, "month");
  assert.equal(event?.versionId, version?.id);
  assert.deepEqual(version?.bibliography.pages, ["115-143"]);
  assert.equal(
    version?.bibliography.identifiers.some(
      (identifier) => identifier.type === "doi",
    ),
    false,
  );
  assert.deepEqual(fullText?.pagination, {
    scheme: "printed",
    pageStart: 115,
    pageEnd: 143,
  });
  assert.ok(work?.sourceIds.includes(deletedDoi?.id));
  assert.equal(version?.sourceIds.includes(deletedDoi?.id), false);
  assert.deepEqual(deletedDoi?.versionIds, []);
  assert.deepEqual(deletedDoi?.supports, ["metadata", "version-boundary"]);
  assert.ok(deletedDoi?.title.includes("10.1162/153244303768966139"));
  assert.ok(
    deletedDoi?.accessNote.includes("being displayed as active metadata"),
  );
  assert.deepEqual(mechanism?.evidence[0].locator, {
    label: "Peephole equations and update order",
    section:
      "3. Extending LSTM with Peephole Connections; 3.1 Modified Forward Pass for Peephole LSTM",
    pageStart: 122,
    pageEnd: 122,
    equation: "19–21",
    paragraph: "Ordered forward-pass description",
  });
  assert.deepEqual(timedSpikes?.evidence[0].locator, {
    label: "Generated timed spikes and forget-gate ablation",
    section: "4.3 Generating Timed Spikes (GTS)",
    pageStart: 128,
    pageEnd: 132,
    figure: "7",
  });
  for (const value of [
    "100%, 100%, 80%, 100%, and 100%",
    "50% for delays {0,1}",
    "30% for {0,1,2}",
    "training from scratch without that gate never succeeds",
  ]) {
    assert.ok(timedSpikes?.statement.includes(value));
  }
  assert.deepEqual(periodicGeneration?.evidence[0].locator, {
    label: "Periodic-function generation results",
    section: "4.4 Periodic Function Generation (PFG)",
    pageStart: 131,
    pageEnd: 134,
    table: "3",
  });
  for (const value of [
    "90/100",
    "0/60",
    "0/100",
    "0/50",
    "0/80",
    "0/20",
  ]) {
    assert.ok(periodicGeneration?.statement.includes(value));
  }
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-gers-2002-peephole-timing",
      "expert-gers-2002-peephole-mechanism-and-evidence",
    ],
  );
  assert.deepEqual(
    objectives.map((objective) => objective.mode),
    ["beginner", "expert"],
  );
  assert.ok(objectives[1]?.successCriterion.includes("Figure 7"));
  assert.ok(objectives[1]?.successCriterion.includes("deleted Crossref DOI"));
});

test("retains four documented recurrent-memory lineage edges", () => {
  const expectedEdges = [
    {
      id: "hochreiter-schmidhuber-1995-to-gers-1999",
      from: "hochreiter-schmidhuber-1995-long-short-term-memory",
      to: "gers-schmidhuber-cummins-1999-learning-to-forget",
      connectionType: "extends",
      sourceIds: ["gers-2000-author-journal-full-text"],
    },
    {
      id: "gers-1999-to-gers-2002",
      from: "gers-schmidhuber-cummins-1999-learning-to-forget",
      to: "gers-schraudolph-schmidhuber-2002-precise-timing",
      connectionType: "extends",
      sourceIds: ["gers-2002-jmlr-full-text"],
    },
    {
      id: "gers-1999-to-sundermeyer-2012",
      from: "gers-schmidhuber-cummins-1999-learning-to-forget",
      to: "sundermeyer-2012-lstm-language-model",
      connectionType: "builds-on",
      sourceIds: [
        "sundermeyer-2012-isca-full-text",
        "gers-1999-icann-full-text",
      ],
    },
    {
      id: "gers-2002-to-sundermeyer-2012",
      from: "gers-schraudolph-schmidhuber-2002-precise-timing",
      to: "sundermeyer-2012-lstm-language-model",
      connectionType: "builds-on",
      sourceIds: [
        "sundermeyer-2012-isca-full-text",
        "gers-2002-jmlr-full-text",
      ],
    },
  ];

  for (const expected of expectedEdges) {
    const relationship = corpus.relationships.find(
      (item) => item.id === expected.id,
    );

    assert.deepEqual(relationship?.from, { kind: "work", id: expected.from });
    assert.deepEqual(relationship?.to, { kind: "work", id: expected.to });
    assert.equal(relationship?.connectionType, expected.connectionType);
    assert.equal(relationship?.evidenceClass, "documented-influence");
    assert.equal(relationship?.confidence, "high");
    assert.equal(relationship?.causalLanguage, "qualified");
    assert.deepEqual(
      relationship?.sourceEvidence.map((evidence) => evidence.sourceId),
      expected.sourceIds,
    );
  }
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
  const forgetText = corpus.sources.find(
    (item) => item.id === "gers-1999-icann-full-text",
  );
  const peepholeText = corpus.sources.find(
    (item) => item.id === "gers-2002-jmlr-full-text",
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
    if (claim.id === variant?.id) {
      assert.deepEqual(
        claim.evidence.map((evidence) => evidence.sourceId),
        [fullText?.id, fullText?.id, forgetText?.id, peepholeText?.id],
      );
      continue;
    }
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
  assert.ok(
    variant?.statement.includes(
      "reference 12 to the adaptive forget gate and reference 13 to weighted cell-state-to-gate peephole connections",
    ),
  );
  assert.equal(variant?.directness, "editorial-inference");
  assert.deepEqual(variant?.ideaIds, [
    "constant-error-recurrent-memory",
    "gated-recurrent-memory-access",
    "adaptive-recurrent-state-retention",
    "cell-state-to-gate-feedback",
  ]);
  assert.deepEqual(variant?.evidence[2].locator, {
    label: "Reference 12 title page and forget-gate mechanism",
    section: "3 Solution: Forget Gates",
    pageStart: 850,
    pageEnd: 852,
    equation: "6–7",
  });
  assert.deepEqual(variant?.evidence[3].locator, {
    label: "Reference 13 title page and peephole mechanism",
    section:
      "3. Extending LSTM with Peephole Connections; 3.1 Modified Forward Pass for Peephole LSTM",
    pageStart: 115,
    pageEnd: 123,
    equation: "19–21",
  });
  assert.ok(
    variant?.limitations.some((item) =>
      item.includes("one-to-one correspondence is an editorial inference"),
    ),
  );
  assert.deepEqual(variant?.uncertainties.map((item) => item.status), [
    "resolved",
  ]);
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
      "gers-1999-to-sundermeyer-2012",
      "gers-2002-to-sundermeyer-2012",
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
      relationship.sourceEvidence.some(
        (evidence) => evidence.sourceId === fullText?.id,
      ),
    );
    assert.ok(
      relationship.sourceEvidence.every((evidence) =>
        [fullText?.id, forgetText?.id, peepholeText?.id].includes(
          evidence.sourceId,
        ),
      ),
    );
  }
  assert.ok(
    gatedIdea?.description.includes(
      "distinct gate and feedback mechanisms remain separately traceable",
    ),
  );
  assert.ok(
    expertObjective?.successCriterion.includes(
      "map reference 12 only to adaptive forgetting and reference 13 only to cell-state-to-gate peepholes",
    ),
  );
  assert.equal(
    expertObjective?.successCriterion.includes("equations 1–5"),
    false,
  );
  assert.deepEqual(modes, new Set(["beginner", "expert"]));
});

test("retains Graves 2013 as a versioned monotonic-window generation branch", () => {
  const workId = "graves-2013-generating-sequences-recurrent-neural-networks";
  const work = corpus.works.find((item) => item.id === workId);
  const versions = new Map(
    work?.versions.map((version) => [version.id, version]),
  );
  const claims = corpus.claims.filter((claim) => claim.workId === workId);
  const claimsById = new Map(claims.map((claim) => [claim.id, claim]));
  const arxivRecord = corpus.sources.find(
    (source) => source.id === "graves-2013-arxiv-record",
  );
  const canonicalText = corpus.sources.find(
    (source) => source.id === "graves-2013-arxiv-v5-full-text",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(workId),
  );
  const relationships = new Map(
    corpus.relationships
      .filter((relationship) =>
        [
          "gers-2002-to-graves-2013",
          "graves-2013-to-bahdanau-2014",
          "graves-2013-to-sutskever-2014",
        ].includes(relationship.id),
      )
      .map((relationship) => [relationship.id, relationship]),
  );
  const equationBoundary = claimsById.get(
    "graves-2013-window-equation-version-boundary",
  );
  const windowMechanism = claimsById.get(
    "graves-2013-monotonic-window-mechanism",
  );

  assert.equal(work?.artifactType, "preprint");
  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.inclusion.confidence, "high");
  assert.equal(
    work?.canonicalVersionId,
    "graves-2013-arxiv-v5-version",
  );
  assert.deepEqual(work?.authors, ["Alex Graves"]);
  assert.equal(work?.versions.length, 5);
  assert.equal(
    work?.chronology.orderingEventId,
    "graves-2013-arxiv-v1-posted",
  );
  assert.deepEqual(
    work?.chronology.events.map((event) => [
      event.id,
      event.kind,
      event.date.value,
      event.date.precision,
      event.versionId,
    ]),
    [
      [
        "graves-2013-arxiv-v1-posted",
        "preprint",
        "2013-08-04",
        "day",
        "graves-2013-arxiv-v1-version",
      ],
      [
        "graves-2013-arxiv-v2-posted",
        "manuscript-revised",
        "2013-08-11",
        "day",
        "graves-2013-arxiv-v2-version",
      ],
      [
        "graves-2013-arxiv-v3-posted",
        "manuscript-revised",
        "2014-02-21",
        "day",
        "graves-2013-arxiv-v3-version",
      ],
      [
        "graves-2013-arxiv-v4-posted",
        "manuscript-revised",
        "2014-04-02",
        "day",
        "graves-2013-arxiv-v4-version",
      ],
      [
        "graves-2013-arxiv-v5-posted",
        "manuscript-revised",
        "2014-06-05",
        "day",
        "graves-2013-arxiv-v5-version",
      ],
    ],
  );
  assert.deepEqual(
    work?.versions.map((version) => [
      version.id,
      version.kind,
      version.bibliography.identifiers.find(
        (identifier) => identifier.type === "arxiv",
      )?.value,
    ]),
    [
      ["graves-2013-arxiv-v1-version", "preprint", "1308.0850v1"],
      ["graves-2013-arxiv-v2-version", "preprint", "1308.0850v2"],
      ["graves-2013-arxiv-v3-version", "preprint", "1308.0850v3"],
      ["graves-2013-arxiv-v4-version", "preprint", "1308.0850v4"],
      ["graves-2013-arxiv-v5-version", "preprint", "1308.0850v5"],
    ],
  );
  assert.ok(
    versions
      .get("graves-2013-arxiv-v1-version")
      ?.notes.includes("already contains"),
  );
  assert.ok(
    versions
      .get("graves-2013-arxiv-v3-version")
      ?.notes.includes("bivariate Gaussian exponent"),
  );
  assert.ok(
    versions
      .get("graves-2013-arxiv-v3-version")
      ?.notes.includes("prose example"),
  );
  assert.ok(
    versions
      .get("graves-2013-arxiv-v3-version")
      ?.notes.includes("from Wsi to Wci"),
  );
  assert.ok(
    versions
      .get("graves-2013-arxiv-v4-version")
      ?.notes.includes("still lacks the alpha factor"),
  );
  assert.ok(
    versions
      .get("graves-2013-arxiv-v5-version")
      ?.notes.includes("completes the alpha factor"),
  );
  assert.deepEqual(
    arxivRecord?.versionIds,
    work?.versions.map((version) => version.id),
  );
  assert.deepEqual(arxivRecord?.supports, ["metadata"]);
  assert.deepEqual(canonicalText?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 43,
  });

  assert.deepEqual(work?.ideaIds, [
    "next-item-prediction-training",
    "adaptive-recurrent-state-retention",
    "cell-state-to-gate-feedback",
    "character-level-recurrent-sequence-generation",
    "mixture-density-handwriting-generation",
    "monotonic-gaussian-mixture-sequence-window",
  ]);
  assert.deepEqual(
    claims.map((claim) => claim.id),
    [
      "graves-2013-recurrent-sequence-generation-objective",
      "graves-2013-lstm-formulation",
      "graves-2013-deep-recurrent-architecture",
      "graves-2013-text-prediction-objective",
      "graves-2013-text-data-and-results",
      "graves-2013-text-sampling-boundary",
      "graves-2013-handwriting-mixture-density-output",
      "graves-2013-handwriting-data-and-preprocessing",
      "graves-2013-unconditional-handwriting-results",
      "graves-2013-monotonic-window-mechanism",
      "graves-2013-conditional-handwriting-objective",
      "graves-2013-conditional-handwriting-results",
      "graves-2013-window-terminology-boundary",
      "graves-2013-evidence-reproducibility-boundary",
      "graves-2013-window-equation-version-boundary",
    ],
  );
  for (const value of ["1.24", "122", "1.23", "117", "1.33"]) {
    assert.ok(
      claimsById.get("graves-2013-text-data-and-results")?.statement.includes(
        value,
      ),
    );
  }
  assert.ok(
    claimsById
      .get("graves-2013-text-data-and-results")
      ?.statement.includes("seven-layer byte-level model"),
  );
  assert.ok(
    claimsById
      .get("graves-2013-text-data-and-results")
      ?.evidence.some(
        (item) => item.locator.section === "3.1 Penn Treebank Experiments",
      ),
  );
  assert.deepEqual(
    claimsById
      .get("graves-2013-recurrent-sequence-generation-objective")
      ?.evidence.map((item) => [
        item.locator.section,
        item.locator.pageStart,
        item.locator.pageEnd,
      ]),
    [
      ["2 Prediction Network", 3, 4],
      ["1 Introduction", 1, 1],
    ],
  );
  const architecture = claimsById.get(
    "graves-2013-deep-recurrent-architecture",
  );
  for (const route of [
    "input to every hidden layer",
    "between adjacent hidden layers",
    "recurrently within each hidden layer",
    "from every hidden layer to the output",
  ]) {
    assert.ok(architecture?.statement.includes(route));
  }
  assert.ok(architecture?.statement.includes("without a direct input-to-output"));
  assert.equal(
    architecture?.evidence[0]?.locator.section,
    "2 Prediction Network",
  );

  const handwritingData = claimsById.get(
    "graves-2013-handwriting-data-and-preprocessing",
  );
  for (const value of [
    "5,364-line training set",
    "3,859-line test set",
    "1,518-line larger validation set",
    "1,438-line smaller validation set",
  ]) {
    assert.ok(
      handwritingData?.statement.includes(value),
    );
  }
  assert.ok(handwritingData?.statement.includes("interpolate missing coordinate readings"));
  assert.ok(handwritingData?.statement.includes("remove steps longer than a threshold"));
  assert.ok(
    handwritingData?.evidence.some(
      (item) =>
        item.locator.section === "4.2 Experiments" &&
        item.locator.pageStart === 23 &&
        item.support.includes("offset from the previous point"),
    ),
  );
  assert.ok(
    claimsById
      .get("graves-2013-handwriting-mixture-density-output")
      ?.statement.includes("20-component mixture"),
  );
  assert.ok(
    claimsById
      .get("graves-2013-handwriting-mixture-density-output")
      ?.evidence.some(
        (item) =>
          item.locator.section === "4.2 Experiments" &&
          item.locator.pageStart === 23 &&
          item.support.includes("20 mixture components"),
      ),
  );
  for (const value of ["−1096.9", "−1128.2", "31.3-nat", "44%"])
    assert.ok(
      claimsById
        .get("graves-2013-conditional-handwriting-results")
        ?.statement.includes(value),
    );
  assert.ok(windowMechanism?.statement.includes("ten Gaussian windows"));
  assert.ok(windowMechanism?.statement.includes("κₜ = κₜ₋₁ + exp(κ̂ₜ)"));
  assert.ok(
    windowMechanism?.evidence.some(
      (item) =>
        item.locator.section === "5.2 Experiments" &&
        item.locator.pageStart === 31 &&
        item.support.includes("10 Gaussian functions"),
    ),
  );
  assert.ok(
    windowMechanism?.limitations.some((item) =>
      item.includes("prevents backward or arbitrary source traversal"),
    ),
  );
  assert.ok(
    claimsById
      .get("graves-2013-window-terminology-boundary")
      ?.statement.includes("never uses the word attention"),
  );
  assert.deepEqual(
    claimsById
      .get("graves-2013-window-terminology-boundary")
      ?.evidence.map((item) => [
        item.locator.section,
        item.locator.pageStart,
        item.locator.pageEnd,
      ]),
    [
      ["5 Handwriting Synthesis; 5.1 Synthesis Network", 24, 27],
      ["6 Conclusions and Future Work", 34, 34],
      ["Complete article", 1, 43],
    ],
  );
  assert.ok(
    claimsById
      .get("graves-2013-evidence-reproducibility-boundary")
      ?.statement.includes("no released training code"),
  );
  const evidenceBoundary = claimsById.get(
    "graves-2013-evidence-reproducibility-boundary",
  );
  assert.ok(evidenceBoundary?.statement.includes("blind taste tests"));
  assert.ok(evidenceBoundary?.statement.includes("only Figure 18's primed samples"));
  assert.deepEqual(
    evidenceBoundary?.evidence.slice(1).map((item) => [
      item.locator.section,
      item.locator.pageStart,
      item.locator.figure ?? null,
    ]),
    [
      ["5.3 Unbiased Sampling", 32, null],
      ["5.5 Primed Sampling", 37, "18"],
    ],
  );
  assert.ok(
    work?.limitations.some(
      (item) =>
        item.includes("31.3-nat") &&
        item.includes("measures regularization rather than the window") &&
        item.includes("separate 44%"),
    ),
  );

  assert.equal(
    equationBoundary?.statement,
    "The monotonic window exists in version 1, but the printed derivation changes across revisions: version 3 still has the earlier equations 56–60, version 4 corrects their component indexing and Gaussian factors, and version 5 adds αₜᵏ inside εₜᵏ and removes the duplicate external factor from the next equation.",
  );
  assert.deepEqual(
    equationBoundary?.evidence.map((evidence) => [
      evidence.sourceId,
      evidence.locator.equation,
      evidence.locator.pageStart ?? null,
    ]),
    [
      ["graves-2013-arxiv-v1-full-text", "46–51", null],
      ["graves-2013-arxiv-v3-full-text", "56–60", null],
      ["graves-2013-arxiv-v4-full-text", "56–60", null],
      ["graves-2013-arxiv-v5-full-text", "56–60", 29],
    ],
  );
  assert.ok(
    equationBoundary?.limitations.includes(
      "Later corrections are used for reconstruction but are not treated as part of the first-posted formula.",
    ),
  );

  assert.deepEqual(
    objectives.map((objective) => [objective.id, objective.mode]),
    [
      ["beginner-graves-2013-follow-the-writing-window", "beginner"],
      ["expert-graves-2013-window-density-and-evidence", "expert"],
    ],
  );
  assert.ok(
    objectives[0]?.successCriterion.includes(
      "positive location increments forbid looking backward",
    ),
  );
  assert.ok(
    objectives[0]?.successCriterion.includes(
      "qualitative rather than controlled",
    ),
  );
  assert.ok(objectives[1]?.successCriterion.includes("equations 1–14"));
  assert.ok(objectives[1]?.successCriterion.includes("v3, v4, and v5"));
  assert.ok(objectives[1]?.successCriterion.includes("reused test partition"));

  const gersEdge = relationships.get("gers-2002-to-graves-2013");
  const bahdanauEdge = relationships.get("graves-2013-to-bahdanau-2014");
  const sutskeverEdge = relationships.get("graves-2013-to-sutskever-2014");
  assert.equal(relationships.size, 3);
  for (const relationship of relationships.values()) {
    assert.equal(relationship.evidenceClass, "documented-influence");
    assert.equal(relationship.confidence, "high");
  }
  assert.deepEqual(gersEdge?.from, {
    kind: "work",
    id: "gers-schraudolph-schmidhuber-2002-precise-timing",
  });
  assert.deepEqual(gersEdge?.to, { kind: "work", id: workId });
  assert.equal(gersEdge?.connectionType, "builds-on");
  assert.equal(gersEdge?.causalLanguage, "qualified");
  assert.deepEqual(
    gersEdge?.sourceEvidence.map((evidence) => evidence.sourceId),
    ["graves-2013-arxiv-v5-full-text"],
  );
  assert.ok(gersEdge?.rationale.includes("composite recurrent-cell formulation"));
  assert.ok(gersEdge?.rationale.includes("does not transfer"));

  assert.deepEqual(bahdanauEdge?.from, { kind: "work", id: workId });
  assert.deepEqual(bahdanauEdge?.to, {
    kind: "work",
    id: "bahdanau-cho-bengio-2014-neural-machine-translation",
  });
  assert.equal(bahdanauEdge?.connectionType, "addresses");
  assert.equal(bahdanauEdge?.causalLanguage, "prohibited");
  assert.deepEqual(
    bahdanauEdge?.sourceEvidence.map((evidence) => evidence.sourceId),
    [
      "bahdanau-2014-arxiv-v1-full-text",
      "bahdanau-2014-arxiv-v7-full-text",
    ],
  );
  assert.ok(bahdanauEdge?.rationale.includes("technical comparison"));
  assert.ok(bahdanauEdge?.rationale.includes("functional contrast"));
  assert.ok(
    bahdanauEdge?.rationale.includes(
      "does not claim motivation, derivation, inspiration",
    ),
  );

  assert.deepEqual(sutskeverEdge?.from, { kind: "work", id: workId });
  assert.deepEqual(sutskeverEdge?.to, {
    kind: "work",
    id: "sutskever-vinyals-le-2014-sequence-to-sequence",
  });
  assert.equal(sutskeverEdge?.connectionType, "builds-on");
  assert.equal(sutskeverEdge?.causalLanguage, "qualified");
  assert.deepEqual(
    sutskeverEdge?.sourceEvidence.map((evidence) => evidence.sourceId),
    ["sutskever-2014-neurips-full-text"],
  );
  assert.ok(sutskeverEdge?.rationale.includes("implemented recurrent cell"));
  assert.ok(
    sutskeverEdge?.rationale.includes(
      "does not transfer Graves’s handwriting window",
    ),
  );
});

test("retains Cho 2014 as a versioned phrase-scoring encoder-decoder branch", () => {
  const work = corpus.works.find(
    (item) => item.id === "cho-2014-rnn-encoder-decoder",
  );
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const results = claims.find((claim) => claim.id === "cho-2014-bleu-results");
  const equationBoundary = claims.find(
    (claim) => claim.id === "cho-2014-reset-equation-version-boundary",
  );
  const fixedVectorBoundary = claims.find(
    (claim) => claim.id === "cho-2014-fixed-vector-evidence-boundary",
  );
  const fullText = corpus.sources.find(
    (source) => source.id === "cho-2014-acl-full-text",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );

  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "cho-2014-emnlp-version");
  assert.equal(work?.versions.length, 4);
  assert.deepEqual(work?.authors, [
    "Kyunghyun Cho",
    "Bart van Merriënboer",
    "Caglar Gulcehre",
    "Dzmitry Bahdanau",
    "Fethi Bougares",
    "Holger Schwenk",
    "Yoshua Bengio",
  ]);
  assert.deepEqual(
    work?.chronology.events.map((event) => [
      event.id,
      event.date.value,
      event.date.precision,
    ]),
    [
      ["cho-2014-arxiv-v1-posted", "2014-06-03", "day"],
      ["cho-2014-arxiv-v2-posted", "2014-07-24", "day"],
      ["cho-2014-arxiv-v3-posted", "2014-09-03", "day"],
      ["cho-2014-emnlp-conference", "2014-10", "month"],
    ],
  );
  assert.equal(work?.chronology.orderingEventId, "cho-2014-arxiv-v1-posted");
  assert.ok(
    work?.chronology.events[3].date.note.includes("25–29 October"),
  );
  assert.equal(versions.get("cho-2014-arxiv-v1-version")?.authors.length, 6);
  assert.equal(versions.get("cho-2014-arxiv-v2-version")?.authors.length, 6);
  assert.equal(versions.get("cho-2014-arxiv-v3-version")?.authors.length, 7);
  assert.deepEqual(
    versions.get("cho-2014-emnlp-version")?.authors,
    work?.authors,
  );
  assert.deepEqual(
    versions.get("cho-2014-emnlp-version")?.bibliography.pages,
    ["1724-1734"],
  );
  assert.ok(
    versions
      .get("cho-2014-emnlp-version")
      ?.bibliography.identifiers.some(
        (identifier) =>
          identifier.type === "doi" &&
          identifier.value === "10.3115/v1/D14-1179",
      ),
  );
  for (const version of work?.versions ?? []) {
    for (const sourceId of version.sourceIds) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      assert.ok(source?.relatedWorkIds.includes(work.id));
      assert.ok(source?.versionIds.includes(version.id));
    }
  }
  assert.deepEqual(fullText?.pagination, {
    scheme: "printed",
    pageStart: 1724,
    pageEnd: 1734,
  });
  assert.equal(claims.length, 14);
  for (const value of [
    "30.64/33.30",
    "31.20/33.87",
    "31.48/34.64",
    "31.50/34.54",
  ]) {
    assert.ok(results?.statement.includes(value));
  }
  assert.ok(results?.statement.indexOf("34.64") < results?.statement.indexOf("34.54"));
  assert.ok(equationBoundary?.statement.includes("before the recurrent matrix U"));
  assert.ok(equationBoundary?.statement.includes("official attachment"));
  assert.ok(fixedVectorBoundary?.statement.includes("architectural constraint"));
  assert.ok(fixedVectorBoundary?.statement.includes("not evidence"));
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-cho-2014-encode-score-and-gate",
      "expert-cho-2014-versions-objective-and-evidence",
    ],
  );
  assert.deepEqual(
    objectives.map((objective) => objective.mode),
    ["beginner", "expert"],
  );
  assert.ok(objectives[0]?.successCriterion.includes("phrase-table feature"));
  assert.ok(objectives[1]?.successCriterion.includes("six-author metadata"));
});

test("retains Bahdanau 2014/2015 as a versioned attention branch", () => {
  const work = corpus.works.find(
    (item) =>
      item.id === "bahdanau-cho-bengio-2014-neural-machine-translation",
  );
  const versions = new Map(
    work?.versions.map((version) => [version.id, version]),
  );
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const results = claims.find(
    (claim) => claim.id === "bahdanau-2014-bleu-results",
  );
  const length = claims.find(
    (claim) => claim.id === "bahdanau-2014-length-results",
  );
  const alignment = claims.find(
    (claim) =>
      claim.id === "bahdanau-2014-soft-alignment-interpretation-boundary",
  );
  const differentiableAlignment = claims.find(
    (claim) => claim.id === "bahdanau-2014-differentiable-soft-alignment",
  );
  const equationBoundary = claims.find(
    (claim) => claim.id === "bahdanau-2014-equation-version-boundary",
  );
  const aggregate = corpus.sources.find(
    (source) => source.id === "bahdanau-2014-arxiv-record",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );

  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "bahdanau-2014-arxiv-v7-version");
  assert.equal(work?.versions.length, 7);
  assert.deepEqual(work?.authors, [
    "Dzmitry Bahdanau",
    "Kyunghyun Cho",
    "Yoshua Bengio",
  ]);
  assert.deepEqual(
    work?.chronology.events.map((event) => [event.id, event.date.value]),
    [
      ["bahdanau-2014-arxiv-v1-posted", "2014-09-01"],
      ["bahdanau-2014-arxiv-v2-posted", "2014-09-04"],
      ["bahdanau-2014-arxiv-v3-posted", "2014-10-07"],
      ["bahdanau-2014-arxiv-v4-posted", "2014-12-19"],
      ["bahdanau-2014-arxiv-v5-posted", "2015-03-22"],
      ["bahdanau-2014-arxiv-v6-posted", "2015-04-24"],
      ["bahdanau-2015-iclr-oral", "2015-05-09"],
      ["bahdanau-2014-arxiv-v7-posted", "2016-05-19"],
    ],
  );
  assert.equal(
    work?.chronology.orderingEventId,
    "bahdanau-2014-arxiv-v1-posted",
  );
  assert.deepEqual(work?.ideaIds, [
    "fixed-vector-neural-sequence-transduction",
    "source-conditioned-autoregressive-decoding",
    "reset-update-gated-recurrence",
    "decoder-conditioned-soft-attention",
    "monotonic-gaussian-mixture-sequence-window",
    "bidirectional-source-annotations",
    "fixed-vector-source-summary-bottleneck",
  ]);
  assert.equal(aggregate?.versionIds.length, 7);
  assert.equal(aggregate?.supports.includes("version-boundary"), false);
  for (const version of work?.versions ?? []) {
    for (const sourceId of version.sourceIds) {
      const source = corpus.sources.find((item) => item.id === sourceId);
      assert.ok(source?.relatedWorkIds.includes(work.id));
      assert.ok(source?.versionIds.includes(version.id));
    }
  }
  assert.ok(
    versions
      .get("bahdanau-2014-arxiv-v5-version")
      ?.notes.includes("missing matrix"),
  );
  assert.ok(
    versions
      .get("bahdanau-2014-arxiv-v6-version")
      ?.notes.includes("post-output-state"),
  );
  assert.ok(
    versions
      .get("bahdanau-2014-arxiv-v7-version")
      ?.notes.includes("not treated as a globally corrected"),
  );
  assert.equal(claims.length, 19);
  for (const value of [
    "13.93/24.19",
    "21.50/31.44",
    "17.82/26.71",
    "26.75/34.16",
    "28.45/36.15",
    "33.30/35.63",
  ]) {
    assert.ok(results?.statement.includes(value));
  }
  assert.ok(results?.limitations.some((item) => item.includes("418M-word")));
  assert.ok(length?.limitations.some((item) => item.includes("per-bin counts")));
  assert.ok(length?.limitations.some((item) => item.includes("multi-component")));
  assert.equal(
    differentiableAlignment?.statement,
    "Because the source weights are differentiable, translation-loss gradients jointly train the alignment scorer with the encoder and decoder.",
  );
  assert.equal(
    alignment?.statement,
    "The authors interpret αᵢⱼ as a probability or importance that target yᵢ aligns to source xⱼ and show mostly monotonic and reordering examples.",
  );
  assert.ok(alignment?.limitations.some((item) => item.includes("gold labels")));
  assert.equal(equationBoundary?.evidence.length, 3);
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-bahdanau-2014-follow-the-focus",
      "expert-bahdanau-2014-attention-objective-and-evidence",
    ],
  );
  assert.deepEqual(
    objectives.map((objective) => objective.mode),
    ["beginner", "expert"],
  );
  assert.ok(objectives[0]?.successCriterion.includes("qualitative"));
  assert.ok(objectives[1]?.successCriterion.includes("v5/v6/v7"));
});

test("documents the scoped Cho to Bahdanau extension", () => {
  const relationship = corpus.relationships.find(
    (item) => item.id === "cho-2014-to-bahdanau-2014",
  );
  const claimWorkIds = new Set(
    relationship?.claimIds.map(
      (claimId) => corpus.claims.find((claim) => claim.id === claimId)?.workId,
    ),
  );

  assert.deepEqual(relationship?.from, {
    kind: "work",
    id: "cho-2014-rnn-encoder-decoder",
  });
  assert.deepEqual(relationship?.to, {
    kind: "work",
    id: "bahdanau-cho-bengio-2014-neural-machine-translation",
  });
  assert.equal(relationship?.connectionType, "extends");
  assert.equal(relationship?.evidenceClass, "documented-influence");
  assert.equal(relationship?.confidence, "high");
  assert.equal(relationship?.causalLanguage, "qualified");
  assert.deepEqual(
    claimWorkIds,
    new Set([
      "cho-2014-rnn-encoder-decoder",
      "bahdanau-cho-bengio-2014-neural-machine-translation",
    ]),
  );
  assert.deepEqual(
    relationship?.sourceEvidence.map((item) => item.locator.pageStart),
    [2, 4, 12],
  );
  assert.ok(relationship?.rationale.includes("fixed-context comparator"));
  assert.ok(
    relationship?.rationale.includes("opposite z mixture convention"),
  );
  assert.ok(
    relationship?.rationale.includes("terminal forward encoder state"),
  );
  assert.ok(relationship?.rationale.includes("sole attention priority"));
});

test("keeps reciprocal Bahdanau and Sutskever citations from overriding chronology", () => {
  const bahdanau = corpus.works.find(
    (work) =>
      work.id === "bahdanau-cho-bengio-2014-neural-machine-translation",
  );
  const sutskever = corpus.works.find(
    (work) => work.id === "sutskever-vinyals-le-2014-sequence-to-sequence",
  );
  const crossCitation = corpus.claims.find(
    (claim) => claim.id === "bahdanau-2014-sutskever-cross-citation-boundary",
  );
  const sutskeverV1 = corpus.sources.find(
    (source) => source.id === "sutskever-2014-arxiv-v1-full-text",
  );
  const pairEdges = corpus.relationships.filter((relationship) => {
    const ids = new Set([relationship.from.id, relationship.to.id]);
    return ids.has(bahdanau?.id) && ids.has(sutskever?.id);
  });

  assert.equal(
    bahdanau?.chronology.events.find(
      (event) => event.id === bahdanau.chronology.orderingEventId,
    )?.date.value,
    "2014-09-01",
  );
  assert.equal(
    sutskever?.chronology.events.find(
      (event) => event.id === sutskever.chronology.orderingEventId,
    )?.date.value,
    "2014-09-10",
  );
  assert.deepEqual(
    crossCitation?.evidence.map((item) => item.sourceId),
    [
      "bahdanau-2014-arxiv-v1-full-text",
      "sutskever-2014-arxiv-v1-full-text",
    ],
  );
  assert.ok(sutskeverV1?.relatedWorkIds.includes(bahdanau?.id));
  assert.equal(pairEdges.length, 0);
  for (const term of [
    "conception order",
    "submission order",
    "private-circulation",
  ])
    assert.ok(crossCitation?.limitations[0].includes(term));
});

test("retains Sutskever 2014 with separate direct, rescoring, and version evidence", () => {
  const work = corpus.works.find(
    (item) => item.id === "sutskever-vinyals-le-2014-sequence-to-sequence",
  );
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const direct = claims.find(
    (claim) => claim.id === "sutskever-2014-direct-results",
  );
  const rescoring = claims.find(
    (claim) => claim.id === "sutskever-2014-rescoring-results",
  );
  const reversal = claims.find(
    (claim) => claim.id === "sutskever-2014-reversal-intervention",
  );
  const reversalBoundary = claims.find(
    (claim) => claim.id === "sutskever-2014-reversal-explanation-boundary",
  );
  const parameterBoundary = claims.find(
    (claim) => claim.id === "sutskever-2014-version-parameter-boundary",
  );
  const fullText = corpus.sources.find(
    (source) => source.id === "sutskever-2014-neurips-full-text",
  );
  const metadata = corpus.sources.find(
    (source) => source.id === "sutskever-2014-neurips-metadata",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );

  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "sutskever-2014-nips-version");
  assert.equal(work?.versions.length, 4);
  assert.deepEqual(work?.authors, [
    "Ilya Sutskever",
    "Oriol Vinyals",
    "Quoc V. Le",
  ]);
  assert.deepEqual(
    work?.chronology.events.map((event) => [event.id, event.date.value]),
    [
      ["sutskever-2014-arxiv-v1-posted", "2014-09-10"],
      ["sutskever-2014-arxiv-v2-posted", "2014-10-29"],
      ["sutskever-2014-nips-oral", "2014-12-09"],
      ["sutskever-2014-arxiv-v3-posted", "2014-12-14"],
    ],
  );
  assert.equal(
    work?.chronology.orderingEventId,
    "sutskever-2014-arxiv-v1-posted",
  );
  assert.deepEqual(
    versions.get("sutskever-2014-nips-version")?.bibliography.pages,
    ["3104-3112"],
  );
  assert.ok(
    versions
      .get("sutskever-2014-nips-version")
      ?.notes.includes("internal pp. 1–9"),
  );
  assert.ok(
    versions
      .get("sutskever-2014-arxiv-v3-version")
      ?.notes.includes("384 million"),
  );
  assert.deepEqual(fullText?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 9,
  });
  assert.equal(metadata?.supports.includes("claim-location"), false);
  assert.equal(claims.length, 15);
  for (const value of [
    "28.45",
    "33.30",
    "26.17",
    "30.59",
    "33.00",
    "33.27",
    "34.50",
    "34.81",
  ]) {
    assert.ok(direct?.statement.includes(value));
  }
  assert.ok(direct?.statement.includes("five at beam 12"));
  for (const value of [
    "33.30",
    "34.54",
    "37.0",
    "35.61",
    "35.85",
    "36.5",
    "approximately 45",
  ]) {
    assert.ok(rescoring?.statement.includes(value));
  }
  assert.ok(rescoring?.statement.includes("1,000-best rescoring"));
  for (const value of ["5.8", "4.7", "25.9", "30.6", "26.17", "30.59"])
    assert.ok(reversal?.statement.includes(value));
  assert.ok(reversalBoundary?.statement.includes("explanation incomplete"));
  assert.ok(reversalBoundary?.statement.includes("does not experimentally isolate"));
  assert.ok(parameterBoundary?.statement.includes("380 million"));
  assert.ok(parameterBoundary?.statement.includes("384 million"));
  assert.ok(parameterBoundary?.statement.includes("8,000-dimensional"));
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-sutskever-2014-reverse-then-translate",
      "expert-sutskever-2014-factorization-scale-and-results",
    ],
  );
  assert.ok(objectives[0]?.successCriterion.includes("five-model direct"));
  assert.ok(objectives[0]?.successCriterion.includes("1000-best rescoring"));
  assert.ok(objectives[1]?.successCriterion.includes("380M proceedings"));
  assert.ok(objectives[1]?.successCriterion.includes("seven Table 2 rows"));
});

test("retains End-To-End Memory Networks with its historical title and evidence boundaries", () => {
  const work = corpus.works.find(
    (item) => item.id === "sukhbaatar-2015-end-to-end-memory-networks",
  );
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const sources = new Map(
    corpus.sources
      .filter((source) => source.relatedWorkIds.includes(work?.id))
      .map((source) => [source.id, source]),
  );
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const softRead = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-soft-memory-read",
  );
  const objective = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-end-to-end-objective",
  );
  const multiHop = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-multi-hop-update",
  );
  const tying = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-weight-tying",
  );
  const position = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-position-and-temporal-encoding",
  );
  const qaSetup = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-qa-setup",
  );
  const qa = claims.find((claim) => claim.id === "sukhbaatar-2015-qa-results");
  const supplement = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-nonlinear-supplement-results",
  );
  const languageModel = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-language-model-results",
  );
  const hopBoundary = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-hop-trend-boundary",
  );
  const versionBoundary = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-version-identity-and-scope-boundary",
  );
  const scalingBoundary = claims.find(
    (claim) => claim.id === "sukhbaatar-2015-evidence-and-scaling-boundary",
  );
  const transformerBoundary = corpus.claims.find(
    (claim) => claim.id === "vaswani-2017-predecessor-and-scope-boundary",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );
  const incomingRelationships = corpus.relationships.filter(
    (relationship) =>
      relationship.to.kind === "work" && relationship.to.id === work?.id,
  );
  const transformerEdges = corpus.relationships.filter(
    (relationship) =>
      relationship.from.kind === "work" &&
      relationship.from.id === work?.id &&
      relationship.to.kind === "work" &&
      relationship.to.id === "vaswani-2017-attention-is-all-you-need",
  );

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(
    work?.canonicalVersionId,
    "sukhbaatar-2015-nips-version",
  );
  assert.equal(work?.versions.length, 6);
  assert.deepEqual(work?.authors, [
    "Sainbayar Sukhbaatar",
    "Arthur Szlam",
    "Jason Weston",
    "Rob Fergus",
  ]);
  assert.deepEqual(
    work?.chronology.events.map((event) => [event.id, event.date.value]),
    [
      ["sukhbaatar-2015-arxiv-v1-posted", "2015-03-31"],
      ["sukhbaatar-2015-arxiv-v2-posted", "2015-04-03"],
      ["sukhbaatar-2015-arxiv-v3-posted", "2015-04-12"],
      ["sukhbaatar-2015-arxiv-v4-posted", "2015-06-08"],
      ["sukhbaatar-2015-arxiv-v5-posted", "2015-11-24"],
      ["sukhbaatar-2015-nips-proceedings", "2015"],
    ],
  );
  for (const [eventId, timestamp] of [
    ["sukhbaatar-2015-arxiv-v1-posted", "03:05:37 UTC"],
    ["sukhbaatar-2015-arxiv-v2-posted", "02:23:20 UTC"],
    ["sukhbaatar-2015-arxiv-v3-posted", "04:19:33 UTC"],
    ["sukhbaatar-2015-arxiv-v4-posted", "21:42:20 UTC"],
    ["sukhbaatar-2015-arxiv-v5-posted", "19:41:57 UTC"],
  ]) {
    const event = work?.chronology.events.find((item) => item.id === eventId);
    assert.ok(event?.dateEvidence[0].locator.includes(timestamp));
  }
  for (const id of [
    "sukhbaatar-2015-arxiv-v1-version",
    "sukhbaatar-2015-arxiv-v2-version",
    "sukhbaatar-2015-arxiv-v3-version",
  ]) {
    assert.equal(versions.get(id)?.title, "Weakly Supervised Memory Networks");
  }
  for (const id of [
    "sukhbaatar-2015-arxiv-v4-version",
    "sukhbaatar-2015-arxiv-v5-version",
    "sukhbaatar-2015-nips-version",
  ]) {
    assert.equal(versions.get(id)?.title, "End-To-End Memory Networks");
  }
  assert.deepEqual(
    versions.get("sukhbaatar-2015-nips-version")?.bibliography.pages,
    ["2440-2448"],
  );
  assert.ok(
    versions
      .get("sukhbaatar-2015-arxiv-v5-version")
      ?.bibliography.identifiers.some(
        (identifier) => identifier.value === "10.48550/arXiv.1503.08895",
      ),
  );
  assert.ok(
    versions
      .get("sukhbaatar-2015-nips-version")
      ?.bibliography.identifiers.some(
        (identifier) => identifier.value === "1446",
      ),
  );
  assert.deepEqual(sources.get("sukhbaatar-2015-neurips-full-text")?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 9,
  });
  assert.deepEqual(sources.get("sukhbaatar-2015-arxiv-v5-full-text")?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 11,
  });
  assert.deepEqual(sources.get("sukhbaatar-2015-neurips-supplement")?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 2,
  });
  assert.equal(
    sources.get("sukhbaatar-2015-arxiv-v1-full-text")?.title,
    "Weakly Supervised Memory Networks arXiv version 1 full text",
  );
  assert.ok(
    sources.get("sukhbaatar-2015-neurips-reviews")?.supports.includes("metadata"),
  );
  assert.equal(
    sources
      .get("sukhbaatar-2015-neurips-reviews")
      ?.supports.includes("claim-location"),
    false,
  );
  for (const value of ["archived", "BSD", "patent-grant", "checkpoint"])
    assert.ok(
      sources
        .get("sukhbaatar-2015-official-implementation")
        ?.accessNote.includes(value),
    );
  assert.equal(claims.length, 15);
  for (const value of [
    "u = Bq",
    "pᵢ = softmax(uᵀmᵢ)",
    "o = Σᵢpᵢcᵢ",
  ])
    assert.ok(softRead?.statement.includes(value));
  assert.equal(softRead?.evidence[0]?.locator.equation, "1–2");
  assert.ok(objective?.statement.includes("softmax(W(o + u))"));
  assert.equal(objective?.evidence[0]?.locator.equation, "3");
  assert.ok(multiHop?.statement.includes("uᵏ⁺¹ = uᵏ + oᵏ"));
  assert.equal(multiHop?.evidence[0]?.locator.equation, "4");
  for (const value of ["Aᵏ⁺¹ = Cᵏ", "Wᵀ = Cᴷ", "B = A¹", "uᵏ⁺¹ = Huᵏ + oᵏ"])
    assert.ok(tying?.statement.includes(value));
  for (const value of [
    "lₖⱼ = (1 − j/J) − (k/d)(1 − 2j/J)",
    "T_A(i)",
    "T_C(i)",
    "10% empty memories",
  ])
    assert.ok(position?.statement.includes(value));
  for (const value of ["bAbI version 1.1", "K = 3", "10%", "50 most recent"])
    assert.ok(qaSetup?.statement.includes(value));
  assert.deepEqual(
    qaSetup?.evidence.map((item) => item.sourceId),
    ["sukhbaatar-2015-neurips-full-text"],
  );
  for (const value of [
    "6.7/4",
    "51.3/20",
    "40.2/18",
    "25.1/15",
    "20.3/13",
    "16.3/12",
    "13.9/11",
    "25.8/17",
    "15.6/11",
    "13.3/11",
    "12.4/11",
    "15.2/10",
  ])
    assert.ok(qa?.statement.includes(value));
  assert.ok(qa?.limitations.some((value) => value.includes("12.6")));
  for (const value of [
    "3.2/2",
    "36.4/16",
    "39.2/17",
    "15.4/9",
    "9.4/6",
    "7.2/4",
    "6.6/4",
    "4.2/3",
    "24.5/16",
    "10.9/7",
    "7.9/6",
    "7.5/6",
    "11.0/6",
    "18,6",
    "18.6",
    "2.3%",
  ])
    assert.ok(supplement?.statement.includes(value));
  assert.equal(supplement?.evidence[0]?.locator.table, "3");
  assert.equal(supplement?.evidence[0]?.locator.pageStart, 10);
  assert.equal(supplement?.evidence[1]?.locator.table, "1");
  assert.equal(supplement?.evidence[1]?.locator.pageStart, 1);
  assert.equal(
    supplement?.evidence[1]?.locator.section,
    "1 Results on 10k QA dataset",
  );
  for (const value of [
    "129/115/115",
    "118/111",
    "150 hidden units",
    "184/154/161",
    "118/147",
    "500 hidden units",
    "seven hops",
    "memory 200",
    "memory 100",
  ])
    assert.ok(languageModel?.statement.includes(value));
  assert.ok(
    languageModel?.limitations
      .join(" ")
      .includes("ten random initializations"),
  );
  assert.ok(languageModel?.limitations.join(" ").includes("one run"));
  assert.ok(hopBoundary?.statement.includes("not uniformly monotonic"));
  assert.ok(versionBoundary?.statement.includes("already contains Appendices A and B"));
  assert.ok(versionBoundary?.statement.includes("revises those appendices"));
  assert.ok(scalingBoundary?.statement.includes("smooth lookup may not scale"));
  assert.ok(
    work?.limitations
      .join(" ")
      .includes("lowest training error"),
  );
  assert.ok(work?.limitations.join(" ").includes("two selection stages"));
  assert.deepEqual(
    objectives.map((item) => item.id),
    [
      "beginner-sukhbaatar-2015-soft-memory-hops",
      "expert-sukhbaatar-2015-mechanism-and-evidence",
    ],
  );
  assert.ok(objectives[0]?.successCriterion.includes("two sequential hops"));
  assert.ok(objectives[1]?.successCriterion.includes("equations 1–4"));
  assert.deepEqual(
    incomingRelationships.map((relationship) => relationship.id),
    ["bahdanau-2014-to-sukhbaatar-2015"],
  );
  assert.equal(incomingRelationships[0]?.connectionType, "extends");
  assert.equal(
    incomingRelationships[0]?.evidenceClass,
    "documented-influence",
  );
  assert.equal(incomingRelationships[0]?.confidence, "high");
  assert.equal(incomingRelationships[0]?.causalLanguage, "qualified");
  assert.equal(transformerEdges.length, 0);
  assert.ok(
    transformerBoundary?.limitations
      .join(" ")
      .includes("absent from Transformer arXiv versions 1–4"),
  );
  assert.ok(transformerBoundary?.limitations.join(" ").includes("version 5"));
});

test("retains Luong attention with versioned formulas and controlled result endpoints", () => {
  const work = corpus.works.find(
    (item) => item.id === "luong-pham-manning-2015-effective-attention-nmt",
  );
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const sources = new Map(
    corpus.sources
      .filter((source) => source.relatedWorkIds.includes(work?.id))
      .map((source) => [source.id, source]),
  );
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const dataAndEvaluation = claims.find(
    (claim) => claim.id === "luong-2015-data-and-evaluation",
  );
  const reversalBoundary = claims.find(
    (claim) => claim.id === "luong-2015-sutskever-architecture-and-reversal",
  );
  const scoreFamily = claims.find(
    (claim) => claim.id === "luong-2015-attention-score-family",
  );
  const englishGerman = claims.find(
    (claim) => claim.id === "luong-2015-english-german-results",
  );
  const wmt15 = claims.find(
    (claim) => claim.id === "luong-2015-wmt15-ensemble-result",
  );
  const alignment = claims.find(
    (claim) => claim.id === "luong-2015-alignment-evaluation",
  );
  const germanEnglish = claims.find(
    (claim) => claim.id === "luong-2015-german-english-results",
  );
  const architectureResults = claims.find(
    (claim) => claim.id === "luong-2015-attention-architecture-results",
  );
  const versionBoundary = claims.find(
    (claim) => claim.id === "luong-2015-version-boundary",
  );
  const transformerBoundary = corpus.claims.find(
    (claim) => claim.id === "vaswani-2017-predecessor-and-scope-boundary",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );
  const incomingRelationships = corpus.relationships.filter(
    (relationship) =>
      relationship.to.kind === "work" && relationship.to.id === work?.id,
  );
  const transformerEdges = corpus.relationships.filter(
    (relationship) =>
      relationship.from.kind === "work" &&
      relationship.from.id === work?.id &&
      relationship.to.kind === "work" &&
      relationship.to.id === "vaswani-2017-attention-is-all-you-need",
  );

  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "luong-2015-emnlp-version");
  assert.equal(work?.versions.length, 6);
  assert.deepEqual(work?.authors, [
    "Minh-Thang Luong",
    "Hieu Pham",
    "Christopher D. Manning",
  ]);
  const chronologyById = new Map(
    work?.chronology.events.map((event) => [event.id, event]),
  );
  assert.equal(chronologyById.get("luong-2015-arxiv-v1-posted")?.date.value, "2015-08-17");
  assert.equal(chronologyById.get("luong-2015-arxiv-v2-posted")?.date.value, "2015-08-18");
  assert.equal(chronologyById.get("luong-2015-arxiv-v3-posted")?.date.value, "2015-08-19");
  assert.equal(chronologyById.get("luong-2015-arxiv-v4-posted")?.date.value, "2015-08-29");
  assert.equal(chronologyById.get("luong-2015-arxiv-v5-posted")?.date.value, "2015-09-20");
  assert.equal(
    chronologyById.get("luong-2015-arxiv-v5-posted")?.label,
    "arXiv version 5 posted",
  );
  assert.equal(chronologyById.get("luong-2015-emnlp-proceedings")?.date.value, "2015-09");
  assert.equal(
    chronologyById.get("luong-2015-emnlp-proceedings")?.date.precision,
    "month",
  );
  for (const [eventId, timestamp] of [
    ["luong-2015-arxiv-v1-posted", "13:43:19 UTC"],
    ["luong-2015-arxiv-v2-posted", "10:27:26 UTC"],
    ["luong-2015-arxiv-v3-posted", "08:14:59 UTC"],
    ["luong-2015-arxiv-v4-posted", "09:03:04 UTC"],
    ["luong-2015-arxiv-v5-posted", "08:25:52 UTC"],
  ])
    assert.ok(
      chronologyById
        .get(eventId)
        ?.dateEvidence[0].locator.includes(timestamp),
    );
  assert.ok(
    work?.uncertainties[1]?.note.includes("September records overlap"),
  );
  assert.ok(
    work?.uncertainties[1]?.note.includes(
      "does not infer their within-month public order",
    ),
  );
  assert.deepEqual(
    versions.get("luong-2015-emnlp-version")?.bibliography.pages,
    ["1412-1421"],
  );
  assert.ok(
    versions
      .get("luong-2015-arxiv-v5-version")
      ?.bibliography.identifiers.some(
        (identifier) => identifier.value === "10.48550/arXiv.1508.04025",
      ),
  );
  assert.deepEqual(sources.get("luong-2015-acl-full-text")?.pagination, {
    scheme: "printed",
    pageStart: 1412,
    pageEnd: 1421,
  });
  assert.deepEqual(sources.get("luong-2015-arxiv-v5-full-text")?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 11,
  });
  assert.equal(claims.length, 17);
  assert.ok(scoreFamily?.statement.includes("v_a^T tanh(W_a[h_t;h̄_s])"));
  assert.ok(scoreFamily?.statement.includes("only in arXiv version 5"));
  const correctedScoreEvidence = scoreFamily?.evidence.find(
    (item) => item.sourceId === "luong-2015-arxiv-v5-full-text",
  );
  assert.equal(
    correctedScoreEvidence?.locator.paragraph,
    "Unnumbered score-family display",
  );
  assert.equal("equation" in correctedScoreEvidence.locator, false);
  assert.ok(correctedScoreEvidence?.support.includes("equation 8"));
  for (const value of ["tokenized BLEU", "NIST BLEU"])
    assert.ok(dataAndEvaluation?.statement.includes(value));
  assert.ok(
    dataAndEvaluation?.limitations
      .join(" ")
      .includes("not interchangeable"),
  );
  assert.ok(reversalBoundary?.statement.includes("after an unreversed base row"));
  assert.ok(
    reversalBoundary?.statement.includes(
      "attention comparison systems retain source-sequence reversal",
    ),
  );
  for (const value of ["14.0", "19.0", "20.9", "23.0"])
    assert.ok(englishGerman?.statement.includes(value));
  assert.ok(englishGerman?.limitations.some((value) => value.includes("0.9 BLEU")));
  for (const value of ["25.9", "eight-model", "unknown-word", "NIST"])
    assert.ok(wmt15?.statement.includes(value));
  for (const value of [
    "508",
    "forced reference decoding",
    "one selected source link per target",
    "0.34",
    "0.32",
    "one million",
    "one-to-many",
  ])
    assert.ok(alignment?.statement.includes(value));
  assert.equal(
    alignment?.evidence[0]?.locator.section,
    "5.4 Alignment Quality",
  );
  assert.ok(
    alignment?.limitations
      .join(" ")
      .includes("poor correlation"),
  );
  assert.equal(
    architectureResults?.evidence[0]?.locator.section,
    "5.3 Choices of Attentional Architectures",
  );
  for (const value of ["24.9", "29.2", "27.6"])
    assert.ok(germanEnglish?.statement.includes(value));
  assert.ok(
    germanEnglish?.limitations
      .join(" ")
      .includes("rejects a state-of-the-art claim"),
  );
  for (const value of ["p = 0.2", "D = 10", "Figure 7"])
    assert.ok(versionBoundary?.statement.includes(value));
  assert.ok(versionBoundary?.statement.includes("separate eleven-page arXiv version 5"));
  assert.equal(versionBoundary?.statement.includes("post-proceedings"), false);
  assert.ok(
    sources
      .get("luong-2015-acl-rights-policy")
      ?.accessNote.includes("CC BY-NC-SA 3.0"),
  );
  assert.ok(
    sources
      .get("luong-2015-acl-rights-policy")
      ?.accessNote.includes("third-party"),
  );
  assert.ok(
    sources
      .get("luong-2015-arxiv-record")
      ?.accessNote.includes("non-exclusive"),
  );
  assert.deepEqual(
    objectives.map((objective) => objective.mode).sort(),
    ["beginner", "expert"],
  );
  assert.deepEqual(
    incomingRelationships.map((relationship) => relationship.id).sort(),
    ["bahdanau-2014-to-luong-2015", "sutskever-2014-to-luong-2015"],
  );
  assert.equal(transformerEdges.length, 0);
  assert.ok(
    transformerBoundary?.statement.includes(
      "cites Luong et al. only within a group of efforts advancing recurrent",
    ),
  );
  assert.ok(
    transformerBoundary?.statement.includes(
      "scaled-dot-product paragraph does not cite Luong",
    ),
  );
  assert.equal(
    transformerBoundary?.evidence[0]?.locator.section,
    "1 Introduction; 2 Background",
  );
  assert.equal(
    transformerBoundary?.evidence.find(
      (item) =>
        item.locator.section === "3.2.1 Scaled Dot-Product Attention",
    )?.locator.section,
    "3.2.1 Scaled Dot-Product Attention",
  );
});

test("retains Cheng 2016 as a versioned recurrent intra-attention machine-reading branch", () => {
  const work = corpus.works.find(
    (item) => item.id === "cheng-dong-lapata-2016-lstmn-machine-reading",
  );
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const sources = new Map(
    corpus.sources
      .filter((source) => source.relatedWorkIds.includes(work?.id))
      .map((source) => [source.id, source]),
  );
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const memoryTape = claims.find(
    (claim) => claim.id === "cheng-2016-lstmn-memory-tape",
  );
  const update = claims.find(
    (claim) => claim.id === "cheng-2016-intra-attention-update",
  );
  const fusion = claims.find(
    (claim) => claim.id === "cheng-2016-two-sequence-attention-fusion",
  );
  const languageModel = claims.find(
    (claim) => claim.id === "cheng-2016-language-model-results",
  );
  const sentiment = claims.find(
    (claim) => claim.id === "cheng-2016-sentiment-results",
  );
  const nli = claims.find(
    (claim) => claim.id === "cheng-2016-nli-results",
  );
  const resultBoundary = claims.find(
    (claim) => claim.id === "cheng-2016-version-result-boundary",
  );
  const equationBoundary = claims.find(
    (claim) => claim.id === "cheng-2016-equation-version-boundary",
  );
  const evidenceBoundary = claims.find(
    (claim) => claim.id === "cheng-2016-evidence-boundary",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );
  const incomingRelationships = corpus.relationships.filter(
    (relationship) =>
      relationship.to.kind === "work" && relationship.to.id === work?.id,
  );
  const transformerEdges = corpus.relationships.filter(
    (relationship) =>
      relationship.from.kind === "work" &&
      relationship.from.id === work?.id &&
      relationship.to.kind === "work" &&
      relationship.to.id === "vaswani-2017-attention-is-all-you-need",
  );

  assert.equal(work?.inclusion.status, "branch");
  assert.equal(work?.canonicalVersionId, "cheng-2016-emnlp-version");
  assert.equal(work?.versions.length, 8);
  assert.deepEqual(work?.authors, [
    "Jianpeng Cheng",
    "Li Dong",
    "Mirella Lapata",
  ]);
  assert.equal(
    work?.chronology.orderingEventId,
    "cheng-2016-arxiv-v1-posted",
  );
  assert.deepEqual(
    work?.chronology.events.map((event) => [
      event.id,
      event.date.value,
      event.date.precision,
    ]),
    [
      ["cheng-2016-arxiv-v1-posted", "2016-01-25", "day"],
      ["cheng-2016-arxiv-v2-posted", "2016-01-26", "day"],
      ["cheng-2016-arxiv-v3-posted", "2016-02-01", "day"],
      ["cheng-2016-arxiv-v4-posted", "2016-03-17", "day"],
      ["cheng-2016-arxiv-v5-posted", "2016-04-07", "day"],
      ["cheng-2016-arxiv-v6-posted", "2016-06-01", "day"],
      ["cheng-2016-arxiv-v7-posted", "2016-09-20", "day"],
      ["cheng-2016-emnlp-proceedings", "2016-11", "month"],
    ],
  );
  assert.deepEqual(
    versions.get("cheng-2016-emnlp-version")?.bibliography.pages,
    ["551-561"],
  );
  assert.deepEqual(sources.get("cheng-2016-acl-full-text")?.pagination, {
    scheme: "printed",
    pageStart: 551,
    pageEnd: 561,
  });
  assert.deepEqual(sources.get("cheng-2016-arxiv-v3-full-text")?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 10,
  });
  assert.equal(sources.size, 12);
  assert.equal(claims.length, 15);
  for (const value of ["H_(t−1)", "C_(t−1)", "unspecified upper bound"])
    assert.ok(memoryTape?.statement.includes(value));
  for (const value of ["a_i^t", "W_h̃", "c_t = f_t ⊙ c̃_t", "h_t = o_t"])
    assert.ok(update?.statement.includes(value));
  for (const value of ["shallow fusion", "deep fusion", "r_t ⊙ α̃_t", "equations 11–16"])
    assert.ok(
      `${fusion?.statement} ${fusion?.evidence[0]?.support}`.includes(value),
    );
  for (const value of ["141", "129", "115", "108", "107", "109", "102"])
    assert.ok(languageModel?.statement.includes(value));
  for (const value of ["47.6/86.3", "47.9/87.0", "51.2/88.6"])
    assert.ok(sentiment?.statement.includes(value));
  for (const value of ["86.1/1.9M", "86.0/2.8M", "86.3/3.4M"])
    assert.ok(nli?.statement.includes(value));
  for (const value of [
    "85.3/82.8",
    "86.8/84.6",
    "87.1/84.5",
    "86.3/84.9",
    "92.3",
    "89.1",
    "92.1",
    "89.0",
    "47.6/86.3",
  ])
    assert.ok(resultBoundary?.statement.includes(value));
  for (const value of ["s_t", "c̃_(t−1)", "c̃_t", "equation 10"])
    assert.ok(equationBoundary?.statement.includes(value));
  assert.ok(evidenceBoundary?.statement.includes("no repeated seeds"));
  assert.ok(work?.limitations.join(" ").includes("rather than a question-answering"));
  assert.ok(sources.get("cheng-2016-paper-linked-code")?.accessNote.includes("HTTP 404"));
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-cheng-2016-follow-recurrent-intra-attention",
      "expert-cheng-2016-equations-results-and-versions",
    ],
  );
  assert.ok(objectives[0]?.successCriterion.includes("not parallel Transformer"));
  assert.ok(objectives[1]?.successCriterion.includes("later-omitted revision-only 89.x"));
  assert.deepEqual(
    incomingRelationships.map((relationship) => [
      relationship.id,
      relationship.connectionType,
    ]),
    [
      ["hochreiter-schmidhuber-1995-to-cheng-2016", "extends"],
      ["sukhbaatar-2015-to-cheng-2016", "combines"],
      ["bahdanau-2014-to-cheng-2016", "combines"],
    ],
  );
  for (const relationship of incomingRelationships) {
    assert.equal(relationship.evidenceClass, "documented-influence");
    assert.equal(relationship.confidence, "high");
    assert.equal(relationship.causalLanguage, "qualified");
    assert.ok(
      relationship.sourceEvidence.every(
        (item) => item.sourceId === "cheng-2016-acl-full-text",
      ),
    );
  }
  assert.equal(transformerEdges.length, 0);
});

test("retains Parikh 2016 as a versioned recurrence-free decomposable-attention branch", () => {
  const work = corpus.works.find(
    (item) => item.id === "parikh-2016-decomposable-attention-nli",
  );
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const sources = new Map(
    corpus.sources
      .filter((source) => source.relatedWorkIds.includes(work?.id))
      .map((source) => [source.id, source]),
  );
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const attend = claims.find(
    (claim) => claim.id === "parikh-2016-attend-soft-alignment",
  );
  const compare = claims.find(
    (claim) => claim.id === "parikh-2016-compare-and-aggregate",
  );
  const intra = claims.find(
    (claim) => claim.id === "parikh-2016-distance-biased-intra-attention",
  );
  const objectiveBoundary = claims.find(
    (claim) => claim.id === "parikh-2016-objective-and-printed-sign-boundary",
  );
  const complexity = claims.find(
    (claim) => claim.id === "parikh-2016-complexity-and-parallelism",
  );
  const results = claims.find(
    (claim) => claim.id === "parikh-2016-snli-results",
  );
  const classwise = claims.find(
    (claim) => claim.id === "parikh-2016-classwise-development-results",
  );
  const versionBoundary = claims.find(
    (claim) => claim.id === "parikh-2016-version-boundary",
  );
  const evidenceBoundary = claims.find(
    (claim) => claim.id === "parikh-2016-evidence-boundary",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );
  const incomingRelationships = corpus.relationships.filter(
    (relationship) =>
      relationship.to.kind === "work" && relationship.to.id === work?.id,
  );
  const transformerEdges = corpus.relationships.filter(
    (relationship) =>
      relationship.from.kind === "work" &&
      relationship.from.id === work?.id &&
      relationship.to.kind === "work" &&
      relationship.to.id === "vaswani-2017-attention-is-all-you-need",
  );

  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "parikh-2016-emnlp-version");
  assert.equal(work?.versions.length, 3);
  assert.deepEqual(work?.authors, [
    "Ankur P. Parikh",
    "Oscar Täckström",
    "Dipanjan Das",
    "Jakob Uszkoreit",
  ]);
  assert.equal(
    work?.chronology.orderingEventId,
    "parikh-2016-arxiv-v1-posted",
  );
  assert.deepEqual(
    work?.chronology.events.map((event) => [
      event.id,
      event.date.value,
      event.date.precision,
    ]),
    [
      ["parikh-2016-arxiv-v1-posted", "2016-06-06", "day"],
      ["parikh-2016-arxiv-v2-posted", "2016-09-25", "day"],
      ["parikh-2016-emnlp-proceedings", "2016-11", "month"],
    ],
  );
  assert.deepEqual(
    versions.get("parikh-2016-emnlp-version")?.bibliography.pages,
    ["2249-2255"],
  );
  assert.deepEqual(sources.get("parikh-2016-acl-full-text")?.pagination, {
    scheme: "printed",
    pageStart: 2249,
    pageEnd: 2255,
  });
  assert.deepEqual(sources.get("parikh-2016-arxiv-v1-full-text")?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 5,
  });
  assert.deepEqual(sources.get("parikh-2016-arxiv-v2-full-text")?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 7,
  });
  for (const claim of claims) {
    for (const evidence of claim.evidence) {
      if (
        [
          "parikh-2016-arxiv-v1-full-text",
          "parikh-2016-arxiv-v2-full-text",
        ].includes(evidence.sourceId)
      ) {
        assert.doesNotMatch(evidence.locator.section ?? "", /^Complete\b/);
      }
    }
  }
  assert.equal(sources.size, 7);
  assert.equal(claims.length, 16);
  for (const value of ["F(ā_i)ᵀF(b̄_j)", "β_i", "α_j"])
    assert.ok(attend?.statement.includes(value));
  for (const value of ["v_(1,i)", "v_(2,j)", "Aggregate sums"])
    assert.ok(compare?.statement.includes(value));
  for (const value of ["F_intra", "d_(i−j)", "above 10", "[a_i,a′_i]"])
    assert.ok(intra?.statement.includes(value));
  assert.ok(objectiveBoundary?.statement.includes("without the conventional leading minus"));
  assert.ok(objectiveBoundary?.uncertainties[0]?.status === "open");
  assert.ok(
    objectiveBoundary?.evidence
      .filter((item) => item.sourceId.includes("arxiv"))
      .every(
        (item) =>
          item.locator.paragraph ===
          "Unnumbered loss display immediately following equation 5",
      ),
  );
  for (const value of ["O(ℓd² + ℓ²d)", "ℓ < d", "below 80", "at least 300"])
    assert.ok(complexity?.statement.includes(value));
  for (const value of ["88.5/86.3/3.4M", "89.5/86.3/382K", "90.5/86.8/582K"])
    assert.ok(results?.statement.includes(value));
  for (const value of ["83.6/91.3/85.8", "83.7/92.1/86.7"])
    assert.ok(classwise?.statement.includes(value));
  for (const value of ["d_(i−j)", "d_(i−k)", "SPINN-NP", "SPINN-PI"])
    assert.ok(versionBoundary?.statement.includes(value));
  assert.ok(evidenceBoundary?.statement.includes("no component-removal study"));
  assert.ok(work?.limitations.join(" ").includes("about 5.8 times smaller"));
  assert.ok(work?.limitations.join(" ").includes("no measured latency"));
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-parikh-2016-attend-compare-aggregate",
      "expert-parikh-2016-mechanism-complexity-and-versions",
    ],
  );
  assert.ok(objectives[0]?.successCriterion.includes("order-insensitive"));
  assert.ok(objectives[1]?.successCriterion.includes("382K/86.3"));
  assert.deepEqual(
    incomingRelationships.map((relationship) => [
      relationship.id,
      relationship.connectionType,
    ]),
    [
      ["bahdanau-2014-to-parikh-2016", "extends"],
      ["cheng-2016-to-parikh-2016", "builds-on"],
    ],
  );
  for (const relationship of incomingRelationships) {
    assert.equal(relationship.evidenceClass, "documented-influence");
    assert.equal(relationship.confidence, "high");
    assert.equal(relationship.causalLanguage, "qualified");
    assert.ok(
      relationship.sourceEvidence.every(
        (item) => item.sourceId === "parikh-2016-acl-full-text",
      ),
    );
  }
  assert.equal(transformerEdges.length, 0);
});

test("retains ByteNet as a versioned convolutional transduction branch", () => {
  const work = corpus.works.find(
    (item) =>
      item.id === "kalchbrenner-2016-neural-machine-translation-linear-time",
  );
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const sources = new Map(
    corpus.sources
      .filter((source) => source.relatedWorkIds.includes(work?.id))
      .map((source) => [source.id, source]),
  );
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const masked = claims.find(
    (claim) => claim.id === "kalchbrenner-2016-masked-dilated-convolutions",
  );
  const complexity = claims.find(
    (claim) => claim.id === "kalchbrenner-2016-complexity-and-path-analysis",
  );
  const lmSetup = claims.find(
    (claim) => claim.id === "kalchbrenner-2016-character-language-model-setup",
  );
  const translation = claims.find(
    (claim) => claim.id === "kalchbrenner-2016-translation-results",
  );
  const inconsistency = claims.find(
    (claim) => claim.id === "kalchbrenner-2016-canonical-result-inconsistency",
  );
  const versionMechanism = claims.find(
    (claim) => claim.id === "kalchbrenner-2016-version-mechanism-boundary",
  );
  const versionResults = claims.find(
    (claim) => claim.id === "kalchbrenner-2016-version-result-boundary",
  );
  const transformerBoundary = claims.find(
    (claim) => claim.id === "kalchbrenner-2016-transformer-citation-boundary",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );
  const incomingRelationships = corpus.relationships.filter(
    (relationship) =>
      relationship.to.kind === "work" && relationship.to.id === work?.id,
  );
  const transformerEdges = corpus.relationships.filter(
    (relationship) =>
      relationship.from.kind === "work" &&
      relationship.from.id === work?.id &&
      relationship.to.kind === "work" &&
      relationship.to.id === "vaswani-2017-attention-is-all-you-need",
  );

  assert.equal(work?.artifactType, "preprint");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(
    work?.canonicalVersionId,
    "kalchbrenner-2016-arxiv-v2-version",
  );
  assert.equal(work?.versions.length, 2);
  assert.deepEqual(work?.authors, [
    "Nal Kalchbrenner",
    "Lasse Espeholt",
    "Karen Simonyan",
    "Aäron van den Oord",
    "Alex Graves",
    "Koray Kavukcuoglu",
  ]);
  assert.deepEqual(
    work?.chronology.events.map((event) => [event.id, event.date.value]),
    [
      ["kalchbrenner-2016-arxiv-v1-posted", "2016-10-31"],
      ["kalchbrenner-2016-arxiv-v2-posted", "2017-03-15"],
    ],
  );
  assert.equal(
    versions.get("kalchbrenner-2016-arxiv-v1-version")?.bibliography.venue,
    "arXiv",
  );
  assert.deepEqual(
    sources.get("kalchbrenner-2016-arxiv-v1-full-text")?.pagination,
    { scheme: "article", pageStart: 1, pageEnd: 11 },
  );
  assert.deepEqual(
    sources.get("kalchbrenner-2016-arxiv-v2-full-text")?.pagination,
    { scheme: "pdf-page", pageStart: 1, pageEnd: 9 },
  );
  assert.equal(sources.size, 5);
  assert.equal(
    work?.preferredSourceIds.includes("vaswani-2017-neurips-full-text"),
    false,
  );
  assert.deepEqual(sources.get("vaswani-2017-neurips-full-text")?.versionIds, [
    "vaswani-2017-nips-version",
  ]);
  assert.equal(claims.length, 19);
  for (const value of ["1, 2, 4, 8, and 16", "schedule resets"])
    assert.ok(masked?.statement.includes(value));
  for (const value of [
    "c|S| + c|T|",
    "c≈log d",
    "autoregressive decoder generation",
  ])
    assert.ok(complexity?.statement.includes(value));
  for (const value of [
    "30 residual blocks",
    "receptive field 315",
    "500-character",
  ])
    assert.ok(lmSetup?.statement.includes(value));
  assert.ok(
    claims
      .find(
        (claim) =>
          claim.id === "kalchbrenner-2016-character-language-model-results",
      )
      ?.statement.includes("bits per byte while the nearby prose"),
  );
  for (const value of ["23.75/26.26", "0.521/0.532"])
    assert.ok(translation?.statement.includes(value));
  for (const value of ["22.85/25.53", "0.380/0.389", "23.75/26.26"])
    assert.ok(inconsistency?.statement.includes(value));
  assert.equal(inconsistency?.uncertainties[0]?.status, "open");
  for (const value of [
    "Sub-Batch Normalization",
    "1.2|s|",
    "layer normalization",
  ])
    assert.ok(versionMechanism?.statement.includes(value));
  for (const value of ["1.33", "18.9/21.7", "1.31", "23.75/26.26"])
    assert.ok(versionResults?.statement.includes(value));
  for (const value of ["O(logₖ n)", "23.75 BLEU", "does not state"])
    assert.ok(transformerBoundary?.statement.includes(value));
  assert.ok(
    transformerBoundary?.evidence.every(
      (item) => item.sourceId === "vaswani-2017-neurips-full-text",
    ),
  );
  for (const claimId of [
    "kalchbrenner-2016-version-mechanism-boundary",
    "kalchbrenner-2016-version-result-boundary",
  ]) {
    assert.deepEqual(
      claims
        .find((claim) => claim.id === claimId)
        ?.evidence.map((item) => item.sourceId),
      [
        "kalchbrenner-2016-arxiv-v1-full-text",
        "kalchbrenner-2016-arxiv-v2-full-text",
      ],
    );
  }
  assert.ok(
    work?.limitations.join(" ").includes("generation remains autoregressive"),
  );
  assert.ok(work?.limitations.join(" ").includes("315-character"));
  assert.ok(work?.limitations.join(" ").includes("internally inconsistent"));
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-kalchbrenner-2016-follow-dilated-convolution",
      "expert-kalchbrenner-2016-architecture-complexity-and-versions",
    ],
  );
  assert.deepEqual(
    incomingRelationships.map((relationship) => [
      relationship.id,
      relationship.connectionType,
    ]),
    [
      ["cho-2014-to-kalchbrenner-2016", "extends"],
      ["sutskever-2014-to-kalchbrenner-2016", "extends"],
      ["bahdanau-2014-to-kalchbrenner-2016", "addresses"],
    ],
  );
  for (const relationship of incomingRelationships) {
    assert.equal(relationship.evidenceClass, "documented-influence");
    assert.equal(relationship.confidence, "high");
  }
  assert.equal(incomingRelationships[0]?.causalLanguage, "qualified");
  assert.equal(incomingRelationships[1]?.causalLanguage, "qualified");
  assert.equal(incomingRelationships[2]?.causalLanguage, "prohibited");
  assert.equal(transformerEdges.length, 0);
});

test("retains ConvS2S as a versioned convolutional attention branch", () => {
  const workId =
    "gehring-2017-convolutional-sequence-to-sequence-learning";
  const work = corpus.works.find((item) => item.id === workId);
  const versions = new Map(
    work?.versions.map((version) => [version.id, version]),
  );
  const sources = new Map(
    corpus.sources
      .filter((source) => source.relatedWorkIds.includes(workId))
      .map((source) => [source.id, source]),
  );
  const claims = corpus.claims.filter((claim) => claim.workId === workId);
  const versionBoundary = claims.find(
    (claim) => claim.id === "gehring-2017-version-result-boundary",
  );
  const translation = claims.find(
    (claim) => claim.id === "gehring-2017-translation-results",
  );
  const ensembles = claims.find(
    (claim) => claim.id === "gehring-2017-ensemble-results",
  );
  const attention = claims.find(
    (claim) => claim.id === "gehring-2017-layerwise-multi-step-attention",
  );
  const data = claims.find(
    (claim) => claim.id === "gehring-2017-data-and-tokenization",
  );
  const speed = claims.find(
    (claim) => claim.id === "gehring-2017-generation-speed-boundary",
  );
  const transformerBoundary = claims.find(
    (claim) => claim.id === "gehring-2017-transformer-citation-boundary",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(workId),
  );
  const incomingRelationships = corpus.relationships.filter(
    (relationship) =>
      relationship.to.kind === "work" && relationship.to.id === workId,
  );
  const transformerEdge = corpus.relationships.find(
    (relationship) => relationship.id === "gehring-2017-to-vaswani-2017",
  );

  assert.equal(work?.artifactType, "conference-paper");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "gehring-2017-icml-version");
  assert.deepEqual(work?.authors, [
    "Jonas Gehring",
    "Michael Auli",
    "David Grangier",
    "Denis Yarats",
    "Yann N. Dauphin",
  ]);
  assert.deepEqual(
    work?.chronology.events.map((event) => [event.id, event.date.value]),
    [
      ["gehring-2017-arxiv-v1-posted", "2017-05-08"],
      ["gehring-2017-arxiv-v2-posted", "2017-05-12"],
      ["gehring-2017-icml-proceedings", "2017-07-17"],
      ["gehring-2017-arxiv-v3-posted", "2017-07-25"],
    ],
  );
  const proceedingsEvent = work?.chronology.events.find(
    (event) => event.id === "gehring-2017-icml-proceedings",
  );
  assert.equal(proceedingsEvent?.date.precision, "day");
  assert.equal(
    proceedingsEvent?.dateEvidence[0]?.sourceId,
    "gehring-2017-pmlr-volume-record",
  );
  assert.equal(work?.versions.length, 4);
  assert.deepEqual(
    versions.get("gehring-2017-icml-version")?.bibliography.pages,
    ["1243-1252"],
  );
  assert.deepEqual(sources.get("gehring-2017-pmlr-full-text")?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 10,
  });
  assert.deepEqual(
    sources.get("gehring-2017-pmlr-supplement")?.pagination,
    { scheme: "pdf-page", pageStart: 1, pageEnd: 4 },
  );
  assert.deepEqual(sources.get("gehring-2017-arxiv-v2-full-text")?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 15,
  });
  assert.equal(sources.size, 13);
  assert.equal(
    sources.get("gehring-2017-pmlr-volume-record")?.url,
    "https://proceedings.mlr.press/v70/",
  );
  assert.equal(claims.length, 20);
  for (const value of [
    "dᵢˡ = W_dˡhᵢˡ + b_dˡ + gᵢ",
    "cᵢˡ = Σⱼaᵢⱼˡ(zⱼᵘ + eⱼ)",
    "fixed stack of source-attention hops",
  ])
    assert.ok(attention?.statement.includes(value));
  for (const value of ["29.45", "30.02", "25.16", "40.51"])
    assert.ok(translation?.statement.includes(value));
  for (const value of ["26.43", "41.44", "41.62", "English–French"])
    assert.ok(ensembles?.statement.includes(value));
  for (const value of [
    "English–Romanian uses a joint source–target 40K BPE vocabulary",
    "English–German uses 40K BPE types",
    "English–French uses separate 40K-BPE source and target vocabularies",
  ])
    assert.ok(data?.statement.includes(value));
  assert.ok(speed?.statement.includes("6,003-sentence English–French"));
  assert.ok(speed?.statement.includes("newstest2012 and newstest2013"));
  for (const value of [
    "v1 reports 29.88 Romanian and 40.46 French with no ensembles",
    "v2 adds 26.36 German and 41.29 French ensembles",
    "v3 and PMLR update Romanian/French single results to 30.02/40.51",
    "published prose resolves v3’s ambiguous dataset wording",
  ])
    assert.ok(versionBoundary?.statement.includes(value));
  for (const value of [
    "linear arbitrary-position path",
    "names learned positional embeddings as an alternative",
    "v2-era 25.16/40.46 single and 26.36/41.29 ensemble",
    "Transformer v2 and the canonical proceedings paper later test",
    "not adoption of ConvS2S’s convolution, GLU, or layerwise-hop architecture",
  ])
    assert.ok(transformerBoundary?.statement.includes(value));
  assert.deepEqual(
    transformerBoundary?.evidence.map((item) => item.sourceId),
    [
      "vaswani-2017-arxiv-v1-full-text",
      "vaswani-2017-arxiv-v2-full-text",
      "vaswani-2017-neurips-full-text",
    ],
  );
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-gehring-2017-follow-convolution-and-attention-hops",
      "expert-gehring-2017-mechanism-results-and-versions",
    ],
  );
  assert.deepEqual(
    incomingRelationships.map((relationship) => [
      relationship.id,
      relationship.connectionType,
      relationship.evidenceClass,
      relationship.causalLanguage,
    ]),
    [
      [
        "bahdanau-2014-to-gehring-2017",
        "extends",
        "documented-influence",
        "qualified",
      ],
      [
        "luong-2015-to-gehring-2017",
        "builds-on",
        "documented-influence",
        "qualified",
      ],
      [
        "sukhbaatar-2015-to-gehring-2017",
        "conceptual-parallel",
        "editorial-synthesis",
        "prohibited",
      ],
    ],
  );
  assert.deepEqual(transformerEdge?.from, { kind: "work", id: workId });
  assert.deepEqual(transformerEdge?.to, {
    kind: "work",
    id: "vaswani-2017-attention-is-all-you-need",
  });
  assert.equal(transformerEdge?.connectionType, "builds-on");
  assert.equal(transformerEdge?.evidenceClass, "documented-influence");
  assert.equal(transformerEdge?.causalLanguage, "qualified");
  assert.ok(transformerEdge?.rationale.includes("excludes causal claims"));
  assert.ok(
    transformerEdge?.claimIds.includes(
      "vaswani-2017-attention-routes-and-causal-mask",
    ),
  );
  assert.equal(
    transformerEdge?.claimIds.includes(
      "gehring-2017-layerwise-multi-step-attention",
    ),
    false,
  );
  assert.deepEqual(
    transformerEdge?.sourceEvidence.map((item) => item.sourceId),
    [
      "vaswani-2017-arxiv-v1-full-text",
      "vaswani-2017-arxiv-v2-full-text",
      "vaswani-2017-neurips-full-text",
    ],
  );
  assert.ok(
    work?.limitations.join(" ").includes("beam decoding remains left-to-right"),
  );
  assert.ok(work?.limitations.join(" ").includes("25 prior target words"));
  assert.ok(work?.limitations.join(" ").includes("different GPU generations"));
});

test("retains the complete six-node Transformer convergence gate", () => {
  const predecessorWorkIds = [
    "sukhbaatar-2015-end-to-end-memory-networks",
    "luong-pham-manning-2015-effective-attention-nmt",
    "cheng-dong-lapata-2016-lstmn-machine-reading",
    "parikh-2016-decomposable-attention-nli",
    "kalchbrenner-2016-neural-machine-translation-linear-time",
    "gehring-2017-convolutional-sequence-to-sequence-learning",
  ];
  const transformerWorkId = "vaswani-2017-attention-is-all-you-need";
  const convergenceWorkIds = [...predecessorWorkIds, transformerWorkId];

  assert.deepEqual(
    corpus.works
      .filter((work) => convergenceWorkIds.includes(work.id))
      .map((work) => work.id),
    convergenceWorkIds,
  );
  for (const workId of predecessorWorkIds) {
    assert.ok(corpus.works.some((work) => work.id === workId));
  }
  assert.deepEqual(
    corpus.relationships
      .filter(
      (relationship) =>
        relationship.to.kind === "work" &&
        relationship.to.id === transformerWorkId,
      )
      .map((relationship) => relationship.id),
    ["gehring-2017-to-vaswani-2017"],
  );
  assert.ok(historicalScope.includes("All six required predecessor nodes"));
  assert.ok(historicalScope.includes("ByteNet"));
  assert.ok(historicalScope.includes("ConvS2S"));
  assert.ok(
    historicalScope.includes("learned positional-embedding alternative"),
  );
  assert.ok(
    historicalScope.includes(
      "does not make ConvS2S the cause of core self-attention",
    ),
  );
  assert.equal(
    historicalScope.includes("Cheng and Parikh still require full treatment"),
    false,
  );
});

test("retains the Transformer as a canonical proceedings node with revision boundaries", () => {
  const work = corpus.works.find(
    (item) => item.id === "vaswani-2017-attention-is-all-you-need",
  );
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const sources = new Map(
    corpus.sources
      .filter((source) => source.relatedWorkIds.includes(work?.id))
      .map((source) => [source.id, source]),
  );
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const predecessorBoundary = claims.find(
    (claim) => claim.id === "vaswani-2017-predecessor-and-scope-boundary",
  );
  const complexity = claims.find(
    (claim) => claim.id === "vaswani-2017-complexity-and-path-analysis",
  );
  const data = claims.find(
    (claim) => claim.id === "vaswani-2017-data-and-tokenization",
  );
  const training = claims.find(
    (claim) => claim.id === "vaswani-2017-training-regime",
  );
  const translation = claims.find(
    (claim) => claim.id === "vaswani-2017-translation-results",
  );
  const variations = claims.find(
    (claim) => claim.id === "vaswani-2017-model-variation-results",
  );
  const versionResults = claims.find(
    (claim) => claim.id === "vaswani-2017-version-result-boundary",
  );
  const parsing = claims.find(
    (claim) => claim.id === "vaswani-2017-arxiv-parsing-results",
  );
  const versionMechanism = claims.find(
    (claim) => claim.id === "vaswani-2017-version-mechanism-boundary",
  );
  const reproducibility = claims.find(
    (claim) => claim.id === "vaswani-2017-evidence-reproducibility-boundary",
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );
  const incomingRelationships = corpus.relationships.filter(
    (relationship) =>
      relationship.to.kind === "work" && relationship.to.id === work?.id,
  );
  const outgoingRelationships = corpus.relationships.filter(
    (relationship) =>
      relationship.from.kind === "work" && relationship.from.id === work?.id,
  );

  assert.equal(work?.artifactType, "conference-paper");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "vaswani-2017-nips-version");
  assert.equal(work?.versions.length, 8);
  assert.deepEqual(work?.authors, [
    "Ashish Vaswani",
    "Noam Shazeer",
    "Niki Parmar",
    "Jakob Uszkoreit",
    "Llion Jones",
    "Aidan N. Gomez",
    "Łukasz Kaiser",
    "Illia Polosukhin",
  ]);
  assert.deepEqual(
    work?.chronology.events.map((event) => [event.id, event.date.value]),
    [
      ["vaswani-2017-arxiv-v1-posted", "2017-06-12"],
      ["vaswani-2017-arxiv-v2-posted", "2017-06-19"],
      ["vaswani-2017-arxiv-v3-posted", "2017-06-20"],
      ["vaswani-2017-arxiv-v4-posted", "2017-06-30"],
      ["vaswani-2017-arxiv-v5-posted", "2017-12-06"],
      ["vaswani-2017-nips-proceedings", "2017"],
      ["vaswani-2017-arxiv-v6-posted", "2023-07-24"],
      ["vaswani-2017-arxiv-v7-posted", "2023-08-02"],
    ],
  );
  assert.equal(
    work?.chronology.events.find(
      (event) => event.id === "vaswani-2017-arxiv-v5-posted",
    )?.label,
    "arXiv version 5 posted",
  );
  assert.deepEqual(
    versions.get("vaswani-2017-nips-version")?.bibliography.pages,
    ["5998-6008"],
  );
  assert.deepEqual(sources.get("vaswani-2017-neurips-full-text")?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 11,
  });
  assert.deepEqual(sources.get("vaswani-2017-arxiv-v2-full-text")?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 16,
  });
  assert.equal(sources.size, 12);
  assert.equal(claims.length, 18);
  for (const value of [
    "cites Luong et al. only within a group of efforts advancing recurrent",
    "identifies Parikh et al. among the few attention cases not coupled to recurrence",
    "includes Cheng in the prior self-/intra-attention task citation sequence",
    "includes Parikh in the same sequence alongside textual entailment",
    "cites End-To-End Memory Networks as recurrent attention",
    "groups ByteNet with convolutional efforts",
    "directly contrasts ConvS2S",
    "tests its cited learned positional-embedding alternative",
    "scaled-dot-product paragraph does not cite Luong",
    "none of these contextual or contrastive citations states that the Transformer adopts",
    "contextual and contrastive",
  ])
    assert.ok(
      `${predecessorBoundary?.statement} ${predecessorBoundary?.limitations.join(" ")}`.includes(
        value,
      ),
    );
  assert.deepEqual(
    predecessorBoundary?.evidence.map((item) => item.sourceId),
    [
      "vaswani-2017-neurips-full-text",
      "vaswani-2017-neurips-full-text",
      "vaswani-2017-neurips-full-text",
      "vaswani-2017-arxiv-v1-full-text",
      "vaswani-2017-arxiv-v2-full-text",
      "vaswani-2017-arxiv-v3-full-text",
      "vaswani-2017-arxiv-v4-full-text",
      "vaswani-2017-arxiv-v5-full-text",
      "vaswani-2017-arxiv-v6-full-text",
      "vaswani-2017-arxiv-v7-full-text",
      "vaswani-2017-neurips-full-text",
    ],
  );
  assert.ok(
    predecessorBoundary?.limitations
      .join(" ")
      .includes("absent from Transformer arXiv versions 1–4"),
  );
  assert.ok(
    predecessorBoundary?.limitations
      .join(" ")
      .includes("first appears in version 5"),
  );
  for (const value of [
    "full self-attention O(n²d) layer complexity, O(1) sequential operations, and O(1) maximum path length",
    "recurrence O(nd²), O(n), and O(n)",
    "convolution O(knd²), O(1), and O(logₖ n)",
    "restricted self-attention O(rnd), O(1), and O(n/r)",
    "O(n/k) depth for contiguous",
    "O(logₖ n) for dilated",
  ])
    assert.ok(complexity?.statement.includes(value));
  for (const value of [
    "4.5 million",
    "37,000",
    "36 million",
    "32,000",
    "25,000 source",
    "25,000 target",
  ])
    assert.ok(data?.statement.includes(value));
  for (const value of [
    "eight P100",
    "0.4 seconds",
    "100,000 steps or 12 hours",
    "1.0 second",
    "300,000 steps or 3.5 days",
    "β₁ = 0.9",
    "β₂ = 0.98",
    "ε = 10⁻⁹",
    "dmodel⁻⁰·⁵·min(step⁻⁰·⁵, step·warmup⁻¹·⁵)",
    "4,000 warmup",
    "both 0.1",
    "dropout 0.3",
    "English–French big run uses 0.1",
  ])
    assert.ok(training?.statement.includes(value));
  assert.ok(
    training?.limitations
      .join(" ")
      .includes("Versions 1–4 retain an attention-dropout definition"),
  );
  assert.ok(
    training?.limitations
      .join(" ")
      .includes("versions 5–7 still refer to tuning attention dropout"),
  );
  for (const value of [
    "On newstest2014",
    "ByteNet 23.75",
    "Deep-Att + PosUnk 39.2",
    "GNMT + RL 24.6/39.92",
    "ConvS2S 25.16/40.46",
    "MoE 26.03/40.56",
    "Deep-Att + PosUnk ensemble 40.4",
    "GNMT + RL ensemble 26.30/41.16",
    "ConvS2S ensemble 26.36/41.29",
    "Transformer base 27.3/38.1",
    "Transformer big 28.4/41.0",
    "1.0×10²⁰",
    "2.3×10¹⁹/1.4×10²⁰",
    "9.6×10¹⁸/1.5×10²⁰",
    "2.0×10¹⁹/1.2×10²⁰",
    "8.0×10²⁰",
    "1.8×10²⁰/1.1×10²¹",
    "7.7×10¹⁹/1.2×10²¹",
    "3.3×10¹⁸ base",
    "2.3×10¹⁹ big",
  ])
    assert.ok(translation?.statement.includes(value));
  for (const value of [
    "last five ten-minute checkpoints",
    "last twenty",
    "beam size 4",
    "length penalty 0.6",
  ])
    assert.ok(translation?.limitations.join(" ").includes(value));
  for (const value of [
    "input-plus-50 maximum output",
    "early termination",
    "development-set tuning",
  ])
    assert.ok(translation?.evidence[0].support.includes(value));
  for (const value of [
    "newstest2013 with beam decoding and no checkpoint averaging",
    "base N = 6, dmodel = 512, dff = 2048, h = 8, dk = dv = 64, dropout 0.1, label smoothing 0.1, and 100K steps at 4.92 PPL/25.8 BLEU/65M",
    "h = 1, 4, 16, 32 with dk = dv = 512, 128, 32, 16 at 5.29/24.9, 5.00/25.5, 4.91/25.8, and 5.01/25.4",
    "dk = 16 and 32 at 5.16/25.1/58M and 5.01/25.4/60M, with dv = 64 inherited",
    "N = 2, 4, 8 at 6.11/23.7/36M, 5.19/25.3/50M, and 4.88/25.5/80M",
    "dmodel = 256 with dk = dv = 32 and dmodel = 1024 with dk = dv = 128 at 5.75/24.5/28M and 4.66/26.0/168M",
    "dff = 1024 and 4096 at 5.12/25.4/53M and 4.75/26.2/90M",
    "dropout 0 and 0.2 at 5.77/24.6 and 4.95/25.5",
    "label smoothing 0 and 0.2 at 4.67/25.3 and 5.47/25.7",
    "learned positions at 4.92/25.7",
    "big N = 6, dmodel = 1024, dff = 4096, h = 16, dk = dv = 64, dropout 0.3, label smoothing 0.1, and 300K steps at 4.33/26.4/213M",
  ])
    assert.ok(variations?.statement.includes(value));
  assert.ok(variations?.evidence[0].support.includes("per-wordpiece PPL"));
  assert.ok(variations?.limitations.join(" ").includes("26.4 is a newstest2013 development result"));
  assert.ok(variations?.limitations.join(" ").includes("28.4 newstest2014 test result"));
  for (const value of [
    "four-layer dmodel = 1024",
    "40,000 WSJ",
    "17 million",
    "16,000- or 32,000-token",
    "Only a small number of Section 22 experiments selected attention and residual dropout, learning rates, and beam size",
    "all other parameters inherited from the English–German base model",
    "beam 21",
    "length penalty 0.3",
    "input-plus-300",
    "On WSJ Section 23",
    "F1 rows",
    "Vinyals and Kaiser et al. WSJ-only discriminative 88.3",
    "Petrov et al. WSJ-only discriminative 90.4",
    "Zhu et al. WSJ-only discriminative 90.4",
    "Dyer et al. WSJ-only discriminative 91.7",
    "Transformer WSJ-only discriminative 91.3",
    "Zhu et al. semi-supervised 91.3",
    "Huang and Harper semi-supervised 91.3",
    "McClosky et al. semi-supervised 92.1",
    "Vinyals and Kaiser et al. semi-supervised 92.1",
    "Transformer semi-supervised 92.7",
    "Luong et al. multi-task 93.0",
    "Dyer et al. generative 93.3",
  ])
    assert.ok(parsing?.statement.includes(value));
  assert.deepEqual(
    parsing?.evidence.map((evidence) => evidence.sourceId),
    ["vaswani-2017-arxiv-v7-full-text"],
  );
  assert.ok(parsing?.limitations.join(" ").includes("do not occur in the canonical proceedings PDF"));
  assert.ok(parsing?.limitations.join(" ").includes("Versions 5–7 add the 93.0 Luong row"));
  for (const value of [
    "omits Wᴼ",
    "base dff = 1024 in Table 3 despite 2048",
    "base 4.92/25.8/65M/12h",
    "AOP1 4.92/25.5/65M/16h",
    "AOP2 4.86/25.9/65M/16h",
    "AOP2 is hₚ = 16 in Table 5 but hₚ = 8 in prose",
    "Version 4 and the proceedings remove that appendix",
  ])
    assert.ok(versionMechanism?.statement.includes(value));
  for (const value of [
    "Version 1 prints 41.0 BLEU and 3.5 days consistently",
    "Version 2 prints 41.2/4.5 days in the abstract",
    "41.17 in Section 6.1 with dff = 8192 and unshared source/target embeddings",
    "41.0 in Table 2",
    "3.5 days in the generic schedule",
    "Version 3 restores 41.0/3.5 in the abstract but retains 41.17",
    "Version 4 reconciles 41.0",
    "Versions 5–7 print 41.8 in the abstract and Table 2 but 41.0 in Section 6.1",
    "canonical proceedings text consistently prints 41.0 and 3.5 days",
  ])
    assert.ok(versionResults?.statement.includes(value));
  assert.ok(
    reproducibility?.statement.includes(
      "released checkpoints or immutable checkpoint identifiers",
    ),
  );
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-vaswani-2017-follow-attention-routes",
      "expert-vaswani-2017-mechanism-results-and-versions",
    ],
  );
  assert.ok(objectives[0]?.successCriterion.includes("future decoder positions"));
  assert.ok(objectives[1]?.successCriterion.includes("proceedings 41.0"));
  assert.deepEqual(
    incomingRelationships.map((relationship) => [
      relationship.id,
      relationship.connectionType,
      relationship.evidenceClass,
      relationship.causalLanguage,
    ]),
    [
      [
        "gehring-2017-to-vaswani-2017",
        "builds-on",
        "documented-influence",
        "qualified",
      ],
    ],
  );
  assert.ok(
    incomingRelationships[0]?.rationale.includes("excludes causal claims"),
  );
  assert.deepEqual(
    outgoingRelationships.map((relationship) => [
      relationship.id,
      relationship.connectionType,
      relationship.evidenceClass,
      relationship.causalLanguage,
    ]),
    [
      [
        "vaswani-2017-to-radford-2018",
        "builds-on",
        "documented-influence",
        "qualified",
      ],
      [
        "vaswani-2017-to-devlin-2018",
        "builds-on",
        "documented-influence",
        "qualified",
      ],
      [
        "vaswani-2017-to-dai-2019",
        "extends",
        "documented-influence",
        "qualified",
      ],
      [
        "vaswani-2017-to-radford-2019",
        "builds-on",
        "documented-influence",
        "qualified",
      ],
      [
        "vaswani-2017-to-yang-2019",
        "builds-on",
        "documented-influence",
        "qualified",
      ],
      [
        "vaswani-2017-to-liu-2019",
        "builds-on",
        "documented-influence",
        "qualified",
      ],
      [
        "vaswani-2017-to-raffel-2019",
        "builds-on",
        "documented-influence",
        "qualified",
      ],
    ],
  );
});

test("retains ELMo as a four-version frozen contextual-feature bridge", () => {
  const work = corpus.works.find(
    (item) => item.id === "peters-2017-deep-contextualized-word-representations",
  );
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const sources = corpus.sources.filter((source) =>
    source.relatedWorkIds.includes(work?.id),
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );
  const objective = claims.find(
    (claim) => claim.id === "peters-2017-bidirectional-lm-objectives",
  );
  const mixture = claims.find(
    (claim) => claim.id === "peters-2017-task-specific-layer-mixture",
  );
  const results = claims.find(
    (claim) => claim.id === "peters-2017-six-task-results",
  );
  const boundary = claims.find(
    (claim) => claim.id === "peters-2017-version-boundary",
  );
  const domainAdaptation = claims.find(
    (claim) => claim.id === "peters-2017-domain-adaptation",
  );
  const lstmEdge = corpus.relationships.find(
    (relationship) =>
      relationship.id === "hochreiter-schmidhuber-1995-to-peters-2017",
  );

  assert.equal(work?.artifactType, "conference-paper");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "peters-2018-naacl-version");
  assert.deepEqual(
    work?.chronology.events.map((event) => [event.id, event.date.value]),
    [
      ["peters-2017-openreview-posted", "2017-10-27"],
      ["peters-2018-arxiv-v1-posted", "2018-02-15"],
      ["peters-2018-arxiv-v2-posted", "2018-03-22"],
      ["peters-2018-naacl-proceedings", "2018-06"],
    ],
  );
  assert.deepEqual(
    work?.versions.map((version) => [version.id, version.title]),
    [
      ["peters-2017-openreview-version", "Deep Contextualized Word Representations"],
      ["peters-2018-arxiv-v1-version", "Deep contextualized word representations"],
      ["peters-2018-arxiv-v2-version", "Deep contextualized word representations"],
      ["peters-2018-naacl-version", "Deep Contextualized Word Representations"],
    ],
  );
  assert.deepEqual(
    work?.versions.find((version) => version.id === work.canonicalVersionId)
      ?.bibliography.pages,
    ["2227-2237"],
  );
  assert.equal(sources.length, 10);
  assert.equal(claims.length, 14);
  assert.deepEqual(
    new Set(objectives.map((item) => item.mode)),
    new Set(["beginner", "expert"]),
  );
  assert.ok(objective?.statement.includes("forward language model"));
  assert.ok(objective?.statement.includes("backward language model"));
  assert.ok(objective?.limitations.join(" ").includes("not masked-language-model"));
  assert.ok(mixture?.statement.includes("softmax-normalized scalar mixture"));
  assert.ok(mixture?.statement.includes("L2 penalty"));
  assert.ok(results?.statement.includes("SQuAD F1 81.1→85.8"));
  assert.ok(results?.statement.includes("SST-5 accuracy 51.4→54.7±0.5"));
  assert.deepEqual(
    boundary?.evidence.map((item) => item.sourceId),
    [
      "peters-2017-openreview-full-text",
      "peters-2018-arxiv-v1-full-text",
      "peters-2018-arxiv-v2-full-text",
      "peters-2018-naacl-full-text",
    ],
  );
  assert.equal(
    boundary?.evidence.find(
      (item) => item.sourceId === "peters-2017-openreview-full-text",
    )?.locator.table,
    "1, 2, and 6",
  );
  assert.deepEqual(domainAdaptation?.evidence[0]?.locator, {
    label: "Optional task-domain LM adaptation and downstream effect",
    section: "A.1 Fine tuning biLM",
    table: "8",
  });
  assert.equal(lstmEdge?.connectionType, "builds-on");
  assert.equal(lstmEdge?.evidenceClass, "documented-influence");
  assert.equal(lstmEdge?.causalLanguage, "qualified");
});

test("retains ULMFiT corrections without rewriting the canonical ACL article", () => {
  const work = corpus.works.find(
    (item) =>
      item.id === "howard-ruder-2018-universal-language-model-fine-tuning",
  );
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const claims = corpus.claims.filter((claim) => claim.workId === work?.id);
  const sources = corpus.sources.filter((source) =>
    source.relatedWorkIds.includes(work?.id),
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(work?.id),
  );
  const boundary = claims.find(
    (claim) => claim.id === "howard-ruder-2018-version-boundary",
  );
  const schedule = claims.find(
    (claim) => claim.id === "howard-ruder-2018-corrected-stlr",
  );
  const transfer = claims.find(
    (claim) => claim.id === "howard-ruder-2018-three-stage-transfer",
  );
  const lowShot = claims.find(
    (claim) => claim.id === "howard-ruder-2018-low-shot-results",
  );
  const mainResults = claims.find(
    (claim) => claim.id === "howard-ruder-2018-main-results",
  );
  const ensemble = claims.find(
    (claim) => claim.id === "howard-ruder-2018-forward-backward-ensemble",
  );
  const pretrainingAblations = claims.find(
    (claim) =>
      claim.id === "howard-ruder-2018-pretraining-and-architecture-ablations",
  );
  const lmFineTuningAblation = claims.find(
    (claim) => claim.id === "howard-ruder-2018-lm-fine-tuning-ablation",
  );
  const classifierAblation = claims.find(
    (claim) => claim.id === "howard-ruder-2018-classifier-ablation",
  );
  const beginnerObjective = objectives.find(
    (objective) => objective.mode === "beginner",
  );
  const expertObjective = objectives.find(
    (objective) => objective.mode === "expert",
  );
  const boundaryEvidence = new Map(
    boundary?.evidence.map((item) => [item.sourceId, item]) ?? [],
  );

  assert.equal(work?.artifactType, "conference-paper");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "howard-ruder-2018-acl-version");
  assert.deepEqual(
    work?.chronology.events.map((event) => event.date.value),
    [
      "2018-01-18",
      "2018-05-14",
      "2018-05-15",
      "2018-05-17",
      "2018-05-23",
      "2018-07",
    ],
  );
  assert.equal(
    versions.get("howard-ruder-2018-arxiv-v1-version")?.title,
    "Fine-tuned Language Models for Text Classification",
  );
  assert.deepEqual(
    versions.get("howard-ruder-2018-acl-version")?.bibliography.pages,
    ["328-339"],
  );
  assert.ok(
    versions
      .get("howard-ruder-2018-acl-version")
      ?.notes.includes("preserves version 2's 4.57"),
  );
  assert.equal(sources.length, 10);
  assert.equal(claims.length, 15);
  assert.deepEqual(
    new Set(objectives.map((item) => item.mode)),
    new Set(["beginner", "expert"]),
  );
  for (const value of [
    "Version 1 is the nine-page",
    "Version 3 corrects Table 7",
    "version 4 corrects a reversed",
    "version 5 corrects Equation 3",
    "canonical ACL article preserves all three",
  ])
    assert.ok(boundary?.statement.includes(value));
  assert.equal(
    boundaryEvidence.get("howard-ruder-2018-arxiv-v1-full-text")?.locator
      .section,
    "Title; 4 Fine-tuned Language Models (FitLaM); 5 Experiments",
  );
  assert.equal(
    boundaryEvidence.get("howard-ruder-2018-arxiv-v3-full-text")?.locator
      .section,
    "5 Analysis — Impact of classifier fine-tuning",
  );
  assert.equal(
    boundaryEvidence.get("howard-ruder-2018-acl-full-text")?.locator.section,
    "2 Related Work; 3.2 Target task LM fine-tuning; 5 Analysis — Impact of classifier fine-tuning",
  );
  assert.deepEqual(
    schedule?.evidence.map((item) => item.sourceId),
    [
      "howard-ruder-2018-arxiv-v5-full-text",
      "howard-ruder-2018-acl-full-text",
    ],
  );
  assert.ok(schedule?.statement.includes("cut·(1/cut_frac−1)"));
  assert.ok(schedule?.statement.includes("ACL denominator cut·(ratio−1)"));
  assert.ok(transfer?.statement.includes("three stages"));
  assert.ok(lowShot?.statement.includes("50,000 unlabeled IMDb"));
  assert.ok(lowShot?.statement.includes("100,000 unlabeled AG"));
  assert.equal(
    lowShot?.evidence[0]?.locator.section,
    "5 Analysis — Low-shot learning",
  );
  assert.equal(mainResults?.evidence[0]?.locator.section, "4.2 Results");
  assert.equal(
    ensemble?.evidence[0]?.locator.section,
    "5 Analysis — Impact of bidirectionality",
  );
  assert.deepEqual(
    {
      section: pretrainingAblations?.evidence[0]?.locator.section,
      pageStart: pretrainingAblations?.evidence[0]?.locator.pageStart,
      pageEnd: pretrainingAblations?.evidence[0]?.locator.pageEnd,
    },
    {
      section: "5 Analysis — Impact of pretraining; Impact of LM quality",
      pageStart: 334,
      pageEnd: 335,
    },
  );
  assert.equal(
    lmFineTuningAblation?.evidence[0]?.locator.section,
    "5 Analysis — Impact of LM fine-tuning",
  );
  assert.equal(
    classifierAblation?.evidence[0]?.locator.section,
    "5 Analysis — Impact of classifier fine-tuning",
  );
  assert.ok(classifierAblation?.statement.startsWith("Corrected arXiv version 3"));
  assert.ok(beginnerObjective?.objective.includes("contrast ELMo's frozen"));
  assert.ok(beginnerObjective?.successCriterion.includes("shared with ELMo"));
  assert.ok(expertObjective?.objective.includes("three post-v2 corrections"));
});

test("keeps the ELMo to ULMFiT transfer fork chronological and noncausal", () => {
  const workIds = [
    "vaswani-2017-attention-is-all-you-need",
    "peters-2017-deep-contextualized-word-representations",
    "howard-ruder-2018-universal-language-model-fine-tuning",
  ];
  const edge = corpus.relationships.find(
    (relationship) => relationship.id === "peters-2017-to-howard-ruder-2018",
  );

  assert.deepEqual(
    corpus.works
      .filter((work) => workIds.includes(work.id))
      .map((work) => work.id),
    workIds,
  );
  assert.deepEqual(edge?.from, {
    kind: "work",
    id: "peters-2017-deep-contextualized-word-representations",
  });
  assert.deepEqual(edge?.to, {
    kind: "work",
    id: "howard-ruder-2018-universal-language-model-fine-tuning",
  });
  assert.equal(edge?.connectionType, "addresses");
  assert.equal(edge?.evidenceClass, "documented-influence");
  assert.equal(edge?.causalLanguage, "prohibited");
  assert.ok(edge?.claimIds.includes("peters-2017-frozen-feature-transfer"));
  assert.ok(edge?.claimIds.includes("howard-ruder-2018-elmo-contrast"));
  assert.ok(edge?.rationale.includes("Both methods can first adapt"));
  assert.ok(edge?.rationale.includes("supervised fine-tuning"));
  assert.ok(edge?.rationale.includes("not priority"));
  assert.ok(edge?.rationale.includes("causation"));
});

test("retains the GPT preprint as causal Transformer pretraining and full-model transfer", () => {
  const workId =
    "radford-2018-improving-language-understanding-generative-pre-training";
  const work = corpus.works.find((item) => item.id === workId);
  const claims = corpus.claims.filter((claim) => claim.workId === workId);
  const sources = corpus.sources.filter((source) =>
    source.relatedWorkIds.includes(workId),
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(workId),
  );
  const fullText = sources.find(
    (source) => source.id === "radford-2018-openai-preprint-full-text",
  );
  const transfer = claims.find(
    (claim) => claim.id === "radford-2018-two-stage-generative-transfer",
  );
  const architecture = claims.find(
    (claim) => claim.id === "radford-2018-decoder-only-transformer-architecture",
  );
  const ablation = claims.find(
    (claim) => claim.id === "radford-2018-ablation-results",
  );
  const layerTransfer = claims.find(
    (claim) => claim.id === "radford-2018-layer-transfer-analysis",
  );
  const evidenceBoundary = claims.find(
    (claim) => claim.id === "radford-2018-code-and-evidence-boundary",
  );

  assert.equal(work?.artifactType, "preprint");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(
    work?.canonicalVersionId,
    "radford-2018-openai-preprint-version",
  );
  assert.deepEqual(
    work?.chronology.events.map((event) => [
      event.id,
      event.kind,
      event.date.value,
    ]),
    [["radford-2018-openai-release", "preprint", "2018-06-11"]],
  );
  assert.deepEqual(
    work?.versions.map((version) => [
      version.id,
      version.kind,
      version.bibliography.pages,
      version.bibliography.identifiers,
    ]),
    [["radford-2018-openai-preprint-version", "preprint", [], []]],
  );
  assert.equal(sources.length, 4);
  assert.equal(claims.length, 15);
  assert.deepEqual(fullText?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 12,
  });
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-radford-2018-pretrain-serialize-finetune",
      "expert-radford-2018-objectives-transfer-and-evidence",
    ],
  );
  assert.ok(transfer?.statement.includes("causal language-model likelihood L1"));
  assert.ok(
    transfer?.limitations.join(" ").includes("target-domain language-model"),
  );
  assert.ok(architecture?.statement.includes("twelve-layer decoder-only"));
  assert.ok(ablation?.statement.includes("75.0 with four higher and four lower"));
  assert.ok(layerTransfer?.statement.includes("up to 9%"));
  assert.ok(
    layerTransfer?.limitations
      .join(" ")
      .includes("percentage points or relative percent"),
  );
  assert.ok(
    evidenceBoundary?.statement.includes("Preprint. Work in progress"),
  );
  assert.ok(
    evidenceBoundary?.limitations.join(" ").includes("ROCStories only"),
  );
  assert.ok(
    work?.significance.beginner.includes("boundary and delimiter-token embeddings"),
  );
  assert.ok(
    objectives
      .find((objective) => objective.mode === "expert")
      ?.successCriterion.includes("split and aggregate columns"),
  );
});

test("retains BERT version, objective, result, and implementation boundaries", () => {
  const workId = "devlin-2018-bert-pre-training-deep-bidirectional-transformers";
  const work = corpus.works.find((item) => item.id === workId);
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const claims = corpus.claims.filter((claim) => claim.workId === workId);
  const sources = corpus.sources.filter((source) =>
    source.relatedWorkIds.includes(workId),
  );
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(workId),
  );
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const versionBoundary = claims.find(
    (claim) => claim.id === "devlin-2018-version-boundary",
  );
  const maskedObjective = claims.find(
    (claim) => claim.id === "devlin-2018-masked-language-model-objective",
  );
  const replacement = claims.find(
    (claim) => claim.id === "devlin-2018-masking-replacement-procedure",
  );
  const nextSentence = claims.find(
    (claim) => claim.id === "devlin-2018-next-sentence-prediction-objective",
  );
  const results = claims.find(
    (claim) => claim.id === "devlin-2018-glue-results",
  );
  const squadV1 = claims.find(
    (claim) => claim.id === "devlin-2018-squad-v1-results",
  );
  const squadV2 = claims.find(
    (claim) => claim.id === "devlin-2018-squad-v2-results",
  );
  const ablation = claims.find(
    (claim) => claim.id === "devlin-2018-pretraining-task-ablation",
  );
  const trainingStep = claims.find(
    (claim) => claim.id === "devlin-2018-training-step-ablation",
  );
  const codeBoundary = claims.find(
    (claim) => claim.id === "devlin-2018-code-and-evidence-boundary",
  );

  assert.equal(work?.artifactType, "conference-paper");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "devlin-2019-naacl-version");
  assert.deepEqual(
    work?.chronology.events.map((event) => event.date.value),
    ["2018-10-11", "2019-05-24", "2019-06"],
  );
  assert.deepEqual(
    work?.versions.map((version) => [version.id, version.kind]),
    [
      ["devlin-2018-arxiv-v1-version", "preprint"],
      ["devlin-2019-arxiv-v2-version", "preprint"],
      ["devlin-2019-naacl-version", "proceedings"],
    ],
  );
  assert.deepEqual(
    versions.get("devlin-2019-naacl-version")?.bibliography.pages,
    ["4171-4186"],
  );
  assert.deepEqual(
    sourceMap.get("devlin-2018-arxiv-v1-full-text")?.pagination,
    { scheme: "pdf-page", pageStart: 1, pageEnd: 14 },
  );
  assert.deepEqual(
    sourceMap.get("devlin-2019-arxiv-v2-full-text")?.pagination,
    { scheme: "pdf-page", pageStart: 1, pageEnd: 16 },
  );
  assert.deepEqual(
    sourceMap.get("devlin-2019-naacl-full-text")?.pagination,
    { scheme: "printed", pageStart: 4171, pageEnd: 4186 },
  );
  for (const claim of claims) {
    for (const evidence of claim.evidence.filter((item) =>
      [
        "devlin-2018-arxiv-v1-full-text",
        "devlin-2019-arxiv-v2-full-text",
      ].includes(item.sourceId),
    )) {
      assert.equal("pageStart" in evidence.locator, false);
      assert.equal("pageEnd" in evidence.locator, false);
    }
  }
  assert.equal(sources.length, 7);
  assert.equal(claims.length, 20);
  assert.deepEqual(
    objectives.map((objective) => objective.id),
    [
      "beginner-devlin-2018-mask-context-and-fine-tune",
      "expert-devlin-2018-objectives-ablations-and-versions",
    ],
  );
  assert.ok(versionBoundary?.statement.includes("materially different"));
  assert.ok(
    versions
      .get("devlin-2018-arxiv-v1-version")
      ?.notes.includes("no SQuAD 2.0 section"),
  );
  assert.ok(
    versions
      .get("devlin-2019-arxiv-v2-version")
      ?.notes.includes("technically close to but not byte-identical"),
  );
  assert.ok(maskedObjective?.statement.includes("15% of WordPiece positions"));
  assert.ok(replacement?.statement.includes("[MASK] 80%"));
  assert.ok(nextSentence?.statement.includes("50% of examples"));
  assert.ok(results?.statement.includes("82.1 mixed-metric average"));
  assert.ok(results?.statement.includes("official GLUE score reported in prose is 80.5"));
  assert.ok(squadV1?.statement.includes("seven-system ensemble plus TriviaQA"));
  assert.ok(squadV2?.statement.includes("without TriviaQA data"));
  assert.ok(ablation?.limitations.join(" ").includes("not a compute-matched"));
  assert.ok(trainingStep?.statement.includes("almost 1.0% additional"));
  assert.ok(
    trainingStep?.limitations
      .join(" ")
      .includes("percentage points from relative percent"),
  );
  assert.ok(codeBoundary?.statement.includes("exact corpus snapshots"));
  assert.ok(
    sourceMap
      .get("acl-2016-plus-rights-policy")
      ?.versionIds.includes("devlin-2019-naacl-version"),
  );
});

test("retains Transformer-XL authorship, locator, mechanism, and pedagogy boundaries", () => {
  const workId =
    "dai-2019-transformer-xl-attentive-language-models-beyond-fixed-length-context";
  const work = corpus.works.find((item) => item.id === workId);
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const claims = corpus.claims.filter((claim) => claim.workId === workId);
  const sources = corpus.sources.filter((source) =>
    source.relatedWorkIds.includes(workId),
  );
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(workId),
  );
  const versionBoundary = claims.find(
    (claim) => claim.id === "dai-2019-version-boundary",
  );
  const recurrence = claims.find(
    (claim) => claim.id === "dai-2019-segment-level-recurrence",
  );
  const relativeAttention = claims.find(
    (claim) => claim.id === "dai-2019-relative-positional-attention",
  );
  const relativeShift = claims.find(
    (claim) => claim.id === "dai-2019-relative-shift-computation",
  );
  const shortContextAblation = claims.find(
    (claim) => claim.id === "dai-2019-short-context-recurrence-ablation",
  );
  const generatedText = claims.find(
    (claim) => claim.id === "dai-2019-generated-text-boundary",
  );
  const codeBoundary = claims.find(
    (claim) => claim.id === "dai-2019-code-and-evidence-boundary",
  );
  const expertObjective = objectives.find(
    (objective) => objective.mode === "expert",
  );
  const canonicalAuthors = [
    "Zihang Dai",
    "Zhilin Yang",
    "Yiming Yang",
    "Jaime Carbonell",
    "Quoc V. Le",
    "Ruslan Salakhutdinov",
  ];
  const structuralSourceIds = new Set([
    "dai-2019-arxiv-v1-full-text",
    "dai-2019-arxiv-v2-full-text",
    "dai-2019-arxiv-v3-full-text",
    "dai-2019-acl-supplement",
  ]);
  const structuralEvidence = claims.flatMap((claim) =>
    claim.evidence.filter((evidence) =>
      structuralSourceIds.has(evidence.sourceId),
    ),
  );
  const printedEvidence = claims.flatMap((claim) =>
    claim.evidence.filter(
      (evidence) => evidence.sourceId === "dai-2019-acl-full-text",
    ),
  );

  assert.equal(work?.artifactType, "conference-paper");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "dai-2019-acl-version");
  assert.deepEqual(work?.authors, canonicalAuthors);
  assert.deepEqual(
    versions.get("dai-2019-arxiv-v1-version")?.authors,
    [
      "Zihang Dai",
      "Zhilin Yang",
      "Yiming Yang",
      "William W. Cohen",
      "Jaime Carbonell",
      "Quoc V. Le",
      "Ruslan Salakhutdinov",
    ],
  );
  for (const versionId of [
    "dai-2019-arxiv-v2-version",
    "dai-2019-arxiv-v3-version",
    "dai-2019-acl-version",
  ]) {
    assert.deepEqual(versions.get(versionId)?.authors, canonicalAuthors);
  }
  assert.ok(
    versionBoundary?.statement.includes(
      "v1 lists seven authors including William W. Cohen",
    ),
  );
  assert.deepEqual(
    work?.chronology.events.map((event) => [
      event.id,
      event.kind,
      event.date.value,
    ]),
    [
      ["dai-2019-arxiv-v1-posted", "preprint", "2019-01-09"],
      ["dai-2019-arxiv-v2-posted", "manuscript-revised", "2019-01-18"],
      ["dai-2019-arxiv-v3-posted", "manuscript-revised", "2019-06-02"],
      ["dai-2019-acl-proceedings", "proceedings-publication", "2019-07"],
    ],
  );
  assert.deepEqual(
    sourceMap.get("dai-2019-arxiv-v1-full-text")?.pagination,
    { scheme: "pdf-page", pageStart: 1, pageEnd: 18 },
  );
  assert.deepEqual(
    sourceMap.get("dai-2019-arxiv-v2-full-text")?.pagination,
    { scheme: "pdf-page", pageStart: 1, pageEnd: 18 },
  );
  assert.deepEqual(
    sourceMap.get("dai-2019-arxiv-v3-full-text")?.pagination,
    { scheme: "pdf-page", pageStart: 1, pageEnd: 20 },
  );
  assert.deepEqual(
    sourceMap.get("dai-2019-acl-supplement")?.pagination,
    { scheme: "pdf-page", pageStart: 1, pageEnd: 9 },
  );
  assert.deepEqual(sourceMap.get("dai-2019-acl-full-text")?.pagination, {
    scheme: "printed",
    pageStart: 2978,
    pageEnd: 2988,
  });
  assert.ok(structuralEvidence.length > 0);
  for (const evidence of structuralEvidence) {
    assert.equal("pageStart" in evidence.locator, false);
    assert.equal("pageEnd" in evidence.locator, false);
    assert.ok(
      ["section", "equation", "figure", "table"].some(
        (key) => key in evidence.locator,
      ),
    );
  }
  assert.ok(printedEvidence.length > 0);
  for (const evidence of printedEvidence) {
    assert.ok(evidence.locator.pageStart >= 2978);
    assert.ok(evidence.locator.pageEnd <= 2988);
  }
  assert.ok(
    recurrence?.statement.includes("detaches it from the gradient graph"),
  );
  assert.ok(relativeAttention?.statement.includes("four terms"));
  assert.ok(relativeShift?.statement.includes("M+L unique relative-distance"));
  assert.equal(
    relativeShift?.evidence.find(
      (evidence) => evidence.sourceId === "dai-2019-acl-supplement",
    )?.locator.section,
    "Appendix B Efficient Computation of the Attention with Relative Positional Embedding",
  );
  assert.ok(shortContextAblation?.statement.includes("400,000 training steps"));
  assert.deepEqual(
    generatedText?.evidence.map((evidence) => evidence.sourceId),
    ["dai-2019-arxiv-v3-full-text", "dai-2019-acl-supplement"],
  );
  assert.ok(generatedText?.statement.includes("off-target"));
  assert.ok(
    sourceMap
      .get("dai-2019-transformer-xl-code-snapshot")
      ?.accessNote.includes("preliminary"),
  );
  assert.ok(codeBoundary?.statement.includes("checkpoint hashes"));
  assert.ok(
    expertObjective?.successCriterion.includes("not exactly reproducible"),
  );
  assert.deepEqual(
    objectives.map((objective) => [objective.id, objective.mode]),
    [
      ["beginner-dai-2019-carry-context-across-segments", "beginner"],
      [
        "expert-dai-2019-recurrence-relative-attention-and-evidence",
        "expert",
      ],
    ],
  );
  assert.ok(
    objectives.every(
      (objective) =>
        objective.workIds.length === 1 && objective.workIds[0] === workId,
    ),
  );
});

test("retains GPT-2 report, release, parameter-vocabulary, and pedagogy boundaries", () => {
  const workId = "radford-2019-language-models-unsupervised-multitask-learners";
  const work = corpus.works.find((item) => item.id === workId);
  const claims = corpus.claims.filter((claim) => claim.workId === workId);
  const sources = corpus.sources.filter((source) =>
    source.relatedWorkIds.includes(workId),
  );
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(workId),
  );
  const reportSource = sourceMap.get("radford-2019-openai-report-full-text");
  const releaseDayCode = sourceMap.get(
    "radford-2019-gpt2-release-day-code-snapshot",
  );
  const correctedCheckpoints = sourceMap.get(
    "radford-2019-gpt2-corrected-checkpoint-snapshot",
  );
  const fullModelRelease = sourceMap.get(
    "radford-2019-gpt2-full-model-release",
  );
  const modelConfigurations = claims.find(
    (claim) => claim.id === "radford-2019-model-configurations-and-training",
  );
  const transferResults = claims.find(
    (claim) => claim.id === "radford-2019-lambada-cbt-and-winograd-results",
  );
  const overlapAnalysis = claims.find(
    (claim) => claim.id === "radford-2019-overlap-analysis",
  );
  const byteBpe = claims.find(
    (claim) => claim.id === "radford-2019-byte-level-bpe",
  );
  const evidenceBoundary = claims.find(
    (claim) => claim.id === "radford-2019-code-data-and-evidence-boundary",
  );
  const reportLabels = ["117M", "345M", "762M", "1542M"];
  const checkpointLabels = ["124M", "355M", "774M", "1558M"];
  const checkpointVocabulary = [
    correctedCheckpoints?.accessNote,
    fullModelRelease?.accessNote,
  ].join(" ");
  const laterReleaseSourceIds = [
    "radford-2019-gpt2-six-month-follow-up",
    "radford-2019-gpt2-corrected-checkpoint-snapshot",
    "radford-2019-gpt2-full-model-release",
    "solaiman-2019-release-strategies-v2-full-text",
  ];

  assert.equal(work?.artifactType, "technical-report");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(
    work?.canonicalVersionId,
    "radford-2019-openai-report-version",
  );
  assert.deepEqual(
    work?.versions.map((version) => [version.id, version.kind]),
    [["radford-2019-openai-report-version", "technical-report"]],
  );
  assert.equal(
    work?.chronology.orderingEventId,
    "radford-2019-openai-report-announced",
  );
  assert.ok(
    work?.chronology.events.every(
      (event) => event.versionId === "radford-2019-openai-report-version",
    ),
  );
  assert.ok(
    work?.versions[0]?.notes.includes(
      "Later checkpoint releases and the separate Release Strategies report are not versions",
    ),
  );
  assert.ok(releaseDayCode?.accessNote.includes("not a new report version"));
  for (const sourceId of laterReleaseSourceIds) {
    assert.deepEqual(sourceMap.get(sourceId)?.versionIds, []);
    assert.equal(work?.versions[0]?.sourceIds.includes(sourceId), false);
  }
  assert.deepEqual(reportSource?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 24,
  });
  const reportEvidence = claims.flatMap((claim) =>
    claim.evidence.filter(
      (evidence) => evidence.sourceId === "radford-2019-openai-report-full-text",
    ),
  );
  assert.ok(reportEvidence.length > 0);
  for (const evidence of reportEvidence) {
    assert.equal("pageStart" in evidence.locator, false);
    assert.equal("pageEnd" in evidence.locator, false);
    assert.ok(
      ["section", "equation", "figure", "table"].some(
        (key) => key in evidence.locator,
      ),
    );
  }
  for (const label of reportLabels) {
    assert.ok(modelConfigurations?.statement.includes(label));
  }
  for (const label of checkpointLabels) {
    assert.equal(modelConfigurations?.statement.includes(label), false);
    assert.ok(checkpointVocabulary.includes(label));
  }
  assert.ok(
    work?.limitations.some(
      (limitation) =>
        reportLabels.every((label) => limitation.includes(label)) &&
        checkpointLabels.every((label) => limitation.includes(label)),
    ),
  );
  assert.ok(
    work?.limitations.some(
      (limitation) =>
        limitation.includes("non-English pages") &&
        limitation.includes("subreddit blocklist") &&
        limitation.includes("must not be backdated"),
    ),
  );
  assert.ok(transferResults?.statement.includes("ten candidate words"));
  assert.ok(transferResults?.statement.includes("sentence remainder"));
  assert.ok(transferResults?.statement.includes("stop-word filter"));
  assert.ok(transferResults?.statement.includes("70.70% under partial scoring"));
  assert.ok(overlapAnalysis?.statement.includes("six language-model datasets"));
  assert.ok(overlapAnalysis?.statement.includes("test-set 8-grams"));
  assert.equal(byteBpe?.statement.includes("mapped reversibly"), false);
  assert.equal(
    evidenceBoundary?.evidence[0]?.locator.section,
    "7 Conclusion, footnote 5; complete report",
  );
  assert.deepEqual(
    objectives.map((objective) => [objective.id, objective.mode]),
    [
      ["beginner-radford-2019-scale-and-zero-shot-transfer", "beginner"],
      [
        "expert-radford-2019-webtext-objectives-results-and-releases",
        "expert",
      ],
    ],
  );
  assert.ok(
    objectives.every(
      (objective) =>
        objective.workIds.length === 1 && objective.workIds[0] === workId,
    ),
  );
});

test("retains XLNet version, locator, result, confound, and pedagogy boundaries", () => {
  const workId =
    "yang-2019-xlnet-generalized-autoregressive-pretraining-language-understanding";
  const work = corpus.works.find((item) => item.id === workId);
  const spanIdea = corpus.ideas.find(
    (idea) => idea.id === "span-based-permutation-targets",
  );
  const versions = new Map(work?.versions.map((version) => [version.id, version]));
  const claims = corpus.claims.filter((claim) => claim.workId === workId);
  const sources = corpus.sources.filter((source) =>
    source.relatedWorkIds.includes(workId),
  );
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(workId),
  );
  const versionBoundary = claims.find(
    (claim) => claim.id === "yang-2019-version-boundary",
  );
  const permutationObjective = claims.find(
    (claim) => claim.id === "yang-2019-permutation-language-model-objective",
  );
  const twoStream = claims.find(
    (claim) => claim.id === "yang-2019-target-aware-two-stream-attention",
  );
  const partialPrediction = claims.find(
    (claim) => claim.id === "yang-2019-partial-permutation-prediction",
  );
  const spanSelection = claims.find(
    (claim) => claim.id === "yang-2019-span-based-target-selection",
  );
  const inputConflict = claims.find(
    (claim) => claim.id === "yang-2019-input-format-conflict",
  );
  const pretraining = claims.find(
    (claim) => claim.id === "yang-2019-pretraining-data-and-compute",
  );
  const fairComparison = claims.find(
    (claim) => claim.id === "yang-2019-fair-bert-comparison",
  );
  const componentAblation = claims.find(
    (claim) => claim.id === "yang-2019-component-ablation",
  );
  const structuralSourceIds = new Set([
    "yang-2019-arxiv-v1-full-text",
    "yang-2020-arxiv-v2-full-text",
    "yang-2019-neurips-supplement",
  ]);
  const structuralEvidence = claims.flatMap((claim) =>
    claim.evidence.filter((evidence) =>
      structuralSourceIds.has(evidence.sourceId),
    ),
  );
  const canonicalEvidence = claims.flatMap((claim) =>
    claim.evidence.filter(
      (evidence) => evidence.sourceId === "yang-2019-neurips-full-text",
    ),
  );

  assert.equal(work?.artifactType, "conference-paper");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "yang-2019-neurips-version");
  assert.deepEqual(work?.authors, [
    "Zhilin Yang",
    "Zihang Dai",
    "Yiming Yang",
    "Jaime Carbonell",
    "Ruslan Salakhutdinov",
    "Quoc V. Le",
  ]);
  assert.deepEqual(
    work?.chronology.events.map((event) => [
      event.id,
      event.kind,
      event.date.value,
    ]),
    [
      ["yang-2019-arxiv-v1-posted", "preprint", "2019-06-19"],
      ["yang-2019-neurips-proceedings", "proceedings-publication", "2019"],
      ["yang-2020-arxiv-v2-posted", "manuscript-revised", "2020-01-02"],
    ],
  );
  assert.deepEqual(
    work?.versions.map((version) => [version.id, version.kind]),
    [
      ["yang-2019-arxiv-v1-version", "preprint"],
      ["yang-2019-neurips-version", "proceedings"],
      ["yang-2020-arxiv-v2-version", "preprint"],
    ],
  );
  assert.deepEqual(
    versions.get("yang-2019-neurips-version")?.bibliography.pages,
    ["5753-5763"],
  );
  assert.ok(
    versions
      .get("yang-2019-neurips-version")
      ?.notes.includes(
        "current NeurIPS record use Ruslan Salakhutdinov; Metadata.json's structured author is Russ Salakhutdinov; official BibTeX and PDF metadata use Russ R. Salakhutdinov",
      ),
  );
  assert.deepEqual(
    versions.get("yang-2019-arxiv-v1-version")?.sourceIds,
    [
      "yang-2019-arxiv-record",
      "yang-2019-arxiv-v1-full-text",
      "yang-2019-xlnet-initial-code-snapshot",
    ],
  );
  assert.deepEqual(versions.get("yang-2019-neurips-version")?.sourceIds, [
    "yang-2019-neurips-record",
    "yang-2019-neurips-metadata",
    "yang-2019-neurips-full-text",
    "yang-2019-neurips-supplement",
    "yang-2019-xlnet-final-code-snapshot",
    "yang-2019-xlnet-pinned-apache-license",
    "yang-2019-neurips-rights-policy",
  ]);
  assert.deepEqual(
    versions.get("yang-2020-arxiv-v2-version")?.sourceIds,
    ["yang-2019-arxiv-record", "yang-2020-arxiv-v2-full-text"],
  );
  assert.deepEqual(
    sources.map((source) => [source.id, source.versionIds]),
    [
      [
        "yang-2019-arxiv-record",
        ["yang-2019-arxiv-v1-version", "yang-2020-arxiv-v2-version"],
      ],
      ["yang-2019-arxiv-v1-full-text", ["yang-2019-arxiv-v1-version"]],
      ["yang-2020-arxiv-v2-full-text", ["yang-2020-arxiv-v2-version"]],
      ["yang-2019-neurips-record", ["yang-2019-neurips-version"]],
      ["yang-2019-neurips-metadata", ["yang-2019-neurips-version"]],
      ["yang-2019-neurips-full-text", ["yang-2019-neurips-version"]],
      ["yang-2019-neurips-supplement", ["yang-2019-neurips-version"]],
      [
        "yang-2019-xlnet-initial-code-snapshot",
        ["yang-2019-arxiv-v1-version"],
      ],
      [
        "yang-2019-xlnet-final-code-snapshot",
        ["yang-2019-neurips-version"],
      ],
      [
        "yang-2019-xlnet-pinned-apache-license",
        ["yang-2019-neurips-version"],
      ],
      ["yang-2019-neurips-rights-policy", ["yang-2019-neurips-version"]],
    ],
  );
  assert.equal(claims.length, 15);
  assert.deepEqual(
    sourceMap.get("yang-2019-arxiv-v1-full-text")?.pagination,
    { scheme: "pdf-page", pageStart: 1, pageEnd: 18 },
  );
  assert.deepEqual(
    sourceMap.get("yang-2020-arxiv-v2-full-text")?.pagination,
    { scheme: "pdf-page", pageStart: 1, pageEnd: 18 },
  );
  assert.deepEqual(sourceMap.get("yang-2019-neurips-full-text")?.pagination, {
    scheme: "article",
    pageStart: 1,
    pageEnd: 11,
  });
  assert.deepEqual(sourceMap.get("yang-2019-neurips-supplement")?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 7,
  });
  assert.ok(
    sourceMap
      .get("yang-2019-neurips-supplement")
      ?.accessNote.includes(
        "visibly continue printed article folios 12–18",
      ),
  );
  assert.ok(structuralEvidence.length > 0);
  for (const evidence of structuralEvidence) {
    assert.equal("pageStart" in evidence.locator, false);
    assert.equal("pageEnd" in evidence.locator, false);
    assert.ok(
      ["section", "equation", "figure", "table"].some(
        (key) => key in evidence.locator,
      ),
    );
  }
  assert.ok(canonicalEvidence.length > 0);
  for (const evidence of canonicalEvidence) {
    assert.ok(evidence.locator.pageStart >= 1);
    assert.ok(evidence.locator.pageEnd <= 11);
  }
  assert.deepEqual(
    versionBoundary?.evidence.map((evidence) => evidence.sourceId),
    [
      "yang-2019-arxiv-v1-full-text",
      "yang-2019-neurips-full-text",
      "yang-2020-arxiv-v2-full-text",
    ],
  );
  assert.ok(
    permutationObjective?.statement.includes(
      "token sequence and positional encodings remain in natural order",
    ),
  );
  assert.ok(twoStream?.statement.includes("cannot attend to the target content"));
  assert.ok(partialPrediction?.statement.includes("approximately a 1/K fraction"));
  assert.equal(
    spanIdea?.description,
    "Select contiguous runs of positions as prediction targets inside a wider permutation context, sampling each target span's length while other factorization positions supply context.",
  );
  assert.deepEqual(
    spanSelection?.evidence.find(
      (evidence) => evidence.sourceId === "yang-2019-neurips-supplement",
    ),
    {
      sourceId: "yang-2019-neurips-supplement",
      locator: {
        label: "Canonical pretraining hyperparameters",
        section: "A.4.1 Pretraining",
        table: "7",
      },
      support: "The supplement tabulates K=6 and associated large-model settings.",
    },
  );
  assert.ok(
    inputConflict?.statement.includes("places CLS last and left-pads"),
  );
  assert.deepEqual(
    inputConflict?.evidence.map((evidence) => evidence.sourceId),
    [
      "yang-2019-neurips-full-text",
      "yang-2019-arxiv-v1-full-text",
      "yang-2019-xlnet-final-code-snapshot",
    ],
  );
  assert.equal(
    inputConflict?.evidence.at(-1)?.locator.section,
    "classifier_utils.py lines 94–109 and 117–122; data_utils.py lines 480–487",
  );
  assert.ok(pretraining?.statement.includes("32.89 billion SentencePiece tokens"));
  assert.ok(pretraining?.statement.includes("batch 8,192 on 512 TPU v3 chips"));
  assert.ok(pretraining?.statement.includes("about 5.5 days and remains underfit"));
  assert.deepEqual(
    pretraining?.evidence.find(
      (evidence) => evidence.sourceId === "yang-2019-neurips-supplement",
    ),
    {
      sourceId: "yang-2019-neurips-supplement",
      locator: {
        label: "Canonical pretraining hyperparameter table",
        section: "A.4.1 Pretraining",
        table: "7",
      },
      support:
        "Table 7 tabulates pretraining model and optimization settings; corpus sizes, hardware, duration, and the underfitting statement remain controlled by main-paper Section 3.1.",
    },
  );
  assert.ok(
    fairComparison?.statement.includes(
      "SQuAD 2.0 EM/F1 82.8/85.5 versus 85.1/87.8",
    ),
  );
  assert.ok(fairComparison?.statement.includes("RACE 75.1 versus 77.4"));
  assert.ok(
    fairComparison?.limitations
      .join(" ")
      .includes("oracle-like best-of-three envelope"),
  );
  assert.ok(componentAblation?.statement.includes("No row wins every column"));
  assert.ok(componentAblation?.statement.includes("adding NSP slightly raises RACE"));
  assert.ok(
    componentAblation?.statement.includes(
      "minus memory 65.55, 80.15/77.27, 85.32/85.05, 92.78",
    ),
  );
  assert.deepEqual(
    objectives.map((objective) => [objective.id, objective.mode]),
    [
      ["beginner-yang-2019-permute-prediction-not-words", "beginner"],
      [
        "expert-yang-2019-objective-streams-memory-and-evidence",
        "expert",
      ],
    ],
  );
  assert.ok(
    objectives.every(
      (objective) =>
        objective.workIds.length === 1 && objective.workIds[0] === workId,
    ),
  );
  assert.ok(
    objectives
      .find((objective) => objective.mode === "beginner")
      ?.successCriterion.includes("factorization order"),
  );
  assert.ok(
    objectives
      .find((objective) => objective.mode === "expert")
      ?.successCriterion.includes("Tables 1 and 6"),
  );
});

test("retains RoBERTa source, result, confound, and pedagogy boundaries", () => {
  const workId =
    "liu-2019-roberta-robustly-optimized-bert-pretraining-approach";
  const work = corpus.works.find((item) => item.id === workId);
  const packingIdea = corpus.ideas.find(
    (idea) => idea.id === "nsp-free-full-sentence-packing",
  );
  const claims = corpus.claims.filter((claim) => claim.workId === workId);
  const sources = corpus.sources.filter((source) =>
    source.relatedWorkIds.includes(workId),
  );
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const objectives = corpus.learningObjectives.filter((objective) =>
    objective.workIds.includes(workId),
  );
  const scopeBoundary = claims.find(
    (claim) => claim.id === "liu-2019-predecessor-and-scope-boundary",
  );
  const masking = claims.find(
    (claim) => claim.id === "liu-2019-static-dynamic-masking-ablation",
  );
  const inputAndNsp = claims.find(
    (claim) => claim.id === "liu-2019-input-format-and-nsp-ablation",
  );
  const batch = claims.find(
    (claim) => claim.id === "liu-2019-large-batch-ablation",
  );
  const recipe = claims.find(
    (claim) => claim.id === "liu-2019-aggregate-roberta-recipe",
  );
  const accumulation = claims.find(
    (claim) => claim.id === "liu-2019-data-and-duration-accumulation",
  );
  const glue = claims.find((claim) => claim.id === "liu-2019-glue-results");
  const squad = claims.find((claim) => claim.id === "liu-2019-squad-results");
  const race = claims.find((claim) => claim.id === "liu-2019-race-results");
  const releaseBoundary = claims.find(
    (claim) => claim.id === "liu-2019-release-and-reconstruction-boundary",
  );
  const paperEvidence = claims.flatMap((claim) =>
    claim.evidence.filter(
      (evidence) => evidence.sourceId === "liu-2019-arxiv-v1-full-text",
    ),
  );
  const sourceIds = [
    "liu-2019-arxiv-record",
    "liu-2019-arxiv-v1-full-text",
    "liu-2019-fairseq-initial-roberta-snapshot",
    "liu-2019-fairseq-initial-roberta-readme",
    "liu-2019-fairseq-initial-rights",
  ];

  assert.equal(work?.artifactType, "preprint");
  assert.equal(work?.inclusion.status, "core");
  assert.equal(work?.canonicalVersionId, "liu-2019-arxiv-v1-version");
  assert.deepEqual(
    work?.chronology.events.map((event) => [
      event.id,
      event.kind,
      event.date.value,
    ]),
    [["liu-2019-arxiv-v1-posted", "preprint", "2019-07-26"]],
  );
  assert.deepEqual(
    work?.versions.map((version) => [
      version.id,
      version.kind,
      version.bibliography.pages,
      version.bibliography.identifiers.map((identifier) => identifier.value),
    ]),
    [
      [
        "liu-2019-arxiv-v1-version",
        "preprint",
        [],
        ["1907.11692v1", "10.48550/arXiv.1907.11692"],
      ],
    ],
  );
  assert.deepEqual(work?.versions[0]?.sourceIds, sourceIds);
  assert.deepEqual(sources.map((source) => source.id), sourceIds);
  for (const source of sources) {
    assert.deepEqual(source.versionIds, ["liu-2019-arxiv-v1-version"]);
  }
  assert.ok(
    sourceMap
      .get("liu-2019-fairseq-initial-rights")
      ?.accessNote.includes(
        "separate patent grant whose definition of Software is fairseq software",
      ),
  );
  assert.equal(claims.length, 13);
  assert.deepEqual(sourceMap.get("liu-2019-arxiv-v1-full-text")?.pagination, {
    scheme: "pdf-page",
    pageStart: 1,
    pageEnd: 13,
  });
  assert.ok(paperEvidence.length > 0);
  for (const evidence of paperEvidence) {
    assert.equal("pageStart" in evidence.locator, false);
    assert.equal("pageEnd" in evidence.locator, false);
    assert.ok(
      ["section", "table", "paragraph"].some(
        (key) => key in evidence.locator,
      ),
    );
  }
  assert.ok(scopeBoundary?.statement.includes("BERT replication and optimization study"));
  assert.ok(masking?.statement.includes("SQuAD 2.0 F1 78.3/78.7"));
  assert.ok(masking?.statement.includes("MNLI-m 84.3/84.0"));
  assert.ok(
    masking?.limitations.join(" ").includes("not uniformly more accurate"),
  );
  assert.ok(
    inputAndNsp?.statement.includes("Document-sentences is strongest overall"),
  );
  assert.ok(
    inputAndNsp?.statement.includes("90.6/79.7, 84.7, 92.7, 65.6"),
  );
  assert.ok(inputAndNsp?.statement.includes("may cross document boundaries"));
  assert.ok(
    inputAndNsp?.limitations.join(" ").includes("does not isolate the loss alone"),
  );
  assert.ok(batch?.statement.includes("2K×125K gives 3.68, 85.2, 92.9"));
  assert.ok(batch?.statement.includes("larger batches are not monotonically better"));
  assert.ok(
    batch?.limitations.join(" ").includes("partly an engineering choice"),
  );
  assert.ok(recipe?.statement.includes("FULL-SENTENCES packing without NSP"));
  assert.ok(recipe?.statement.includes("at most 500K steps"));
  assert.ok(
    accumulation?.statement.includes(
      "93.6/87.3→94.0/87.7→94.4/88.7→94.6/89.4",
    ),
  );
  assert.ok(
    accumulation?.statement.includes(
      "BERT-Large comparator uses 13GB, batch 256, and one million steps",
    ),
  );
  assert.ok(
    accumulation?.statement.includes(
      "SQuAD 90.9/81.8, MNLI 86.6, and SST-2 93.7",
    ),
  );
  assert.ok(
    accumulation?.limitations.join(" ").includes("not a factorial attribution study"),
  );
  assert.ok(glue?.statement.includes("ensemble of 5–7 models"));
  assert.ok(glue?.statement.includes("and average 88.5"));
  assert.ok(squad?.statement.includes("88.9 EM/94.6 F1"));
  assert.ok(squad?.statement.includes("86.8/89.8"));
  assert.ok(race?.statement.includes("83.2 overall, 86.5 middle, and 81.3 high"));
  assert.ok(releaseBoundary?.statement.includes("initial pretraining documentation was incomplete"));
  assert.ok(
    releaseBoundary?.evidence
      .find((evidence) => evidence.sourceId === "liu-2019-fairseq-initial-rights")
      ?.support.includes("separate patent grant defines Software as fairseq software"),
  );
  assert.ok(
    releaseBoundary?.limitations
      .join(" ")
      .includes("separate patent grant is software-scoped"),
  );
  assert.ok(
    packingIdea?.description.includes("training blocks of at most 512 tokens"),
  );
  assert.deepEqual(
    objectives.map((objective) => [objective.id, objective.mode]),
    [
      [
        "beginner-liu-2019-training-recipe-not-new-architecture",
        "beginner",
      ],
      [
        "expert-liu-2019-ablations-scaling-and-evidence-boundaries",
        "expert",
      ],
    ],
  );
  assert.ok(
    objectives.every(
      (objective) =>
        objective.workIds.length === 1 && objective.workIds[0] === workId,
    ),
  );
  assert.ok(
    objectives
      .find((objective) => objective.mode === "beginner")
      ?.successCriterion.includes("cannot be assigned to one switch"),
  );
  assert.ok(
    objectives
      .find((objective) => objective.mode === "expert")
      ?.successCriterion.includes("NSP/packing confound"),
  );
});

test("keeps XLNet and RoBERTa convergence lineage evidence-scoped", () => {
  const transformerId = "vaswani-2017-attention-is-all-you-need";
  const bertId = "devlin-2018-bert-pre-training-deep-bidirectional-transformers";
  const transformerXlId =
    "dai-2019-transformer-xl-attentive-language-models-beyond-fixed-length-context";
  const gpt2Id = "radford-2019-language-models-unsupervised-multitask-learners";
  const xlnetId =
    "yang-2019-xlnet-generalized-autoregressive-pretraining-language-understanding";
  const robertaId =
    "liu-2019-roberta-robustly-optimized-bert-pretraining-approach";
  const chronologicalWorkIds = [
    bertId,
    transformerXlId,
    gpt2Id,
    xlnetId,
    robertaId,
  ];
  const expectedEdges = [
    {
      id: "dai-2019-to-yang-2019",
      fromId: transformerXlId,
      toId: xlnetId,
      connectionType: "extends",
      claimIds: [
        "dai-2019-segment-level-recurrence",
        "dai-2019-relative-positional-attention",
        "yang-2019-transformer-xl-integration",
        "yang-2019-permutation-language-model-objective",
      ],
      sourceId: "yang-2019-neurips-full-text",
      locator: {
        label: "Target-side Transformer-XL integration",
        section: "1 Introduction; 2.4 Incorporating Ideas from Transformer-XL",
        pageStart: 1,
        pageEnd: 5,
      },
    },
    {
      id: "devlin-2018-to-yang-2019",
      fromId: bertId,
      toId: xlnetId,
      connectionType: "addresses",
      claimIds: [
        "devlin-2018-masked-language-model-objective",
        "devlin-2018-masking-replacement-procedure",
        "devlin-2018-full-parameter-task-adaptation",
        "yang-2019-permutation-language-model-objective",
        "yang-2019-fair-bert-comparison",
      ],
      sourceId: "yang-2019-neurips-full-text",
      locator: {
        label: "Target-side BERT critique, continuity, and comparison",
        section:
          "1 Introduction; 2.1 Background; 2.6 Discussion; 3.1 Pretraining and Implementation; 3.2 Fair Comparison with BERT",
        pageStart: 1,
        pageEnd: 7,
        table: "1",
      },
    },
    {
      id: "vaswani-2017-to-yang-2019",
      fromId: transformerId,
      toId: xlnetId,
      connectionType: "builds-on",
      claimIds: [
        "vaswani-2017-multi-head-attention",
        "vaswani-2017-attention-routes-and-causal-mask",
        "vaswani-2017-positionwise-computation",
        "yang-2019-target-aware-two-stream-attention",
      ],
      sourceId: "yang-2019-neurips-full-text",
      locator: {
        label: "Target-side Transformer attention reparameterization",
        section: "2.1 Background; 2.3 Architecture",
        pageStart: 2,
        pageEnd: 5,
        figure: "1",
      },
    },
    {
      id: "devlin-2018-to-liu-2019",
      fromId: bertId,
      toId: robertaId,
      connectionType: "extends",
      claimIds: [
        "devlin-2018-transformer-encoder-and-model-scales",
        "devlin-2018-masked-language-model-objective",
        "devlin-2018-next-sentence-prediction-objective",
        "devlin-2018-pretraining-optimization-and-length-schedule",
        "devlin-2018-full-parameter-task-adaptation",
        "liu-2019-predecessor-and-scope-boundary",
        "liu-2019-static-dynamic-masking-ablation",
        "liu-2019-input-format-and-nsp-ablation",
      ],
      sourceId: "liu-2019-arxiv-v1-full-text",
      locator: {
        label: "Target-side BERT replication and recipe changes",
        section:
          "1 Introduction; 2 Background; 4 Training Procedure Analysis; 5 RoBERTa",
        table: "1–4",
      },
    },
    {
      id: "vaswani-2017-to-liu-2019",
      fromId: transformerId,
      toId: robertaId,
      connectionType: "builds-on",
      claimIds: [
        "vaswani-2017-encoder-decoder-architecture",
        "vaswani-2017-multi-head-attention",
        "liu-2019-predecessor-and-scope-boundary",
        "liu-2019-aggregate-roberta-recipe",
      ],
      sourceId: "liu-2019-arxiv-v1-full-text",
      locator: {
        label: "Target-side Transformer encoder continuity",
        section: "2.2 Architecture; 5 RoBERTa",
      },
    },
    {
      id: "radford-2019-to-liu-2019",
      fromId: gpt2Id,
      toId: robertaId,
      connectionType: "builds-on",
      claimIds: [
        "radford-2019-byte-level-bpe",
        "liu-2019-byte-level-bpe-choice",
      ],
      sourceId: "liu-2019-arxiv-v1-full-text",
      locator: {
        label: "Target-side byte-level BPE inheritance",
        section: "4.4 Text Encoding",
      },
    },
  ];
  const targetIds = new Set([xlnetId, robertaId]);
  const relationships = corpus.relationships.filter((relationship) =>
    targetIds.has(relationship.to.id),
  );

  assert.deepEqual(
    corpus.works
      .filter((work) => chronologicalWorkIds.includes(work.id))
      .map((work) => work.id),
    chronologicalWorkIds,
  );
  assert.deepEqual(
    relationships.map((relationship) => [
      relationship.id,
      relationship.from.kind,
      relationship.from.id,
      relationship.to.kind,
      relationship.to.id,
      relationship.connectionType,
      relationship.evidenceClass,
      relationship.confidence,
      relationship.causalLanguage,
    ]),
    expectedEdges.map((edge) => [
      edge.id,
      "work",
      edge.fromId,
      "work",
      edge.toId,
      edge.connectionType,
      "documented-influence",
      "high",
      "qualified",
    ]),
  );
  for (const [index, relationship] of relationships.entries()) {
    const expected = expectedEdges[index];
    assert.deepEqual(relationship.claimIds, expected.claimIds);
    assert.deepEqual(
      relationship.sourceEvidence.map((evidence) => [
        evidence.sourceId,
        evidence.locator,
      ]),
      [[expected.sourceId, expected.locator]],
    );
    assert.deepEqual(
      new Set(
        relationship.claimIds.map(
          (claimId) =>
            corpus.claims.find((claim) => claim.id === claimId)?.workId,
        ),
      ),
      new Set([relationship.from.id, relationship.to.id]),
    );
    assert.ok(
      corpus.sources
        .find((source) => source.id === expected.sourceId)
        ?.relatedWorkIds.includes(relationship.to.id),
    );
  }
  assert.deepEqual(
    corpus.relationships.filter(
      (relationship) =>
        relationship.from.id === xlnetId && relationship.to.id === robertaId,
    ),
    [],
  );
});

test("keeps post-BERT Transformer-XL and GPT-2 lineage evidence-scoped", () => {
  const bertId = "devlin-2018-bert-pre-training-deep-bidirectional-transformers";
  const transformerId = "vaswani-2017-attention-is-all-you-need";
  const gptId =
    "radford-2018-improving-language-understanding-generative-pre-training";
  const transformerXlId =
    "dai-2019-transformer-xl-attentive-language-models-beyond-fixed-length-context";
  const gpt2Id = "radford-2019-language-models-unsupervised-multitask-learners";
  const chronologicalWorkIds = [bertId, transformerXlId, gpt2Id];
  const expectedEdges = [
    [
      "vaswani-2017-to-dai-2019",
      transformerId,
      transformerXlId,
      "extends",
      "dai-2019-acl-full-text",
    ],
    [
      "radford-2018-to-radford-2019",
      gptId,
      gpt2Id,
      "extends",
      "radford-2019-openai-report-full-text",
    ],
    [
      "vaswani-2017-to-radford-2019",
      transformerId,
      gpt2Id,
      "builds-on",
      "radford-2019-openai-report-full-text",
    ],
  ];
  const edges = expectedEdges.map(([id]) =>
    corpus.relationships.find((relationship) => relationship.id === id),
  );

  assert.deepEqual(
    corpus.works
      .filter((work) => chronologicalWorkIds.includes(work.id))
      .map((work) => work.id),
    chronologicalWorkIds,
  );
  assert.deepEqual(
    edges.map((relationship) => [
      relationship.id,
      relationship.from.id,
      relationship.to.id,
      relationship.connectionType,
    ]),
    expectedEdges.map(([id, fromId, toId, connectionType]) => [
      id,
      fromId,
      toId,
      connectionType,
    ]),
  );
  for (const [index, relationship] of edges.entries()) {
    assert.ok(relationship);
    assert.equal(relationship.evidenceClass, "documented-influence");
    assert.equal(relationship.confidence, "high");
    assert.equal(relationship.causalLanguage, "qualified");
    assert.ok(
      relationship.sourceEvidence.some(
        (evidence) => evidence.sourceId === expectedEdges[index][4],
      ),
    );
    assert.deepEqual(
      new Set(
        relationship.claimIds.map(
          (claimId) =>
            corpus.claims.find((claim) => claim.id === claimId)?.workId,
        ),
      ),
      new Set([relationship.from.id, relationship.to.id]),
    );
    for (const evidence of relationship.sourceEvidence) {
      assert.ok(
        corpus.sources
          .find((source) => source.id === evidence.sourceId)
          ?.relatedWorkIds.includes(relationship.to.id),
      );
    }
  }
  assert.deepEqual(
    corpus.relationships.filter(
      (relationship) =>
        relationship.from.id === transformerXlId &&
        [bertId, gpt2Id].includes(relationship.to.id),
    ),
    [],
  );
});

test("keeps the contextual-transfer to Transformer-pretraining lineage scoped", () => {
  const workIds = [
    "vaswani-2017-attention-is-all-you-need",
    "peters-2017-deep-contextualized-word-representations",
    "howard-ruder-2018-universal-language-model-fine-tuning",
    "radford-2018-improving-language-understanding-generative-pre-training",
    "devlin-2018-bert-pre-training-deep-bidirectional-transformers",
  ];
  const expectedEdges = [
    [
      "vaswani-2017-to-radford-2018",
      "builds-on",
      "documented-influence",
      "high",
      "qualified",
      "radford-2018-openai-preprint-full-text",
    ],
    [
      "peters-2017-to-radford-2018",
      "addresses",
      "documented-influence",
      "high",
      "prohibited",
      "radford-2018-openai-preprint-full-text",
    ],
    [
      "howard-ruder-2018-to-radford-2018",
      "extends",
      "documented-influence",
      "high",
      "qualified",
      "radford-2018-openai-preprint-full-text",
    ],
    [
      "vaswani-2017-to-devlin-2018",
      "builds-on",
      "documented-influence",
      "high",
      "qualified",
      "devlin-2019-naacl-full-text",
    ],
    [
      "radford-2018-to-devlin-2018",
      "builds-on",
      "documented-influence",
      "high",
      "qualified",
      "devlin-2019-naacl-full-text",
    ],
    [
      "peters-2017-to-devlin-2018",
      "addresses",
      "documented-influence",
      "high",
      "prohibited",
      "devlin-2019-naacl-full-text",
    ],
  ];
  const edgeIds = new Set(expectedEdges.map(([id]) => id));
  const expectedClaimIds = new Map([
    [
      "vaswani-2017-to-radford-2018",
      [
        "vaswani-2017-attention-routes-and-causal-mask",
        "vaswani-2017-multi-head-attention",
        "vaswani-2017-positionwise-computation",
        "radford-2018-decoder-only-transformer-architecture",
        "radford-2018-transformer-antecedent-boundary",
      ],
    ],
    [
      "peters-2017-to-radford-2018",
      [
        "peters-2017-task-specific-layer-mixture",
        "peters-2017-frozen-feature-transfer",
        "radford-2018-task-aware-input-transformations",
        "radford-2018-elmo-contrast",
      ],
    ],
    [
      "howard-ruder-2018-to-radford-2018",
      [
        "howard-ruder-2018-three-stage-transfer",
        "radford-2018-two-stage-generative-transfer",
        "radford-2018-ulmfit-relationship",
      ],
    ],
    [
      "vaswani-2017-to-devlin-2018",
      [
        "vaswani-2017-encoder-decoder-architecture",
        "vaswani-2017-multi-head-attention",
        "devlin-2018-predecessor-and-scope-boundary",
        "devlin-2018-transformer-encoder-and-model-scales",
      ],
    ],
    [
      "radford-2018-to-devlin-2018",
      [
        "radford-2018-two-stage-generative-transfer",
        "radford-2018-decoder-only-transformer-architecture",
        "devlin-2018-predecessor-and-scope-boundary",
        "devlin-2018-transformer-encoder-and-model-scales",
        "devlin-2018-full-parameter-task-adaptation",
      ],
    ],
    [
      "peters-2017-to-devlin-2018",
      [
        "peters-2017-bidirectional-lm-objectives",
        "peters-2017-contextual-representation-family",
        "peters-2017-frozen-feature-transfer",
        "devlin-2018-predecessor-and-scope-boundary",
        "devlin-2018-transformer-encoder-and-model-scales",
        "devlin-2018-full-parameter-task-adaptation",
      ],
    ],
  ]);
  const edges = corpus.relationships.filter((relationship) =>
    edgeIds.has(relationship.id),
  );

  assert.deepEqual(
    corpus.works
      .filter((work) => workIds.includes(work.id))
      .map((work) => work.id),
    workIds,
  );
  assert.deepEqual(
    edges.map((relationship) => [
      relationship.id,
      relationship.connectionType,
      relationship.evidenceClass,
      relationship.confidence,
      relationship.causalLanguage,
      ...new Set(
        relationship.sourceEvidence.map((evidence) => evidence.sourceId),
      ),
    ]),
    expectedEdges,
  );
  for (const relationship of edges) {
    assert.deepEqual(
      relationship.claimIds,
      expectedClaimIds.get(relationship.id),
    );
    const endpointWorkIds = new Set(
      relationship.claimIds.map(
        (claimId) => corpus.claims.find((claim) => claim.id === claimId)?.workId,
      ),
    );
    assert.ok(endpointWorkIds.has(relationship.from.id));
    assert.ok(endpointWorkIds.has(relationship.to.id));
  }
  assert.ok(historicalScope.includes("Transformer pretraining fork"));
  assert.ok(historicalScope.includes("target-documented comparison"));
  assert.ok(historicalScope.includes("Every one of these edges includes target-side"));
});

test("keeps the 2014 encoder-decoder branches concurrent and noncausal", () => {
  const cho = corpus.works.find(
    (work) => work.id === "cho-2014-rnn-encoder-decoder",
  );
  const sutskever = corpus.works.find(
    (work) => work.id === "sutskever-vinyals-le-2014-sequence-to-sequence",
  );
  const relationship = corpus.relationships.find(
    (item) => item.id === "cho-2014-to-sutskever-2014",
  );
  const concurrency = corpus.claims.find(
    (claim) => claim.id === "sutskever-2014-cho-concurrency",
  );
  const relationshipIds = new Set(
    corpus.relationships.map((item) => item.id),
  );

  assert.equal(
    cho?.chronology.events.find(
      (event) => event.id === cho.chronology.orderingEventId,
    )?.date.value,
    "2014-06-03",
  );
  assert.equal(
    sutskever?.chronology.events.find(
      (event) => event.id === sutskever.chronology.orderingEventId,
    )?.date.value,
    "2014-09-10",
  );
  assert.deepEqual(relationship?.from, { kind: "work", id: cho?.id });
  assert.deepEqual(relationship?.to, { kind: "work", id: sutskever?.id });
  assert.equal(relationship?.connectionType, "conceptual-parallel");
  assert.equal(relationship?.evidenceClass, "editorial-synthesis");
  assert.equal(relationship?.confidence, "high");
  assert.equal(relationship?.causalLanguage, "prohibited");
  assert.deepEqual(
    relationship?.sourceEvidence.map((evidence) => evidence.sourceId),
    ["sutskever-2014-arxiv-v1-full-text"],
  );
  assert.ok(relationship?.rationale.includes("public chronology"));
  assert.ok(relationship?.rationale.includes("does not encode causation"));
  assert.ok(concurrency?.statement.includes("developed in parallel"));
  assert.ok(concurrency?.statement.includes("independently taken"));
  assert.ok(concurrency?.statement.includes("canonical proceedings revision"));
  assert.ok(relationshipIds.has("hochreiter-schmidhuber-1995-to-cho-2014"));
  assert.ok(relationshipIds.has("bengio-2000-to-cho-2014"));
  assert.ok(relationshipIds.has("hochreiter-schmidhuber-1995-to-sutskever-2014"));
  assert.ok(relationshipIds.has("mikolov-2010-to-sutskever-2014"));
  assert.equal(relationshipIds.has("mikolov-2010-to-cho-2014"), false);
  assert.equal(relationshipIds.has("sundermeyer-2012-to-cho-2014"), false);
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
