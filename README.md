# LLM Lineage

An interactive history of how language models happened, from letter counts to modern assistants. Follow 30 turning points on the timeline and play with each idea in a small browser experiment.

The first live chapter is **[The Transformer](/chapters/transformer/)**: change an attention query, hide future words, and watch the weighted read change. Other chapters have coming-soon pages with links to their anchor papers.

Each live chapter has a question, the problem before, the big idea, a labeled toy, and why it mattered. Collapsed “Go deeper” and “Sources” sections provide equations, architecture details, results, limitations, and original sources. Earlier reading-mode URLs redirect to the new chapter pages.

## Develop

```sh
npm install
npm run dev
```

Built with Astro and Preact. Chapter metadata lives in `src/lib/chapters.ts`. Existing paper facts and links come from `data/corpus.json`; additional primary sources are listed in `src/lib/chapter-papers.ts`.

## Check

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite checks the timeline and live chapter at desktop and narrow phone widths, exercises pointer, touch, and keyboard controls, checks redirects and console errors, and saves screenshots locally. The older research components and their unit tests remain available in the source tree.
