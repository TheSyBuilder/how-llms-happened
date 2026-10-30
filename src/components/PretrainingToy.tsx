import { useMemo, useState } from "preact/hooks";

// Invented sentences. Pretraining sees the next word, never a review rating.
export const readingSentences = [
  "The delightful film made us smile.",
  "The dreadful film made us sigh.",
  "The splendid film made us smile.",
  "The awful film made us sigh.",
  "The lovely film made us smile.",
  "The tedious film made us sigh.",
  "The excellent film made us smile.",
  "The terrible film made us sigh.",
];
export const reviews = [
  { word: "delightful", positive: 1 },
  { word: "dreadful", positive: 0 },
  { word: "lovely", positive: 1 },
  { word: "tedious", positive: 0 },
  { word: "splendid", positive: 1 },
  { word: "awful", positive: 0 },
  { word: "excellent", positive: 1 },
  { word: "terrible", positive: 0 },
];
const words = readingSentences.map((sentence) => sentence.split(" ")[1]!);
const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));
// A fixed, small initialization gives both learners exactly the same start.
const initialEmbeddings = [0.03, -0.07, -0.04, 0.06, 0.08, 0.02, -0.08, -0.01];

export function learnReviews(labelCount: number, readFirst: boolean) {
  const embeddings = [...initialEmbeddings];
  let weight = 0.2;
  let bias = 0;
  if (readFirst) {
    for (let epoch = 0; epoch < 100; epoch++) {
      readingSentences.forEach((sentence, i) => {
        const target = sentence.endsWith("smile.") ? 1 : 0;
        const error = sigmoid(weight * embeddings[i]! + bias) - target;
        const previousWeight = weight;
        weight -= 0.15 * error * embeddings[i]!;
        bias -= 0.15 * error;
        embeddings[i]! -= 0.15 * error * previousWeight;
      });
    }
  }
  const afterReading = [...embeddings];
  // Replace the next-word output with a new rating output; adapt the embeddings too.
  weight = 0;
  bias = 0;
  const labels = reviews.slice(0, labelCount);
  for (let epoch = 0; epoch < 100; epoch++) {
    for (const review of labels) {
      const i = words.indexOf(review.word);
      const error = sigmoid(weight * embeddings[i]! + bias) - review.positive;
      const previousWeight = weight;
      weight -= 0.15 * error * embeddings[i]!;
      bias -= 0.15 * error;
      embeddings[i]! -= 0.15 * error * previousWeight;
    }
  }
  return {
    afterReading,
    embeddings,
    predictions: words.map((word, i) => ({ word, positive: sigmoid(weight * embeddings[i]! + bias) })),
  };
}

function Prediction({ title, probability, readFirst }: { title: string; probability: number; readFirst: boolean }) {
  const percent = Math.round(probability * 100);
  return (
    <div class={`transfer-prediction${readFirst ? " has-head-start" : ""}`}>
      <h4>{title}</h4>
      <div class="prediction-number"><output data-testid={readFirst ? "pretrained-probability" : "scratch-probability"}>{percent}%</output><span>positive</span></div>
      <div class="prediction-track" aria-hidden="true"><span style={{ width: `${probability * 100}%` }} /><i /></div>
      <p>{percent >= 60 ? "Leans positive" : percent <= 40 ? "Leans negative" : "Near a coin flip"}</p>
    </div>
  );
}

