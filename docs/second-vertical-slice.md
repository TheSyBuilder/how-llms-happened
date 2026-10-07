# Second vertical slice: recurrent state to gated word models

## Decision

The next implemented sequence will explain how recurrent networks began carrying state through a sequence, why distant temporal credit remained difficult, how gated cells protected and selectively reset memory, and how the recurrent-state and neural-word-probability branches converged in language modeling.

The bounded sequence contains six works:

1. Elman 1988/1990 — copied hidden state makes the current representation depend on prior inputs;
2. Hochreiter and Schmidhuber 1995/1997 — a protected cell path plus input and output gates addresses unstable long-delay credit;
3. Gers, Schmidhuber, and Cummins 1999/2000 — a learned forget gate replaces fixed retention for continual streams;
4. Gers, Schraudolph, and Schmidhuber 2002 — peephole links let gates inspect protected cell state;
5. Mikolov et al. 2010 — Elman-style recurrence joins normalized word prediction at speech-recognition scale;
6. Sundermeyer, Schlüter, and Ney 2012 — a composite LSTM cell joins word-level prediction and Kneser–Ney interpolation.

Bengio et al. 2000/2003 is a required prerequisite bridge, not a seventh stage. It supplies the fixed-window neural probability model that Mikolov explicitly addresses. The bridge must keep Bengio's static word vectors, finite context, and normalized softmax separate from Elman's context-dependent recurrent state and unnormalized outputs.

This selection does not claim that these six works are the whole recurrent-network history. It is the minimum source-backed path needed to explain carried state, temporal credit, protected memory, adaptive retention, state visibility, and the later word-model convergence without projecting a modern LSTM cell backward into the original paper.

## Readiness comparison

The comparison uses the complete, already audited corpus. Counts cover the selected works themselves; prerequisites and incoming relationships are considered separately.

| Candidate branch | Audited scope | Prerequisite load | Cause-and-effect teaching opportunity | Mode split and evidence readiness | Decision |
|---|---:|---|---|---|---|
| Recurrent memory | 6 works, 11 versions, 33 sources, 62 claims, 8 internal relationships | Medium: basic neural layers, sequence prediction, and the Bengio fixed-window bridge | Strong: carried state, temporal derivatives, protected paths, retention, reset, and state visibility can be observed one change at a time | Strong: beginner state tracing and expert derivative/equation audits are already grounded by twelve objectives | **Selected** |
| Attention and architectural convergence | 10 works, 52 versions, 93 sources, 168 claims, 16 internal relationships | High: gated recurrence, encoder–decoder likelihood, alignment, external memory, convolution, and positions | Strong, but several distinct mechanisms would compete for the learner's attention in one slice | Strong evidence, but the branch needs subdivision before it becomes a bounded journey | Defer until recurrent prerequisites exist |
| Contextual transfer | 7 works, 23 versions, 69 sources, 114 claims, 8 internal relationships | High: LSTM, Transformer, causal and masked objectives, feature transfer, and full-model adaptation | Moderate: objective and adaptation choices matter, but many reported differences are static, confounded evidence rather than safe controls | Strong source coverage; the beginner path would otherwise inherit too many unexplained architectures | Defer until recurrent and Transformer journeys exist |
| Retrieval augmentation | 5 works, 17 versions, 65 sources, 80 claims, 4 internal relationships | High: BERT, dual encoders, latent variables, BART, marginalization, and frozen indexes | Strong: retrieval, index refresh, document choice, and generation can be linked, but only with careful model and corpus boundaries | Strong source coverage; expert reconstruction is ready, while beginner prerequisites are not | Defer until representation and Transformer prerequisites exist |
| Post-training | 6 works, 25 versions, 89 sources, 91 claims, 5 internal relationships | Very high: pretrained Transformers, instruction tuning, preference data, reward models, PPO, DPO, and reinforcement learning | Mixed: optimization paths can be contrasted, but interactive empirical or preference controls could imply unsupported comparability or normative consensus | Strong evidence, but it is a late-history synthesis rather than the next explanatory bridge | Defer until pretraining and scaling foundations exist |

Source count means unique source IDs attached to the works in each candidate. A larger count is not a quality score; it estimates the evidence and version surface that a coherent implementation must expose.

## Narrative structure

