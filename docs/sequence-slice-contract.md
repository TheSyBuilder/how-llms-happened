# Sequence-computation source and arithmetic contract

## Status and ownership

The [selected fourth slice](fourth-vertical-slice.md) has a [planned manifest](../data/journeys/sequence-computation.json), a [source adapter and validator](../src/lib/sequence-contract.ts), a [Parikh arithmetic fixture](../data/fixtures/parikh-attention.json), a [ByteNet structural fixture](../data/fixtures/bytenet-reach.json) and a [ConvS2S layer fixture](../data/fixtures/convs2s-layers.json). Source ownership and these three calculation families are complete; Transformer and all rendered chapters remain pending. This contract creates no public chapter or reference route. The optional lens retains its separate [learner-evidence gate](sequence-computation-interaction.md).

Every full-stage claim has exactly one owning expert block. Beginner tasks cover their existing objectives through predictions, comparisons and evidence interpretation. Complete references remain available to the future adapter in both modes; those references are not substitutes for beginner instruction. The manifest's reading-time values are provisional estimates, not measured completion times.

| Planned stage | Expert block suffixes | Claims | Mode objectives |
|---|---|---:|---:|
| `parikh-2016` | `mechanism`, `order`, `conditions`, `evidence` | 16 | 2 |
| `bytenet-2016` | `architecture`, `reach`, `history`, `evidence` | 19 | 2 |
| `convs2s-2017` | `block`, `read`, `conditions`, `evidence` | 20 | 2 |
| `transformer-2017` | `routes`, `positions`, `conditions`, `evidence` | 18 | 2 |

Block IDs, complete claim lists and objective IDs are explicit in the manifest. Expert ownership includes experiment setup/results, versions, uncertainties and limitations, not only the concepts used in numerical examples. Static experiment ledgers must eventually retain every admitted row and its conditions; this increment does not reproduce the papers' experiments.

The `cheng-recurrent-read` prerequisite belongs before Parikh. Its three claims are `cheng-2016-lstmn-memory-tape`, `cheng-2016-intra-attention-update` and `parikh-2016-cheng-intra-attention-adaptation`. The `memory-hop-comparison` prerequisite belongs before ConvS2S. Its four claims are `sukhbaatar-2015-soft-memory-read`, `sukhbaatar-2015-multi-hop-update`, `sukhbaatar-2015-weight-tying` and `gehring-2017-attention-antecedent-boundary`.

`getSequenceSourcePlan` retains all fifteen claims for each prerequisite work, including their complete versions, sources and objectives. Its six reference bundles contain 103 claims, 31 versions and 58 unique attached sources. Claim evidence keeps original locators, support, confidence, directness, checked dates, limitations and uncertainty. The four full stages account for 73 claims, seventeen versions and 33 unique attached sources. Full prerequisite objectives are reference material rather than promised teaching outcomes of these bounded comparisons.

All thirteen admitted relationships targeting these six works accompany the source bundle unchanged. Four are internal to the six-work surface; only `gehring-2017-to-vaswani-2017` connects two full stages. The adapter preserves source evidence, causal-language permission, evidence class and uncertainty. Neither the ordered manifest nor the adapter constructs an edge between adjacent teaching stages.

## Notation and source boundaries

