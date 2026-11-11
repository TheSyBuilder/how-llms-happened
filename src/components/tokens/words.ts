// Decodes public/data/tokens-words.txt (written by scripts/build-token-data.mjs). No imports.
// Line 1 is a JSON header; line 2 is the front-coded list: one character (code 48 + the length of
// the prefix shared with the previous word), then the rest of the word in lowercase a–z.
export type WordList = { meta: { count: number; record: { word: string; tokens: number }; source: string; licence: string }; has: (word: string) => boolean };
export function decodeWords(text: string): WordList {
  const split = text.indexOf('\n');
  const meta = JSON.parse(text.slice(0, split)) as WordList['meta'];
  const body = text.slice(split + 1).trim(), words = new Set<string>();
  let previous = '';
  for (let i = 0; i < body.length;) {
    const shared = body.charCodeAt(i) - 48;
    let end = i + 1;
    while (end < body.length && body.charCodeAt(end) >= 97) end++;
    previous = previous.slice(0, shared) + body.slice(i + 1, end);
    words.add(previous);
    i = end;
  }
  return { meta, has: (word) => words.has(word) };
}
