# Launch redesign: shared contract

This file is the single source of truth for the November 2026 launch redesign. Every change in
this work stream builds against the names and shapes below. If something here is wrong, report it;
don't invent a second version.

## Direction

The site keeps its identity (warm paper, ink, lime, Space Grotesk + DM Sans) and becomes a
**game-first** site: every chapter opens on a game with a goal, every game ends on a result you can
share, and the home page is playable within five seconds.

- **Bolder, not louder.** Large display type, generous space, one accent colour per era, flat
  surfaces with a 2px ink outline and a hard offset shadow for interactive "cards" (`box-shadow: 4px
  4px 0 var(--ink)`), pill buttons. No gradients-on-everything, no glassmorphism, no emoji as
  decoration in UI chrome, no stock illustrations.
- **Light and dark.** Both themes come from tokens. No hard-coded colours in component CSS.
- **One honest line per game.** Each game keeps exactly one short honesty note (for example "A toy
  model with invented numbers."), styled with `.toy-note`. Remove repeated disclaimers.
- **Motion.** Short (≤ 300 ms), purposeful, disabled under `prefers-reduced-motion: reduce`.
- **Touch first.** Every control is at least 44 × 44 px on phones. Layouts work at 320 px wide.

## Tokens (defined in `src/styles/lineage.css`)

```
--paper --surface --ink --muted --line --accent --deep       existing, now theme-aware
--on-accent                                                    text colour on --accent
--good --bad                                                   win / lose states
--era-counting --era-memory --era-attention --era-scale --era-chat --era-agents
--radius (12px)  --radius-pill (999px)  --shadow-hard (4px 4px 0 var(--ink))
--display --body --space                                       existing
```

Theme switching: `prefers-color-scheme: dark` sets dark values on `:root:not([data-theme="light"])`;
`:root[data-theme="dark"]` forces dark and `:root[data-theme="light"]` forces light. The header
toggle stores `light` / `dark` in `localStorage["lineage-theme"]` (wrapped in try/catch), and an
inline head script applies it before first paint.

## Eras (defined in `src/lib/chapter-meta.ts`)

| id | label | years |
|---|---|---|
| `counting` | Counting | ≤ 1989 |
| `memory` | Memory | 1990–2013 |
| `attention` | Attention | 2014–2017 |
| `scale` | Scale | 2018–2021 |
| `chat` | Chat | 2022–2023 |
| `agents` | Reasoning & agents | 2024 → |

Era colours (light theme; dark theme uses the same hue, lifted for contrast on dark surfaces). Text
on an era colour or on `--accent` always uses `--on-accent` (dark in both themes); never `--ink`,
which turns light in dark mode. Two more tokens exist: `--ink-accent` (lime text on ink panels) and
`--backdrop` (dialog backdrop).

| token | light |
|---|---|
| `--era-counting` | `#e8a33d` |
| `--era-memory` | `#4fa3a5` |
| `--era-attention` | `#8a7ff0` |
| `--era-scale` | `#e8714f` |
| `--era-chat` | `#4b95e0` |
| `--era-agents` | `#b9e64b` |

Social images and the canvas result image use the light values.

## `src/lib/chapter-meta.ts` (client-safe, no imports)

```ts
export type Era = 'counting'|'memory'|'attention'|'scale'|'chat'|'agents';
export const eras: {id:Era; label:string; from:number; to:number}[];
export type ChapterMeta = {slug:string; title:string; year:number; month:number; era:Era};
export const chapterMeta: ChapterMeta[];          // chronological by year, then month
export function metaFor(slug:string): ChapterMeta|undefined;
export function nextChapter(slug:string): ChapterMeta|undefined;  // chronological, undefined at the end
export function eraOf(year:number): Era;
```

`src/lib/chapters.ts` takes order, year and title from `chapterMeta`. Never import
`chapters.ts` from a client component: it pulls in the 3.9 MB corpus.

## `src/lib/progress.ts` (client-safe)

```ts
export type ChapterProgress = {played:boolean; completed:boolean; best?:string; stars?:0|1|2|3};
export function getProgress(): Record<string,ChapterProgress>;
export function markPlayed(slug:string): void;
export function markCompleted(slug:string, result:{best?:string; stars?:0|1|2|3}): void;
export function onProgress(listener:()=>void): ()=>void;   // returns unsubscribe
```

Stored in `localStorage["lineage-progress-v1"]`, every access wrapped in try/catch so a blocked
storage never breaks a page. `markCompleted` keeps the best stars.

## Game kit: `src/components/game/`

All games use these so they look and behave the same. Styles live in `src/styles/game.css`,
imported by the components.

```ts
// GoalBar.tsx: the strip above every game
export default function GoalBar(props:{
  goal:string;                 // "Make the model guess you less than half the time."
  status?:string;              // live progress, e.g. "Round 3 / 10" or "Best: 2 moves"
  score?:{value:number; max?:number; label:string};
}): JSX.Element;

// ResultCard.tsx: shown when a game ends
export type GameResult = {
  slug:string;                 // chapter slug
  headline:string;             // "It predicted you 71% of the time."
  detail?:string;              // one sentence of what that means
  score?:{value:number; max?:number; label:string};
  stars?:0|1|2|3;
  shareText:string;            // post text WITHOUT the link; the card appends the chapter URL
};
export default function ResultCard(props:{result:GameResult; onReplay:()=>void}): JSX.Element;
```

`ResultCard` calls `markCompleted` when it mounts. It shows the headline, the era badge (from
`metaFor(slug)`), stars, **Share on X** (an `https://x.com/intent/post?text=…&url=…` link that
opens in a new tab), **Copy link**, **Save image** (a 1200 × 630 PNG drawn on a canvas in the
browser, then downloaded), **Play again** and **Next: <year> · <title> →** (from `nextChapter`).
Game components call `markPlayed(slug)` on first interaction.

## Social images

Build-time PNGs, 1200 × 630, served at `/og/home.png` and `/og/<slug>.png` for every chapter.
`LineageLayout.astro` takes an optional `image` prop (a site path such as `/og/bert.png`) and
writes absolute `og:image`, `twitter:image`, `og:url`, canonical and `hreflang` tags from
`Astro.site` plus the base path.

## Translations

The site ships in English, Chinese (`zh`) and Arabic (`ar`). Translation is exact-string lookup
(see `src/i18n/core.ts` and `src/i18n/server.ts`):

- Strings rendered on a chapter page go in `src/i18n/{zh,ar}/<slug>.json` under `text` (plain) or
  `rich` (inner HTML).
- Shared strings go in `src/i18n/{zh,ar}/shared-<area>.json` (same `{rich,text}` shape). The
  server merges every `shared-*.json` file on every page, so each work area owns its own file and
  no two agents edit the same one.
- Strings that contain numbers use templates: key `"Round {0} / {1}"`, value `"第 {0} / {1} 轮"`.
  Write the English string in code exactly as the key, with the numbers substituted.
- Every new user-visible English string gets a zh and an ar entry in the same change. Example
  words that the toy reads (sentences a model processes) stay in English.

## Budgets (enforced by `scripts/check-build.mjs`)

Per route: ≤ 40,960 compressed bytes of client JS, ≤ 512 KiB compressed HTML. Large data that only
one game needs is fetched lazily from `public/data/` at runtime, never bundled.

## Chapter order

Chronological by year then month everywhere: home grid numbering, explorer, dock, Next links.
