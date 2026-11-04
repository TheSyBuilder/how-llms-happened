import '../i18n/preact';
import { useState } from "preact/hooks";
export type Turn = { role: "You" | "Assistant"; text: string; destination?: string };
export function conversation(city: string, correction: boolean): Turn[] {
  return [{ role: "You", text: `Plan a trip to ${city}.`, destination: city }, { role: "Assistant", text: "Let’s plan the journey." }, { role: "You", text: correction ? "Actually, change the destination to Oslo." : "Keep the destination the same.", ...(correction ? { destination: "Oslo" } : {}) }, { role: "Assistant", text: "Ready for your next question." }];
}
export function contextAnswer(turns: Turn[], count: number) {
  const kept = count === 0 ? [] : turns.slice(-count);
  const city = [...kept].reverse().find(turn => turn.role === "You" && turn.destination)?.destination;
  return { kept, answer: city ? `We’re visiting ${city}.` : "Which city did you mean?" };
}
export default function ConversationToy() {
  const [city, setCity] = useState("Kyoto");
  const [correction, setCorrection] = useState(true);
  const [count, setCount] = useState(4);
  const turns = conversation(city, correction);
  const result = contextAnswer(turns, count);
  return <div class="conversation-toy">
    <div class="toy-topline"><strong>What reaches the next reply?</strong><span class="toy-label">Toy · scripted conversation</span></div>
    <p>Change the destination, then shrink the history. The reply can only use messages still in view.</p>
    <div class="chapter-answer" aria-live="polite"><span>New question: “Which city are we visiting?”</span><output data-testid="conversation-answer">{result.answer}</output><p>{count} earlier messages + the new question. Model parameters stay unchanged.</p></div>
    <label class="chapter-select">First destination<select value={city} onChange={e => setCity(e.currentTarget.value)}><option>Kyoto</option><option>Lima</option><option>Paris</option></select></label>
    <label class="chapter-toggle"><input type="checkbox" checked={correction} onChange={e => setCorrection(e.currentTarget.checked)} />Change my mind to Oslo</label>
    <div class="toy-controls"><label for="history-count">Messages kept <output for="history-count">{count} / 4</output></label><input id="history-count" type="range" min="0" max="4" value={count} onInput={e => setCount(Number(e.currentTarget.value))} /></div>
    <p class="context-window-caption">What reaches the reader ↓ <span>{count} of 4 messages</span></p><ol class="conversation-turns">{turns.map((turn, i) => <li class={i < 4 - count ? "turn-dropped" : "turn-kept"}><small>{turn.role} · {i < 4 - count ? "outside context" : "sent to reader"}</small><p>{turn.text}</p></li>)}</ol>
    <button class="another-continuation" onClick={() => { setCity("Kyoto"); setCorrection(true); setCount(4); }}>Reset conversation</button>
    <details class="toy-method"><summary>About this toy</summary><p class="toy-footnote">A fixed rule reads the latest explicit destination in a kept user message. No language model runs here. This illustrates context, not ChatGPT’s memory system.</p></details>
  </div>;
}
