# Recurrent-memory slice contract

## Status and boundary

This artifact closes the design-and-data gate for the second vertical slice. It defines the complete teaching inventory, preserves source-specific notation, fixes the Bengio prerequisite and smoothing bridge, and supplies schema-validated synthetic traces plus separate beginner and expert manifests.

The shared journey shell, complete static Elman chapter, original 1995/1997 LSTM chapter, and 1999/2000 forget-gate retention chapter implement the first three stages of this contract. Three later stages and both interludes are planned. No recurrent client interaction is shipped. The four interactive traces remain conditional prototypes under the rejection rule in the [interaction brief](recurrent-memory-interaction.md): if a complete static treatment teaches the activation/credit, forget/peephole, and original/composite distinctions as well or better, the client interaction is removed.

The machine-readable contract is split across:

- [the recurrent-memory journey](../data/journeys/recurrent-memory.json), which holds one shared six-work chronology with different beginner and expert block sequences;
- [the recurrent-memory fixture](../data/fixtures/recurrent-memory-trace.json), which holds four reviewed synthetic scenarios and expected traces;
- [the fixture schema](../schemas/recurrent-memory-fixture.schema.json), which makes later-mechanism absence structural rather than cosmetic;
- [the pure calculation engine](../src/lib/recurrent-memory-engine.ts), which recomputes every expected value and rejects historical leakage.

## Claim and objective inventory

The interaction has 18 claim bindings and eight objective bindings across its four mechanism stages. The three static convergence panels add twelve claim bindings. Every item below already exists in the canonical corpus and resolves to the listed version-bound primary source.

### Elman 1988/1990 — interactive carried-state stage

Canonical display source: Elman’s 1990 *Cognitive Science* article, using the UCSD-hosted scan with printed pp. 179–211.

- `elman-1990-simple-recurrent-context` — fixed one-to-one hidden-to-context copy and trainable upward paths, printed pp. 182–184, Figure 2.
- `elman-1990-task-dependent-memory` — stimulus- and task-dependent state, printed p. 184 and pp. 207–208.
- `elman-1990-contextual-token-representations` — context-dependent token states, printed pp. 198–199 and pp. 205–206, Figure 9.
- `elman-1990-memory-boundary` — numerical, dynamical, learning, and unresolved-capacity limits, printed pp. 203–204 and pp. 208–209.
- Objectives: `beginner-elman-1988-predictive-memory` and `expert-elman-1988-recurrent-state-and-evidence`.

The full journey manifest additionally uses the objective-bound prediction, lexical-class, fit, averaging, novel-word, and attribution claims. Those claims provide static evidence and do not add fixture controls.

### Hochreiter and Schmidhuber 1995/1997 — interactive protected-path stage

Canonical display source: the 1997 *Neural Computation* article, using the JKU-hosted journal reading copy. The December 1996 report supports version comparison but is not silently merged into the journal notation.

- `hochreiter-schmidhuber-1997-vanishing-exploding-error` — products of temporal derivatives, journal pp. 3–5, equations 4–6 and 8–11.
- `hochreiter-schmidhuber-1997-constant-error-carousel` — unit-weight linear path and constant-error carousel, journal pp. 5–6, equations 12–14 and Figure 1.
- `hochreiter-schmidhuber-1997-input-output-gates` — separate write and exposure controls, journal pp. 6–7, Figure 1.
- `hochreiter-schmidhuber-1997-local-truncated-gradient-algorithm` — source-defined error truncation, journal pp. 8–9, Figure 2.
- `hochreiter-schmidhuber-1997-original-cell-domain-boundary` — no learned forget gate or state-to-gate links plus task and capacity limits, journal pp. 6–9 and pp. 22–23.
- Objectives: `beginner-hochreiter-schmidhuber-1995-gated-memory` and `expert-hochreiter-schmidhuber-1995-mechanism-and-evidence`.

The protected fixture visualizes only the direct local cell-state path. It never labels that row the full recurrent Jacobian, an exact parameter gradient, or unlimited memory.

### Gers, Schmidhuber, and Cummins 1999/2000 — interactive retention stage

Canonical display source: the 2000 *Neural Computation* article, using the author-hosted journal PDF. The February report and ICANN paper remain separate versions.

