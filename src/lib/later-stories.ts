export const laterStories: Record<string, {headline:string; problem:string; idea:string[]; diagram:string[]; play:string; mattered:string; deeperTitle:string; deeper:string; sourceNote:string}> = {
  "chinchilla": {
    "headline": "Buy enough reading, too.",
    "problem": "A larger model has more adjustable numbers, called parameters. But those numbers still need examples to learn from. If you spend the whole budget making the model bigger, you may leave too little budget to teach it.",
    "idea": [
      "Hoffmann and colleagues studied how to divide training compute between parameters and tokens, the pieces of text a model reads. Their 2022 Chinchilla study found that model size and training tokens should grow roughly together as the compute budget grows.",
      "Think of a fixed rectangle: one side is model size, the other is reading. Stretch one side and the other must shrink. The best balance depends on how much each ingredient improves prediction."
    ],
    "diagram": [
      "More parameters",
      "Fixed compute",
      "More training tokens"
    ],
    "play": "Gopher overspent. Can you split it better?",
    "mattered": "The useful question became “How much training will this model get?” Smaller, well-trained models are also cheaper to run. Next, a model learns to call tools partway through an answer.",
    "deeperTitle": "Budget and loss",
    "deeper": "A common approximation is C ≈ 6ND, with N parameters and D training tokens. The paper fits loss as L = E + A/N^α + B/D^β. The game uses this formula with the coefficients Besiroglu and colleagues refitted in 2024 (E = 1.82, A = 482, B = 2085, α = 0.348, β = 0.366), which puts the best split near 20 tokens per parameter. Chinchilla used 70 billion parameters and 1.4 trillion tokens and outperformed the 280-billion-parameter Gopher on the evaluations reported, at the same training compute budget. Training-optimal allocation does not automatically minimize the cost of serving many future answers.",
    "sourceNote": "Abstract and Sections 2–4: compute allocation, fitted loss, Chinchilla training and comparison with Gopher."
  },
  "open-models": {
    "headline": "Get the weights. Make it yours.",
    "problem": "Using a model through a website is one thing. Running it yourself is another. For that, you need its weights—the numbers it learned during training. Making your own from scratch can cost a lot.",
    "idea": [
      "Releasing model weights lets other researchers run, study and adapt an existing model. LLaMA (2023) presented models from 7 to 65 billion parameters trained using publicly available datasets.",
      "Access comes in degrees. A weights release, a dataset release and permission for a particular use are separate questions. OPT and BLOOM belong in this story too; “open” does not mean every release has identical terms."
    ],
    "diagram": [
      "Shared weights",
      "Your hardware",
      "Study and adapt"
    ],
    "play": "Will it run on my laptop?",
    "mattered": "A downloadable model makes experimentation less dependent on an API. Memory remains a practical constraint. Next, GPT-4 shows a model reading pictures as well as text.",
    "deeperTitle": "Weights are only the start",
    "deeper": "Weight storage in bytes is N × b / 8, where b is bits per weight. Quantization stores numbers at lower precision. The game counts weights only, in decimal GB, and keeps a quarter of memory (at least 2 GB) for the system, activations and the KV cache; it predicts no quality or speed. LLaMA reports that its 13B model outperformed GPT-3 on most of its benchmarks. That is an evaluation-specific result, not a claim that every smaller model is better. The original release was aimed at researchers; inspect each release’s actual license before assuming reuse rights. LoRA (2021) offers a way to adapt a model without training all its weights: keep the original weights fixed and learn a small update represented by two narrow matrices. This reduces trainable parameters; the original weights still need to be stored. The game does not simulate LoRA training.",
    "sourceNote": "Abstract and model section: size range, training data and benchmark comparison. OPT and BLOOM papers explain their respective release motivations and access approaches. Hu et al., LoRA, Abstract and Section 4: freezing pretrained weights and training low-rank matrix updates."
  },
  "mixture-of-experts": {
    "headline": "A bigger team. A smaller shift.",
    "problem": "Must every part of a model work on every piece of text? What if it could send each piece to just one of several helpers?",
    "idea": [
      "A mixture of experts replaces some network blocks with several alternatives. A router chooses which expert, a small neural network, will process each token. Switch Transformers (2021) simplified this to one selected expert per token.",
      "The idea is older than Switch: Jacobs, Jordan, Nowlan and Hinton trained a gate to pick among expert networks in 1991, and Shazeer and colleagues put thousands of sparsely gated experts into a language model in 2017. Recent open models such as Mixtral (2024) still use it, sending each token to two of eight experts.",
      "These experts learn; they are not manually assigned subjects such as history or maths. Routing must also share work sensibly. If everyone queues for the same expert, some capacity sits idle while another expert overflows."
    ],
    "diagram": [
      "Token",
      "Router chooses",
      "One expert runs"
    ],
    "play": "Router rush.",
    "mattered": "Sparse activation separates total capacity from work per token. It still has storage and communication costs. Next, people teach a model which answers they prefer.",
    "deeperTitle": "Routing and capacity",
    "deeper": "Switch chooses the expert with the largest router probability and scales its output by that probability. It uses a balancing loss and a per-expert capacity limit; overflowing tokens can bypass the expert transformation through a residual connection. The game’s timings and scores are invented, and its comparison router is a hand-written rule, not a trained router or the complete layer. The paper reports up to 7× pretraining speed gains in its T5-based comparisons; this is not a universal inference speedup. All expert weights still need storage.",
    "sourceNote": "Sections 2–3: top-one routing, expert capacity, balancing and stability; abstract and experiments: the qualified pretraining speed comparison."
  },
  "tools-and-agents": {
    "headline": "An answer can take a detour.",
    "problem": "A model asked to total a shopping bill needs both the prices and the arithmetic. Fluent text alone does not provide either one reliably. A program that can look up a price and multiply numbers can help.",
    "idea": [
      "ReAct interleaves reasoning, actions and observations. An action calls a tool; the observation is the result returned to the model. The next step can use that new information. The work appeared in 2022 and at ICLR in 2023.",
      "An agent is a system that chooses actions toward a goal. In the toy, you make those choices yourself. A tool call is useful only if it is the right call with the right inputs, and the result actually supports the answer."
    ],
    "diagram": [
      "Choose an action",
      "Read observation",
      "Choose next action"
    ],
    "play": "Be the agent.",
    "mattered": "This gives a language interface a way to gather information and act on it. Toolformer explored training models to insert useful API calls. Next, a language model reaches the public as a conversation.",
    "deeperTitle": "The loop and its limits",
    "deeper": "A ReAct trajectory alternates thought, action and observation in the prompt. Its experiments cover question answering and interactive environments, reporting benefits from combining reasoning with acting. Toolformer generates candidate API calls and filters them using their effect on prediction loss. Neither approach makes arbitrary tools reliable. The game’s three tools are local functions with invented results; they contact no services and make no purchases. Skipping the price lookup forces a guess, which is the mistake the no-tools model makes.",
    "sourceNote": "ReAct abstract and method: interleaved trajectories and evaluated tasks. Toolformer abstract and method: API-call generation and filtering."
  },
  "dpo": {
    "headline": "Teach the comparison directly.",
    "problem": "Suppose people choose the clearer of two answers. Can the model learn straight from that choice, with fewer steps in between?",
    "idea": [
      "Direct Preference Optimization (DPO, 2023) trains on a preferred and a rejected answer. It compares how much the model favors each answer relative to a fixed reference model, then adjusts the model using a single training objective.",
      "The reference is the starting point used to measure the change. A preference says which answer people chose; it is not proof that the answer is true. Better comparisons still matter."
    ],
    "diagram": [
      "Chosen + rejected",
      "Compare to reference",
      "Update the model"
    ],
    "play": "Pick the better answer.",
    "mattered": "DPO simplifies the training procedure by removing the separately fitted reward model and the reinforcement-learning sampling loop during this training stage. The next chapter trains a model to spend more computation before it answers.",
    "deeperTitle": "A pairwise objective",
    "deeper": "For prompt x and answers w (preferred) and l (rejected), let Δ = log[π(w|x)/πref(w|x)] − log[π(l|x)/πref(l|x)]. DPO minimizes −log σ(βΔ), where σ is the logistic function and β controls the objective’s scaling relative to the reference. The game fixes β = 1 and describes each answer by two traits, helpful and pirate flair. Each pick takes the gradient step θ ← θ + 2(1 − σ(Δ))(φw − φl), where φ marks which traits an answer has. It trains a two-trait policy, not a language model. The paper reports competitive or better results than PPO on its preference tasks. Dataset bias and generalization remain limitations.",
    "sourceNote": "Sections 3–4 and Equation 7: reference-relative preference objective. Experiments: comparisons with PPO and preference datasets."
  },
  "chain-of-thought": {
    "headline": "Leave room for the middle.",
    "problem": "An answer-only example hides how the answer was reached. For a question with several operations, the reader may need to keep track of an intermediate quantity.",
    "idea": [
      "Chain-of-thought prompting supplies examples with intermediate reasoning steps before the final answer. Wei and colleagues showed in 2022 that this could improve arithmetic, commonsense and symbolic reasoning in sufficiently large language models.",
      "The prompt supplies a pattern for working through a problem; it does not update the model’s weights. Written steps also let a reader check the work: in the game, each solution hides one wrong step."
    ],
    "diagram": [
      "Question",
      "Intermediate steps",
      "Final answer"
    ],
    "play": "Spot the wrong step.",
    "mattered": "Intermediate text creates space to break a problem into parts. It can also contain mistakes. The next chapter returns to training budgets: how large a model should be for the text it reads.",
    "deeperTitle": "Prompting is not a guarantee",
    "deeper": "The paper compares standard few-shot prompting with demonstrations containing reasoning steps. Its 540B-parameter model with eight chain-of-thought examples achieved a then-leading GSM8K result. Benefits depend on model scale and task; plausible steps can still be wrong. The game’s worked solutions are written by hand with one planted error each, and spotting them does not measure the paper’s effect. A visible explanation should be checked rather than assumed to faithfully reveal every internal computation.",
    "sourceNote": "Abstract and Sections 2–4: prompting method, model-scale dependence and arithmetic, commonsense and symbolic results. The receipt and its deliberate mistake are teaching examples."
  },
  "reasoning": {
    "headline": "Spend time before the answer.",
    "problem": "A quick guess may be enough for a familiar question. A multi-step puzzle can benefit from trying a candidate, checking it, and trying another. That takes computation while answering, not just while training.",
    "idea": [
      "OpenAI’s o1 announcement in September 2024 described reinforcement learning for reasoning and improved performance with more training and test-time computation. Reinforcement learning adjusts behavior using rewards for outcomes.",
      "DeepSeek-R1 (2025) explored this direction with R1-Zero, trained with reinforcement learning without preliminary supervised fine-tuning, and R1, which also used cold-start examples and further training stages. More thinking can help, but neither longer text nor extra attempts guarantees a correct answer."
    ],
    "diagram": [
      "Try a candidate",
      "Check the result",
      "Keep or revise"
    ],
    "play": "Reach the target.",
    "mattered": "Training can encourage useful reasoning behavior, while answering can spend additional compute exercising it. Our search toy makes that second budget visible. The timeline’s next chapter brings together models, tools and changing compute tradeoffs.",
    "deeperTitle": "Learning and searching are different",
    "deeper": "R1-Zero uses Group Relative Policy Optimization and rule-based rewards on tasks where answers can be checked. R1 adds cold-start data and a multi-stage pipeline to address problems including poor readability and language mixing. The report describes performance comparable to o1-1217 on its reasoning evaluations. The game’s tree is a plain depth-first search over arithmetic moves; it is not GRPO, chain-of-thought generation or either model’s inference algorithm. Searching longer helps only when a valid path exists and the checker is sound.",
    "sourceNote": "R1 report Sections 2–3: R1-Zero, GRPO, rewards, R1 pipeline and evaluations. OpenAI’s o1 announcement: training-time and test-time compute trends."
  }
};
