# Third vertical slice on encoder decoders and learned alignment

## Selected sequence

The third journey will explain how next-word prediction becomes source-conditioned sequence prediction, how two parallel fixed-vector systems use that interface differently, and how recurrent attention adds a fresh source read at each target step. It contains Cho et al. 2014, Sutskever–Vinyals–Le 2014, Bahdanau–Cho–Bengio 2014/2015, and Luong–Pham–Manning 2015. The existing recurrent journey supplies the state and word-probability prerequisites.

Teaching order is Cho, Sutskever, Bahdanau, then Luong. This is an editorial prerequisite order. The public posting order is Cho on 3 June 2014, Bahdanau on 1 September, Sutskever on 10 September, and Luong on 17 August 2015. Posting dates do not establish private development order. The first Sutskever manuscript explicitly describes parallel development with Cho. [Cho record](https://arxiv.org/abs/1406.1078), [Bahdanau record](https://arxiv.org/abs/1409.0473), [Sutskever version 1](https://arxiv.org/pdf/1409.3215v1), [Luong record](https://arxiv.org/abs/1508.04025).

This decision establishes scope and pedagogy. All four works have inline atlas records and a complete manifest and reviewed arithmetic in the [source/fixture contract](alignment-slice-contract.md). Cho now has beginner/expert teaching routes, the conditional prerequisite and a fourteen-claim dedicated work page; the later three stages and two Graves bridges remain queued. The [alignment interaction brief](alignment-interaction.md) defines the static treatment and one conditional enhancement.

## Candidate comparison

Counts derive from the admitted [corpus](../data/corpus.json), including target-side lineage claims. Sources count unique IDs attached to the selected works. They describe the inspection surface, not evidence quality.

| Work | Versions | Sources | Claims | Teaching contribution | Main prerequisite or boundary |
|---|---:|---:|---:|---|---|
| Cho | 4 | 8 | 14 | Fixed source summary, conditional sequence score, reset/update recurrence | Introduce conditional likelihood and phrase-table features; retain the main-paper/attachment reset discrepancy |
| Sutskever | 4 | 9 | 15 | Deep-LSTM direct generation, source reversal, separate rescoring path | Reuse recurrent word prediction; supply a bounded Graves formulation bridge rather than assuming the earlier LSTM chapter is its exact cell |
| Bahdanau | 7 | 10 | 19 | Bidirectional annotations, decoder-conditioned soft retrieval, bottleneck hypothesis | Teach weighted sums and source-position normalization; preserve competing decoder-index conventions |
| Luong | 6 | 9 | 17 | Global/local reads, score families, attentional input feeding | Distinguish current-state scoring from Bahdanau's prior-state scoring; keep later corrections version-labelled |
| **Selected total** | **21** | **35** | **65** | Four works, eight existing mode objectives | Four internal relationships, with independent causal permissions |

The two-work Cho/Bahdanau alternative is smaller but omits the successful fixed-vector direct-translation branch and leaves Luong's LSTM substrate unexplained. A three-work treatment ending at Bahdanau supplies the key retrieval idea, but Luong adds a bounded test of what changes when source coverage, score choice and alignment history differ. The four-work sequence therefore earns its extra scope through explicit learner tasks.

The broader ten-work attention/convergence candidate in the [second-slice comparison](second-vertical-slice.md#readiness-comparison) remains deferred. External-memory hops, intra-attention, recurrence-free comparison, convolutions, positional representations and the Transformer each introduce a new learning job. They should enter later slices through their own evidence rather than turn this journey into a compressed list of predecessors.

## Prerequisite bridge

Beginner mode starts with the Mikolov chapter's normalized next-word prediction and asks what changes when a target prefix also depends on a source sentence. A short primer explains a source–target pair, potentially different sequence lengths, an end symbol, generation versus scoring, and a weighted average. It uses a labelled arithmetic example, not a purported translation model.

Expert mode starts from conditional autoregressive factorization and then separates training on observed prefixes from approximate decoding over generated prefixes. A beam-search explanation must distinguish search error from the objective; a rescoring explanation must identify the candidate system. Both modes link to recurrent state, original gating and normalized prediction, without requiring the entire smoothing journey.

Graves 2013 is a bounded source/formulation bridge. Sutskever explicitly names its LSTM formulation, while Bahdanau compares its monotonic handwriting window with translation that may reorder the source. The target's citation does not transfer the handwriting window into Sutskever's architecture. The Graves/Bahdanau comparison prohibits a causal claim. Its source-only primer can precede a dedicated Graves teaching chapter. Claim bindings: `sutskever-2014-graves-lstm-formulation` and `bahdanau-2014-graves-monotonic-window-comparison`.

## Two learning paths

The shared question is: **What information can the decoder use to predict its next target word, and what does the experiment actually test?**

| Stage | Beginner task and success | Expert task and success | Existing objective IDs |
|---|---|---|---|
| Cho | Trace source → one summary → target score; explain why a phrase-table feature is not a standalone sentence translator. Identify which part of previous state each gate affects. | Reconstruct conditional likelihood and the main-paper reset/update equations; distinguish scoring from generation and keep version-specific tables separate. | `beginner-cho-2014-encode-score-and-gate`; `expert-cho-2014-versions-objective-and-evidence` |
| Sutskever | Compare forward and source-reversed unrollings; identify direct generation versus reranking supplied candidates. Explain why reversal need not shorten every path. | Derive EOS-terminated likelihood; audit the reversal argument, beam/ensemble conditions and proceedings/preprint parameter disagreement. | `beginner-sutskever-2014-reverse-then-translate`; `expert-sutskever-2014-factorization-scale-and-results` |
| Bahdanau | Predict whether a new target step must reread the same source mixture; form one weighted context and explain why a highlighted position is not a verified word alignment. | Reconstruct energy → source softmax → context, then audit bidirectionality, decoder order, version conflicts and the experiment's changing capacity. | `beginner-bahdanau-2014-follow-the-focus`; `expert-bahdanau-2014-attention-objective-and-evidence` |
| Luong | Compare full-source support with a local neighborhood; trace the previous attentional summary into the next decoder input. Explain what a local window can omit. | Compare score shapes, current-state timing, local-m/local-p and input feeding; preserve canonical versus corrected formulas and separate BLEU from alignment error rate. | `beginner-luong-2015-global-local-and-history`; `expert-luong-2015-scores-windows-and-evidence` |

Beginner chapters use prerequisite checks, concrete predictions and explanation reveals. Expert chapters use equation reconstruction, source-version selection and experimental audits. Mode switching retains the work/stage, but changes the task and representation. Both paths retain the same dates, source scope and uncertainty. More paragraphs alone do not satisfy the mode contract.

## Qualified lineage

| Relationship ID | Permitted reading | Required boundary |
|---|---|---|
| `cho-2014-to-sutskever-2014` | Editorial conceptual parallel | Causal language prohibited; public display direction is not an influence arrow |
| `cho-2014-to-bahdanau-2014` | Documented framework extension | Preserve the opposite update-gate label convention; do not transfer Cho's phrase-table experiment |
| `bahdanau-2014-to-luong-2015` | Documented recurrent-attention extension | Luong's local branch also names other inspiration; this edge does not establish Transformer adoption |
| `sutskever-2014-to-luong-2015` | Documented stacked-LSTM/reversal substrate | Attention, local windows and input feeding are not attributed to Sutskever |

All four complete evidence records remain in the corpus and shared atlas register. Bahdanau's earlier public posting and reciprocal manuscript awareness do not justify a directional Sutskever/Bahdanau edge. The teaching order must never generate new lineage records automatically.

## Source and experiment boundaries

Cho's canonical equations and experiment use printed pp. 1725–1730 of the [EMNLP article](https://aclanthology.org/D14-1179.pdf). Its reset vector is applied before the recurrent matrix in main Eq. 8; the [official attachment](https://aclanthology.org/attachments/D14-1179.Attachment.pdf) preserves a different placement. The experiment adds phrase-pair scores to an existing translator. Its strongest row also adds a separate continuous-space language model. A fixed-dimensional representation is an architectural constraint; this paper has no sentence-length experiment proving a bottleneck failure.

Sutskever's [NIPS article](https://proceedings.neurips.cc/paper_files/paper/2014/file/5a18e133cbf9f257297f410bb7eca942-Paper.pdf), internal pp. 3–6, separates direct decoding from 1,000-best rescoring. The 34.81 and 36.5 headline scores each use five reversed-source models in different pipelines. Section 3.3 leaves the reversal explanation incomplete and says average aligned-word distance is unchanged. The reversal diagram may expose early short paths; it cannot imply a measured gradient or a universal memory cure. Its full result ledgers must retain the prose/table discrepancy rather than average it away.

Bahdanau's [version 5](https://arxiv.org/pdf/1409.0473v5) and [canonical version 7](https://arxiv.org/pdf/1409.0473v7), pp. 3–7 and 12–14, support the weighted read and its version audit. The safe teaching abstraction follows the stable main-text order: prior decoder state → alignment → context → updated state → output. It does not splice inconsistent appendices into an unprinted gate-level decoder. The bottleneck is a conjecture; attention, bidirectionality and capacity change together. Table 1's All/No UNK conditions and longer-trained starred run stay separate. Figure 3 supplies qualitative matrices, not a gold alignment benchmark.

Luong's [EMNLP article](https://aclanthology.org/D15-1166.pdf), pp. 1414–1419, supplies global/local reads, input feeding and the experiment; [arXiv version 5](https://arxiv.org/pdf/1508.04025v5), pp. 3–5, supplies the corrected concat form and later local-p qualification. Keep version-specific equation numbers, hyperparameters and metric conventions visible. Local-p's printed Gaussian multiplier does not explicitly add a final renormalization step. A future calculation must state which source operation it reproduces and resolve support/boundary handling before a local fixture is admitted. Global normalization must not silently become a rule for every attention mechanism.

These primary passages and public chronology records were accessed on 13 October 2026. This is a targeted design recheck; it does not renew the [field coverage review](current-endpoint.md). The corpus records and checked dates remain unchanged until claim-level editorial reconciliation.

## Implementation gate

Before routes or controls, complete one source-bound slice contract with:

1. All 65 selected-work claims and eight objectives, plus the exact recurrent, conditional-probability and Graves bridges, assigned to narrative, equations, result ledgers or source records. No objective-only subset substitutes for the complete inventory.
2. Separate beginner/expert manifests with four planned stages, honest availability, mode continuity and return links. No proposed route is advertised as built.
3. A notation crosswalk for Cho's reset placement and gate convention, Sutskever's source-order convention, Bahdanau's stable abstraction versus appendix conflicts, and Luong's timing, scores and local support. Unresolved operations stay static.
4. Reviewed synthetic arithmetic and expected outputs for the static comparisons. Label hand-set states/parameters, keep original token identities, and specify exact reversal-distance counting. For Bahdanau, bind source annotations, prior-state inputs, additive scores, normalized weights and context contributions without inventing a trained translation trace.
5. Meaningful fixture/adapter guards for normalization axes, shapes, historical variants, provenance, qualified lineage and unavailable destinations. Define complete no-JavaScript equivalents before any optional hydration.

The [source/fixture contract](alignment-slice-contract.md) closes this gate with a complete 65-claim/eight-objective manifest, three scoped prerequisite bridges, six independently checked arithmetic cases, closed schema and pre-generation guards. Luong remains a static operation/support crosswalk. Cho now implements the first chapter in both modes. Each later stage must pass source binding, equivalent static coverage, keyboard/axe, reduced-motion/graphics-hidden, 320/640 reflow, desktop/mobile visual inspection and link/payload checks. The optional alignment cursor has its own learner-comparison gate. The existing atlas studies remain available with their separate evaluation boundaries.
