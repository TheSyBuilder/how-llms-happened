export type KneserContext = {
  predecessor: string;
  count: number;
};

export type KneserCandidate = {
  label: string;
  contexts: KneserContext[];
};

export type KneserExpectedCandidate = {
  label: string;
  rawCount: number;
  ordinaryProbability: number;
  distinctContextCount: number;
  distinctContextProbability: number;
  singletonContextCount: number;
  singletonContextProbability: number;
};

export type KneserState = {
  id: string;
  label: string;
  description: string;
  candidates: KneserCandidate[];
  expected: {
    totalTokens: number;
    totalDistinctContexts: number;
    totalSingletonContexts: number;
    candidates: KneserExpectedCandidate[];
  };
};

export type KneserScenario = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  modes: Array<"beginner" | "expert">;
  focusWord: string;
  states: KneserState[];
};

export type KneserFixture = {
  $schema: string;
  id: string;
  kind: "kneser-ney-context-coverage";
  label: "Synthetic example";
  description: string;
  representedClaimIds: string[];
  scenarios: KneserScenario[];
};

export type KneserCandidateResult = KneserExpectedCandidate & {
  contexts: KneserContext[];
};

export type KneserResult = {
  stateId: string;
  totalTokens: number;
  totalDistinctContexts: number;
  totalSingletonContexts: number;
  candidates: KneserCandidateResult[];
};

const EPSILON = 1e-9;

function closeEnough(left: number, right: number): boolean {
  return Math.abs(left - right) <= EPSILON;
}

function positiveContexts(candidate: KneserCandidate): KneserContext[] {
  return candidate.contexts.filter((context) => context.count > 0);
}

export function calculateKneserState(state: KneserState): KneserResult {
  const counts = state.candidates.map((candidate) => {
    const contexts = positiveContexts(candidate);
    return {
      candidate,
      contexts,
      rawCount: contexts.reduce((sum, context) => sum + context.count, 0),
      distinctContextCount: contexts.length,
      singletonContextCount: contexts.filter((context) => context.count === 1).length,
    };
  });
  const totalTokens = counts.reduce((sum, item) => sum + item.rawCount, 0);
  const totalDistinctContexts = counts.reduce((sum, item) => sum + item.distinctContextCount, 0);
  const totalSingletonContexts = counts.reduce((sum, item) => sum + item.singletonContextCount, 0);

  if (totalTokens <= 0 || totalDistinctContexts <= 0 || totalSingletonContexts <= 0) {
    throw new Error(`Kneser–Ney state ${state.id} needs positive token, distinct-context, and singleton totals.`);
  }

  return {
    stateId: state.id,
    totalTokens,
    totalDistinctContexts,
    totalSingletonContexts,
    candidates: counts.map(({ candidate, contexts, rawCount, distinctContextCount, singletonContextCount }) => ({
      label: candidate.label,
      contexts,
      rawCount,
      ordinaryProbability: rawCount / totalTokens,
      distinctContextCount,
      distinctContextProbability: distinctContextCount / totalDistinctContexts,
      singletonContextCount,
      singletonContextProbability: singletonContextCount / totalSingletonContexts,
    })),
  };
}

export function assertKneserExpected(state: KneserState, result: KneserResult): void {
  const scalarChecks: Array<[string, number, number]> = [
    ["total tokens", result.totalTokens, state.expected.totalTokens],
    ["total distinct contexts", result.totalDistinctContexts, state.expected.totalDistinctContexts],
    ["total singleton contexts", result.totalSingletonContexts, state.expected.totalSingletonContexts],
  ];
  for (const [label, actual, expected] of scalarChecks) {
    if (!closeEnough(actual, expected)) {
      throw new Error(`${state.id} ${label}: expected ${expected}, received ${actual}.`);
    }
  }

  for (const expected of state.expected.candidates) {
    const actual = result.candidates.find((candidate) => candidate.label === expected.label);
    if (actual === undefined) throw new Error(`${state.id} is missing expected candidate ${expected.label}.`);
    for (const key of [
      "rawCount",
      "ordinaryProbability",
      "distinctContextCount",
      "distinctContextProbability",
      "singletonContextCount",
      "singletonContextProbability",
    ] as const) {
      if (!closeEnough(actual[key], expected[key])) {
        throw new Error(`${state.id} ${expected.label} ${key}: expected ${expected[key]}, received ${actual[key]}.`);
      }
    }
  }
}

