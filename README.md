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
- [Research corpus](data/corpus.json) encodes the Markov–Shannon opening and the 1975 statistical-decoder bridge with source-located claims, qualified relationships, and separate beginner/expert objectives.

The current milestone expands this source-backed structure through the classical statistical and neural-language-model branches. A vertical product slice will follow only after its sequence and interactions have written, verifiable learning objectives.

## Principles

- Prefer primary sources and official records.
- Separate foundational influence from popularity.
- Distinguish documented influence, inherited mechanisms, and conceptual parallels.
- Preserve limitations, negative results, disputed interpretations, and uncertainty.
- Use interaction only when manipulating or observing a relationship teaches more than a static explanation.
