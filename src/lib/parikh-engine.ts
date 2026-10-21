type Layer = { weights: number[][]; bias: number[] };
type Token = { id: string; token: string; vector: number[] };
type Network = Layer[];
type NetworkRow = { input: number[]; layers: Array<{ affine: number[]; activation: number[] }>; output: number[] };
type Read = {
  scores: number[]; maximum: number; exponentials: number[]; normalizer: number;
  weights: number[]; contributions: number[][]; context: number[];
};
export type ParikhResult = {
  projectionA: NetworkRow[]; projectionB: NetworkRow[]; scores: number[][];
  beta: Read[]; alpha: Read[]; comparisonA: NetworkRow[]; comparisonB: NetworkRow[];
  sumA: number[]; sumB: number[]; classifier: NetworkRow; classScores: number[];
};
export type IntraResult = { projections: NetworkRow[]; pairScores: number[][]; biasedScores: number[][]; reads: Read[]; representations: number[][] };
export type ParikhFixture = {
  $schema?: string;
  id: "synthetic-parikh-attention"; provenance: "authored-arithmetic";
  scope: string; variant: "corrected-proceedings";
  binding: { versionId: string; sourceId: string; claimIds: string[] };
  a: Token[]; b: Token[]; f: Network; g: Network; h: Network; output: Layer;
  expected: ParikhResult;
  intra: { tokens: Token[]; f: Network; distanceBias: Record<string, number>; expected: IntraResult };
};

function finite(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Arithmetic must remain finite.");
  return value;
}
function vector(values: number[], label: string): void {
  if (!Array.isArray(values) || values.length === 0) throw new Error(`${label} needs a nonempty vector.`);
  values.forEach(finite);
}
function affine(input: number[], layer: Layer): number[] {
  vector(input, "Network input");
  vector(layer.bias, "Network bias");
  if (layer.weights.length !== layer.bias.length) throw new Error("Weight rows and biases must match.");
  return layer.weights.map((row, i) => {
    vector(row, "Weight row");
    if (row.length !== input.length) throw new Error("Network input shape does not match weights.");
    return finite(row.reduce((sum, value, j) => finite(sum + finite(value * input[j]!)), layer.bias[i]!));
  });
}
function network(input: number[], layers: Network): NetworkRow {
  if (layers.length !== 2) throw new Error("The teaching network requires two shared ReLU layers.");
  let output = input;
  const ledger = layers.map((layer) => {
    const terms = affine(output, layer);
    output = terms.map((value) => Math.max(0, value));
    return { affine: terms, activation: output };
  });
  return { input, layers: ledger, output };
}
function bank(tokens: Token[], label: string): void {
  if (tokens.length === 0) throw new Error(`${label} needs a nonempty bank.`);
  if (new Set(tokens.map((token) => token.id)).size !== tokens.length) throw new Error(`${label} token IDs must be unique.`);
  tokens.forEach((token) => {
    if (!token.id || !token.token) throw new Error("Token identity and label are required.");
    vector(token.vector, label);
    if (token.vector.length !== tokens[0]!.vector.length) throw new Error(`${label} vector shapes must match.`);
  });
}
function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Projection shapes must match.");
  return finite(a.reduce((sum, value, i) => finite(sum + finite(value * b[i]!)), 0));
}
function sumRows(rows: number[][]): number[] {
  if (!rows.length || rows.some((row) => row.length !== rows[0]!.length)) throw new Error("Summed vector shapes must match and be nonempty.");
  return rows[0]!.map((_, i) => finite(rows.reduce((sum, row) => finite(sum + row[i]!), 0)));
}
function read(scores: number[], values: number[][]): Read {
  vector(scores, "Read scores");
  if (scores.length !== values.length) throw new Error("Read score and value counts must match.");
  const maximum = Math.max(...scores);
  const exponentials = scores.map((score) => Math.exp(finite(score - maximum)));
  const normalizer = finite(exponentials.reduce((sum, term) => sum + term, 0));
  const weights = exponentials.map((term) => term / normalizer);
  const contributions = values.map((value, i) => value.map((coordinate) => finite(weights[i]! * coordinate)));
  return { scores, maximum, exponentials, normalizer, weights, contributions, context: sumRows(contributions) };
}

