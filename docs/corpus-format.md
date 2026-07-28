# Corpus format

LLM Lineage keeps research evidence separate from interface copy. The canonical corpus is [data/corpus.json](../data/corpus.json), and its structural contract is [schemas/corpus.schema.json](../schemas/corpus.schema.json).

The checked-in corpus covers Markov’s 1913 *Eugene Onegin* study, Shannon’s 1948 and 1951 papers, Good’s 1953 frequency-of-frequencies estimator as statistical context, Jelinek, Bahl, and Mercer’s 1975 statistical speech decoder, Jelinek and Mercer’s 1980 treatment of interpolation and deleted estimation for sparse Markov sources, and the reciprocally cross-referenced 1982 handbook chapter that applies the method to a word-trigram model. It records the differently titled 1983 IEEE article, with its different author order, as a journal companion to that chapter after a claim-level comparison, then adds Katz’s 1987 recursive backoff estimator while keeping its inherited Good–Turing machinery distinct from Katz’s stated contribution. The corpus remains small enough to audit claim by claim while the classical statistical branch expands.

## What the corpus represents

The format separates six record types:

1. **Works** hold a display citation, inclusion rationale, chronology, versions, limitations, and beginner/expert significance. Each version owns its title, ordered authors, and machine-readable bibliography, including structured series, chapter, container editors, publisher, publication places, and identifiers when relevant.
2. **Ideas** name the mechanisms, formalisms, findings, objectives, problems, or constraints that connect works.
3. **Sources** identify the exact publisher record, original text, search snippet, translation, reprint, or archive consulted, with an access date and version scope.
4. **Claims** are atomic statements with a directness label, confidence, source locator, limitations, and uncertainty.
5. **Relationships** connect works or ideas using both a connection type and an independent evidence class.
6. **Learning objectives** define different beginner and expert outcomes over the same work, idea, and claim IDs.

This separation lets the eventual interface change its teaching path without creating a second factual history.

## Dates and versions

Every chronology event records a value and its precision:

```json
{
  "value": "1948-07",
  "precision": "month",
  "calendar": "gregorian"
}
```

A work’s `chronology.orderingEventId` selects the event used for timeline order. Other events remain visible rather than being collapsed into one date. Every event also carries `dateEvidence`; validation rejects a date whose precision is finer than the cited record supports.
Historical dates that have not been calendar-normalized use `source-as-printed` with a note instead of silently pretending to be Gregorian.

That distinction matters in the current corpus:

- Markov’s article records the date printed for the 1913 Academy presentation, the year-level journal publication, the December 2006 English translation, and its January 2007 online publication separately.
- Shannon’s 1948 article has July and October journal installments with different DOI records.
- Shannon’s 1951 issue is ordered with month precision even though a later catalog displays a day.
- Good’s 1953 article uses the publisher’s 1 December issue date; the inspected facsimile supports content and locators, not a separate chronology.
- Jelinek, Bahl, and Mercer’s article separates its March 1974 manuscript-received date from the May 1975 journal issue; the institution’s 1 January catalog date is not used for ordering.
- Jelinek and Mercer’s proceedings chapter is ordered at year precision. The Amsterdam workshop dates are container metadata, not evidence of the paper’s presentation day or the volume’s publication day.
- Jelinek, Mercer, and Bahl’s handbook chapter is also ordered at year precision. Publisher, Crossref, and original-volume records support 1982, but no authoritative month or day has been identified.
- The companion IEEE article separately records manuscript receipt on 23 February 1981, revision on 28 September 1982, and its March 1983 journal issue. IBM’s 1 January catalog date is not substituted for the printed issue month.
- Katz’s article separates receipt on 1 May 1986, revision on 2 September 1986, and the March 1987 journal issue. Crossref’s retrospective registration and day-valued license-start fields do not replace the month-level publication evidence.

Versions are also explicit. An article, book chapter, proceedings paper, translation, or corrected reprint can have different titles, ordered authors, sources, and pagination without silently sharing an identity or locator. The work-level title, authors, artifact type, and display citation describe the canonical version; validation requires the title and ordered authors to match that version.

The 1983 article is grouped with the 1982 chapter for publication provenance, not represented as another intellectual advance. All eight promoted lineage claims are present in both publications with matching section structure, equation numbering, quantitative values, and substantially the same wording. The grouping does not assert that the authors or publishers called it an edition or reprint, nor that either text derived from the other: the article’s manuscript history and the chapter’s year-only publication date leave development order unresolved.

## Evidence locators

Every claim requires at least one source location. Locators use the numbering printed in the cited source, not a browser or PDF viewer’s page index:

```json
{
  "sourceId": "shannon-1951-full-text",
  "locator": {
    "label": "§5, equation (17), printed p. 61",
    "section": "5. Entropy Bounds from Prediction Frequencies",
    "pageStart": 61,
    "pageEnd": 61,
    "equation": "17"
  },
  "support": "Gives the inequality connecting rank frequencies with upper and lower entropy bounds."
}
```

The `support` field explains why the location is relevant; it is not a substitute for reading the source.