- `gers-2000-continual-state-drift-problem` — accumulation, saturation, fixed-decay, and teacher-reset limits, journal pp. 4–5.
- `gers-2000-forget-gate-mechanism` — block-shared forget activation multiplying previous state before the input-gated write, journal p. 5, equations 6–7 and Figure 1.
- `gers-2000-forget-gate-learning-and-complexity` — initialization, journal eligibility recurrence, state/trace reset, and complexity, journal internal pp. 5–9, equations 11, 17, and 20.
- `gers-2000-evidence-boundary` — two synthetic continual task families and unevaluated real-world proposals, journal pp. 15–16.
- Objectives: `beginner-gers-1999-adaptive-forgetting` and `expert-gers-1999-mechanism-versions-and-evidence`.

The three presets change only the authored forget activation. Previous state, candidate, and input gate stay fixed. “Forgetting” always means activation-state retention or reset; it never means erasing learned parameters.

### Gers, Schraudolph, and Schmidhuber 2002 — interactive state-visibility stage

Canonical display source: the official JMLR article, printed pp. 115–143.

- `gers-2002-forget-gate-antecedent` — the 2000 forget-gated baseline, printed pp. 117–120, equations 3–4.
- `gers-2002-peephole-motivation` — gates cannot inspect a hidden cell state through a closed output gate, printed pp. 121–122, Figure 2.
- `gers-2002-peephole-mechanism` — state-to-gate links and previous/current-state update order, printed p. 122, equations 19–21.
- `gers-2002-peephole-learning-boundary` — equations 22–26, three added weights per cell, and truncated gate-error flow, printed p. 123.
- `gers-2002-evidence-boundary` — one-cell topology, ten runs, thresholded synthetic timing tasks, and absent language evidence, printed pp. 123–125.
- Objectives: `beginner-gers-2002-peephole-timing` and `expert-gers-2002-peephole-mechanism-and-evidence`.

The fixture compares gate decisions with and without the state terms. The forget gate remains the sole retained-state multiplier; a peephole is a weighted read into a gate preactivation.

### Bengio et al. 2000/2003 — static prerequisite panel

Canonical display source: the 2003 JMLR article.

- `bengio-2003-fixed-window-factorization` — product of next-word conditionals using the preceding `n−1` words, printed p. 1141.
- `bengio-2003-feedforward-softmax-architecture` — static lookup table `C`, concatenated `x`, optional hidden/direct paths, scores `y`, and vocabulary softmax, printed pp. 1141–1143, equation 1.
- `bengio-2003-recurrent-future-boundary` — recurrent implementations are allowed by the framework but not used by the main experiments, printed p. 1142 and pp. 1151–1152.

This panel supplies the normalized neural word-probability prerequisite. It explicitly contrasts Bengio’s static type-level lookup rows and fixed window with Elman’s context-dependent recurrent state. It is not a seventh stage and has no interactive control.

### Mikolov et al. 2010 — static recurrent-word-model convergence

Canonical display source: the official four-page Interspeech article, printed pp. 1045–1048.

- `mikolov-2010-fixed-window-motivation` — Bengio predecessor and fixed-window limitation, printed p. 1045 and reference 3 on p. 1048.
- `mikolov-2010-elman-recurrent-architecture` — current word plus prior state, sigmoid recurrence, and normalized next-word output, printed pp. 1045–1046, equations 1–5, with Elman in reference 7.
- `mikolov-2010-training-objective` — initialization, softmax, cross-entropy, stochastic-gradient schedule, and epochs, printed p. 1046, equations 3–6.
- `mikolov-2010-truncated-bptt-boundary` — current-step error only, temporal depth one, and deeper BPTT left for future work, printed p. 1046.
- `mikolov-2010-long-context-and-evidence-boundary` — truly long context not captured, cache complementarity, and evidence limitations, printed p. 1048.
- Journey objectives: `beginner-mikolov-2010-recurrent-word-prediction` and `expert-mikolov-2010-model-and-evidence`.

The panel must show normalized forward prediction and depth-one temporal credit at the same time. Neither becomes interactive, and no control combines the paper’s datasets, mixtures, ensembles, or online adaptation.

### Sundermeyer, Schlüter, and Ney 2012 — static composite-cell convergence

Canonical display source: the official four-page Interspeech article, printed pp. 194–197.

