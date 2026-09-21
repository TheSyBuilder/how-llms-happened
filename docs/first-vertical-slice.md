# First vertical slice

The future first vertical slice is reserved for the classical smoothing sequence:

1. I. J. Good’s 1953 frequency-of-frequencies treatment as a short context and attribution prelude.
2. Katz’s 1987 recursive backoff estimator as the first full paper experience.
3. Kneser and Ney’s 1995 context-diversity fallback distribution.
4. Chen and Goodman’s 1998 expanded study of interpolation and count-dependent discounts, with the 1999 journal article retained as a companion version.

This is a scope decision, not permission to begin interface implementation. The slice’s [interaction language](interaction-language.md) now passes the project’s [interaction gate](editorial-method.md#interaction-gate) with two accepted briefs; the beginner and expert paths still need a product-architecture review.

## Why this sequence goes first

The four works support one cumulative question: what should a language model do when finite data leave plausible sequences rare or unseen?

- Good supplies the bounded statistical prelude: observed singletons can reveal probability mass that belongs to unseen events. It remains context rather than a full language-model chapter, and the treatment preserves Good’s explicit attribution to Turing.
- Katz adapts frequency-of-frequencies machinery to conditional estimation: discount selected observed events, compute a history-specific reserve, and renormalize eligible lower-order probabilities only when the higher-order estimate is zero.
- Kneser and Ney show why raw lower-order frequency can be the wrong fallback signal and derive two alternatives: one based on the diversity of contexts an event completes, and another based on singleton evidence under leave-one-out analysis. Katz remains an acknowledged antecedent, not the experimental baseline or an exclusive predecessor.
- Chen and Goodman separate two later changes that are often bundled together: interpolation lets lower-order continuation evidence contribute even for observed events, while count-dependent discounts reserve different amounts of mass for different count tiers.

That progression works in both learning modes without creating separate factual accounts. A beginner path can reason about seen, rare, and unseen examples, conserved probability mass, fallback signals, and the difference between backoff and interpolation. An expert path can reconstruct the estimators, assumptions, normalization terms, equations, implementation variants, and bounded experiments from the same claim IDs.

The audited scope is also deliberately small: four works, five versions, fourteen sources, forty-one direct high-confidence claims, and three documented relationships. Good is a compact prelude; the other three works receive the full guided treatment. The sequence must not imply a Jelinek–Mercer-to-Katz or Jelinek–Mercer-to-Kneser–Ney genealogy that the inspected sources do not establish.

## Why recurrent memory follows later

The recurrent-memory sequence is not rejected. Its carried state, temporal credit, protected memory, adaptive retention, peepholes, and word-model convergence are especially strong candidates for interactive explanation. It is a larger first build, however: six works, eleven versions, thirty-three sources, sixty-two claims, eight internal relationships, and two converging lanes. It also needs a prerequisite bridge from fixed-window neural word prediction and careful separation of forward activation, backward credit, historical cell variants, and the 2012 paper’s sparse attribution.

Starting with smoothing therefore reduces simultaneous factual, pedagogical, and interface variables while still exercising the atlas’s core requirements: distinct beginner and expert paths, source-level evidence, equations, uncertainty, and a cause-and-effect interaction whose value must be demonstrated.

## Remaining gate

The interaction review accepts a probability-mass ledger and a context-coverage lens. It also rejects an empirical-result scrubber, an unrestricted smoothing formula playground, and automatic probability-flow animation. Before implementation, the selected slice still requires M4 product architecture to define:

- the complete information architecture around the four historical stages;
- distinct beginner and expert journeys through the shared corpus and accepted interactions;
- the visual system, content components, and source-inspection behavior;
- the corpus-to-view-model boundary and technical approach;
- test and review plans that carry the accepted keyboard, screen-reader, reduced-motion, mobile, performance, and factual criteria into implementation.

Implementation remains gated until that architecture passes. The slice choice or an accepted interaction may be revisited for new evidence, a correction, failed learner testing, or another clearly recorded editorial reason, including an unresolvable product constraint.
