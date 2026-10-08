# First-slice product architecture

This document is the implementation contract for LLM Lineage's first vertical slice. It turns the selected Good–Katz–Kneser–Ney–Chen/Goodman sequence and its two accepted interactions into one coherent product system. It does not add paper claims or authorize a public deployment.

The architecture makes one distinction central: beginner and expert readers take different learning journeys, but both journeys resolve to the same works, versions, claims, relationships, sources, and uncertainties in `data/corpus.json`.

## Product contract

- **Product job and audience:** guide a curious newcomer through one defensible historical mechanism while letting a researcher or practitioner inspect its equations, evidence, versions, limitations, and lineage.
- **Primary actions and proof:** choose a learning path, predict what a sparse estimator will do, inspect the resulting probability ledger, and follow any explanation back to a source-located corpus claim.
- **North star:** an annotated research ledger. Quantities balance, historical stages remain dated, and every factual statement has an inspectable evidence trail.
- **Structural anchor:** a data-editorial reading sequence paired with one persistent workbench. The reading order remains complete without the workbench.
- **Expressive donor:** an archival ledger contributes rules, marginal labels, folio-like source markers, and visible annotations. It does not contribute nostalgic ornament or simulated paper damage.
- **Detail donor:** direct manipulation appears only inside the two accepted interactions, with ordinary controls providing the same operations.
- **Canvas, type, color, density, geometry, and elevation:** warm light canvas, near-black ink, humanist sans text, tabular mono numerals, comfortable narrative density, compact evidence density, mostly square geometry, hairline rules, and flat surfaces.
- **Imagery and motion:** original count marks, mass bars, and tables are explanatory marks. No paper figure is copied. Motion is brief state continuity, never autoplay or a prerequisite for comprehension.
- **Required states:** untouched, prediction recorded, changed, checkpoint result, reset, source inspection, keyboard focus, narrow screen, 200% zoom, reduced motion, and JavaScript unavailable.
- **Non-negotiables:** shared corpus facts; distinct learner tasks; visible version and source scope; synthetic-example labels; keyboard and screen-reader equivalents; static fallbacks; no unsupported genealogy.
- **Reject list:** a force-directed atlas as the main navigation, scroll-jacked chapters, ornamental particles, drag-only controls, a single global mode toggle that merely hides paragraphs, copied paper graphics, card grids around every section, and empirical controls that blend incomparable experiments.

## Information architecture

The experience has two complementary systems:

1. **Journeys** answer “help me understand how this idea changed.” They are ordered, mode-specific, and checkpoint-driven.
2. **Reference pages** answer “show me the record.” They are mode-neutral views of the shared corpus and remain directly linkable from either journey.

The first slice uses these stable routes:

| Route | Job | First-slice content |
|---|---|---|
| `/` | Orient a reader and offer a proportionate next step | Project promise, historical boundary, “Learn the smoothing story,” and “Inspect the sources” |
| `/journeys/smoothing/` | Explain the sequence and let the reader choose a path | Four-stage map, prerequisites, estimated commitment, beginner and expert path descriptions |
| `/journeys/smoothing/beginner/` | Preview the beginner journey | Learning goals, optional probability primer, stage list, and start action |
| `/journeys/smoothing/expert/` | Preview the expert journey | Notation contract, version scope, assumed prerequisites, stage list, and evidence map |
| `/journeys/smoothing/{mode}/{stage}/` | Teach one historical stage | Good 1953, Katz 1987, Kneser–Ney 1995, or Chen–Goodman 1998/1999 |
| `/reference/works/{workId}/` | Inspect a work without pedagogical filtering | Bibliography, versions, chronology, ideas, claims, evidence locators, relationships, limitations, and uncertainties |
| `/reference/ideas/{ideaId}/` | Follow a mechanism across works | Definition, bound claims, related works, and qualified relationships |

The stage slugs are `good-1953`, `katz-1987`, `kneser-ney-1995`, and `chen-goodman-1998`. Each maps to exactly one work ID in the corpus. Claim links use stable anchors on the relevant work page, for example `/reference/works/katz-1987-sparse-data/#claim-katz-1987-zero-estimate-gate`.

The first build does not need a complete graph explorer, global search, accounts, saved notes, or a complete-corpus timeline. Those features would widen the product before the first learning sequence has been tested. The home page may show the four selected nodes and the project’s broader coverage, but it must not imply that the first slice is the full atlas.