- `sundermeyer-2012-lstm-antecedent-and-variant` — original LSTM attribution plus collectively cited later modifications, printed pp. 194–195 and references 11–13 on p. 197, resolved by the cited primary texts.
- `sundermeyer-2012-memory-cell-mechanism` — gated candidate, forget-scaled prior state, output gate, and state-to-gate links, printed p. 195, Figure 1.
- `sundermeyer-2012-language-model-objective` — one-hot word input, softmax, cross-entropy, and likelihood interpretation, printed p. 195.
- `sundermeyer-2012-evidence-reproducibility-boundary` — graph-only principal comparisons and incomplete reconstruction details, printed pp. 195–197.
- Journey objectives: `beginner-sundermeyer-2012-gated-language-memory` and `expert-sundermeyer-2012-model-and-evidence`.

The target paper omits extensive cell equations and does not reproduce the 2002 update order. The page may inventory the composite paths but must not present a modern vector equation as source text or claim exact implementation identity with the earlier works.

### Journey-wide evidence inventory

The manifest uses all 62 claims attached to the six selected works. The smaller 18-claim fixture binding above is deliberate: only claims represented by the four synthetic traces belong in the calculator. Static narrative, results, limitations, and convergence evidence remain source-bound blocks.

- **Elman — 10:** `elman-1990-jordan-attribution`, `elman-1990-simple-recurrent-context`, `elman-1990-task-dependent-memory`, `elman-1990-next-word-prediction-setup`, `elman-1990-successor-likelihood-fit`, `elman-1990-emergent-lexical-classes`, `elman-1990-contextual-token-representations`, `elman-1990-clustering-artifact-check`, `elman-1990-novel-word-context-test`, and `elman-1990-memory-boundary`.
- **Hochreiter–Schmidhuber — 6:** `hochreiter-schmidhuber-1997-vanishing-exploding-error`, `hochreiter-schmidhuber-1997-constant-error-carousel`, `hochreiter-schmidhuber-1997-input-output-gates`, `hochreiter-schmidhuber-1997-local-truncated-gradient-algorithm`, `hochreiter-schmidhuber-1997-long-lag-experimental-scope`, and `hochreiter-schmidhuber-1997-original-cell-domain-boundary`.
- **Gers–Schmidhuber–Cummins — 9:** `gers-2000-continual-state-drift-problem`, `gers-2000-forget-gate-mechanism`, `gers-2000-forget-gate-learning-and-complexity`, `gers-2000-cerg-protocol`, `gers-2000-cerg-results`, `gers-2000-cerg-self-reset-analysis`, `gers-2000-noncontinual-memory-control`, `gers-2000-cnto-results`, and `gers-2000-evidence-boundary`.
- **Gers–Schraudolph–Schmidhuber — 9:** `gers-2002-forget-gate-antecedent`, `gers-2002-peephole-motivation`, `gers-2002-peephole-mechanism`, `gers-2002-peephole-learning-boundary`, `gers-2002-msd-results`, `gers-2002-gts-results-and-ablation`, `gers-2002-pfg-results`, `gers-2002-evidence-boundary`, and `gers-2002-lstm-limitations`.
- **Mikolov et al. — 13:** `mikolov-2010-fixed-window-motivation`, `mikolov-2010-elman-recurrent-architecture`, `mikolov-2010-training-objective`, `mikolov-2010-truncated-bptt-boundary`, `mikolov-2010-dynamic-adaptation`, `mikolov-2010-rare-word-probability`, `mikolov-2010-training-cost-comparison`, `mikolov-2010-wsj-evaluation-scope`, `mikolov-2010-wsj-scaling-results`, `mikolov-2010-wsj-ensemble-results`, `mikolov-2010-wsj-cross-data-results`, `mikolov-2010-rt05-evaluation-results`, and `mikolov-2010-long-context-and-evidence-boundary`.
- **Sundermeyer et al. — 15:** `sundermeyer-2012-full-history-motivation`, `sundermeyer-2012-lstm-antecedent-and-variant`, `sundermeyer-2012-memory-cell-mechanism`, `sundermeyer-2012-language-model-objective`, `sundermeyer-2012-input-normalization`, `sundermeyer-2012-projection-and-class-factorization`, `sundermeyer-2012-corpus-splits`, `sundermeyer-2012-rnn-lstm-perplexity`, `sundermeyer-2012-projection-results`, `sundermeyer-2012-long-context-results`, `sundermeyer-2012-output-clustering-results`, `sundermeyer-2012-french-asr-setup`, `sundermeyer-2012-french-wer-results`, `sundermeyer-2012-evidence-reproducibility-boundary`, and `sundermeyer-2012-conclusion-scope`.

