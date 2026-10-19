# Encoder-decoder alignment slice contract

The [third slice](third-vertical-slice.md) now has a complete [journey manifest](../data/journeys/encoder-decoder-alignment.json), a closed [fixture schema](../schemas/alignment-fixture.schema.json), six reviewed [arithmetic examples](../data/fixtures/encoder-decoder-alignment.json), and a pure [calculation engine](../src/lib/alignment-engine.ts). This closes the source/data gate. Cho, Sutskever, Bahdanau and Luong are available in both modes, with complete source records. The conditional-sequence prerequisite and both Graves bridges are built. Numerical local-p remains outside the admitted fixtures.

## Coverage and pedagogy

The four selected works have 65 claims, 21 versions, 35 unique attached sources and eight existing objectives. Every claim belongs to an expert teaching block; the shared evidence record exposes that complete inventory in both modes for each built chapter. Beginner blocks select prerequisite, prediction and explanation tasks. Expert blocks reconstruct operations, compare versions and audit experimental conditions. The inventory below maps each claim to its owning block; it does not claim a fresh full-paper revalidation.

| Stage | Beginner objective | Expert objective | Static treatment |
|---|---|---|---|
| Cho | `beginner-cho-2014-encode-score-and-gate` | `expert-cho-2014-versions-objective-and-evidence` | Source-summary interface, output score and reset comparison; complete canonical result ledger |
| Sutskever | `beginner-sutskever-2014-reverse-then-translate` | `expert-sutskever-2014-factorization-scale-and-results` | Early/late/mean slot gaps and separately labelled direct/rescoring ledgers |
| Bahdanau | `beginner-bahdanau-2014-follow-the-focus` | `expert-bahdanau-2014-attention-objective-and-evidence` | Both source reads, projected terms, normalizers and contributions; equal-score and equal-annotation safeguards |
| Luong | `beginner-luong-2015-global-local-and-history` | `expert-luong-2015-scores-windows-and-evidence` | Timing, score shapes, source support and input-feeding crosswalk; all component/metric conditions |

Estimated durations of 30/55 minutes are editorial planning estimates, not observed learner completion times. The [interaction brief](alignment-interaction.md) remains authoritative for the complete static counterpart and any later cursor comparison.

## Exact prerequisite bridges