With both the smoothing and recurrent-memory journeys implemented, the next expansion is the [atlas overview](atlas-overview.md): a static-first full-corpus catalogue with distinct orientation and evidence-audit paths. Its brief preserves the visual system and defines precise chronology, relationship, availability, and coverage semantics. A global force-directed explorer remains outside that bounded build.

### Page anatomy

Every journey stage follows the same orienting frame while allowing mode-specific pedagogy:

1. a breadcrumb, mode label, and stage position;
2. the stage question and contribution boundary;
3. the learning sequence for the selected mode;
4. an accepted interaction or source-bound static treatment;
5. a checkpoint that does not lock later content;
6. “what changed from the prior stage” and “what remains limited”;
7. evidence details and links to the mode-neutral work record;
8. previous, next, and corresponding-mode links.

The page title, main heading, active stage, active mode, and canonical version must be available as text without opening a menu or source panel. A reader arriving at a deep link never has to return to the journey landing page to learn where they are.

## Two complete learning journeys

The paths share chronology and evidence but differ in prerequisites, tasks, controls, pacing, and completion criteria. They are separate static routes, not conditional paragraphs in one document.

### Beginner journey

The beginner path uses the question “Where should probability go when the exact phrase is rare or missing?” It teaches one distinction at a time.

1. **Entry and optional primer.** The reader sees a three-row count table, verifies that a conditional distribution sums to one, and can open a short primer on seen, rare, and unseen events. A self-check routes a reader to the primer or directly to Good; it never blocks progress.
2. **Good 1953 — evidence for the unseen.** A compact, explicitly non-language-model prelude shows how singleton evidence can signal probability mass belonging to unseen types. The reader distinguishes “estimate the size of the reserve” from “decide how a language model distributes it” and sees Good's explicit Turing attribution.
3. **Katz 1987 — keep, reserve, or back off.** The reader predicts which continuations retain a discounted higher-order estimate and which trigger lower-order allocation. The probability-mass ledger uses authored fixtures and labels the keep, reserve, and redistribute steps before introducing `n₁/N`, `β̃`, or `α`. The checkpoint asks why a seen continuation does not receive the lower-order term in the source-bound Katz stage.
4. **Kneser and Ney 1995 — change the fallback signal.** The reader holds a continuation's raw count fixed while moving one occurrence to a new predecessor context. The context-coverage lens compares ordinary frequency with distinct-context coverage and asks the reader to separate reserve size from reserve allocation.
5. **Chen and Goodman 1998/1999 — two later levers.** The ledger returns with a separately dated rule: lower-order evidence can contribute to seen continuations, and counts one, two, and three-or-more can use different discounts. The checkpoint compares hard backoff and interpolation without presenting either as a universal winner.
6. **Synthesis.** A four-row comparison asks what each work changes: unseen-mass evidence, conditional reserve and zero gate, fallback distribution, or interpolation and discount tiers. The reader succeeds by explaining the sequence in plain language and may then inspect the source record or switch to the expert synthesis.

Beginner controls expose only reviewed scenarios and one conceptual change per checkpoint. Equations are available through “show the notation,” but completing the beginner task never requires manipulating symbols or reading an empirical result table.

### Expert journey

The expert path uses the question “Which estimator component changes, under which assumptions and evidence envelope?” It is organized around reconstruction and audit rather than progressive metaphor.

1. **Entry and notation contract.** The reader sees the selected versions, notation crosswalk, prerequisites, claim inventory, and relationship confidence. The path warns that Katz's `α`, Kneser–Ney's `β`/`γ`, and Chen–Goodman's later interpolated form are source-specific.
2. **Good 1953 — derive and attribute.** The reader inspects smoothed frequency-of-frequencies notation, the adjusted-count relation, represented mass, and `n₁/N`; the evidence panel separates publication from Turing attribution and the language-model application boundary.
3. **Katz 1987 — reconstruct the piecewise estimator.** The reader derives the eligible lower-order set and `α`, selects reviewed count/discount fixtures in the ledger, and audits the cutoff and low-count renormalization. A static evidence panel preserves Table I's corpus, sample, and reproducibility limits.
4. **Kneser and Ney 1995 — derive the fallback distributions.** The reader computes both the distinct-context `N₊` ratio and singleton `N₁` alternative, then inspects the marginal and leave-one-out approximations, absolute-discount assumptions, seen/unseen branch, and unbenchmarked cost claim. The original hard-backoff form stays visually and verbally separate from later modified interpolation.
5. **Chen and Goodman 1998/1999 — compare implementations.** The reader reconstructs equations (21)–(26), the recursive continuation distribution, `D₁/D₂/D₃₊`, and the held-out, fixed-count, and hard-backoff variants. Cross-entropy results stay in source-bound small multiples or tables; no scrubber turns differing corpora, orders, and training sizes into a continuous control.
6. **Synthesis and lineage audit.** The reader compares operator, normalization, assumptions, version, experimental scope, and uncertainty across all four stages. The three qualified relationships are inspectable, including the medium-confidence Katz-to-Kneser–Ney edge and the explicit prohibition on unsupported Jelinek–Mercer genealogy.