Each stage resolves one beginner and one expert objective, for twelve journey objectives in total. The Bengio prerequisite uses three claims from its own work without becoming a stage; the smoothing bridge reuses Sundermeyer’s two French-recognition claims and creates no lineage edge.

## Source-notation crosswalk

The neutral ledger uses prose roles so one row can remain stable while the historical notation changes. Source notation is displayed beside it in expert mode; it is never replaced by the neutral names.

| Neutral ledger role | Elman 1990 | Hochreiter–Schmidhuber 1997 | Gers et al. 2000 | Gers et al. 2002 | UI and fixture boundary |
|---|---|---|---|---|---|
| Current external input | input units at time `t`; no compact recurrence equation is printed | source activations entering `net_cj(t)` and gate net inputs | source activations entering `net_cj^v(t)` and gate inputs | ordinary source term `Σ_m w_lm y_m(t−1)` | `inputs[]` or external gate terms are authored scalar teaching values, not learned embeddings or paper parameters. |
| Copied recurrent context | context units receive the previous hidden activations through fixed one-to-one weight-1.0 links | not the cell state; Elman’s copied context is a different architecture | not the forget-gated cell state | not a peephole | The Elman trace labels `copied context = prior state` separately from the trainable recurrent transform. |
| Candidate write | no separately gated candidate | `g(net_cj(t))` | `g(net_cj^v(t))` | traditional cell input retained in equations 1 and 4 | Fixture `candidate` is already the bounded candidate value; it is not a raw net input. |
| Input gate | absent | `y_inj(t)=f_inj(net_inj(t))` | `y_inj(t)=f_inj(net_inj(t))` | `y_inj(t)` with a peephole term from `s_cj^v(t−1)` in equation 19 | Display verb: **write**. |
| Retained state | ordinary hidden state is recomputed through learned paths | `s_cj(t−1)` returns through the fixed 1.0 CEC connection | `y_ϕj(t)s_cj^v(t−1)` in equations 6–7 | the inherited forget-gated term in equation 4 | `retained contribution`; it is absent as an independently controlled operation in the original cell. |
| Updated cell state | hidden activation/context copy rather than an additive protected cell | `s_cj(t)=s_cj(t−1)+y_inj(t)g(net_cj(t))` | `s_cj^v(t)=y_ϕj(t)s_cj^v(t−1)+y_inj(t)g(net_cj^v(t))` | updated by traditional equation 4 after input and forget gates | `state`; the original fixture structurally lacks forget and peephole fields. |
| Output gate and exposed output | output layer activation; not a normalized word distribution in the selected experiment | `y_outj(t)` and `y_cj(t)=y_outj(t)h(s_cj(t))` | same source roles with the extended state recurrence | `y_outj(t)` reads `s_cj^v(t)` through equation 21, then the cell output follows equations 5 and 7 | Display verbs: **expose** and `exposed output`. |
| Forget gate | absent | absent | `y_ϕj(t)=f_ϕj(net_ϕj(t))`; replaces fixed retention | inherited baseline and receives a previous-state peephole in equation 20 | Display verbs: **retain/reset**. Never call it parameter forgetting. |
| Peephole read | absent | absent | absent | weighted previous-state terms enter input and forget gates; a weighted updated-state term enters the output gate | Display verb: **inspect**. It changes a gate input or decision, not the definition of retention. |
| Backward credit | current-step local error update; no full BPTT through copied history | ordinary products of temporal derivatives versus the direct unit local CEC path; source-defined truncation outside the protected route | eligibility traces recur through `y_ϕj(t)` with journal-specific equations | truncated partials and no gate-error propagation back through peepholes into the CEC | The backward ledger has its own row position, labels, and table. It never shares an unlabeled line with forward state. |

The atlas’s Elman scalar formula `h_t = σ(w_x x_t + w_h h_(t−1) + b)` is explicitly a neutral teaching reconstruction. Elman’s source describes the fixed copy and trainable paths in prose and Figure 2. Likewise, the ordinary credit factors in the fixture are authored examples, not measured derivatives from a trained paper model.

## Reviewed fixture contract

The fixture is 8,051 bytes, below the 8 KiB limit. Every value is finite, labelled synthetic, recomputed by the pure engine, and compared with checked-in expected output to tolerance `1e−9`.

### Same token after two histories

