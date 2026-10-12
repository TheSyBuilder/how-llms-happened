# Atlas overview: chronology and qualified relationships

**Status:** static overview implemented, with a bounded [neighborhood comparison prototype](atlas-neighborhood-comparison.md) and an expert [static evidence-lens comparator](atlas-evidence-lens-comparison.md). The chooser, beginner and expert catalogues, and shared relationship/source register extend the existing journeys. Static acceptance does not establish measured learning benefit or complete present-day coverage; promotion of spatial and filtering enhancements remains conditional.

The overview must help a reader answer three questions: where does a work sit in the selected history, what does a recorded relationship actually establish, and what can I learn or inspect here today? It draws from the [shared corpus](../data/corpus.json), [editorial method](editorial-method.md), [historical boundary](historical-scope.md), and [existing visual system](product-architecture.md). It must make multiple branches legible without suggesting that the field followed one inevitable path.

## Scope and data readiness

The reviewed snapshot contains 66 works and 109 work-to-work relationships. These counts describe the selected corpus, not the field. The overview includes every admitted work, including the Markov prologue and Good context record; candidates and source-only references do not become nodes.

| Property | Snapshot | Consequence for the view |
|---|---|---|
| Inclusion roles | 42 core, 22 branch, 1 prologue, 1 context | Role is editorial scope, not rank, citation impact, or implementation status. |
| Ordering-date precision | 46 day, 12 month, 8 year | Twenty works cannot be displayed as exact-day events. |
| Ordering-event kinds | Preprint, report, publication, presentation, lecture | An ordering date need not be the canonical article's publication date. |
| Evidence classes | 100 documented-influence, 1 inherited-mechanism, 8 editorial-synthesis | Preserve the classes independently of the relationship type. |
| Causal-language permissions | 95 qualified, 14 prohibited | Documented evidence does not always permit a causal claim. |
| Rendered learning destinations | 10 chapters in both modes, 1 prerequisite in both modes | A prerequisite is not a complete chapter. |
| Rendered work references | 11 | The other 55 works have corpus evidence but no standalone reference route yet. |

These are a 2026-10-08 readiness audit of the checked-in data and route adapter. Implementations must derive counts and destinations rather than copying these numbers into interface constants. Academic inclusion and product availability remain separate fields.

### Coverage boundary

