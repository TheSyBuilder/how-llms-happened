import '../i18n/preact';
import { useState } from 'preact/hooks';

export type ContextWord = 'cat' | 'dog' | 'car';
type Pair = [number, number];
export type TinyLanguageModel = {
  vectors: Record<ContextWord, Pair>;
  weights: Pair;
  counts: Record<ContextWord, Pair>;
  steps: number;
};
export const lessonLimit = 40;
export function freshLanguageModel(): TinyLanguageModel {
  return {
    vectors: { cat: [1, 0], dog: [.85, .15], car: [0, 1] },
    weights: [0, 0],
    counts: { cat: [0, 0], dog: [0, 0], car: [0, 0] },
    steps: 0,
  };
}
export function sleepChance(model: TinyLanguageModel, word: ContextWord) {
  const v = model.vectors[word];
  return 1 / (1 + Math.exp(-(model.weights[0] * v[0] + model.weights[1] * v[1])));
}
export function teachNextWord(model: TinyLanguageModel, word: 'cat' | 'car'): TinyLanguageModel {
  if (model.steps >= lessonLimit) return model;
  const target = word === 'cat' ? 1 : 0;
  const error = sleepChance(model, word) - target;
  const vector = model.vectors[word];
  const rate = .7;
  // Both gradients use the parameters from before this lesson.
  const weights: Pair = [
    model.weights[0] - rate * error * vector[0],
    model.weights[1] - rate * error * vector[1],
  ];
  const learned: Pair = [
    vector[0] - rate * error * model.weights[0],
    vector[1] - rate * error * model.weights[1],
  ];
  const counts: Pair = [...model.counts[word]];
  counts[target === 1 ? 0 : 1]++;
  return {
    vectors: { ...model.vectors, [word]: learned }, weights,
    counts: { ...model.counts, [word]: counts }, steps: model.steps + 1,
  };
}
export function placeDog(model: TinyLanguageModel, towardCar: number): TinyLanguageModel {
  const t = Math.max(0, Math.min(100, towardCar)) / 100;
  return { ...model, vectors: { ...model.vectors, dog: [1 - t, t] } };
}

export default function NeuralLanguageToy() {
  const [model, setModel] = useState(freshLanguageModel);
  const [position, setPosition] = useState(15);
  const dog = sleepChance(model, 'dog');
  const conclusion = model.steps === 0 ? 'No lessons yet.' : dog > .52 ? 'Dog leans toward sleeps.' : dog < .48 ? 'Dog leans toward rolls.' : 'Dog is undecided.';
  return <div class="early-toy neural-toy">
    <div class="toy-topline"><span class="eyebrow">Teach one. Change another.</span><span class="toy-label">Toy · tiny learned model</span></div>
    <div class="early-result" role="status" aria-live="polite">
      <strong data-testid="neural-conclusion">{conclusion}</strong>
      <p>Dog has no counted examples. Its neural chance of “sleeps” is <output data-testid="dog-chance">{(dog * 100).toFixed(1)}%</output>.</p>
    </div>
    <label class="early-label" for="dog-position">Dog’s word vector <output>{position}% toward car</output></label>
    <input id="dog-position" type="range" min="0" max="100" step="1" value={position} onInput={e => {
      const next = Number(e.currentTarget.value); setPosition(next); setModel(m => placeDog(m, next));
    }}/>
    <div class="early-ends"><span>Cat’s starting position</span><span>Car’s starting position</span></div>
    <div class="early-buttons neural-lessons">
      <button class="early-primary" disabled={model.steps === lessonLimit} onClick={() => setModel(m => teachNextWord(m, 'cat'))}>Teach cat → sleeps</button>
      <button disabled={model.steps === lessonLimit} onClick={() => setModel(m => teachNextWord(m, 'car'))}>Teach car → rolls</button>
    </div>
    <p class="neural-step-count"><output>{model.steps} / {lessonLimit}</output> lessons · each click trains once</p>
    <div class="neural-transfer-board" aria-label="Count lookup and shared neural predictions">
      {(['cat', 'dog', 'car'] as const).map(word => {
        const p = sleepChance(model, word);
        const [sleeps, rolls] = model.counts[word];
        const seen = sleeps + rolls;
        return <section class={`neural-word ${word === 'dog' ? 'neural-unseen' : ''}`} aria-label={`After ${word}`} key={word}>
          <h3>{word} <span>→ ?</span></h3>
          <div class="neural-count"><span>Count lookup</span><strong>{seen ? `${Math.round(sleeps / seen * 100)}% sleeps` : 'No observations'}</strong><small>{seen} examples</small></div>
          <div class="neural-prediction"><span>Shared network</span><output>{(p * 100).toFixed(1)}% sleeps</output><div class="neural-probability" role="img" aria-label={`Sleeps ${(p * 100).toFixed(1)} percent, rolls ${((1 - p) * 100).toFixed(1)} percent`}><span style={{ width: `${p * 100}%` }}/></div><small>{((1 - p) * 100).toFixed(1)}% rolls</small></div>
        </section>;
      })}
    </div>
    <div class="early-buttons"><button onClick={() => { setModel(freshLanguageModel()); setPosition(15); }}>Reset lessons</button></div>
    <p class="early-small">Starting vectors are hand-placed. Training changes the taught word’s vector and shared weights. Moving dog changes only its vector; it adds no examples. The count lookup has no smoothing.</p>
    <details class="neural-inside"><summary>Inside this toy</summary><p>One context word, two possible next words. If v is its two-number vector and w the shared weights, P(sleeps) = 1 / (1 + exp(−w·v)); P(rolls) = 1 − P(sleeps). Each click takes one cross-entropy gradient step with learning rate 0.7. There is no hidden layer or bias.</p><p>Shared weights: [{model.weights.map(n => n.toFixed(2)).join(', ')}].</p><ul>{(['cat', 'dog', 'car'] as const).map(word => <li key={word}>{word}: [{model.vectors[word].map(n => n.toFixed(2)).join(', ')}]</li>)}</ul></details>
  </div>;
}
