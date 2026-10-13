# Alignment interaction brief for the third journey

## Scope and decision

The [third teaching slice](third-vertical-slice.md) needs a complete static explanation of fixed summaries, source reversal and recurrent attention. One optional **target-step attention read** is accepted for a bounded prototype after its source/fixture contract and static counterpart pass. This decision establishes a candidate, not a measured learning benefit or a shipped control.

The cursor belongs to Bahdanau's source read. Cho's scoring system, Sutskever's reversal/rescoring and Luong's score/window/input-feeding comparisons remain static. A generic attention playground would erase important differences in timing, state construction and experimental scope.

## Reference audit

These references inform explanatory patterns, not scientific claims about the four historical systems. Their public explanatory text and first-party project records were accessed on 13 October 2026. No code, model outputs, figures or visual identity are reused.

| Reference | Pattern worth carrying forward | Constraint |
|---|---|---|
| [Olah and Carter's Attention and Augmented Recurrent Neural Networks](https://distill.pub/2016/augmented-rnns/) | Align a source row, target step and weighted read so a reader can follow the same objects across representations. | Its general dot-product account does not replace Bahdanau's feedforward scorer. Reading a vector is distinct from selecting a verified word translation. |
| [Alammar's sequence-to-sequence explanation](https://jalammar.github.io/visualizing-neural-machine-translation-mechanics-of-seq2seq-models-with-attention/) | Establish vectors, hidden state and unrolling before adding attention; keep the current step visually identifiable. | Replace timed playback with explicit steps and complete static rows. Do not inherit its stronger universal bottleneck framing or omit the decoder state. |
| [Seq2Seq-Vis paper](https://arxiv.org/abs/1804.09299) and [author repository](https://github.com/HendrikStrobelt/Seq2Seq-Vis) | Inspect encoding, decoding and attention as related stages of a particular model. | The hosted demo was unavailable during this audit. The inspected paper abstract and repository establish the debugging use and model-extraction boundary; they do not establish present-day usability or accessibility. Avoid its server/model stack and unrestricted model interventions for this lesson. |
| [WAI complex-image guidance](https://www.w3.org/WAI/tutorials/images/complex/) | Give an explanatory graphic a structured equivalent containing the relationships and values needed for its task. | An alt label alone cannot replace the full score/weight/contribution ledger. |

The useful common pattern is colocation of cause, calculation and response. The product will retain its existing quiet research-ledger visual system: source positions as stable rows, target steps as labelled columns, tabular numerals and restrained emphasis. Saturation alone must never encode importance. The active row carries text, outline and numeric weight; it does not acquire a claim of linguistic correctness.

## Exact learning objective

Given one unchanged bank of source annotations and two supplied prior decoder states, a learner can explain which values remain fixed and which are recomputed at the next target step; distinguish raw compatibility energy from source-normalized weight; and reconstruct the weighted context without calling it a target-word probability or a verified alignment.

This binds to `beginner-bahdanau-2014-follow-the-focus` and `expert-bahdanau-2014-attention-objective-and-evidence`. The historical concept is Bahdanau's jointly trained soft source read: `bahdanau-2014-soft-attention-context`, `bahdanau-2014-differentiable-soft-alignment`, `bahdanau-2014-bidirectional-annotations`, `bahdanau-2014-global-attention-cost`, `bahdanau-2014-soft-alignment-interpretation-boundary`, and `bahdanau-2014-equation-version-boundary`. The synthetic fixture illustrates arithmetic; it cannot demonstrate joint training or empirical translation gains.

## Why consider interaction

A static ledger can expose the entire calculation and is the default treatment. A cursor might add value by keeping the annotations in the same positions while one step change updates the query, scores, weights and context together. That linked response may help a learner track invariants rather than compare disconnected matrices.

This is a testable design hypothesis. If the complete adjacent static ledgers teach the same distinctions with equal or fewer errors, retain those ledgers and omit the client cursor. Animation, clicking and a familiar heatmap are insufficient reasons to ship it.

## Manipulation and visual response

The only beginner manipulation is selecting one of two named target steps with Previous, Next or a native select. Each step shows its supplied prefix and **authored prior decoder state**. These states are hand-set teaching inputs, not outputs of a trained recurrent decoder. Selecting a step recomputes the same additive scoring function against the unchanged annotations; it does not train the model or generate a translation.

For each source position, show its identity, annotation, energy, normalized weight and weighted contribution. A compact bar expresses the weight with a printed value. The context row sums the contributions coordinate by coordinate. The expert view additionally exposes matrix dimensions, projected query/annotation terms, tanh outputs, exponentials and the normalizer. Signed vector coordinates remain signed; a negative contribution is not negative probability.

The source-softmax denominator spans all admitted source positions for that target step. The fixture uses the main-text abstraction from [Bahdanau version 5](https://arxiv.org/pdf/1409.0473v5), pp. 3–4 and 12: `eᵢⱼ = vₐᵀ tanh(Wₐsᵢ₋₁ + Uₐhⱼ)`, `αᵢⱼ = softmaxⱼ(eᵢⱼ)`, and `cᵢ = Σⱼ αᵢⱼhⱼ`. Later appendix inconsistencies remain inspectable in the source crosswalk. No hybrid gate-level equation is evaluated.

Changing the step may alter the weights and context. It need not do so in every mathematical configuration. Include an equal-score case yielding uniform weights and an identical-annotation case whose context stays unchanged across steps. With identical annotations this scorer also assigns identical energies across source positions, so it must not fabricate differing weights. These cases prevent the interface from implying that a new step necessarily creates a different source summary.

## Distinct modes

Beginner mode asks for a prediction before revealing the second step: which values can change, which inputs stay fixed, and whether the strongest weight proves a word alignment. The response focuses on normalized shares and the mixture, with a short arithmetic primer and one checkpoint at a time. A “reading notes” analogy may introduce revisiting source information, but must immediately state that annotations contain surrounding context and the read is a weighted combination of vectors.

Expert mode begins with the explicit tensor shapes and source/version label. Its tasks are to derive a score, reconstruct the denominator and one context coordinate, audit the prior-state timing, and identify what the fixture omits. Selecting a source row highlights its contribution in the same ledger; it does not change the numerical state. Include a static common-offset softmax check and a source-position versus vocabulary-normalization comparison. Expert controls inspect operations; beginner controls follow a prediction sequence.

Both modes reach the complete fixture inputs, unrounded expected outputs, relevant claims and version conflicts. Mode switching retains the selected step where a cursor exists. Checkpoint answers remain native disclosures without requiring client storage or an account.

## Complete static counterpart

Render both target steps with the same labels, annotations, inputs and numerical outputs before hydration. The equal-score and equal-annotation safeguards also remain inspectable. Use semantic tables with captions and row/column headers; provide a linear explanation of each read. A summary distinguishes unchanged annotations and parameters from recomputed energies, weights and context. The optional cursor must not replace, reorder or conceal evidence required for the static task.

Cho and Bahdanau's architectural comparison is a separate static panel: one reused global summary versus per-step retrieval over contextual annotations. It must not pretend that disabling this read recreates Cho's trained system. No shared fabricated BLEU curve accompanies it.

Sutskever's source-order panel uses explicitly paired symbolic positions and a stated count of recurrent transitions, including the end-symbol convention. It compares early and late paths and the mean, so reversal cannot be mistaken for shortening every pair. The paper's measured reversal rows and incomplete explanation remain separate from this teaching arithmetic.

Luong's panel draws the differing operation order and global/local support as a static source crosswalk. Input feeding carries the previous attentional vector into the next recurrent input; it is not a manual attention-mask knob. A window may exclude relevant positions. The canonical local-p Gaussian multiplication and the later almost-everywhere qualification remain labelled. No local-p numeric control is accepted until its source operations and boundary conventions are resolved.

## Accessibility and performance

- Use native buttons/selects with visible labels and focus; no drag-only, hover-only, scroll-bound or autoplay state. Controls target at least 44 CSS pixels. Keyboard navigation reaches every operation and evidence link without a focus trap.
- Keep focus on the activating control. A short polite live message announces the selected step and changed context, not every numeric cell. Complete tables stay in reading order; perform a manual screen-reader task check in addition to axe.
- At 320 CSS pixels, stack prompt, controls, source rows and context. Tables may have a labelled keyboard-scroll region where necessary; the page itself must not overflow. At 200% zoom, labels and values must remain readable. Preserve the same task at 640, 768 and 1440 pixels.
- Reduced motion uses immediate state updates. Graphics-hidden, forced-color and print views preserve source identities, signed numbers, normalization and version scope. No color or motion is necessary to answer a checkpoint.
- Keep the fixture at or below 12 KiB uncompressed, with at most six source positions, two annotation coordinates and a small fixed scorer. Compute locally without requests, workers, model loading or inference libraries. Target under 50 ms per update on the test device; record device and measurement method.
- Static routes add zero client JavaScript. A later cursor must keep the complete delivered route below the existing 40 KiB gzip client budget and disclose its incremental bytes; static HTML remains within the existing build limits. Preserve the current atlas payload gates.

## Misconceptions and prevention

| Likely error | Required safeguard |
|---|---|
| Attention is a word probability or gold alignment | Label the normalization axis as source positions; keep output softmax separate; never show a correctness tick on a source link |
| Each annotation is just its isolated word embedding | Show forward/backward context construction in a static primer; label synthetic annotations as contextual-vector stand-ins |
| Attention makes the context vector grow with sentence length | State that the annotation bank grows while each read remains fixed-dimensional |
| The fixture states were learned or generated by this decoder | Label states and parameters as authored inputs; show the omitted recurrence/output boundary beside the controls |
| Fixed summaries inevitably fail and attention alone explains the gain | Keep Sutskever's successful fixed-vector branch and Bahdanau's conjecture/confounded comparison available |
| This is Transformer self-attention | Label recurrent decoder-to-source retrieval; exclude Q/K/V projections, scaled dot products, heads and positional controls |
| Every attention coefficient sums to one after every operation | Limit the invariant to this global source softmax; keep Luong's Gaussian multiplication and Graves's window separately scoped |
| Traversal order establishes influence | Keep source dates and teaching-stage numbers separate; preserve the conceptual-parallel edge's causal prohibition |

## Acceptance and removal criteria

The source/fixture gate must review every displayed scalar against the declared operations, validate matrix shapes and finite values, and retain original inputs. Weights must be nonnegative and sum to one within `1e-12` before display rounding; each context coordinate must equal its contribution sum and lie within that coordinate's annotation range. Expected outputs must be independently checked rather than regenerated by the implementation under test. Failure on the uniform/equal-annotation cases, normalization axis, temporal index or historical variants blocks implementation.

The static prototype must pass both mode tasks with JavaScript disabled, direct source/claim links, no unavailable chapter destinations, native keyboard, expanded-evidence axe, responsive numeric reading, print and manual desktop/mobile review. Client promotion additionally requires unchanged static coverage, focus/state continuity, equivalent graphics-hidden/reduced-motion operation, the performance budget and a manual screen-reader task check.

Before promotion, compare static and cursor conditions separately for beginners and experts. Hold text, fixture, tasks, source placement and answer reveals constant; use equivalent unseen examples and counterbalanced condition order to reduce practice effects. Predeclare the tasks and scoring rubric before observing results:

1. Identify fixed inputs versus recomputed quantities across steps.
2. Recover the source-normalized weight and weighted read appropriate to the mode.
3. Explain why a weight does not establish a correct linguistic alignment or translation probability.
4. Recognize the fixture's omitted training/recurrence and source-version boundary.

Record material errors, task completion, time and explanations by mode, with sample size and uncertainty. A pilot may identify confusion but cannot establish population-wide learning gains. Retain a cursor only if it reduces the named conceptual errors without introducing new boundary errors or excluding a keyboard/mobile/screen-reader path. If evidence is inconclusive, keep the static treatment and leave the cursor unpromoted.

Reject free-form translation input, training sliders, arbitrary draggable weights, attention-as-explanation rankings, blended paper architectures, empirical BLEU controls and decorative full-sequence heatmaps. Each would introduce an unsupported inference or a separate learning objective beyond this bounded read.
