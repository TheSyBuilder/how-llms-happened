import corpus from "../../data/corpus.json";
import { addedPapers } from "./chapter-papers";
import { chapterMeta } from "./chapter-meta";
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
// Copy and papers per chapter; order, title and year come from chapterMeta (chronological).
const entries: [string, string, string, string[], string][] = [
  [
    "transformer",
    "What if every word could look at the others directly?",
    "vaswani-2017",
    [],
    "Steer an attention query and hide future words.",
  ],
  [
    "pretraining",
    "Can reading first make a model easier to teach?",
    "radford-2018",
    ["peters-2017", "howard-ruder-2018"],
    "Compare a small learner from scratch and with a head start.",
  ],
  [
    "bert",
    "What can a missing word teach a model?",
    "devlin-2018",
    ["liu-2019", "yang-2019"],
    "Reveal context on either side of a missing word.",
  ],
  [
    "gpt-2",
    "Can a task be hidden inside a piece of text?",
    "radford-2019",
    [],
    "Change a prompt prefix and compare toy continuations.",
  ],
  [
    "scaling-laws",
    "What changes when we make a language model bigger?",
    "kaplan-2020",
    ["rae-2021", "chowdhery-2022"],
    "Spend a training budget across model size and data.",
  ],
  [
    "gpt-3",
    "Can examples in a prompt teach a new pattern?",
    "brown-2020",
    [],
    "Add examples to a tiny pattern-completion prompt.",
  ],
  [
    "retrieval",
    "What if a model could read a source before answering?",
    "lewis-2020",
    ["guu-2020", "lee-2019", "karpukhin-2020"],
    "Edit a tiny library and retrieve evidence for a question.",
  ],
  [
    "human-feedback",
    "How can people teach a model what a good answer feels like?",
    "ouyang-2022",
    ["stiennon-2020", "wei-2021", "sanh-2021", "constitutional-ai"],
    "Rank responses and change a toy preference score.",
  ],
  [
    "chatgpt",
    "What changes when a language model becomes a conversation?",
    "chatgpt-launch",
    [],
    "Follow how a conversation adds context to each turn.",
  ],
  [
    "gpt-4",
    "What changes when a model can read a picture too?",
    "gpt-4-report",
    [],
    "Compare the information in text and an image grid.",
  ],
  [
    "chinchilla",
    "Should a budget buy a bigger model or more reading?",
    "hoffmann-2022",
    [],
    "Balance parameters and tokens under a fixed budget.",
  ],
  [
    "open-models",
    "What becomes possible when you can run the model yourself?",
    "llama",
    ["zhang-2022", "bigscience-2022", "laurencon-2022", "lora"],
    "Fit toy models into a memory budget.",
  ],
  [
    "mixture-of-experts",
    "Does every word need to use every part of a model?",
    "fedus-2021",
    ["jacobs-1991", "shazeer-2017", "mixtral"],
    "Route tokens to small specialist networks.",
  ],
  [
    "tools-and-agents",
    "What if the next token could start an action?",
    "yao-2022",
    ["schick-2023"],
    "Choose a tool, observe its result, and take another step.",
  ],
  [
    "dpo",
    "Can comparing two answers be enough to improve a model?",
    "rafailov-2023",
    [],
    "Adjust preference strength between two toy answers.",
  ],
  [
    "chain-of-thought",
    "Can examples of intermediate steps help solve a problem?",
    "chain-of-thought",
    [],
    "Compare answer-only and step-by-step examples on a tiny puzzle.",
  ],
  [
    "reasoning",
    "OpenAI’s o1 thought before it answered. Can more thinking time make an answer better?",
    "deepseek-ai-2025",
    ["o1"],
    "Allocate a small search budget to a multi-step puzzle.",
  ],
  [
    "now",
    "What does a useful model need around it?",
    "deepseek-v4-1",
    ["deepseek-v4", "claude-opus-5-5", "gemini-4-argon", "gpt-6-astra", "flash-attention", "mamba"],
    "Send the right notes, fetch a gate status and try routes in a tiny delivery planner.",
  ],
  [
    "drop-recurrence",
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
    "How much can the last letter tell us about the next?",
    "markov-1913",
    ["shannon-1948", "shannon-1951"],
    "Generate letters from tiny transition counts.",
  ],
  [
    "zero-counts",
    "How do you allow for a word you have never seen?",
    "good-1953",
    ["katz-1987", "kneser-ney-1995", "chen-goodman-1998"],
    "Reserve probability for unseen words.",
  ],
  [
    "speech",
    "Can likely words help a computer hear a sentence?",
    "jelinek-1975",
    ["jelinek-mercer-1980", "jelinek-mercer-bahl-1982"],
    "Combine a sound score with a language score.",
  ],
  [
    "word-vectors",
    "What if similar words lived near each other?",
    "word2vec",
    ["hinton-1986"],
    "Move words in a tiny map and compare their neighbors.",
  ],
  [
    "elman",
    "What can a network remember from the previous word?",
    "elman-1988",
    [],
    "Feed two histories into a small running state.",
  ],
  [
    "lstm",
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
    "Can similar word sequences share what they learn?",
    "bengio-2000",
    ["rumelhart-hinton-williams-1986", "bengio-bengio-1999", "xu-rudnicky-2000", "schwenk-gauvain-2002"],
    "Teach cat and car; watch a shared network change its prediction for an untaught dog.",
  ],
  [
    "rnn-language-model",
    "Can a running memory help predict the next word?",
    "mikolov-2010",
    [],
    "Read two histories with the same ending; compare a three-word window with a fading recurrent state.",
  ],
  [
    "graves",
    "What happens when a model reads its own predictions?",
    "graves-2013",
    [],
    "Sample one character at a time at different temperatures.",
  ],
  [
    "sequence-to-sequence",
    "How can one network turn a sentence into another?",
    "sutskever-vinyals-le-2014",
    ["cho-2014"],
    "Pass a short message through an encoder and decoder.",
  ],
  [
    "eliza",
    "Can a few pattern rules make a program feel like it understands you?",
    "weizenbaum-1966",
    ["turing-1950"],
    "Chat with a 1966 pattern-matching therapist and catch its three tells.",
  ],
  [
    "tokens",
    "How does a model read a word it has never seen?",
    "sennrich-2016",
    ["gage-1994", "radford-2019"],
    "Split any text into real GPT-2 tokens and beat three token challenges.",
  ],
  [
    "attention",
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
export const chapters: Chapter[] = chapterMeta.map(({ slug, title, year }) => {
  const entry = entries.find(([id]) => id === slug);
  if (!entry) throw new Error(`Missing chapter entry: ${slug}`);
  const [, hook, anchor, related, toy] = entry;
  return {
    slug,
    title,
    year,
    hook,
    anchor: resolveWork(anchor),
    related: related.map(resolveWork),
    toy,
    status: ["transformer", "pretraining", "bert", "gpt-2", "scaling-laws", "gpt-3", "retrieval", "human-feedback", "chatgpt", "gpt-4", "chinchilla", "open-models", "mixture-of-experts", "tools-and-agents", "dpo", "chain-of-thought", "reasoning", "now", "drop-recurrence", "next-letter", "zero-counts", "speech", "word-vectors", "elman", "lstm", "neural-language-model", "rnn-language-model", "graves", "sequence-to-sequence", "attention", "eliza", "tokens"].includes(slug) ? "live" : "planned",
  };
});
if (entries.length !== chapters.length) throw new Error("Chapter entries and chapterMeta differ");
// chapters is already chronological.
export const timeline = chapters;
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
// Server-only credit: the chapter's displayed year is valid only when an anchor event supports it.
export function chapterSourceCredit(chapter: Pick<Chapter, "anchor" | "year">) {
  const work = corpus.works.find((item) => item.id === chapter.anchor);
  if (work) {
    const years = work.chronology.events.map((event) => Number(event.date.value.slice(0, 4)));
    const ordering = work.chronology.events.find((event) => event.id === work.chronology.orderingEventId);
    const year = years.includes(chapter.year) ? chapter.year : Number(ordering?.date.value.slice(0, 4));
    const multiple = work.authors.length >= 4;
    // The cited people use family names last; retain Good's explicitly requested initials.
    const surnames = work.authors.map((name) => name === "I. J. Good" ? name : name.split(" ").at(-1)!);
    const author = multiple ? surnames[0]! : surnames.length === 1 ? surnames[0]! : `${surnames.slice(0, -1).join(", ")} & ${surnames.at(-1)}`;
    return { year, author, multiple };
  }
  const added = addedPapers.find((item) => item.id === chapter.anchor);
  if (added && "credit" in added && added.credit) return { year: added.year, ...added.credit };
  return undefined;
}

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
