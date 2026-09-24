export type KatzContinuation = {
  label: string;
  higherOrderCount: number;
  discountedCount: number;
  lowerOrderProbability: number;
};

export type KatzExpectedOutput = {
  branch: "observed-history" | "unseen-history";
  reservedMass: number | null;
  eligibleLowerOrderMass: number;
  alpha: number | null;
  finalProbabilities: Array<{ label: string; probability: number }>;
  total: number;
};

export type KatzScenario = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  modes: Array<"beginner" | "expert">;
  history: string;
  historyCount: number;
  cutoffK: number;
  continuations: KatzContinuation[];
  expected: KatzExpectedOutput;
};

export type KatzFixture = {
  id: string;
  kind: "katz-probability-mass";
  label: "Synthetic example";
  description: string;
  representedClaimIds: string[];
  scenarios: KatzScenario[];
};

export type KatzContinuationResult = KatzContinuation & {
  higherOrderEstimate: number;
  lowerOrderContribution: number;
  finalProbability: number;
  gate: "keep" | "back-off" | "drop-history";
};

export type KatzResult = {
  branch: "observed-history" | "unseen-history";
  retainedMass: number;
  reservedMass: number | null;
  eligibleLowerOrderMass: number;
  alpha: number | null;
  eligibleLabels: string[];
  continuations: KatzContinuationResult[];
  total: number;
};

const TOLERANCE = 1e-9;

