const EPSILON = 1e-9;

export type ChenVariantId = "single" | "modified";

export type ChenContinuation = {
  label: string;
  count: number;
  lowerOrderProbability: number;
};

export type ChenScenario = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  modes: Array<"beginner" | "expert">;
  history: string;
  singleDiscount: number;
  countOfCounts: { n1: number; n2: number; n3: number; n4: number };
  continuations: ChenContinuation[];
  expected: Record<ChenVariantId, ChenExpectedVariant>;
};

export type ChenFixture = {
  id: string;
  kind: "chen-goodman-interpolation-discounts";
  label: "Synthetic example";
  description: string;
  representedClaimIds: string[];
  scenarios: ChenScenario[];
};

export type ChenDiscounts = {
  d1: number;
  d2: number;
  d3Plus: number;
};

export type ChenContinuationResult = ChenContinuation & {
  tier: "zero" | "D1" | "D2" | "D3+";
  discount: number;
  higherOrderContribution: number;
  lowerOrderContribution: number;
  finalProbability: number;
};

export type ChenVariantResult = {
  variant: ChenVariantId;
  historyCount: number;
  discounts: ChenDiscounts;
  retainedMass: number;
  interpolationWeight: number;
  lowerOrderMass: number;
  total: number;
  continuations: ChenContinuationResult[];
};

type ChenExpectedContinuation = {
  label: string;
  tier: ChenContinuationResult["tier"];
  discount: number;
  higherOrderContribution: number;
  lowerOrderContribution: number;
  finalProbability: number;
};

export type ChenExpectedVariant = {
  retainedMass: number;
  interpolationWeight: number;
  lowerOrderMass: number;
  total: number;
  continuations: ChenExpectedContinuation[];
};

function closeEnough(left: number, right: number): boolean {
  return Math.abs(left - right) <= EPSILON;
}

export function calculateFixedDiscounts(counts: ChenScenario["countOfCounts"]): ChenDiscounts & { y: number } {
  if (counts.n1 <= 0 || counts.n2 <= 0 || counts.n3 <= 0 || counts.n4 < 0) {
    throw new Error("Fixed discount estimates require positive n1, n2, and n3 and nonnegative n4.");
  }
  const y = counts.n1 / (counts.n1 + 2 * counts.n2);
  const d1 = 1 - 2 * y * (counts.n2 / counts.n1);
  const d2 = 2 - 3 * y * (counts.n3 / counts.n2);
  const d3Plus = 3 - 4 * y * (counts.n4 / counts.n3);
  if (![d1, d2, d3Plus].every(Number.isFinite)) {
    throw new Error("Fixed discount estimates must be finite.");
  }
  if (d1 < 0 || d1 >= 1 || d2 < 0 || d2 >= 2 || d3Plus < 0 || d3Plus >= 3) {
    throw new Error("Fixed discount estimates must stay inside their count-tier bounds.");
  }
  return { y, d1, d2, d3Plus };
}

function tierForCount(count: number): ChenContinuationResult["tier"] {
  if (count === 0) return "zero";
  if (count === 1) return "D1";
  if (count === 2) return "D2";
  return "D3+";
}

function discountForCount(count: number, discounts: ChenDiscounts): number {
  if (count === 0) return 0;
  if (count === 1) return discounts.d1;
  if (count === 2) return discounts.d2;
  return discounts.d3Plus;
}

