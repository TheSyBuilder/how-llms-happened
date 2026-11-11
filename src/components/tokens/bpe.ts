// GPT-2 byte-level BPE, as in OpenAI's gpt-2/src/encoder.py. No imports and erasable types only,
// so scripts/build-token-data.mjs can load this file directly with Node.

// The pre-tokenisation pattern from encoder.py: contractions, letters, numbers, other symbols, spaces.
export const PRETOKENIZE = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

// encoder.py bytes_to_unicode(): printable bytes keep their character, the other 68 bytes are moved
// to code points 256 and up, so every byte has a visible stand-in ("Ġ" is the space byte).
export function byteOrder(): number[] {
  const bs: number[] = [];
  for (let b = 33; b <= 126; b++) bs.push(b);
  for (let b = 161; b <= 172; b++) bs.push(b);
  for (let b = 174; b <= 255; b++) bs.push(b);
  for (let b = 0; b < 256; b++) if (!bs.includes(b)) bs.push(b);
  return bs;
}
export function bytesToUnicode(): string[] {
  const bs = byteOrder(), map: string[] = new Array(256);
  let n = 0;
  bs.forEach((b, i) => { map[b] = String.fromCodePoint(i < 188 ? b : 256 + n++); });
  return map;
}

export type Vocab = {
  meta: Record<string, unknown>;
  left: Uint16Array;            // merge r joins token left[r] and right[r] into token 256 + r
  right: Uint16Array;
  ranks: Map<number, number>;   // (left * 65536 + right) -> merge rank
  byteId: Uint16Array;          // raw byte -> base token id
  bytes: Uint8Array[];          // token id -> its bytes
};
export const END_OF_TEXT = 50256;
const MAGIC = 0x32545047; // "GPT2", little-endian

// File layout: uint32 magic, uint32 header length, UTF-8 JSON header, then uint16 LE pairs, one per merge.
export function packVocab(meta: Record<string, unknown>, merges: [number, number][]): Uint8Array {
  const header = new TextEncoder().encode(JSON.stringify(meta));
  const pad = (4 - (header.length % 4)) % 4;
  const out = new Uint8Array(8 + header.length + pad + merges.length * 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, MAGIC, true);
  view.setUint32(4, header.length + pad, true);
  out.set(header, 8);
  out.fill(32, 8 + header.length, 8 + header.length + pad);
  let at = 8 + header.length + pad;
  for (const [a, b] of merges) { view.setUint16(at, a, true); view.setUint16(at + 2, b, true); at += 4; }
  return out;
}

export function unpackVocab(buffer: ArrayBuffer | Uint8Array): Vocab {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (view.getUint32(0, true) !== MAGIC) throw new Error('Not a GPT-2 token file');
  const length = view.getUint32(4, true);
  const meta = JSON.parse(new TextDecoder().decode(data.subarray(8, 8 + length))) as Record<string, unknown>;
  const count = (data.byteLength - 8 - length) / 4;
  const left = new Uint16Array(count), right = new Uint16Array(count), ranks = new Map<number, number>();
  const order = byteOrder(), byteId = new Uint16Array(256), bytes: Uint8Array[] = [];
  order.forEach((b, id) => { byteId[b] = id; bytes[id] = Uint8Array.of(b); });
  for (let r = 0, at = 8 + length; r < count; r++, at += 4) {
    const a = view.getUint16(at, true), b = view.getUint16(at + 2, true);
    left[r] = a; right[r] = b; ranks.set(a * 65536 + b, r);
    const x = bytes[a]!, y = bytes[b]!, joined = new Uint8Array(x.length + y.length);
    joined.set(x); joined.set(y, x.length); bytes[256 + r] = joined;
  }
  return { meta, left, right, ranks, byteId, bytes };
}

// encoder.py bpe(): repeatedly merge every occurrence of the lowest-ranked adjacent pair.
export function bpe(ids: number[], ranks: Map<number, number>): number[] {
  let word = ids;
  while (word.length > 1) {
    let best = Infinity, pair = -1;
    for (let i = 0; i < word.length - 1; i++) {
      const rank = ranks.get(word[i]! * 65536 + word[i + 1]!);
      if (rank !== undefined && rank < best) { best = rank; pair = word[i]! * 65536 + word[i + 1]!; }
    }
    if (pair < 0) break;
    const a = Math.floor(pair / 65536), b = pair % 65536, next: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (i < word.length - 1 && word[i] === a && word[i + 1] === b) { next.push(256 + best); i++; }
      else next.push(word[i]!);
    }
    word = next;
  }
  return word;
}

export type Token = { id: number; text: string; piece: string; partial: boolean };   // partial: only part of a character
const encoder = new TextEncoder();
const strict = new TextDecoder('utf-8', { fatal: true });
const cache = new WeakMap<Vocab, Map<string, number[]>>();

export function pieces(text: string): string[] {
  return text.match(PRETOKENIZE) ?? [];
}
export function encodeIds(text: string, vocab: Vocab): number[] {
  let memo = cache.get(vocab);
  if (!memo) { memo = new Map(); cache.set(vocab, memo); }
  const out: number[] = [];
  for (const piece of pieces(text)) {
    let ids = memo.get(piece);
    if (!ids) { ids = bpe([...encoder.encode(piece)].map((b) => vocab.byteId[b]!), vocab.ranks); memo.set(piece, ids); }
    out.push(...ids);
  }
  return out;
}
// A token's readable text; a token that holds only part of a character shows its bytes in hex.
export function isPartial(id: number, vocab: Vocab): boolean {
  try { strict.decode(vocab.bytes[id] ?? new Uint8Array()); return false; } catch { return true; }
}
export function tokenText(id: number, vocab: Vocab): string {
  const bytes = vocab.bytes[id];
  if (!bytes) return '';
  return isPartial(id, vocab) ? [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ') : strict.decode(bytes);
}
// How GPT-2's own vocabulary file spells the token, e.g. "Ġstrawberry".
let unicode: string[] | undefined;
export function tokenSpelling(id: number, vocab: Vocab): string {
  unicode ??= bytesToUnicode();
  return [...(vocab.bytes[id] ?? [])].map((b) => unicode![b]).join('');
}
export function tokenize(text: string, vocab: Vocab): Token[] {
  return encodeIds(text, vocab).map((id) => ({ id, text: tokenText(id, vocab), piece: tokenSpelling(id, vocab), partial: isPartial(id, vocab) }));
}
