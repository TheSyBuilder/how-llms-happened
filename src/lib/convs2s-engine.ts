type Vector = number[];
type Matrix = Vector[];
type Affine = { weights: Matrix; bias: Vector };
type Binding = { versionId: string; sourceId: string; claimIds: string[] };
type SourceSlot = { id: string; word: Vector; position: Vector; key: Vector };
type TargetSlot = { id: string; token: string; word: Vector; position: Vector };
type Layer = { convolution: Affine; query: Affine; context: Affine };
type ReachRow = { row: number; predecessors: number[]; zeroPadding: number[]; inputSlots: number[] };
type Reach = { offsets: number[]; span: number; rows: ReachRow[] };
type AffineLedger = { terms: Matrix; bias: Vector; output: Vector };
type Read = {
  projection: AffineLedger; querySum: Vector; query: Vector; scoreTerms: Matrix; scores: Vector;
  maximum: number; exponentials: Vector; normalizer: number; weights: Vector;
  contributions: Matrix; context: Vector; contextScale: number; scaledContext: Vector;
};
type DecoderRow = {
  row: number; predictedIndex: number; predecessors: number[]; zeroPadding: number[];
  window: Vector; convolution: AffineLedger; a: Vector; b: Vector; gates: Vector; glu: Vector;
  read: Read; contextProjection: AffineLedger; attentionSum: Vector; attentionResidual: Vector;
  residualSum: Vector; output: Vector;
};
export type ConvS2SResult = {
  sourceEmbeddings: Matrix; targetEmbeddings: Matrix; paperValues: Matrix; luaValues: Matrix;
  crop: { paddedLength: number; convolutionLength: number; literalPaperLength: number; luaLength: number; removedLuaRows: number[] };
  encoderReach: Reach[]; decoderReach: Reach[];
  paperReads: Read[]; luaLayers: Array<{ rows: DecoderRow[] }>;
  gradient: { moduleCount: number; paperModuleCount: number; luaParameterScale: number; parameterInput: Vector; parameterOutput: Vector; embeddingInput: Vector; embeddingOutput: Vector; forwardScale: number };
};
export type ConvS2SFixture = {
  $schema?: string; id: "synthetic-convs2s-layers"; provenance: "authored-arithmetic"; scope: string;
  variant: "paper-equations-and-pinned-lua-comparison";
  binding: Binding; contrast: Binding;
  implementation: { repository: string; revision: string; modelPath: string; narrowRepository: string; narrowRevision: string; narrowPath: string };
  conventions: { kernelSize: 3; depth: 2; inputShift: string; boundary: string; stackOrder: string; paperRead: string; sourceBank: string; embeddingProjection: string };
  source: SourceSlot[]; target: TargetSlot[]; layers: Layer[];
  paperStates: Array<{ state: Vector; embeddingRow: number; projection: Affine }>;
  gradientInputs: { parameters: Vector; embeddings: Vector };
  expected: ConvS2SResult;
};
const ROOT_HALF = Math.SQRT1_2;
function finite(n: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) throw new Error("ConvS2S arithmetic must be finite.");
  return n;
}
function vector(v: Vector, width: number): void {
  if (!Array.isArray(v) || v.length !== width) throw new Error("ConvS2S vector shape mismatch.");
  v.forEach(finite);
}
function add(a: Vector, b: Vector): Vector {
  vector(b, a.length); return a.map((v, i) => finite(v + b[i]!));
}
function scale(v: Vector, s: number): Vector { return v.map((n) => finite(n * s)); }
function sum(rows: Matrix): Vector { return rows.reduce((a, b) => add(a, b), rows[0]!.map(() => 0)); }
function affine(input: Vector, layer: Affine, width: number): AffineLedger {
  vector(layer.bias, width);
  if (!Array.isArray(layer.weights) || layer.weights.length !== width) throw new Error("ConvS2S affine output shape mismatch.");
  const terms = layer.weights.map((row) => { vector(row, input.length); return row.map((v, j) => finite(v * input[j]!)); });
  const output = terms.map((row, i) => row.reduce((s, v) => finite(s + v), layer.bias[i]!));
  return { terms, bias: layer.bias, output };
}
function sigmoid(n: number): number {
  return n >= 0 ? 1 / (1 + Math.exp(-n)) : Math.exp(n) / (1 + Math.exp(n));
}
function read(state: Vector, embedding: Vector, projection: Affine, keys: Matrix, values: Matrix, lua: boolean): Read {
  const mapped = affine(state, projection, 2);
  const querySum = add(mapped.output, embedding);
  const query = scale(querySum, lua ? ROOT_HALF : 1);
  const scoreTerms = keys.map((key) => key.map((v, j) => finite(v * query[j]!)));
  const scores = scoreTerms.map((row) => row.reduce((s, v) => finite(s + v), 0));
  const maximum = Math.max(...scores);
  const exponentials = scores.map((v) => Math.exp(finite(v - maximum)));
  const normalizer = finite(exponentials.reduce((s, v) => finite(s + v), 0));
  if (normalizer <= 0) throw new Error("ConvS2S source softmax needs a positive denominator.");
  const weights = exponentials.map((v) => v / normalizer);
  const contributions = values.map((v, i) => scale(v, weights[i]!));
  const context = sum(contributions);
  const contextScale = finite(keys.length * Math.sqrt(1 / keys.length));
  return { projection: mapped, querySum, query, scoreTerms, scores, maximum, exponentials, normalizer, weights, contributions, context, contextScale, scaledContext: scale(context, contextScale) };
}
function reach(width: number, offsets: number[]): Reach[] {
  let previous = Array.from({ length: width }, (_, i) => [i]);
  return [1, 2].map((depth) => {
    const rows = previous.map((_, row) => {
      const taps = offsets.map((offset) => row + offset);
      const predecessors = taps.filter((i) => i >= 0 && i < width);
      const zeroPadding = taps.filter((i) => i < 0 || i >= width);
      const inputSlots = [...new Set(predecessors.flatMap((i) => previous[i]!))].sort((a, b) => a - b);
      return { row, predecessors, zeroPadding, inputSlots };
    });
    previous = rows.map((row) => row.inputSlots);
    return { offsets, span: 1 + 2 * depth, rows };
  });
}
function conventions(f: ConvS2SFixture): void {
  const c = f.conventions;
  if (f.variant !== "paper-equations-and-pinned-lua-comparison" || c.kernelSize !== 3 || c.depth !== 2
    || c.inputShift !== "row-r-reads-BOS-or-y-r-predicts-y-r-plus-1" || c.boundary !== "zero-outside-each-layer"
    || c.stackOrder !== "pinned-lua-glu-attention-residual" || c.paperRead !== "supplied-state-equations-1-2-plus-section-3-4"
    || c.sourceBank !== "all-valid-no-padding" || c.embeddingProjection !== "identity-target-map-supplied-projected-source-keys") throw new Error("Retain distinct paper/Lua conventions and causal input shift.");
  for (const bank of [f.source, f.target]) {
    if (!Array.isArray(bank) || bank.length < 1 || bank.length > 16 || new Set(bank.map((t) => t.id)).size !== bank.length
      || bank.some((t) => typeof t.id !== "string" || !t.id)) throw new Error("ConvS2S banks need bounded, unique identities.");
    bank.forEach((t) => { vector(t.word, 2); vector(t.position, 2); });
  }
  f.source.forEach((t) => vector(t.key, 2));
  if (f.target[0]!.token !== "BOS" || f.target.some((t, i) => !t.token || (i > 0 && t.token === "BOS"))) throw new Error("Declare exactly one initial BOS.");
  if (!Array.isArray(f.layers) || f.layers.length !== 2 || !Array.isArray(f.paperStates) || f.paperStates.length !== 2) throw new Error("Retain two decoder layers and two supplied-state paper reads.");
  for (const p of f.paperStates) {
    vector(p.state, 2);
    if (!Number.isInteger(p.embeddingRow) || p.embeddingRow < 0 || p.embeddingRow >= f.target.length) throw new Error("Paper read embedding row is outside the valid bank.");
  }
  vector(f.gradientInputs.parameters, 2); vector(f.gradientInputs.embeddings, 2);
}

