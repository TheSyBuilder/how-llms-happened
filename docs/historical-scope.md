# Where the LLM story begins

## Decision

LLM Lineage opens with a short prologue on A. A. Markov’s 1913 statistical analysis of dependence in literary text. Its main account begins with Claude Shannon’s 1948 paper “A Mathematical Theory of Communication” and treats his 1951 “Prediction and Entropy of Printed English” as the second half of the opening sequence.

If one year must label the beginning, it is **1948**.

This is a narrative boundary, not a claim that earlier probability, linguistics, logic, computation, or neural ideas were unimportant. It is also not a claim of a documented Markov-to-Shannon-to-modern-LLM causal chain. The boundary marks the point at which the concepts needed for a continuous account—conditional sequence probability, generated approximations to language, entropy, context, and prediction—come together in a directly inspectable primary source.

## Prologue: dependence in text

Markov’s 1913 study examined a 20,000-letter excerpt of Pushkin’s *Eugene Onegin* as a chain of dependent events. The published English translation shows a deliberately narrow abstraction over letters used to test dependence.

That makes the study an unusually concrete prologue: written language is treated as a measurable sequence whose adjacent events are not independent. It does **not** make Markov’s study a modern language model. The work did not learn a predictor, model word meaning, or present text generation as its objective. Its place in the atlas is conceptual ancestry, not an asserted direct influence edge.