Expert controls expose exact reviewed fixtures, formula terms, eligible sets, and calculation traces. They do not accept arbitrary corpora or claim to reproduce a paper's experiment.

### Moving between paths

- The URL is the authority for mode. No script or stored preference may silently redirect a reader.
- Every stage links to the corresponding stage in the other mode and explains what changes: task, prerequisites, controls, and evidence depth.
- Switching paths preserves the historical stage, not transient interaction state.
- The first slice stores no mode preference or cross-page progress. Checkpoint state is transient, cannot hide content or alter factual copy, and is never required for navigation.

## Content and evidence components

### Shared orienting components

- **Journey map:** an ordered list with dates, titles, contribution boundaries, and current position. It is not a causal graph.
- **Stage header:** question, work title, chronology label, version scope, inclusion status, and mode-specific objective.
- **Change ledger:** a four-column comparison of what is held constant, what changes, why it matters, and which claims support it.
- **Prior/next bridge:** one sourced sentence about the qualified relationship plus a plain-language preview. Relationship confidence and evidence class remain visible.
- **Limitation band:** material limits and open uncertainties near the explanation they qualify, not in a remote disclaimer page.

### Source inspection

Source inspection has three depths built from one evidence object:

1. **Reference marker:** a compact, named link such as “Katz 1987, eqs. 13–23.” It links to the claim anchor even when enhancement is unavailable.
2. **Evidence details:** native `details` content containing work, version, claim statement, source title, locator, support note, confidence, limitations, access date, and the external primary-source link. This is the baseline at every viewport.
3. **Evidence rail:** on wide screens, a progressively enhanced rail can keep the currently focused evidence visible beside expert content. On narrow screens it becomes ordinary inline details; it never becomes a modal that obscures the claim being checked.

The component may quote only short, necessary source fragments. Paper figures, tables, and prose are redrawn or paraphrased unless a verified license permits reuse. Public accessibility is not treated as a reuse license.

An evidence marker's accessible name identifies the claim and source rather than saying only “citation.” Opening or closing evidence does not move focus unexpectedly. External links identify the destination and use ordinary browser behavior.

### Interaction frame

Both accepted interactions use the same frame:

- historical stage, synthetic-example badge, learning objective, and represented claim IDs;
- prediction prompt before the first reveal;
- native controls plus an optional direct-manipulation surface;
- HTML data table and text summary as the semantic ground truth;
- supplementary SVG or CSS marks hidden without loss from assistive technology;
- visible normalization total and changed-statistic summary;
- reset, compare-before, and checkpoint actions;
- static before/after fallback already present in the server-rendered page.

No general charting library is needed for the first slice. The diagrams have a small, known grammar and should be drawn with semantic HTML plus lightweight, original SVG where a spatial comparison helps.

## Visual system

The visual direction is **warm technical ledger**: the rigor and scanability of a research notebook, with contemporary web typography and controls. The system is editorial, not nostalgic.

### Semantic roles

| Role | Treatment | Purpose |
|---|---|---|
| Canvas | warm off-white | Sustained reading without simulated paper texture |
| Surface | warm white | Tables, controls, and focused evidence regions |
| Primary text | near-black neutral | Claims, headings, labels, and equations |
| Secondary text | cool charcoal | Metadata and explanatory support |
| Rule | neutral gray hairline | Alignment, grouping, and table structure |
| Focus | saturated blue outline with offset | Keyboard location; never reused as decoration |
| Observed mass | deep blue plus solid fill and label | Retained higher-order quantity |
| Reserved mass | rust plus diagonal pattern and label | Probability set aside |
| Redistributed mass | deep teal plus dotted pattern and label | Lower-order contribution |
| Evidence | dark ochre marker plus source icon/text | Inspectable factual support |
| Warning/uncertainty | dark amber text, tint, icon, and explicit label | Open or disputed boundary |
| Success/error | separate semantic foreground, tint, icon, and text | Checkpoint feedback only |

