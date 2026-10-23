# ConvS2S: causal windows and layerwise source reads

## Scope and sources

The [fourth-slice contract](sequence-slice-contract.md) admits this calculation family while every chapter remains planned. The [fixture](../data/fixtures/convs2s-layers.json), [closed schema](../schemas/convs2s-fixture.schema.json), [engine](../src/lib/convs2s-engine.ts) and [tests](../tests/convs2s-engine.test.mjs) distinguish two supplied-state paper-equation reads from an explicit two-layer implementation comparison. All vectors and weights are authored teaching values. Encoder keys are supplied; no encoder training, vocabulary head, loss, optimizer, dropout or translation experiment is reproduced.

Primary sources checked on 23 October 2026:

| Source | What it controls |
|---|---|
| [ICML/PMLR article](https://proceedings.mlr.press/v70/gehring17a/gehring17a.pdf), §§3.1–3.4, PDF leaves 2–4 | Learned positions; contiguous convolution and GLU; crop prose; next-token factorization; attention Eqs. 1–2; residual/context normalization and gradient policy. |
| [arXiv v2](https://arxiv.org/pdf/1705.03122v2), §§3.1–3.4 and Tables 1–2 | Same displayed mechanism and earlier result rows. Its French single/ensemble values are 40.46/41.29 and German ensemble is 26.36; PMLR updates these to 40.51/41.44/26.43. Do not transfer later rows into the Transformer's earlier comparison. |
| [Archived fairseq Lua model](https://github.com/facebookresearch/fairseq-lua/blob/7a6fff0f3647c6a4c8c59b4253004c4761eb11b3/fairseq/models/fconv_model.lua), revision `7a6fff0f3647c6a4c8c59b4253004c4761eb11b3` | `makeEmbedding`, `makeDecoderConvBlock`, `makeEncoder`, `makeAttention`, `makeDecoderLM`: operational crop, query/value normalization, source read, attention-before-residual order and encoder parameter scaling. |
| [Torch Narrow](https://github.com/torch/nn/blob/5efb612f312ea8d3996251ab9f45472ea90485c8/Narrow.lua), revision `5efb612f312ea8d3996251ab9f45472ea90485c8` | `updateOutput` negative-length formula; a negative length is not a count of outputs to discard. |
| [Lua SeqMultiply](https://github.com/facebookresearch/fairseq-lua/blob/7a6fff0f3647c6a4c8c59b4253004c4761eb11b3/fairseq/modules/SeqMultiply.lua) and [GradMultiply](https://github.com/facebookresearch/fairseq-lua/blob/7a6fff0f3647c6a4c8c59b4253004c4761eb11b3/fairseq/modules/GradMultiply.lua) | Source-length context factor and the distinction between parameter-gradient accumulation, input gradients and forward values. |

The immutable Lua snapshot is an implementation comparison, **not an identified commit for the published experiments**. It supplies operational details absent from, or differing from, the paper's displayed shorthand. No source code or paper figures are copied into the project. This targeted review does not renew the full scientific corpus or the endpoint survey.

Six canonical claims bind the fixture: `gehring-2017-learned-position-embeddings`, `gehring-2017-gated-convolutional-blocks`, `gehring-2017-causal-decoder-and-parallelism`, `gehring-2017-layerwise-multi-step-attention`, `gehring-2017-normalization-and-initialization`, and `gehring-2017-version-result-boundary`. The v2 binding retains only the result-boundary claim. Implementation identity is a separate pinned record; it is not represented as a paper revision or experimental checkpoint.

## Causal crop and prediction indexing

For width `k=3`, padding an `n`-row input with two zero rows on both sides and applying a stride-one valid convolution gives `n+2` outputs. Literally discarding the final three outputs, as the paper's prose says, leaves `n−1`. The fixture records that count and does not silently assert length preservation for that literal instruction.

The pinned implementation instead uses `Narrow(2,1,-k)`. Torch computes its retained length as `M−index+length+2`. With `M=n+k−1`, index 1 and length `−k`, this equals `n`. Thus this code retains rows `0…n−1` and discards `k−1` rows. The negative-length convention explains how this implementation preserves the sequence length; it does not resolve which convention produced every historical experiment.

For four input rows, the padded length is 8, convolution length 6, literal-paper retained count 3, and Lua retained count 4. Discarded Lua rows are 4 and 5. Each retained row r uses offsets `[-2,-1,0]`. At row 0 the flattened window is `(0,0,0,0,0.2,0)`. Boundary zeros are not valid target tokens.

| Input row | Supplied decoder input | Predicted output | First-layer predecessors | Two-layer target-input access |
|---:|---|---|---|---|
| 0 | BOS | y1 | 0 | 0 |
| 1 | y1 | y2 | 0, 1 | 0, 1 |
| 2 | y2 | y3 | 0, 1, 2 | 0, 1, 2 |
| 3 | y3 | y4 | 1, 2, 3 | 0, 1, 2, 3 |

There is no supplied y4 input. Target values are teacher-forcing labels, not generated predictions. Appending or changing future target rows must leave earlier rows unchanged in **both** layers. The valid source bank remains globally readable even at BOS; source keys do not receive a triangular target mask.

The separate structural encoder ledger uses `[-1,0,1]`, the decoder ledger `[-2,-1,0]`. After one/two undilated layers their unrestricted spans are 3/5, following `1+L(k−1)`. Finite sets exclude out-of-width predecessors at every layer. On the three-slot source bank, encoder row 0 reaches `{0,1}` after one layer and `{0,1,2}` after two. This encoder ledger describes structural access only: it does not generate the supplied keys, quantify learned influence or measure quality.

## Inputs and explicit tiny maps

Embedding width and hidden width are both 2. The target embedding-to-hidden map is explicitly identity with zero bias. Source keys are already projected supplied encoder outputs. Learned-position vectors are supplied independently from token vectors; their addition is computed and retained.

| Source slot | Word vector | Position vector | e = word + position | Key z | Paper value z + e |
|---|---|---|---|---|---|
| S0 | `(0.1,1)` | `(0,0.2)` | `(0.1,1.2)` | `(1,−0.5)` | `(1.1,0.7)` |
| S1 | `(1,−0.5)` | `(0.3,−0.1)` | `(1.3,−0.6)` | `(−1,1)` | `(0.3,0.4)` |
| S2 | `(−1,0.5)` | `(0.3,0)` | `(−0.7,0.5)` | `(0.5,0.25)` | `(−0.2,0.75)` |

Target word vectors are `(0.2,−0.1)`, `(0.5,0.2)`, `(−0.3,0.8)`, `(0.7,−0.4)`. Position vectors are `(0,0.1)`, `(0.1,0)`, `(−0.1,0.2)`, `(0.2,−0.1)`. Their g sums are `(0.2,0)`, `(0.6,0.2)`, `(−0.4,1)`, `(0.9,−0.5)`.

Each convolution matrix has four output rows ordered A0, A1, B0, B1 and six columns ordered oldest-to-current, two coordinates per slot. `GLU=A⊙sigmoid(B)` retains signed A and has no tanh or ReLU.

```text
Wconv1 = [ 0.25,  0,    -0.5,   0.25,  1,     0    ]
         [ 0,    -0.25,  0.5,   0,     0,     1    ]
         [ 0,     0,     0.25,  0,     0,    -0.5  ]
         [ 0.25,  0,     0,     0,    -0.25,  0.25 ]
bconv1 = (0,0,0,0)

Wconv2 = [ 0,     0.25,  0.5,   0,     1,    -0.25 ]
         [-0.25,  0,     0,     0.5,   0.25,  1    ]
         [ 0,    -0.25,  0.5,   0,    -0.25,  0    ]
         [ 0.25,  0,     0,    -0.5,   0,     0.25 ]
bconv2 = (0.1,-0.1,0,0)

Wquery1 = [1,0.5; -0.25,1]     bquery1 = (0.1,-0.1)
Wquery2 = [0.5,-1; 1,0.25]     bquery2 = (-0.2,0.1)
Wcontext1 = [1,-0.25; 0.5,1]   bcontext1 = (0,0)
Wcontext2 = [0.75,0.25; -0.5,1] bcontext2 = (0.05,-0.05)
```

These are effective affine weights, without simulating weight-normalization parameters. Context maps explicitly return the two-dimensional source read to hidden space. The fixture is a forward calculation at supplied parameters, not an initialization or optimization example.

## Paper-equation read panels

For a supplied state h, Eq. 1 gives `d=Wquery h+bquery+g`. Scores are `d·zj`, normalized across the three source positions. Eq. 2 reads the **different** values `zj+ej`. Section 3.4 scales the context by `m√(1/m)=√m`; here m=3. This is a variance heuristic under an approximate uniform-weight assumption, not a second probability normalization.

Both panels use g at target row 1. The first supplied state is `(1,−0.5)` with query map 1, the second `(−0.25,0.75)` with map 2. Neither state is generated by the other panel. They illustrate layer-specific queries without asserting an unspecified combined paper-block order. Values below are rounded to six decimals; the JSON retains every product, bias, score, maximum, exponential, denominator and signed contribution at stored precision.

| Panel | Query d | Scores over S0/S1/S2 | Source weights |
|---|---|---|---|
| 1 | `(1.450000, -0.650000)` | `(1.775000, -2.100000, 0.562500)` | `(0.758606, 0.015744, 0.225649)` |
| 2 | `(-0.475000, 0.237500)` | `(-0.593750, 0.712500, -0.178125)` | `(0.161092, 0.594802, 0.244106)` |

| Panel | Signed value contributions in source order | Context | Scaled context |
|---|---|---|---|
| 1 | `(0.834467, 0.531024)`; `(0.004723, 0.006298)`; `(-0.045130, 0.169237)` | `(0.794060, 0.706559)` | `(1.375353, 1.223796)` |
| 2 | `(0.177202, 0.112765)`; `(0.178440, 0.237921)`; `(-0.048821, 0.183080)` | `(0.306821, 0.533765)` | `(0.531429, 0.924508)` |

## Pinned-Lua two-layer comparison

Let s=√0.5. For each layer and target row, the executed order is:

1. Convolve the previous layer's causal window and compute GLU v.
2. Form query `d=s(Wquery v+bquery+g)` and score the supplied keys z.
3. Read Lua values `s(z+e)` using source softmax; multiply that read by √m.
4. Map the scaled context with Wcontext and bcontext; form `a=s(v+mappedContext)`.
5. Form next-layer output `h=s(previousRow+a)`.

This matches the selected Lua methods with the declared identity input map, supplied keys and authored parameters. Both query/value sum factors and the two later sum factors are explicit. The displayed paper equations alone do not specify this whole sequence. The second layer consumes the **actual first-layer outputs**, including their source reads, at the same and earlier target rows. Layer depth does not advance target time.

| Layer / row | A | B | Gates σ(B) | GLU v |
|---|---|---|---|---|
| 1 / 0 | `(0.200000, 0.000000)` | `(0.000000, -0.050000)` | `(0.500000, 0.487503)` | `(0.100000, 0.000000)` |
| 1 / 1 | `(0.500000, 0.300000)` | `(-0.050000, -0.100000)` | `(0.487503, 0.475021)` | `(0.243751, 0.142506)` |
| 1 / 2 | `(-0.600000, 1.300000)` | `(-0.350000, 0.400000)` | `(0.413382, 0.598688)` | `(-0.248029, 0.778294)` |
| 1 / 3 | `(1.500000, -0.750000)` | `(0.150000, -0.200000)` | `(0.537430, 0.450166)` | `(0.806145, -0.337625)` |
| 2 / 0 | `(0.343581, 0.538810)` | `(-0.094890, 0.135980)` | `(0.476295, 0.533943)` | `(0.163646, 0.287694)` |
| 2 / 1 | `(0.844519, 1.140133)` | `(0.002303, -0.076786)` | `(0.500576, 0.480813)` | `(0.422746, 0.548190)` |
| 2 / 2 | `(-0.088796, 1.597384)` | `(0.321152, 0.075569)` | `(0.579605, 0.518883)` | `(-0.051467, 0.828856)` |
| 2 / 3 | `(1.505265, 0.956896)` | `(-0.712474, -0.517230)` | `(0.329052, 0.373500)` | `(0.495311, 0.357401)` |

| Layer / row | Query d | Scores over S0/S1/S2 | Source weights |
|---|---|---|---|
| 1 / 0 | `(0.282843, -0.088388)` | `(0.327037, -0.371231, 0.119324)` | `(0.432922, 0.215355, 0.351723)` |
| 1 / 1 | `(0.717717, 0.128388)` | `(0.653522, -0.589328, 0.390955)` | `(0.485995, 0.140239, 0.373766)` |
| 1 / 2 | `(-0.112347, 1.230579)` | `(-0.727636, 1.342926, 0.251471)` | `(0.086271, 0.684068, 0.229661)` |
| 1 / 3 | `(1.157769, -0.805508)` | `(1.560523, -1.963277, 0.377507)` | `(0.748592, 0.022074, 0.229334)` |
| 2 / 0 | `(-0.145573, 0.237283)` | `(-0.264214, 0.382856, -0.013465)` | `(0.238383, 0.455297, 0.306320)` |
| 2 / 1 | `(0.044677, 0.607966)` | `(-0.259306, 0.563289, 0.174330)` | `(0.207501, 0.472355, 0.320144)` |
| 2 / 2 | `(-1.028550, 0.887948)` | `(-1.472524, 1.916497, -0.292288)` | `(0.029505, 0.874450, 0.096044)` |
| 2 / 3 | `(0.417373, 0.130575)` | `(0.352086, -0.286798, 0.241330)` | `(0.412705, 0.217859, 0.369436)` |

| Layer / row | Signed value contributions in source order | Context | √m × context |
|---|---|---|---|
| 1 / 0 | `(0.336734, 0.214285)`; `(0.045684, 0.060912)`; `(-0.049741, 0.186529)` | `(0.332677, 0.461726)` | `(0.576213, 0.799733)` |
| 1 / 1 | `(0.378015, 0.240555)`; `(0.029749, 0.039666)`; `(-0.052859, 0.198220)` | `(0.354906, 0.478440)` | `(0.614715, 0.828683)` |
| 1 / 2 | `(0.067103, 0.042702)`; `(0.145113, 0.193484)`; `(-0.032479, 0.121796)` | `(0.179737, 0.357982)` | `(0.311314, 0.620043)` |
| 1 / 3 | `(0.582268, 0.370534)`; `(0.004683, 0.006243)`; `(-0.032433, 0.121623)` | `(0.554518, 0.498400)` | `(0.960453, 0.863255)` |
| 2 / 0 | `(0.185419, 0.117994)`; `(0.096583, 0.128777)`; `(-0.043320, 0.162450)` | `(0.238682, 0.409222)` | `(0.413409, 0.708793)` |
| 2 / 1 | `(0.161398, 0.102708)`; `(0.100202, 0.133602)`; `(-0.045275, 0.169782)` | `(0.216324, 0.406092)` | `(0.374685, 0.703372)` |
| 2 / 2 | `(0.022950, 0.014604)`; `(0.185499, 0.247332)`; `(-0.013583, 0.050935)` | `(0.194866, 0.312872)` | `(0.337518, 0.541909)` |
| 2 / 3 | `(0.321009, 0.204278)`; `(0.046215, 0.061620)`; `(-0.052246, 0.195923)` | `(0.314978, 0.461821)` | `(0.545558, 0.799898)` |

| Layer / row | Mapped context | Attention sum × s | Residual sum × s = output |
|---|---|---|---|
| 1 / 0 | `(0.376279, 1.087840)` | `(0.336780, 0.769219)` | `(0.379561, 0.543920)` |
| 1 / 1 | `(0.407544, 1.136040)` | `(0.460536, 0.904069)` | `(0.749912, 0.780695)` |
| 1 / 2 | `(0.156303, 0.775699)` | `(-0.064860, 1.098839)` | `(-0.328706, 1.484103)` |
| 1 / 3 | `(0.744640, 1.343481)` | `(1.096570, 0.711248)` | `(1.411788, 0.149375)` |
| 2 / 0 | `(0.537255, 0.452088)` | `(0.495612, 0.523105)` | `(0.618841, 0.754500)` |
| 2 / 1 | `(0.506856, 0.466030)` | `(0.657328, 0.717162)` | `(0.995069, 1.059144)` |
| 2 / 2 | `(0.438616, 0.323150)` | `(0.273756, 0.814591)` | `(-0.038856, 1.625423)` |
| 2 / 3 | `(0.659143, 0.477119)` | `(0.816322, 0.590095)` | `(1.575512, 0.522884)` |

For example, layer 1 row 0 has A=(0.2,0), B=(0,−0.05), and v=(0.1,0). Its query sum before s is `(0.4,−0.125)`. After the globally normalized read, context mapping and both sum factors, its output is `(0.379561,0.543920)`. The second layer's first window contains that output and four boundary-zero coordinates. Its query therefore reflects the first layer's source read while still having no future target access.

## Gradient-policy panel and safeguards

The paper describes reducing encoder gradients according to the number of attention modules and excluding source embeddings. The pinned code specifies more: each module reaches encoder output through both the dot-product and weighted-sum paths, so `makeEncoder` wraps the encoder stack in `GradMultiply` with factor `1/(2×moduleCount)`. For two modules the factor is 1/4. The wrapper scales parameter accumulation, passes input gradients through unchanged, and leaves forward values unchanged. This factor is not applied to the direct source-embedding path.

A supplied aggregate encoder-parameter gradient `(8,−4)` therefore becomes `(2,−1)` at this wrapper; a supplied embedding gradient `(3,−2)` stays `(3,−2)`. These are policy inputs, **not derivatives calculated from the forward example**. The panel does not implement backpropagation, clipping, token normalization, or the optimizer. Applying 1/2 as if the paper's shorthand specified the pinned wrapper would conflate the two source descriptions.

Changing e while holding z fixed preserves first-layer attention scores and changes the read values. It can change second-layer scores because the first read enters that layer's input. Setting a paper query to zero gives weights `(1/3,1/3,1/3)` and context `(0.4,0.616667)` before √3 scaling. Making all three paper values `(0.75,−0.5)` fixes the context at that vector even when the weights differ. Neither a large weight nor structural access establishes a causal linguistic explanation.

## Verification and teaching admission

Expected arithmetic was derived separately using 65-digit Decimal arithmetic, direct exponential normalization and reverse enumeration of finite paths. The TypeScript engine uses stabilized softmax, forward set propagation and IEEE doubles. Every stored intermediate must agree within `2×10⁻¹²` relative-to-unit tolerance; no snapshot is generated by the engine under test.

Tests additionally check future-target mutation and append invariance across both layers, source key/value separation, later-layer dependence on earlier reads, uniform/identical-value safeguards, GLU sign, all variance factors, crop counts and parameter-versus-embedding gradient policy. The closed schema and corpus contract reject source/version swaps, unpinned code, foreign claims, hidden padding/masks, malformed shapes, premature chapter availability, nonfinite input or overflow, and altered or incomplete ledgers.

Beginner instruction should predict accessible target/source positions, explain why a value changes while its weight stays fixed, and follow one repeated read. Expert instruction should reconstruct the flattened window, gated channels, distinct key/value paths, projection/scaling order and source conventions. Both require the complete static baseline. This fixture admits arithmetic only: every fourth-slice chapter, the Transformer fixture gate, rendered/accessibility checks and optional interaction learner gates remain separate.
