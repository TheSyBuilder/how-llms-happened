# Current endpoint coverage plan

The structured corpus currently reaches 2022 through several distinct branches: compute allocation, dense scaling, instruction tuning, human-feedback post-training, retrieval augmentation, environment action, and open-checkpoint transparency. That is a stable intermediate boundary, not the endpoint of LLM history.

This plan records the next coverage decisions without treating candidate status as inclusion. A candidate enters the corpus only after its paper versions, claims, limitations, artifacts, rights, and lineage relationships pass the same evidence rules as the existing works.

## Promoted endpoint: ROOTS and BLOOM

The paired audit promotes ROOTS and BLOOM as distinct objects: one data-governance branch and one model, training, evaluation, artifact, and release branch. BLOOM enters on its own claim-level record rather than by association. Its target paper now supplies target-side data-substrate evidence for one narrow ROOTS→BLOOM relationship; governance, mechanisms, evaluations, artifacts, and rights do not transfer across it.

[BLOOM](https://arxiv.org/abs/2211.05100) is a 176-billion-parameter decoder-only Transformer trained across 46 natural and 13 programming languages. Its historical value is not a new language-model objective. The promoted branch joins multilingual scale, a public-supercomputer collaboration, released model checkpoints and training traces, explicit model documentation, and a use-restricted Responsible AI License in one inspectable project. The paper has four arXiv revisions: the first two are 62 pages, while versions 3 and 4 expand the evaluation and analysis to 73 pages. Those revisions are not treated as interchangeable.

[ROOTS](https://proceedings.neurips.cc/paper_files/paper/2022/hash/ce9e92e3de2372a4b93353eb7f3dc0bd-Abstract-Datasets_and_Benchmarks.html) documents the 1.6-terabyte multilingual corpus prepared for BLOOM. Its promoted record treats participatory source discovery, source-level documentation, language-specific filtering, composite access controls, and unresolved consent, privacy, representation, licensing, and reconstruction limits as a separate historical contribution. The canonical NeurIPS article and supplement remain distinct from the later combined [arXiv version](https://arxiv.org/abs/2303.03915).

The paired records preserve several boundaries:

- ROOTS reports 252 catalogued sources, 517 datasets after its three acquisition pipelines, and 498 constituent datasets elsewhere in the same paper. These scopes may be related, but they are not synonyms unless primary evidence reconciles them.
- The corpus combines curated sources with filtered OSCAR web crawl data. Participation and documentation do not imply that every person represented in the crawl consented to inclusion.
- The paper describes a preprocessing bug that restricted the GitHub subset to GPL-licensed repositories. This is part of the dataset's realized construction, not a recommended design choice.
- BLOOM uses a 250,680-item byte-level BPE vocabulary, ALiBi, an embedding-layer normalization, and Megatron-DeepSpeed training. Its incoming Transformer and GPT edges remain architecture-specific; no edge assigns tokenizer, position bias, scale, or run evidence backward.
- ROOTS contains about 341 billion tokens, while BLOOM reports 366 billion training-token exposures. Dataset size and training exposure are different quantities.
- Paper text, training code, model weights, model cards, logs, the BLOOM RAIL terms, individual ROOTS components, and third-party datasets have separate identities and rights. The label “open” cannot substitute for that inventory.
- BLOOM's base-model evaluation is prompt-, task-, language-, checkpoint-, and comparator-dependent. BLOOMZ is a separately multitask-prompted, fine-tuned derivative and must not be used to rewrite base-model results.

ROOTS and BLOOM now enter the corpus as distinct nodes joined only by target-side data-substrate evidence. BLOOM also receives qualified architecture links from Transformer and GPT and a schedule-response link from Hoffmann et al.; none transfers source-side results or rights. These promotions do not establish that BLOOM originated decoder-only modeling, multilingual language modeling, ALiBi, instruction tuning, model cards, or responsible licensing.

## Promoted endpoint: ReAct

[ReAct](https://arxiv.org/abs/2210.03629) adds explicit environment interaction to a frozen language model’s few-shot trajectory: generated thoughts change the prompt context, task actions query or affect an environment, and returned observations condition later steps. The promoted record keeps the three arXiv revisions separate from the canonical ICLR 2023 oral record. Version 3 adds the camera-ready GPT-3 appendix, updated-label example, expanded fine-tuning description, and human-edit material; those additions do not move backward into the earlier revisions.

The task evidence is deliberately split. HotpotQA and FEVER use a hand-built Wikipedia search/lookup/finish interface rather than learned latent retrieval. ALFWorld and WebShop use simulated environments, selected prompt permutations, and unmatched learned comparators. ReAct’s hybrid fallbacks are task-specific heuristics; its manual error percentages come from an author-coded 200-example sample; and the single edited ALFWorld trace is qualitative rather than a general controllability or safety result. Visible thought strings are inspectable interface tokens, not evidence that they faithfully expose hidden model computation.

The immutable January 2023 repository tree supplies text-davinci-002 notebooks and prompts for the four task families, but not PaLM weights or code, paper fine-tuning code or checkpoints, a locked environment, or every service snapshot. Article, code, model/API, benchmark, Wikipedia, and environment rights remain separate. The qualified PaLM→ReAct edge carries only the target’s explicit use of frozen PaLM-540B and few-shot prompting; no RAG, chain-of-thought, WebGPT, GPT-3, or InstructGPT edge is inferred from shared vocabulary or comparison.

## Coverage lanes beyond 2022

The remaining endpoint is not one chronological ladder. The following lanes are provisional review queues, not preselected promotions.

| Lane | Existing anchor | Primary candidates | Question the lane must answer |
|---|---|---|---|
| Open artifacts and efficient dense models | OPT, ROOTS, and BLOOM | [LLaMA](https://arxiv.org/abs/2302.13971), [Llama 2](https://arxiv.org/abs/2307.09288), [OLMo](https://arxiv.org/abs/2402.00838), and [Dolma](https://arxiv.org/abs/2402.00159) | How did “open model” move from checkpoints and logs toward broader training-stack access, and which assets and permissions were actually supplied? |
| Preference instruction and preference post-training | FLAN, T0, Stiennon, InstructGPT | [Constitutional AI](https://arxiv.org/abs/2212.08073) and [Direct Preference Optimization](https://arxiv.org/abs/2305.18290) | What changes when supervision comes from written principles, model-generated comparisons, or a direct preference loss instead of the existing human-reward-model-plus-PPO path? |
| Retrieval, reasoning, and acting | REALM, RAG, PaLM reasoning evidence, and ReAct | [Toolformer](https://arxiv.org/abs/2302.04761) | When does an LM merely condition on retrieved text, and when does it select actions or tool calls as part of an interleaved trajectory? |
| Sparse and efficient architecture | Transformer, T5, dense scaling branch | [Switch Transformers](https://arxiv.org/abs/2101.03961), [Mixtral](https://arxiv.org/abs/2401.04088), and [Mistral 7B](https://arxiv.org/abs/2310.06825) | Which changes alter active computation, memory traffic, attention cost, or inference behavior rather than only total parameter count? |
| Reinforcement-learned reasoning | Human-feedback post-training and chain-of-thought evidence | [DeepSeek-R1](https://arxiv.org/abs/2501.12948) and its 2025 journal/2026 revision boundary | What evidence supports reasoning improvements from verifiable-reward reinforcement learning, and what depends on hidden base-model, data, evaluator, or release conditions? |

These lanes can overlap in calendar time while remaining distinct in the graph. A model that uses several mechanisms does not automatically become the canonical source for each of them.

## Endpoint acceptance rule

M2 is complete only when the corpus can explain the major technical and research-practice changes that shape current LLMs without relying on product popularity as evidence. At minimum, the final endpoint review must show:

- one evidence-backed path through dense pretraining and allocation;
- distinct supervised-instruction and preference-optimization paths;
- retrieval and tool-use boundaries;
- at least one sparse or inference-efficiency branch;
- a version-aware open-artifact and data-governance path;
- a bounded account of reasoning-oriented post-training supported by public primary evidence;
- explicit exclusions or context-only decisions for prominent candidates that add no necessary mechanism, evidence, or branch.

The endpoint remains revisable. New publications can change candidate priority, but they do not silently change already sourced claims or turn later terminology into earlier influence.
