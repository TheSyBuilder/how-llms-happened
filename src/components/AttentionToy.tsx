import '../i18n/preact';
import '../styles/games/transformer.css';
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import GoalBar from "./game/GoalBar";
import ResultCard, { type GameResult } from "./game/ResultCard";
import { markPlayed } from "../lib/progress";

// Deliberately hand-chosen vectors: one attention head, not a trained language model.
export const words = ["The", "cat", "sat", "on", "the", "mat"];
const keys: readonly (readonly [number, number])[] = [
  [0, 0],
  [2, 0],
  [0, 2],
  [0, 1],
  [0, 0],
  [1, 0],
];
const values = [0, 1, 0, 0, 0, 1];

export function attend(direction: number, position: number, causal: boolean) {
  const q: [number, number] = [direction / 100, 1 - direction / 100];
  const matches = keys.map(k => (q[0] * k[0] + q[1] * k[1]) / Math.sqrt(2));
  const scores = matches.map((match, i) => causal && i > position ? -Infinity : match);
  const peak = Math.max(...scores);
  const exp = scores.map((score) => Math.exp(score - peak));
  const sum = exp.reduce((a, b) => a + b, 0);
  const weights = exp.map((value) => value / sum);
  const contributions = weights.map((weight, i) => weight * values[i]!);
  const largest = Math.max(...weights);
  return {
    query: q,
    matches,
    weights,
    contributions,
    strongestPositions: weights.flatMap((weight, i) => Math.abs(weight - largest) < 1e-12 ? [i] : []),
    mixture: contributions.reduce((sum, contribution) => sum + contribution, 0),
  };
}

// The query dial has six stops; each stop, word pick or mask flip is one move.
export const DIAL_STEP = 20;
export type Setup = { position: number; direction: number; causal: boolean };
type Read = ReturnType<typeof attend>;
export type Puzzle = { goal: string; start: Setup; target: number; solved: (setup: Setup, read: Read) => boolean };
export const puzzles: Puzzle[] = [
  { goal: "Stop “The” from seeing the future.", start: { position: 3, direction: 60, causal: false }, target: 0,
    solved: ({ position }, read) => position === 0 && read.weights.slice(1).every((weight) => weight === 0) },
  { goal: "Make “on” listen to “sat” more than to any other word.", start: { position: 0, direction: 100, causal: false }, target: 2,
    solved: ({ position }, read) => position === 3 && read.weights.every((weight, i) => i === 2 || weight < read.weights[2]!) },
  { goal: "Make “sat” put more than 60% of its attention on “cat”.", start: { position: 2, direction: 40, causal: false }, target: 1,
    solved: ({ position }, read) => position === 2 && read.weights[1]! > 0.6 },
  { goal: "Push the read of “on” above 0.50.", start: { position: 1, direction: 20, causal: true }, target: 3,
    solved: ({ position }, read) => position === 3 && read.mixture > 0.5 },
  { goal: "Give “cat” over half of the second “the”’s attention, with “mat” hidden.", start: { position: 2, direction: 60, causal: false }, target: 1,
    solved: ({ position }, read) => position === 4 && read.weights[5] === 0 && read.weights[1]! > 0.5 },
];

export const isSolved = (puzzle: Puzzle, setup: Setup) => puzzle.solved(setup, attend(setup.direction, setup.position, setup.causal));

// Breadth-first search over all 72 setups gives the fewest moves for a puzzle.
export function fewestMoves(puzzle: Puzzle) {
  const id = (s: Setup) => `${s.position},${s.direction},${s.causal}`;
  const queue: [Setup, number][] = [[puzzle.start, 0]];
  const seen = new Set([id(puzzle.start)]);
  while (queue.length) {
    const [setup, moves] = queue.shift()!;
    if (isSolved(puzzle, setup)) return moves;
    const next: Setup[] = [
      ...words.map((_, position) => ({ ...setup, position })).filter((s) => s.position !== setup.position),
      ...[setup.direction - DIAL_STEP, setup.direction + DIAL_STEP].filter((d) => d >= 0 && d <= 100).map((direction) => ({ ...setup, direction })),
      { ...setup, causal: !setup.causal },
    ];
    for (const s of next) if (!seen.has(id(s))) { seen.add(id(s)); queue.push([s, moves + 1]); }
  }
  return Infinity;
}

