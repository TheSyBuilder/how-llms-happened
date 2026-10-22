type ReachRow = { position: number; predecessors: number[]; zeroPadding: number[]; inputSlots: number[] };
type ReachLayer = { dilation: number; offsets: number[]; infiniteOffsets: number[]; span: number; rows: ReachRow[] };
export type ByteNetReach = {
  encoder: ReachLayer[]; decoder: ReachLayer[];
  sourceReads: Array<{
    row: number; inputIndex: number; predictedIndex: number; alignedEncoderColumn: number | null;
    reachableEncoderColumns: number[]; sourceTokenSlots: number[]; sourcePaddingSlots: number[];
  }>;
};
type UnfoldingCase = {
  id: string; sourceLength: number; factor: number; intercept: number;
  representationWidth: number | null; generated: string[];
};
export type UnfoldingResult = {
  estimate: number; status: "eos" | "incomplete" | "unresolved-width";
  steps: Array<{
    row: number; inputIndex: number; predictedIndex: number; inputToken: string;
    outputToken: string; alignedEncoderColumn: number | null; stop: boolean;
  }>;
};
export type ByteNetFixture = {
  $schema: string; id: "synthetic-bytenet-reach"; provenance: "authored-arithmetic";
  scope: string; variant: "arxiv-v2-topology";
  binding: { versionId: string; sourceId: string; claimIds: string[] };
  contrast: { versionId: string; sourceId: string; claimIds: string[] };
  conventions: {
    kernelSize: 3; encoderOffsets: [-1, 0, 1]; decoderOffsets: [-2, -1, 0];
    boundary: "zero-outside-each-layer"; sourcePadding: "explicit-input-slot";
    inputShift: "row-r-reads-t-r-predicts-t-r-plus-1"; sourceInjection: "aligned-at-decoder-base";
    block: "relu-translation-topology";
  };
  dilations: number[]; sourceLength: number; encoderWidth: number; decoderWidth: number;
  expected: ByteNetReach;
  unfolding: Array<UnfoldingCase & { expected: UnfoldingResult }>;
};
const sorted = (values: number[]): number[] => [...new Set(values)].sort((a, b) => a - b);
function integer(value: number, label: string, max = 64): void {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new Error(`${label} must be a bounded positive integer.`);
}
function conventions(fixture: ByteNetFixture): void {
  if (fixture.variant !== "arxiv-v2-topology") throw new Error("Only the v2 topology is admitted.");
  const c = fixture.conventions;
  if (c.kernelSize !== 3 || JSON.stringify(c.encoderOffsets) !== "[-1,0,1]"
    || JSON.stringify(c.decoderOffsets) !== "[-2,-1,0]"
    || c.boundary !== "zero-outside-each-layer" || c.sourcePadding !== "explicit-input-slot"
    || c.inputShift !== "row-r-reads-t-r-predicts-t-r-plus-1"
    || c.sourceInjection !== "aligned-at-decoder-base" || c.block !== "relu-translation-topology") {
    throw new Error("Retain the explicit causal, boundary, shift and block conventions.");
  }
  integer(fixture.sourceLength, "Source length"); integer(fixture.encoderWidth, "Encoder width");
  integer(fixture.decoderWidth, "Decoder width");
  if (fixture.sourceLength > fixture.encoderWidth) throw new Error("Source slots must fit the encoder width.");
  if (!Array.isArray(fixture.dilations) || fixture.dilations.length !== 6
    || fixture.dilations.some((d, i) => d !== 2 ** (i % 5))) throw new Error("Retain six layers across the 1,2,4,8,16,1 dilation reset.");
}

function reach(width: number, dilations: number[], taps: number[]): ReachLayer[] {
  let previous = Array.from({ length: width }, (_, i) => [i]);
  let infinite = [0];
  return dilations.map((dilation) => {
    const offsets = taps.map((tap) => tap * dilation);
    infinite = sorted(infinite.flatMap((position) => offsets.map((offset) => position + offset)));
    const rows = previous.map((_, position) => {
      const candidates = offsets.map((offset) => position + offset);
      const predecessors = candidates.filter((index) => index >= 0 && index < width);
      const zeroPadding = candidates.filter((index) => index < 0 || index >= width);
      return { position, predecessors, zeroPadding, inputSlots: sorted(predecessors.flatMap((index) => previous[index]!)) };
    });
    previous = rows.map((row) => row.inputSlots);
    return { dilation, offsets, infiniteOffsets: infinite, span: infinite.at(-1)! - infinite[0]! + 1, rows };
  });
}