The sequence has two lanes that converge rather than one uninterrupted invention story.

**State-to-word-model lane:** Elman demonstrates task-dependent carried state; Bengio supplies the normalized fixed-window probability-model bridge; Mikolov combines Elman-style recurrence with normalized next-word prediction.

**Protected-memory lane:** Hochreiter and Schmidhuber introduce the constant-error cell with input and output gates; Gers and colleagues add adaptive forgetting; Gers, Schraudolph, and Schmidhuber add state-to-gate peepholes.

Sundermeyer joins the two lanes in a word-level LSTM language model. Its cell is composite, so the three incoming cell-mechanism relationships must remain separately inspectable. Its strongest speech-recognition result also interpolates the LSTM model with a much larger Kneser–Ney model; that connection should bridge back to the completed smoothing journey rather than imply that the neural model replaces smoothing in the reported system.

## Beginner and expert paths

The beginner path will ask: **What must a network carry, protect, forget, and expose to use earlier words?** It will trace one small sequence, distinguish activation memory from learned weights, and introduce one historical mechanism at a time. A learner succeeds by explaining why the same current token can have a different state after a different history; why the original protected cell has no forget gate; why retention and state visibility are separate changes; and what changes when recurrent state becomes a normalized word model.

The expert path will ask: **Which temporal path, derivative, gate equation, and training rule changes at each stage?** It will preserve source-specific notation, distinguish forward activation from backward credit, identify every truncation boundary, and audit the synthetic-task and language-model evidence separately. A learner succeeds by reconstructing the relevant equations, locating the protected derivative path, distinguishing the 1995/1997, 1999/2000, 2002, and 2012 cell variants, and explaining the evidence limits of the convergence claim.

These are different tasks, not expanded and collapsed versions of the same page. They share chronology, claim IDs, relationship evidence, and limitations while using different prerequisites, checkpoints, representations, and success criteria.

## Interaction boundary

The follow-up [recurrent-memory interaction brief](recurrent-memory-interaction.md) accepts one bounded state-and-credit trace for prototyping. The trace uses reviewed synthetic sequences to help a learner distinguish:

- the value carried forward from the error signal assigned backward;
- fixed retention from learned forgetting;
- a gate reading cell state from a gate controlling cell retention;
- an unnormalized recurrent prediction vector from a normalized word distribution.

The accepted brief binds the interaction to exact claims and objectives, defines a linked static competitor, and sets keyboard, screen-reader, reduced-motion, no-JavaScript, mobile, performance, and misconception tests. The interaction remains provisional: if learner testing does not improve the three named distinctions over the complete static treatment, the client interaction is removed. It must not present a modern unified LSTM equation as though every term appeared in the original cell.

Empirical results remain static and source-conditioned. The interface must not offer controls that blend generated sequence tasks, Penn Treebank language modeling, speech-recognition rescoring, or modern training conventions into a false shared experiment.

## Implementation gate

The [recurrent-memory slice contract](recurrent-slice-contract.md) closes the remaining design-and-data gate. It supplies the complete claim and objective inventory, source-notation crosswalk, exact Bengio prerequisite, smoothing bridge, a sub-8-KiB schema-validated fixture with reviewed expected traces, separate mode manifests, static fallback requirements, and variant-leakage, accessibility, responsive, payload, and rendered-quality tests.

No route or interactive control was added while closing the gate. Implementation may now begin with the shared recurrent journey shell and Elman in both modes. The complete no-JavaScript same-token treatment must land before hydration, and the other stages plus both static interludes remain planned until each source-dated boundary passes equivalent review. The attention, contextual-transfer, retrieval, and post-training branches remain valid later candidates; their deferral is a sequencing decision, not an importance judgment.

## First implementation increment

The shared recurrent journey chooser and two mode previews now lead to Elman 1988/1990. Beginner mode predicts the effect of two histories on one shared token; expert mode additionally reconstructs the scalar update and inspects training, averaging, and experiment boundaries. Both display complete engine-computed forward traces, a native checkpoint answer, version-bound source inspection, and one ten-claim work record without client JavaScript.

The context copy is fixed at weight 1.0; the trainable context-to-hidden path is separate. The scalar recurrence is a teaching reconstruction, and the lexical output evidence remains unnormalized. The Elman chapter contains no gated cell, bridge panel, empirical control, or hydrated cursor. It now links to the original LSTM static forward-state and separately scoped credit treatment below.