export const bestMoves = puzzles.map(fewestMoves);

export function puzzleStars(moves: number | null, best: number): 0 | 1 | 2 | 3 {
  if (moves === null) return 0;
  return moves <= best ? 3 : moves <= best + 2 ? 2 : 1;
}
// Overall: a skip caps the run at one star; otherwise extra moves over the five best solutions decide.
export function attentionStars(results: { moves: number | null; best: number }[]): 0 | 1 | 2 | 3 {
  const skipped = results.filter((r) => r.moves === null).length;
  if (skipped === results.length) return 0;
  if (skipped) return 1;
  const extra = results.reduce((sum, r) => sum + r.moves! - r.best, 0);
  return extra <= 2 ? 3 : extra <= 6 ? 2 : 1;
}

export function attentionHeadline(results: { moves: number | null; best: number }[]) {
  const solved = results.filter((r) => r.moves !== null);
  const total = solved.reduce((sum, r) => sum + r.moves!, 0);
  const extra = solved.reduce((sum, r) => sum + r.moves! - r.best, 0);
  if (solved.length < results.length) return `${solved.length} of 5 attention puzzles solved.`;
  return extra === 0 ? `All 5 attention puzzles in ${total} moves, the fewest possible.` : `5 attention puzzles in ${total} moves, ${extra} over the best.`;
}
export function attentionShare(results: { moves: number | null; best: number }[]) {
  const solved = results.filter((r) => r.moves !== null);
  if (solved.length < results.length) return `I solved ${solved.length} of 5 Transformer attention puzzles.`;
  return `I steered Transformer attention through 5 puzzles in ${solved.reduce((sum, r) => sum + r.moves!, 0)} moves. The fewest possible is ${results.reduce((sum, r) => sum + r.best, 0)}.`;
}

function Arcs({ weights, position, small = false }: { weights: number[]; position: number; small?: boolean }) {
  return (
    <svg class={small ? "attention-arcs tf-thumb-arcs" : "attention-arcs tf-arcs"} viewBox={small ? "0 0 600 155" : "0 0 600 110"} aria-hidden="true">
      {weights.map((weight, i) => weight > 0 && (
        <path d={`M ${50 + position * 100} 8 Q ${50 + i * 100} 20 ${50 + i * 100} 100`} fill="none" stroke="currentColor" stroke-width={(1 + weight * 15) * (small ? 2 : 1)} opacity={0.2 + weight * 0.8} />
      ))}
      {small && words.map((word, i) => <text x={50 + i * 100} y="140" text-anchor="middle" font-size="40" font-weight={i === position ? 700 : 400} fill="currentColor">{word}</text>)}
    </svg>
  );
}

type Solved = { setup: Setup; moves: number | null; best: number };

