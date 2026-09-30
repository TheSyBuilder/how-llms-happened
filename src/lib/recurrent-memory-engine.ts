const EPSILON = 1e-9;

export type Mode = "beginner" | "expert";

type ScenarioBase = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  modes: Mode[];
  sourceStage: string;
};

export type ElmanHistory = {
  id: string;
  label: string;
  tokens: string[];
  inputs: number[];
};

export type ElmanHistoryTrace = {
  id: string;
  states: number[];
};

export type ElmanScenario = ScenarioBase & {
  kind: "elman-history-contrast";
  activeStep: number;
  initialState: number;
  inputWeight: number;
  recurrentWeight: number;
  bias: number;
  histories: [ElmanHistory, ElmanHistory];
  expected: { histories: [ElmanHistoryTrace, ElmanHistoryTrace] };
};

export type OriginalCellStep = {
  token: string;
  candidate: number;
  inputGate: number;
  outputGate: number;
};

export type OriginalCellStepResult = OriginalCellStep & {
  previousState: number;
  writtenContribution: number;
  state: number;
  exposedOutput: number;
};

export type CreditPoint = {
  distanceFromTarget: number;
  ordinaryPath: number;
  protectedPath: number;
};

export type OriginalCellScenario = ScenarioBase & {
  kind: "original-cell-credit";
  initialState: number;
  ordinaryLocalFactors: number[];
  protectedLocalFactors: number[];
  steps: OriginalCellStep[];
  expected: {
    steps: Array<{
      previousState: number;
      writtenContribution: number;
      state: number;
      exposedOutput: number;
    }>;
    credit: CreditPoint[];
  };
};

export type ForgetPreset = {
  id: "near-retain" | "gradual-decay" | "near-reset";
  label: string;
  forgetGate: number;
};

export type ForgetPresetResult = ForgetPreset & {
  retainedContribution: number;
  resultingState: number;
};

export type ForgetScenario = ScenarioBase & {
  kind: "forget-retention";
  previousState: number;
  candidate: number;
  inputGate: number;
  presets: ForgetPreset[];
  expected: {
    inputGatedWrite: number;
    presets: Array<{
      id: ForgetPreset["id"];
      retainedContribution: number;
      resultingState: number;
    }>;
  };
};

export type PeepholeParameters = {
  previousState: number;
  candidate: number;
  inputExternal: number;
  forgetExternal: number;
  outputExternal: number;
  inputPeepholeWeight: number;
  forgetPeepholeWeight: number;
  outputPeepholeWeight: number;
};

export type PeepholeVariantResult = {
  inputInspectedState: number | null;
  forgetInspectedState: number | null;
  outputInspectedState: number | null;
  inputGate: number;
  forgetGate: number;
  inputGatedWrite: number;
  retainedContribution: number;
  state: number;
  outputGate: number;
  exposedOutput: number;
};

export type PeepholeScenario = ScenarioBase & {
  kind: "peephole-inspection";
  parameters: PeepholeParameters;
  expected: {
    withoutPeepholes: PeepholeVariantResult;
    withPeepholes: PeepholeVariantResult;
  };
};

export type RecurrentScenario =
  | ElmanScenario
  | OriginalCellScenario
  | ForgetScenario
  | PeepholeScenario;

export type RecurrentFixture = {
  id: string;
  kind: "recurrent-memory-trace";
  label: "Synthetic example";
  description: string;
  representedClaimIds: string[];
  representedObjectiveIds: string[];
  scenarios: RecurrentScenario[];
};

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function closeEnough(left: number, right: number): boolean {
  return Math.abs(left - right) <= EPSILON;
}

function assertFiniteNumbers(values: number[], label: string): void {
  if (!values.every(Number.isFinite)) throw new Error(`${label} must contain only finite numbers.`);
}

function assertExpectedNumber(actual: number, expected: number, label: string): void {
  if (!closeEnough(actual, expected)) {
    throw new Error(`${label} expected ${expected} but calculated ${actual}.`);
  }
}

export function calculateElmanScenario(scenario: ElmanScenario): ElmanHistoryTrace[] {
  if (scenario.histories.length !== 2) throw new Error(`${scenario.id} requires exactly two histories.`);
  if (!Number.isInteger(scenario.activeStep) || scenario.activeStep < 0) {
    throw new Error(`${scenario.id} has an invalid active step.`);
  }
  assertFiniteNumbers(
    [scenario.initialState, scenario.inputWeight, scenario.recurrentWeight, scenario.bias],
    `${scenario.id} parameters`,
  );

  return scenario.histories.map((history) => {
    if (history.tokens.length !== history.inputs.length || history.tokens.length <= scenario.activeStep) {
      throw new Error(`${scenario.id} history ${history.id} does not cover the active step.`);
    }
    assertFiniteNumbers(history.inputs, `${scenario.id} history ${history.id}`);
    let state = scenario.initialState;
    const states = history.inputs.map((input) => {
      const copiedContext = state;
      state = sigmoid(
        scenario.inputWeight * input
        + scenario.recurrentWeight * copiedContext
        + scenario.bias,
      );
      return state;
    });
    return { id: history.id, states };
  });
}

