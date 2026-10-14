const TOLERANCE = 1e-12;

type Base = { id: string; sourceStage: string; bindingId: string; description: string };
export type Binding = {
  id: string;
  claimIds: string[];
  sourceIds: string[];
  versionIds: string[];
  scope: string;
};
export type ConditionalOutput = Base & {
  kind: "conditional-output";
  sourceTokens: string[];
  sourceSummary: number[];
  vocabulary: string[];
  eos: string;
  observedTarget: string[];
  steps: Array<{ prefix: string[]; logits: number[] }>;
  expected: ConditionalResult;
};
type ConditionalResult = {
  probabilities: number[][];
  selectedProbabilities: number[];
  sequenceProbability: number;
  negativeLogLikelihood: number;
};
type ResetResult = {
  recurrentTerm: number[];
  preactivation: number[];
  candidate: number[];
  oldContribution: number[];
  candidateContribution: number[];
  state: number[];
};
export type ChoReset = Base & {
  kind: "cho-reset";
  previousState: number[];
  externalTerm: number[];
  recurrentMatrix: number[][];
  resetLogits: number[];
  updateLogits: number[];
  gateConvention: "z-weights-old-state";
  expected: { reset: number[]; update: number[]; main: ResetResult; attachment: ResetResult };
};
export type SourceReversal = Base & {
  kind: "source-reversal";
  sourceTokens: string[];
  targetTokens: string[];
  eos: string;
  eosConvention: "one-source-eos-slot";
  pairs: Array<{ sourceIndex: number; targetIndex: number }>;
  expected: ReversalResult;
};
type ReversalResult = {
  forwardOrder: string[];
  reversedOrder: string[];
  targetOrder: string[];
  forwardGaps: number[];
  reversedGaps: number[];
  forwardMean: number;
  reversedMean: number;
};
type ReadResult = {
  id: string;
  queryProjection: number[];
  annotationProjections: number[][];
  preactivations: number[][];
  activations: number[][];
  energies: number[];
  energyMaximum: number;
  shiftedExponentials: number[];
  normalizer: number;
  weights: number[];
  contributions: number[][];
  context: number[];
};
export type BahdanauRead = Base & {
  kind: "bahdanau-read";
  case: "changing-query" | "equal-energies" | "identical-annotations";
  stateProvenance: "supplied-prior-states";
  normalizationAxis: "source-positions";
  annotations: Array<{ id: string; token: string; forward: number[]; backward: number[] }>;
  steps: Array<{ id: string; prefix: string[]; priorState: number[] }>;
  queryMatrix: number[][];
  annotationMatrix: number[][];
  scoreVector: number[];
  expected: ReadResult[];
};
export type AlignmentScenario = ConditionalOutput | ChoReset | SourceReversal | BahdanauRead;
export type AlignmentFixture = {
  id: string;
  kind: "alignment-arithmetic";
  label: "Synthetic example";
  provenance: "authored-arithmetic";
  description: string;
  modes: Array<"beginner" | "expert">;
  bindings: Binding[];
  scenarios: AlignmentScenario[];
};

