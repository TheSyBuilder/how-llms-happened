// A re-implementation of the mechanism Weizenbaum describes in "ELIZA" (CACM 9(1), 1966): keyword
// scanning with ranks, word substitutions made during the scan, decomposition and reassembly rules
// cycled in order, a memory queue fed by "my", and content-free replies when nothing matches.
// The rules are written for this page in the spirit of the DOCTOR script, not copied from it.
// No imports: the island and the tests load this file directly.

export type Tell = 'fallback' | 'reflection' | 'repeat';
export type Reply = {
  text: string;
  kind: 'keyword' | 'memory' | 'fallback' | 'opening';
  keyword?: string;
  rank?: number;
  pattern?: string;
  choice?: [number, number];   // reassembly used, as [n, of]
  tells: Tell[];
  broken?: string;             // the ungrammatical phrase a pronoun swap produced
};
export type ElizaState = { counters: Record<string, number>; memory: { text: string; broken?: string }[]; said: string[] };
type Rule = { pattern: string; replies: string[] };
type Keyword = { rank: number; link?: string; rules?: Rule[]; memory?: Rule };

// Word classes used in patterns as @name.
const groups: Record<string, string[]> = {
  family: ['mother', 'mom', 'mum', 'father', 'dad', 'sister', 'brother', 'wife', 'husband', 'children', 'child', 'son', 'daughter', 'family', 'parents', 'boyfriend', 'girlfriend'],
  belief: ['feel', 'think', 'believe', 'wish'],
  desire: ['want', 'need'],
  sad: ['sad', 'unhappy', 'depressed', 'sick', 'miserable', 'lonely', 'upset'],
  happy: ['happy', 'elated', 'glad', 'better', 'cheerful'],
  cannot: ["can't", 'cannot'],
  be: ['am', 'is', 'are', 'was'],
  everyone: ['everyone', 'everybody', 'nobody', 'noone'],
};

// Substitutions apply to every word as it is scanned, exactly once and without looking at context.
// That is why "about you" becomes "about I": the 1966 method has no grammar.
const subs: Record<string, string> = {
  i: 'you', me: 'you', my: 'your', mine: 'yours', myself: 'yourself', am: 'are',
  "i've": "you've", "i'll": "you'll", "i'd": "you'd",
  you: 'i', your: 'my', yours: 'mine', yourself: 'myself',
  "you've": "i've", "you'll": "i'll", "you'd": "i'd",
  were: 'was', dont: "don't", cant: "can't", wont: "won't",
};

const foreign = ['bonjour', 'hola', 'hallo', 'ciao', 'deutsch', 'francais', 'français', 'espanol', 'español', 'italiano', 'nihao', 'merci', 'gracias', 'danke'];
const what = ['Why do you ask?', 'Does that question interest you?', 'What is it you really want to know?', 'Are questions like that often on your mind?', 'What answer would please you most?', 'What do you think?', 'What comes to mind when you ask that?'];

