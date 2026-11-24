import '../i18n/preact';
import '../styles/games/gpt-4.css';
import { useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import GoalBar from "./game/GoalBar";
import ResultCard, { type GameResult } from "./game/ResultCard";
import { markPlayed } from "../lib/progress";

export const TILES = 9;
export type Picture = { caption: string; answer: string; choices: string[]; clues: Record<string, string[]>; tiles: string[] };
// Tile descriptions (row by row) let screen-reader players see what each opened tile shows.
export const pictures: Picture[] = [
  {
    caption: "A windy day by the sea", answer: "Lighthouse", choices: ["Sailing boat", "Lighthouse", "Rocket", "Candle"],
    clues: { "Sailing boat": ["sea", "windy", "water", "sail"], Lighthouse: ["night", "coast", "light"], Rocket: ["space", "launch"], Candle: ["dark", "birthday"] },
    tiles: ["A seagull and a yellow beam of light", "A glowing yellow lamp under a dark pointed roof", "A yellow beam of light across the sky", "A small cloud", "Red and white stripes on a narrow tower", "Empty sky", "Blue waves", "The base of a tower with a door, on rocks", "A small sailing boat on the waves"],
  },
  {
    caption: "A cold morning in the garden", answer: "Snowman", choices: ["Ice-cream cone", "Sheep", "Snowman", "Bowling pins"],
    clues: { Snowman: ["cold", "snow", "winter"], "Ice-cream cone": ["summer", "sweet"], Sheep: ["farm", "field", "wool"], "Bowling pins": ["game", "alley"] },
    tiles: ["Falling snowflakes", "A black hat on a round white head with an orange nose", "Falling snowflakes", "A thin dark stick, like a twig", "A red scarf and black buttons on something white and round", "A thin dark stick with a forked end", "Snow on the ground", "A big white ball sitting in snow", "Snow on the ground"],
  },
  {
    caption: "A bright idea for the weekend", answer: "Hot-air balloon", choices: ["Light bulb", "Jellyfish", "Parachute", "Hot-air balloon"],
    clues: { "Hot-air balloon": ["sky", "float", "fly"], "Light bulb": ["bright", "idea", "lamp"], Jellyfish: ["sea", "sting"], Parachute: ["jump", "drop"] },
    tiles: ["The curved edge of something red and round", "The top of a big red dome", "The curved edge of something red and round", "A red curved edge and open sky", "Yellow and blue stripes narrowing towards the bottom", "A red curved edge and open sky", "A small white cloud", "A woven basket hanging from two ropes", "Open sky with two birds"],
  },
];

// Fewer tiles, more points: 8 for one tile, nothing for a wrong name.
export const pictureScore = (revealed: number, correct: boolean) => correct && revealed > 0 ? Math.max(0, TILES - revealed) : 0;
// The text-only model never sees a tile: it matches caption words to each choice's usual words.
export function textModelGuess(picture: Pick<Picture, "caption" | "choices" | "clues">) {
  const words = new Set(picture.caption.toLowerCase().match(/[a-z]+/g) ?? []);
  let best = picture.choices[0]!, bestHits = -1;
  for (const choice of picture.choices) {
    const hits = (picture.clues[choice] ?? []).filter(word => words.has(word)).length;
    if (hits > bestHits) { best = choice; bestHits = hits; }
  }
  return best;
}
// Points are 27 minus tiles used when all three are right: three stars means 5 tiles or fewer in all.
export const visionStars = (points: number): 0 | 1 | 2 | 3 => points >= 22 ? 3 : points >= 18 ? 2 : points >= 8 ? 1 : 0;
export function visionResult(points: number, correct: number, tiles: number, textRight: number): GameResult {
  return {
    slug: "gpt-4",
    headline: `I named ${correct} / ${pictures.length} pictures from ${tiles} tiles.`,
    detail: `The text-only model, reading only the captions, got ${textRight} / ${pictures.length}.`,
    score: { value: points, max: pictures.length * (TILES - 1), label: "Points" },
    stars: visionStars(points),
    shareText: `I named ${correct}/${pictures.length} pictures from just ${tiles} tiles. A text-only model, reading only the captions, got ${textRight}/${pictures.length}.`,
  };
}

const ink = { stroke: "var(--ink)", "stroke-width": 3, "stroke-linejoin": "round" } as const;
const art: (() => JSX.Element)[] = [
  () => <g>
    <path d="M18 42q11-12 22 0q11-12 22 0" fill="none" {...ink} />
    <polygon points="132,52 0,18 0,86" fill="var(--era-counting)" opacity=".45" /><polygon points="168,52 300,18 300,86" fill="var(--era-counting)" opacity=".45" />
    <ellipse cx="45" cy="150" rx="34" ry="14" fill="var(--surface)" {...ink} />
    <rect x="0" y="210" width="300" height="90" fill="var(--era-chat)" />
    <path d="M10 240q15-10 30 0t30 0M200 270q15-10 30 0t30 0M20 285q15-10 30 0t30 0" fill="none" stroke="var(--surface)" stroke-width="3" />
    <ellipse cx="150" cy="258" rx="62" ry="16" fill="var(--muted)" {...ink} />
    <polygon points="135,70 165,70 180,250 120,250" fill="var(--surface)" {...ink} />
    <polygon points="132.5,100 167.5,100 170,130 130,130" fill="var(--era-scale)" /><polygon points="127.5,160 172.5,160 175,190 125,190" fill="var(--era-scale)" /><polygon points="122.5,220 177.5,220 180,250 120,250" fill="var(--era-scale)" />
    <polygon points="135,70 165,70 180,250 120,250" fill="none" {...ink} />
    <rect x="143" y="226" width="14" height="24" fill="var(--ink)" />
    <rect x="130" y="40" width="40" height="30" fill="var(--era-counting)" {...ink} /><polygon points="124,40 150,14 176,40" fill="var(--ink)" />
    <path d="M222 236h52l-8 12h-38z" fill="var(--era-scale)" {...ink} /><path d="M246 236v-36l24 30z" fill="var(--surface)" {...ink} />
  </g>,
  () => <g>
    <g fill="var(--muted)">{[[20, 20], [60, 55], [35, 85], [230, 25], [270, 60], [245, 88], [85, 15], [215, 70]].map(([x, y]) => <circle cx={x} cy={y} r="4" />)}</g>
    <ellipse cx="150" cy="292" rx="200" ry="44" fill="var(--surface)" {...ink} />
    <path d="M112 135L42 98M60 108l-14-20M188 135l72-40M240 106l26 4M240 106l10-24" fill="none" {...ink} />
    <circle cx="150" cy="228" r="55" fill="var(--surface)" {...ink} />
    <circle cx="150" cy="142" r="40" fill="var(--surface)" {...ink} />
    <g fill="var(--ink)"><circle cx="150" cy="130" r="4" /><circle cx="150" cy="148" r="4" /><circle cx="150" cy="166" r="4" /></g>
    <path d="M118 104h64v12h-64zM168 110l10 34h-14z" fill="var(--era-scale)" {...ink} />
    <circle cx="150" cy="74" r="28" fill="var(--surface)" {...ink} />
    <g fill="var(--ink)"><circle cx="140" cy="68" r="3.5" /><circle cx="160" cy="68" r="3.5" /><rect x="128" y="22" width="44" height="26" /><rect x="116" y="44" width="68" height="7" /></g>
    <polygon points="150,76 186,82 150,86" fill="var(--era-counting)" {...ink} />
  </g>,
  () => <g>
    <path d="M30 248c-16 0-16-22 2-20 4-14 28-12 30 0 16-2 18 20 2 20z" fill="var(--surface)" {...ink} />
    <path d="M222 240q8-8 16 0q8-8 16 0M246 268q6-6 12 0q6-6 12 0" fill="none" {...ink} />
    <path d="M150 22C55 22 52 140 108 178L136 214H164L192 178C248 140 245 22 150 22Z" fill="var(--era-scale)" {...ink} />
    <path d="M150 22C112 22 104 140 126 182L140 214H160L174 182C196 140 188 22 150 22Z" fill="var(--era-counting)" />
    <path d="M150 22C136 22 132 140 142 186L146 214H154L158 186C168 140 164 22 150 22Z" fill="var(--era-chat)" />
    <path d="M150 22C55 22 52 140 108 178L136 214H164L192 178C248 140 245 22 150 22Z" fill="none" {...ink} />
    <path d="M138 214L134 252M162 214L166 252" fill="none" {...ink} />
    <rect x="128" y="250" width="44" height="32" rx="3" fill="var(--era-counting)" {...ink} />
    <path d="M128 262h44M128 272h44M142 250v32M158 250v32" fill="none" stroke="var(--ink)" stroke-width="1.5" />
  </g>,
];

type Guess = { revealed: number; choice: string; correct: boolean; text: string };

export default function VisionToy() {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<number[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const played = useRef(false);
  const touch = () => { if (!played.current) { played.current = true; markPlayed("gpt-4"); } };
  const picture = pictures[index]!;
  const guess = guesses[index];
  const points = guesses.reduce((sum, g) => sum + pictureScore(g.revealed, g.correct), 0);
  const reveal = (tile: number) => { touch(); setOpen(current => current.includes(tile) ? current : [...current, tile]); };
  const choose = (choice: string) => setGuesses(current => [...current, { revealed: open.length, choice, correct: choice === picture.answer, text: textModelGuess(picture) }]);
  const next = () => {
    if (index + 1 < pictures.length) { setIndex(index + 1); setOpen([]); return; }
    const correct = guesses.filter(g => g.correct).length;
    setResult(visionResult(points, correct, guesses.reduce((sum, g) => sum + g.revealed, 0), guesses.filter((g, i) => g.text === pictures[i]!.answer).length));
  };
  const restart = () => { setIndex(0); setOpen([]); setGuesses([]); setResult(null); };
  const used = guess ? guess.revealed : open.length;
  const status = used === 1 ? `Picture ${index + 1} / ${pictures.length} · 1 tile used` : `Picture ${index + 1} / ${pictures.length} · ${used} tiles used`;
  return <div class="vision-game">
    <GoalBar goal="Name each picture with as few tiles as you can. A text-only model guesses from the caption." status={status} score={{ value: points, label: "Points" }} />
    {result ? <ResultCard result={result} onReplay={restart} /> : <div class="vision-board">
      <figure class="vision-picture">
        <svg viewBox="0 0 300 300" aria-hidden="true"><rect width="300" height="300" fill="var(--paper)" />{art[index]!()}</svg>
        <div class="vision-tiles" role="group" aria-label="Picture tiles">{picture.tiles.map((description, tile) => guess || open.includes(tile)
          ? <span key={tile} class="vision-tile is-open" role="img" aria-label={`Tile ${tile + 1}: ${description}`} />
          : <button key={tile} type="button" class="vision-tile" aria-label={`Reveal tile ${tile + 1}`} onClick={() => reveal(tile)}><span aria-hidden="true">?</span></button>)}
        </div>
        <figcaption><span>Caption</span> “<bdi>{picture.caption}</bdi>”</figcaption>
      </figure>
      <div class="vision-side">
        {!guess ? <>
          <p id="vision-ask">{open.length === 0 ? "Tap a tile to reveal it, then name the picture." : "What’s in the picture?"}</p>
          <div class="game-choices" role="group" aria-labelledby="vision-ask">{picture.choices.map(choice => <button type="button" key={choice} disabled={open.length === 0} onClick={() => choose(choice)}>{choice}</button>)}</div>
        </> : <div class="vision-verdict" aria-live="polite">
          <div class="game-choices" role="group" aria-label="Your answer">{picture.choices.map(choice => <button type="button" key={choice} disabled class={choice === picture.answer ? "is-right" : choice === guess.choice ? "is-wrong" : ""}>{choice}</button>)}</div>
          <p class="vision-you">{guess.correct ? (guess.revealed === 1 ? "Right, from 1 tile." : `Right, from ${guess.revealed} tiles.`) : `Not quite. The answer is ${picture.answer}.`} <b dir="ltr">{`+${pictureScore(guess.revealed, guess.correct)}`}</b></p>
          <p class="vision-text-model"><span>Text-only model</span> {guess.text === picture.answer ? `Guessed “${guess.text}” from the caption. Lucky.` : `Guessed “${guess.text}” from the caption. Wrong.`}</p>
          <button type="button" class="game-btn is-primary" onClick={next}>{index + 1 < pictures.length ? "Next picture" : "See your score"}</button>
        </div>}
      </div>
    </div>}
    <p class="toy-note">Drawn scenes. The “text-only model” is a word-matching rule that reads the caption, not GPT-4.</p>
  </div>;
}