export function calculateChenScenario(scenario: ChenScenario, variant: ChenVariantId): ChenVariantResult {
  if (scenario.continuations.length < 2) throw new Error(`${scenario.id} needs at least two continuations.`);
  const labels = new Set<string>();
  for (const continuation of scenario.continuations) {
    if (labels.has(continuation.label)) throw new Error(`${scenario.id} has duplicate continuation ${continuation.label}.`);
    labels.add(continuation.label);
    if (!Number.isInteger(continuation.count) || continuation.count < 0) {
      throw new Error(`${scenario.id} has an invalid count for ${continuation.label}.`);
    }
    if (continuation.lowerOrderProbability < 0 || continuation.lowerOrderProbability > 1) {
      throw new Error(`${scenario.id} has an invalid lower-order probability for ${continuation.label}.`);
    }
  }

  const lowerOrderTotal = scenario.continuations.reduce((sum, item) => sum + item.lowerOrderProbability, 0);
  if (!closeEnough(lowerOrderTotal, 1)) throw new Error(`${scenario.id} lower-order probabilities do not normalize.`);
  const historyCount = scenario.continuations.reduce((sum, item) => sum + item.count, 0);
  if (historyCount <= 0) throw new Error(`${scenario.id} must contain an observed history.`);

  const fixed = calculateFixedDiscounts(scenario.countOfCounts);
  const discounts: ChenDiscounts = variant === "single"
    ? { d1: scenario.singleDiscount, d2: scenario.singleDiscount, d3Plus: scenario.singleDiscount }
    : { d1: fixed.d1, d2: fixed.d2, d3Plus: fixed.d3Plus };

  const continuations = scenario.continuations.map((continuation): ChenContinuationResult => {
    const discount = discountForCount(continuation.count, discounts);
    if (continuation.count > 0 && (discount < 0 || discount >= continuation.count)) {
      throw new Error(`${scenario.id} ${variant} discount is outside [0, count) for ${continuation.label}.`);
    }
    return {
      ...continuation,
      tier: tierForCount(continuation.count),
      discount,
      higherOrderContribution: Math.max(continuation.count - discount, 0) / historyCount,
      lowerOrderContribution: 0,
      finalProbability: 0,
    };
  });
  const retainedMass = continuations.reduce((sum, item) => sum + item.higherOrderContribution, 0);
  const interpolationWeight = 1 - retainedMass;
  const withInterpolation = continuations.map((continuation): ChenContinuationResult => {
    const lowerOrderContribution = interpolationWeight * continuation.lowerOrderProbability;
    return {
      ...continuation,
      lowerOrderContribution,
      finalProbability: continuation.higherOrderContribution + lowerOrderContribution,
    };
  });
  const lowerOrderMass = withInterpolation.reduce((sum, item) => sum + item.lowerOrderContribution, 0);
  const total = withInterpolation.reduce((sum, item) => sum + item.finalProbability, 0);
  if (![retainedMass, interpolationWeight, lowerOrderMass, total].every(Number.isFinite)) {
    throw new Error(`${scenario.id} ${variant} produced a non-finite result.`);
  }
  if (!closeEnough(lowerOrderMass, interpolationWeight) || !closeEnough(total, 1)) {
    throw new Error(`${scenario.id} ${variant} does not conserve probability mass.`);
  }
  return { variant, historyCount, discounts, retainedMass, interpolationWeight, lowerOrderMass, total, continuations: withInterpolation };
}

export function assertChenExpected(scenario: ChenScenario, result: ChenVariantResult): void {
  const expected = scenario.expected[result.variant];
  for (const key of ["retainedMass", "interpolationWeight", "lowerOrderMass", "total"] as const) {
    if (!closeEnough(result[key], expected[key])) {
      throw new Error(`${scenario.id} ${result.variant} expected ${key} ${expected[key]} but calculated ${result[key]}.`);
    }
  }
  if (result.continuations.length !== expected.continuations.length) {
    throw new Error(`${scenario.id} ${result.variant} expected continuation count does not match.`);
  }
  for (const expectedItem of expected.continuations) {
    const actual = result.continuations.find((item) => item.label === expectedItem.label);
    if (actual === undefined) throw new Error(`${scenario.id} ${result.variant} is missing ${expectedItem.label}.`);
    if (actual.tier !== expectedItem.tier) throw new Error(`${scenario.id} ${result.variant} tier mismatch for ${actual.label}.`);
    for (const key of ["discount", "higherOrderContribution", "lowerOrderContribution", "finalProbability"] as const) {
      if (!closeEnough(actual[key], expectedItem[key])) {
        throw new Error(`${scenario.id} ${result.variant} ${actual.label} expected ${key} ${expectedItem[key]} but calculated ${actual[key]}.`);
      }
    }
  }
}

export function validateChenScenario(scenario: ChenScenario): void {
  for (const variant of ["single", "modified"] as const) {
    const result = calculateChenScenario(scenario, variant);
    assertChenExpected(scenario, result);
  }
  const counts = scenario.continuations.map((item) => item.count);
  if (![0, 1, 2].every((count) => counts.includes(count)) || !counts.some((count) => count >= 3)) {
    throw new Error(`${scenario.id} must expose zero, one, two, and three-plus count branches.`);
  }
}