export default function PretrainingToy() {
  const [labelCount, setLabelCount] = useState(2);
  const [word, setWord] = useState("splendid");
  const scratch = useMemo(() => learnReviews(labelCount, false), [labelCount]);
  const pretrained = useMemo(() => learnReviews(labelCount, true), [labelCount]);
  const selected = words.indexOf(word);
  const labelled = reviews.slice(0, labelCount).some((review) => review.word === word);
  return (
    <div class="pretraining-toy">
      <div class="toy-topline"><span class="eyebrow">Give a learner a head start</span><span class="toy-label">Toy · eight invented sentences</span></div>
      <p>Two tiny neural networks. The same starting numbers. The same review labels. Only one reads first.</p>
      <div class="reading-sample">
        <h3>1. Read without review labels</h3>
        <p>The delightful film made us <strong>smile.</strong><br />The splendid film made us <strong>smile.</strong><br />The dreadful film made us <strong>sigh.</strong></p>
        <details><summary>See all eight reading sentences</summary><ul>{readingSentences.map((sentence) => <li>{sentence}</li>)}</ul></details>
        <p class="reading-note-small">The reading task: use the adjective to predict the last word, “smile” or “sigh.” Words used alike acquire similar internal numbers.</p>
      </div>
      <div class="learned-map" aria-label="Word positions learned from reading"><div class="visual-caption"><strong>WHAT READING CHANGED</strong><span>One learned number per word</span></div>{words.map((item,i)=><div class={item===word?'map-selected':''}><span>{item}</span><div class="embedding-track"><i class="embedding-start" style={{left:`${50+initialEmbeddings[i]!*12}%`}}/><i class="embedding-learned" style={{left:`${Math.max(4,Math.min(96,50+pretrained.afterReading[i]!*12))}%`}}/></div></div>)}<p>Hollow dots: before reading. Filled dots: after reading. Words used alike move together.</p></div>
      <fieldset class="review-picker"><legend>2. Try a review</legend><div class="review-options">{words.map((option) => <label><input type="radio" name="review-word" value={option} checked={word === option} onChange={() => setWord(option)} /><span>{option}</span></label>)}</div></fieldset>
      <p class="selected-review">“{/^[aeiou]/.test(word) ? "An" : "A"} {word} film.”</p>
      <p class="review-seen" data-testid="review-seen">{labelled ? `“${word}” has a review label.` : `“${word}” has no review label.`}</p>
      <div class="toy-controls">
        <label for="review-count">3. Add labelled reviews <output for="review-count">{labelCount} of 8</output></label>
        <input id="review-count" type="range" min="0" max="8" step="2" value={labelCount} onInput={(event) => setLabelCount(Number(event.currentTarget.value))} aria-valuetext={`${labelCount} labelled reviews out of 8`} />
        <div class="range-ends"><span>No labels</span><span>Every word labelled</span></div>
        <div class="review-labels" aria-label="Labels given to both learners">{labelCount === 0 ? <span>No ratings supplied yet.</span> : reviews.slice(0, labelCount).map((review) => <span>{review.word} → {review.positive ? "positive" : "negative"}</span>)}</div>
      </div>
      <div class="transfer-comparison">
        <Prediction title="From scratch" probability={scratch.predictions[selected]!.positive} readFirst={false} />
        <Prediction title="Read, then fine-tune" probability={pretrained.predictions[selected]!.positive} readFirst={true} />
      </div>
      <div class="toy-result" role="status" aria-live="polite">
        <span class="screen-reader-only">For {word}: from scratch {Math.round(scratch.predictions[selected]!.positive * 100)}% positive; read, then fine-tune {Math.round(pretrained.predictions[selected]!.positive * 100)}% positive.</span>
        <strong>{labelCount === 0 ? "Reading alone does not name the ratings." : labelled ? "Both learners have been taught this word’s rating." : "A label can reach a word it never taught directly."}</strong>
        <p>{labelCount === 0 ? "Both rating outputs start at 50%. Add two labels to connect reading to ratings." : labelled ? "Try a word without a label, or remove some labels to see what carries over." : "Reading grouped adjectives by the sentence’s last word. Fine-tuning connects those groups to ratings; the learner from scratch has no reading pattern to use."}</p>
      </div>
      <p class="toy-footnote">These percentages are toy outputs, not paper results or reliable confidence estimates. The model has one learned number per adjective and one output. It learns this tiny pattern, not English. Reading costs extra training.</p>
    </div>
  );
}