| Work and primary source | Operation crosswalk | Historical or implementation boundary |
|---|---|---|
| [Parikh proceedings](https://aclanthology.org/D16-1244.pdf), §§3.1–3.4, printed pp. 2250–2251 | `e[i][j]` pairs A position i with B position j. `beta[i]` normalizes row i over B; `alpha[j]` normalizes column j over A. Both read original representations, not F outputs. Shared G compares each representation/read; two separate sums enter H and a final linear layer. | Corrected intra-attention adds `d[i-j]` to each score and `d[i-k]` inside each denominator term. [v1 Eq. 7](https://arxiv.org/pdf/1606.01933v1) repeats `d[i-j]`; do not label that equation corrected. The printed objective lacks the conventional minus sign. No numerical training objective is evaluated here. |
| [ByteNet v2](https://arxiv.org/pdf/1610.10099v2), §§3.1–3.6, article pp. 3–4 | Source slots, aligned encoder columns, decoder inputs and predictions have separate indices. The [finite-access ledger](bytenet-topology.md) uses explicit width-three offsets through `1,2,4,8,16,1`, boundary zeros and a supplied source-padding slot. Readout row r predicts tᵣ₊₁. | Structural six-block ReLU example only, with explicit base injection and BOS conventions. Unmasked source access differs from causal target access. Exact integer width/EOS cases are admitted; fractional width remains unresolved. V1/v2 blocks, recipes, units and result conflicts remain source-bound. |
| [ConvS2S PMLR](https://proceedings.mlr.press/v70/gehring17a/gehring17a.pdf), §§3.1–3.4 | GLU is `A ⊙ sigmoid(B)` inside a residual convolutional block. Layer l forms its query from the current layer state and target embedding. Keys are encoder outputs `z`; paper values are `z+e`, including source embeddings. Source normalization covers the full valid source bank. | The [calculation crosswalk](convs2s-calculations.md) retains the literal paper crop count separately from Torch negative-length indexing. Paper-equation reads use supplied states; a pinned-Lua two-layer comparison executes its own declared normalization/order. Earlier v2 comparator rows imported by Transformer stay separate from later PMLR values. |
| [Transformer proceedings](https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf), §§3.1–3.5 | Per head: project Q/K/V, form `QKᵀ/√dk`, exclude forbidden logits before softmax, read V, concatenate heads and apply Wᴼ. Distinguish encoder self, decoder self and decoder-to-encoder origins. Each full sublayer uses `LayerNorm(x+Sublayer(x))`. | Teaching row r reads shifted input r and predicts output r+1. BOS and padding are explicit fixture conventions. No triangular source-column mask. Retain FFN, output softmax and added positions. V1's missing displayed Wᴼ is not canonical; parsing and selected maps require arXiv sources. |

The conditioning primer binds each translation stage's conditional-objective claim; the Transformer primer additionally binds `vaswani-2017-embedding-and-output-normalization` and `vaswani-2017-attention-routes-and-causal-mask`. Position/window/block primers use ByteNet's masked-convolution/residual claims, ConvS2S's learned-position/gated-block/causal-decoder claims, and Transformer's architecture/positionwise/positional claims. These are already assigned in the manifest. Existing conditional-prediction and alignment chapters will supply same-mode prerequisite returns when routes are implemented.

Cheng's [canonical article](https://aclanthology.org/D16-1053.pdf), printed pp. 553–555, retrieves earlier paired hidden/cell tapes within a sequential gated update. Parikh's concept adaptation does not inherit that recurrence. The [MemN2N source](https://proceedings.neurips.cc/paper_files/paper/2015/file/8fb21ee7a2207526da55a679f0332de2-Paper.pdf), §§2.1–2.2, keeps input/output memories separate and distinguishes `u+o` from the tied learned-map variant `Hu+o`. A ConvS2S hop analogy does not transfer the complete architecture.

Targeted source inspection on 21 October 2026 checked these operation boundaries, particularly both Parikh denominators and the printed objective. That check did not revalidate all 103 claims, all revisions or every experiment, and renewed no corpus dates or [endpoint survey](current-endpoint.md).

The [ByteNet calculation review](bytenet-topology.md) on 22 October 2026 additionally checked both revisions' shift, unfolding, dilation and block passages. It retains seven v2 claim bindings and two v1 revision-boundary bindings. One existing v1 locator is corrected from §§3.4–3.5 to §§3.5–3.6; its claim date, both source access dates and the targeted corpus `asOf` are renewed. Scientific statements, remaining claim dates, evidence permissions and the endpoint survey are unchanged.

The [ConvS2S calculation review](convs2s-calculations.md) on 23 October 2026 checks canonical/v2 operations and comparator rows against an independently pinned implementation comparison. It binds six canonical claims plus the v2 result boundary. Literal-paper crop count, operational Lua crop, paper query/value sums and Lua variance factors stay separate. This targeted check changes no corpus claims, dates, relationship permissions or endpoint status.

## Admitted Parikh arithmetic

The fixture uses abstract identities A0/A1 and B0/B1/B2, supplied signed vectors and tiny shared networks. It omits dataset preprocessing, including NULL insertion, batching and padding. It demonstrates forward arithmetic, not learned semantic relations or NLI performance. No token is a masked slot. All values, parameters, affine terms, ReLU activations, stabilizing maxima, exponentials, denominators, weights, signed contributions, sums and class scores are retained in the JSON. Its [closed schema](../schemas/parikh-fixture.schema.json) rejects undeclared fields and historical-variant substitution.

Let `L=ln(2)`. Supplied A vectors are `(0,0)`, `(1,-1)`; B vectors are `(0,0)`, `(0,1)`, `(L,-1)`. F is two identity-affine/ReLU layers. Its outputs are `(0,0)`, `(1,0)` and `(0,0)`, `(0,1)`, `(L,0)`, respectively.

| Pair score e | B0 | B1 | B2 |
|---|---:|---:|---:|
| A0 | 0 | 0 | 0 |
| A1 | 0 | 0 | L |

| Read | Weights in bank order | Signed vector contributions | Resulting context |
|---|---|---|---|
| β0 over B | `(1/3,1/3,1/3)` | `(0,0); (0,1/3); (L/3,-1/3)` | `(L/3,0)` |
| β1 over B | `(1/4,1/4,1/2)` | `(0,0); (0,1/4); (L/2,-1/2)` | `(L/2,-1/4)` |
| α0 over A | `(1/2,1/2)` | `(0,0); (1/2,-1/2)` | `(1/2,-1/2)` |
| α1 over A | `(1/2,1/2)` | `(0,0); (1/2,-1/2)` | `(1/2,-1/2)` |
| α2 over A | `(1/3,2/3)` | `(0,0); (2/3,-2/3)` | `(2/3,-2/3)` |

For this authored G, its first affine layer computes the signed coordinate differences in both directions. ReLU and the second layer sum each opposing pair, giving two absolute-coordinate differences. H has first-layer rows `(1,1,-1,0)` and `(0,0,1,1)`, followed by ReLU and an identity/ReLU second layer. All biases are zero. The separate final linear layer has rows `(1,-1)`, `(-1,1)` and `(1/2,1/2)`.

| Stage | Output, rounded here to six decimals |
|---|---|
| G for A0 / A1 | `(0.231049,0)` / `(0.653426,0.750000)` |
| G for B0 / B1 / B2 | `(0.500000,0.500000)` / `(0.500000,1.500000)` / `(0.026481,0.333333)` |
| Separate sums A / B | `(0.884475,0.750000)` / `(1.026481,2.333333)` |
| H output | `(0.607995,3.359814)` |
| Final class scores | `(-2.751819,2.751819,1.983904)` |

These are three unnormalized abstract class scores. They are not word probabilities. The JSON retains full stored precision. The expected ledger was calculated separately with 65-digit Decimal arithmetic and direct exponentials; the TypeScript engine uses stabilized softmax. Exact rational checkpoints above additionally test the normalization axes independently of that full ledger.

Every permutation within A and within B preserves the appropriate identity-specific reads, both sums and the final scores when fixed representations move with their identities. All twelve combinations are tested. Swapping the two sentence roles is a different operation and changes this classifier's scores. A zero F produces uniform directional weights; identical B vectors make every β context equal that common vector.

The optional intra example has three supplied vectors `(0,-1)`, `(1,0)`, `(0,1)` and explicit short-distance biases `d[-2]=-L`, `d[-1]=0`, `d[0]=L`, `d[1]=0`, `d[2]=-L`. The first content-score row is zero, so corrected weighting gives `(4/7,2/7,1/7)`. The repeated-bias v1 denominator cancels the bias and would give `(1/3,1/3,1/3)` for that row. This is a source comparison, not an executed historical variant. The fixture specifies no bucket rule outside these distances. Reordering tokens under fixed positional biases can change their reads; adding a common offset to every bias cannot.

## Verification and remaining gates

The [engine tests](../tests/parikh-engine.test.mjs) check independent expected arithmetic, every within-sentence permutation, directional normalization, signed contributions, optional-distance behavior, constant-offset invariance and uniform/identical safeguards. They reject empty banks, ragged or mismatched shapes, duplicate identities, missing distance entries, nonfinite inputs/overflow, wrong variants and incomplete or changed expected ledgers.

The [source-contract tests](../tests/sequence-contract.test.mjs) enforce all stage claims/objectives, both exact prerequisite scopes, complete references and qualified incoming relationships. Mutation cases reject foreign claims, duplicate ownership, source/version swaps, unexpected metadata and premature built status. The existing site's sixteen reference destinations remain unchanged.

The [ByteNet tests](../tests/bytenet-engine.test.mjs) verify ninety finite rows against independently enumerated complete paths, unrestricted sets and spans, all source/target access rows, the dilation reset and five width/EOS cases. The [complete static derivation](bytenet-topology.md) distinguishes padding inputs from boundary zeros, current-column absence from retained past context, and structural access from learned influence. Its closed schema and source contract reject revision swaps, undeclared fields, wrong shapes/conventions, changed ledgers and invented rounding. This does not reproduce historical activations or the full experiment's receptive field.

The [ConvS2S tests](../tests/convs2s-engine.test.mjs) verify independent signed intermediate ledgers, causal prefix/append invariance, distinct source keys/values, two actual successive-layer reads, source/context/residual factors and gradient-policy scope. Its [complete static ledger](convs2s-calculations.md) and [closed schema](../schemas/convs2s-fixture.schema.json) retain source identities, crop disagreement, supplied-state paper panels, pinned-Lua execution order and every arithmetic term. The fixture uses supplied projected encoder keys and an identity target input map; it reproduces no training or translation result.

Before any chapter is built, complete and review:

1. Transformer rectangular routes with unequal valid lengths, padding and BOS shift; forbidden-key invariance; two projected heads with Wᴼ; and position/permutation comparisons. Reject padding queries and all-masked rows before softmax.
2. Human-readable complete static Transformer ledgers, independent expected arithmetic and source/shape/variant guards. Connectivity, weighted influence, path length and measured quality remain separate concepts.
3. Chapter-specific experiment ledgers, same-mode owner/reference returns, no-JavaScript and keyboard paths, expanded-evidence axe, graphics-hidden/reduced-motion/forced-colors, closed-disclosure print, four-width rendered review and payload/link gates.

Only after these source/fixture gates pass should Parikh and its owning Cheng comparison become the first built chapter. Later stages remain planned until their own checks pass. No learner benefit or human screen-reader result has been established by these technical checks.
