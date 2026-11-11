import '../i18n/preact';
import { useState } from "preact/hooks";

export type Passage = { id: string; title: string; text: string; enabled: boolean };
export const library: Passage[] = [
  { id: "a", title: "Museum notice", text: "Moss Museum opens at 10:00.", enabled: true },
  { id: "b", title: "Cafe notice", text: "Fern Cafe opens at 08:00.", enabled: true },
  { id: "c", title: "Garden note", text: "Moss Museum has a fern garden.", enabled: true },
];
export const questions = ["Moss Museum", "Fern Cafe"];
const words = (text: string) => new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
const normalise = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

export function rankPassages(search: string, passages: Passage[]) {
  const query = words(search);
  return passages.map(passage => {
    const tokens = words(passage.text);
    const matched = [...query].filter(word => tokens.has(word));
    return { ...passage, matched, score: matched.length };
  }).sort((a, b) => Number(b.enabled) - Number(a.enabled) || b.score - a.score || a.id.localeCompare(b.id));
}

export function retrieve(search: string, passages: Passage[], count: number) {
  return rankPassages(search, passages).filter(passage => passage.enabled && passage.score > 0).slice(0, count);
}

export function readOpeningTime(subject: string, passages: Passage[]) {
  const evidence = passages.flatMap(passage => passage.text.split(/[.!?\n]+/).flatMap(sentence => {
    const match = sentence.trim().match(/^(.+?)\s+opens at\s+((?:[01]\d|2[0-3]):[0-5]\d)$/i);
    return match && normalise(match[1]!) === normalise(subject) ? [{ id: passage.id, time: match[2]! }] : [];
  }));
  const times = [...new Set(evidence.map(item => item.time))];
  return { status: times.length === 0 ? "missing" : times.length === 1 ? "answer" : "conflict", time: times.length === 1 ? times[0] : null, evidence };
}

