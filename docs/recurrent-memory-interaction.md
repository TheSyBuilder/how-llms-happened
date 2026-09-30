# Recurrent-memory interaction brief

## Decision

Accept one bounded interaction for the second vertical slice: a **source-dated state-and-credit trace**. It will let a learner move through one reviewed synthetic sequence while switching among four historically distinct mechanisms:

1. Elman's copied recurrent context;
2. the original long-short-term-memory cell with input and output gates;
3. the later adaptive forget gate;
4. the later cell-state-to-gate peepholes.

The interaction is accepted for a prototype, not guaranteed a permanent place in the product. A complete linked time-step table is its static competitor. If learner testing does not show a clearer distinction between forward state, backward credit, retention, and state visibility than the static treatment, the client interaction must be removed and the static treatment retained.

Bengio's fixed-window model, Mikolov's normalized recurrent word model, Sundermeyer's composite LSTM word model, and every empirical result remain static. They complete the historical argument but do not belong inside one synthetic mechanism calculator.

## Learning job

The interaction has one exact objective: **explain which quantity crosses a time step, which path can carry a learning signal backward, and which historical mechanism writes, retains, exposes, or inspects state.**

A beginner succeeds when they can:

- explain why the same current token can produce a different state after a different history;
- distinguish activation carried through a sequence from weights learned across examples;
- distinguish writing state from exposing it;
- explain why the original cell has no learned forget gate;
- distinguish a forget gate that controls retention from a peephole that lets a gate inspect state.

An expert succeeds when they can:

- keep the forward activation trace separate from the backward credit trace;
- identify the repeated temporal factors in an ordinary recurrent path and the protected unit-weight path in the original cell;
- locate every truncation boundary represented by the source-specific learning rules;
- distinguish the 1995/1997, 1999/2000, and 2002 cell equations without rewriting them as one modern cell;
- explain why Mikolov's forward recurrence coexists with one-step temporal credit assignment in the reported experiments.

The trace does not claim that a scalar teaching state is a semantic unit learned by a real network, that a protected path provides unlimited memory, or that any fixture reproduces a paper experiment.

## Reference audit

The audit considers interaction patterns only. It does not use these explanations as evidence for historical claims, and no reference code, data, layout, visual identity, or diagram is copied.

