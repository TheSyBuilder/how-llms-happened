# Fourth vertical slice: sequence computation without recurrence

## Decision and status

The next journey will ask: **Which positions can contribute to a representation, how do they contribute, and which computations still depend on an earlier step?** Select four full stages: Parikh et al. 2016, ByteNet 2016/2017, ConvS2S 2017, and Vaswani et al. 2017. Use Sukhbaatar et al. 2015 and Cheng–Dong–Lapata 2016 as two bounded prerequisite comparisons. Their complete teaching chapters remain deferred.

This is an editorial learning sequence across classification and translation branches. It is not a four-paper influence chain. All stages and comparisons are **planned**. The [source/arithmetic contract](sequence-slice-contract.md) assigns the complete teaching inventory and admits the first Parikh calculation family; the other calculation gates remain pending. No routes or controls are implemented. The [interaction brief](sequence-computation-interaction.md) requires complete static explanations before one optional attention-route lens can be evaluated.

The [alignment journey](third-vertical-slice.md) already supplies conditional prediction, weighted source reads and recurrent decoder timing. The new slice distinguishes those reads from attention within a sequence, convolutional communication, and the Transformer's three attention routes. It ends at the original encoder–decoder Transformer; later decoder-only pretraining and modern positional variants require another slice.

## Candidate comparison

Counts come from the admitted [corpus](../data/corpus.json), including target-side lineage claims. Sources are unique IDs attached to each work; totals deduplicate shared IDs. These counts estimate review scope, not quality or historical importance.

| Candidate | Versions | Sources | Claims | New learning job | Decision |
|---|---:|---:|---:|---|---|
| Sukhbaatar, End-To-End Memory Networks | 6 | 13 | 15 | Several query updates and soft memory reads before one answer | Scoped comparison before ConvS2S; full QA/LM chapter deferred |
| Cheng, Long Short-Term Memory-Networks | 8 | 12 | 15 | Read paired hidden/cell tapes inside a sequential gated update | Scoped comparison before Parikh; full recurrent reader deferred |
| Parikh, Decomposable Attention | 3 | 7 | 16 | Parallel sentence-pair comparison; optional same-sentence attention | Full stage 1 |
| ByteNet | 2 | 5 | 19 | Causal dilated convolution, resolution-preserving source interface and unfolding | Full stage 2 |
| ConvS2S | 4 | 13 | 20 | Contiguous convolution plus a source read at every decoder layer | Full stage 3 |
| Transformer | 8 | 12 | 18 | Projected attention routes, causal masking, positions and parallel layer computation | Full stage 4 |
| **Full-stage selection** | **17** | **33** | **73** | Four works, eight existing mode objectives | One internal corpus relationship |
| **Six-work comparison surface** | **31** | **58** | **103** | Includes both prerequisite works | Four internal corpus relationships |

The two-stage ConvS2S/Transformer alternative is smaller but leaves two important distinctions implicit: attention without recurrence already served a non-generative task, and convolutional transduction need not use an attention read. Adding Parikh and ByteNet makes those distinctions testable. The six-full-stage alternative would also require complete external-memory QA/LM and three-task recurrent-reader instruction before reaching the new computation question. Their narrow comparisons supply the needed contrast without implying that either paper is historically dispensable.