Exact color values are implementation tokens and must pass contrast on their actual surfaces. Color is always paired with wording, position, or pattern. There is one verified light theme in the first slice; a dark theme is deferred until it can be designed and tested as its own surface system.

### Typography and layout

- Use a system humanist sans stack for prose and interface text in the first build. Add a bundled font only after license, character coverage, fallback metrics, and payload are verified.
- Use a system monospace stack with tabular numerals for counts, probabilities, claim IDs, and source locators. Equations may use build-time KaTeX output, with readable text alternatives where notation is not self-explanatory.
- Keep narrative measure near 65–72 characters. Evidence can be denser but must retain visible headings and line spacing.
- Use a 12-column desktop grid: five columns for the guided reading, six for the workbench, and one gutter. An optional evidence rail occupies a rebalanced three-column region only when enough width remains.
- Use rules, whitespace, alignment, and type scale before containers. Cards are reserved for independently actionable objects, not every paragraph.
- Controls receive modest corner rounding; evidence tables and ledger regions stay mostly square. Shadows are unnecessary in the first slice.

### Responsive behavior

- **Wide desktop:** reading and workbench remain linked side by side. The workbench may be sticky within its own stage but releases before the next stage and never drives the document scroll.
- **Laptop/tablet:** reading comes first and the workbench follows within the same stage. Evidence details remain adjacent to the claim that invokes them.
- **Narrow screen:** prompt, controls, table, marks, explanation, and checkpoint form one column. The learner sees one continuation at a time in the context lens plus a persistent two-row comparison table.
- **At 200% zoom:** use the narrow layout; no essential content or control requires horizontal page scrolling. Long equations may scroll inside a labelled region.
- **Print and JavaScript unavailable:** show the stage narrative, paired static states, answers after the checkpoint, full evidence details, and route links. Hide only controls that cannot operate.

## Corpus-to-view-model boundary

`data/corpus.json` remains the sole factual source of truth. Journey content may select, sequence, paraphrase, and teach corpus facts; it may not redefine bibliographic data, chronology, claim statements, source locators, relationship confidence, or uncertainty.

The build has four layers:

```text
data/corpus.json + schemas/corpus.schema.json
                    |
          validate and index by stable ID
                    |
 journey manifest + synthetic fixtures
                    |
       resolve references and build page views
                    |
       static HTML + small interactive islands
```

### Authoring inputs

The first implementation should add two kinds of public, reviewable input:

1. A **journey manifest** for sequence, stage slugs, mode-specific objectives, authored teaching blocks, interaction placement, and claim bindings.
2. **Synthetic fixture files** for interaction inputs, expected outputs, invariant checks, represented claim IDs, and the required “synthetic example” label.

Every teaching block declares a kind:

- `instruction`, `prompt`, or `navigation` may omit claim IDs when it makes no historical, technical, empirical, attribution, or chronology assertion;
- `explanation`, `comparison`, `equation`, `result`, `limitation`, and `lineage` require one or more claim or relationship IDs;
- empirical-result blocks also require specific result claim IDs and display the source version, locator, and claim limitations resolved from the corpus;
- later-stage comparisons must name the later work so they cannot leak backward into an earlier source state.

The manifest stores pedagogical copy and selection only. Work titles, authors, dates, version labels, source URLs, locators, confidence, limitations, and uncertainty are resolved from the corpus during the build.

### Build-time adapter

A pure TypeScript adapter should:

1. run the existing corpus validator before any page generation;
2. create immutable indexes for works, versions, ideas, sources, claims, relationships, and objectives;
3. validate the journey manifest and fixture schemas;
4. fail on a missing, duplicate, wrong-work, wrong-mode, or source/version-incompatible reference;
5. resolve each stage into a `StageView` containing only the data required by that route;
6. generate reciprocal reference links and previous/next stage links;
7. emit a build report with route count, unresolved-reference count, and per-route client payload.

The browser never downloads the full corpus. Static pages receive rendered evidence and a minimized interaction payload containing only the active fixture, labels, and claim references.

### View-model shapes

The implementation may refine names, but it must preserve these boundaries:

```ts
type StageView = {
  journeyId: string;
  mode: "beginner" | "expert";
  stage: { slug: string; position: number; total: number };
  work: WorkSummary;
  canonicalVersion: VersionSummary;
  objective: ResolvedLearningObjective;
  blocks: ResolvedBlock[];
  interactions: InteractionView[];
  limitations: ResolvedClaimBoundary[];
  evidence: EvidenceView[];
  previous?: RouteRef;
  next?: RouteRef;
  alternateMode: RouteRef;
};

type EvidenceView = {
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
  }>;
  limitations: string[];
  uncertainties: string[];
};
```

Components consume view models, not raw corpus arrays. This makes unsupported joins difficult and keeps source-selection logic outside presentation code.

## Technical approach

### Rendering and enhancement

- Use Astro in static-output mode with strict TypeScript. Astro's component-island model renders ordinary components as HTML and loads client JavaScript only for explicitly hydrated components, which matches the requirement that narrative and evidence remain complete without JavaScript.
- Use Preact for the two interaction islands only. Do not mix client frameworks. The calculation engine remains framework-neutral TypeScript so unit tests do not require a browser.
- Hydrate an interaction when it approaches the viewport. Its server-rendered static fallback occupies the final dimensions, preventing layout shift and remaining visible if loading fails.
- Render equations at build time with KaTeX. No client math renderer is required for the first slice.
- Use CSS custom properties and cascade layers for tokens, base styles, layout, components, utilities, and print. Do not introduce a utility framework before the visual vocabulary proves it necessary.
- Use native links, buttons, radio groups, selects, ranges, tables, and `details` elements before custom widgets.

Astro's official documentation describes islands as independently hydrated enhancements on otherwise static HTML and supports visibility-triggered client loading. Its content tooling also supports local structured data and build-time validation, but the existing nested corpus should continue through the project's stricter validator and adapter rather than being reshaped to fit a framework loader.

Dependency versions are chosen and locked when M5 starts, after checking the then-current supported releases. This architecture commits to capabilities, not an uninstalled version number.

### State and URLs

- Route and fragment identify journey, mode, stage, and evidence target.
- Interaction state is local to the island and serializable for tests, but it is not encoded in the canonical URL during the first slice.
- The first slice does not persist mode, progress, or interaction state. Reloading restores the authored default and loses no content.
- No account, backend, analytics, remote feature flag, or service worker is required.

### Calculation boundary

Each estimator is a pure function from a reviewed fixture and selected rule to a result containing counts, retained mass, reserve, eligible fallback set, normalized distribution, and an explanation key. The UI never hardcodes expected numeric outputs.

Tests cover every reachable fixture, nonnegative values, invariant raw counts in the context lens, correct `N₊`/`N₁` counts, stage-specific formula availability, and probability totals within `1e-9`. Invalid fixture states fail during the build rather than producing a warning in the browser.

## Accessibility and performance contract

### Accessibility

- One `main` landmark and one `h1` per page; headings reflect the visible learning hierarchy.
- A skip link reaches the stage content. Keyboard order follows reading order, including when desktop columns are visually rearranged.
- Every pointer operation has a named native-control equivalent. Optional drag never owns the only path.
- Focus remains on the activating control after an update. A polite live region announces only committed changes and checkpoint results.
- Tables carry captions and header associations. Supplementary marks are hidden from assistive technology when the table and summary already contain the information.
- Touch targets meet the project's 24-by-24 CSS-pixel minimum and use a larger preferred area where layout permits.
- Reduced motion removes travel, interpolation, and animated reordering. State changes remain apparent through text, pattern, and a brief non-motion highlight.
- Automated checks use Playwright with axe, followed by manual keyboard, screen-reader spot checks, zoom, forced-colors, and reduced-motion review. Playwright's own guidance notes that automated accessibility checks cover only part of the problem, so an axe pass is never the whole acceptance decision.

### Performance

- Static journey and reference pages ship no client framework runtime.
- A page with an interaction ships at most 40 KB of compressed interaction-specific JavaScript, including Preact and shared interaction code.
- Fixture data stays below the existing 10 KB ledger and 5 KB context-lens limits. The full corpus is never a client asset.
- A committed update completes within 50 ms on the representative mid-tier mobile test device.
- Reserve dimensions for tables, equations, and interactive marks so hydration produces no visible layout shift.
- Use no third-party runtime scripts, remote fonts, continuously running animation, or general visualization library in the first slice.
- Record built asset sizes in CI and fail when a budget is exceeded. Measure the rendered stage pages, not an empty shell.