export function calculateOriginalCellScenario(scenario: OriginalCellScenario): {
  steps: OriginalCellStepResult[];
  credit: CreditPoint[];
} {
  if (scenario.steps.length === 0) throw new Error(`${scenario.id} requires at least one step.`);
  if (scenario.ordinaryLocalFactors.length !== scenario.protectedLocalFactors.length) {
    throw new Error(`${scenario.id} credit paths must have equal lengths.`);
  }
  assertFiniteNumbers([scenario.initialState], `${scenario.id} initial state`);
  assertFiniteNumbers(scenario.ordinaryLocalFactors, `${scenario.id} ordinary credit path`);
  assertFiniteNumbers(scenario.protectedLocalFactors, `${scenario.id} protected credit path`);

  let state = scenario.initialState;
  const steps = scenario.steps.map((step): OriginalCellStepResult => {
    assertFiniteNumbers(
      [step.candidate, step.inputGate, step.outputGate],
      `${scenario.id} step ${step.token}`,
    );
    if (step.inputGate < 0 || step.inputGate > 1 || step.outputGate < 0 || step.outputGate > 1) {
      throw new Error(`${scenario.id} original-cell gates must stay within [0, 1].`);
    }
    const previousState = state;
    const writtenContribution = step.inputGate * step.candidate;
    state = previousState + writtenContribution;
    const exposedOutput = step.outputGate * Math.tanh(state);
    return { ...step, previousState, writtenContribution, state, exposedOutput };
  });

  let ordinaryPath = 1;
  let protectedPath = 1;
  const credit: CreditPoint[] = [{ distanceFromTarget: 0, ordinaryPath, protectedPath }];
  for (let index = 0; index < scenario.ordinaryLocalFactors.length; index += 1) {
    const ordinaryFactor = scenario.ordinaryLocalFactors[index];
    const protectedFactor = scenario.protectedLocalFactors[index];
    if (ordinaryFactor === undefined || protectedFactor === undefined) {
      throw new Error(`${scenario.id} has an incomplete credit path.`);
    }
    ordinaryPath *= ordinaryFactor;
    protectedPath *= protectedFactor;
    credit.push({ distanceFromTarget: index + 1, ordinaryPath, protectedPath });
  }
  return { steps, credit };
}

export function calculateForgetScenario(scenario: ForgetScenario): {
  inputGatedWrite: number;
  presets: ForgetPresetResult[];
} {
  assertFiniteNumbers(
    [scenario.previousState, scenario.candidate, scenario.inputGate],
    `${scenario.id} parameters`,
  );
  if (scenario.inputGate < 0 || scenario.inputGate > 1) {
    throw new Error(`${scenario.id} input gate must stay within [0, 1].`);
  }
  const inputGatedWrite = scenario.inputGate * scenario.candidate;
  const presets = scenario.presets.map((preset): ForgetPresetResult => {
    if (!Number.isFinite(preset.forgetGate) || preset.forgetGate < 0 || preset.forgetGate > 1) {
      throw new Error(`${scenario.id} preset ${preset.id} has an invalid forget gate.`);
    }
    const retainedContribution = preset.forgetGate * scenario.previousState;
    return {
      ...preset,
      retainedContribution,
      resultingState: retainedContribution + inputGatedWrite,
    };
  });
  return { inputGatedWrite, presets };
}

export function calculatePeepholeVariant(
  parameters: PeepholeParameters,
  usePeepholes: boolean,
): PeepholeVariantResult {
  assertFiniteNumbers(Object.values(parameters), "Peephole parameters");
  const inputStateTerm = usePeepholes
    ? parameters.inputPeepholeWeight * parameters.previousState
    : 0;
  const forgetStateTerm = usePeepholes
    ? parameters.forgetPeepholeWeight * parameters.previousState
    : 0;
  const inputGate = sigmoid(parameters.inputExternal + inputStateTerm);
  const forgetGate = sigmoid(parameters.forgetExternal + forgetStateTerm);
  const inputGatedWrite = inputGate * parameters.candidate;
  const retainedContribution = forgetGate * parameters.previousState;
  const state = retainedContribution + inputGatedWrite;
  const outputStateTerm = usePeepholes ? parameters.outputPeepholeWeight * state : 0;
  const outputGate = sigmoid(parameters.outputExternal + outputStateTerm);
  const exposedOutput = outputGate * Math.tanh(state);
  return {
    inputInspectedState: usePeepholes ? parameters.previousState : null,
    forgetInspectedState: usePeepholes ? parameters.previousState : null,
    outputInspectedState: usePeepholes ? state : null,
    inputGate,
    forgetGate,
    inputGatedWrite,
    retainedContribution,
    state,
    outputGate,
    exposedOutput,
  };
}