- Both traces begin at `0.5`, use the same neutral scalar recurrence parameters, and end on the token `turn` with input `0.25`.
- History A reaches states `0.717075`, `0.446125`, and `0.570012`.
- History B reaches states `0.327393`, `0.639205`, and `0.607392`.
- The checkpoint is passed only if the learner can attribute the different final state to different copied context, not to a different current token or changed weights.

### Ordinary versus protected credit

- The forward cell starts at `0.4`, writes `0.3`, hides the state for two steps, and exposes `tanh(0.7)=0.604368` on the final step. This populated initial state, supplied candidates, and idealized 0/1 gate endpoints are teaching choices. The source starts at zero and uses logistic gates. Its Appendix A.1 output function is `h(x)=2/(1+exp(−x))−1=tanh(x/2)`, distinct from the fixture’s `tanh(x)`; the expert crosswalk displays both values at state `0.7`.
- The original cell has input and output gates only. A forget field, peephole field, or state-to-gate field is a build failure.
- The separate ordinary credit row multiplies four `0.6` factors, producing `1`, `0.6`, `0.36`, `0.216`, and `0.1296` from target distance zero through four.
- The protected direct-path row multiplies four unit factors and remains `1`. The label says “scoped direct cell path,” not “the gradient.”

### Adaptive retention

- Previous state is `0.8`; the candidate is `0.25`; input gate is `0.8`; the write is therefore fixed at `0.2`.
- Near-retain `0.9` keeps `0.72` and produces state `0.92`.
- Gradual-decay `0.5` keeps `0.4` and produces state `0.6`.
- Near-reset `0.1` keeps `0.08` and produces state `0.28`.
- Gate and retained magnitude must decrease in that order. The three choices are authored presets, not a slider.

### Peephole inspection order

- External gate terms, candidate, previous state, and three peephole weights remain fixed.
- Without peepholes, all inspected-state fields are structurally `null`.
- With peepholes, input and forget gates inspect previous state `0.6`.
- The cell then updates to `0.547298`.
- Only after that update does the output gate inspect `0.547298`.
- The comparison may highlight changed gate activations and resulting state/output. It may not draw a second retention path or claim that the numbers are a trained timer.

## Beginner and expert manifests

The [journey manifest](../data/journeys/recurrent-memory.json) keeps one factual chronology and two different teaching sequences per stage.

The beginner path asks one prediction at a time, uses **carry**, **write**, **retain/reset**, **expose**, and **inspect**, and keeps the current task adjacent to a persistent “state changes here; learned weights do not” reminder. Results are short, static, component-labelled summaries. Its final checkpoint asks learners to assign the five verbs to the correct source-dated mechanisms.

The expert path reconstructs source equations and version boundaries, separates forward state from backward credit, shows every represented truncation mark, audits result conditions, and ends with a variant inventory. The 1997, 2000, 2002, and 2012 cells are never rendered as feature toggles on one undated modern cell.

Mode switching will preserve the stage but intentionally reset prediction answers, retention presets, and time cursor to the mode’s first meaningful comparison. It will not attempt to preserve incompatible control state between the beginner and expert tasks.

## Bengio prerequisite panel

Immediately before Mikolov, both modes receive a static panel titled **What the recurrent word model changes**.

Beginner mode compares four objects:

1. a fixed `n−1` word window;
2. one static learned lookup row per word type;
3. a feed-forward score network;
4. a normalized vocabulary softmax.

Beside it, a single sentence states that Elman’s current hidden state depends on the token history while Bengio’s lookup row for a word type does not. The panel then marks recurrence as proposed future work rather than an evaluated Bengio result.

Expert mode adds the source equation `y = b + Wx + U tanh(d + Hx)`, identifies `C` and concatenated `x`, marks the direct path optional, and links each statement to the three prerequisite claims. It does not import Elman recurrence through Bengio’s citation or imply that Mikolov reproduces Bengio’s optimizer, data, or architecture.

## Smoothing-journey bridge

Immediately before Sundermeyer’s final result treatment, both modes receive a static bridge back to the completed smoothing journey.

The bridge states only what Sundermeyer reports: a 300-cell LSTM trained on 27 million in-domain words is interpolated with a Kneser–Ney model trained on more than four billion words while rescoring 1,000-best French hypotheses. It labels the 19.7→19.2 and 17.6→17.3 WER changes as interpolated-system results.