1. **Conditional sequence prerequisite**, before Cho: `mikolov-2010-elman-recurrent-architecture`, `cho-2014-fixed-vector-architecture`, `cho-2014-conditional-objective`, and `cho-2014-generation-and-scoring`. Return to the built Mikolov chapter in the same mode. Introduce source/target lengths, supplied summary, target prefix, vocabulary normalization and EOS. The output-only fixture does not calculate an encoder or recurrent decoder.
2. **Graves formulation prerequisite**, before Sutskever: `graves-2013-lstm-formulation` and `sutskever-2014-graves-lstm-formulation`. Inventory input, forget and output gates and diagonal state-to-gate reads. Distinguish this cited later formulation from the original LSTM chapter; a citation cannot establish every target implementation detail. [Graves v5, pp. 4–5, Eqs. 7–11](https://arxiv.org/pdf/1308.0850v5) supplies the formulation and full-BPTT boundary. Return links to the built original-cell, forget-gate and peephole stages provide the historical prerequisite without transferring their training rules.
3. **Graves window comparison**, before Bahdanau: `graves-2013-monotonic-window-mechanism`, `graves-2013-window-terminology-boundary`, `graves-2013-window-equation-version-boundary`, and `bahdanau-2014-graves-monotonic-window-comparison`. Explain positive location increments, unnormalized character weights and reordering limits. Preserve earlier formula corrections; calculate neither a handwriting trace nor a local-p translation window. The comparison permits no causal derivation.

Each interlude declares its owning stage and work IDs. Source claims from another work cannot leak into a stage block. On implementation, native prerequisite anchors will return to their owner and mode. Planned stages have no generated paths, mode-switch destinations or dedicated references; available corpus evidence stays in the atlas. Existing learning routes retain their current destinations.

## Source notation and operation boundaries

| Role | Source notation and scope | Fixture operation |
|---|---|---|
| Conditional sequence | Cho `pθ(y∣x)` and mean log-likelihood, printed pp. 1725–1726; Sutskever product conditioned on `v` and target prefix, internal p. 3 | Vocabulary softmax at each observed prefix; multiply the selected factors including target EOS; compute negative log-likelihood. Scores and source summary are supplied independently. |
| Cho gates | `r` and `z` in main Eqs. 5–6; `z` weights old state in Eq. 7 | Sigmoid supplied gate preactivations. These stand for already-combined external/recurrent terms, not learned gate weights. |
| Cho candidate | Main Eq. 8: `tanh(external + U(r ⊙ h_previous))`; attachment encoder: `tanh(external + r ⊙ (U h_previous))` | Evaluate both separately using the same two-coordinate state and non-diagonal matrix. Do not infer which expression ran historically or splice the attachment decoder into this encoder example. |
| Cho state | `z ⊙ h_previous + (1−z) ⊙ candidate` | Show old and candidate contributions separately. Reset and update have different jobs; neither is a later LSTM forget gate. |
| Source reversal | Reversed source words; ordinary target order; proposed temporal-lag explanation in Sutskever §3.3 | Token-slot gaps along a concatenated teaching unrolling, with one source EOS slot. These are path distances, not gradients, empirical alignments or memory scores. |
| Bahdanau annotations | `h_j = [forward_j; backward_j]`; accepted v5 pp. 4, 13 | One supplied coordinate from each direction. No encoder recurrence or streaming claim; the entire source bank is available. |
| Bahdanau query/score | `e_ij = v_aᵀ tanh(W_a s_(i−1) + U_a h_j)`; v5 pp. 12–14 | One supplied prior-state coordinate, two scorer coordinates and two annotation coordinates. Preserve the separate alignment width in the detailed source form. Reuse projected annotations across steps. |
| Bahdanau weights/read | Source-position softmax; `c_i = Σ_j α_ij h_j` | Subtract the largest energy before exponentiation, retaining shifted exponentials and denominator. This exactly preserves mathematical weights. Signed contributions sum coordinatewise to a fixed-width context. |
| Bahdanau decoder/output | Stable main order: prior state → read → updated state → vocabulary output | No decoder gate update, maxout output, sampled token or trained state is evaluated. The separate conditional-output example is not a continuation of these attention states. |
| Luong timing | Current `h_t` → score → `c_t` → attentional `h̃_t` → target softmax | Static crosswalk only; do not reuse Bahdanau's prior-state query timing. |
| Luong score shapes | Dot needs equal state widths; general uses a bilinear map; corrected concat uses a concatenation projection and output vector; location scores do not inspect source content | Keep canonical malformed concat and v5 correction separately labelled. No score-family toggles share the Bahdanau calculator. |
| Luong local/input feeding | Local-m `p_t=t`; local-p predicts a real center and multiplies content weights by a Gaussian; previous `h̃_(t−1)` joins next target input | Static support/timing diagrams. No local numeric fixture, final normalization assumption, artificial coverage mask or translated-word certification. |

Primary reading copies: [Cho main](https://aclanthology.org/D14-1179.pdf), [Cho attachment](https://aclanthology.org/attachments/D14-1179.Attachment.pdf), [Sutskever proceedings](https://proceedings.neurips.cc/paper_files/paper/2014/file/5a18e133cbf9f257297f410bb7eca942-Paper.pdf), [Bahdanau accepted v5](https://arxiv.org/pdf/1409.0473v5), [Bahdanau canonical v7](https://arxiv.org/pdf/1409.0473v7), [Luong proceedings](https://aclanthology.org/D15-1166.pdf), and [Luong v5](https://arxiv.org/pdf/1508.04025v5).

Luong v5 §3.2 specifies ignoring the part of a window outside the sentence and admits integer positions around a real center. It still prints content normalization followed by Gaussian multiplication without an explicit final renormalization. Boundary clipping therefore has a source statement; operation order, integer support at transitions and historical implementation equivalence still need reconciliation before numbers are shown. Neither global softmax nor Graves's unnormalized window settles that question.

## Version crosswalk

All 21 version identities remain in the corpus. This table selects their teaching role; it does not flatten revisions into one corrected architecture.

| Work versions | Required separation |
|---|---|
| Cho arXiv v1 and v2 | Six-author preprints; earlier architecture/result details stay attached to their revision. |
| Cho arXiv v3 | Adds Bahdanau to the authors and changes the main reset placement. |
| Cho EMNLP | Canonical seven-author main paper; attachment retains its reset and embedding discrepancies. Main dimensions and the four canonical BLEU rows are not replaced by earlier tables. |
| Sutskever arXiv v1 | Explicit parallel-development statement and 380-million count. |
| Sutskever arXiv v2 | Revised evaluation comparison, 380-million count; parallel wording removed. |
| Sutskever arXiv v3 | Post-conference 384-million count and added state characterization. |
| Sutskever NIPS | Canonical 380-million proceedings PDF, internal folios; direct and rescoring tables remain separate. |
| Bahdanau arXiv v1, v2 and v3 | Mechanism and principal table are retained; anonymized Sutskever reference in v1 becomes named in v3. Presentation changes do not establish a new mechanism. |
| Bahdanau arXiv v4 | ICLR template and comparator name; detailed encoder/decoder terms change. |
| Bahdanau arXiv v5 | Accepted-paper snapshot and fixture score source; detailed decoder has mixed indices and a missing matrix. |
| Bahdanau arXiv v6 | Mostly post-output indexing, with remaining conditional/prose mismatch. |
| Bahdanau arXiv v7 | Canonical latest revision; several appendix terms repaired, separate state-index mismatch retained. No hybrid gate equation is calculated. |
| Luong arXiv v1 and v2 | First wording and next-day priority removal/boundary clarification are separate. |
| Luong arXiv v3 and v4 | Scope/evaluation and input-feeding wording evolve; changes do not supply a causal priority claim. |
| Luong arXiv v5 | Corrected concat, almost-everywhere qualification, extra hyperparameters and alignment appendix. |
| Luong EMNLP | Canonical ten-page article with its own equation numbers and omitted later corrections. |

Teaching order stays Cho → Sutskever → Bahdanau → Luong while posting order places Bahdanau before Sutskever. The four internal relationships are read from the corpus: Cho/Sutskever is editorial/prohibited; Cho/Bahdanau, Bahdanau/Luong and Sutskever/Luong are documented/qualified. Stage adjacency creates no new relationship. Reciprocal manuscript awareness supplies no additional directional edge.

## Independent arithmetic review

Expected values were evaluated with Python scalar arithmetic independently of the TypeScript engine and checked into the fixture. Tests compare every stored field to tolerance `1e−12`, before display rounding. Closed shapes and finite-value checks reject dropped coordinates, wrong axes, transplanted variants and inconsistent expected outputs. The serialized fixture is 12,198 bytes, within the existing 12 KiB limit; all values and input identities remain inspectable.

### Conditional target score

Three supplied vocabulary distributions over `X`, `Y`, EOS are `[.6,.2,.2]`, `[.1,.6,.3]` and `[.1,.1,.8]`. Observed prefixes are empty, `X`, then `X,Y`. The selected sequence probability is `.6 × .6 × .8 = .288`; negative log-likelihood is `1.244794798846`. No beam search or target-word choice is performed. Omitting EOS or changing an observed prefix fails validation.

### Cho reset placement

Previous state is `[.6,−.4]`, external term `[.2,−.1]`, recurrent matrix `[[1,2],[−.5,1]]`, reset `[.25,.75]` and update `[.8,.3]`. Sigmoid preactivations in the fixture recover those authored gates.

| Intermediate | Main equation | Attachment encoder |
|---|---|---|
| Recurrent term | `[−.45,−.375]` | `[−.05,−.525]` |
| Candidate preactivation | `[−.25,−.475]` | `[.15,−.625]` |
| Old-state contribution | `[.48,−.12]` | `[.48,−.12]` |
| Resulting state | `[.431016268,−.429561249]` | `[.509777007,−.508219806]` |

A scalar or diagonal matrix could hide the placement difference; this non-diagonal example exposes it. Supplied gates are teaching inputs, and no empirical gain is attributed to either expression.

### Source reversal

Source `A,B,C,D,EOS` and target `W,X,Y,Z,EOS` have declared pairs A/W, B/X, C/Y, D/Z. Count slots from zero: source token `i`, separator EOS at 4, first target at 5. Gaps are target slot minus source slot, the number of transitions between those slots. Forward gaps are `[5,5,5,5]`; reversed gaps are `[2,4,6,8]`; both means are 5. Early gaps shorten while late gaps lengthen. Target EOS is shown but is not an aligned pair.

The unchanged mean here depends on equal coverage of source positions. The engine also tests an early-only pair whose mean changes; it must not force arbitrary alignments to share a mean. The arithmetic is the paper's proposed explanation under a declared teaching convention, not a reconstruction of its measured training graph.

### Two Bahdanau reads and safeguards

Annotation stand-ins are A `[.4,−.2]`, B `[−.3,.6]` and C `[.8,.1]`. They concatenate supplied forward/backward coordinates; they are not learned word embeddings. Fixed matrices are `W=[[1],[−.5]]`, `U=[[1,.5],[−.25,1]]` and `v=[1.2,−.8]`. Two independently supplied prior states are `−.6` and `.7`; the second is not generated from the first read.

| Read | Source weights A/B/C | Context |
|---|---|---|
| First supplied prior state | `.329654847 / .134618818 / .535726335` | `[.520057361,.068412955]` |
| Second supplied prior state | `.404444483 / .164891901 / .430663616` | `[.456841116,.061112605]` |

The fixture retains projected query/annotation terms, preactivations, tanh values, energies, maximum shift, exponentials, denominator, weights and each signed contribution. Every read normalizes across its three source positions independently; each context coordinate equals its contribution sum and lies in that annotation coordinate's range. Negative coordinates do not mean negative probability.

Setting the score-output vector to zero yields equal energies, uniform thirds and context `[.3,1/6]` despite differing annotations. Making all annotations `[.4,−.2]` yields equal source energies within each step, uniform thirds and the same context at both steps; query changes may change the common energy but cannot fabricate different source weights. A common energy offset of 1,000 leaves weights unchanged without exponential overflow. Target-vocabulary softmax remains a different operation in a different fixture scenario.

## Implementation acceptance

- Before Cho routes: render the entire conditional-output and reset ledgers with synthetic scope beside the task. Add the complete fourteen-claim source record and all four canonical result rows; retain the main/attachment uncertainty. Distinct beginner prediction and expert equation/version audits must pass without JavaScript.
- Manifests stay planned until owning chapters pass static source, mode, keyboard, expanded-evidence axe, reduced-motion/graphics-hidden/print, four-width reflow, desktop/mobile visual and build/link/payload checks. Mode switching then retains stage; source/prerequisite returns retain mode and owner.
- Show the reversal explanation separately from empirical scores, the attention read separately from output prediction, and Luong support separately from unresolved weights. All later chapters retain their complete inventory and version-specific experimental conditions.
- No optional cursor, global diagram or filter promotion follows from these arithmetic tests. The existing learner-comparison and manual screen-reader gates remain open. No field-wide endpoint review or scientific corpus dates are renewed by this targeted source/fixture check.

## Complete claim-to-block inventory

The following tables use the current corpus evidence locators. Full statements, evidence support, uncertainty and source/version identities remain in the [corpus](../data/corpus.json) and atlas; future chapter source records must preserve them.

### Cho — 14 claims

| Claim ID | Owning expert block | Evidence locator(s) |
|---|---|---|
| `cho-2014-fixed-vector-architecture` | `expert-cho-objective` | Fixed-vector encoder and recurrent decoder, printed p. 1725 |
| `cho-2014-conditional-objective` | `expert-cho-objective` | Decoder conditionals and training criterion, printed pp. 1725–1726 |
| `cho-2014-generation-and-scoring` | `expert-cho-objective` | Two model uses and evaluated scoring path, printed pp. 1726–1727 |
| `cho-2014-reset-update-gates` | `expert-cho-reset-crosswalk` | Reset and update gate equations, printed p. 1726 |
| `cho-2014-ungated-evidence-boundary` | `expert-cho-evidence` | LSTM motivation and preliminary ungated observation, printed p. 1726 |
| `cho-2014-reset-equation-version-boundary` | `expert-cho-reset-crosswalk` | Archival candidate-state equation, printed p. 1726; Older attachment reset placement |
| `cho-2014-phrase-table-integration` | `expert-cho-conditions` | Unique-pair training and phrase-table feature integration, printed p. 1727 |
| `cho-2014-data-and-vocabulary` | `expert-cho-conditions` | Selected corpora, splits, and vocabulary, printed p. 1728 |
| `cho-2014-architecture-condition` | `expert-cho-conditions` | Evaluated encoder–decoder dimensions, printed pp. 1728–1729; Attachment embedding discrepancy |
| `cho-2014-training-condition` | `expert-cho-conditions` | Initialization and optimizer, printed p. 1729 |
| `cho-2014-bleu-results` | `expert-cho-table` | Complete canonical BLEU table, printed pp. 1729–1730 |
| `cho-2014-unknown-word-boundary` | `expert-cho-table` | Unknown-token aggregation and word penalty, printed p. 1730 |
| `cho-2014-qualitative-evidence` | `expert-cho-evidence` | Phrase examples and representation plots, printed pp. 1730–1732 |
| `cho-2014-fixed-vector-evidence-boundary` | `expert-cho-evidence` | Experimental scope and future sentence-level use, printed pp. 1727–1733 |

### Sutskever — 15 claims

| Claim ID | Owning expert block | Evidence locator(s) |
|---|---|---|
| `sutskever-2014-graves-lstm-formulation` | `expert-sutskever-formulation` | Implemented LSTM formulation and reference 10, article pp. 3 and 9 |
| `sutskever-2014-fixed-vector-factorization` | `expert-sutskever-formulation` | Fixed-vector conditional sequence model, article pp. 2–3 |
| `sutskever-2014-deep-two-lstm-architecture` | `expert-sutskever-formulation` | Separate deep LSTMs and depth observation, article pp. 2–5 |
| `sutskever-2014-data-and-vocabulary` | `expert-sutskever-scale` | Training data and fixed vocabularies, article p. 4 |
| `sutskever-2014-training-and-scale` | `expert-sutskever-scale` | Training recipe and implementation scale, article p. 5 |
| `sutskever-2014-beam-and-rescoring` | `expert-sutskever-ledgers` | Direct decoding and hybrid rescoring, article p. 4 |
| `sutskever-2014-reversal-intervention` | `expert-sutskever-distance` | Reversal intervention and corresponding direct rows, article pp. 4 and 6 |
| `sutskever-2014-reversal-explanation-boundary` | `expert-sutskever-distance` | Qualified minimum-lag account, article pp. 4–5 |
| `sutskever-2014-direct-results` | `expert-sutskever-ledgers` | Complete direct-decoding comparison, article pp. 5–6 |
| `sutskever-2014-rescoring-results` | `expert-sutskever-ledgers` | Complete SMT-combination and rescoring comparison, article p. 6 |
| `sutskever-2014-long-sentence-boundary` | `expert-sutskever-boundaries` | Length-stratified curve and examples, article pp. 6–7 |
| `sutskever-2014-representation-evidence` | `expert-sutskever-boundaries` | Qualitative phrase-state projection, article pp. 6–7 |
| `sutskever-2014-version-parameter-boundary` | `expert-sutskever-scale` | Canonical parameter count, article pp. 2 and 5; Post-conference v3 parameter wording, article pp. 2 and 5 |
| `sutskever-2014-cho-concurrency` | `expert-sutskever-history` | Version-1 parallel-development statements; Later related-work wording, article pp. 2–3 |
| `sutskever-2014-evidence-boundary` | `expert-sutskever-boundaries` | Complete evaluated system and reporting boundary, article pp. 3–8 |

### Bahdanau — 19 claims

| Claim ID | Owning expert block | Evidence locator(s) |
|---|---|---|
| `bahdanau-2014-graves-monotonic-window-comparison` | `expert-bahdanau-history` | Graves comparison in the first public revision, article p. 9; Retained Graves comparison in the canonical revision, article p. 8 |
| `bahdanau-2014-conditional-objective` | `expert-bahdanau-read` | Conditional sequence probability and decoder factorization, article pp. 2–3 |
| `bahdanau-2014-fixed-vector-bottleneck-hypothesis` | `expert-bahdanau-results` | Fixed-length-vector conjecture, article pp. 1–2 and 9 |
| `bahdanau-2014-cho-framework-extension` | `expert-bahdanau-order` | Named encoder–decoder framework, article p. 2; Gated unit and fixed-context equivalence, article pp. 12–14 |
| `bahdanau-2014-soft-attention-context` | `expert-bahdanau-read` | Step-specific weighted context and alignment softmax, article pp. 3–4; Implemented feedforward alignment score, article p. 12 |
| `bahdanau-2014-differentiable-soft-alignment` | `expert-bahdanau-read` | Differentiable alignment training, article p. 4; End-to-end learning summary, article p. 9 |
| `bahdanau-2014-bidirectional-annotations` | `expert-bahdanau-read` | Bidirectional encoder and annotation concatenation, article p. 4; Detailed bidirectional recurrence, article p. 13 |
| `bahdanau-2014-global-attention-cost` | `expert-bahdanau-read` | All-position weighted sum and computation boundary, article pp. 3 and 8 |
| `bahdanau-2014-equation-version-boundary` | `expert-bahdanau-order` | Main decoder convention and mixed version-5 appendix, article pp. 3 and 12–14; Version-6 post-output indexing and remaining mismatch, article pp. 12–14; Version-7 partial corrections and remaining mismatch, article pp. 12–14 |
| `bahdanau-2014-data-and-vocabulary` | `expert-bahdanau-conditions` | Parallel data selection, evaluation sets, and vocabularies, article pp. 4–5 |
| `bahdanau-2014-architecture-condition` | `expert-bahdanau-conditions` | Model dimensions and gated architecture, article pp. 5 and 14 |
| `bahdanau-2014-training-condition` | `expert-bahdanau-conditions` | Optimization and length-cap conditions, article p. 5; Exact update, epoch, and runtime rows, article pp. 14–15 |
| `bahdanau-2014-beam-search-boundary` | `expert-bahdanau-conditions` | Approximate conditional decoding, article p. 5 |
| `bahdanau-2014-bleu-results` | `expert-bahdanau-results` | Complete BLEU table and evaluation conditions, article p. 7 |
| `bahdanau-2014-length-results` | `expert-bahdanau-results` | BLEU-by-length curves and author interpretation, article pp. 5–6 |
| `bahdanau-2014-soft-alignment-interpretation-boundary` | `expert-bahdanau-interpretation` | Alignment-weight interpretation, article p. 4; Four qualitative alignment matrices, article pp. 6–7 |
| `bahdanau-2014-unknown-word-boundary` | `expert-bahdanau-results` | Shortlist and unknown-token setup, article p. 5; Rare-word limitation, article p. 9 |
| `bahdanau-2014-sutskever-cross-citation-boundary` | `expert-bahdanau-history` | Sutskever manuscript in first-post body and references, article pp. 1–2 and 12; Reciprocal Bahdanau citation in Sutskever version 1 |
| `bahdanau-2014-evidence-boundary` | `expert-bahdanau-interpretation` | Experiment, results, qualitative analyses, and limitations, article pp. 4–9 |

### Luong — 17 claims

| Claim ID | Owning expert block | Evidence locator(s) |
|---|---|---|
| `luong-2015-conditional-nmt-architecture` | `expert-luong-timing` | Baseline and attentional encoder–decoder, printed pp. 1413–1414 |
| `luong-2015-global-attention` | `expert-luong-timing` | Global alignment, context, and output path, printed pp. 1414–1415 |
| `luong-2015-attention-score-family` | `expert-luong-forms` | Location, dot, general, and proceedings concat displays, printed pp. 1414–1415; Corrected concat score, article p. 3 |
| `luong-2015-local-attention` | `expert-luong-forms` | Local window, local-m, local-p, and Gaussian weighting, printed pp. 1415–1416; ArXiv-version-5 local-p qualification, article p. 4 |
| `luong-2015-input-feeding` | `expert-luong-timing` | Input-feeding architecture and coverage motivation, printed p. 1416; Explicit concatenation and doubled first-layer input, article p. 5 |
| `luong-2015-bahdanau-extension` | `expert-luong-timing` | Bahdanau comparison and global/local generalization, printed pp. 1414–1416 |
| `luong-2015-sutskever-architecture-and-reversal` | `expert-luong-timing` | Sutskever architecture and source reversal, printed pp. 1413, 1416–1417 |
| `luong-2015-data-and-evaluation` | `expert-luong-conditions` | Data, filtering, vocabularies, test sets, and metric scripts, printed pp. 1416–1417 |
| `luong-2015-training-regime` | `expert-luong-conditions` | Model size and optimization schedule, printed pp. 1416–1417; Added dropout and local-window hyperparameters, article pp. 5–6 |
| `luong-2015-english-german-results` | `expert-luong-tables` | English-to-German component ladder, printed p. 1417 |
| `luong-2015-wmt15-ensemble-result` | `expert-luong-tables` | WMT’15 NIST BLEU comparison, printed p. 1417 |
| `luong-2015-german-english-results` | `expert-luong-tables` | German-to-English results and non-SOTA boundary, printed p. 1418 |
| `luong-2015-attention-architecture-results` | `expert-luong-tables` | Global/local score sweep, printed p. 1419 |
| `luong-2015-long-sentence-boundary` | `expert-luong-boundaries` | Length-bucket plot and interpretation, printed pp. 1418–1419 |
| `luong-2015-alignment-evaluation` | `expert-luong-boundaries` | Alignment extraction protocol and AER table, printed pp. 1419–1420 |
| `luong-2015-version-boundary` | `expert-luong-forms` | Canonical equation, local, training, and ten-page scope, printed pp. 1412–1421; ArXiv-version-5 corrections and appendix, article pp. 3–11 |
| `luong-2015-evidence-boundary` | `expert-luong-boundaries` | Experimental setup, results, and analysis scope, printed pp. 1416–1420 |

Operation and formulation sources were inspected on 14 October 2026 for this contract. Existing corpus claim/source dates remain unchanged: this review did not re-audit every experiment, every revision or the current endpoint.


## First chapter implementation

The chooser and separate mode previews lead to Cho’s static chapter. Beginner tasks predict a phrase score, explain reset versus carry, and identify the evaluated system. Expert tasks reconstruct logits/normalizers and both reset placements, compare source revisions and dimensions, and audit all experimental conditions. Both retain every synthetic input and computed term through native disclosures, both reset alternatives, all four development/test BLEU rows, and the complete work reference. The conditional prerequisite returns to Mikolov in the same mode; the existing Mikolov work reference keeps its own chapter destination. Stages still marked planned receive no generated chapter or dedicated reference. Atlas availability follows the built manifest.

The attachment locators for the reset and embedding discrepancies were corrected to §1.1 Encoder after a targeted primary-source recheck on 15 October 2026. The source-summary claim also gains the attachment’s terminal-state projection, so three claim dates and two source access dates are renewed. The corpus `asOf` is the upper bound of targeted checks; it does not renew the remaining claims or the endpoint survey.

The chapter adds no hydration. Build audits enforce zero alignment client JavaScript and a 512 KiB compressed HTML ceiling. Browser acceptance covers static calculations with JavaScript disabled, native checkpoint/evidence activation, keyboard equation scrolling, all six new routes with disclosures expanded under axe, graphics-hidden/reduced-motion/forced-colors, closed-disclosure print, and 1440/768/640/320 reflow including numeric cells. These technical checks do not establish a learner advantage or replace a human screen-reader study.


## Fixed-summary generation chapter

The second chapter implements Sutskever, Vinyals and Le in both modes, with the owning Graves-formulation prerequisite. The shared source-reversal fixture preserves original token identities, a separate source EOS slot, ordinary target order, all four pair gaps and both means. A one-pair counterexample prevents the unchanged mean in the complete example from becoming a universal claim. This is authored slot arithmetic, independent of the empirical reversal results and proposed gradient explanation.

Beginner tasks predict which early and late pairs move closer, identify the candidate source behind 36.5 BLEU, and explain which later LSTM mechanisms a citation identifies. Expert tasks derive the factorization and slot arithmetic, audit the cited gate equations and training boundary, and compare every direct and rescoring result under its full conditions. Both modes retain complete numerical ledgers, all eight Table 1 rows, all seven Table 2 rows, native checkpoints and fifteen source-located claims. Graves's complete reference returns to its formulation prerequisite in the selected mode; the handwriting-window comparison is separately owned by the learned-alignment chapter.

The design follows the existing research-ledger system. Its organizing device is the stable token identity: source order changes while pair labels and target order remain fixed. The chapter header and task lead into source formulation and measured evidence; a parallel arithmetic ledger exposes cause and response. Below it, paired candidate-origin paths precede the two complete result tables. Existing paper, ink, rust, mono numerals, rules and type roles remain the visual vocabulary. No new imagery or motion is needed. Below the existing chapter breakpoint the ledger follows the reading column; the two pipeline paths stack on narrow screens. Native disclosures preserve prediction-before-answer, keyboard inspection and print access.

The chapter preserves the 25.9/30.6 prose scores separately from 26.17/30.59 table scores, the 380-million proceedings count separately from v3's 384-million count, and v1's explicit parallel-development wording separately from the later citation. Direct generation uses approximate beam search; the 1,000-best path retains phrase-based candidate origin and the specified even score average. The list oracle is reference-informed and not an attainable decoder score. No unspecified ensemble-combination formula, length normalization, modern state tuple or implementation detail is filled in.

Primary rechecks on 17 October 2026 covered the [proceedings PDF](https://proceedings.neurips.cc/paper_files/paper/2014/file/5a18e133cbf9f257297f410bb7eca942-Paper.pdf), [first preprint](https://arxiv.org/pdf/1409.3215v1), [third preprint](https://arxiv.org/pdf/1409.3215v3) and [Graves v5](https://arxiv.org/pdf/1308.0850v5). These targeted checks support the chapter crosswalk; they do not renew field-wide endpoint coverage or every corpus claim/source date. Scientific corpus records and qualified lineage are unchanged.

Acceptance requires the same no-JavaScript, source/owner/mode continuity, keyboard equation scrolling, expanded-evidence axe, graphics-hidden, reduced-motion, forced-color, closed-disclosure print, four-width numeric reflow, rendered desktop/mobile and payload gates as the first chapter. Static calculations and technical checks supply no measured learning advantage. Optional cursor promotion and human learner/screen-reader evaluation retain their separate gates.

## Learned-alignment chapter

The third chapter implements Bahdanau, Cho and Bengio in both modes, including its owning Graves handwriting-window comparison. The main source-read calculation uses v5's additive scorer and stable main-text abstraction. Both prior decoder states, prefixes, annotations and scorer parameters are supplied teaching inputs. Neither recurrent state update nor target-vocabulary output is evaluated. The second prior state must never be presented as a generated successor of the first read.

Beginner tasks predict what stays fixed across reads, build one signed context and distinguish source shares from word probabilities. Expert tasks reconstruct projected terms, energies, the stable denominator and coordinate sums, then audit source timing, opposite update-gate conventions and appendix conflicts. Complete source banks, both read ledgers, both safeguards, all scorer intermediates and original inputs/unrounded expected values remain accessible through native disclosures in both modes. The equal-energy case changes only the score vector to zero; the identical-annotation case changes only the bank. The latter also produces equal energies within a read, so it cannot show fabricated differing source weights. Common-offset invariance is an additional static expert check.

The design adapts the established paper-and-ink research ledger. Its organizing device is a stable source row: identity, annotation and signed coordinates remain in place while the supplied state changes the read. Quiet rust bars duplicate printed weights; teal result rows mark the summed context. The reading/ledger columns retain the existing chapter geometry; lower safeguards and evidence comparisons share the full page width and stack below the existing breakpoint. No imagery, animation, additional client controls or hydration are required. Removing the bars leaves the numerical task complete. All captions name the case and read so the linear and screen-reader paths distinguish repeated tables. Original-value disclosures wrap at narrow widths and remain available in print.

The source record retains all nineteen claims. The chapter includes every canonical Table 1 All/No UNK row and all five Table 2 training durations. It preserves the filtered subset, disallowed unknown outputs, unknown subset size, 30/50-word training caps, longer-trained starred run, unmatched architecture/capacity and monolingual-data conditions. The length figure remains descriptive, the four alignment matrices qualitative, and the bottleneck a conjecture. No recreated figure, fabricated BLEU curve or causal component ranking is supplied.

The Graves comparison follows v5 Eqs. 46–51: positive Gaussian amplitudes/width parameters and cumulative positive center increments, with unnormalized character weights. Moving centers are distinct from every individual character weight or the mixture maximum. Graves's source terminology and the earlier derivative revisions stay separate; the later corrections do not move into v1. The dedicated Graves record retains its original formulation return and gains an additional window-comparison return in each mode. Additional source contexts are derived from built interludes without replacing a work's own chapter.

Targeted primary rechecks on 18 October 2026 covered [Bahdanau v5](https://arxiv.org/pdf/1409.0473v5), [v6](https://arxiv.org/pdf/1409.0473v6) and [canonical v7](https://arxiv.org/pdf/1409.0473v7), especially main §§3–5 and appendices A–B; [Bahdanau v1](https://arxiv.org/pdf/1409.0473v1), pp. 1–2, 9 and 12; [Sutskever v1](https://arxiv.org/pdf/1409.3215v1), pp. 2–3 and 9; and [Graves v5](https://arxiv.org/pdf/1308.0850v5), pp. 26–29, with derivative comparisons against [v3](https://arxiv.org/pdf/1308.0850v3) and [v4](https://arxiv.org/pdf/1308.0850v4), p. 29. Reciprocal manuscript awareness establishes no conception order or directed causal edge. These checks do not renew the scientific corpus's dates, all revisions or field-wide endpoint coverage.

Acceptance retains JavaScript-off calculation access, owning-stage and mode returns, native keyboard and equation scrolling, all nineteen claim bindings, expanded-evidence axe, graphics-hidden/reduced-motion/forced-colors, closed-disclosure print, numeric-cell/raw-value reflow at 1440/768/640/320, manual rendered review and build/link/payload checks. Static success supplies no measured learner benefit or human screen-reader study. Numerical local-p remains unadmitted, and the optional attention cursor retains its separate comparison and learner gates.

## Luong static teaching treatment

The fourth chapter completes the selected sequence in both modes. Beginner tasks predict what a local window can omit, identify which attentional summary reaches the next step, distinguish content from location scoring, and qualify the five-BLEU comparison. Expert tasks reconstruct scalar score shapes, current-state order, the doubled first-layer input, source normalization limits, version-specific formulas and alignment-link timing. Both retain all seventeen claims, complete source disclosures and same-mode chapter/reference/atlas returns.

The workbench is a symbolic operation crosswalk: fixed-summary access, global support, local-m's target-index center, and local-p's predicted real center and Gaussian multiplier. A native reveal checks the mode's prediction or audit. No controls, numerical local-p fixture, generated state, gradient or translation are supplied. Static text is sufficient for these distinctions; introducing adjustable windows would require settled numeric conventions and its own learning-value case.

The result record retains all twelve Table 1 rows, two Table 2 rows, seven Table 3 rows, seven Table 4 rows, three concat perplexities from footnote 15, and five Table 6 AER rows. Missing perplexities, failed local-m/dot BLEU entries and unreported concat BLEU stay explicit. Table 4's local-p/dot endpoints are 18.0/19.6 but its printed gain is +1.9; the chapter preserves that disagreement. Table 3's caption does not independently name its BLEU script or test filename. It stays under its reported WMT'15 German-to-English condition without an invented script identity. Footnote 14's predicted-word versus input-word extraction convention remains separate from the model's prediction timing.

Targeted source check, accessed 19 October 2026: [proceedings](https://aclanthology.org/D15-1166.pdf), printed pp. 1413–1419; [arXiv v5](https://arxiv.org/pdf/1508.04025v5), article pp. 3–8 and Appendix A; and [official project page](https://nlp.stanford.edu/projects/nmt/). The Table 2 evidence locator is corrected to printed p. 1417. Four existing claim records gain the locator, printed-gain or metric/extraction qualifications; two full-text access dates and the corpus's targeted-check date are renewed. Counts, chronology, relationships and field-wide endpoint coverage are unchanged.

The project page links to a later [official codebase](https://github.com/lmthang/nmt.hybrid). At inspected commit `50d5c025f18ed280ff0fd2e2adce327f4170a2c3`, [attnLayerForward.m, lines 15–66](https://github.com/lmthang/nmt.hybrid/blob/50d5c025f18ed280ff0fd2e2adce327f4170a2c3/code/layers/attnLayerForward.m#L15-L66) floors the predicted center and distinguishes normalize-then-distance weighting from an option explicitly labelled post-EMNLP'15. This later snapshot is implementation context, not an immutable reconstruction of the paper's runs. Source-index reversal, padding/masks, center transitions and historical correspondence still need a separate audit before numerical local-p can be admitted. In v5 footnote 15, the concat source block is fixed to identity and the proposed explanation for poor perplexity is tentative; this does not rank every possible concat network.

The layout extends the existing archival reading/workbench system: paper/ink tokens, numbered operation paths, monospace values, native disclosures and source locators. No new imagery, motion or client dependency is needed. Acceptance covers all source/result bindings, no-JavaScript paths, distinct mode checkpoints, keyboard/equation access, expanded-evidence axe, graphics-hidden/reduced-motion/forced-colors, closed-disclosure print, four-width numeric reflow, rendered desktop/mobile review, links and zero alignment client JavaScript. These technical gates establish no measured learning advantage or human screen-reader result. Optional attention, recurrent and atlas enhancements keep their independent learner gates.
