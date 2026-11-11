import '../i18n/preact';
import '../styles/games/chatgpt.css';
import { useRef, useState } from "preact/hooks";
import GoalBar from "./game/GoalBar";
import ResultCard, { type GameResult } from "./game/ResultCard";
import { markPlayed } from "../lib/progress";

export type Fact = { name?: string; destination?: string };
export type Turn = { role: "You" | "Assistant"; text: string; fact?: Fact };
export type Move = "name" | "trip" | "correction" | "pack" | "rain";
export const moves: Move[] = ["name", "trip", "correction", "pack", "rain"];
export const windows = [4, 6, 8, 10] as const;
export const FINAL_QUESTION = "Who am I, and where are we going?";

// Facts come only from your messages; replies never repeat a name or a city.
export function userTurn(move: Move, name: string): Turn {
  switch (move) {
    case "name": return { role: "You", text: `Hi, I’m ${name}.`, fact: { name } };
    case "trip": return { role: "You", text: "Plan a trip to Kyoto.", fact: { destination: "Kyoto" } };
    case "correction": return { role: "You", text: "Actually, make it Oslo.", fact: { destination: "Oslo" } };
    case "pack": return { role: "You", text: "What should I pack?" };
    case "rain": return { role: "You", text: "Is it rainy there?" };
  }
}

// What the reader can know from the messages that fit in its window.
export function recall(turns: Turn[]): Fact {
  const known: Fact = {};
  for (const turn of turns) if (turn.role === "You" && turn.fact) Object.assign(known, turn.fact);
  return known;
}
export const inWindow = (turns: Turn[], size: number) => size <= 0 ? [] : turns.slice(-size);

export function reply(move: Move, context: Turn[]): string {
  const { destination } = recall(context);
  switch (move) {
    case "name": return "Nice to meet you!";
    case "trip": return "Great choice. Let’s plan it.";
    case "correction": return "Changed. New plan noted.";
    case "pack": return destination === "Oslo" ? "Warm layers and a rain jacket." : destination === "Kyoto" ? "Light layers and comfy shoes." : "Pack for where? I’ve lost track.";
    case "rain": return destination === "Oslo" ? "Often. Bring an umbrella." : destination === "Kyoto" ? "Sometimes, mostly in June." : "Where is “there”? I’ve lost track.";
  }
}

// Each reply is written from the window: the earlier messages that fit, plus the new one.
export function chat(order: Move[], name: string, size: number): Turn[] {
  const turns: Turn[] = [];
  for (const move of order) {
    const said = userTurn(move, name);
    turns.push(said, { role: "Assistant", text: reply(move, [...inWindow(turns, size), said]) });
  }
  return turns;
}

export function finalAnswer(turns: Turn[], size: number, name: string) {
  const known = recall(inWindow(turns, size));
  const remembered = known.name === name && known.destination === "Oslo";
  const text = known.name && known.destination ? `You’re ${known.name}, and we’re going to ${known.destination}.`
    : known.name ? `You’re ${known.name}. Where are we going?`
    : known.destination ? `We’re going to ${known.destination}. Sorry, what’s your name?`
    : "Sorry, I don’t know your name or where we’re going.";
  return { known, remembered, text };
}

// The smallest window whose last messages still hold your name and the Oslo correction.
export function smallestWindow(turns: Turn[], name: string) {
  for (let size = 1; size <= turns.length; size++) if (finalAnswer(turns, size, name).remembered) return size;
  return null;
}
export const windowStars = (size: number, remembered: boolean): 0 | 1 | 2 | 3 => !remembered ? 0 : size <= 4 ? 3 : size <= 6 ? 2 : 1;
export const messages = (count: number) => count === 1 ? "1 message" : `${count} messages`;