The selected posting dates are 6 June 2016, 31 October 2016, 8 May 2017 and 12 June 2017 respectively. Sukhbaatar first posted on 31 March 2015 and Cheng on 25 January 2016. These dates govern chronology, not private conception or influence. [Parikh record](https://arxiv.org/abs/1606.01933), [ByteNet record](https://arxiv.org/abs/1610.10099), [ConvS2S record](https://arxiv.org/abs/1705.03122), [Transformer record](https://arxiv.org/abs/1706.03762).

## Learning paths

Beginner mode begins with a source sentence, a target prefix, and an explanation of what a layer can read. It introduces premise/hypothesis classification separately: a class label is not a generated next word. Each stage asks for a prediction, exposes a complete worked comparison, then asks the learner to explain a counterexample. The learner need not reconstruct a full gated reader or memorize an optimizer.

Expert mode begins with tensor provenance, normalization axes, conditional factorization and the distinction between computation work, sequential depth and dependency path length. It requires equation reconstruction, a historical-version audit and a source-conditioned experiment ledger at each stage. Both modes retain the complete factual record; beginner reference disclosures remain available without making those disclosures the teaching path.

| Stage | Beginner task and observable success | Expert task and observable success | Existing objective IDs |
|---|---|---|---|
| Parikh | Follow both directions of a sentence-pair read, local comparison and summed evidence. Explain why permuting tokens within either sentence, with fixed vanilla representations, preserves class scores and why optional distance information changes that comparison. | Reconstruct both normalizers, Compare/Aggregate and optional intra-attention; retain the full complexity expression and its length/dimension assumption. Audit the printed loss sign, corrected denominator and unmatched capacity comparison. | `beginner-parikh-2016-attend-compare-aggregate`; `expert-parikh-2016-mechanism-complexity-and-versions` |
| ByteNet | Trace an allowed target-prefix path and a source column; compare one dilation cycle with its reset and follow a target beyond the estimated representation width. Identify the EOS stop and explain why training parallelism does not generate all target characters together. | Derive finite receptive fields from explicit offsets and masks, then audit stacking, unfolding, complexity, units and both revision-specific experiment recipes. Separate gradient sensitivity from attention. | `beginner-kalchbrenner-2016-follow-dilated-convolution`; `expert-kalchbrenner-2016-architecture-complexity-and-versions` |
| ConvS2S | Grow a contiguous window through layers, then follow one target position through successive source reads. Distinguish layer depth from target time and learned position inputs from convolution itself. | Reconstruct GLU/residual blocks, causal cropping, each layer's query/key/value provenance, scaling and initialization; audit position, attention, depth, speed and version-specific results. | `beginner-gehring-2017-follow-convolution-and-attention-hops`; `expert-gehring-2017-mechanism-results-and-versions` |
| Transformer | Identify query, key and value origins in all three routes; predict forbidden decoder reads, trace two projected heads and explain the position signal. Keep layer-parallel training separate from autoregressive generation. | Derive scaled scores, pre-softmax masks, head concatenation/output projection and the complete post-normalized block. Audit Table 1 assumptions, training/decoding, results and version-only material. | `beginner-vaswani-2017-follow-attention-routes`; `expert-vaswani-2017-mechanism-results-and-versions` |

Mode switching must preserve stage and comparison context while changing the task, prerequisites and representation. Beginner access predictions and expert equation/version audits must be independently usable. Both paths preserve uncertainty, failed examples and unreported results.

## Bounded prerequisites and returns

| Owning stage | Required bridge | Claim scope and boundary |
|---|---|---|
| Parikh | **A recurrent read within one sequence.** Contrast Cheng's prior hidden/cell tapes with Parikh's all-position feed-forward read. Reuse the existing gated-state lessons. | `cheng-2016-lstmn-memory-tape`, `cheng-2016-intra-attention-update`, `parikh-2016-cheng-intra-attention-adaptation`. Do not teach Cheng's deep-fusion equation or three experiment tables through this bridge. |
| ConvS2S | **Repeated reads before one output.** Show a supplied query, a memory read and an updated query beside successive decoder-layer reads. | `sukhbaatar-2015-soft-memory-read`, `sukhbaatar-2015-multi-hop-update`, `sukhbaatar-2015-weight-tying`, `gehring-2017-attention-antecedent-boundary`. Keep residual and learned-H hop variants separate; the cited analogy does not transfer topology or QA results. |
| ByteNet, ConvS2S, Transformer | **Conditioning and shifted prediction.** Return to the existing conditional-sequence and alignment stages. Add a short source-bound token/position, convolution-window and residual/normalization primer where first needed. | Bind the selected papers' own objective, block and position claims in the contract. Keep character, BPE and wordpiece units labelled; original cell gates are not GLUs. A position signal is not an additional observed target token. |

The [MemN2N paper](https://proceedings.neurips.cc/paper_files/paper/2015/file/8fb21ee7a2207526da55a679f0332de2-Paper.pdf), §§2.1–2.2, defines a read over separate input/output memory vectors and repeated internal updates. The [Cheng article](https://aclanthology.org/D16-1053.pdf), printed pp. 553–555, places attentive retrieval inside a recurrent tape update. Neither comparison can be relabelled as the original Transformer block. Their eventual full reference records must preserve every admitted claim even when the teaching bridge uses only the listed subset.

Every bridge and reference needs a same-mode return to its owning stage; opening another context must not overwrite a work's existing primary teaching destination. Unbuilt full chapters stay unavailable. No new corpus work, objective or influence edge is implied by these prerequisites.

## Lineage and comparison boundaries

The only internal relationship among the four full stages is `gehring-2017-to-vaswani-2017`. It permits qualified continuity for familiar encoder–decoder attention and the evaluated learned-position alternative. It does not attribute Transformer self-attention, scaled heads, default sinusoids or feed-forward blocks to ConvS2S.

The six-work surface also contains `sukhbaatar-2015-to-cheng-2016` (qualified soft-addressing combination), `cheng-2016-to-parikh-2016` (qualified intra-attention concept adaptation), and `sukhbaatar-2015-to-gehring-2017` (editorial conceptual parallel, causal language prohibited). The last record remains noncausal despite an explicit citation.

Existing incoming records connect Bahdanau to Parikh, ByteNet and ConvS2S; Cho and Sutskever to ByteNet; and Luong to ConvS2S. Inspect each record's independent connection, evidence class and causal permission. In particular, the Bahdanau/ByteNet problem comparison prohibits causal language even though its evidence class is documented influence. A shared citation class is not a blanket permission to say “adopted.”

The Transformer discusses Cheng, Parikh, external-memory recurrence and ByteNet in context; those passages do not establish adoption edges for their complete mechanisms. Do not add Parikh→ByteNet, ByteNet→ConvS2S, ByteNet→Transformer, Parikh→Transformer, Cheng→Transformer, MemN2N→Transformer or Luong→Transformer arrows from this teaching order. The [canonical Transformer](https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf), §§1–3.5, is the relevant target-side evidence. The corpus's version-specific memory-network citation boundary must also remain visible.

## Source and experiment gates

These are requirements for future chapter authoring, not new experiments or reconciliations of the corpus.

- **Parikh:** use [EMNLP](https://aclanthology.org/D16-1244.pdf), printed pp. 2250–2254, for the corrected mechanism, all result rows and qualitative errors. Preserve the absent conventional minus sign in the printed objective. Compare [v1 Eq. 7](https://arxiv.org/pdf/1606.01933v1) with the corrected denominator; do not silently repair historical text. Vanilla order insensitivity is a structural observation, not a general claim that order is unnecessary. The optional intra-attention result changes capacity as well as mechanism.
- **ByteNet:** use [v2](https://arxiv.org/pdf/1610.10099v2), §§3–5 and Tables 1–4, for the canonical architecture. Preserve estimated source-scaled width versus EOS termination, repeated dilation cycles and the finite model's reach. Retain v1/v2 changes, the introduction/table BLEU conflict, and bits-per-byte versus bits-per-character wording. Analytic sequence-length work is not measured wall-clock speed; the gradient figure is not an attention map.
- **ConvS2S:** use [PMLR](https://proceedings.mlr.press/v70/gehring17a/gehring17a.pdf), §§3–5, for blocks, all decoder-layer reads, results, ablations and hardware conditions. Retain the separate supplement for its selected maps. The Transformer imports [v2-era comparator rows](https://arxiv.org/pdf/1705.03122v2), not the later PMLR result updates. Record both with their own conditions rather than replacing the older values.
- **Transformer:** use the canonical proceedings article for architecture and Tables 1–3; parsing and selected attention maps require the arXiv branch. Preserve [v1's displayed head equation](https://arxiv.org/pdf/1706.03762v1) without projecting its missing output projection into the canonical block. Keep [v7's 41.8](https://arxiv.org/pdf/1706.03762v7) separate from canonical 41.0 and the conflicting v7 prose. The complete block includes feed-forward, residual, normalization and output operations. Imported baseline costs and development/test ablations are not a matched experiment.

The targeted passages, chronology records and interaction references were accessed on 20 October 2026. Existing corpus sources, claim checked dates and `asOf` remain unchanged: this selection review does not constitute full claim-level revalidation. It also does not renew the [current-endpoint review](current-endpoint.md) or make a present-day completeness claim.

## Source/fixture contract gates

The [contract](sequence-slice-contract.md) and planned manifest now complete claim/objective ownership, prerequisite/reference scope and the operation crosswalk. Parikh's bidirectional read, shared Compare/Aggregate calculation, permutation checks and corrected short-distance intra-attention are verified. ByteNet, ConvS2S and Transformer numerical families remain pending. The following gates apply to the complete slice:

Before implementing a route, complete these gates:

1. Assign **all 73 full-stage claims and eight objectives**, the two prerequisite scopes and every relevant relationship to narrative, static arithmetic, experiment ledgers or full work records. Separate bridge teaching subsets from complete reference inventories. Carry all source/version locators and uncertainties through the adapter.
2. Define four planned stages and two owning-stage comparisons with separate beginner/expert manifests. Derive availability from implemented content; preserve existing atlas and source destinations and same-mode returns. Document the primers' exact claim bindings.
3. Write a notation/version crosswalk for Parikh's normalization directions and objective sign; ByteNet's mask, offsets, repeated dilation, padding, width estimate and revision changes; ConvS2S's GLU, crop, layer-specific reads and positions; and the original Transformer's shifted inputs, three routes, post-normalization, head projections and source-specific versions. Any unresolved operation stays explanatory rather than numerical.
4. Independently review small authored fixtures: an asymmetric rectangular two-direction Parikh read and vanilla permutation invariant; corrected optional distance bias with its historical boundary; explicit convolution offset sets crossing a ByteNet dilation reset; width-estimate/EOS cases without inventing unspecified integer rounding; a ConvS2S layer read with distinct keys and values; all three Transformer masks with unequal source/target lengths, padding, and BOS/shift alignment; two distinct projected heads including the output projection; and a position/permutation comparison. Hand-set vectors do not demonstrate semantic inference, learned alignment or training improvements.
5. Preserve complete intermediate values and static counterparts. Test normalization axes, forbidden-key invariance, valid-row sums, signed contributions, shape failures, nonfinite inputs and empty/all-masked-row rejection. Do not compute softmax over all negative infinities. Enumerate graph reachability separately from receptive-field span, path length and attention weight. Global source reads must not be hidden by a decoder's smaller convolutional window.
6. Keep every empirical row static, version-bound and component-labelled. Add meaningful provenance, historical-variant and unavailable-route guards before marking anything built. Repeat existing source, no-JavaScript, keyboard, expanded axe, graphics-hidden, reduced-motion, forced-colors, print, 320/640/768/1440 layout, link and payload gates for each chapter.

After that contract passes, implement Parikh and its Cheng comparison first. Later stages remain planned until their own static, source and rendered gates pass. The optional route lens and all earlier atlas, recurrent and alignment enhancements retain independent learner-evidence gates.