The bridge does not assert a new Kneser–Ney-to-Sundermeyer lineage edge, expose an interpolation slider, transfer Chen–Goodman’s implementation details into the 2012 paper, or compare the neural and count models as though their corpora and scores were controlled standalone experiments.

## Static fallback and source inspection

Every interactive stage must render a complete no-JavaScript competitor before hydration:

- a captioned table containing every default step and expected value;
- a separate credit table where applicable;
- the decisive before/after or variant comparison;
- the checkpoint prompt and revealed answer;
- the source year, version label, claim IDs, locators, limitations, and synthetic-value warning.

Source inspection uses the existing mode-neutral work records. Stage pages may open a focused evidence disclosure, but they do not duplicate or mutate corpus claims. A failed or unavailable client island leaves the static table, explanation, links, and progression usable.

## Automated and rendered acceptance plan

Static routes must pass the data, source, mode, static-render, accessibility, responsive, and visual gates below before changing from `planned` to `built`. Cursor behavior, committed-update timing, and the moderated static-versus-interactive comparison apply before shipping an optional client enhancement. The complete static treatment is the comparison baseline:

1. JSON Schema rejects unknown fields and variant leakage; semantic validation rejects duplicate stages, claims from undeclared works, and fixture objectives outside the four interactive works.
2. Mutation tests reject a forget field or peephole field in the original-cell scenario, a non-unit protected factor, reordered retention presets, a changed active token, identical same-token final states, and incorrect previous/current-state peephole reads.
3. Calculation tests reproduce every expected trace to `1e−9`, keep the fixture below 8 KiB, and prove cursor changes cannot alter source inputs or computed values.
4. Journey tests resolve six ordered works, twelve mode-specific objectives, the Bengio prerequisite, the smoothing bridge, and every factual block to declared corpus evidence.
5. Static-render tests find the complete default tables, answers, source links, and progression with JavaScript blocked.
6. Interaction tests cover native Previous/Next controls, labelled token buttons, prediction clearing on stage/scenario changes, focus retention, concise live-region messages, and reset behavior.
7. Accessibility tests pass keyboard-only use, screen-reader table structure, graphics-hidden parity, color removal, reduced motion, 200% zoom, and automated axe checks.
8. Responsive tests at 320 and 640 CSS pixels keep the prompt, controls, active column, summary, and table in reading order without essential page-level horizontal scrolling; expert equations may scroll only inside labelled regions.
9. Performance tests keep the fixture below 8 KiB, interaction-specific compressed JavaScript at or below 40 KiB, committed updates below 50 ms on the representative mobile profile, and layout stable before hydration.
10. Manual 1440- and 320-pixel review finds no later-mechanism leakage, unclipped labels, accidental empty regions, ambiguous activation/credit encoding, or source details separated from the claim they support.
11. A small moderated comparison must improve explanation of activation versus credit, forgetting versus state inspection, and original versus composite cells without adding misconceptions. Otherwise, ship only the static treatment.

## Implementation sequence

The shared recurrent shell, Elman same-token trace, original-cell state/credit comparison, and forget-gate retention alternatives are implemented in both modes. Each has a complete static treatment with source inspection and native checkpoints. The next increment is the 2002 peephole comparison. Peephole, Mikolov, Sundermeyer, Bengio-prerequisite, and smoothing-bridge treatments remain `planned` until their source-dated boundaries pass equivalent review. Hydration remains deferred under the conditional-prototype rule.

## Implemented forget-gate treatment

The 1999/2000 chapter adds three complete static alternatives for one forward update. Native preset links let the learner inspect each independently; the fixed previous state, candidate, input gate, and write are labelled above the tables. Beginner checkpoints ask why near-reset leaves nonzero activation and why no parameter is erased. Expert mode reconstructs journal equations 6–7, 17, and 20, then audits the separate CERG and CNTO criteria, all promoted result values, selected-network reset traces, noncontinual control, and report/proceedings/journal differences.

The journal notation uses `net` for gate and candidate preactivations. Complexity extends onto internal p. 9; the conclusion is on internal pp. 15–16. The main CERG retains B/E grammar symbols and omits externally imposed segmentation/reset; the marker-removal variant is described separately and supplies no replacement Table 2 rates. The corpus locators and protocol caveat preserve these boundaries.

Three later stages and both interludes remain planned. This static comparison contains no trained gate, exposed-output calculation, backward-credit simulation, or client code. It is the baseline for any later learner comparison, not evidence that a client interaction improves learning.