export function assertElmanExpected(scenario: ElmanScenario): void {
  const actual = calculateElmanScenario(scenario);
  for (const expectedHistory of scenario.expected.histories) {
    const actualHistory = actual.find((history) => history.id === expectedHistory.id);
    if (actualHistory === undefined) throw new Error(`${scenario.id} is missing history ${expectedHistory.id}.`);
    if (actualHistory.states.length !== expectedHistory.states.length) {
      throw new Error(`${scenario.id} history ${expectedHistory.id} has the wrong trace length.`);
    }
    expectedHistory.states.forEach((expected, index) => {
      const calculated = actualHistory.states[index];
      if (calculated === undefined) throw new Error(`${scenario.id} has an incomplete expected trace.`);
      assertExpectedNumber(calculated, expected, `${scenario.id} ${expectedHistory.id} state ${index}`);
    });
  }
}

export function assertOriginalCellExpected(scenario: OriginalCellScenario): void {
  const actual = calculateOriginalCellScenario(scenario);
  if (actual.steps.length !== scenario.expected.steps.length) {
    throw new Error(`${scenario.id} has the wrong expected step count.`);
  }
  actual.steps.forEach((step, index) => {
    const expected = scenario.expected.steps[index];
    if (expected === undefined) throw new Error(`${scenario.id} has an incomplete expected step trace.`);
    for (const key of ["previousState", "writtenContribution", "state", "exposedOutput"] as const) {
      assertExpectedNumber(step[key], expected[key], `${scenario.id} step ${index} ${key}`);
    }
  });
  if (actual.credit.length !== scenario.expected.credit.length) {
    throw new Error(`${scenario.id} has the wrong expected credit length.`);
  }
  actual.credit.forEach((point, index) => {
    const expected = scenario.expected.credit[index];
    if (expected === undefined || expected.distanceFromTarget !== point.distanceFromTarget) {
      throw new Error(`${scenario.id} has an invalid credit distance at ${index}.`);
    }
    assertExpectedNumber(point.ordinaryPath, expected.ordinaryPath, `${scenario.id} ordinary credit ${index}`);
    assertExpectedNumber(point.protectedPath, expected.protectedPath, `${scenario.id} protected credit ${index}`);
  });
}

export function assertForgetExpected(scenario: ForgetScenario): void {
  const actual = calculateForgetScenario(scenario);
  assertExpectedNumber(actual.inputGatedWrite, scenario.expected.inputGatedWrite, `${scenario.id} input-gated write`);
  for (const expectedPreset of scenario.expected.presets) {
    const actualPreset = actual.presets.find((preset) => preset.id === expectedPreset.id);
    if (actualPreset === undefined) throw new Error(`${scenario.id} is missing preset ${expectedPreset.id}.`);
    assertExpectedNumber(
      actualPreset.retainedContribution,
      expectedPreset.retainedContribution,
      `${scenario.id} ${expectedPreset.id} retained contribution`,
    );
    assertExpectedNumber(
      actualPreset.resultingState,
      expectedPreset.resultingState,
      `${scenario.id} ${expectedPreset.id} resulting state`,
    );
  }
}

function assertPeepholeVariantExpected(
  actual: PeepholeVariantResult,
  expected: PeepholeVariantResult,
  label: string,
): void {
  for (const key of ["inputInspectedState", "forgetInspectedState", "outputInspectedState"] as const) {
    if (actual[key] !== expected[key]) throw new Error(`${label} ${key} does not match.`);
  }
  for (const key of [
    "inputGate",
    "forgetGate",
    "inputGatedWrite",
    "retainedContribution",
    "state",
    "outputGate",
    "exposedOutput",
  ] as const) {
    assertExpectedNumber(actual[key], expected[key], `${label} ${key}`);
  }
}

export function assertPeepholeExpected(scenario: PeepholeScenario): void {
  assertPeepholeVariantExpected(
    calculatePeepholeVariant(scenario.parameters, false),
    scenario.expected.withoutPeepholes,
    `${scenario.id} without peepholes`,
  );
  assertPeepholeVariantExpected(
    calculatePeepholeVariant(scenario.parameters, true),
    scenario.expected.withPeepholes,
    `${scenario.id} with peepholes`,
  );
}

