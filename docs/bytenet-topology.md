# ByteNet: finite access, prediction shift and unfolding

The [reviewed fixture](../data/fixtures/bytenet-reach.json), [closed schema](../schemas/bytenet-fixture.schema.json) and [engine](../src/lib/bytenet-engine.ts) supply the second calculation family for the [sequence-computation contract](sequence-slice-contract.md). It is a structural teaching example, not a trained model or an experiment reproduction. All four chapters remain planned. No route or interaction is introduced.

## Evidence and explicit conventions

The source binding retains seven existing claims from [ByteNet v2](https://arxiv.org/pdf/1610.10099v2): the conditional objective, aligned stacking, unfolding, masked/dilated convolutions, residual/normalization roles and both revision boundaries. Relevant locations are §2, §§3.1–3.6, Figures 1–3 and §§5–6. The contrast binding retains both revision-boundary claims against [v1](https://arxiv.org/pdf/1610.10099v1), §§3 and 5–6. Targeted mechanism passages were inspected on 22 October 2026. V1's normalization and n-gram locator was corrected to §§3.5–3.6; that claim's checked date, both source access dates and the corpus's targeted `asOf` date reflect this review. No experiment, other claim date or endpoint survey is renewed.

The example fixes six spatial convolutions with dilation `1,2,4,8,16,1`. Each uses three taps, one per ReLU translation residual block. The within-position operations and residual identity add no spatial reach beyond these taps. There is no calculation of multiplicative-unit blocks, final prediction convolutions, normalization values, learned activations, gradients, vocabulary probabilities or performance. Six teaching blocks do not reconstruct a thirty-block experiment or resolve the source's reported 315-character field.

Conventions beyond the source's abstract architecture are explicit:

- At dilation d, encoder offsets are `{-d,0,d}`; decoder offsets are `{-2d,-d,0}`. Offsets identify predecessor positions relative to the current output row. They describe access rather than a library's weight-storage order.
- Every layer keeps its width. Out-of-range predecessors supply a boundary zero and have no input dependency. They are never wrapped or clipped onto a valid index.
- There are five source tokens, input slots 0–4, and one explicit source-padding input, slot 5. That padding slot is inside the six-column encoder and is distinct from boundary zeros. It is not an attention mask. A contextualized output at column 5 can depend on real source tokens.
- Decoder base row r receives input token tᵣ and encoder column r when that column exists. Readout row r predicts tᵣ₊₁. The example calls t₀ `BOS`; this name and the base injection point are teaching conventions, not recovered implementation details. The nine-row topology is an inspection horizon, not a generation cap.

No undocumented historical padding recipe, weight initialization or stacking implementation is inferred from the fixture.

## Direct taps versus accumulated reach

For unrestricted integer positions, start `R₀={0}` and enumerate `Rₗ={u+v : u∈Rₗ₋₁, v∈offsetsₗ}`. Report the exact set separately from `max(Rₗ)−min(Rₗ)+1`. A three-element direct tap set can span many positions it does not itself read. For this width-three cycle, the *accumulated* sets happen to contain every integer between their endpoints.

| Layer | Dilation | Encoder direct offsets | Decoder direct offsets | Encoder accumulated set | Decoder accumulated set | Span |
|---|---:|---|---|---|---|---:|
| 1 | 1 | −1, 0, 1 | −2, −1, 0 | [−1,1] | [−2,0] | 3 |
| 2 | 2 | −2, 0, 2 | −4, −2, 0 | [−3,3] | [−6,0] | 7 |
| 3 | 4 | −4, 0, 4 | −8, −4, 0 | [−7,7] | [−14,0] | 15 |
| 4 | 8 | −8, 0, 8 | −16, −8, 0 | [−15,15] | [−30,0] | 31 |
| 5 | 16 | −16, 0, 16 | −32, −16, 0 | [−31,31] | [−62,0] | 63 |
| 6 | 1 | −1, 0, 1 | −2, −1, 0 | [−32,32] | [−64,0] | 65 |

Intervals in these tables include every integer endpoint. The reset adds two to the span; continuing the doubling would describe a different schedule. Unlimited exponential growth is not a property of the repeated finite cycle.

For a finite bank, retain only valid predecessors **at each layer**, then union their earlier input dependencies. The fixture records all ninety rows across the six encoder and nine decoder positions: direct predecessors, absent zero-padding positions and exact reachable input sets at every depth. It also records all unrestricted offset sets. Examples:

| Layer | Encoder row 3: direct predecessors | Encoder row 3: reachable inputs | Decoder row 4: direct predecessors | Decoder row 4: reachable inputs |
|---|---|---|---|---|
| 1 | 2, 3, 4 | [2,4] | 2, 3, 4 | [2,4] |
| 2 | 1, 3, 5 | [0,5] | 0, 2, 4 | [0,4] |
| 3 | 3 | [0,5] | 0, 4 | [0,4] |
| 4 | 3 | [0,5] | 4 | [0,4] |
| 5 | 3 | [0,5] | 4 | [0,4] |
| 6 | 2, 3, 4 | [0,5] | 2, 3, 4 | [0,4] |

At encoder layer 5, row 3 has absent predecessors −13 and 19, and the sole valid predecessor 3. Its six reachable original slots were already gathered at earlier depths. A 63-position unrestricted span therefore does not imply 63 available inputs in this bank.

## Causal target access and source access

Every decoder dependency is at or before its input row. In particular, predicting t₅ at row 4 may read t₀ through t₄; it cannot read the supplied input slot for t₅, even when all target inputs are available together during training.

The encoder is unmasked. After these six teaching layers, each of its six output columns can structurally depend on all five real source tokens and the explicit padding input. There is no triangular source-token restriction. Reachable aligned encoder columns and reachable source tokens are different sets:

| Readout row | Predicts | Aligned current column | Reachable encoder columns through decoder |
|---:|---|---|---|
| 0 | t₁ | 0 | {0} |
| 1 | t₂ | 1 | [0,1] |
| 2 | t₃ | 2 | [0,2] |
| 3 | t₄ | 3 | [0,3] |
| 4 | t₅ | 4 | [0,4] |
| 5 | t₆ | 5 | [0,5] |
| 6 | t₇ | absent | [0,5] |
| 7 | t₈ | absent | [0,5] |
| 8 | t₉ | absent | [0,5] |

Every row in this small example can consequently access source tokens 0–4 and the separate source-padding slot 5. Past columns remain structurally reachable after the aligned current column is absent. These sets establish possible paths. Learned cancellation, zero weights and inactive units can reduce effective influence. Access is neither an alignment probability nor evidence of translation quality.

## Width estimates and EOS

The supplied v2 parameters are `a=1.2`, `b=0`. All executable examples use five source tokens, giving exactly six representation columns; no integer rounding is needed. BOS is an input and is excluded from the number of generated outputs; EOS is a generated output and is included.

| Case | Generated outputs | Final readout row | Current column at final row | Status |
|---|---:|---:|---|---|
| Early EOS | 2, ending in EOS | 1 | 1 | complete |
| EOS at estimate | 6, ending in EOS | 5 | 5 | complete |
| EOS beyond estimate | 8, ending in EOS | 7 | absent | complete |
| No EOS yet | 8 | 7 | absent | incomplete |
| Four-source-token estimate | none | none | unresolved | estimate 4.8; no rounded width |

Each executable row records its shifted input/output indices, both token labels, current encoder column and stop flag. Generation stops at the first EOS; output after EOS is rejected. Reaching or exceeding the estimated width does not complete the sequence. The missing-EOS example is a finite observation, not a source-defined stopping cap. A fractional estimate cannot be supplied with a silently floored or ceiled representation width.

## Historical and verification boundaries

V1's source-width unfolding and explicit zero current column, Sub-Batch Normalization, character n-gram inputs and earlier experiment recipe remain a textual contrast. V2's extended width and layer-normalized architecture are not interchangeable with that recipe. Neither result changes across revisions nor v2's conflicting introductory/tabular scores are controlled component ablations. The existing nineteen-claim record retains those evidence boundaries, with the targeted locator correction described above.

Expected finite sets were derived separately in Python by enumerating every complete tap path in reverse order and rejecting any intermediate out-of-range position. Unrestricted sets use independently enumerated path sums. Width cases use Decimal multiplication. The TypeScript engine instead propagates forward unions of predecessor dependency sets. The checked-in expected JSON retains all intermediate rows; the generator is not required to run the product.

[Tests](../tests/bytenet-engine.test.mjs) compare every expected entry and independently check hand-calculated rows, reset spans, a larger finite bank, target causality, unmasked source access, retained past source context and every unfolding outcome. Mutation cases reject wrong revisions/sources, future taps, shift/injection/block substitutions, missing or extra ledger fields, changed expected values, nonfinite or oversized dimensions, rounded widths and post-EOS output. These technical checks establish neither learner benefit nor human screen-reader usability. ConvS2S and Transformer calculation families and all rendered chapter gates remain open.
