# How LLMs happened

**English** · [简体中文](README.zh-CN.md) · [العربية](README.ar.md)

**[Play it in your browser →](https://thesybuilder.github.io/how-llms-happened/)**

### How did counting letters turn into a machine you can talk to?

LLM Lineage tells the history of large language models as 32 tiny browser games, from Markov counting vowels in Pushkin in 1913 to the agents of 2026. Every game is built on a real paper, has a goal, and ends with a result you can share.

**32 games · 1913 → 2026 · No ML background needed · English, 简体中文, العربية**

![The home page: "Are you smarter than GPT-2?" next to the headline, with the era timeline below](docs/images/home.png)

## Start with a challenge

The home page opens on **Are you smarter than GPT-2?** You get ten sentences and pick the real next word from four options before the timer runs out. GPT-2 small's choices were recorded once from the real 124M-parameter model, so you play against what it actually picked. Nothing runs live.

Then pick a game from the timeline. A few favourites:

| Game | Year | The idea it teaches |
| --- | --- | --- |
| **Can you be random?** Press A or B thirty times while a 1913 counting trick predicts you. | 1913 | Markov chains |
| **Break ELIZA.** Catch the first chatbot out with three of its tells. | 1966 | Pattern matching and the ELIZA effect |
| **Closest word.** A daily puzzle: find the secret word using real word-vector closeness. | 2013 | Word embeddings |
| **How many tokens is your name?** Type anything and watch real GPT-2 tokens appear. | 2016 | Byte-pair encoding |
| **Attention puzzles.** Steer which words a word listens to, in as few moves as you can. | 2017 | The Transformer |
| **Train a judge.** Teach a reward model, then watch it rate a confident falsehood as highly as the truth. | 2022 | Learning from human feedback |
| **Will it run on my laptop?** Find the biggest open model that fits your memory. | 2023 | Open weights and quantisation |
| **Reach the target.** Solve number puzzles, then see the search tree a reasoning model explores. | 2024 | Reasoning by search |

Each chapter opens on its game. **Story** explains the problem, the idea and what it changed. **Math & sources** has the equations and links to the original papers.

![A finished "Can you be random?" game: the result card reads "It predicted you 50% of the time." with buttons to share on X, copy the link, save an image or play again](docs/images/result-card.png)

<details>
<summary><strong>How honest are the games?</strong></summary>

<br />

The games are small teaching models, built so that one mechanism is visible. Most learn from tiny datasets or use hand-written rules, and each says so in one line under the game. Where a game uses real model data, the data is the real thing:

- **GPT-2 challenge:** next-word probabilities from GPT-2 small (124M), recorded with transformers.js on 11 November 2026 ([`scripts/record-gpt2.mjs`](scripts/record-gpt2.mjs)).
- **Tokens:** the GPT-2 byte-level BPE vocabulary and merges, checked against a reference tokenizer.
- **Closest word:** GloVe 6B 50-dimensional vectors, cut to about 5,000 common words.
- **Will it run on my laptop?:** parameter counts from each model's official card.

</details>

## Run it on your computer

You need **Node.js 22.12+** and **npm 9.6.5+**.

```sh
git clone https://github.com/TheSyBuilder/how-llms-happened.git
cd how-llms-happened
npm install
npm run dev
```

The site works in light and dark mode, on phones from 320 px wide, and with touch, mouse or keyboard. Arabic pages use right-to-left layouts.

<details>
<summary><strong>On a phone</strong></summary>

<br />
<img src="docs/images/home-mobile.png" width="320" alt="The home page on a phone in dark mode: the headline, then the GPT-2 challenge with four answer buttons" />

</details>

<details>
<summary><strong>For contributors: code and checks</strong></summary>

Built with **Astro + Preact**. The design and game-kit contract is in [`docs/launch-redesign.md`](docs/launch-redesign.md).

| Looking for… | Start here |
| --- | --- |
| Chapter order, years and eras | [`src/lib/chapter-meta.ts`](src/lib/chapter-meta.ts), [`src/lib/chapters.ts`](src/lib/chapters.ts) |
| Game names and first prompts | [`src/lib/first-steps.ts`](src/lib/first-steps.ts) |
| Shared goal bar, result card and progress | [`src/components/game/`](src/components/game/), [`src/lib/progress.ts`](src/lib/progress.ts) |
| Games and stories | [`src/components/`](src/components/) |
| Paper facts and links | [`data/corpus.json`](data/corpus.json), [`src/lib/chapter-papers.ts`](src/lib/chapter-papers.ts) |
| Translations | [`src/i18n/`](src/i18n/) |

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run build` also generates a 1200 × 630 social image per chapter (`/og/<slug>.png`) and audits links, anchors and per-page size budgets.

</details>

## Credits

Data: GPT-2 weights and tokenizer files by OpenAI (MIT licence); GloVe vectors by Pennington, Socher & Manning (Public Domain Dedication and License); the ENABLE word list (public domain). Fonts: Space Grotesk and DM Sans (SIL Open Font License). Every chapter links the papers it is built on.

## Help the next person understand

Found a moment that made an idea click, or a game that confused you? [Open an issue](https://github.com/TheSyBuilder/how-llms-happened/issues) with the chapter and what you tried. Corrections backed by original sources are welcome.

If you enjoyed it, a **star** helps other curious people find it.