export function validateRecurrentFixture(fixture: RecurrentFixture): void {
  const ids = new Set<string>();
  const kinds = new Set<RecurrentScenario["kind"]>();
  for (const scenario of fixture.scenarios) {
    if (ids.has(scenario.id)) throw new Error(`Duplicate recurrent scenario id: ${scenario.id}`);
    ids.add(scenario.id);
    kinds.add(scenario.kind);
  }

  const requiredKinds: RecurrentScenario["kind"][] = [
    "elman-history-contrast",
    "original-cell-credit",
    "forget-retention",
    "peephole-inspection",
  ];
  for (const kind of requiredKinds) {
    if (!kinds.has(kind)) throw new Error(`Recurrent fixture is missing ${kind}.`);
  }

  const elman = fixture.scenarios.find((scenario): scenario is ElmanScenario => scenario.kind === "elman-history-contrast");
  if (elman === undefined) throw new Error("Recurrent fixture is missing the Elman history contrast.");
  const first = elman.histories[0];
  const second = elman.histories[1];
  if (first.tokens[elman.activeStep] !== second.tokens[elman.activeStep]) {
    throw new Error(`${elman.id} histories must share the active token.`);
  }
  const elmanTraces = calculateElmanScenario(elman);
  const firstState = elmanTraces[0]?.states[elman.activeStep];
  const secondState = elmanTraces[1]?.states[elman.activeStep];
  if (firstState === undefined || secondState === undefined || closeEnough(firstState, secondState)) {
    throw new Error(`${elman.id} histories must reach different states at the shared token.`);
  }

  const original = fixture.scenarios.find(
    (scenario): scenario is OriginalCellScenario => scenario.kind === "original-cell-credit",
  );
  if (original === undefined) throw new Error("Recurrent fixture is missing the original cell.");
  const forbiddenOriginalKeys = /forget|peephole|cellStateToGate/i;
  if (forbiddenOriginalKeys.test(JSON.stringify(original))) {
    throw new Error("Original-cell fixture leaks a later forget or peephole mechanism.");
  }
  if (!original.protectedLocalFactors.every((factor) => closeEnough(factor, 1))) {
    throw new Error(`${original.id} protected path must use only unit local factors.`);
  }

  const forget = fixture.scenarios.find(
    (scenario): scenario is ForgetScenario => scenario.kind === "forget-retention",
  );
  if (forget === undefined) throw new Error("Recurrent fixture is missing the forget-gate contrast.");
  const presetOrder: ForgetPreset["id"][] = ["near-retain", "gradual-decay", "near-reset"];
  if (forget.presets.map((preset) => preset.id).join("|") !== presetOrder.join("|")) {
    throw new Error(`${forget.id} must preserve the reviewed preset order.`);
  }
  const forgetResults = calculateForgetScenario(forget).presets;
  for (let index = 1; index < forgetResults.length; index += 1) {
    const previous = forgetResults[index - 1];
    const current = forgetResults[index];
    if (previous === undefined || current === undefined) throw new Error(`${forget.id} has an incomplete preset sequence.`);
    if (!(previous.forgetGate > current.forgetGate
      && previous.retainedContribution > current.retainedContribution)) {
      throw new Error(`${forget.id} presets must decrease monotonically in gate and retained magnitude.`);
    }
  }

  const peephole = fixture.scenarios.find(
    (scenario): scenario is PeepholeScenario => scenario.kind === "peephole-inspection",
  );
  if (peephole === undefined) throw new Error("Recurrent fixture is missing the peephole contrast.");
  const peepholeResult = calculatePeepholeVariant(peephole.parameters, true);
  if (!closeEnough(peepholeResult.inputInspectedState ?? Number.NaN, peephole.parameters.previousState)
    || !closeEnough(peepholeResult.forgetInspectedState ?? Number.NaN, peephole.parameters.previousState)
    || !closeEnough(peepholeResult.outputInspectedState ?? Number.NaN, peepholeResult.state)) {
    throw new Error(`${peephole.id} violates the 2002 previous/current-state inspection order.`);
  }

  for (const scenario of fixture.scenarios) {
    if (scenario.kind === "elman-history-contrast") assertElmanExpected(scenario);
    if (scenario.kind === "original-cell-credit") assertOriginalCellExpected(scenario);
    if (scenario.kind === "forget-retention") assertForgetExpected(scenario);
    if (scenario.kind === "peephole-inspection") assertPeepholeExpected(scenario);
  }
}