export default function RetrievalToy() {
  const [passages, setPassages] = useState(() => library.map(passage => ({ ...passage })));
  const [subject, setSubject] = useState(questions[0]!);
  const [count, setCount] = useState(1);
  const [customSearch, setCustomSearch] = useState<string | null>(null);
  const search = customSearch ?? subject;
  const querySize = words(search).size;
  const ranked = rankPassages(search, passages);
  const found = retrieve(search, passages, count);
  const result = readOpeningTime(subject, found);
  const update = (id: string, change: Partial<Passage>) => setPassages(current => current.map(passage => passage.id === id ? { ...passage, ...change } : passage));
  return (
    <div class="retrieval-toy">
      <div class="toy-topline"><strong>Give it a library.</strong><span class="toy-label">Toy · invented places</span></div>
      <p>Change 10:00 to 12:00 in A. The answer updates immediately. No training happens.</p>
      <fieldset class="retrieval-question">
        <legend>When does this place open?</legend>
        <div class="retrieval-options">{questions.map(name => <label><input type="radio" name="retrieval-question" checked={subject === name} onChange={() => { setSubject(name); setCustomSearch(null); }} /><bdi dir="ltr">{name}</bdi></label>)}</div>
      </fieldset>
      <div class="toy-controls">
        <label for="passage-count">Passages to read <output for="passage-count">{count}</output></label>
        <input id="passage-count" type="range" min="1" max="2" step="1" value={count} aria-valuetext={`Read up to ${count} passages`} onInput={event => setCount(Number(event.currentTarget.value))} />
        <div class="range-ends"><span>1 · closest match</span><span>2 · more context</span></div>
      </div>
      <div class="retrieval-workbench">
      <div class="retrieval-answer" aria-live="polite" aria-atomic="true">
        <span>Template answer · from the passages read</span>
        <p class="retrieval-query">Searching for: <bdi dir="ltr" data-testid="retrieval-query">{search || "None"}</bdi></p>
        <output data-testid="retrieval-answer">{result.status === "answer" ? `${subject} opens at ${result.time}.` : result.status === "conflict" ? "Sources disagree." : "No opening time found."}</output>
        <p data-testid="retrieval-evidence">{result.status === "answer" ? "Read from: " : result.status === "conflict" ? "Different times in: " : found.length === 0 ? "No matching passage reached the reader." : "The retrieved text has no matching opening-time sentence."}{result.evidence.map((item, i) => <span key={`${item.id}-${i}`}>{i > 0 && ", "}<a href={`#passage-${item.id}`} onClick={() => document.getElementById(`passage-${item.id}`)?.focus()}>{item.id.toUpperCase()} · {item.time}</a></span>)}</p>
      </div>
      <details class="retrieval-search toy-corpus">
        <summary>Follow the search</summary>
        <p>Try fern. The question stays the same; only the search changes.</p>
        <label for="retrieval-search">Search words · English toy text</label>
        <div class="retrieval-search-controls">
          <input id="retrieval-search" type="text" dir="ltr" maxLength={80} value={search} onInput={event => setCustomSearch(event.currentTarget.value)} spellcheck={false} />
          <button class="another-continuation" disabled={customSearch === null} onClick={() => setCustomSearch(null)}>Use place name</button>
        </div>
        <table>
          <caption><span>Search order · ties use</span> <bdi dir="ltr">A, B, C</bdi></caption>
          <thead><tr><th scope="col">Passage</th><th scope="col">Shared words</th><th scope="col">Reader gets</th></tr></thead>
          <tbody>{ranked.map(passage => {
            const position = found.findIndex(item => item.id === passage.id);
            return <tr key={passage.id} data-testid={`search-row-${passage.id}`} class={position >= 0 ? "is-sent" : ""}>
              <th scope="row"><a href={`#passage-${passage.id}`} onClick={() => document.getElementById(`passage-${passage.id}`)?.focus()}><bdi dir="ltr">{passage.id.toUpperCase()}</bdi></a></th>
              <td>{passage.matched.length > 0 ? <bdi dir="ltr">{passage.matched.join(", ")}</bdi> : "None"}</td>
              <td>{!passage.enabled ? "Excluded" : position >= 0 ? <><span>Read</span> <bdi dir="ltr">#{position + 1}</bdi></> : passage.score === 0 ? "No shared words" : "Below cutoff"}</td>
            </tr>;
          })}</tbody>
        </table>
        <p>A shared word earns one point, even if repeated. Reading more cannot rescue a passage with no shared words.</p>
      </details>
      <div class="retrieval-library" aria-label="Editable toy library">{passages.map(passage => {
        const position = found.findIndex(item => item.id === passage.id);
        const score = ranked.find(item => item.id === passage.id)!.score;
        return <div key={passage.id} class={`library-passage ${position >= 0 ? "is-retrieved" : ""}`}>
          <div class="passage-heading"><label for={`passage-${passage.id}`}>{passage.id.toUpperCase()} · {passage.title}</label><span data-testid={`retrieved-${passage.id}`}>{position >= 0 ? `Read #${position + 1}` : passage.enabled ? "Not read" : "Excluded"}</span></div>
          <textarea id={`passage-${passage.id}`} dir="ltr" rows={2} maxLength={240} value={passage.text} onInput={event => update(passage.id, { text: event.currentTarget.value })} spellcheck={false} />
          <div class="passage-bottom"><label><input type="checkbox" checked={passage.enabled} onChange={event => update(passage.id, { enabled: event.currentTarget.checked })} />Include {passage.id.toUpperCase()}</label><span>{querySize > 0 ? `${score} / ${querySize} words match` : "No search words"}</span></div>
          <div class="retrieval-score" aria-hidden="true"><span style={{ width: `${querySize > 0 ? 100 * score / querySize : 0}%` }} /></div>
        </div>;
      })}</div>
      </div>
      <details class="toy-corpus"><summary>Try breaking the evidence</summary><p>Exclude A: a matching garden note cannot answer. Or write “Moss Museum opens at 03:00.” in C, then read two passages: the sources disagree. A plausible match can still be wrong.</p></details>
      <button class="another-continuation" onClick={() => { setPassages(library.map(passage => ({ ...passage }))); setSubject(questions[0]!); setCount(1); setCustomSearch(null); }}>Reset library</button>
      <details class="toy-method"><summary>About this toy</summary><p class="toy-footnote">Keyword search, then a fixed template: “Place opens at HH:MM.” Ties use A–B–C order. This is not a neural retriever or a language model. Real RAG can still invent an answer; this toy declines missing or conflicting evidence.</p></details>
    </div>
  );
}
