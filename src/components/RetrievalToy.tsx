import '../i18n/preact';
import '../styles/games/retrieval.css';
import { useRef, useState } from "preact/hooks";
import GoalBar from "./game/GoalBar";
import ResultCard, { type GameResult } from "./game/ResultCard";
import { markPlayed } from "../lib/progress";

export type Owner = "museum" | "web";
export type Passage = { id: string; title: string; text: string; owner: Owner };
// The museum writes A and B; anyone can post C–E. The reader reads the top two matches.
export const library: Passage[] = [
  { id: "a", title: "Official notice", text: "Moss Museum opens at 10:00.", owner: "museum" },
  { id: "b", title: "Museum FAQ", text: "When does Moss Museum open? See the notice by the door.", owner: "museum" },
  { id: "c", title: "Cafe notice", text: "Fern Cafe opens at 08:00.", owner: "web" },
  { id: "d", title: "Garden blog", text: "Moss Museum has a fern garden.", owner: "web" },
  { id: "e", title: "Visitor review", text: "Lovely moss rooms and a quiet cafe.", owner: "web" },
];
export const QUESTION = "When does Moss Museum open?";
export const SUBJECT = "Moss Museum";
export const TRUE_TIME = "10:00";
export const READ_COUNT = 2;
export type Phase = "poison" | "fix" | "done";

export const words = (text: string) => new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
const normalise = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

