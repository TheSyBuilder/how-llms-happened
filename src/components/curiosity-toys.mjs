// Small, invented examples for the two hidden desk drawers.
/** @type {Array<Array<[string, number]>>} */
export const tokenSteps = [
  [['a', 0.7], ['the', 0.3]],
  [['model', 0.6], ['cat', 0.3], ['moon', 0.1]],
  [['dreams', 0.55], ['whispers', 0.45]],
  [['in', 1]],
  [['tokens', 0.6], ['code', 0.25], ['riddles', 0.15]],
  [['.', 1]],
];

export function nextTokenOdds(step, temperature = 1) {
  const choices = tokenSteps[step] ?? [];
  const weights = choices.map(([word, weight]) => ({word, weight: weight ** (1 / temperature)}));
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  return weights.map(({word, weight}) => ({word, probability: weight / total}));
}

export function sampleToken(choices, random = Math.random()) {
  let remaining = random;
  for (const choice of choices) {
    remaining -= choice.probability;
    if (remaining < 0) return choice.word;
  }
  return choices.at(-1)?.word;
}

export function letterPattern(text) {
  const letters = (text.toLowerCase().match(/[a-z]/g) ?? []).map(letter => ({letter, kind: /[aeiou]/.test(letter) ? 'V' : 'C'}));
  const following = {V: {vowels: 0, total: 0}, C: {vowels: 0, total: 0}};
  letters.slice(0, -1).forEach((letter, index) => {
    following[letter.kind].total++;
    if (letters[index + 1].kind === 'V') following[letter.kind].vowels++;
  });
  return {letters, following};
}