Source provenance is independent of source content. The inspected 1980 facsimile is recorded as a primary full text on a third-party host, while library catalog records remain the preferred bibliographic sources. For the 1982 volume, Internet Archive is metadata-only because its scan is restricted; separately recorded Google Books query-conditioned search snippets supply the inspected claim locators, while the publisher and Crossref deposits remain the preferred bibliographic records. The 1983 claim comparison uses an author-uploaded IEEE scan that retains printed pagination and an institutional-use restriction. The Good and Katz audits likewise use non-preferred reading copies with exact printed pagination alongside Oxford, IEEE, and Crossref metadata. None of those reading copies is described as openly licensed or redistributed. The corpus neither treats snippets as complete full text nor infers an open license from public accessibility.

A structured publisher reference list may identify a cited work for relationship evidence, but it cannot stand in for a primary-text claim locator. The validator keeps those evidence roles separate.

## Relationship discipline

Relationship direction is earlier or contributing node → later or receiving node. Each edge has:

- a `connectionType`, such as `extends` or `conceptual-parallel`;
- an `evidenceClass`: `documented-influence`, `inherited-mechanism`, or `editorial-synthesis`;
- claim IDs and direct source evidence for every relationship;
- a `causalLanguage` gate for rendering;
- confidence, rationale, and uncertainty.

Only `documented-influence` may opt into carefully qualified causal explanation. Strong causal phrases remain rejected even there: a citation documents a connection, but does not by itself prove that one work caused another. A dated-before-B relationship is not enough.

The current corpus demonstrates the distinction:

- Markov 1913 → Shannon 1948 is an editorially useful conceptual parallel. Shannon cites Fréchet rather than Markov, and the reviewed evidence does not document direct influence from the *Onegin* study, so causal language is prohibited.
- Shannon 1948 → Shannon 1951 is documented: the later paper cites the earlier article and describes its prediction method as a new way to estimate the entropy and redundancy defined there.
- Good 1953 → Katz 1987 is a documented `extends` edge: Katz cites Good for Turing’s adjusted-count estimate and unseen-mass identity, then adapts that machinery to conditional m-grams through normalized recursive lower-order backoff. Good’s explicit credit to Turing remains part of the edge rather than being collapsed into sole authorship attribution.
- Shannon 1948 → Jelinek, Bahl, and Mercer 1975 is an inherited mechanism: Shannon models language as a context-conditioned stochastic source and explains recovery from noise using source redundancy, while the 1975 decoder uses a corpus-estimated word-sequence probability in posterior speech decoding. The 1975 paper does not cite Shannon, so the edge prohibits paper-specific causal language.
- Jelinek, Bahl, and Mercer 1975 → Jelinek and Mercer 1980 is an editorial `addresses` edge: the earlier decoder leaves unseen-transition estimation open, while the later chapter treats the analogous sparse-transition problem for general Markov sources. The later chapter does not cite the 1975 paper, so the edge does not assert direct influence.
- Jelinek and Mercer 1980 → Jelinek, Mercer, and Bahl 1982 is a documented `builds-on` edge: the published chapter names the 1980 paper as the detailed source for its method and instantiates it as a four-component trigram mixture. The 1980 paper also cites the chapter as forthcoming, so qualified rendering must preserve the unresolved development order rather than imply a simple priority sequence.

Katz cites Jelinek–Mercer deleted estimation as a comparison method but does not cite the 1982 chapter or 1983 companion while deriving backoff. The corpus therefore records the Table I comparison as a claim and connects both branches through the shared sparse-estimation problem rather than substituting the 1982 publication for the cited source or forcing a genealogical edge.

The 1980 chapter’s abstract mentions simulations and speech applications, but the inspected chapter supplies no dataset, table, metric, baseline, or numerical result. The 1982 chapter reports that unseen trigrams account for roughly 23% of trigram occurrences in new text samples for that model, but the cited passage does not expose the samples or counts needed to reconstruct that result. Katz’s Table I reports one-point perplexity advantages over Jelinek–Mercer in both rows on a 100-sentence test from approximately 750,000 words of office correspondence, without uncertainty or enough implementation detail for reproduction. These gaps remain explicit limitations rather than being promoted into stronger empirical claims.

## Priority language

Claims containing terms such as “first,” “invented,” “originated,” or “proved” require a `priorityReview` with:

- an operational definition;
- the scope of the prior-art search;
- the sources supporting the conclusion.

Without that record, validation fails. Narrow wording such as “the paper constructs” or “the experiment reports” is preferred when it says exactly what the evidence supports.

## Validation

Run:

```sh
npm run validate:corpus
npm test
```

The validator checks the JSON Schema and cross-record editorial rules, including:

- complete source records and evidence locators;
- valid calendar values and source-supported date precision;
- unique IDs and valid references across works, versions, sources, ideas, claims, and objectives;
- structured version titles and ordered authors, with canonical-version identity matching the work;
- source/work/version scope and evidence pages within the cited source’s pagination;
- controlled relationship and evidence labels;
- direct source evidence for documented influence;
- chronological direction for lineage edges and rejection of unsupported causal or priority wording;
- learning objectives whose cited claims belong to their stated work;
- both beginner and expert objectives for every included work.

The test suite mutates the valid corpus to prove that these failure cases are rejected.

## Expansion rule

A candidate should not be promoted by adding a title and date alone. A corpus-ready work needs:

- a primary source and version-aware bibliography;
- atomic claims with exact locators;
- limitations and material uncertainty;
- carefully typed relationships;
- distinct beginner and expert learning objectives.

The corpus schema may evolve as experiments, equations, datasets, implementations, and disputed histories require more structure. Schema changes must preserve the evidence and uncertainty already recorded.