function countByContext(candidate: KneserCandidate): Map<string, number> {
  return new Map(candidate.contexts.map((context) => [context.predecessor, context.count]));
}

function assertOneOccurrenceMove(previous: KneserState, next: KneserState, focusWord: string): void {
  const previousResult = calculateKneserState(previous);
  const nextResult = calculateKneserState(next);
  const previousLabels = previousResult.candidates.map((candidate) => candidate.label);
  const nextLabels = nextResult.candidates.map((candidate) => candidate.label);
  if (JSON.stringify(previousLabels) !== JSON.stringify(nextLabels)) {
    throw new Error(`${previous.id} → ${next.id} changes the candidate set.`);
  }

  for (const previousCandidate of previous.candidates) {
    const nextCandidate = next.candidates.find((candidate) => candidate.label === previousCandidate.label);
    if (nextCandidate === undefined) throw new Error(`${next.id} is missing ${previousCandidate.label}.`);
    const before = countByContext(previousCandidate);
    const after = countByContext(nextCandidate);
    const contexts = new Set([...before.keys(), ...after.keys()]);
    const absoluteChange = [...contexts]
      .reduce((sum, context) => sum + Math.abs((before.get(context) ?? 0) - (after.get(context) ?? 0)), 0);
    if (previousCandidate.label === focusWord) {
      if (absoluteChange !== 2) {
        throw new Error(`${previous.id} → ${next.id} must move exactly one ${focusWord} occurrence.`);
      }
    } else if (absoluteChange !== 0) {
      throw new Error(`${previous.id} → ${next.id} changes non-focus candidate ${previousCandidate.label}.`);
    }
  }

  for (const label of previousLabels) {
    const before = previousResult.candidates.find((candidate) => candidate.label === label);
    const after = nextResult.candidates.find((candidate) => candidate.label === label);
    if (before?.rawCount !== after?.rawCount) {
      throw new Error(`${previous.id} → ${next.id} changes the raw count for ${label}.`);
    }
  }
  const beforeFocus = previousResult.candidates.find((candidate) => candidate.label === focusWord);
  const afterFocus = nextResult.candidates.find((candidate) => candidate.label === focusWord);
  if (beforeFocus === undefined || afterFocus === undefined || afterFocus.distinctContextCount !== beforeFocus.distinctContextCount + 1) {
    throw new Error(`${previous.id} → ${next.id} must add exactly one distinct context for ${focusWord}.`);
  }
}

export function validateKneserScenario(scenario: KneserScenario): void {
  if (scenario.states.length < 2) throw new Error(`${scenario.id} needs at least two authored states.`);
  for (const state of scenario.states) {
    const result = calculateKneserState(state);
    assertKneserExpected(state, result);
    const ordinaryTotal = result.candidates.reduce((sum, candidate) => sum + candidate.ordinaryProbability, 0);
    const distinctTotal = result.candidates.reduce((sum, candidate) => sum + candidate.distinctContextProbability, 0);
    const singletonTotal = result.candidates.reduce((sum, candidate) => sum + candidate.singletonContextProbability, 0);
    if (![ordinaryTotal, distinctTotal, singletonTotal].every((total) => closeEnough(total, 1))) {
      throw new Error(`${state.id} does not normalize every displayed distribution.`);
    }
  }
  for (let index = 1; index < scenario.states.length; index += 1) {
    const previous = scenario.states[index - 1];
    const next = scenario.states[index];
    if (previous === undefined || next === undefined) throw new Error(`${scenario.id} has an unavailable transition.`);
    assertOneOccurrenceMove(previous, next, scenario.focusWord);
  }
}
