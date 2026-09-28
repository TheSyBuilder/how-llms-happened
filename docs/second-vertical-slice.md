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

The branch has a credible cause-and-effect interaction opportunity, but no interaction is accepted by this decision.

A future brief may test whether manipulating a bounded, reviewed sequence helps a learner distinguish:

- the value carried forward from the error signal assigned backward;
- fixed retention from learned forgetting;
- a gate reading cell state from a gate controlling cell retention;
- an unnormalized recurrent prediction vector from a normalized word distribution.

That brief must be researched and reviewed before implementation. It must explain why a linked static trace is insufficient, bind every historical state to exact claims and versions, use synthetic values that reproduce no paper experiment, provide a semantic table and text trace, and define keyboard, reduced-motion, no-JavaScript, mobile, performance, and misconception tests. It must not present a modern unified LSTM equation as though every term appeared in the original cell.

Empirical results remain static and source-conditioned. The interface must not offer controls that blend generated sequence tasks, Penn Treebank language modeling, speech-recognition rescoring, or modern training conventions into a false shared experiment.

## Implementation gate

Implementation may begin only after the next design pass supplies:

- a complete interaction brief or an explicit decision that a static treatment teaches better;
- a stage-by-stage claim inventory and notation crosswalk;
- the exact Bengio prerequisite treatment and smoothing-journey bridge;
- reviewed synthetic fixtures with invariants and expected traces, if interaction is accepted;
- beginner and expert journey manifests that resolve to the existing objectives;
- static fallbacks, source inspection, checkpoint answers, and mode-switch behavior;
- acceptance tests for variant leakage, equation integrity, accessibility, reflow, payload, and rendered desktop/mobile quality.

Until those gates pass, M6 remains in research and design. The attention, contextual-transfer, retrieval, and post-training branches remain valid later candidates; their deferral is a sequencing decision, not an importance judgment.
