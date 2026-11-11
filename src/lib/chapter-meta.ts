// Client-safe chapter order, titles and dates. No imports: islands load this without the corpus.
export type Era = "counting" | "memory" | "attention" | "scale" | "chat" | "agents";
// `from` of the first era and `to` of the last are open ends (≤ 1989, 2024 →).
export const eras: { id: Era; label: string; from: number; to: number }[] = [
  { id: "counting", label: "Counting", from: 0, to: 1989 },
  { id: "memory", label: "Memory", from: 1990, to: 2013 },
  { id: "attention", label: "Attention", from: 2014, to: 2017 },
  { id: "scale", label: "Scale", from: 2018, to: 2021 },
  { id: "chat", label: "Chat", from: 2022, to: 2023 },
  { id: "agents", label: "Reasoning & agents", from: 2024, to: 9999 },
];
export type ChapterMeta = { slug: string; title: string; year: number; month: number; era: Era };
export function eraOf(year: number): Era {
  return eras.find((era) => year <= era.to)?.id ?? "agents";
}
// Chronological by year, then month (same-month chapters by day). Month = when the anchor idea was published.
const rows: [string, string, number, number][] = [
  ["next-letter", "Guessing the next letter", 1913, 1], // Markov lecture, 23 Jan 1913
  ["zero-counts", "The zero-count problem", 1953, 12], // Good, Biometrika, Dec 1953
  ["eliza", "ELIZA, the first chatbot", 1966, 1], // Weizenbaum, CACM 9(1), Jan 1966
  ["speech", "IBM makes speech models practical", 1975, 5], // Jelinek, IEEE Trans. Inf. Theory, May 1975
  ["elman", "Elman’s recurrent network", 1990, 3], // Cognitive Science, Mar 1990
  ["lstm", "Learning what to remember", 1997, 11], // Neural Computation, 15 Nov 1997
  ["neural-language-model", "Bengio’s neural language model", 2003, 2], // JMLR, Feb 2003
  ["rnn-language-model", "Mikolov’s RNN language model", 2010, 9], // Interspeech, Sep 2010
  ["word-vectors", "Words as vectors", 2013, 1], // word2vec arXiv, 16 Jan 2013
  ["graves", "Graves generates text", 2013, 8], // arXiv, 4 Aug 2013
  ["sequence-to-sequence", "Sequence-to-sequence", 2014, 9], // arXiv, 10 Sep 2014
  ["attention", "Attention", 2015, 5], // Bahdanau et al., ICLR, May 2015
  ["tokens", "Words into tokens", 2016, 8], // Sennrich, Haddow & Birch, ACL, Aug 2016 (arXiv 1508.07909)
  ["drop-recurrence", "Racing to drop recurrence", 2017, 5], // ConvS2S arXiv, 8 May 2017
  ["transformer", "The Transformer", 2017, 6], // arXiv, 12 Jun 2017
  ["pretraining", "Pretrain, then fine-tune", 2018, 6], // GPT, 11 Jun 2018
  ["bert", "BERT", 2018, 10], // arXiv, 11 Oct 2018
  ["gpt-2", "GPT-2 and zero-shot", 2019, 2], // 14 Feb 2019
  ["scaling-laws", "Scaling laws", 2020, 1], // arXiv, 23 Jan 2020
  ["retrieval", "Look it up", 2020, 5], // RAG arXiv, 22 May 2020
  ["gpt-3", "GPT-3 and in-context learning", 2020, 5], // arXiv, 28 May 2020
  ["mixture-of-experts", "Mixture of experts", 2021, 1], // Switch Transformers arXiv, 11 Jan 2021
  ["human-feedback", "Learning from human feedback", 2022, 1], // InstructGPT, 27 Jan 2022
  ["chain-of-thought", "Show your working", 2022, 1], // arXiv, 28 Jan 2022
  ["chinchilla", "Compute-optimal training", 2022, 3], // arXiv, 29 Mar 2022
  ["tools-and-agents", "Tools and agents", 2022, 10], // ReAct arXiv, 6 Oct 2022
  ["chatgpt", "The ChatGPT moment", 2022, 11], // 30 Nov 2022
  ["open-models", "Open models", 2023, 2], // LLaMA arXiv, 27 Feb 2023
  ["gpt-4", "Beyond text: GPT-4", 2023, 3], // 14 Mar 2023
  ["dpo", "Simpler alignment", 2023, 5], // arXiv, 29 May 2023
  ["reasoning", "Reasoning models", 2024, 9], // OpenAI o1, 12 Sep 2024
  ["now", "Where we are now", 2026, 9], // DeepSeek-V4.1-Flash arXiv 2609.19969, Sep 2026
];
export const chapterMeta: ChapterMeta[] = rows.map(([slug, title, year, month]) => ({ slug, title, year, month, era: eraOf(year) }));
export function metaFor(slug: string): ChapterMeta | undefined {
  return chapterMeta.find((meta) => meta.slug === slug);
}
export function nextChapter(slug: string): ChapterMeta | undefined {
  const index = chapterMeta.findIndex((meta) => meta.slug === slug);
  return index < 0 ? undefined : chapterMeta[index + 1];
}