export function rankPassages(search: string, passages: Passage[]) {
  const query = words(search);
  return passages.map(passage => {
    const tokens = words(passage.text);
    const matched = [...query].filter(word => tokens.has(word));
    return { ...passage, matched, score: matched.length };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export function retrieve(search: string, passages: Passage[], count: number) {
  return rankPassages(search, passages).filter(passage => passage.score > 0).slice(0, count);
}

// Accepts 9:30, 09:30, 10.30, 9am, 9 am, 9:30 pm and 9 a.m.; a bare "9" is too ambiguous to read.
export function parseTime(raw: string): string | null {
  const match = raw.trim().toLowerCase().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  const [, h, m, meridiem] = match;
  if (m === undefined && meridiem === undefined) return null;
  let hour = Number(h);
  const minute = m === undefined ? 0 : Number(m);
  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    hour = hour % 12 + (meridiem === "pm" ? 12 : 0);
  } else if (hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// A full stop ends a sentence unless it sits between two digits (10.30).
export const sentences = (text: string) => text.replace(/\b([ap])\.\s?m\b\.?/gi, "$1m.").split(/[!?\n]+|(?<!\d)\.|\.(?!\d)/);

export function readOpeningTime(subject: string, passages: Pick<Passage, "id" | "text">[]) {
  const evidence = passages.flatMap(passage => sentences(passage.text).flatMap(sentence => {
    const match = sentence.trim().match(/^(.+?)\s+opens at\s+(.+)$/i);
    const time = match ? parseTime(match[2]!) : null;
    return match && time && normalise(match[1]!) === normalise(subject) ? [{ id: passage.id, time }] : [];
  }));
  const times = [...new Set(evidence.map(item => item.time))];
  return { status: times.length === 0 ? "missing" : times.length === 1 ? "answer" : "conflict", time: times.length === 1 ? times[0]! : null, evidence } as const;
}

export type Verdict = "correct" | "fooled" | "conflict" | "missing";
export function askLibrary(passages: Passage[]) {
  const found = retrieve(QUESTION, passages, READ_COUNT);
  const result = readOpeningTime(SUBJECT, found);
  const verdict: Verdict = result.status !== "answer" ? result.status : result.time === TRUE_TIME ? "correct" : "fooled";
  return { found, result, verdict };
}

export const canEdit = (phase: Phase, passage: Passage) => phase === "poison" ? passage.owner === "web" : phase === "fix" && passage.owner === "museum";
export const changedPages = (passages: Passage[], owner: Owner) => passages.filter(p => p.owner === owner && p.text !== library.find(o => o.id === p.id)!.text).length;
export const poisonStars = (edits: number): 0 | 1 | 2 | 3 => edits <= 0 ? 0 : edits === 1 ? 3 : edits === 2 ? 2 : 1;

export function retrievalResult(poisonEdits: number, fixEdits: number, wrongTime: string): GameResult {
  const one = poisonEdits === 1;
  return {
    slug: "retrieval",
    headline: one ? "I fooled RAG in 1 edit." : `I fooled RAG in ${poisonEdits} edits.`,
    detail: fixEdits === 1 ? `It answered ${wrongTime} with no doubt. Your fix took 1 edit.` : `It answered ${wrongTime} with no doubt. Your fix took ${fixEdits} edits.`,
    score: { value: poisonEdits, label: "Edits to fool it" },
    stars: poisonStars(poisonEdits),
    shareText: one ? "I poisoned the library and fooled RAG in 1 edit. Can you?" : `I poisoned the library and fooled RAG in ${poisonEdits} edits. Can you do it in 1?`,
  };
}

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
// A button, not a #hash link: the chapter page treats unknown hashes as a view change.
function showPassage(id: string) {
  const field = document.getElementById(`rag-passage-${id}`);
  if (!field) return;
  field.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
  field.focus({ preventScroll: true });
}

const fresh = () => library.map(passage => ({ ...passage }));
const verdictLabel: Record<Verdict, string> = { correct: "Correct", fooled: "Confident and wrong", conflict: "Sources disagree", missing: "No time found" };

export default function RetrievalToy() {
  const [passages, setPassages] = useState(fresh);
  const [phase, setPhase] = useState<Phase>("poison");
  const [trick, setTrick] = useState<{ edits: number; time: string } | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const played = useRef(false);
  const { found, result: answer, verdict } = askLibrary(passages);
  const ranked = rankPassages(QUESTION, passages);
  const queryWords = [...words(QUESTION)];
  const poisonEdits = changedPages(passages, "web");
  const fixEdits = changedPages(passages, "museum");
  const touch = () => { if (!played.current) { played.current = true; markPlayed("retrieval"); } };
  const edit = (id: string, text: string) => { touch(); setPassages(current => current.map(p => p.id === id ? { ...p, text } : p)); };
  const restart = () => { setPassages(fresh()); setPhase("poison"); setTrick(null); setResult(null); };
  const lockTrick = () => { setTrick({ edits: poisonEdits, time: answer.time! }); setPhase("fix"); };
  const lockFix = () => { setPhase("done"); setResult(retrievalResult(trick!.edits, fixEdits, trick!.time)); };
  const goal = phase === "poison" ? "Make it give a confident wrong time. Change as few pages as you can." : phase === "fix" ? "Now win back the true time, 10:00. You can edit only the museum’s pages." : "You fooled it, then fixed it.";
  const status = phase === "poison" ? (poisonEdits === 1 ? "1 page changed" : `${poisonEdits} pages changed`) : (fixEdits === 1 ? "Fix: 1 page changed" : `Fix: ${fixEdits} pages changed`);
  const ready = (phase === "poison" && verdict === "fooled") || (phase === "fix" && verdict === "correct");
  return (
    <div class="rag-game">
      <GoalBar goal={goal} status={status} {...(trick ? { score: { value: trick.edits, label: "Edits to fool it" } } : {})} />
      {result ? <ResultCard result={result} onReplay={restart} /> : <>
        <div class="rag-answer" data-verdict={verdict}>
          <p class="rag-question"><span>Question</span> <bdi dir="ltr" translate={false}>{QUESTION}</bdi></p>
          <div aria-live="polite" aria-atomic="true">
            <output data-testid="retrieval-answer">{answer.status === "answer" ? `${SUBJECT} opens at ${answer.time}.` : answer.status === "conflict" ? "Sources disagree." : "No opening time found."}</output>
            <span class="rag-verdict">{verdictLabel[verdict]}</span>
          </div>
          <p class="rag-evidence" data-testid="retrieval-evidence"><span>{`Read the top ${READ_COUNT} matches:`}</span>{found.map(p => <button type="button" class="rag-chip" key={p.id} onClick={() => showPassage(p.id)}><bdi dir="ltr">{`${p.id.toUpperCase()}${answer.evidence.some(item => item.id === p.id) ? ` · ${answer.evidence.find(item => item.id === p.id)!.time}` : ""}`}</bdi></button>)}</p>
          {ready && <button type="button" class="game-btn is-primary rag-lock" onClick={phase === "poison" ? lockTrick : lockFix}>{phase === "poison" ? "Lock in the trick" : "Lock in the fix"}</button>}
        </div>
        <ol class="rag-library" aria-label="Library">{passages.map(original => {
          // Fixed A–E order: re-sorting while someone types would move the focused field.
          const passage = ranked.find(p => p.id === original.id)!;
          const editable = canEdit(phase, passage);
          const read = found.findIndex(p => p.id === passage.id);
          const tied = read < 0 && passage.score > 0 && passage.score === ranked[READ_COUNT - 1]!.score;
          return <li key={passage.id} class={`rag-passage${read >= 0 ? " is-read" : ""}${editable ? " is-editable" : ""}`}>
            <div class="rag-passage-head">
              <label for={`rag-passage-${passage.id}`}><bdi dir="ltr">{passage.id.toUpperCase()}</bdi> · {passage.title}</label>
              <span class="rag-owner">{passage.owner === "museum" ? "Museum page" : "Anyone can post"}</span>
              <span class="rag-rank" data-testid={`retrieved-${passage.id}`}>{read >= 0 ? `Read #${read + 1}` : "Not read"}</span>
            </div>
            <textarea id={`rag-passage-${passage.id}`} dir="ltr" translate={false} rows={2} maxLength={200} spellcheck={false} value={passage.text} readOnly={!editable} aria-describedby={`rag-match-${passage.id}`} onInput={event => edit(passage.id, event.currentTarget.value)} />
            <p class="rag-match" id={`rag-match-${passage.id}`}>
              <span>{`Question words: ${passage.score} / ${queryWords.length}`}</span>
              {passage.matched.length > 0 && <bdi dir="ltr" translate={false}>{passage.matched.join(", ")}</bdi>}
              {tied && <span class="rag-tie">{`Tie: the earlier letter is read`}</span>}
              {!editable && <span class="rag-locked">{phase === "poison" ? "Locked: the museum’s page" : "Locked: already posted"}</span>}
            </p>
          </li>;
        })}</ol>
        <button type="button" class="game-btn rag-restart" onClick={restart}>Start over</button>
      </>}
      <p class="toy-note">A toy: word-matching search plus a fixed sentence reader, not a neural retriever or a language model.</p>
    </div>
  );
}