## Original-cell static chapter

Both modes now continue from Elman to the original 1995/1997 LSTM cell. A complete forward ledger separates carried state, candidate, input-gated write, resulting state, output gate, and exposed output. A separate backward ledger compares authored scalar path factors without presenting them as a full gradient or derivatives from the forward fixture. Native checkpoints ask whether hiding a state erases it and whether unit factors guarantee every gradient.

The expert path reconstructs the source state/output equations, marks entry and exit scaling plus every represented cell/gate truncation boundary, and audits all five promoted thousand-step Table 3 rows. The source-to-teaching crosswalk records idealized gate endpoints, supplied candidates, a populated initial state, and the source’s `tanh(x/2)` output function versus the fixture’s `tanh(x)`. The [1997 author-layout reading copy](https://ml.jku.at/publications/older/2604.pdf) was rechecked on 2 October 2026 at internal pp. 6–9, 14–15, and 24–25; those locators remain distinct from journal folios.

Both modes retain source/version inspection and a six-claim work record without client JavaScript. Static accessibility and rendered checks do not establish a learning advantage; the conditional cursor still requires the complete static comparison and moderated learner evidence.

## Forget-gate static increment

The third stage implements adaptive retention in both modes. Three authored alternatives hold the incoming state and write fixed, display every retained contribution and resulting state, and use native checkpoints to distinguish activation reset from parameter forgetting. The expert path reconstructs the block-shared journal gate, eligibility recurrence, and summed gate-weight update before auditing both synthetic continual experiments and the noncontinual control.

The journal reading copy supplies internal locators; the February report, ICANN paper, and canonical article retain their equation, topology, and result boundaries. The main CERG's B/E grammar symbols are distinguished from external segmentation/reset and from the separately described marker-removal variant. A nine-claim work record and same-stage mode switch complete the source path. The two word-model chapters and their interludes complete the sequence below; no recurrent client interaction is shipped.

The fourth stage implements the 2002 state-inspection comparison in both modes. Two alternatives hold the non-peephole terms fixed and show previous-state input/forget reads followed by an updated-state output read. Beginner prediction and cause explanation differ from the expert arithmetic, source-equation, learning, and empirical audit. The source’s unsquashed output is explicitly separated from the fixture’s tanh output; neither alternative claims to reproduce a trained timer.

A nine-claim record, both-mode progression from adaptive retention, and static ledgers for all promoted timing success rates complete this increment. Mixed MSD results, ten-run scope, gate-error truncation, and post-training ablation boundaries remain visible. This stage now continues to the recurrent word-model chapter below.

## Recurrent word-model chapter and fixed-window prerequisite

The fifth stage implements Mikolov et al. 2010 in both modes. Its opening Bengio prerequisite resolves three journal claims separately from the thirteen Mikolov claims. Four steps distinguish a fixed window, static word-type lookup rows, feed-forward scores, and a vocabulary softmax. Expert mode adds the journal’s C/x/H/U/W/b/d crosswalk and makes the notation change explicit: Bengio’s y is a score vector; Mikolov’s y is a probability vector. Recurrence remains proposed future work in the evaluated Bengio account. The three-author conference and four-author journal versions keep their separate provenance.

The recurrent chapter returns to Elman’s branch without importing a gated cell. A static forward map shows current one-hot input and saved state producing sigmoid state and normalized next-word probabilities. Beside it, the depth-one credit map marks the saved state as an input to the current update, including trainable recurrent weights, while stopping credit through its earlier computation. No earlier fixture is reused as a trained word model.

The output-only teaching example supplies scores ln(2), 0, 0 for abstract types alpha/beta/gamma. Exponentials 2/1/1 normalize to 0.5/0.25/0.25. A beta target gives source-convention error −0.5/0.75/−0.25 and a separately derived one-token loss ln(4) ≈ 1.386294 nats. These values are not produced by a simulated recurrent state or learned model. Native checkpoints distinguish a distribution from a guarantee and forward influence from backward credit. Expert mode additionally audits the current-target sign convention and source equations 1–7; no full gradient or parameter update is simulated.

All promoted Tables 1–4 values remain static, split by metric where needed for narrow screens. Model size, rare threshold, component data, count-model interpolation, ensembles, and test-time adaptation remain explicit. The off-table 112 perplexity result stays separate from Table 2; Table 3’s 16.3 is followed by footnote 4 rather than becoming 16.34. The sentence-order explanation stays tentative, and no WSJ interpolation recipe is silently transferred to RT05. Rare-word uniform allocation, training-cost comparability, and admitted long-context limits remain beside the evidence.

The [official Interspeech paper](https://www.isca-archive.org/interspeech_2010/mikolov10_interspeech.pdf) and [JMLR prerequisite](https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf) were rechecked on 6 October 2026 at printed pp. 1045–1048 and 1141–1143/1151–1152 respectively. Work records return to the chapter or prerequisite anchor in the chosen mode. The corpus date records this targeted recheck; it does not renew the present-day endpoint survey.

Sundermeyer’s final composite-cell chapter and smoothing return are implemented below. No recurrent client enhancement is shipped; complete static accessibility and rendered verification still do not establish a learning advantage over the accepted comparison baseline.

## Composite word-model chapter and smoothing return

The sixth stage implements Sundermeyer, Schlüter, and Ney 2012 in both modes. A dated mechanism inventory links original input/output gating, later adaptive forgetting, and later state-to-gate inspection to their own chapters. Assigning the two collectively cited modifications to references 12/13 is an editorial comparison with earlier primary texts, not proof of equation-level or learning-rule identity. The target omits detailed cell equations; its prose describes output scaling before an activation, so no modern vector-cell formula substitutes for the inspected source.

Beginner mode predicts which gate came later, tests the claim that more available context must improve prediction, and interprets the recognition mixture. Expert mode audits the target's source references, printed prefix/output-score/class-factorization formulas, explicitly expanded softmax/loss notation, optional projection, input-normalization result, parameter counts, corpus splits, and missing protocol. Three native disclosures in each mode require explanation; no numeric recurrent fixture or empirical slider is attached.

Figure 3's main perplexity and speed findings stay qualitative except for the authors' approximate 8% summary and printed parameter counts. Exact points, split identity, uncertainty, and full training recipe are missing. Single-sentence projection behavior is kept separate from concatenated-sentence results, and the sigmoid-projection prose/plot discrepancy remains visible. The stated average of about 21 words is not treated as a maximum or a training-unroll length.

Immediately before Table 2, the smoothing return resolves the two target claims separately and links to the matching-mode Kneser–Ney chapter. It labels 300 LSTM cells/27 million in-domain words, a KN 4-gram/over four billion words, and 1,000-best French rescoring. Table 2 preserves both baseline/mixture pairs: 19.7→19.2 on dev2 and 17.6→17.3 on test. Absolute differences are 0.5/0.3 percentage points; approximate relative reductions of 2.54%/1.70% are labelled derived arithmetic. No LSTM-only control, interpolation weights, exact Chen–Goodman discount recipe, or new lineage edge is inferred.

The [official paper](https://www.isca-archive.org/interspeech_2012/sundermeyer12_interspeech.pdf), [paper record](https://www.isca-archive.org/interspeech_2012/sundermeyer12_interspeech.html), and [conference index](https://www.isca-archive.org/interspeech_2012/) were rechecked on 7 October 2026. All four pages were rendered and inspected, including Figures 1–3, Tables 1–2 and references 11–14. The supporting [1999 ICANN source](https://sferics.idsia.ch/pub/juergen/icann99.ps.gz) title page and forget-gate abstract were checked as PostScript text, and the [2002 JMLR source](https://www.jmlr.org/papers/volume3/gers02a/gers02a.pdf) was rechecked at pp. 121–122 for named peephole connections. Fifteen target claims and five accessed source records receive the recheck date. The composite-cell claim now describes output gating and activation without asserting their commutation; its limitation records the target prose’s scaling-before-activation order. Corpus counts and lineage stay unchanged; this is targeted verification, not renewed endpoint research.

All six chapters and both interludes now have static beginner/expert treatments. Verification covers source binding, no-JavaScript/native keyboard disclosures, open-disclosure axe, graphics-hidden/reduced-motion parity, 320/640 reflow, equation scrolling, zero new client bytes, link integrity, and rendered desktop/mobile review. Learner or human screen-reader benefit has not been measured; the optional cursor remains conditional.