Primary record: [Markov, “An Example of Statistical Investigation of the Text Eugene Onegin Concerning the Connection of Samples in Chains”](https://doi.org/10.1017/S0269889706001074), lecture delivered in 1913 and published in English translation in 2006.

## Main opening: language as a stochastic and predictable source

Shannon’s 1948 paper provides the formal spine. It defines discrete information sources and entropy, describes probabilities conditioned on preceding symbols, generalizes the construction to longer contexts, and in Section 3 generates a series of increasingly structured approximations to English at letter and word levels.

The 1951 paper turns predictability into an empirical experiment. A person guesses the next letter with preceding text available; Shannon then connects ranked prediction behavior to bounds on the entropy of printed English. This is not machine learning, but it makes the relationship between context, next-symbol uncertainty, and prediction directly observable.

Together the papers support an opening chapter with both a formal model and a teachable experiment:

- 1948: What does it mean to model a language source probabilistically?
- 1951: How does more preceding context change uncertainty about the next symbol?

Primary sources:

- Shannon, “A Mathematical Theory of Communication,” [Part I](https://doi.org/10.1002/j.1538-7305.1948.tb01338.x) and [Part II](https://doi.org/10.1002/j.1538-7305.1948.tb00917.x), especially Sections 2–3 and 6–7.
- [Shannon, “Prediction and Entropy of Printed English”](https://doi.org/10.1002/j.1538-7305.1951.tb01366.x), especially Sections 3–6.

## Why later landmarks are not the beginning

Later dates make useful act boundaries, but each presupposes part of the story the atlas needs to explain.

| Candidate boundary | What it contributes | Why it is not the atlas’s beginning |
|---|---|---|
| 1954 — Zellig Harris, “Distributional Structure” | A rigorous linguistic program for describing elements through their environments. | This is an important linguistic branch, not a next-symbol model or the invention of contemporary vector embeddings. Treating it as the sole origin would lose the probability-and-prediction spine. |
| 1986 — Geoffrey Hinton, “Learning Distributed Representations of Concepts” | A network learns internal distributed features from relational propositions and uses them to generalize within one small domain comprising two isomorphic family trees. | It is a representation-learning branch, not a word model or language model. Its held-out test contains four relation instances, and the paper explicitly limits its generalization account to particular domains. |
| 1986 — Rumelhart, Hinton, and Williams, “Learning representations by back-propagating errors” | A widely influential demonstration that multilayer networks can learn useful internal representations through error-driven weight updates. | It is an enabling neural-learning branch, not a language-modeling paper. Earlier incarnations of reverse-mode differentiation are documented in the historical literature, so the atlas will not call this paper the unqualified invention of backpropagation. |
| 1988/1990 — Jeffrey Elman, “Finding Structure in Time” | Copies the previous hidden state into a recurrent context and uses next-item prediction to organize task-dependent sequence representations. | It studies generated toy sequences rather than a natural-language probability model. Its word outputs are not normalized, its memory is practically bounded, and its hidden-to-context copy weights are fixed even though the context-to-hidden path is trained. |
| 2000/2003 — Bengio et al., “A Neural Probabilistic Language Model” | Jointly learned continuous word features and a neural conditional probability model, with a three-author NIPS version followed by the canonical four-author JMLR treatment. | It is a strong boundary for the modern neural-language-model act, not the full history. Section 1.2 explicitly notes earlier neural language modeling and related representation work, and the strongest reported JMLR results mix neural and trigram probabilities. |
| 2017 — Vaswani et al., “Attention Is All You Need” | Replaced recurrence and convolution in an encoder–decoder transduction architecture with attention-based context mixing, improving parallelism on the reported translation tasks. | It is an architectural convergence point. Attention, sequence prediction, learned representations, encoder–decoder modeling, and the training objective all have earlier lineages. The paper is not, by itself, the first pretrained large language model. |

Primary records for these alternatives:

- [Harris, “Distributional Structure”](https://doi.org/10.1080/00437956.1954.11659520).
- [Hinton, “Learning Distributed Representations of Concepts”](https://escholarship.org/uc/item/79w838g1).
- [Rumelhart, Hinton, and Williams, “Learning representations by back-propagating errors”](https://doi.org/10.1038/323533a0).
- [Griewank, “Who Invented the Reverse Mode of Differentiation?”](https://doi.org/10.4171/DMS/6/38), a scholarly historical survey used for the priority caveat above.
- [Elman, “Finding Structure in Time”](https://doi.org/10.1207/s15516709cog1402_1).
- [Elman’s author bibliography](https://jeffelman.ucsd.edu/research/publications/), for the identity, unavailability, and superseded status of Technical Report 8801; the [April 1988 CRL newsletter](https://crl.ucsd.edu/newsletter/2-4/2-4.pdf), for its month-level date; and the [ScienceDirect legacy publisher record](https://www.sciencedirect.com/science/article/pii/036402139090002E), for the journal issue’s April–June coverage and legacy Elsevier DOI.
- [Bengio, Ducharme, and Vincent, NIPS 2000 record for “A Neural Probabilistic Language Model”](https://proceedings.neurips.cc/paper_files/paper/2000/hash/728f206c2a01bf572b5940d7d9a8fa4c-Abstract.html).
- [MIT Press, *Advances in Neural Information Processing Systems 13*](https://mitpress.mit.edu/9780262122412/advances-in-neural-information-processing-systems-13/), for the proceedings-volume publication date.
- [Bengio et al., JMLR record for “A Neural Probabilistic Language Model”](https://www.jmlr.org/papers/v3/bengio03a.html).
- [Vaswani et al., “Attention Is All You Need”](https://proceedings.neurips.cc/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html).

## Narrative shape

The opening boundary implies a braided history rather than a single inevitable ladder:

1. **Prologue — sequential dependence:** Markov gives a compact demonstration that real text contains measurable dependence.
2. **Probabilistic spine:** Shannon makes language a conditional stochastic source and next-symbol predictability an empirical question.
3. **Converging branches:** distributional linguistics, trainable representations, recurrent sequence models, statistical language modeling, scaling methods, and attention develop with different aims and evidence.
4. **Neural probabilistic turn:** learned word representations and conditional sequence probabilities are trained together at useful scale.
5. **Transformer hinge:** attention-centered architectures alter the path to parallel training and scale without erasing inherited objectives and mechanisms.

The corpus must earn every transition. Conceptual similarity alone will not be drawn as causality.

## Boundary test

The 1948 boundary should be reopened if a pre-1948 primary source is found that satisfies all of these conditions:

1. It models natural-language sequences probabilistically.
2. It conditions prediction or generation on prior context.
3. It treats the construction as a predictive or generative source, not only a frequency count.
4. It has evidence of continuity into later language-modeling practice.

Markov may remain a prologue only while removing it leaves the technical spine intact. Shannon belongs in the main account only while removing the 1948–1951 sequence leaves probability, generated language approximation, contextual prediction, and entropy without an equally strong opening source.

## Source notes

The boundary sources were last rechecked on 2026-08-03. Publication metadata comes from the linked publisher, proceedings, author, or institutional records. Claims about the contents of Shannon 1948, Shannon 1951, Hinton 1986, Elman 1990, Bengio et al. 2000/2003, and Vaswani et al. 2017 were checked against the papers themselves; the Harris and Rumelhart summaries were checked against their publisher records. Elman’s unavailable April 1988 technical report is used only for version identity and ordering, not for transferred technical claims. The Bengio chronology keeps the 2000 conference, 11 May 2001 proceedings-volume publication, and February 2003 journal publication distinct. The Markov claim uses the peer-reviewed English translation of the 1913 lecture, and the backpropagation priority caveat uses Griewank’s historical survey. The scope remains subject to the boundary test and to later corpus-level prior-art review.