/** The executed stack follows pinned Lua order; paper reads are independent supplied-state panels. */
export function calculateConvS2S(f: ConvS2SFixture): ConvS2SResult {
  conventions(f);
  const sourceEmbeddings = f.source.map((t) => add(t.word, t.position));
  const targetEmbeddings = f.target.map((t) => add(t.word, t.position));
  const keys = f.source.map((t) => t.key);
  const paperValues = keys.map((key, j) => add(key, sourceEmbeddings[j]!));
  const luaValues = paperValues.map((v) => scale(v, ROOT_HALF));
  const paperReads = f.paperStates.map((p) => read(p.state, targetEmbeddings[p.embeddingRow]!, p.projection, keys, paperValues, false));
  let previous = targetEmbeddings;
  const luaLayers = f.layers.map((layer) => {
    const rows = previous.map((residual, row) => {
      const taps = [row - 2, row - 1, row];
      const predecessors = taps.filter((i) => i >= 0);
      const zeroPadding = taps.filter((i) => i < 0);
      const window = taps.flatMap((i) => i < 0 ? [0, 0] : previous[i]!);
      const convolution = affine(window, layer.convolution, 4);
      const a = convolution.output.slice(0, 2); const b = convolution.output.slice(2);
      const gates = b.map(sigmoid); const glu = a.map((v, j) => finite(v * gates[j]!));
      const sourceRead = read(glu, targetEmbeddings[row]!, layer.query, keys, luaValues, true);
      const contextProjection = affine(sourceRead.scaledContext, layer.context, 2);
      const attentionSum = add(glu, contextProjection.output);
      const attentionResidual = scale(attentionSum, ROOT_HALF);
      const residualSum = add(residual, attentionResidual);
      const output = scale(residualSum, ROOT_HALF);
      return { row, predictedIndex: row + 1, predecessors, zeroPadding, window, convolution, a, b, gates, glu,
        read: sourceRead, contextProjection, attentionSum, attentionResidual, residualSum, output };
    });
    previous = rows.map((row) => row.output);
    return { rows };
  });
  const n = f.target.length;
  return {
    sourceEmbeddings, targetEmbeddings, paperValues, luaValues,
    crop: { paddedLength: n + 4, convolutionLength: n + 2, literalPaperLength: n - 1, luaLength: n, removedLuaRows: [n, n + 1] },
    encoderReach: reach(f.source.length, [-1, 0, 1]), decoderReach: reach(n, [-2, -1, 0]), paperReads, luaLayers,
    gradient: { moduleCount: 2, paperModuleCount: 2, luaParameterScale: 0.25, parameterInput: f.gradientInputs.parameters,
      parameterOutput: scale(f.gradientInputs.parameters, 0.25), embeddingInput: f.gradientInputs.embeddings,
      embeddingOutput: [...f.gradientInputs.embeddings], forwardScale: 1 },
  };
}
function close(actual: unknown, expected: unknown, path: string): void {
  if (typeof actual === "number") {
    if (typeof expected !== "number" || !Number.isFinite(expected) || Math.abs(actual - expected) > 2e-12 * Math.max(1, Math.abs(actual))) throw new Error(`Changed or nonfinite ConvS2S ledger at ${path}.`);
  } else if (Array.isArray(actual)) {
    if (!Array.isArray(expected) || actual.length !== expected.length) throw new Error(`ConvS2S ledger shape at ${path}.`);
    actual.forEach((v, i) => close(v, expected[i], `${path}[${i}]`));
  } else if (actual !== null && typeof actual === "object") {
    if (!expected || typeof expected !== "object" || Array.isArray(expected) || JSON.stringify(Object.keys(actual).sort()) !== JSON.stringify(Object.keys(expected).sort())) throw new Error(`ConvS2S ledger keys at ${path}.`);
    for (const [key, value] of Object.entries(actual)) close(value, (expected as Record<string, unknown>)[key], `${path}.${key}`);
  } else if (actual !== expected) throw new Error(`ConvS2S ledger value at ${path}.`);
}
export function validateConvS2SExpected(f: ConvS2SFixture): void { close(calculateConvS2S(f), f.expected, "expected"); }