Use the visible wording **“Selected research history, 1913–2025”**, followed by **“Includes later revisions; coverage is selective and expanding.”** The last admitted ordering event is the January 2025 DeepSeek-R1 report. The work also has a September 2025 canonical article and January 2026 manuscript revision. The [arXiv record](https://arxiv.org/abs/2501.12948), rechecked on 2026-10-09, still lists version 2 dated 4 January 2026. This is a targeted version check, not a renewed field survey.

Keep three dates conceptually separate: the work's ordering event, the dates of its versions, and the corpus's latest targeted verification date. The corpus `asOf` value must never be presented as “complete through” that date. The [endpoint review](current-endpoint.md) records the nine-lane coverage decision and exclusions; the overview links it beside its scope statement. New works require the existing research protocol, not a moving “today” marker or automatically imported release feed.

## Reference audit

The audit considers documented navigation and explanation patterns. It does not certify these tools' accessibility or reproduce their layouts, branding, code, or datasets. Sources were accessed on 2026-10-08. Knight Lab's live site returned an access error; its indexed documentation and official repository supplied the available description. Connected Papers' live about page required JavaScript; the indexed first-party explanation supplied its graph semantics. No direct usability test of those two interfaces is claimed.

| Precedent | Observed or documented pattern | Adoption and boundary |
|---|---|---|
| [Knight Lab TimelineJS documentation](https://timeline.knightlab.com/docs/index.html) and [official source](https://github.com/NUKnightLab/TimelineJS3) | Dated events support a larger narrative. Its guidance favors a short chronological story rather than frequent jumps. | Keep date, event, and explanation together. A 66-work atlas needs a catalogue and local relationship navigation rather than a compulsory slide sequence. |
| [Connected Papers explanation](https://www.connectedpapers.com/about) | Its force-directed neighborhood reflects bibliographic similarity; it explicitly distinguishes that graph from a citation tree. | Adopt focus on one work and its neighborhood. Do not import similarity distance, inferred links, or shortest-path-as-influence language. |
| [Paperscape](https://paperscape.org/) | Its map clusters referencing patterns; circle size reflects citation counts, with paper and reference inspection. | Adopt inspectable identity and local context. Equal-size marks suit this curated corpus; prominence and geometric proximity must not stand in for foundational influence. |
| [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) | Linked views expose intermediate computation with nearby explanations and numerical feedback. | Carry selection into adjacent explanation and evidence. The atlas selects historical records; it does not run a model or borrow architecture claims from this precedent. |

The structural anchor is the project's existing warm technical ledger: ordered rows, visible metadata, rules, and adjacent evidence. Connected Papers contributes only the neighborhood-focus pattern; Transformer Explainer contributes only linked explanation. Paperscape and TimelineJS primarily expose boundaries to avoid. No new font, image asset, graph library, or visual theme is required.

## Design direction contract

- **Product job and audience:** orient curious readers in a long, branching research history and let experienced readers inspect what each date and relationship supports.
- **Primary action and proof:** choose a work, read its scoped contribution, inspect an incident relationship, then follow a working learning or source destination.
- **North star:** an annotated research index, with dates in the margin and evidence beside each connection.
- **Canvas, type, color, density, geometry, elevation:** preserve the warm off-white canvas, dark text, system sans prose, monospace dates and identifiers, square evidence regions, and flat rules. Rows carry the catalogue; independent journeys retain their existing entry treatments.
- **Color roles:** blue marks the active selection; ochre marks evidence; amber labels uncertainty. The probability-mass colors from the smoothing workbench acquire no historical meaning here. Relation classes also have text and line patterns.
- **Imagery and motion:** original lightweight SVG may supplement a selected work's relationship list. The initial view is still. Selection updates without a camera flight, force simulation, animated edge travel, or scroll-driven state.
- **Required states:** all works, work selected, relationship inspected, no incident relationships, source inspection, filtered results, no matches, invalid URL state, JavaScript unavailable, keyboard focus, reduced motion, narrow screen, print.
- **Non-negotiables:** unchanged factual corpus; preserved event precision and calendar; independent relationship fields; readable evidence; distinct teaching paths; honest destination labels; complete static access.
- **Reject list:** a full 109-edge tangle, centrality rankings, citation-sized nodes, compulsory dragging or zoom, transitive influence paths, undated “modern model” endpoint, and empty chapter links.

## Information architecture and chronology

Use `/atlas/` as a small mode chooser, `/atlas/beginner/` and `/atlas/expert/` as separate static catalogues, and `/atlas/evidence/` as the mode-neutral relationship and source register. The home page keeps its two completed journeys and adds an atlas entry. Journey and reference pages return to the relevant work anchor. No search service, account or deployment is required.

Both modes include all 66 work identities and full date labels in a native HTML catalogue. Group by the printed ordering year and sort year groups numerically. Inside a year, order month/day records only by their established components. Equal dates or overlapping month-level dates share a labelled group whose internal reading order follows the corpus, without a priority claim. Year-only events occupy a separate **“Month and day not established”** group in that year; their position does not assert order against its finer-dated events. Never sort a year-precision event as though it occurred on 1 January. The dataset's insertion order is not a global chronology: Switch appears late in the file but belongs before the other selected 2021 works, and DPO belongs in 2023 before R1.

The catalogue is a sequence of year groups, not a metrically scaled time axis. Label **“Rows are grouped by year; spacing does not measure elapsed time.”** A collapsed gap names the years with no admitted ordering events and says **“No selected works in this interval.”** It never implies that research stopped. The 1913 prologue and 1948 main opening receive their existing boundary descriptions.

Each row displays the title, author summary, ordering date and event kind, canonical-version label, inclusion role, mode-specific significance, and available destinations. The selected record also exposes the event's ID, calendar, date note, date evidence, and source links. Markov's date remains source-as-printed; no Gregorian conversion is inferred. A later canonical title or publication year does not rename the ordering event: Elman's row belongs to April 1988 while its canonical article is 1990.

If a future view uses fine date placement, month and year values must be represented as uncertainty intervals rather than fabricated points. Overlapping intervals mean unresolved public order at the recorded precision, not demonstrated independent invention. The present catalogue compares printed components and needs no timestamp or calendar conversion. Group labels make **“Reading order does not establish research priority”** explicit.

### Availability labels and destinations

| Derived state | Visible label and action |
|---|---|
| A `built` journey stage names the work | **Chapter available**; link to the selected mode's existing stage. |
| A resolved interlude names the work but no built stage does | **Prerequisite available**; link to its mode-specific stage anchor. |
| `getBuiltReferenceWorkIds()` includes the work | **Reference available**; link to the generated work reference. |
| No generated reference route exists | **Corpus record**; inspect an inline record with claims and primary-source links. |

“Corpus record” is a usable evidence destination, not a placeholder. Its native disclosure contains identity, canonical version, significance, limitations, uncertainty, and source-bound claims. No “Read chapter” control appears without a real route. Both corpus-only and rendered-reference works expose incident relationship identities and all three semantic fields inline, with ordinary links to the complete shared evidence record. Today's reference pages also link to that record; their narrower relationship summary is not used as the atlas evidence projection.

## Relationship semantics and evidence contract

Three independent fields govern presentation:

1. `connectionType` names the recorded relationship: `builds-on`, `extends`, `combines`, `addresses`, `challenges`, or `conceptual-parallel`.
2. `evidenceClass` states the evidential basis: `documented-influence`, `inherited-mechanism`, or `editorial-synthesis`.
3. `causalLanguage` limits the wording and direction cue: `qualified` or `prohibited`.

A solid line denotes documented evidence, a dotted line inherited mechanism, and a dashed line editorial synthesis; each has the full text label. An arrowhead is allowed only for `qualified` relationships and is captioned as a scoped recorded connection, never universal causation. A `prohibited` connection has no causal arrowhead, even when documented. Its detail preserves stored `from` and `to` as **record orientation**, alongside the explicit causal restriction. The line pattern never encodes confidence or scientific importance.

The full relationship detail contains both work identities, relationship ID, all three fields, confidence, rationale, bound claim statements and links, every `sourceEvidence` URL and locator/support statement, and all uncertainties with resolution conditions where supplied. The atlas adapter retains these fields from the validated record; the narrower reference-page summary links to the complete evidence view. Linking only a generic bibliography or prose rationale fails acceptance.

Show only the selected work's incident relationships in the optional spatial view, with one node per neighbor and parallel records retained separately in the list. No implied edges connect neighbors. The complete 109-record relationship index remains available as native text disclosures on the shared evidence route. Do not recursively expand or present a shortest path as inherited influence: qualified evidence is local and cannot be composed automatically. An absent recorded edge is an absence in this corpus, not evidence that no influence existed.

### Grounded inspection cases

| Case | Required observation |
|---|---|
| `markov-1913-to-shannon-1948` | Editorial conceptual parallel, causal language prohibited, and missing direct-influence evidence stay visible. The opening sequence is a teaching boundary, not a proven citation chain. |
| `elman-1988-to-mikolov-2010` | Named Elman architecture/citation supports a qualified `builds-on` relationship limited to copied state and context dependence. Training procedure, datasets, and results do not transfer. |
| `graves-2013-to-bahdanau-2014` | Documented technical comparison still prohibits causal language. A solid evidence line alone must not imply derivation or inspiration. |
| `cho-2014-to-sutskever-2014` | June and September posting dates coexist with version-1 parallel-development evidence. Editorial direction does not establish conception order or priority. |

All cases resolve to existing corpus records and their evidence. They add no claims or relationships.

## Interaction brief 1: Work focus and local explanation

**Status:** accept native anchor/disclosure navigation first; an optional linked spatial enhancement follows the complete static treatment.

**Exact learning objective.** Locate a work using its actual ordering event, distinguish it from its canonical version, and explain one recorded relationship using its evidence and scope. A beginner should recognize why the story begins before 2017; an expert should audit an event and relationship without conflating chronological order, documented comparison, and derivation.

**Why ordinary prose or one diagram is insufficient.** The task is orientation across 66 records and 109 relations. A single global diagram overloads the local question, while scattered prose makes the relevant identities, dates, evidence, and reading destinations hard to compare. Selection colocates a bounded neighborhood and its explanation. The native catalogue and relationship list remain the complete competitor; no learning-gain claim is made for drawing lines.

**User action and visual response.** Activate a work's ordinary anchor. Its record is reached in document order and shows incident relationships and availability. An optional enhancement synchronizes a fixed, labelled neighborhood diagram with that record; incident connections are highlighted and unrelated connections are absent. The summary states the work, ordering event, and number of incident records. Inspecting a relation opens its evidence disclosure. Selection changes visibility and focus only; it does not recalculate history.

**Beginner pedagogy.** The entry asks “Where does this history begin?” and offers two further orientation questions: “What does a carried state contribute?” and “Did one encoder–decoder paper cause the other?” Each links a curated starting work and adjacent plain-language inspection prompt using the grounded cases above. No question locks content. The catalogue remains available. The active record uses beginner significance, a short date-versus-version explanation, and a prompt to predict what the connection establishes before revealing evidence. Learning destinations take priority over field names.

**Expert pedagogy.** Start with the full catalogue, explicit event/version crosswalk, and the complete incident relationship inventory. The task asks the reader to verify the locator, connection scope, and causal restriction, then inspect the source or switch to the corresponding beginner work anchor. Confidence, IDs, source locators, and open issues remain directly available. The expert entry does not repeat the beginner's prerequisite sequence.

**Represented claims and inspiration.** The four grounded cases bind the interaction to existing date evidence, architecture claims, concurrency claims, and relationship evidence. Connected Papers supplies local focus and Transformer Explainer supplies adjacent linked explanation; neither supplies historical facts or graph semantics.

**Accessibility, mobile, motion, and performance.** Use native links and disclosures; no ARIA tree, spatial arrow-key mode, hover-only label, or drag requirement. Diagram marks have corresponding HTML entries; the SVG may be a redundant, non-focusable illustration with a short description and a nearby structured alternative. At 320 pixels, the catalogue precedes the selected record and relationship list; the diagram may be omitted while retaining all facts. No autoplay or motion is necessary. Render all text server-side and measure optional client payload and updates against the acceptance table below.

**Misconception guards.** Keep source-date precision, role, availability, and causal restriction visible. Give all nodes equal visual weight. Explain isolated nodes and corpus selection. Do not draw a line merely because two works are adjacent in reading order.

**Acceptance.** A reader can reach every work and every incident relation by keyboard without JavaScript, identify Elman's two dates, explain the Markov–Shannon boundary, distinguish the Graves comparison from derivation, and reach only existing routes. The enhanced view must be consistent with its complete HTML equivalent and must not move focus unexpectedly.

## Interaction brief 2: Evidence-lens comparison

**Status:** accept a conditional expert enhancement after the static relationship index. Beginner mode uses guided side-by-side cases and native disclosures, without a filter wall.

**Exact learning objective.** Distinguish what is recorded from how it is supported and what causal language is permitted. In particular, recognize that documented comparison does not automatically establish influence and that editorial chronology can coexist with independent development.

**Why ordinary prose is insufficient.** A definition explains each label separately but does not expose the cross-class cases in a real corpus. Comparing subsets lets a reader hold the selected work fixed and observe which relationships remain under an evidence constraint. The static competitor presents the Markov, Elman, Graves, and Cho–Sutskever cases side by side with the same fields. Ship the enhanced filter only if it makes inspection easier without turning labels into a certainty ranking.

**User action and visual response.** In expert mode, choose a single evidence class or “All evidence,” choose causal permission or “All permissions,” and optionally choose a connection type. Apply with a native button rather than filtering on every keystroke. Constraints intersect; the list and local diagram show the same retained records and announce a concise result count. The selected work stays fixed. Show matched, total incident, and outside-neighborhood counts explicitly so a global total is not confused with a neighborhood total. A global relationship index can be filtered separately under a clearly labelled scope.

**Mode difference.** Beginner mode compares the three evidential bases through named examples and asks which claim is justified; it always exposes the causal prohibition when relevant. Expert mode allows independent filters and audits all retained locators and qualifications. Mode switching preserves the work anchor, resets mode-specific controls, and explains that reset; incompatible filter state never changes the corpus.

**Represented concepts and inspiration.** The lens represents the corpus's relationship contract rather than any paper's model algorithm. Paperscape's inspection pattern and Connected Papers' explicit similarity disclaimer motivate a visible legend and semantic boundaries. No similarity or citation score is computed.

**Accessibility, mobile, motion, and performance.** Use labelled native selects, an Apply button, Clear filters, and a polite count message after application. Focus remains on Apply. A removed result never strands focus; the selected record and summary persist. At narrow widths controls and results form one column. Color removal and reduced motion preserve all distinctions. Hide nonfunctional filtering controls until enhancement is available; without JavaScript the full relationship index and comparison remain usable.

**Misconception guards.** “No matches” names the active constraints and offers Clear filters; it never says “No influence.” Filtering never changes confidence or replaces rationale with a generated explanation. Prohibited causality remains visible after selecting documented evidence. Editorial-synthesis records remain inspectable rather than being treated as data errors.

**Acceptance.** All evidence returns 109 global records in this snapshot; editorial synthesis returns 8; causal prohibition returns 14. Their intersection behavior must follow actual field values, including noneditorial prohibited records. Equivalent static tasks must remain usable. Invalid URL filters recover to defaults with visible explanation; Back/Forward restores applied state if URL persistence is implemented. No filter appears in the first static release.

## Implementation contract and verification

Build a separate atlas projection over the validated corpus and both journey manifests. Do not extend a journey's restricted work list into a supposedly full corpus. Retain ordering-event objects and evidence, canonical-version identity, relationship source evidence/uncertainties, and all destination availability. Stable work and relationship IDs provide anchors. Mode copy selects existing significance and bound teaching cases; it does not overwrite dates or claims.

| Gate | Acceptance |
|---|---|
| Corpus coverage | Exactly one catalogue identity per admitted work; all relationships resolve to both endpoints. Counts and facet results recompute from data. Corpus objects and lineage remain unchanged. |
| Chronology | 12 month and 8 year values keep precision; no date is padded with an inferred day. Markov's calendar note, Elman's report/article distinction, Switch's position before the other selected 2021 works, DPO's 2023 placement, ROOTS's unresolved within-2022 position, and reading-order disclaimer pass explicit checks. |
| Evidence | Every relationship retains all three independent fields, source locators/support, claim bindings, confidence, and uncertainties. The four grounded cases pass source inspection. No transitive claim is emitted. |
| Availability | Ten chapter destinations, one prerequisite, and eleven reference routes resolve; corpus-only works have usable inline records and no dead chapter/reference links. Counts derive from manifests and generated paths. |
| Modes | Beginner orientation questions and prediction/explanation tasks differ from expert crosswalk and evidence audit. Both modes reach the same identities and evidence; switching preserves the work. |
| Static access | All 66 works and 109 relations are inspectable across the linked catalogue and evidence routes with JavaScript disabled. Native disclosure, anchor, source, journey, print, and graphics-hidden access retain the represented information. |
| Accessibility | Keyboard-only tasks, logical headings/disclosures, visible unobscured focus, labelled controls, axe checks with evidence expanded, 200% zoom, and color removal pass. Prefer 44 CSS-pixel controls; at minimum meet the applicable 24 CSS-pixel target/spacing rule. |
| Responsive and visual | Render at 1440, 768, 640, and 320 CSS pixels. Titles, date notes, IDs, source URLs, and relation labels wrap; no essential page-level horizontal scroll. Review catalogue, selected/high-degree work, expanded evidence, and no-match state where applicable. |
| Performance | First release adds zero atlas client JavaScript; each atlas mode page stays below 512 KiB gzip HTML, with source details deduplicated through a linked source register where needed. Any later enhancement adds at most 24 KiB gzip including its dependencies, requires no remote model/data service, and updates within 50 ms on the existing representative mobile profile. No hidden raw corpus bundle. |
| Learning evaluation | Static acceptance verifies task access and semantic correctness. Before claiming or requiring a spatial/filter enhancement, compare it with the static treatment on date-versus-version and evidence-versus-causality tasks. Retain static treatment if the enhancement adds misconceptions or no useful inspection benefit. |

Accessibility references: [WAI complex-image alternatives](https://www.w3.org/WAI/tutorials/images/complex/), [focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), and [target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), accessed 2026-10-08. These support structured alternatives, visible focus, and target constraints; they do not substitute for rendered or human testing.

### Bounded build order

1. Add the lossless atlas projection and meaningful data tests for precision, complete evidence, independent relationship fields, and route availability. Implement the chooser and both native catalogue/evidence routes. Keep the 55 corpus-only works inline; do not mass-generate reference pages or add client filters yet.
2. Render and inspect the complete static release at the specified sizes and states; run source, keyboard, no-JavaScript, accessibility, link, and payload checks. Integrate the home and journey return links only with working destinations.
3. Evaluate a small local-neighborhood prototype and expert evidence lens against the static release. Add either enhancement only after its own acceptance gates pass. A complete static overview is a valid product outcome.

### Static release and payload decision

Both catalogues retain all 66 work identities and 969 source-bound claims. Every ordering event retains its full date evidence, calendar and notes; a native crosswalk preserves chronology and version identities. Canonical bibliography and notes remain inline, while other versions link to their source records. The adapter retains every original corpus object without dropping noncanonical fields.

Repeating the complete 109-record relationship index and 602-record source register in both mode pages exceeded the 512 KiB compressed HTML gate (about 703 kB per mode). A shared, mode-neutral evidence route removes that duplication. Each work still lists all incident record IDs through links, with connection type, evidence class and causal permission visible. Relationship details retain every locator/support statement, bound claim statement, confidence and uncertainty. Context links return to either learning mode; native links into a collapsed claim open its enclosing corpus record without JavaScript. This is a static information-architecture adjustment, not a relaxation of evidence coverage.

The first two build steps and the bounded neighborhood prototype are complete. Companion pages provide the four grounded cases, complete incident lists, date/version crosswalks and optional desktop SVGs without client JavaScript. The [comparison protocol](atlas-neighborhood-comparison.md) defines task correctness and material-error criteria. The expert [evidence-lens comparator](atlas-evidence-lens-comparison.md) now exposes eight lossless static intersections per case, all excluded fields, local/outside/global count partitions and explicit empty-result recovery. No learner evaluation has been conducted. The full catalogue and complete incident lists remain baselines; diagram promotion and client filtering remain conditional. The recurrent cursor remains independently gated by its [existing interaction brief](recurrent-memory-interaction.md); an atlas prototype does not waive that requirement.
