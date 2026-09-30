# Interaction language for the first slice

This document closes the interaction-design gate for the first vertical slice. It accepts two linked interactions for the Good → Katz → Kneser–Ney → Chen–Goodman sequence and rejects interaction where a static treatment is clearer.

Acceptance here authorizes product-architecture work, not interface implementation. The corpus remains the factual source of truth, and every visible state in a later prototype must be generated from a reviewed, explicitly synthetic teaching corpus or from source-bound historical evidence.

## Learning job

The slice has one cumulative question: when finite data leave plausible phrases rare or unseen, where does probability mass come from, and what evidence should determine where it goes?

The beginner path should leave a learner able to:

- distinguish observed counts, discounted mass, reserved mass, and redistributed mass;
- explain why Katz uses a lower-order distribution only when the higher-order estimate is zero;
- explain why the number of distinct contexts can be more useful than raw token frequency for fallback;
- distinguish original Kneser–Ney backoff from Chen and Goodman’s later interpolation and count-tier discounts.

The expert path should let a learner inspect the corresponding count statistics, normalization terms, piecewise branches, assumptions, and source equations without turning the experience into an unrestricted estimator implementation.

Empirical result tables, version differences, lineage evidence, and rights or artifact boundaries remain static evidence panels. Manipulating them would not expose a causal relationship and could imply comparability that the papers do not establish.

## Reference audit

The audit reviewed interaction patterns, not factual sources for the smoothing papers. No reference code, visual identity, example data, or composition is copied.