| Reference | Useful pattern | Constraint carried forward |
|---|---|---|
| [Visualizing memorization in RNNs](https://distill.pub/2019/memorization-in-rnns/) | Selecting one target position updates a linked view of which earlier inputs matter, keeping time and the inspected dependency colocated. | Use a linked time cursor, but do not present a trained-model gradient attribution as the historical mechanism or generalize one example across datasets and models. |
| [exploRNN](https://link.springer.com/article/10.1007/s00371-022-02593-0) | Self-paced steps, simple sequences, multiple levels of detail, and decoupled computation and visualization make temporal processing inspectable. Its 37-participant study also cautions that interactive and text treatments can support different kinds of learning. | Keep the task bounded and pair it with prose. Do not inherit an all-purpose training playground, modern-cell default, animated input stream, or high control density. |
| [LSTMVis](https://vcg.seas.harvard.edu/publications/visual-analysis-of-hidden-state-dynamics-in-recurrent-neural-networks/paper) | Aligned token and hidden-state tracks support a hypothesis at one time range and make it possible to refine or reject that hypothesis. | Borrow alignment and explicit hypothesis testing, not the dense analyst interface, threshold brushing, or an assumption that a selected hidden dimension has a stable human-readable meaning. |
| [RNNbow](https://arxiv.org/abs/1907.12545) | A separate backward view makes gradient horizon and local-versus-distant contribution inspectable instead of treating activation as evidence about learning. | Keep backward credit visually and verbally separate from forward state. Do not synthesize model-specific gradients or imply that the direct protected branch equals the complete Jacobian. |
| [Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) | A stable cell drawing revealed in stages makes interacting operations easier to parse. | Treat its three-gate cell as a later composite explanation. It must not become the default diagram for the original 1995/1997 cell or erase the later forget-gate and peephole papers. |

These sources were accessed on 2026-09-29. Accessibility requirements continue to follow the project's existing [interaction language](interaction-language.md) and [product architecture](product-architecture.md), including native controls, semantic alternatives, reduced-motion parity, reflow, and minimum target size.

## Interaction direction contract

- **Product job and audience:** teach a source-faithful architectural sequence to newcomers while letting expert readers audit temporal paths, update order, and truncation boundaries.
- **Primary action and proof:** choose one authored scenario, predict the next state operation, move the time cursor, and verify the result in aligned state, mechanism, and text traces whose claims remain visible.
- **North star:** a recurrent lab ledger—the same time column separately records what arrived, what was written, what was retained, what was exposed, what a gate could inspect, and where credit can travel.
- **Structural anchor:** a guided reading column beside one time-aligned trace. On narrow screens, the prediction, controls, active time step, semantic table, explanation, and checkpoint become one uninterrupted column.
- **Expressive and detail donors:** Distill contributes linked time focus; exploRNN contributes self-paced inspection; LSTMVis contributes aligned token and state tracks; RNNbow contributes the strict activation/credit split; Olah contributes staged disclosure only. Their palettes, diagrams, code, and complete interface structures do not transfer.
- **Canvas, type, color, density, geometry, and elevation:** extend the existing warm technical ledger. Use tabular numerals, flat ruled rows, compact source labels, and separate labelled line styles for activation and credit. Color is redundant with text, position, and pattern.
- **Imagery and motion:** original sequence marks and path diagrams are explanatory graphics. No autoplay, particles, flowing pulses, or continuously animated recurrence. A committed step may use a brief changed-value cue; reduced motion updates instantly.
- **Required states:** untouched, prediction recorded, stepped, historical mechanism changed, scenario changed, checkpoint answered, reset, evidence opened, keyboard focus, graphics hidden, narrow screen, 200% zoom, reduced motion, and JavaScript unavailable.
- **Non-negotiables:** source year and version scope remain visible; synthetic values are labelled; forward state and backward credit never share one unlabeled encoding; later mechanisms cannot appear in earlier stages; every graphic has a table and prose equivalent.
- **Reject list:** a trainable RNN sandbox, free weight editing, modern-cell back-projection, gradient-attribution heatmaps, scroll-bound control, drag-only time navigation, autoplay, ornamental fading arrows, and empirical controls spanning incompatible tasks.

## Accepted interaction: source-dated state-and-credit trace

### Why static prose is insufficient

A static cell diagram can name parts, and a time-step table can show one completed trace. The difficult distinction is relational: the same synthetic sequence must be inspected at different time positions while exactly one historical mechanism changes, and the forward quantity must remain visibly separate from the backward learning path.

The interaction earns a prototype because it lets the learner make a prediction, change one source-dated mechanism or authored retention preset, and keep the active time column linked across all representations. This makes three otherwise easy-to-miss contrasts directly testable:

- the same current input after two histories does not imply the same recurrent state;
- protecting a recurrent branch from repeated scaling is different from deciding when to reset activation;
- letting a gate inspect protected state is different from multiplying the retained state.

The static competitor remains complete and first-class: source-dated diagrams plus an HTML table containing every default time step, a separate credit row, and a prose trace. Interaction survives only if a small learner study shows better explanation of the three contrasts without increasing architecture or evidence misconceptions.

### User action and visual response

The workbench starts still on one explicitly synthetic sequence. It offers only reviewed choices:

1. choose an authored scenario: same token after two histories, delayed signal, unmarked boundary, or hidden timer;
2. choose the historical mechanism available for that scenario;
3. answer a prediction prompt about what changes next;
4. move with **Previous step**, **Next step**, or a labelled token button;
5. in the forget-gate scenario, choose one authored near-retain, gradual-decay, or near-reset preset;
6. reset the scenario.

A stage change returns the cursor to the first meaningful divergence and clears the old prediction. It never inserts a later control into an earlier cell.

Four linked representations update after a committed action:

1. a token-and-time strip with one active column;
2. a forward ledger for incoming state, candidate write, retained contribution, resulting state, and exposed output, with unavailable operations shown as absent rather than zero;
3. an expert-only backward ledger showing the source-bound recurrent branch, repeated local factor, and explicit truncation marks;
4. a prose summary naming the change, its source date, represented claims, and what the trace does not establish.

The graphic supplements a semantic table. It does not animate information flowing through a network, label hidden coordinates with invented meanings, or display trained-model predictions.

### Historical stages and claim bindings

#### Elman 1988/1990: carried context

The trace shows the previous hidden activation copied into context and combined with the current input. Two authored histories reach the same current token with different prior states. The output remains an activation vector, not a normalized word distribution.

- Claims: `elman-1990-simple-recurrent-context`, `elman-1990-task-dependent-memory`, `elman-1990-contextual-token-representations`, `elman-1990-memory-boundary`.
- Objectives: `beginner-elman-1988-predictive-memory`, `expert-elman-1988-recurrent-state-and-evidence`.

#### Hochreiter and Schmidhuber 1995/1997: protected state and credit

The trace separates the ordinary product of temporal factors from the fixed unit-weight recurrent branch inside the memory cell. Input and output gates control writing and exposure. The stage has no forget gate and no cell-state-to-gate links. Expert mode marks where the efficient source algorithm truncates error flow.

- Claims: `hochreiter-schmidhuber-1997-vanishing-exploding-error`, `hochreiter-schmidhuber-1997-constant-error-carousel`, `hochreiter-schmidhuber-1997-input-output-gates`, `hochreiter-schmidhuber-1997-local-truncated-gradient-algorithm`, `hochreiter-schmidhuber-1997-original-cell-domain-boundary`.
- Objectives: `beginner-hochreiter-schmidhuber-1995-gated-memory`, `expert-hochreiter-schmidhuber-1995-mechanism-and-evidence`.

#### Gers, Schmidhuber, and Cummins 1999/2000: adaptive retention

The trace adds one authored forget-gate preset at a time and updates the retained contribution before adding the candidate write. Near-retain, gradual-decay, and near-reset presets expose the cause-and-effect relationship without becoming a free gate sandbox. The UI calls this activation-state forgetting, never parameter forgetting.

- Claims: `gers-2000-continual-state-drift-problem`, `gers-2000-forget-gate-mechanism`, `gers-2000-forget-gate-learning-and-complexity`, `gers-2000-evidence-boundary`.
- Objectives: `beginner-gers-1999-adaptive-forgetting`, `expert-gers-1999-mechanism-versions-and-evidence`.

#### Gers, Schraudolph, and Schmidhuber 2002: state visibility

The trace adds labelled cell-state-to-gate reads. It shows input and forget gates inspecting previous state and the output gate inspecting newly updated state in the source update order. Changing the peephole stage highlights what a gate can inspect; it does not add another retention multiplier or import the mechanism into the 1997 cell.

- Claims: `gers-2002-forget-gate-antecedent`, `gers-2002-peephole-motivation`, `gers-2002-peephole-mechanism`, `gers-2002-peephole-learning-boundary`, `gers-2002-evidence-boundary`.
- Objectives: `beginner-gers-2002-peephole-timing`, `expert-gers-2002-peephole-mechanism-and-evidence`.

### Static convergence treatment

The interaction stops before converting state into a historical language-model comparison. Three static panels complete the two-lane narrative:

- **Bengio 2000/2003 prerequisite:** a fixed `n−1` word window, static learned word rows, feed-forward scores, and a vocabulary softmax. It is bound to `bengio-2003-fixed-window-factorization`, `bengio-2003-feedforward-softmax-architecture`, and `bengio-2003-recurrent-future-boundary`.
- **Mikolov 2010 convergence:** an Elman-style current-word/previous-state recurrence feeds a normalized next-word softmax, while the main experiments send credit back only one temporal step. It is bound to `mikolov-2010-fixed-window-motivation`, `mikolov-2010-elman-recurrent-architecture`, `mikolov-2010-training-objective`, `mikolov-2010-truncated-bptt-boundary`, and `mikolov-2010-long-context-and-evidence-boundary`.
- **Sundermeyer 2012 convergence:** the word model uses a composite cell with the 1997 core, later forget gate, and later cell-state-to-gate links. The panel keeps that mechanism inventory separate from the paper's graph-only perplexities and Kneser–Ney-interpolated recognition result. It is bound to `sundermeyer-2012-lstm-antecedent-and-variant`, `sundermeyer-2012-memory-cell-mechanism`, `sundermeyer-2012-language-model-objective`, and `sundermeyer-2012-evidence-reproducibility-boundary`.

This treatment makes the Elman-to-Mikolov and protected-memory-to-Sundermeyer lanes visible without suggesting that Bengio supplies recurrence, that Mikolov uses the LSTM cell, or that the 2012 composite is the original architecture.

### Beginner treatment

- Uses the verbs **carry**, **write**, **retain/reset**, **expose**, and **inspect** before introducing source notation.
- Opens with the two-history Elman checkpoint, then introduces one new mechanism per dated stage.
- Shows only one authored scenario and one prediction at a time.
- Keeps activation state visually separate from a small, persistent “learned weights do not change in this step” note.
- Describes the backward path as the route by which a later error can teach an earlier step; it does not show a full gradient equation.
- Ends by asking which operations exist in the original cell, forget-gate extension, peephole extension, and 2012 composite.

### Expert treatment

- Exposes the source-specific equations beside a neutral teaching ledger, never a single normalized modern notation in place of the originals.
- Shows ordinary recurrent temporal factors, the protected recurrent branch, the authored forget-gate retained term, peephole update order, and every represented truncation mark.
- Labels the protected-branch factor as a scoped path term rather than the complete Jacobian or parameter gradient.
- Provides a version label for every equation and a direct claim/source link.
- Keeps Mikolov's forward recurrence and depth-one temporal credit in one static audit, not in a simulated training comparison.
- Ends with a variant audit: identify which paper introduced each visible path and which later paths must be absent from earlier cells.

The full notation crosswalk is a separate pre-implementation artifact. This brief fixes the neutral visual roles but does not authorize inventing or silently harmonizing symbols.

### Fixture contract

Implementation requires schema-validated, explicitly synthetic fixtures. Each fixture must include exact expected traces and satisfy these invariants before a route can build:

- changing the time cursor never changes inputs or computed state;
- paired Elman histories have the same active token, different prior state, and different resulting hidden state;
- the ordinary recurrent credit example exposes a repeated temporal-factor product without claiming a paper result;
- the original-cell fixture contains input and output gates but no forget or peephole field;
- forget-gate presets change only the retained contribution when their other authored terms are held fixed;
- the near-retain, gradual-decay, and near-reset ordering is monotone in retained magnitude for the reviewed state sign and magnitude;
- the peephole fixture changes gate inputs or decisions, not the definition of the retained-state multiplier;
- previous-state and updated-state peephole reads follow the source's input/forget versus output update order;
- every computed value is finite and every absent historical operation is structurally absent rather than encoded as a misleading zero;
- fixture values appear nowhere as empirical paper results.

The fixture should remain below 8 KB. Free-form sequence entry, weight editing, model training, and arbitrary gate sliders are out of scope.

### Accessibility, responsive behavior, and performance

- Use native buttons, radio buttons, and selects. The token cursor is operable through named Previous/Next buttons as well as labelled token buttons; pointer hover is optional.
- Keep focus on the invoked control after an update. A polite live region announces only committed stage, scenario, preset, or time-step changes.
- Provide a captioned HTML table with row and column headers for every displayed trace. The supplementary graphic can be hidden without losing the task, checkpoint, source date, or state summary.
- Use labels and line or fill patterns in addition to color. Activation and credit have different row positions and explicit headings.
- At 320 CSS pixels and 200% zoom, show the prompt, controls, one active time column, summary, and table in document order without essential page-level horizontal scrolling. Expert equations may scroll inside a labelled region.
- Reduced motion removes travel and interpolation. No comprehension, timing, or correctness depends on animation.
- With JavaScript unavailable, render the default trace and the decisive before/after or variant comparisons as ordinary tables and prose, including checkpoint answers and source links.
- Keep the interaction-specific compressed JavaScript at or below 40 KB, including Preact and shared interaction code. Keep a committed update below 50 ms on the representative mid-tier mobile test device, reserve dimensions before hydration, and use no charting library, remote font, or third-party runtime script.

### Misconceptions and safeguards

| Likely misconception | Required safeguard |
|---|---|
| The carried activation is a learned weight. | Keep a persistent state-versus-parameter label and state that weights remain fixed during the forward trace. |
| A visible activation trace proves that distant credit reaches it. | Put forward state and backward credit in separate ledgers and require a checkpoint that contrasts them. |
| The fixed one-to-one context copy is the learned recurrent transform. | Distinguish Elman's fixed copy into context units from the trainable context-to-hidden path. |
| The original LSTM already had three gates and peepholes. | Schema and visual tests require the 1995/1997 stage to contain only input and output gates. |
| A forget gate erases learned knowledge. | Use “activation reset” in the interaction and reserve parameter forgetting for a separate concept. |
| A peephole is another forget path. | Draw it only as a labelled state-to-gate read and ask the learner to distinguish inspection from retention. |
| Recurrence means unlimited usable context. | Keep Elman's decay limits, Mikolov's depth-one credit, and both papers' long-context limits adjacent to the trace. |
| Elman's outputs and later word-model outputs are the same kind of quantity. | Label Elman's outputs unnormalized and keep the Bengio/Mikolov/Sundermeyer softmax panels static and separate. |
| The toy values reproduce the papers' tasks or show one architecture winning. | Label every fixture synthetic; keep every empirical comparison static, source-conditioned, and outside the workbench. |
| One modern LSTM equation is the timeless architecture. | Date every mechanism and make stage changes replace the mechanism inventory rather than toggle features inside one undated cell. |

### Acceptance criteria

1. Every visible factual sentence and mechanism label resolves to the listed corpus claims and a version-labelled source locator.
2. The same-token Elman checkpoint demonstrates history-dependent state without assigning semantic meaning to a hidden coordinate.
3. The forward and backward ledgers remain distinguishable with color removed, graphics hidden, and a screen reader.
4. Automated tests reject a forget gate or peephole in the original-cell stage and reject a peephole before the forget-gate antecedent in the selected sequence.
5. The forget-gate presets reproduce reviewed expected retained terms and never describe activation reset as parameter forgetting.
6. The peephole trace uses previous state for input and forget gates and updated state for the output gate, while labelling this as the 2002 source order rather than an inherited 2012 implementation fact.
7. The Mikolov audit keeps normalized forward prediction and one-step temporal credit simultaneously visible; the Sundermeyer audit names all three antecedent mechanisms without importing earlier experiments or learning rules.
8. No empirical result, corpus size, perplexity, word-error rate, or training setting is interactive.
9. The task completes with keyboard only, at 320 CSS pixels, at 200% zoom, with reduced motion, without graphics, and with JavaScript blocked.
10. Fixture, payload, hydration-stability, and under-50-ms update budgets pass on the built stage page.
11. Manual desktop and mobile review finds no mechanism leakage, clipped labels, unreadable time alignment, accidental empty regions, or source details separated from the claim they support.
12. In a small moderated comparison against the complete static treatment, learners using the prototype must more reliably explain the activation/credit, forget/peephole, and original/composite distinctions without adding new misconceptions. If that condition does not hold, ship the static treatment only.

## Rejected alternatives

- **Trainable recurrent-network playground:** too many uncontrolled variables, excessive payload, and a high risk of presenting one implementation as the historical record.
- **One modern cell with feature toggles:** makes the later forget gate and peepholes look latent in the original architecture.
- **Gradient-attribution heatmap:** answers which inputs affected one trained model's prediction, not which mechanism entered the historical sequence.
- **Automatic fading or flowing arrows:** confuses animation time with sequence time and gives no learning benefit over the labelled ledger.
- **Empirical result scrubber:** synthetic trigger tasks, Penn Treebank perplexity, and speech-recognition rescoring do not form one controlled parameter space.
- **Free gate sliders:** encourage arbitrary states and imply a general simulator; three reviewed retention presets are sufficient for the causal contrast.

## Pre-implementation contract

The follow-up [recurrent-memory slice contract](recurrent-slice-contract.md) now supplies the complete claim inventory, source-notation crosswalk, Bengio prerequisite, smoothing bridge, reviewed fixture values, JSON Schema, pure calculation rules, separate mode manifests, static fallback requirements, and automated plus rendered acceptance plan.

No route or control was added while closing that gate. The next bounded increment may implement the shared recurrent journey shell and Elman in both modes. It must render the complete no-JavaScript same-token treatment before hydration and keep the remaining five stages plus both static interludes planned until their source-dated boundaries pass equivalent review.
