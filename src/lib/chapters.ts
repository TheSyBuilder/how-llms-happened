import corpus from "../../data/corpus.json";
import { addedPapers } from "./chapter-papers";
export type Chapter = {
  slug: string;
  title: string;
  year: number;
  hook: string;
  anchor: string;
  related: string[];
  toy: string;
  status: "live" | "planned";
};
// Publication order; the timeline below sorts these turning points by year.
const entries: [string, string, number, string, string, string[], string][] = [
  [
    "transformer",
    "The Transformer",
    2017,
    "What if every word could look at the others directly?",
    "vaswani-2017",
    [],
    "Steer an attention query and hide future words.",
  ],
  [
    "pretraining",
    "Pretrain, then fine-tune",
    2018,
    "Can reading first make a model easier to teach?",
    "radford-2018",
    ["peters-2017", "howard-ruder-2018"],
    "Compare a small learner from scratch and with a head start.",
  ],
  [
    "bert",
    "BERT",
    2018,
    "What can a missing word teach a model?",
    "devlin-2018",
    ["liu-2019", "yang-2019"],
    "Reveal context on either side of a missing word.",
  ],
  [
    "gpt-2",
    "GPT-2 and zero-shot",
    2019,
    "Can a task be hidden inside a piece of text?",
    "radford-2019",
    [],
    "Change a prompt prefix and compare toy continuations.",
  ],
  [
    "scaling-laws",
    "Scaling laws",
    2020,
    "What changes when we make a language model bigger?",
    "kaplan-2020",
    ["rae-2021", "chowdhery-2022"],
    "Spend a training budget across model size and data.",
  ],
  [
    "gpt-3",
    "GPT-3 and in-context learning",
    2020,
    "Can examples in a prompt teach a new pattern?",
    "brown-2020",
    [],
    "Add examples to a tiny pattern-completion prompt.",
  ],
  [
    "retrieval",
    "Look it up",
    2020,
    "What if a model could read a source before answering?",
    "lewis-2020",
    ["guu-2020", "lee-2019", "karpukhin-2020"],
    "Edit a tiny library and retrieve evidence for a question.",
  ],
  [
    "human-feedback",
    "Learning from human feedback",
    2022,
    "How can people teach a model what a good answer feels like?",
    "ouyang-2022",
    ["stiennon-2020", "wei-2021", "sanh-2021"],
    "Rank responses and change a toy preference score.",
  ],
  [
    "chatgpt",
    "The ChatGPT moment",
    2022,
    "What changes when a language model becomes a conversation?",
    "chatgpt-launch",
    [],
    "Follow how a conversation adds context to each turn.",
  ],
  [
    "gpt-4",
    "Beyond text: GPT-4",
    2023,
    "What changes when a model can read a picture too?",
    "gpt-4-report",
    [],
    "Compare the information in text and an image grid.",
  ],
  [
    "chinchilla",
    "Compute-optimal training",
    2022,
    "Should a budget buy a bigger model or more reading?",
    "hoffmann-2022",
    [],
    "Balance parameters and tokens under a fixed budget.",
  ],
  [
    "open-models",
    "Open models",
    2023,
    "What becomes possible when you can run the model yourself?",
    "llama",
    ["zhang-2022", "bigscience-2022", "laurencon-2022"],
    "Fit toy models into a memory budget.",
  ],
  [
    "mixture-of-experts",
    "Mixture of experts",
    2021,
    "Does every word need to use every part of a model?",
    "fedus-2021",
    [],
    "Route tokens to small specialist networks.",
  ],
  [
    "tools-and-agents",
    "Tools and agents",
    2023,
    "What if the next token could start an action?",
    "yao-2022",
    ["schick-2023"],
    "Choose a tool, observe its result, and take another step.",
  ],
  [
    "dpo",
    "Simpler alignment",
    2023,
    "Can comparing two answers be enough to improve a model?",
    "rafailov-2023",
    [],
    "Adjust preference strength between two toy answers.",
  ],
  [
    "chain-of-thought",
    "Show your working",
    2022,
    "Can examples of intermediate steps help solve a problem?",
    "chain-of-thought",
    [],
    "Compare answer-only and step-by-step examples on a tiny puzzle.",
  ],
  [
    "reasoning",
    "Reasoning models",
    2025,
    "Can spending more time on an answer make it better?",
    "deepseek-ai-2025",
    ["o1"],
    "Allocate a small search budget to a multi-step puzzle.",
  ],
  [
    "now",
    "Where we are now",
    2026,
    "Which ideas are coming together next?",
    "deepseek-v4-1",
    ["deepseek-v4", "claude-opus-5-5", "gemini-3-1"],
    "Explore tradeoffs among context, compute, and tools.",
  ],
  [
    "drop-recurrence",
    "Racing to drop recurrence",
    2016,
    "Can we process a sentence without stepping through every word?",
    "gehring-2017",
    [
      "parikh-2016",
      "kalchbrenner-2016",
      "cheng-dong-lapata-2016",
      "sukhbaatar-2015",
    ],
    "Compare paths through recurrence, convolution, and attention.",
  ],
  [
    "next-letter",
    "Guessing the next letter",
    1913,
    "How much can the last letter tell us about the next?",
    "markov-1913",
    ["shannon-1948", "shannon-1951"],
    "Generate letters from tiny transition counts.",
  ],
  [
    "zero-counts",
    "The zero-count problem",
    1953,
    "How do you allow for a word you have never seen?",
    "good-1953",
    ["katz-1987", "kneser-ney-1995", "chen-goodman-1998"],
    "Reserve probability for unseen words.",
  ],
  [
    "speech",
    "IBM makes speech models practical",
    1975,
    "Can likely words help a computer hear a sentence?",
    "jelinek-1975",
    ["jelinek-mercer-1980", "jelinek-mercer-bahl-1982"],
    "Combine a sound score with a language score.",
  ],
  [
    "word-vectors",
    "Words as vectors",
    2013,
    "What if similar words lived near each other?",
    "word2vec",
    ["hinton-1986"],
    "Move words in a tiny map and compare their neighbors.",
  ],
  [
    "elman",
    "Elman’s recurrent network",
    1990,
    "What can a network remember from the previous word?",
    "elman-1988",
    [],
    "Feed two histories into a small running state.",
  ],
  [
    "lstm",
    "Learning what to remember",
    1997,
    "Can a network learn what to keep and what to forget?",
    "hochreiter-schmidhuber-1995",
    [
      "gers-schmidhuber-cummins-1999",
      "gers-schraudolph-schmidhuber-2002",
      "sundermeyer-2012",
    ],
    "Open and close gates on a small memory cell.",
  ],
  [
    "neural-language-model",
    "Bengio’s neural language model",
    2003,
    "Can similar word sequences share what they learn?",
    "bengio-2000",
    ["bengio-bengio-1999", "xu-rudnicky-2000", "schwenk-gauvain-2002"],
    "Compare a count lookup with a shared word representation.",
  ],
  [
    "rnn-language-model",
    "Mikolov’s RNN language model",
    2010,
    "Can a running memory help predict the next word?",
    "mikolov-2010",
    [],
    "Compare predictions after different histories.",
  ],
  [
    "graves",
    "Graves generates text",
    2013,
    "What happens when a model reads its own predictions?",
    "graves-2013",
    [],
    "Sample one character at a time at different temperatures.",
  ],
  [
    "sequence-to-sequence",
    "Sequence-to-sequence",
    2014,
    "How can one network turn a sentence into another?",
    "sutskever-vinyals-le-2014",
    ["cho-2014"],
    "Pass a short message through an encoder and decoder.",
  ],
  [
    "attention",
    "Attention",
    2015,
    "What if a translator could look back at the source?",
    "bahdanau-cho-bengio-2014",
    ["luong-pham-manning-2015"],
    "Move a weighted read across a source sentence.",
  ],
];
const resolveWork = (prefix: string) => {
  const work = corpus.works.find((w) => w.id.startsWith(prefix));
  if (work) return work.id;
  if (addedPapers.some((w) => w.id === prefix)) return prefix;
  throw new Error(`Missing chapter paper: ${prefix}`);
};
export const chapters: Chapter[] = entries.map(
  ([slug, title, year, hook, anchor, related, toy]) => ({
    slug,
    title,
    year,
    hook,
    anchor: resolveWork(anchor),
    related: related.map(resolveWork),
    toy,
    status: ["transformer", "pretraining", "bert", "gpt-2", "scaling-laws", "gpt-3", "retrieval"].includes(slug) ? "live" : "planned",
  }),
);
export const timeline = [...chapters].sort((a, b) => a.year - b.year);
export const chapterHref = (slug: string) => `/chapters/${slug}/`;
export const chapterPaper = (id: string) => {
  const work = corpus.works.find((work) => work.id === id);
  if (work)
    return {
      id: work.id,
      title: work.title,
      url: corpus.sources.find(
        (source) => source.id === work.preferredSourceIds[0],
      )!.url,
    };
  return addedPapers.find((work) => work.id === id);
};
export function paperLink(id: string) {
  return chapterPaper(id)?.url;
}
export function sourceLink(id: string) {
  const source = corpus.sources.find((item) => item.id === id);
  if (!source) throw new Error(`Missing source: ${id}`);
  return source.url;
}
export const chapterForWork = (id: string) =>
  chapters.find(
    (chapter) => chapter.anchor === id || chapter.related.includes(id),
  );

export function legacyDestination(path: string) {
  const work = corpus.works.find((w) => path.includes(w.id));
  if (work) return chapterHref(chapterForWork(work.id)?.slug ?? "now");
  if (/smoothing/.test(path)) return chapterHref("zero-counts");
  if (/elman/.test(path)) return chapterHref("elman");
  if (/mikolov/.test(path)) return chapterHref("rnn-language-model");
  if (/bengio/.test(path)) return chapterHref("neural-language-model");
  if (/graves/.test(path)) return chapterHref("graves");
  if (/recurrent-memory/.test(path)) return chapterHref("lstm");
  if (/bahdanau|luong/.test(path)) return chapterHref("attention");
  if (/encoder-decoder-alignment/.test(path))
    return chapterHref("sequence-to-sequence");
  return "/";
}
