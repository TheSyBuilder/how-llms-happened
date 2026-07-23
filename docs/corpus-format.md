# Corpus format

LLM Lineage keeps research evidence separate from interface copy. The canonical corpus is [data/corpus.json](../data/corpus.json), and its structural contract is [schemas/corpus.schema.json](../schemas/corpus.schema.json).

The checked-in opening slice covers Markov’s 1913 *Eugene Onegin* study and Shannon’s 1948 and 1951 papers. It is intentionally small enough to audit claim by claim before the corpus expands.

## What the corpus represents

The format separates six record types:

1. **Works** hold a display citation, inclusion rationale, chronology, versions, limitations, and beginner/expert significance. Each version owns its machine-readable bibliography.
2. **Ideas** name the mechanisms, formalisms, findings, objectives, problems, or constraints that connect works.
3. **Sources** identify the exact publisher record, original text, translation, reprint, or archive consulted, with an access date and version scope.
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

That distinction matters in the opening slice:

- Markov’s article records the date printed for the 1913 Academy presentation, the year-level journal publication, the December 2006 English translation, and its January 2007 online publication separately.
- Shannon’s 1948 article has July and October journal installments with different DOI records.
- Shannon’s 1951 issue is ordered with month precision even though a later catalog displays a day.

Versions are also explicit. An original article, translation, or corrected reprint can have different sources and pagination without silently sharing a locator.

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

## Relationship discipline

Relationship direction is earlier or contributing node → later or receiving node. Each edge has:

- a `connectionType`, such as `extends` or `conceptual-parallel`;
- an `evidenceClass`: `documented-influence`, `inherited-mechanism`, or `editorial-synthesis`;
- claim IDs and, when influence is documented, direct source evidence;
- a `causalLanguage` gate for rendering;
- confidence, rationale, and uncertainty.

Only `documented-influence` may opt into carefully qualified causal explanation. Strong causal phrases remain rejected even there: a citation documents a connection, but does not by itself prove that one work caused another. A dated-before-B relationship is not enough.

The opening slice demonstrates the distinction:

- Markov 1913 → Shannon 1948 is an editorially useful conceptual parallel. Shannon cites Fréchet rather than Markov, and the reviewed evidence does not document direct influence from the *Onegin* study, so causal language is prohibited.
- Shannon 1948 → Shannon 1951 is documented: the later paper cites the earlier article and describes its prediction method as a new way to estimate the entropy and redundancy defined there.

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
- source/work/version scope and evidence pages within the cited source’s pagination;
- controlled relationship and evidence labels;
- direct source evidence for documented influence;
- chronological direction for lineage edges and rejection of unsupported causal or priority wording;
- learning objectives whose cited claims belong to their stated work;
- both beginner and expert objectives for every included work.

The test suite mutates the valid opening corpus to prove that these failure cases are rejected.

## Expansion rule

A candidate should not be promoted by adding a title and date alone. A corpus-ready work needs:

- a primary source and version-aware bibliography;
- atomic claims with exact locators;
- limitations and material uncertainty;
- carefully typed relationships;
- distinct beginner and expert learning objectives.

The corpus schema may evolve as experiments, equations, datasets, implementations, and disputed histories require more structure. Schema changes must preserve the evidence and uncertainty already recorded.
