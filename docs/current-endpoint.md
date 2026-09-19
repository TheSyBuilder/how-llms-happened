# Current endpoint coverage review

The structured corpus currently reaches from 2022–2023 branches into a bounded 2025 reasoning-post-training endpoint: compute allocation, dense and sparse scaling, instruction tuning, human-feedback post-training, retrieval augmentation, environment action, self-supervised tool use, open-checkpoint transparency, and verifiable-reward reasoning. That is a stable intermediate boundary, not the endpoint of LLM history.

This review records endpoint decisions without treating candidate status as inclusion. A candidate enters the corpus only after its paper versions, claims, limitations, artifacts, rights, and lineage relationships pass the same evidence rules as the existing works.

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

## Promoted endpoint: Toolformer

[Toolformer](https://arxiv.org/abs/2302.04761) adds a training-time route to tool use rather than ReAct’s hand-authored task trajectories. GPT-J receives a few API demonstrations, proposes inline calls over CCNet, executes them, and retains a call only when its returned result lowers weighted future-token loss against both a no-call and a call-without-result counterfactual. The augmented text is then used for ordinary causal-language-model fine-tuning. At inference, decoding pauses at the result marker, an external executor supplies text, and generation resumes from the expanded context.

The promoted record separates the sole eight-author arXiv revision from the nine-author NeurIPS 2023 article and supplement. It retains the exact sampling and filtering thresholds, tool-specific heuristics, five concrete tool implementations, one-call evaluation cap, forced top-ten trigger, task-specific result envelopes, and proceedings-only LLaMA studies. It also keeps two unresolved implementation boundaries visible: the main paper uses GPT-J as the single sampling-and-scoring model while the supplement names GPT-2 as scorer for GPT-J-generated calls, and the 25,000-example-per-API training cap is not reconciled with 32,180 retained LLaMA QA examples.

No official training or inference code, generated annotation corpus, Toolformer checkpoint, tokenizer binding, tool snapshot, predictions, seeds, or complete environment was identified in the inspected first-party records. The tools are read-only text functions, and the study does not test chained calls, query revision, state-changing APIs, prompt injection, permissions, privacy, or operational safety. The qualified Brown→Toolformer edge carries only Toolformer’s target-side attribution of its few-demonstration call sampler to in-context learning. GPT-3 is a comparator, not Toolformer’s base model; ReAct remains a related but distinct environment-trajectory branch without an inferred lineage edge.

## Promoted endpoint: Switch Transformers

[Switch Transformers](https://jmlr.org/papers/v23/21-0998.html) adds a sparse-capacity branch to the dense Transformer scaling history. The model keeps T5’s encoder–decoder, C4 span-corruption objective, dense attention, and text-to-text interface, but replaces selected position-wise feed-forward blocks with expert banks. A learned router sends each token to one expert, a fixed capacity limits each expert’s batch allocation, and overflow tokens bypass expert computation through the residual path. The auxiliary balancing loss, selective float32 router computation, smaller initialization, expert-only fine-tuning dropout, and combined expert/data/model parallelism address the routing and stability costs created by that conditional computation.

The promoted record separates arXiv v1, the canonical April 2022 JMLR article, arXiv v2, and arXiv v3. JMLR and v2 swap the intended layer and expert headings in Table 9; v3 corrects the header and adds a T5X link two days after the checkpoint-release commit. The paper-era Mesh TensorFlow file exposes relevant routing variants but no complete experiment configuration. The pinned T5X registry names nine converted checkpoints, but it does not provide one immutable data-to-table run ledger, prepared-data manifest, seeds, or raw evaluation bundle.

The headline parameter counts are not active-compute counts. Canonical Table 9 reports 395B parameters and 6.3T FLOPs per sequence for Switch-XXL, versus 1,571B and 890B for Switch-C; the former is sometimes unstable while the latter is reported stable. Controlled pretraining gains do not become universal downstream gains: some ARC rows regress, reasoning gains transfer less reliably than knowledge gains, and several alternative routing ideas report no benefit or bfloat16 divergence. Article, arXiv, software, checkpoint, corpus, benchmark, and dependency rights remain separate.

Two qualified incoming edges delimit the lineage. T5→Switch carries only the explicitly reused architecture, objective, corpus family, and task interface. Kaplan→Switch carries only the paper’s stated extension of the model/data/compute scaling frame to a fourth, conditional-capacity axis. Neither edge transfers source-side results, artifacts, fitted constants, accounting conventions, or rights.

## Promoted endpoint: DeepSeek-R1

[DeepSeek-R1](https://www.nature.com/articles/s41586-025-09422-z) fills the bounded reinforcement-learned-reasoning lane. The promoted family begins with a 20 January 2025 GitHub technical report, separates the byte-distinct arXiv v1, treats the September Nature article plus supplement as canonical, and preserves the expanded January 2026 arXiv v2 as a later rendering. The May 2025 R1-0528 checkpoint is a separate release boundary, not a revision of the January experiment.

The record keeps four model identities apart. DeepSeek-V3-Base is the 671-billion-total, 37-billion-active pretrained substrate. DeepSeek-R1-Zero applies GRPO directly to that base without an intervening supervised-fine-tuning stage. Final DeepSeek-R1 adds cold-start traces, reasoning RL, rejection-sampled reasoning and general SFT, and a later mixed RL stage with rule and learned preference rewards. Six dense Qwen/Llama students receive supervised fine-tuning on R1-generated traces but no reported RL stage. “Pure RL” therefore describes R1-Zero’s immediate post-training sequence, not an untrained model, a base corpus without human/model-generated reasoning, or the final R1 pipeline.

The promotion preserves several evidence limits:

- GRPO removes PPO’s separately trained value model, not rollout, reward, reference-model, or distributed-system cost. R1-Zero’s accuracy and format rewards verify final outcomes and tags rather than every intermediate reasoning token.
- Longer traces, reflective words, and visible self-correction-like text are output behaviors. They do not prove that natural-language rationales faithfully expose latent computation.
- Stage results are nonmonotonic. R1-Zero exceeds final R1 on some reported rows, while later stages sharply improve model-judged instruction and preference suites.
- Exact 10-gram decontamination cannot remove paraphrased or discussed test material. AIME 2025 reduces one leakage path but does not turn the benchmark suite into a contamination-free causal study.
- Failed 7B dense and 16B MoE trials, reward hacking, process-reward-model difficulty, and unsuccessful iterative MCTS are retained alongside positive results.
- The paper reports about 147,000 H800 GPU-hours for R1-Zero, R1 post-training, and SFT-data creation at an assumed $2 per GPU-hour. That estimate excludes V3 pretraining and is not an energy, labor, failed-run, or full-lifecycle audit.
- Public weights, V3 inference code, publication files, and sample records do not reconstruct the complete RL/SFT corpora, preference labels, rollouts, seeds, optimizer states, predictions, or one locked table-to-run environment.
- Article, repository code, V3 model, R1/R1-Zero weights, Qwen/Llama student bases, data, benchmarks, and the later R1-0528 checkpoint retain separate identities and rights.

One qualified incoming edge records only a target-side methodological contrast. R1 explicitly describes the Ouyang et al. SFT→reward-model→PPO pipeline before applying outcome-based GRPO directly to a pretrained base for R1-Zero. The edge does not imply that R1 rejects all supervised or preference learning: final R1 reintroduces both, and no GPT-3 architecture, data, results, artifacts, evaluator population, or rights transfer across the relationship.

## M2 closure audit

The 19 September 2026 closure audit tests the promoted corpus against the endpoint acceptance rule rather than asking whether every popular model has a node. Eight lanes pass. One narrow but consequential gap remains, so M2 stays active and interaction work remains gated.

| Acceptance lane | Evidence already in the corpus | Decision |
|---|---|---|
| Dense pretraining and allocation | Kaplan separates model, data, and compute variables; Gopher supplies a fixed-token dense family; Hoffmann re-estimates the fixed-compute frontier; PaLM, OPT, and BLOOM expose later training and evaluation boundaries. | Pass |
| Supervised instruction tuning | FLAN and T0 provide distinct decoder-only and encoder–decoder multitask routes with prompt, mixture, leakage, and held-out-task boundaries. | Pass |
| Preference optimization | Stiennon and InstructGPT document supervised initialization, learned reward models, KL-regularized PPO, evaluator-population scope, and overoptimization limits. | **Open gap:** the corpus does not yet explain direct offline preference optimization without a separately fitted reward model and policy-gradient stage. |
| Retrieval augmentation | ORQA and DPR establish complementary retriever precursors; REALM and RAG separate extractive retrieval-aware pretraining from retrieved-context generation. | Pass |
| Environment action and tool use | ReAct records interleaved thought/action/observation trajectories; Toolformer records self-supervised call generation, execution, filtering, and inference-time result injection. | Pass |
| Sparse capacity | Switch Transformers records token routing, fixed expert capacity, balancing, stability mitigations, total-versus-active parameters, and mixed transfer evidence. | Pass |
| Open artifacts and data governance | OPT, ROOTS, and BLOOM separate checkpoints, logs, data construction, model documentation, mutable artifacts, and component-specific rights. | Pass |
| Reasoning-oriented post-training | DeepSeek-R1 separates the pretrained base, SFT-free-before-RL R1-Zero, multistage final R1, and distilled students while preserving reward, contamination, reconstruction, and negative-result limits. | Pass |
| Version and lineage integrity | All 65 works use version-aware source records; every promoted edge is evidence-bound or explicitly editorial, and every full-treatment work has beginner and expert objectives. | Pass |

The remaining blocker is [Direct Preference Optimization](https://arxiv.org/abs/2305.18290), not because later systems use the name, but because the paper changes the optimization path itself. It derives a policy objective from the KL-constrained reward-maximization formulation and trains from static preference pairs with a classification-style loss, omitting a separately fitted reward model, policy-gradient sampling, and PPO during fine-tuning. The official [NeurIPS 2023 record](https://proceedings.neurips.cc/paper_files/paper/2023/hash/a85b405ed65c6477a4fe8302b5e06ce7-Abstract-Conference.html) confirms the work as a distinct conference contribution rather than only a later implementation convention.

Before M2 can close, DPO needs the same claim-level treatment as every other promoted work: arXiv versions 1–3 and the canonical proceedings article and supplement; exact derivation assumptions; reference-policy and temperature roles; sentiment, summarization, and dialogue protocols; comparison and uncertainty limits; data, code, checkpoint, and rights boundaries; and target-side relationships to the Stiennon and Ouyang reward-model-plus-PPO path. Promotion is not automatic: the audit may still reject or narrow individual claims, relationships, or artifacts.

## Explicit candidate decisions

These decisions are exclusions from the minimum M2 closure set, not claims that the papers are unimportant or permanently outside the atlas.

- [Constitutional AI](https://arxiv.org/abs/2212.08073) remains a future feedback-provenance branch. Its principles, self-critiques, revisions, and model-generated preferences change who or what supplies supervision, but its reported reinforcement-learning phase still uses a learned preference model and RL. The existing Stiennon–InstructGPT path covers that optimizer family; AI-feedback provenance is valuable expansion, not the remaining minimum mechanism gap.
- [LLaMA](https://arxiv.org/abs/2302.13971) and [Llama 2](https://arxiv.org/abs/2307.09288) remain later model-family candidates. They matter for efficient dense training, widely reused checkpoints, licensing, dialogue post-training, and safety practice, but the minimum corpus already contains dense allocation, public-checkpoint, supervised-instruction, and reward-model-plus-PPO branches. Popularity and downstream adoption alone do not justify another node.
- [OLMo](https://arxiv.org/abs/2402.00838) and [Dolma](https://arxiv.org/abs/2402.00159) remain a coherent future full-stack-openness slice. Releasing training data, code, intermediate checkpoints, and logs in one project advances inspectability, but OPT plus ROOTS and BLOOM already establish the minimum artifact, data-governance, and rights vocabulary required before interaction design.
- [Mistral 7B](https://arxiv.org/abs/2310.06825) remains an inference-efficiency candidate for grouped-query and sliding-window attention. [Mixtral](https://arxiv.org/abs/2401.04088) remains a later top-2 sparse-decoder candidate. Neither is needed to establish the minimum sparse-capacity branch because Switch already records routing, expert capacity, communication, stability, active-versus-total scale, and transfer limits.
- Retrieval, acting, tool use, and reinforcement-learned reasoning receive no additional preselected candidate. New work must add a necessary mechanism, stronger public evidence, or a missing branch rather than merely a newer date or larger benchmark score.

These branches overlap in calendar time while remaining distinct in the graph. A model that uses several mechanisms does not automatically become the canonical source for each of them.

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
