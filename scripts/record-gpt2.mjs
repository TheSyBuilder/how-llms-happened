// Records GPT-2 small's real next-word choices for the home page game "Are you smarter than GPT-2?".
//
// The model library is NOT a project dependency. Install it in a throwaway directory and point this
// script at it:
//
//   mkdir -p /tmp/gpt2-rec && cd /tmp/gpt2-rec && npm init -y && npm install @huggingface/transformers
//   node scripts/record-gpt2.mjs /tmp/gpt2-rec        # run from the repository root
//
// It downloads the original 124M-parameter `gpt2` weights as ONNX (`Xenova/gpt2`, fp32) into
// <dir>/.cache, then writes src/data/gpt2-challenge.json. For each item it scores the four options as
// the next word: the product of the sub-token probabilities of " " + word after the prefix (the
// prefix is preceded by <|endoftext|>, GPT-2's document separator). The four scores are normalised to
// sum to 1. It also stores GPT-2's own top-1 next token over its whole vocabulary. Re-run the script
// to change the data; never edit the recorded numbers by hand.
import {createRequire} from 'node:module';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const dir = resolve(process.argv[2] ?? process.env.TRANSFORMERS_DIR ?? '');
if (!process.argv[2] && !process.env.TRANSFORMERS_DIR) {
  console.error('Usage: node scripts/record-gpt2.mjs <dir with node_modules/@huggingface/transformers>');
  process.exit(1);
}
const entry = createRequire(join(dir, 'package.json')).resolve('@huggingface/transformers');
const {AutoTokenizer, AutoModelForCausalLM, Tensor, env} = await import(pathToFileURL(entry).href);
const version = JSON.parse(readFileSync(join(dir, 'node_modules/@huggingface/transformers/package.json'), 'utf8')).version;
env.cacheDir = join(dir, '.cache');
mkdirSync(env.cacheDir, {recursive: true});

// kind: "pattern" (idioms, quotations, grammar: a 2019 model should do well) or "reasoning"
// (arithmetic, negation, logic or knowledge it lacks: a sharp human should do better).
const items = [
  {id: 'dickens', kind: 'pattern', prefix: 'It was the best of times, it was the worst of', answer: 'times', distractors: ['days', 'years', 'things'], source: 'Charles Dickens, A Tale of Two Cities (1859)'},
  {id: 'actions', kind: 'pattern', prefix: 'Actions speak louder than', answer: 'words', distractors: ['deeds', 'thunder', 'ever'], source: 'Proverb'},
  {id: 'once', kind: 'pattern', prefix: 'Once upon a', answer: 'time', distractors: ['day', 'hill', 'while'], source: 'Fairy-tale opening'},
  {id: 'bird', kind: 'pattern', prefix: 'The early bird catches the', answer: 'worm', distractors: ['train', 'sun', 'eye'], source: 'Proverb'},
  {id: 'hamlet', kind: 'pattern', prefix: 'To be, or not to be, that is the', answer: 'question', distractors: ['matter', 'point', 'problem'], source: 'William Shakespeare, Hamlet (1603)'},
  {id: 'austen', kind: 'pattern', prefix: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a', answer: 'wife', distractors: ['house', 'job', 'horse'], source: 'Jane Austen, Pride and Prejudice (1813)'},
  {id: 'smoke', kind: 'pattern', prefix: "Where there's smoke, there's", answer: 'fire', distractors: ['rain', 'hope', 'steam'], source: 'Proverb'},
  {id: 'lincoln', kind: 'pattern', prefix: 'Four score and seven years', answer: 'ago', distractors: ['gone', 'later', 'past'], source: 'Abraham Lincoln, Gettysburg Address (1863)'},
  {id: 'genesis', kind: 'pattern', prefix: 'In the beginning God created the heaven and the', answer: 'earth', distractors: ['sea', 'stars', 'light'], source: 'King James Bible (1611)'},
  {id: 'twinkle', kind: 'pattern', prefix: 'Twinkle, twinkle, little', answer: 'star', distractors: ['bat', 'light', 'lamb'], source: 'Jane Taylor (1806)'},
  {id: 'rome', kind: 'pattern', prefix: "Rome wasn't built in a", answer: 'day', distractors: ['week', 'year', 'hurry'], source: 'Proverb'},
  {id: 'friend', kind: 'pattern', prefix: 'A friend in need is a friend', answer: 'indeed', distractors: ['forever', 'again', 'too'], source: 'Proverb'},
  {id: 'sunset', kind: 'pattern', prefix: 'The sun rises in the east and sets in the', answer: 'west', distractors: ['north', 'east', 'south'], source: 'Plain sentence'},
  {id: 'since', kind: 'pattern', prefix: 'She has lived in this town since she', answer: 'was', distractors: ['is', 'were', 'be'], source: 'Grammar'},
  {id: 'everest', kind: 'pattern', prefix: 'The tallest mountain on Earth is Mount', answer: 'Everest', distractors: ['Fuji', 'Kilimanjaro', 'Olympus'], source: 'Plain sentence'},
  {id: 'two-two', kind: 'reasoning', prefix: 'Two plus two equals', answer: 'four', distractors: ['three', 'five', 'two'], source: 'Arithmetic'},
  {id: 'seven-six', kind: 'reasoning', prefix: 'Seven plus six equals', answer: 'thirteen', distractors: ['twelve', 'fourteen', 'eleven'], source: 'Arithmetic'},
  {id: 'ten-three', kind: 'reasoning', prefix: 'Ten minus three is', answer: 'seven', distractors: ['three', 'ten', 'eight'], source: 'Arithmetic'},
  {id: 'apples', kind: 'reasoning', prefix: 'If you have five apples and you eat two, you have', answer: 'three', distractors: ['five', 'two', 'seven'], source: 'Arithmetic'},
  {id: 'dozen', kind: 'reasoning', prefix: 'A dozen eggs is twelve eggs, so half a dozen is', answer: 'six', distractors: ['twelve', 'two', 'ten'], source: 'Arithmetic'},
  {id: 'not-happy', kind: 'reasoning', prefix: 'He was not happy at all. In fact, he was very', answer: 'sad', distractors: ['happy', 'glad', 'pleased'], source: 'Negation'},
  {id: 'penguins', kind: 'reasoning', prefix: 'Penguins are birds, but they cannot', answer: 'fly', distractors: ['swim', 'walk', 'eat'], source: 'Negation'},
  {id: 'opposite', kind: 'reasoning', prefix: 'The opposite of hot is', answer: 'cold', distractors: ['hot', 'warm', 'wet'], source: 'Negation'},
  {id: 'canberra', kind: 'reasoning', prefix: 'The capital of Australia is', answer: 'Canberra', distractors: ['Sydney', 'Melbourne', 'Perth'], source: 'World knowledge'},
  {id: 'taller', kind: 'reasoning', prefix: 'Tom is taller than Sam, so Sam is', answer: 'shorter', distractors: ['taller', 'older', 'bigger'], source: 'Logic'},
  {id: 'nephew', kind: 'reasoning', prefix: "My sister's son is my", answer: 'nephew', distractors: ['brother', 'cousin', 'uncle'], source: 'Logic'},
  {id: 'friday', kind: 'reasoning', prefix: 'The day after Friday is', answer: 'Saturday', distractors: ['Sunday', 'Thursday', 'Monday'], source: 'Logic'},
  {id: 'insects', kind: 'reasoning', prefix: 'Spiders have eight legs, and insects have', answer: 'six', distractors: ['eight', 'four', 'ten'], source: 'World knowledge'},
  {id: 'belongs', kind: 'reasoning', prefix: 'Anna gave her book to Ben, so now the book belongs to', answer: 'Ben', distractors: ['Anna', 'her', 'nobody'], source: 'Logic'},
  {id: 'pandemic', kind: 'reasoning', prefix: 'In 2020 the whole world was hit by a', answer: 'pandemic', distractors: ['storm', 'war', 'recession'], source: 'After its training data'},
];

const MODEL = 'Xenova/gpt2';
const tokenizer = await AutoTokenizer.from_pretrained(MODEL);
const model = await AutoModelForCausalLM.from_pretrained(MODEL, {dtype: 'fp32'});
const EOS = 50256;
const encode = (text) => tokenizer.encode(text, {add_special_tokens: false});

async function logitsFor(ids) {
  const input_ids = new Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]);
  const attention_mask = new Tensor('int64', new BigInt64Array(ids.length).fill(1n), [1, ids.length]);
  const {logits} = await model({input_ids, attention_mask});
  const vocab = logits.dims[2];
  return (position) => logits.data.subarray(position * vocab, (position + 1) * vocab);
}
function logSoftmax(row, index) {
  let max = -Infinity;
  for (const v of row) if (v > max) max = v;
  let sum = 0;
  for (const v of row) sum += Math.exp(v - max);
  return row[index] - max - Math.log(sum);
}
const round = (value, digits) => Number(value.toPrecision(digits));