export function chatResult(size: number, remembered: boolean, smallest: number | null): GameResult {
  return {
    slug: "chatgpt",
    headline: remembered ? `It remembered both with a ${size}-message window.` : `It forgot with a ${size}-message window.`,
    detail: smallest === null ? "Your name or the Oslo change never reached it." : `Your chat needed a window of at least ${smallest} messages.`,
    score: { value: size, label: "Memory window" },
    stars: windowStars(size, remembered),
    shareText: remembered ? `I squeezed a chatbot’s memory down to ${size} messages and it still remembered my name and my change of plans.` : `I squeezed a chatbot’s memory down to ${size} messages and it forgot me. Can you keep it remembering?`,
  };
}

const labels: Record<Move, string> = { name: "Say your name", trip: "Plan a trip to Kyoto", correction: "Change it to Oslo", pack: "Ask what to pack", rain: "Ask about rain" };

export default function ConversationToy() {
  const [size, setSize] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [order, setOrder] = useState<Move[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const played = useRef(false);
  const log = useRef<HTMLOListElement>(null);
  const touch = () => { if (!played.current) { played.current = true; markPlayed("chatgpt"); } };
  const who = name.trim() || "Sam";
  const turns = size === null ? [] : chat(order, who, size);
  const done = order.length === moves.length;
  const final = size !== null && done ? finalAnswer(turns, size, who) : null;
  const send = (move: Move) => {
    touch();
    const next = [...order, move];
    setOrder(next);
    if (next.length === moves.length && size !== null) {
      const all = chat(next, who, size);
      setResult(chatResult(size, finalAnswer(all, size, who).remembered, smallestWindow(all, who)));
    }
    requestAnimationFrame(() => log.current?.lastElementChild?.scrollIntoView({ block: "nearest" }));
  };
  const restart = () => { setSize(null); setOrder([]); setResult(null); };
  // Index of the first earlier message the reader can still see alongside your next one.
  const firstKept = size === null ? 0 : Math.max(0, turns.length - size);
  const status = size === null ? "Pick a window" : `Window: ${size} messages · Sent ${order.length} / ${moves.length}`;
  return <div class="chat-game">
    <GoalBar goal="Tell it your name and change of plans, keep chatting, then see if it still remembers both. The smaller the memory window, the more stars." status={status} />
    {size === null ? <div class="chat-setup">
      <label class="chat-name">Your name <input type="text" dir="auto" maxLength={16} autoComplete="off" placeholder="Sam" value={name} onInput={e => setName(e.currentTarget.value)} /></label>
      <p id="chat-window-help">How many recent messages can it read? Pick before you chat.</p>
      <div class="game-choices" role="group" aria-labelledby="chat-window-help">{windows.map(value => <button type="button" key={value} onClick={() => { touch(); setSize(value); }}>{messages(value)}</button>)}</div>
    </div> : <>
      <ol class="chat-log" ref={log} aria-label="Conversation">{turns.map((turn, i) => {
        const forgotten = i < firstKept;
        return <li key={i} class={`chat-turn is-${turn.role === "You" ? "you" : "bot"}${forgotten ? " is-forgotten" : ""}`}>
          {i === firstKept && i > 0 && <span class="chat-edge">Memory window starts here</span>}
          <small>{forgotten ? `${turn.role} · forgotten` : turn.role}</small>
          <p>{turn.text}</p>
        </li>;
      })}</ol>
      {final ? <div class={`chat-final${final.remembered ? " is-good" : " is-bad"}`} aria-live="polite">
        <small>You</small><p>{FINAL_QUESTION}</p>
        <small>Assistant</small><output>{final.text}</output>
      </div> : <div class="chat-moves" role="group" aria-label="Send a message">{moves.filter(move => !order.includes(move)).map(move =>
        <button type="button" class="game-btn" key={move} disabled={move === "correction" && !order.includes("trip")} onClick={() => send(move)}>{labels[move]}</button>)}
      </div>}
      {result && <ResultCard result={result} onReplay={restart} />}
    </>}
    <p class="toy-note">A scripted chat: replies follow fixed rules and read only the messages inside the window. No language model runs here.</p>
  </div>;
}
