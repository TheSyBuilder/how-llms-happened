# First vertical slice

The future first vertical slice is reserved for the classical smoothing sequence:

1. I. J. Good’s 1953 frequency-of-frequencies treatment as a short context and attribution prelude.
2. Katz’s 1987 recursive backoff estimator as the first full paper experience.
3. Kneser and Ney’s 1995 context-diversity fallback distribution.
4. Chen and Goodman’s 1998 expanded study of interpolation and count-dependent discounts, with the 1999 journal article retained as a companion version.

This is the selected scope for the first implementation milestone. The slice’s [interaction language](interaction-language.md) passes the project’s [interaction gate](editorial-method.md#interaction-gate) with two accepted briefs, and its [product architecture](product-architecture.md) now defines the complete beginner and expert journeys, evidence system, visual roles, content boundary, technical approach, and implementation gates.

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

## Implementation gate

The interaction review accepts a probability-mass ledger and a context-coverage lens. It also rejects an empirical-result scrubber, an unrestricted smoothing formula playground, and automatic probability-flow animation. The product architecture requires implementation to preserve:

- separate, shareable beginner and expert routes around the same claim IDs;
- build-time evidence binding and mode-neutral work records;
- the warm technical ledger visual system and source-inspection behavior;
- static narrative, evidence, and before/after treatments when JavaScript is unavailable;
- keyboard, screen-reader, reduced-motion, mobile, performance, rights, and factual gates before the slice expands.

M4 passes at specification level, so M5 may begin with the static shell and build-time corpus adapter, followed by the Good prelude and Katz stage in both modes. The slice choice, architecture, or an accepted interaction may be revisited for new evidence, a correction, failed learner testing, or another clearly recorded editorial reason, including an unresolvable product constraint.
