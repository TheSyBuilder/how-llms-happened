#!/usr/bin/env node
// Builds the lazily fetched data for the tokens chapter:
//   public/data/tokens-gpt2.bin    GPT-2's 50,000 BPE merges as token-id pairs (see src/components/tokens/bpe.ts)
//   public/data/tokens-words.txt   the ENABLE word list, front-coded, plus the most-tokens record
// Usage: node scripts/build-token-data.mjs [--vocab vocab.json --merges merges.txt --words enable1.txt]
// Without paths it downloads the pinned files below. Nothing here enters the JS bundle.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import ts from "typescript";

// Load the same tokenizer the page uses (TypeScript, compiled in memory so any Node 22 works).
const bpeSource = ts.transpileModule(readFileSync(new URL("../src/components/tokens/bpe.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { bytesToUnicode, byteOrder, encodeIds, packVocab, unpackVocab } = await import(`data:text/javascript,${encodeURIComponent(bpeSource)}`);

const REVISION = "607a30d783dfa663caf39e06633721c8d4cfcd7e";
const HF = `https://huggingface.co/openai-community/gpt2/resolve/${REVISION}`;
const WORDS = "https://raw.githubusercontent.com/dolph/dictionary/694bf9529e986f9175dcbf5fe5875d111941b708/enable1.txt";
const LICENCE = `Modified MIT License

Software Copyright (c) 2019 OpenAI

We don’t claim ownership of the content you create with GPT-2, so it is yours to do with as you please.
We only ask that you use GPT-2 responsibly and clearly indicate your content was created using GPT-2.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.
The above copyright notice and this permission notice need not be included
with content created by the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
OR OTHER DEALINGS IN THE SOFTWARE.`;

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };
async function text(name, url) {
  const path = arg(name);
  if (path) return readFileSync(path, "utf8");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.text();
}
const check = (ok, message) => { if (!ok) throw new Error(message); };

const vocab = JSON.parse(await text("vocab", `${HF}/vocab.json`));
const mergeLines = (await text("merges", `${HF}/merges.txt`)).split("\n").filter((line) => line && !line.startsWith("#version"));
check(Object.keys(vocab).length === 50257, "GPT-2 has 50,257 tokens");
check(mergeLines.length === 50000, "GPT-2 has 50,000 merges");
check(vocab["<|endoftext|>"] === 50256, "<|endoftext|> is token 50256");
// The 256 byte tokens come first, in bytes_to_unicode order; merge r creates token 256 + r.
const unicode = bytesToUnicode();
byteOrder().forEach((byte, id) => check(vocab[unicode[byte]] === id, `byte ${byte} is token ${id}`));
const merges = mergeLines.map((line, rank) => {
  const [a, b, extra] = line.split(" ");
  check(extra === undefined && vocab[a] !== undefined && vocab[b] !== undefined, `merge ${rank}: ${line}`);
  check(vocab[a + b] === 256 + rank, `merge ${rank} creates token ${256 + rank}`);
  return [vocab[a], vocab[b]];
});
const meta = {
  name: "GPT-2 byte-level BPE merges",
  format: "uint32 magic, uint32 header length, JSON header, then one uint16 LE pair (left id, right id) per merge; merge r creates token 256 + r; token 50256 is <|endoftext|>",
  source: `https://huggingface.co/openai-community/gpt2 (vocab.json, merges.txt) at revision ${REVISION}`,
  licence: "MIT (OpenAI's Modified MIT License for GPT-2; full text below)",
  licenceText: LICENCE,
  builtBy: "scripts/build-token-data.mjs",
};
const packed = packVocab(meta, merges);
const model = unpackVocab(packed);
// Every vocabulary string must round-trip through the packed file.
for (const [piece, id] of Object.entries(vocab)) if (id < 50256) check([...model.bytes[id]].map((b) => unicode[b]).join("") === piece, `token ${id} round-trips`);

// ENABLE word list (public domain): lowercase a–z words, front-coded. Each entry is one character
// for the shared-prefix length (code 48 + n, never a lowercase letter) followed by the new suffix.
const words = [...new Set((await text("words", WORDS)).split(/\r?\n/).map((w) => w.trim()).filter((w) => /^[a-z]+$/.test(w)))].sort();
let record = { word: "", tokens: 0 };
const counts = new Map();
for (const word of words) {
  const n = encodeIds(` ${word}`, model).length;
  counts.set(n, (counts.get(n) ?? 0) + 1);
  if (n > record.tokens || (n === record.tokens && word.length < record.word.length)) record = { word, tokens: n };
}
let previous = "", body = "";
for (const word of words) {
  let p = 0;
  while (p < previous.length && p < word.length && previous[p] === word[p]) p++;
  check(p < 49, "prefix fits in one character");
  body += String.fromCharCode(48 + p) + word.slice(p);
  previous = word;
}
const header = {
  name: "ENABLE word list",
  source: WORDS,
  licence: "Public domain (ENABLE2K by Alan Beale and M. Cooper)",
  format: "line 1 is this JSON; line 2 is the front-coded list (one character, code 48 + shared prefix length, then the suffix)",
  count: words.length,
  record,
};
mkdirSync("public/data", { recursive: true });
writeFileSync("public/data/tokens-gpt2.bin", packed);
writeFileSync("public/data/tokens-words.txt", `${JSON.stringify(header)}\n${body}\n`);
const size = (bytes) => `${bytes.length} bytes (${gzipSync(bytes, { level: 9 }).length} gzip)`;
console.log(`tokens-gpt2.bin: ${size(packed)}`);
console.log(`tokens-words.txt: ${size(Buffer.from(body))}, ${words.length} words`);
console.log(`record: ${record.word} = ${record.tokens} tokens; distribution`, Object.fromEntries([...counts].sort((a, b) => a[0] - b[0])));