| Reference | Useful pattern | Constraint carried forward |
|---|---|---|
| [Seeing Theory: Probability Distributions](https://seeing-theory.brown.edu/probability-distributions/) | A parameter change and its distribution are colocated, and exact values remain visible beside graphical output. | Use one small control group at a time; do not reproduce its visual language or assume its controls meet this project’s accessibility bar. |
| [R2D3: A Visual Introduction to Machine Learning](https://r2d3.us/visual-intro-to-machine-learning-part-1/) | A stable visual object gains one conceptual layer at a time, letting the narrative establish vocabulary before exposing a complete model. | Use guided stages without scroll-jacking; all state changes also need explicit controls and a non-motion path. |
| [TensorFlow Playground](https://playground.tensorflow.org/) | Reset, step, and immediate linked feedback make experimentation reversible and low-risk. | Avoid its all-at-once control density. The beginner path gets curated scenarios rather than a wall of hyperparameters. |
| [Red Blob Games’ interactive-tutorial process](https://www.redblobgames.com/making-of/circle-drawing/) | Direct manipulation is valuable when the handle represents the quantity being changed; the explanatory diagram can differ from production code when it exposes the concept more clearly. | Dragging is an enhancement, never the only input. The underlying action also needs buttons or a select control and a precise text state. |
| [Red Blob Games’ responsive-design notes](https://www.redblobgames.com/making-of/responsive-design/) | Text and diagrams should reprioritize by available content width, and responsive SVGs need input-coordinate handling as well as visual scaling. | On narrow screens the evidence summary stays adjacent to the active control; comparison views stack without shrinking labels below a readable size. |
| [PhET’s interview-based simulation guidance](https://phet.colorado.edu/publications/archive/PhET%20Interview%20Paper%20Part%20II.htm) | Immediate-response controls, a visually dominant play area, prediction prompts, restrained startup motion, and grouped advanced controls keep attention on the concept. | Start still, expose at most one conceptual control group per stage, and reveal expert controls deliberately. No continuous attention-seeking animation. |

Accessibility requirements follow the [WAI slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/), [WCAG guidance for animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [complex-image alternatives](https://www.w3.org/WAI/tutorials/images/complex/), and [24 CSS-pixel minimum target guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum). These sources were accessed on 2026-09-21.

## Interaction direction contract

- **Product job and audience:** teach a defensible historical mechanism to curious newcomers while giving researchers and practitioners equation- and evidence-level inspection.
- **Primary action and proof:** change one count relationship, predict the consequence, and verify the resulting probability ledger against a normalized numeric summary and bound claim IDs.
- **North star:** an annotated probability ledger—every removed quantity has a visible destination, and every historical change receives its own dated rule.
- **Structural anchor:** a guided reading column paired with one persistent, linked workbench; on narrow screens, the active prompt, control, response, and explanation form one uninterrupted stack.
- **Expressive and detail donors:** Seeing Theory contributes colocated numeric and graphical feedback; Red Blob contributes direct manipulation only where it shortens the conceptual mapping. R2D3 contributes staged disclosure. Their branding, palettes, layouts, and code do not transfer.
- **Canvas, type, color, density, geometry, elevation:** exact tokens wait for product architecture. The interaction requires a quiet editorial canvas, tabular numerals, high-contrast text, and a small semantic palette for observed, reserved, and redistributed mass. Color never carries state alone. Flat grouping and rules take precedence over floating cards and shadows.
- **Imagery and motion:** token tiles, count marks, and mass bars are explanatory marks, not illustrations. State changes are immediate or use a short position/length transition; reduced-motion mode replaces all movement with an instantaneous update and a changed-value highlight.
- **Required states:** untouched, prediction recorded, changed, correct/incorrect checkpoint, reset, source-inspection, keyboard focus, narrow-screen, reduced-motion, and JavaScript-unavailable static fallback.
- **Non-negotiables:** one shared factual corpus; visible “synthetic example” labels; source and version labels; distinct beginner and expert tasks; complete keyboard operation; a readable text or table equivalent; normalization visible in every computed state.
- **Reject list:** ornamental node graphs, particles standing in for probability, free-form formula sandboxes, autoplay, scroll-bound state as the only control, drag-only input, decorative heatmaps, and empirical charts that imply controlled comparisons absent from the papers.

## Accepted interaction 1: Probability-mass ledger

**Status:** accepted for the first vertical slice.

### Learning objective

Trace probability mass through three historically distinct stages:

1. Good’s corpus-level estimate that singleton evidence implies mass for previously unseen species;
2. Katz’s history-specific discount, reserve, lower-order allocation, and zero-estimate gate;
3. Chen and Goodman’s later change from hard backoff to interpolation, plus separate discounts for counts one, two, and three-or-more.

The learner must distinguish the global quantity `n₁/N`, Katz’s history-specific reserved mass `β̃`, and the lower-order normalizer `α`. The interaction must not render them as one unchanged variable.

### Why static prose is insufficient

A static equation can show normalization at one instant, but it does not make the conservation relationship perceptually inspectable when a count or rule changes. The learning value comes from holding a small corpus fixed, changing exactly one rule, and seeing the higher-order estimate, reserved pool, eligible lower-order set, and final normalized distribution update together.

A static annotated figure remains beside the interaction as the no-JavaScript and print treatment. The interactive version is retained only if testing shows that learners can explain where removed mass goes and identify the zero-estimate gate more reliably after using it.

### User action and response

The workbench opens in a still, source-labelled scenario. The learner first predicts which continuations will receive lower-order mass, then commits one of a small set of actions:

- select a different observed-count pattern;
- switch between the source-bound Katz hard-backoff stage and the later Chen–Goodman interpolated stage;
- in expert mode, choose a reviewed count/discount preset and inspect its computed terms.

Four linked representations update:

1. a count table for one synthetic history and its candidate continuations;
2. a mass bar divided into retained higher-order mass, reserve, and lower-order contribution;
3. a final conditional-probability table whose total is always shown;
4. a prose state summary naming what changed and why.

The source stage, year, work title, and represented claim IDs remain visible. Changing stages resets the prediction prompt so the later rule is not mistaken for an option already present in Katz.

### Beginner treatment

- Uses three authored scenarios: rare observations, an unseen continuation, and a seen continuation under interpolation.
- Uses labels such as “keep,” “set aside,” and “redistribute” before introducing symbols.
- Asks one prediction question before revealing the update.
- Exposes the Good/Turing attribution as a short prelude, then explicitly changes scale from corpus-level unseen mass to a conditional history.
- Ends with a checkpoint that asks whether a seen continuation receives lower-order evidence under Katz and under Chen–Goodman.

### Expert treatment

- Shows `nᵣ`, `r*`, `dᵣ`, `β̃`, `α`, the zero-estimate branch, `D₁/D₂/D₃₊`, and the interpolated sum beside the numeric ledger.
- Lets the learner select only reviewed, deterministic toy fixtures; it does not claim to reproduce a paper experiment or expose a production smoothing library.
- Shows exact normalization denominators and eligible continuation sets.
- Links each formula to its corpus locator and keeps the original 1995 Kneser–Ney backoff form out of the Chen–Goodman stage unless the learner opens the historical comparison.
- Leaves perplexity and cross-entropy results in a static evidence panel with corpus, sample, order, and uncertainty limits.

### Claim binding

- Prelude: `good-1953-frequency-of-frequencies`, `good-1953-turing-attribution`, `good-1953-unseen-mass`.
- Katz mechanism: `katz-1987-turing-adjusted-count`, `katz-1987-discounting-definition`, `katz-1987-global-unseen-mass`, `katz-1987-history-reserved-mass`, `katz-1987-lower-order-allocation`, `katz-1987-recursive-backoff`, `katz-1987-zero-estimate-gate`, `katz-1987-count-threshold`, `katz-1987-low-count-renormalization`, `katz-1987-novelty-boundary`.
- Later changes: `chen-goodman-1998-interpolated-form`, `chen-goodman-1998-three-discount-form`, `chen-goodman-1998-recursive-lower-orders`, `chen-goodman-1998-implementation-variants`.
- Learning objectives: `beginner-katz-1987-backoff`, `expert-katz-1987-estimator`, `beginner-chen-goodman-1998-two-levers`, and `expert-chen-goodman-1998-modified-estimator`.

### Accessibility, responsive behavior, and performance

- Native radio buttons, buttons, selects, and range inputs are preferred over custom widgets. Any range input supports arrow keys, Home, and End and displays an editable numeric value where exact input is part of the expert task.
- The diagram is supplementary to an HTML table and state summary. A screen-reader user can read the same counts, mass categories, final probabilities, total, active historical rule, and changed terms.
- A polite live region announces only a committed scenario or rule change, not every pointer movement.
- Drag is optional. Every drag action has a named button or select equivalent with a target of at least 24 by 24 CSS pixels and a visibly larger preferred touch area.
- On narrow screens, controls precede the linked table and mass bar; no horizontal pan is needed for the beginner state. Expert equations may scroll within a labelled region without trapping page scroll.
- No state change requires animation. With reduced motion, values update immediately and changed cells receive a non-motion highlight.
- All calculations run locally from a fixture smaller than 10 KB. A committed update must complete within 50 ms on a representative mid-tier mobile device, and the interaction-specific JavaScript budget is 40 KB compressed, excluding the shared application shell and math renderer.
- Without JavaScript, the page shows the default ledger, the Katz/Chen–Goodman contrast, and the checkpoint answer as ordinary content.

### Misconceptions and safeguards

- **“Good–Turing is Katz’s invention.”** The prelude names Good’s explicit Turing attribution; Katz’s contribution boundary stays visible.
- **“Global unseen mass and Katz’s per-history reserve are the same quantity.”** They occupy separate stages, labels, and notation; no continuous animation morphs one into the other.
- **“Backoff always mixes lower orders.”** Katz’s seen branch visibly disables the lower-order term; the later interpolation stage visibly applies it to seen and unseen continuations.
- **“Original Kneser–Ney already used interpolation and three discounts.”** The stage label and historical comparison identify those as later Chen–Goodman changes.
- **“A toy scenario reproduces the reported experiments.”** Every fixture is labelled synthetic; empirical claims appear only in source-bound static panels.

### Acceptance criteria

1. Every reachable fixture produces nonnegative probabilities summing to one within `1e-9`, verified by automated tests.
2. A beginner can identify the Katz zero-estimate branch and the Chen–Goodman seen-event lower-order contribution from the visible state without opening expert notation.
3. An expert can recover `n₁/N`, `β̃`, `α`, the eligible fallback set, and the active discount tier from the numeric and formula views.
4. Switching historical stages never carries a formula, label, or claim from a later source into an earlier stage.
5. The complete task works with keyboard only, at 320 CSS pixels, at 200% zoom, with reduced motion, and with the graphical region hidden.
6. The static fallback communicates the same default comparison and contains direct source links.
7. A factual review maps every visible explanatory sentence to the claim IDs above and confirms that synthetic values are not presented as paper results.

## Accepted interaction 2: Context-coverage lens

**Status:** accepted for the first vertical slice.

### Learning objective

Hold a continuation’s total token count constant while redistributing its occurrences across predecessor contexts, then compare the ordinary lower-order frequency with Kneser and Ney’s distinct-context and singleton-based fallback signals. The learner should be able to explain why a frequent word concentrated after a few predecessors can receive less fallback weight than a less frequent word seen after many predecessors.

### Why static prose is insufficient

The paper’s “dollars” example gives a memorable snapshot, but the causal distinction is easier to test when one controlled intervention changes context coverage while preserving raw frequency. A before-and-after figure would require the reader to compare two count systems mentally. The linked interaction keeps token count invariant, exposes the changed distinct-predecessor count, and updates the fallback ranking immediately.

### User action and response

The learner works in an explicitly synthetic bigram corpus. Reassigning one occurrence from an already represented predecessor to a new predecessor keeps the continuation’s raw count fixed and changes its context coverage. Pointer users may move an occurrence tile between labelled predecessor rows; all users can perform the same action with “Move to existing context” and “Move to new context” controls.

The response shows:

- unchanged raw token count;
- changed `N₊` distinct-context count;
- in expert mode, changed `N₁` singleton-context count where applicable;
- ordinary and context-diversity fallback distributions side by side;
- the resulting rank change and a sentence explaining which statistic caused it.

Reset and “compare before” restore or pin the initial state. The interaction does not train a model or replay the Wall Street Journal experiment.

### Beginner treatment

- Begins with two candidate words and a prediction: “Which word travels across more contexts?”
- Shows occurrence stacks and distinct predecessor rows before any formula.
- Allows only one occurrence move per checkpoint so raw frequency and context diversity are not changed simultaneously.
- Ends by separating “how much mass was reserved” from “which words receive that mass.”

### Expert treatment

- Shows `N₊(·, ĥ, w) / N₊(·, ĥ, ·)` and the leave-one-out `N₁` alternative from the 1995 paper.
- Displays the seen/unseen branch and `γ(h)` normalization separately from the fallback distribution `β`.
- Offers a historical comparison to Chen and Goodman’s recursively smoothed continuation distribution, clearly dated and closed by default.
- Keeps the marginal-constraint denominator approximation and the distinct single-discount assumption in source notes rather than implying an exact unconstrained derivation.

### Claim binding

- Original motivation and mechanism: `kneser-ney-1995-standard-backoff-bias`, `kneser-ney-1995-backoff-form`, `kneser-ney-1995-free-backoff-distribution`, `kneser-ney-1995-marginal-constraint`, `kneser-ney-1995-absolute-discount`, `kneser-ney-1995-context-diversity`, `kneser-ney-1995-singleton-distribution`.
- Later comparison: `chen-goodman-1998-continuation-distribution`, `chen-goodman-1998-interpolated-form`.
- Learning objectives: `beginner-kneser-ney-1995-context-diversity` and `expert-kneser-ney-1995-estimator`.

### Accessibility, responsive behavior, and performance

- The corpus is an HTML table first. Occurrence tiles are a visual enhancement, and their accessible names include the continuation, predecessor, occurrence number, and whether moving it changes `N₊` or `N₁`.
- Keyboard operation uses ordinary buttons and selects; focus never follows a moving tile. The before/after summary is available as text and as a table.
- Color distinguishes neither word identity nor rank by itself; labels, patterns, and numeric columns remain present.
- Narrow screens show one continuation at a time with a persistent two-row comparison summary. The operation never requires precise drag placement.
- Reduced motion changes row and bar values instantly. No tile flies between rows.
- The synthetic corpus is smaller than 5 KB; updates must complete within 50 ms on the same representative device, and the interaction-specific JavaScript shares the 40 KB compressed slice budget with the probability-mass ledger where code is common.
- The JavaScript-unavailable fallback shows the initial and one controlled after-state in a paired table.

### Misconceptions and safeguards

- **“Kneser–Ney merely discounts frequent words more.”** The workbench holds token count fixed while changing predecessor diversity.
- **“The fallback statistic determines how much mass is reserved.”** The reserve and its allocation are shown as separate panels and steps.
- **“The 1995 paper used the familiar interpolated modified formula.”** The active stage says “1995 hard backoff”; later interpolation is a separately dated comparison.
- **“A heatmap proves linguistic alignment or importance.”** The view uses count rows and distributions, not attention-like heatmaps.
- **“The synthetic corpus is the paper’s WSJ sample.”** The fixture label and evidence panel state that it is a teaching construction only.

### Acceptance criteria

1. A controlled move can keep a word’s raw count fixed while changing `N₊`; automated fixtures verify both invariants and the resulting fallback distribution.
2. The ordinary-frequency and context-diversity rankings can diverge in at least one reviewed fixture, and the explanation names the exact changed statistic.
3. The expert view can reproduce both the `N₊` and `N₁` ratios for every fixture and keeps the paper’s approximations and assumptions visible.
4. The beginner checkpoint requires the learner to separate reserve size from reserve allocation.
5. The full task works with keyboard only, at 320 CSS pixels, at 200% zoom, with reduced motion, and without the occurrence-tile graphic.
6. Original backoff and later interpolation are never presented as simultaneous controls within one undated model state.
7. The static fallback shows the invariant raw count and changed context count without requiring visual inference from color.

## Rejected interaction candidates

### Empirical-result scrubber

Rejected. Scrubbing across corpora, training sizes, n-gram orders, metrics, and estimator variants would make incomparable conditions feel like one continuous experiment. Source-bound small multiples and tables are clearer and safer.

### Unrestricted smoothing formula playground

Rejected. Exposing arbitrary corpora, cutoffs, discounts, estimators, and recursion at once would shift the task from understanding the historical changes to debugging a language-modeling tool. Reviewed fixtures cover the required causal contrasts with testable outputs.

### Automatic probability-flow animation

Rejected. Moving particles or liquid-like mass would be ornamental, difficult to describe nonvisually, and likely to imply that probability is physically transported in time. A labelled ledger and instantaneous before/after comparison convey conservation without the false mechanism.

## Reduced instructional claim set

The first implementation should teach only the following claims interactively. Everything else remains source-linked prose, equations, tables, or evidence notes.

| Stage | Interactive claims | Static evidence retained beside it |
|---|---|---|
| Good prelude | Turing attribution; frequency-of-frequencies adjusted count; singleton-derived unseen mass | The paper’s broader population-estimation scope |
| Katz | History-specific reserve; lower-order allocation; recursive and zero-estimate gates | Practical cutoff, compact singleton variant, Table I conditions and results, contribution boundary |
| Kneser–Ney 1995 | Ordinary fallback bias; free fallback distribution; distinct-context and singleton signals | Both derivation approximations, experiment setup and tables, unbenchmarked cost statement |
| Chen–Goodman 1998/1999 | Interpolation for seen and unseen events; three discount tiers | Fixed versus held-out variants, recursive implementation details, all cross-entropy comparisons and limits |

## Milestone decision

M3 is complete. Both accepted briefs pass the necessity, source-binding, mode-difference, accessibility, keyboard, reduced-motion, mobile, performance, and misconception gates at specification level. The three rejected concepts stay rejected unless new evidence or user testing establishes a learning benefit that a static treatment cannot provide.

The [product architecture](product-architecture.md) defines the information architecture, separate beginner and expert journeys, visual and content systems, corpus-to-view-model boundary, technical approach, and acceptance matrix. M4 passed at specification level; the complete Good → Katz → Kneser–Ney → Chen–Goodman implementation now passes the accepted interaction gates.