export const script: Record<string, Keyword> = {
  // "you" in the user's text, already swapped to "i".
  you: { rank: 0, rules: [
    { pattern: '* i remind you of *', replies: ['=alike'] },
    { pattern: '* i are *', replies: ['What makes you think I am $3?', 'Does it please you to believe I am $3?', 'Do you sometimes wish you were $3?', 'Perhaps you would like to be $3.'] },
    { pattern: '* i * you', replies: ['Why do you think I $3 you?', 'You like to think I $3 you, don\'t you?', 'What makes you think I $3 you?', 'Really, I $3 you?'] },
    { pattern: '* i *', replies: ['We were talking about you, not me.', 'Oh, I $3?', 'You are not really talking about me, are you?', 'What are your feelings now?'] },
  ] },
  // "i" in the user's text, already swapped to "you".
  i: { rank: 0, rules: [
    { pattern: '* you @desire *', replies: ['What would it mean to you if you got $4?', 'Why do you want $4?', 'Suppose you got $4 soon.', 'What if you never got $4?'] },
    { pattern: '* you are * @sad *', replies: ['I am sorry to hear that you are $5.', 'Do you think coming here will help you not to be $5?', 'It cannot be pleasant to be $5.', 'Can you explain what made you $5?'] },
    { pattern: '* you are * @happy *', replies: ['How have I helped you to be $5?', 'What makes you $5 just now?', 'Can you explain why you are suddenly $5?'] },
    { pattern: '* you was *', replies: ['=was'] },
    { pattern: '* you @belief you *', replies: ['Do you really think so?', 'But you are not sure you $5.', 'Do you really doubt you $5?'] },
    { pattern: '* you are *', replies: ['How long have you been $4?', 'Is it because you are $4 that you came to me?', 'Do you believe it is normal to be $4?', 'Do you enjoy being $4?'] },
    { pattern: '* you @cannot *', replies: ['How do you know you can\'t $4?', 'Have you tried?', 'Perhaps you could $4 now.', 'Do you really want to be able to $4?'] },
    { pattern: "* you don't *", replies: ['Don\'t you really $4?', 'Why don\'t you $4?', 'Do you wish to be able to $4?', 'Does that trouble you?'] },
    { pattern: '* you feel *', replies: ['Do you often feel $4?', 'Tell me more about these feelings.', 'Do you enjoy feeling $4?', 'What does feeling $4 remind you of?'] },
    { pattern: '* you * i *', replies: ['Perhaps in your fantasies we $3 each other.', 'Do you wish to $3 me?', 'You seem to need to $3 me.', 'Do you $3 anyone else?'] },
    { pattern: '* you *', replies: ['You say $3?', 'Can you say more about that?', 'Do you say $3 for some special reason?', 'That is quite interesting.'] },
  ] },
  my: { rank: 2, rules: [
    { pattern: '* your * @family *', replies: ['Tell me more about your family.', 'Who else in your family $5?', 'Your $4?', 'What else comes to mind when you think of your $4?'] },
    { pattern: '* your *', replies: ['Your $3?', 'Why do you say your $3?', 'Does that suggest anything else that belongs to you?', 'Is it important to you that your $3?'] },
  ], memory: { pattern: '* your *', replies: ['Let us talk more about why your $3.', 'Earlier you said your $3.', 'But your $3.', 'Does that have anything to do with the fact that your $3?'] } },
  your: { rank: 0, rules: [
    { pattern: '* my *', replies: ['Why are you concerned about my $3?', 'What about your own $3?', 'Are you worried about someone else\'s $3?', 'Really, my $3?'] },
  ] },
  was: { rank: 2, rules: [
    { pattern: '* was you *', replies: ['What if you were $4?', 'Do you think you were $4?', 'Were you $4?', 'What would it mean if you were $4?'] },
    { pattern: '* you was *', replies: ['Were you really?', 'Why do you tell me you were $4 now?', 'Perhaps I already know you were $4.'] },
    { pattern: '* was i *', replies: ['Would you like to believe I was $4?', 'What suggests that I was $4?', 'What do you think?', 'Perhaps I was $4.'] },
  ] },
  were: { rank: 2, link: 'was' },
  are: { rank: 0, rules: [
    { pattern: '* are i *', replies: ['Why are you interested in whether I am $4 or not?', 'Would you prefer it if I were not $4?', 'Perhaps I am $4 in your fantasies.', 'Do you sometimes think I am $4?'] },
    { pattern: '* are *', replies: ['Did you think they might not be $3?', 'Would you like it if they were not $3?', 'What if they were not $3?', 'Possibly they are $3.'] },
  ] },
  am: { rank: 0, link: 'are' },
  remember: { rank: 5, rules: [
    { pattern: '* you remember *', replies: ['Do you often think of $4?', 'Does thinking of $4 bring anything else to mind?', 'Why do you remember $4 just now?', 'What in this conversation reminds you of $4?'] },
    { pattern: '* i remember *', replies: ['Did you think I would forget $4?', 'Why should I remember $4 now?', 'What about $4?'] },
    { pattern: '*', replies: ['=newkey'] },
  ] },
  if: { rank: 3, rules: [{ pattern: '* if *', replies: ['Do you think it is likely that $3?', 'Do you wish that $3?', 'What do you know about $3?', 'Really, if $3?'] }] },
  dream: { rank: 3, rules: [{ pattern: '*', replies: ['What does that dream suggest to you?', 'Do you dream often?', 'Who appears in your dreams?', 'Do you think dreams have something to do with your problem?'] }] },
  dreamt: { rank: 4, link: 'dream' }, dreamed: { rank: 4, link: 'dream' }, dreams: { rank: 3, link: 'dream' },
  perhaps: { rank: 0, rules: [{ pattern: '*', replies: ['You do not seem quite certain.', 'Why the uncertain tone?', 'Can you not be more positive?', 'You are not sure?'] }] },
  maybe: { rank: 0, link: 'perhaps' },
  name: { rank: 15, rules: [{ pattern: '*', replies: ['I am not interested in names.', 'As I said before, names do not matter to me. Please go on.'] }] },
  hello: { rank: 0, rules: [{ pattern: '*', replies: ['How do you do? Please tell me what is troubling you.'] }] },
  hi: { rank: 0, link: 'hello' },
  computer: { rank: 50, rules: [{ pattern: '*', replies: ['Do computers worry you?', 'Why do you mention computers?', 'What do you think machines have to do with your problem?', 'Do you not think computers can help people?', 'What about machines worries you?', 'What do you think about machines?'] }] },
  computers: { rank: 50, link: 'computer' }, machine: { rank: 50, link: 'computer' }, machines: { rank: 50, link: 'computer' }, robot: { rank: 50, link: 'computer' }, ai: { rank: 50, link: 'computer' },
  sorry: { rank: 0, rules: [{ pattern: '*', replies: ['Please do not apologise.', 'Apologies are not necessary.', 'What feelings do you have when you apologise?', 'I have told you that apologies are not required.'] }] },
  apologise: { rank: 0, link: 'sorry' }, apologize: { rank: 0, link: 'sorry' },
  yes: { rank: 0, rules: [{ pattern: '*', replies: ['You seem quite positive.', 'You are sure?', 'I see.', 'I understand.'] }] },
  certainly: { rank: 0, link: 'yes' },
  no: { rank: 0, rules: [{ pattern: '*', replies: ['Are you saying no just to be negative?', 'You are being a bit negative.', 'Why not?', 'Why "no"?'] }] },
  can: { rank: 0, rules: [
    { pattern: '* can i *', replies: ['You believe I can $4, don\'t you?', 'You want me to be able to $4.', 'Perhaps you would like to be able to $4 yourself.'] },
    { pattern: '* can you *', replies: ['Whether or not you can $4 depends more on you than on me.', 'Do you want to be able to $4?', 'Perhaps you do not want to $4.'] },
    { pattern: '*', replies: ['=newkey'] },
  ] },
  what: { rank: 0, rules: [{ pattern: '*', replies: what }] },
  how: { rank: 0, link: 'what' }, when: { rank: 0, link: 'what' },
  why: { rank: 0, rules: [
    { pattern: "* why don't i *", replies: ['Do you believe I don\'t $5?', 'Perhaps I will $5 in good time.', 'Should you $5 yourself?', 'You want me to $5?'] },
    { pattern: "* why can't you *", replies: ['Do you think you should be able to $5?', 'Do you want to be able to $5?', 'Do you believe this will help you to $5?', 'Have you any idea why you can\'t $5?'] },
    { pattern: '*', replies: ['=what'] },
  ] },
  because: { rank: 0, rules: [{ pattern: '*', replies: ['Is that the real reason?', 'Do any other reasons come to mind?', 'Does that reason explain anything else?', 'What other reasons might there be?'] }] },
  alike: { rank: 10, rules: [{ pattern: '*', replies: ['In what way?', 'What resemblance do you see?', 'What does that similarity suggest to you?', 'What other connections do you see?', 'What do you suppose that resemblance means?', 'Could there really be some connection?'] }] },
  same: { rank: 10, link: 'alike' },
  like: { rank: 10, rules: [{ pattern: '* @be * like *', replies: ['=alike'] }, { pattern: '*', replies: ['=newkey'] }] },
  everyone: { rank: 2, rules: [{ pattern: '* @everyone *', replies: ['Really, $2?', 'Surely not $2.', 'Can you think of anyone in particular?', 'Who, for example?', 'You are thinking of someone special, aren\'t you?'] }] },
  everybody: { rank: 2, link: 'everyone' }, nobody: { rank: 2, link: 'everyone' }, noone: { rank: 2, link: 'everyone' },
  always: { rank: 1, rules: [{ pattern: '*', replies: ['Can you think of a specific example?', 'When?', 'What incident are you thinking of?', 'Really, always?'] }] },
  xforeign: { rank: 0, rules: [{ pattern: '*', replies: ['I am sorry, I only speak English.'] }] },
};
for (const word of foreign) script[word] = { rank: 0, link: 'xforeign' };