const recorded = [];
for (const item of items) {
  const prefix = [EOS, ...encode(item.prefix)];
  const options = [item.answer, ...item.distractors].sort((a, b) => a.localeCompare(b, 'en', {sensitivity: 'base'}));
  const logp = [];
  for (const word of options) {
    const tokens = encode(` ${word}`);
    const row = await logitsFor([...prefix, ...tokens]);
    let total = 0;
    tokens.forEach((token, j) => { total += logSoftmax(row(prefix.length - 1 + j), token); });
    logp.push(total);
  }
  const last = (await logitsFor(prefix))(prefix.length - 1);
  let top = 0;
  for (let i = 1; i < last.length; i++) if (last[i] > last[top]) top = i;
  const max = Math.max(...logp);
  const weights = logp.map((v) => Math.exp(v - max));
  const total = weights.reduce((a, b) => a + b, 0);
  const probs = weights.map((w) => round(w / total, 4));
  const entry = {
    id: item.id, kind: item.kind, source: item.source, prefix: item.prefix,
    options, answer: options.indexOf(item.answer), probs,
    logp: logp.map((v) => round(v, 5)),
    top1: tokenizer.decode([top]), top1p: round(Math.exp(logSoftmax(last, top)), 4),
  };
  recorded.push(entry);
  const pick = probs.indexOf(Math.max(...probs));
  console.log(`${pick === entry.answer ? 'RIGHT' : 'WRONG'}  ${item.prefix} … ${options[pick]} (${(probs[pick] * 100).toFixed(1)}%)  top-1 ${JSON.stringify(entry.top1)}`);
}

const out = {
  model: MODEL,
  modelName: 'GPT-2 small (124M parameters, OpenAI 2019), ONNX fp32 export of the original gpt2 weights',
  library: `@huggingface/transformers ${version}`,
  recorded: new Date().toISOString().slice(0, 10),
  method: 'P(option) = product of sub-token probabilities of " " + word after <|endoftext|> + prefix, normalised over the four options. top1 is the most likely next token over the whole vocabulary.',
  items: recorded,
};
const target = new URL('../src/data/gpt2-challenge.json', import.meta.url);
mkdirSync(new URL('.', target), {recursive: true});
writeFileSync(target, `${JSON.stringify(out, null, 1)}\n`);
console.log(`Wrote ${recorded.length} items; GPT-2 right on ${recorded.filter((e) => e.probs.indexOf(Math.max(...e.probs)) === e.answer).length}.`);
