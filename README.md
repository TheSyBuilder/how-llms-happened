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
- [First vertical slice](docs/first-vertical-slice.md) records the selected historical sequence and the gates that still prohibit premature implementation.
- [Research corpus](data/corpus.json) encodes the Markov–Shannon opening, Good’s 1953 frequency-of-frequencies context, the 1975–1983 statistical language-model branch, Hinton’s 1986 learned distributed representations, Katz’s 1987 recursive backoff estimator, Elman’s 1988/1990 prediction-trained recurrent state, Miikkulainen and Dyer’s 1991 task-learned lexicon and modular neural-language-processing branch, Schmidhuber’s separate 1993 neural-compression antecedent and the expanded Schmidhuber–Heil 1994–1996 family, Kneser and Ney’s 1995 context-diversity fallback distributions, Hochreiter and Schmidhuber’s 1995/1997 long-short-term-memory mechanism, Chen and Goodman’s 1998 interpolated and multi-discount extension, Gers, Schmidhuber, and Cummins’s 1999/2000 adaptive forget gate, Bengio and Bengio’s 1999/2000 neural joint-distribution estimator, Xu and Rudnicky’s independent 2000 direct-softmax bigram, Bengio et al.’s 2000/2003 neural probabilistic language-model turn, Schwenk and Gauvain’s 2002 large-vocabulary speech-recognition extension, Gers, Schraudolph, and Schmidhuber’s 2002 cell-state-to-gate peepholes, Mikolov et al.’s 2010 convergence of Elman-style recurrent state with normalized neural word prediction and online adaptation, Sundermeyer et al.’s 2012 application of the composite LSTM variant to word-level language modeling, Cho et al.’s 2014 fixed-vector RNN encoder–decoder with reset/update-gated hidden units evaluated chiefly as phrase-table scoring, and Sutskever, Vinyals, and Le’s separate 2014 deep-LSTM direct-translation branch with source reversal and direct versus 1,000-best rescoring. Every full-treatment work has source-located claims, qualified relationships, and separate beginner/expert objectives; context-only records may instead serve as bounded prerequisites or attribution callouts. Materially related publications become versioned companions only after claim-level comparison; dates and results do not move across conference, manuscript, report, and journal versions.

At schema `0.7.0`, the checked-in evidence model contains 26 works, 47 versions, 50 ideas, 134 sources, 271 claims, 32 relationships, and 50 beginner/expert learning objectives.

The current milestone remains the research-backed lineage corpus. The future first vertical slice is now scoped to Good’s frequency-of-frequencies context followed by Katz backoff, original Kneser–Ney, and Chen–Goodman’s interpolated multi-discount treatment. That selection does not authorize interface work: interactions and product architecture must pass their separate gates first. The recurrent bridge remains a later, fully sourced candidate and preserves four architectural steps—the 1995/1997 constant-error cell with input and output gates, the 1999/2000 adaptive forget gate, the 2002 cell-state-to-gate peepholes, and the composite cell used for word prediction and speech rescoring in 2012—without projecting later gates backward or turning synthetic and mixed-model evidence into unlimited-memory claims. The two audited 2014 fixed-vector sequence-transduction works then remain concurrent but technically distinct branches before attention: their public chronology supports comparison, not a claim that one caused the other.

## Principles

- Prefer primary sources and official records.
- Separate foundational influence from popularity.
- Distinguish documented influence, inherited mechanisms, and conceptual parallels.
- Preserve limitations, negative results, disputed interpretations, and uncertainty.
- Use interaction only when manipulating or observing a relationship teaches more than a static explanation.