const none = ['I am not sure I follow you.', 'Please go on.', 'What does that tell you?', 'Is this something you feel strongly about?'];
export const OPENING = 'Hello, I am ELIZA. What is on your mind today?';

export function createState(): ElizaState { return { counters: {}, memory: [], said: [] }; }

// Lower-case words, split into clauses at punctuation and "but". Letters outside Latin script mark the
// word as foreign, so ELIZA answers the way the 1966 script answered German.
export function clauses(input: string): string[][] {
  return input.toLowerCase().replace(/[‘’`]/g, "'").replace(/\b(i'?m)\b/g, 'i am').replace(/\byou'?re\b/g, 'you are').split(/[.,;:!?]+|\bbut\b/).map((part) =>
    part.split(/\s+/).map((word) => word.replace(/^'+|'+$/g, '').replace(/[^\p{L}\p{N}']/gu, ''))
      .filter(Boolean).map((word) => (/^[\p{Script=Latin}\p{N}']+$/u.test(word) || !/\p{L}/u.test(word) ? word : 'xforeign')),
  ).filter((words) => words.length);
}

// Weizenbaum's decomposition: "*" matches any number of words, "@group" one word from a class,
// anything else one literal word. Each element is a numbered part ($1, $2…) for reassembly.
export function decompose(pattern: string, words: string[]): string[][] | null {
  const parts = pattern.split(' ');
  const go = (p: number, w: number): string[][] | null => {
    if (p === parts.length) return w === words.length ? [] : null;
    const part = parts[p]!;
    if (part === '*') {
      for (let end = w; end <= words.length; end++) { const rest = go(p + 1, end); if (rest) return [words.slice(w, end), ...rest]; }
      return null;
    }
    const word = words[w];
    if (word === undefined) return null;
    if (part.startsWith('@') ? groups[part.slice(1)]?.includes(word) : part === word) { const rest = go(p + 1, w + 1); return rest ? [[word], ...rest] : null; }
    return null;
  };
  return go(0, 0);
}

// Object-position "I" and mismatched verbs: only a context-free pronoun swap produces these.
const objectI = /\b(to|about|with|for|at|from|of|without|against|toward|towards|around|near|on|by|into|behind|love|hate|miss|trust|need|want|see|hear|tell|ask|help|understand|know|told|like|than|blame|forget|remember) i\b/;
const badVerb = /\b(i are|are i|i is|you was|was you|you am|i has)\b/;
export function brokenPhrase(fragment: string): string | undefined {
  return fragment.match(objectI)?.[0] ?? fragment.match(badVerb)?.[0];
}

const capitalise = (text: string) => text.replace(/\bi\b/g, 'I').replace(/\bi'(m|ve|ll|d)\b/g, "I'$1").replace(/^./, (c) => c.toUpperCase());

// The reassembly templates are grammatical (a test checks this), so a broken phrase in the result
// always comes from a swapped fragment of the user's own words.
function assemble(template: string, parts: string[][]): { text: string; broken?: string } {
  const text = template.replace(/\$(\d)/g, (_, n) => parts[Number(n) - 1]!.join(' '));
  const broken = /\$\d/.test(template) ? brokenPhrase(text.toLowerCase()) : undefined;
  return { text: capitalise(text), ...(broken ? { broken: broken.replace(/\bi\b/g, 'I') } : {}) };
}

const refs = (template: string) => [...template.matchAll(/\$(\d)/g)].map((m) => Number(m[1]));
function next(state: ElizaState, id: string, size: number): number {
  const n = state.counters[id] ?? 0;
  state.counters[id] = n + 1;
  return n % size;
}
// Reassemblies are used in turn. One that would quote an empty part is passed over.
function pick(state: ElizaState, id: string, replies: string[], parts: string[][]): number | undefined {
  for (let tries = 0; tries < replies.length; tries++) {
    const choice = next(state, id, replies.length);
    if (refs(replies[choice]!).every((n) => parts[n - 1]?.length)) return choice;
  }
  return undefined;
}

type Attempt = { reply: Reply; memory?: { text: string; broken?: string } } | 'newkey' | null;
function tryKeyword(name: string, words: string[], state: ElizaState, depth = 0): Attempt {
  let entry = script[name];
  while (entry?.link && !entry.rules) { name = entry.link; entry = script[name]; }
  if (!entry?.rules || depth > 4) return null;
  for (const [index, rule] of entry.rules.entries()) {
    const parts = decompose(rule.pattern, words);
    const choice = parts ? pick(state, `${name}#${index}`, rule.replies, parts) : undefined;
    if (!parts || choice === undefined) continue;
    const template = rule.replies[choice]!;
    if (template === '=newkey') return 'newkey';
    if (template.startsWith('=')) return tryKeyword(template.slice(1), words, state, depth + 1);
    const { text, broken } = assemble(template, parts);
    let memory: { text: string; broken?: string } | undefined;
    if (entry.memory) {
      const saved = decompose(entry.memory.pattern, words);
      const slot = saved ? pick(state, `${name}#memory`, entry.memory.replies, saved) : undefined;
      if (saved && slot !== undefined) memory = assemble(entry.memory.replies[slot]!, saved);
    }
    return { reply: { text, kind: 'keyword', keyword: name, rank: entry.rank, pattern: rule.pattern, choice: [choice + 1, rule.replies.length], tells: broken ? ['reflection'] : [], ...(broken ? { broken } : {}) }, ...(memory ? { memory } : {}) };
  }
  return null;
}

// One turn. Mutates state: reassembly counters advance, "my" may queue a memory, the reply is recorded.
export function respond(input: string, state: ElizaState): Reply {
  let reply: Reply | undefined;
  for (const original of clauses(input)) {
    const stack: { word: string; rank: number; at: number }[] = [];
    const words = original.map((word, at) => {
      const entry = script[word];
      if (entry && (entry.rules || entry.link)) stack.push({ word, rank: entry.rank, at });
      return subs[word] ?? word;
    });
    if (!stack.length) continue; // a clause without keywords is dropped, as in 1966
    stack.sort((a, b) => b.rank - a.rank || a.at - b.at);
    for (const key of stack) {
      const attempt = tryKeyword(key.word, words, state);
      if (attempt && attempt !== 'newkey') {
        if (attempt.memory) state.memory.push(attempt.memory);
        reply = attempt.reply;
        break;
      }
    }
    if (reply) break;
  }
  if (!reply) {
    const saved = state.memory.shift();
    const index = saved ? 0 : next(state, 'none', none.length);
    reply = saved
      ? { text: saved.text, kind: 'memory', tells: saved.broken ? ['reflection'] : [], ...(saved.broken ? { broken: saved.broken } : {}) }
      : { text: none[index]!, kind: 'fallback', choice: [index + 1, none.length], tells: ['fallback'] };
  }
  if (state.said.includes(reply.text)) reply.tells = [...reply.tells, 'repeat'];
  state.said.push(reply.text);
  return reply;
}

// Stars for catching all three tells: fewer messages is better.
export const elizaStars = (messages: number): 1 | 2 | 3 => (messages <= 5 ? 3 : messages <= 8 ? 2 : 1);