/** Structural access only: no learned activations, gradient weights or quality estimate. */
export function calculateByteNetReach(fixture: ByteNetFixture): ByteNetReach {
  conventions(fixture);
  const encoder = reach(fixture.encoderWidth, fixture.dilations, fixture.conventions.encoderOffsets);
  const decoder = reach(fixture.decoderWidth, fixture.dilations, fixture.conventions.decoderOffsets);
  const sourceReads = decoder.at(-1)!.rows.map(({ position, inputSlots }) => {
    const reachableEncoderColumns = inputSlots.filter((slot) => slot < fixture.encoderWidth);
    const sourceSlots = sorted(reachableEncoderColumns.flatMap((slot) => encoder.at(-1)!.rows[slot]!.inputSlots));
    return {
      row: position, inputIndex: position, predictedIndex: position + 1,
      alignedEncoderColumn: position < fixture.encoderWidth ? position : null,
      reachableEncoderColumns,
      sourceTokenSlots: sourceSlots.filter((slot) => slot < fixture.sourceLength),
      sourcePaddingSlots: sourceSlots.filter((slot) => slot >= fixture.sourceLength),
    };
  });
  return { encoder, decoder, sourceReads };
}

/** Fractional estimates stay unresolved; an estimate is never an EOS or a decoding cap. */
export function calculateByteNetUnfolding(fixture: ByteNetFixture, example: UnfoldingCase): UnfoldingResult {
  conventions(fixture);
  integer(example.sourceLength, "Example source length");
  if (example.factor !== 1.2 || example.intercept !== 0) throw new Error("Use the v2 English–German width parameters.");
  const estimate = example.factor * example.sourceLength + example.intercept;
  if (!Number.isFinite(estimate)) throw new Error("Width estimate must be finite.");
  if (!Number.isInteger(estimate)) {
    if (example.representationWidth !== null || example.generated.length !== 0) throw new Error("Fractional width needs an explicit unresolved case, without rounded slots or generated steps.");
    return { estimate, status: "unresolved-width", steps: [] };
  }
  integer(example.representationWidth as number, "Representation width", 128);
  if (example.representationWidth !== estimate) throw new Error("Supplied width must match the exact integer estimate.");
  if (!Array.isArray(example.generated) || example.generated.length > 64
    || example.generated.some((token) => typeof token !== "string" || !token || token === "BOS")) throw new Error("Provide bounded nonempty output labels distinct from BOS.");
  const eos = example.generated.indexOf("EOS");
  if (eos >= 0 && eos !== example.generated.length - 1) throw new Error("No output may follow the first EOS.");
  const steps = example.generated.map((outputToken, row) => ({
    row, inputIndex: row, predictedIndex: row + 1, inputToken: row === 0 ? "BOS" : example.generated[row - 1]!,
    outputToken, alignedEncoderColumn: row < estimate ? row : null, stop: outputToken === "EOS",
  }));
  return { estimate, status: eos < 0 ? "incomplete" : "eos", steps };
}

function exact(actual: unknown, expected: unknown, path: string): void {
  if (typeof actual === "number") {
    if (!Number.isFinite(actual) || actual !== expected) throw new Error(`Changed or nonfinite ByteNet ledger at ${path}.`);
  } else if (Array.isArray(actual)) {
    if (!Array.isArray(expected) || actual.length !== expected.length) throw new Error(`ByteNet ledger shape at ${path}.`);
    actual.forEach((item, index) => exact(item, expected[index], `${path}[${index}]`));
  } else if (actual !== null && typeof actual === "object") {
    if (expected === null || typeof expected !== "object" || Array.isArray(expected)
      || JSON.stringify(Object.keys(actual).sort()) !== JSON.stringify(Object.keys(expected).sort())) throw new Error(`ByteNet ledger keys at ${path}.`);
    for (const [key, value] of Object.entries(actual)) exact(value, (expected as Record<string, unknown>)[key], `${path}.${key}`);
  } else if (actual !== expected) throw new Error(`ByteNet ledger value at ${path}.`);
}
export function validateByteNetExpected(fixture: ByteNetFixture): void {
  exact(calculateByteNetReach(fixture), fixture.expected, "reach");
  if (fixture.unfolding.length !== 5 || new Set(fixture.unfolding.map((example) => example.id)).size !== 5) throw new Error("Retain five distinct unfolding cases.");
  for (const example of fixture.unfolding) exact(calculateByteNetUnfolding(fixture, example), example.expected, example.id);
  const statuses = fixture.unfolding.map((example) => example.expected.status);
  const eosLengths = fixture.unfolding.filter((example) => example.expected.status === "eos").map((example) => Math.sign(example.generated.length - example.expected.estimate));
  if (!statuses.includes("unresolved-width") || !statuses.includes("incomplete")
    || ![-1, 0, 1].every((sign) => eosLengths.includes(sign))) throw new Error("Retain early, equal, beyond, incomplete and unresolved-width comparisons.");
}