export default function AttentionToy() {
  const best = bestMoves;
  const [index, setIndex] = useState(0);
  const [setup, setSetup] = useState<Setup>(puzzles[0]!.start);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState<Solved[]>([]);
  const [inspected, setInspected] = useState(1);
  const [announce, setAnnounce] = useState("");
  const played = useRef(false);
  const nextButton = useRef<HTMLButtonElement>(null);
  const puzzle = puzzles[index];
  const finished = index >= puzzles.length;
  const current = done.length > index ? done[index] : undefined;
  const { query, matches, weights, contributions, strongestPositions, mixture } = attend(setup.direction, setup.position, setup.causal);
  const hidden = setup.causal && inspected > setup.position;
  useLayoutEffect(() => { if (current) nextButton.current?.focus(); }, [current]);

  const move = (change: Partial<Setup>, cost: number) => {
    if (!puzzle || current || cost === 0) return;
    if (!played.current) { played.current = true; markPlayed("transformer"); }
    const nextSetup = { ...setup, ...change };
    const total = moves + cost;
    setSetup(nextSetup);
    setMoves(total);
    if (isSolved(puzzle, nextSetup)) {
      const stars = puzzleStars(total, best[index]!);
      setDone([...done, { setup: nextSetup, moves: total, best: best[index]! }]);
      setAnnounce(`Puzzle ${index + 1} solved in ${total} moves. ${stars} of 3 stars.`);
    }
  };
  const skip = () => {
    if (!puzzle || current) return;
    setDone([...done, { setup, moves: null, best: best[index]! }]);
    setAnnounce(`Puzzle ${index + 1} skipped.`);
  };
  const advance = () => {
    const next = index + 1;
    setIndex(next);
    setAnnounce("");
    if (puzzles[next]) { setSetup(puzzles[next]!.start); setMoves(0); }
  };
  const restartPuzzle = () => { if (puzzle && !current) { setSetup(puzzle.start); setMoves(0); } };
  const replay = () => { setIndex(0); setSetup(puzzles[0]!.start); setMoves(0); setDone([]); setAnnounce(""); };

  const totalMoves = done.reduce((sum, r) => sum + (r.moves ?? 0), 0);
  const result: GameResult = {
    slug: "transformer",
    headline: attentionHeadline(done),
    detail: "Each puzzle steered one query against fixed keys. Softmax turned the matches into shares that add up to 100%.",
    score: { value: totalMoves, label: "Total moves" },
    stars: attentionStars(done),
    shareText: attentionShare(done),
  };

  return (
    <div class="attention-toy tf-game">
      <GoalBar
        goal={finished ? "Five attention puzzles, done." : puzzle!.goal}
        status={finished ? `Total: ${totalMoves} moves` : `Puzzle ${index + 1} / 5 · best ${best[index]} moves`}
        score={{ value: finished ? totalMoves : moves, label: "Moves" }}
      />
      <p class="tf-live screen-reader-only" role="status">{announce}</p>
      {finished ? (
        <>
          <ol class="tf-gallery" aria-label="Your five solutions">
            {[done.length - 1, ...done.keys()].slice(0, done.length).map((i) => {
              const r = done[i]!;
              const read = attend(r.setup.direction, r.setup.position, r.setup.causal);
              return <li key={i} dir="ltr"><Arcs weights={read.weights} position={r.setup.position} small /><span>{r.moves === null ? `${i + 1} · skipped` : `${i + 1} · ${r.moves} moves`}</span></li>;
            })}
          </ol>
          <ResultCard result={result} onReplay={replay} />
        </>
      ) : (
        <>
          <div class="tf-board" dir="ltr">
            <fieldset class="token-picker">
              <legend>Which word is looking?</legend>
              <div class="tokens">
                {words.map((word, i) => (
                  <button type="button" aria-pressed={setup.position === i} aria-label={`${word}, word ${i + 1}`} class={i === puzzle!.target ? "tf-target" : undefined} onClick={() => move({ position: i }, setup.position === i ? 0 : 1)}>
                    {word}<span>{i + 1}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <Arcs weights={weights} position={setup.position} />
            <div class="weight-grid" role="group" aria-label="Attention weights">
              {words.map((word, i) => (
                <div class={`weight-cell${setup.causal && i > setup.position ? " is-masked" : ""}${i === puzzle!.target ? " tf-target" : ""}`}>
                  <span>{word}</span>
                  <div class="weight-track"><span style={{ height: `${weights[i]! * 100}%` }} /></div>
                  <output aria-label={`Weight for word ${i + 1}`}>{setup.causal && i > setup.position ? "Hidden" : `${(weights[i]! * 100).toFixed(0)}%`}</output>
                </div>
              ))}
            </div>
          </div>
          <div class="tf-controls">
            <label for="query-direction" class="tf-dial-label">
              What is it looking for? <output for="query-direction">{setup.direction < 50 ? "Actions" : setup.direction > 50 ? "Things" : "Both"}</output>
            </label>
            <input id="query-direction" dir="ltr" type="range" min="0" max="100" step={DIAL_STEP} value={setup.direction} disabled={!!current}
              onInput={(event) => { const value = Number(event.currentTarget.value); move({ direction: value }, Math.abs(value - setup.direction) / DIAL_STEP); }}
              aria-valuetext={`${100 - setup.direction}% actions, ${setup.direction}% things`} />
            <div class="range-ends" dir="ltr"><span>More like “sat”</span><span>More like “cat”</span></div>
            <button type="button" class="game-btn tf-mask" aria-pressed={setup.causal} disabled={!!current} onClick={() => move({ causal: !setup.causal }, 1)}>Hide future words</button>
            <div class="game-meter tf-read">
              <span class="game-meter-label">Read (cat and mat carry 1, the rest 0) <b dir="ltr">{mixture.toFixed(2)}</b></span>
              <span class="game-meter-track"><span class="game-meter-fill" style={`--value:${mixture}`}></span></span>
            </div>
          </div>
          {current ? (
            <div class="tf-solved">
              <p class="tf-solved-line"><strong>{current.moves === null ? "Skipped." : `Solved in ${current.moves} moves.`}</strong> <span class="tf-stars" aria-hidden="true">{"★".repeat(puzzleStars(current.moves, current.best)) + "☆".repeat(3 - puzzleStars(current.moves, current.best))}</span> <span>{`The fewest possible is ${current.best}.`}</span></p>
              <button type="button" class="game-btn is-primary" ref={nextButton} onClick={advance}>{index + 1 < puzzles.length ? "Next puzzle" : "See your result"}</button>
            </div>
          ) : (
            <div class="tf-actions">
              <button type="button" class="game-btn" disabled={moves === 0} onClick={restartPuzzle}>Restart puzzle</button>
              <button type="button" class="game-btn" onClick={skip}>Skip</button>
            </div>
          )}
          <p class="tf-winner">{strongestPositions.length === 1 ? `“${words[strongestPositions[0]!]}” gets the biggest share.` : `${strongestPositions.length} words tie for the biggest share.`}</p>
        </>
      )}
      <p class="toy-note">One attention head with hand-chosen numbers, not a trained model.</p>
      <details class="toy-method attention-inspector">
        <summary>Follow the numbers</summary>
        <label class="attention-inspect-label" for="inspect-word">
          Follow one word
          <select id="inspect-word" value={inspected} onChange={event => setInspected(Number(event.currentTarget.value))}>
            {words.map((word, i) => <option value={i}>{`${word}, word ${i + 1}`}</option>)}
          </select>
        </label>
        <ol class="attention-read-steps">
          <li>
            <h4>1. Match query to key</h4>
            <div>
              <div class="attention-vectors">
                <span>Query <output dir="ltr">[{query.map(n => n.toFixed(2)).join(", ")}]</output></span>
                <span>Key <output dir="ltr">[{keys[inspected]!.join(", ")}]</output></span>
              </div>
              <p class="attention-arithmetic" dir="ltr">
                ({query[0].toFixed(2)} × {keys[inspected]![0]} + {query[1].toFixed(2)} × {keys[inspected]![1]}) / √2 = <output data-testid="inspected-match">{matches[inspected]!.toFixed(3)}</output>
              </p>
            </div>
          </li>
          <li>
            <h4>2. Give it a share</h4>
            <div>
              <output class="attention-step-number" data-testid="inspected-weight">{(weights[inspected]! * 100).toFixed(1)}%</output>
              <p>{hidden ? "This word is hidden. Its match is excluded before shares are calculated." : "Softmax compares all allowed matches and makes their shares add up to 100%."}</p>
            </div>
          </li>
          <li>
            <h4>3. Mix the values</h4>
            <div>
              <p>Share × value = contribution</p>
              <p class="attention-arithmetic" dir="ltr">{weights[inspected]!.toFixed(3)} × {values[inspected]} = <output data-testid="inspected-contribution">{contributions[inspected]!.toFixed(3)}</output></p>
              <p>Add every word’s contribution to get the read.</p>
              <div class="attention-contributions" dir="ltr">
                {words.map((word, i) => <span><b>{word}</b><output>{contributions[i]!.toFixed(3)}</output></span>)}
              </div>
              <p class="attention-total">Read <output data-testid="inspected-total">{mixture.toFixed(3)}</output></p>
            </div>
          </li>
        </ol>
      </details>
    </div>
  );
}