## Verification plan

M5 must add checks in this order:

1. existing corpus validation and regression tests;
2. journey-manifest, route, and evidence-binding validation;
3. pure calculation and fixture-invariant tests;
4. static build, internal-link, and missing-anchor checks;
5. Playwright journeys with JavaScript on and off;
6. keyboard, reduced-motion, 320 CSS-pixel, 200% zoom, and print cases;
7. axe scans plus manual accessibility checks;
8. desktop, tablet, and narrow-mobile screenshots of untouched, changed, checkpoint, evidence-open, and fallback states;
9. client-payload and update-time budgets;
10. factual review mapping all visible historical and technical copy to its declared claim or relationship IDs.

Visual review compares the result with the warm technical ledger contract. It must explicitly reject unexplained gradients, dark technical styling, floating cards, decorative glass, pill-heavy navigation, copied paper imagery, weak contrast, and mobile layouts that detach a control from its result.

## Architecture acceptance matrix

| Requirement | Architectural decision | Observable M5 gate |
|---|---|---|
| One factual corpus | Build-time adapter resolves all facts from `data/corpus.json` | No journey field duplicates corpus bibliography, chronology, locator, confidence, or uncertainty; all references resolve |
| Genuinely different modes | Separate routes, tasks, controls, prerequisites, and success criteria | Beginner and expert stage snapshots remain materially different when factual copy is removed from the comparison |
| Stable history | Stage-specific views expose only claims valid for that source state | Automated test prevents Chen–Goodman interpolation or discount tiers appearing as a 1995 control |
| Evidence inspection | Claim anchors, native details, and an optional evidence rail share one evidence view | Every factual block reaches a version-labelled locator with JavaScript disabled |
| Interaction necessity | Only the accepted ledger and context lens receive client enhancement | No other control or animation is added without a reviewed brief |
| Keyboard and screen reader parity | Native controls, semantic tables, summaries, and restrained announcements | Both tasks complete with graphics hidden and pointer unused |
| Responsive integrity | Side-by-side desktop becomes one ordered mobile column | 320 CSS pixels and 200% zoom show no essential horizontal page scroll |
| Reduced motion | Instant updates and non-motion change cues | Reduced-motion run contains no travel, autoplay, or animated reordering |
| Progressive enhancement | Static content and paired fallback states are server rendered | All route, source, comparison, and checkpoint-answer content remains usable with JavaScript blocked |
| Performance | Static shell, visible-only islands, minimized route data, explicit budgets | Bundle and fixture limits pass; updates complete within 50 ms on the test device |
| Rights and provenance | Original redraws, short necessary quotations, explicit external sources | Review finds no copied unlicensed paper figure, table, or substantial prose |
| Visual coherence | Warm technical ledger roles and one flat depth model | Desktop and mobile review pass hierarchy, contrast, alignment, source visibility, and state clarity |

## Decision

M4 passes at specification level. The information architecture, two complete journeys, visual roles, source-inspection behavior, corpus boundary, static-first technical approach, progressive-enhancement behavior, and acceptance matrix form one implementable system.

M5 followed the specified sequence: the static Astro shell and build-time adapter established the evidence boundary; the Good prelude and Katz ledger passed first; the Kneser–Ney context lens and Chen–Goodman stage followed under the same factual, no-JavaScript, keyboard, responsive, visual, and payload gates. The complete four-stage slice now passes those checks. A future failed gate reopens the relevant design decision rather than being papered over in presentation code.

## Technical references reviewed

- [Astro: Islands architecture](https://docs.astro.build/en/concepts/islands/) — static HTML by default, explicit client islands, and visibility-triggered hydration.
- [Astro: Content collections](https://docs.astro.build/en/guides/content-collections/) — build-time structured-content loading and schema validation; reviewed to confirm fit, not to replace the existing corpus contract.
- [Playwright: Accessibility testing](https://playwright.dev/docs/accessibility-testing) — axe integration and the stated need for manual and inclusive testing beyond automation.
- [Playwright: Emulation](https://playwright.dev/docs/emulation) — device, viewport, touch, color-scheme, and related browser emulation used by the verification plan.

These technical references were accessed on 2026-09-22. The learning and accessibility references behind the interaction decisions remain recorded in [Interaction language](interaction-language.md).
