# Interaction brief for sequence computation

## Scope and decision

The [fourth teaching slice](fourth-vertical-slice.md) requires static comparisons of sentence-pair reads, convolutional reach, decoder-layer source reads and Transformer attention routes. One optional **attention-route lens** is accepted for a bounded prototype only after its source/fixture contract and complete static competitor pass. It has no shipped controls and no demonstrated learning benefit.

Keep Parikh's two normalization directions, ByteNet/ConvS2S receptive fields, width/EOS cases, projected heads and position comparisons static in this increment. Each can present complete adjacent cases. A universal architecture playground would conflate connectivity, learned weighting and measured quality.

## Inspiration audit

First-party explanatory pages and research records were accessed on 20 October 2026. This audit covers their described explanatory patterns; it is not a keyboard, mobile, performance or screen-reader certification of those sites. No code, figures, weights, wording or visual identity are reused.

| Reference | Useful pattern | Boundary for this lesson |
|---|---|---|
| [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) and its [research record](https://arxiv.org/abs/2408.04619v2) | Connect a model overview to on-demand Q/K/V, mask and calculation detail. | It demonstrates GPT-2 rather than the original encoder–decoder Transformer. Its input experiments and reported study do not validate this lesson. Use a small supplied fixture, not browser model inference or free-form generation. |
| [Computing Receptive Fields](https://distill.pub/2019/computing-receptive-fields/) | Relate one selected output to explicit input locations and distinguish size from location. | Its image examples do not supply ByteNet masks, the repeated dilation schedule or source/target indexing. Here, enumerate exact token offsets and padding before drawing spans. |
| [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) | Establish separate encoder/decoder stacks and show one vector read before matrix batching. | Use the original paper for operations. Do not assume the self position always gets the largest weight or that a selected attention pattern proves a linguistic relation. |
| [WAI complex-image guidance](https://www.w3.org/WAI/tutorials/images/complex/) | Provide a structured textual equivalent of a graphic's values and relationships. | A short graphic label cannot replace the full access table, calculation and checkpoint. |

Use the existing ledger visual system: stable source and shifted-target rows, a named route, tabular values and explicit sequence/layer labels. “Allowed,” “masked: future,” and “masked: padding” need text and distinct marks. An allowed connection and a large weight must never use the same visual encoding.

## Exact learning objective and claim binding

Given a source, a shifted target input and a query row, the learner can identify where queries, keys and values originate; enumerate permitted key positions in each of the three Transformer routes; explain why the decoder's causal mask is applied before softmax; and distinguish a permitted read from a vocabulary prediction or verified explanation.

This directly binds `beginner-vaswani-2017-follow-attention-routes` and the route/normalization part of `expert-vaswani-2017-mechanism-results-and-versions`. Scientific anchors are `vaswani-2017-attention-routes-and-causal-mask`, `vaswani-2017-scaled-dot-product-attention`, `vaswani-2017-multi-head-attention`, `vaswani-2017-embedding-and-output-normalization` and `vaswani-2017-attention-visualization-boundary`. The [canonical source](https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf), §§3.1–3.4, defines the mechanism; the selected-map boundary additionally requires the arXiv appendix. This fixture demonstrates a forward read, not learned translation or joint training.

## Necessity hypothesis and static competitor

The complete static explanation is the default. It must contain all three route diagrams, every valid query row, their access tables and at least one full numerical read per route. Prediction checkpoints and source inspection remain available without JavaScript.

The optional lens may help a reader retain source/target identities while changing the route or query row and seeing the access set and calculation update together. That linked invariance is the only proposed advantage over adjacent static cases. Static prose and diagrams may already teach it adequately; the comparison below decides whether a client control earns its cost. Motion and click count are not evidence of learning.

## Manipulation and visual response

Only route and query position are selectable, using native selects with labelled Previous/Next position buttons. Route choices are encoder self-attention, decoder masked self-attention and decoder-to-encoder attention. On route change, select its first valid query row and announce that choice; within a route, preserve the selected row when it remains valid. No head, temperature, sequence-length, mask-disable, weight-editing or training control is included.

The source and target inputs are fixed, small and explicitly authored. The fixture must have unequal valid source/target lengths and at least one padding slot. Decoder input row 0 is BOS, row 1 contains the first observed target token, and so on; row r predicts target token r+1. In decoder self-attention, key rows 0 through r are permitted, including the current **shifted input** row. Thus the predicted token itself is never available as an input. Labels must show input and prediction identities together rather than draw a misleading strict-lower-triangular mask over unshifted tokens.

The response shows:

1. The selected query and the layer/sublayer origins of its projected Q and the route's K/V bank. Cross-attention uses decoder queries and encoder outputs as its key/value substrate; the source and target banks need distinct labels even when both contain the same word.
2. Every key position, its token identity, validity reason and pre-softmax mask. Encoder self-attention can read valid source positions on either side; decoder self-attention cannot read later shifted-target rows; cross-attention can read all valid encoder positions. Padding stays excluded in every route. Decoder causality does not impose a triangular mask on source columns.
3. A separate score/weight ledger: supplied projections, dot product, scaling, masked score, normalized weight, signed weighted-value contribution and resulting context. Forbidden keys have exactly zero weight; an allowed key need not receive the largest weight. No row is labelled a next-token distribution.

Only valid query rows are selectable. Padding queries and all-masked rows are invalid fixture states, not numerical softmax cases. The contract must reject them. The route lens represents one head's read within the larger block; an adjacent static two-head/concatenation/output-projection example prevents the lens from standing in for a complete multi-head layer. Residual, feed-forward, normalization and vocabulary-output stages remain visible in the surrounding chapter.

## Distinct mode treatments

Beginner mode first asks the learner to predict which named tokens are available and whether a known future target in a training batch may be read. The response exposes an access list, printed weights and a compact weighted contribution explanation. A native answer reveal explains the error in terms of shifted input and route origin. It does not require matrix algebra to complete the task.

Expert mode first asks for Q/K/V provenance, matrix shapes and the exact mask row. The response additionally exposes the projected inputs, scaling dimension, exponentials/normalizer, every signed contribution and a forbidden-key invariance check. It requires explanation of why masking logits before normalization differs from zeroing a weight afterward without renormalizing. The original source's layer language and the teaching block's sublayer boundaries must be crosswalked explicitly before implementation.

Both modes retain the same complete fixture, facts and limitations. Changing modes preserves route and valid query selection. Neither may hide a failed prediction, source uncertainty or a static case to make the control appear more effective.

## Accessibility, mobile and performance

- Use native labelled selects and buttons in a predictable tab order, with visible focus and no pointer-only or drag-only action. Selection must not move focus, scroll the page or automatically advance. No autoplay or timed task.
- Announce a concise route/query/access-count change in one polite status region. Keep the full ledger as a semantic table with captions, row/column headers and original token identities; do not announce every cell on each change. The graphic has a structured equivalent and may be hidden without losing any task.
- Print all static cases, source locators and answers, including closed native disclosures. Keep useful headings and landmarks when CSS or JavaScript is unavailable.
- At 320 and 640 CSS pixels, stack source and target access lists while preserving their names. Keep equations in keyboard-scrollable labelled regions if needed; do not shrink text or require whole-page horizontal scrolling. Verify at 768 and 1440 as well.
- Reduced motion uses immediate state changes. Color is supplementary; text and outlines preserve meaning in forced colors and grayscale. Touch targets, zoom and long decimal values receive the existing chapter checks.
- Use local precomputed fixture data and a small isolated component; no model download, network inference, canvas-only rendering or new visualization dependency. Preserve the existing build's payload gate. Record measured compressed bytes and response behavior before prototype acceptance; no unmeasured speed claim.

## Misconceptions and safeguards

| Likely error | Required safeguard |
|---|---|
| “The diagonal leaks the answer.” | Label BOS, shifted input and predicted output at every decoder row; test the first row explicitly. |
| “Future source words are forbidden too.” | Contrast the complete valid source bank with the limited target-prefix bank, using unequal lengths. |
| “Allowed means relevant or causally explanatory.” | Separate access marks from numeric weights; retain selected-map limitations and a deliberately low-weight allowed key. |
| “Q, K and V are interchangeable copies.” | Show distinct projections and values; retain signed coordinates and full contribution arithmetic. |
| “The mask is learned attention.” | Show it as a fixed pre-softmax exclusion; changing a forbidden raw score cannot change the context. |
| “One read is the entire Transformer.” | Keep the static multi-head/output projection and full post-normalized block beside the lens. |
| “Parallel training means parallel target generation.” | Include a shifted-gold training case and a prefix-only generation case with the next token unavailable. |
| “A short path proves a better model.” | Keep graph access, path counts, wall-clock measurements and experiment tables separate. |

## Acceptance and promotion gates

The static treatment must first pass source binding, independent arithmetic, historical-variant, route/shape, no-JavaScript, keyboard, expanded axe, graphics-hidden, reduced-motion, forced-colors, closed-disclosure print and four-width rendered checks. Expected weights/contexts must be independently derived rather than generated by the same function being tested. Include the first decoder row, last valid row, padding, rectangular cross-attention, equal legal logits, identical values, and a forbidden score larger than every legal score. Verify valid-row sums and unchanged context after a forbidden-key perturbation.

Before evaluating the optional prototype, freeze a comparison protocol using the identical fixture, explanations, facts and checkpoints in the complete static and lens treatments. Counterbalance treatment order and use matched unseen route/query cases. Primary outcomes are errors in (1) route origins, (2) shifted causal access and (3) access-versus-weight interpretation. Record explanation correctness, task completion, time and assistance; visual preference and engagement alone cannot promote the lens. Predeclare the sample, scoring rubric, stopping rule and practically meaningful improvement threshold before collecting results.

Promotion requires fewer misconception errors on those held-out tasks without loss of explanation correctness, no keyboard or mobile completion regression, and compliance with the payload gate. Report the sample, uncertainty, individual failure cases and study limits. If results are inconclusive, accessibility fails or static cases perform as well, keep the static treatment and omit the client lens. Automated checks do not substitute for moderated learner or human screen-reader evidence. All existing enhancement gates remain independent.