function vector(values: number[], label: string, length?: number): void {
  if (values.length === 0 || (length !== undefined && values.length !== length)
    || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${label} must contain finite values with the declared shape.`);
  }
}
function matrix(values: number[][], rows: number, columns: number, label: string): void {
  if (values.length !== rows) throw new Error(`${label} has the wrong row count.`);
  values.forEach((row) => vector(row, label, columns));
}
function dot(left: number[], right: number[]): number {
  vector(left, "Dot input", right.length);
  vector(right, "Dot input");
  return left.reduce((sum, value, index) => sum + value * right[index]!, 0);
}
function project(values: number[][], input: number[]): number[] {
  return values.map((row) => dot(row, input));
}
function total(values: number[]): number { return values.reduce((sum, value) => sum + value, 0); }
function unique(values: string[], label: string): void {
  if (values.length === 0 || new Set(values).size !== values.length) throw new Error(`${label} must be nonempty and unique.`);
}
export function stableSoftmax(energies: number[]): { maximum: number; exponentials: number[]; normalizer: number; weights: number[] } {
  vector(energies, "Softmax energies");
  const maximum = Math.max(...energies);
  const exponentials = energies.map((energy) => Math.exp(energy - maximum));
  const normalizer = total(exponentials);
  return { maximum, exponentials, normalizer, weights: exponentials.map((value) => value / normalizer) };
}

export function calculateConditionalOutput(scenario: ConditionalOutput): ConditionalResult {
  unique(scenario.vocabulary, "Vocabulary");
  vector(scenario.sourceSummary, "Supplied source summary");
  if (!scenario.vocabulary.includes(scenario.eos) || scenario.observedTarget.at(-1) !== scenario.eos
    || scenario.observedTarget.slice(0, -1).includes(scenario.eos)
    || scenario.steps.length !== scenario.observedTarget.length || scenario.steps.length === 0) {
    throw new Error("Conditional output must score exactly one EOS-terminated target.");
  }
  const probabilities = scenario.steps.map((step, index) => {
    if (JSON.stringify(step.prefix) !== JSON.stringify(scenario.observedTarget.slice(0, index))) {
      throw new Error("Output scores must be bound to the observed target prefix.");
    }
    vector(step.logits, "Vocabulary logits", scenario.vocabulary.length);
    return stableSoftmax(step.logits).weights;
  });
  const selectedProbabilities = probabilities.map((row, index) => {
    const position = scenario.vocabulary.indexOf(scenario.observedTarget[index]!);
    if (position < 0) throw new Error("Observed target is outside the fixture vocabulary.");
    return row[position]!;
  });
  const sequenceProbability = selectedProbabilities.reduce((product, value) => product * value, 1);
  const negativeLogLikelihood = -total(selectedProbabilities.map(Math.log));
  if (!Number.isFinite(negativeLogLikelihood)) throw new Error("Selected target probability must be positive.");
  return { probabilities, selectedProbabilities, sequenceProbability, negativeLogLikelihood };
}

export function calculateChoReset(scenario: ChoReset): ChoReset["expected"] {
  if (scenario.gateConvention !== "z-weights-old-state") throw new Error("Cho z must weight the old state.");
  const width = scenario.previousState.length;
  vector(scenario.previousState, "Previous state");
  vector(scenario.externalTerm, "External term", width);
  vector(scenario.resetLogits, "Reset logits", width);
  vector(scenario.updateLogits, "Update logits", width);
  matrix(scenario.recurrentMatrix, width, width, "Recurrent matrix");
  const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));
  const reset = scenario.resetLogits.map(sigmoid);
  const update = scenario.updateLogits.map(sigmoid);
  const resetState = scenario.previousState.map((value, index) => value * reset[index]!);
  const mainTerm = project(scenario.recurrentMatrix, resetState);
  const attachmentTerm = project(scenario.recurrentMatrix, scenario.previousState).map((value, index) => value * reset[index]!);
  const evaluate = (recurrentTerm: number[]): ResetResult => {
    const preactivation = recurrentTerm.map((value, index) => value + scenario.externalTerm[index]!);
    const candidate = preactivation.map(Math.tanh);
    const oldContribution = scenario.previousState.map((value, index) => update[index]! * value);
    const candidateContribution = candidate.map((value, index) => (1 - update[index]!) * value);
    return { recurrentTerm, preactivation, candidate, oldContribution, candidateContribution,
      state: oldContribution.map((value, index) => value + candidateContribution[index]!) };
  };
  return { reset, update, main: evaluate(mainTerm), attachment: evaluate(attachmentTerm) };
}

export function calculateSourceReversal(scenario: SourceReversal): ReversalResult {
  if (scenario.eosConvention !== "one-source-eos-slot") throw new Error("Declare the source EOS distance convention.");
  unique(scenario.sourceTokens, "Source identities");
  unique(scenario.targetTokens, "Target identities");
  if (scenario.sourceTokens.includes(scenario.eos) || scenario.targetTokens.includes(scenario.eos)
    || scenario.pairs.length === 0) throw new Error("Reversal tokens exclude EOS; aligned pairs must be supplied.");
  const sourceCount = scenario.sourceTokens.length;
  const forwardGaps: number[] = [];
  const reversedGaps: number[] = [];
  for (const pair of scenario.pairs) {
    if (!Number.isInteger(pair.sourceIndex) || pair.sourceIndex < 0 || pair.sourceIndex >= sourceCount
      || !Number.isInteger(pair.targetIndex) || pair.targetIndex < 0 || pair.targetIndex >= scenario.targetTokens.length) {
      throw new Error("Reversal pair index is outside the declared token sequence.");
    }
    // Zero-based source slot i and target slot S+1+j count the intervening source EOS.
    const targetSlot = sourceCount + 1 + pair.targetIndex;
    forwardGaps.push(targetSlot - pair.sourceIndex);
    reversedGaps.push(targetSlot - (sourceCount - 1 - pair.sourceIndex));
  }
  return { forwardOrder: [...scenario.sourceTokens, scenario.eos],
    reversedOrder: [...scenario.sourceTokens].reverse().concat(scenario.eos),
    targetOrder: [...scenario.targetTokens, scenario.eos], forwardGaps, reversedGaps,
    forwardMean: total(forwardGaps) / forwardGaps.length, reversedMean: total(reversedGaps) / reversedGaps.length };
}

export function calculateBahdanauRead(scenario: BahdanauRead): ReadResult[] {
  if (scenario.normalizationAxis !== "source-positions" || scenario.stateProvenance !== "supplied-prior-states") {
    throw new Error("Bahdanau reads require source normalization and supplied prior states.");
  }
  unique(scenario.annotations.map((annotation) => annotation.id), "Annotation identities");
  unique(scenario.steps.map((step) => step.id), "Read steps");
  const annotations = scenario.annotations.map((annotation) => {
    vector(annotation.forward, "Forward annotation", 1);
    vector(annotation.backward, "Backward annotation", 1);
    return [...annotation.forward, ...annotation.backward];
  });
  const scorerWidth = scenario.scoreVector.length;
  vector(scenario.scoreVector, "Score vector");
  matrix(scenario.annotationMatrix, scorerWidth, 2, "Annotation matrix");
  const annotationProjections = annotations.map((annotation) => project(scenario.annotationMatrix, annotation));
  return scenario.steps.map((step) => {
    vector(step.priorState, "Supplied prior state");
    matrix(scenario.queryMatrix, scorerWidth, step.priorState.length, "Query matrix");
    const queryProjection = project(scenario.queryMatrix, step.priorState);
    const preactivations = annotationProjections.map((row) => row.map((value, index) => value + queryProjection[index]!));
    const activations = preactivations.map((row) => row.map(Math.tanh));
    const energies = activations.map((row) => dot(scenario.scoreVector, row));
    const normalized = stableSoftmax(energies);
    const contributions = annotations.map((row, index) => row.map((value) => value * normalized.weights[index]!));
    const context = [0, 1].map((index) => total(contributions.map((row) => row[index]!)));
    return { id: step.id, queryProjection, annotationProjections, preactivations, activations, energies,
      energyMaximum: normalized.maximum, shiftedExponentials: normalized.exponentials,
      normalizer: normalized.normalizer, weights: normalized.weights, contributions, context };
  });
}

export function calculateAlignmentScenario(scenario: AlignmentScenario): AlignmentScenario["expected"] {
  switch (scenario.kind) {
    case "conditional-output": return calculateConditionalOutput(scenario);
    case "cho-reset": return calculateChoReset(scenario);
    case "source-reversal": return calculateSourceReversal(scenario);
    case "bahdanau-read": return calculateBahdanauRead(scenario);
    default: throw new Error("Unsupported alignment operation; local-p is not admitted.");
  }
}

function compare(actual: unknown, expected: unknown, path: string): void {
  if (typeof expected === "number") {
    if (typeof actual !== "number" || !Number.isFinite(actual) || !Number.isFinite(expected)
      || Math.abs(actual - expected) > TOLERANCE) throw new Error(`Expected arithmetic differs at ${path}.`);
  } else if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) throw new Error(`Expected shape differs at ${path}.`);
    expected.forEach((value, index) => compare(actual[index], value, `${path}[${index}]`));
  } else if (expected !== null && typeof expected === "object") {
    if (actual === null || typeof actual !== "object"
      || JSON.stringify(Object.keys(actual).sort()) !== JSON.stringify(Object.keys(expected).sort())) {
      throw new Error(`Expected fields differ at ${path}.`);
    }
    for (const [key, value] of Object.entries(expected)) compare((actual as Record<string, unknown>)[key], value, `${path}.${key}`);
  } else if (actual !== expected) throw new Error(`Expected value differs at ${path}.`);
}
export function validateAlignmentFixture(fixture: AlignmentFixture): void {
  if (fixture.label !== "Synthetic example" || fixture.provenance !== "authored-arithmetic") {
    throw new Error("Alignment arithmetic must retain its synthetic provenance.");
  }
  unique(fixture.scenarios.map((scenario) => scenario.id), "Scenario IDs");
  unique(fixture.bindings.map((binding) => binding.id), "Binding IDs");
  for (const scenario of fixture.scenarios) {
    if (!fixture.bindings.some((binding) => binding.id === scenario.bindingId)) throw new Error(`Unknown binding ${scenario.bindingId}.`);
    const actual = calculateAlignmentScenario(scenario);
    compare(actual, scenario.expected, scenario.id);
    if (scenario.kind === "bahdanau-read") {
      const reads = actual as ReadResult[];
      if (scenario.case === "equal-energies" && reads.some((read) => read.energies.some((energy) => Math.abs(energy - read.energies[0]!) > TOLERANCE))) {
        throw new Error("Equal-energy safeguard must preserve equal energies.");
      }
      if (scenario.case === "identical-annotations") {
        const first = scenario.annotations[0]!;
        if (scenario.annotations.some((annotation) => JSON.stringify([annotation.forward, annotation.backward]) !== JSON.stringify([first.forward, first.backward]))) {
          throw new Error("Identical-annotation safeguard must retain identical coordinates.");
        }
      }
      for (const read of reads) {
        if (Math.abs(total(read.weights) - 1) > TOLERANCE || read.weights.some((weight) => weight < 0)) {
          throw new Error("Source weights must be normalized before rounding.");
        }
        for (const coordinate of [0, 1]) {
          const values = scenario.annotations.map((annotation) => [...annotation.forward, ...annotation.backward][coordinate]!);
          if (read.context[coordinate]! < Math.min(...values) - TOLERANCE
            || read.context[coordinate]! > Math.max(...values) + TOLERANCE) throw new Error("Context is outside the annotation coordinate range.");
        }
      }
    }
  }
}