/** The two normalizers share scores, not distributions: alpha normalizes columns. */
export function calculateParikh(fixture: ParikhFixture): ParikhResult {
  if (fixture.variant !== "corrected-proceedings") throw new Error("Only the corrected proceedings variant is admitted.");
  bank(fixture.a, "Sentence A"); bank(fixture.b, "Sentence B");
  if (fixture.a[0]!.vector.length !== fixture.b[0]!.vector.length) throw new Error("Sentence representation shapes must match.");
  const projectionA = fixture.a.map((token) => network(token.vector, fixture.f));
  const projectionB = fixture.b.map((token) => network(token.vector, fixture.f));
  const scores = projectionA.map((a) => projectionB.map((b) => dot(a.output, b.output)));
  const beta = scores.map((row) => read(row, fixture.b.map((token) => token.vector)));
  const alpha = fixture.b.map((_, j) => read(scores.map((row) => row[j]!), fixture.a.map((token) => token.vector)));
  const comparisonA = fixture.a.map((token, i) => network([...token.vector, ...beta[i]!.context], fixture.g));
  const comparisonB = fixture.b.map((token, j) => network([...token.vector, ...alpha[j]!.context], fixture.g));
  const sumA = sumRows(comparisonA.map((item) => item.output));
  const sumB = sumRows(comparisonB.map((item) => item.output));
  const classifier = network([...sumA, ...sumB], fixture.h);
  return { projectionA, projectionB, scores, beta, alpha, comparisonA, comparisonB, sumA, sumB, classifier, classScores: affine(classifier.output, fixture.output) };
}

/** Explicit short-distance entries avoid inventing the paper's unspecified signed bucket map. */
export function calculateParikhIntra(fixture: ParikhFixture): IntraResult {
  if (fixture.variant !== "corrected-proceedings") throw new Error("Only the corrected proceedings variant is admitted.");
  const { tokens, f, distanceBias } = fixture.intra;
  bank(tokens, "Intra-sentence");
  const distances = Array.from({ length: 2 * tokens.length - 1 }, (_, i) => String(i - tokens.length + 1));
  if (tokens.length > 10 || Object.keys(distanceBias).length !== distances.length
    || distances.some((key) => !Object.hasOwn(distanceBias, key))) throw new Error("Provide exactly the required short-distance biases.");
  Object.values(distanceBias).forEach(finite);
  const projections = tokens.map((token) => network(token.vector, f));
  const pairScores = projections.map((a) => projections.map((b) => dot(a.output, b.output)));
  const biasedScores = pairScores.map((row, i) => row.map((score, j) => finite(score + distanceBias[String(i - j)]!)));
  const reads = biasedScores.map((row) => read(row, tokens.map((token) => token.vector)));
  return { projections, pairScores, biasedScores, reads, representations: tokens.map((token, i) => [...token.vector, ...reads[i]!.context]) };
}

function assertExpected(actual: unknown, expected: unknown, path = "result"): void {
  if (typeof actual === "number" && typeof expected === "number") {
    if (!Number.isFinite(expected) || Math.abs(actual - expected) > 1e-12 * Math.max(1, Math.abs(expected))) throw new Error(`${path} differs from independent arithmetic.`);
  } else if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) throw new Error(`${path} expected shape differs.`);
    actual.forEach((value, i) => assertExpected(value, expected[i], `${path}[${i}]`));
  } else if (actual !== null && expected !== null && typeof actual === "object" && typeof expected === "object") {
    const a = actual as Record<string, unknown>; const e = expected as Record<string, unknown>;
    if (JSON.stringify(Object.keys(a).sort()) !== JSON.stringify(Object.keys(e).sort())) throw new Error(`${path} expected fields differ.`);
    Object.keys(a).forEach((key) => assertExpected(a[key], e[key], `${path}.${key}`));
  } else if (actual !== expected) throw new Error(`${path} differs.`);
}
export function validateParikhExpected(fixture: ParikhFixture): void {
  assertExpected(calculateParikh(fixture), fixture.expected);
  assertExpected(calculateParikhIntra(fixture), fixture.intra.expected, "intra");
}
