# LLM Lineage

**How large language models happened—paper by paper, idea by idea.**

LLM Lineage is an interactive research atlas in development. It will trace the ideas, evidence, and engineering turns that led to modern large language models without treating the Transformer as a sudden beginning or reducing the history to a leaderboard of famous papers.

The experience will offer two paths through one sourced corpus:

- A beginner path built around prerequisites, intuition, guided sequences, and focused cause-and-effect interactions.
- An expert path built around objectives, equations, architectural detail, experiments, limitations, implementation context, and inspectable lineage evidence.

These paths will differ in pedagogy and controls, not in factual standards.

## Where the history begins

The atlas uses a short prologue for A. A. Markov’s 1913 analysis of dependence in literary text, then begins its main account with Claude Shannon’s 1948–1951 treatment of language as a stochastic, predictable source. Later milestones—including learned representations, neural language models, attention, and the Transformer—enter as branches and convergence points in that longer history.

The boundary and its alternatives are documented in [Where the LLM story begins](docs/historical-scope.md).

## Research foundation

This repository currently establishes the research contract before product implementation:

- [Editorial method](docs/editorial-method.md) defines inclusion, sourcing, uncertainty, and lineage rules.
- [Historical scope](docs/historical-scope.md) records the opening boundary, supporting evidence, limitations, and the test that would reopen the decision.
- [Corpus format](docs/corpus-format.md) defines the machine-readable evidence model and validation rules.
- [Research corpus](data/corpus.json) encodes the Markov–Shannon opening, Good’s 1953 frequency-of-frequencies context, the 1975–1983 statistical language-model branch, Hinton’s 1986 learned distributed representations, Katz’s 1987 recursive backoff estimator, Elman’s 1988/1990 prediction-trained recurrent state, Miikkulainen and Dyer’s 1991 task-learned lexicon and modular neural-language-processing branch, Schmidhuber’s separate 1993 neural-compression antecedent and the expanded Schmidhuber–Heil 1994–1996 family, Kneser and Ney’s 1995 context-diversity fallback distributions, Chen and Goodman’s 1998 interpolated and multi-discount extension, Bengio and Bengio’s 1999/2000 neural joint-distribution estimator, Xu and Rudnicky’s independent 2000 direct-softmax bigram, Bengio et al.’s 2000/2003 neural probabilistic language-model turn, and Schwenk and Gauvain’s 2002 large-vocabulary speech-recognition extension. Every promoted work has source-located claims, qualified relationships, and separate beginner/expert objectives. Materially related publications become versioned companions only after claim-level comparison; dates and results do not move across conference, manuscript, report, and journal versions.

The current milestone is closing the early neural-language-model antecedent set before selecting the initial vertical product slice. The next historical check is the 2001 LIMSI technical report named in later Schwenk work, which may clarify the path into the 2002 speech-recognition branch; implementation follows only after the slice’s sequence and interactions have written, verifiable learning objectives.

## Principles

- Prefer primary sources and official records.
- Separate foundational influence from popularity.
- Distinguish documented influence, inherited mechanisms, and conceptual parallels.
- Preserve limitations, negative results, disputed interpretations, and uncertainty.
- Use interaction only when manipulating or observing a relationship teaches more than a static explanation.