function assertFiniteProbability(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be a finite probability between zero and one.`);
  }
}

function closeEnough(left: number, right: number): boolean {
  return Math.abs(left - right) <= TOLERANCE;
}

export function calculateKatzScenario(scenario: KatzScenario): KatzResult {
  if (!Number.isInteger(scenario.historyCount) || scenario.historyCount < 0) {
    throw new Error(`${scenario.id} has an invalid history count.`);
  }
  if (!Number.isInteger(scenario.cutoffK) || scenario.cutoffK < 1) {
    throw new Error(`${scenario.id} has an invalid cutoff.`);
  }
  if (scenario.continuations.length < 2) {
    throw new Error(`${scenario.id} must define at least two continuations.`);
  }

  const labels = new Set<string>();
  let rawCountTotal = 0;
  let lowerOrderTotal = 0;

  for (const continuation of scenario.continuations) {
    if (labels.has(continuation.label)) {
      throw new Error(`${scenario.id} repeats continuation ${continuation.label}.`);
    }
    labels.add(continuation.label);
    if (!Number.isInteger(continuation.higherOrderCount) || continuation.higherOrderCount < 0) {
      throw new Error(`${scenario.id}/${continuation.label} has an invalid higher-order count.`);
    }
    if (
      !Number.isFinite(continuation.discountedCount)
      || continuation.discountedCount < 0
      || continuation.discountedCount > continuation.higherOrderCount
    ) {
      throw new Error(`${scenario.id}/${continuation.label} has an invalid discounted count.`);
    }
    if (
      continuation.higherOrderCount > scenario.cutoffK
      && !closeEnough(continuation.discountedCount, continuation.higherOrderCount)
    ) {
      throw new Error(`${scenario.id}/${continuation.label} exceeds k and must remain undiscounted.`);
    }
    assertFiniteProbability(
      continuation.lowerOrderProbability,
      `${scenario.id}/${continuation.label} lower-order probability`,
    );
    rawCountTotal += continuation.higherOrderCount;
    lowerOrderTotal += continuation.lowerOrderProbability;
  }

  if (!closeEnough(lowerOrderTotal, 1)) {
    throw new Error(`${scenario.id} lower-order probabilities must sum to one.`);
  }
  if (rawCountTotal !== scenario.historyCount) {
    throw new Error(`${scenario.id} continuation counts do not sum to the history count.`);
  }

  if (scenario.historyCount === 0) {
    const continuations = scenario.continuations.map((continuation) => ({
      ...continuation,
      higherOrderEstimate: 0,
      lowerOrderContribution: continuation.lowerOrderProbability,
      finalProbability: continuation.lowerOrderProbability,
      gate: "drop-history" as const,
    }));
    return {
      branch: "unseen-history",
      retainedMass: 0,
      reservedMass: null,
      eligibleLowerOrderMass: 1,
      alpha: null,
      eligibleLabels: continuations.map((continuation) => continuation.label),
      continuations,
      total: continuations.reduce((sum, continuation) => sum + continuation.finalProbability, 0),
    };
  }

  const preliminary = scenario.continuations.map((continuation) => ({
    continuation,
    higherOrderEstimate: continuation.discountedCount / scenario.historyCount,
  }));
  const retainedMass = preliminary.reduce((sum, item) => sum + item.higherOrderEstimate, 0);
  const reservedMass = 1 - retainedMass;
  if (reservedMass < -TOLERANCE) {
    throw new Error(`${scenario.id} retains more than one unit of probability mass.`);
  }

  const eligible = preliminary.filter((item) => closeEnough(item.higherOrderEstimate, 0));
  const eligibleLowerOrderMass = eligible.reduce(
    (sum, item) => sum + item.continuation.lowerOrderProbability,
    0,
  );
  if (reservedMass > TOLERANCE && eligibleLowerOrderMass <= TOLERANCE) {
    throw new Error(`${scenario.id} reserves mass but has no eligible lower-order support.`);
  }
  const alpha = eligibleLowerOrderMass === 0 ? 0 : Math.max(0, reservedMass) / eligibleLowerOrderMass;

  const continuations = preliminary.map(({ continuation, higherOrderEstimate }) => {
    const backsOff = closeEnough(higherOrderEstimate, 0);
    const lowerOrderContribution = backsOff ? alpha * continuation.lowerOrderProbability : 0;
    return {
      ...continuation,
      higherOrderEstimate,
      lowerOrderContribution,
      finalProbability: backsOff ? lowerOrderContribution : higherOrderEstimate,
      gate: backsOff ? "back-off" as const : "keep" as const,
    };
  });

  return {
    branch: "observed-history",
    retainedMass,
    reservedMass: Math.max(0, reservedMass),
    eligibleLowerOrderMass,
    alpha,
    eligibleLabels: eligible.map((item) => item.continuation.label),
    continuations,
    total: continuations.reduce((sum, continuation) => sum + continuation.finalProbability, 0),
  };
}

export function assertKatzExpected(scenario: KatzScenario, result: KatzResult): void {
  const expected = scenario.expected;
  if (result.branch !== expected.branch) {
    throw new Error(`${scenario.id} branch does not match its reviewed output.`);
  }
  for (const [label, actual, reviewed] of [
    ["reserved mass", result.reservedMass, expected.reservedMass],
    ["eligible lower-order mass", result.eligibleLowerOrderMass, expected.eligibleLowerOrderMass],
    ["alpha", result.alpha, expected.alpha],
    ["total", result.total, expected.total],
  ] as const) {
    if (actual === null || reviewed === null) {
      if (actual !== reviewed) throw new Error(`${scenario.id} ${label} does not match its reviewed output.`);
    } else if (!closeEnough(actual, reviewed)) {
      throw new Error(`${scenario.id} ${label} does not match its reviewed output.`);
    }
  }

  if (expected.finalProbabilities.length !== result.continuations.length) {
    throw new Error(`${scenario.id} reviewed continuation count does not match.`);
  }
  for (const expectedContinuation of expected.finalProbabilities) {
    const actual = result.continuations.find((item) => item.label === expectedContinuation.label);
    if (actual === undefined || !closeEnough(actual.finalProbability, expectedContinuation.probability)) {
      throw new Error(`${scenario.id}/${expectedContinuation.label} does not match its reviewed output.`);
    }
  }
}
