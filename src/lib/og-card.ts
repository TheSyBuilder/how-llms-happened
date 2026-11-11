// Build-time social cards (1200 × 630 PNG) rendered with satori (layout → SVG) and resvg (SVG → PNG).
// Server-only: reads font files from disk and loads a native module.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { eras, type Era } from "./chapter-meta";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const paper = "#f6f4ed";
const ink = "#252821";
const muted = "#5a5e53";
const siteUrl = "thesybuilder.github.io/how-llms-happened";
export const eraColour: Record<Era, string> = {
  counting: "#e8a33d",
  memory: "#4fa3a5",
  attention: "#8a7ff0",
  scale: "#e8714f",
  chat: "#4b95e0",
  agents: "#b9e64b",
};

type Style = Record<string, string | number>;
type OgNode = { type: string; props: { style?: Style; children?: OgChild | OgChild[] } };
type OgChild = OgNode | string;
const el = (type: string, style: Style, children?: OgChild | OgChild[]): OgNode => ({
  type,
  props: children === undefined ? { style } : { style, children },
});
const div = (style: Style, children?: OgChild | OgChild[]) => el("div", { display: "flex", ...style }, children);

// Satori renders variable fonts at their default instance only, so these are static instances
// (Space Grotesk 600/700, DM Sans 500/700 at opsz 14) cut from the google/fonts variable TTFs.
// Paths resolve from the project root: Astro builds run there, and bundling would break import.meta.url.
let fontCache: Parameters<typeof satori>[1]["fonts"] | undefined;
function fonts() {
  const read = (file: string) => readFileSync(resolve("src/assets/og-fonts", file));
  fontCache ??= [
    { name: "Space Grotesk", data: read("SpaceGrotesk-SemiBold.ttf"), weight: 600, style: "normal" },
    { name: "Space Grotesk", data: read("SpaceGrotesk-Bold.ttf"), weight: 700, style: "normal" },
    { name: "DM Sans", data: read("DMSans-Medium.ttf"), weight: 500, style: "normal" },
    { name: "DM Sans", data: read("DMSans-Bold.ttf"), weight: 700, style: "normal" },
  ];
  return fontCache;
}

async function toPng(root: OgNode): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await satori(root, { width: OG_WIDTH, height: OG_HEIGHT, fonts: fonts() });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH }, font: { loadSystemFonts: false } })
    .render()
    .asPng();
  return new Uint8Array(png);
}

const sans = (size: number, weight: 500 | 700, style: Style = {}): Style => ({
  fontFamily: "DM Sans",
  fontSize: size,
  fontWeight: weight,
  color: ink,
  ...style,
});
const display = (size: number, weight: 600 | 700, style: Style = {}): Style => ({
  fontFamily: "Space Grotesk",
  fontSize: size,
  fontWeight: weight,
  color: ink,
  ...style,
});
// Clamped text must be a block with a single text child for satori's lineClamp to apply.
const clamped = (style: Style, lines: number, text: string) =>
  el("div", { display: "block", lineClamp: lines, overflow: "hidden", wordBreak: "break-word", ...style }, text);

const playLink = () =>
  div({ alignItems: "center" }, [
    el("span", sans(24, 700), "Play it →"),
    el("span", sans(24, 500, { color: muted, marginLeft: 16 }), siteUrl),
  ]);

export type ChapterCard = { year: number; title: string; hook: string; era: Era };

export function renderChapterCard({ year, title, hook, era }: ChapterCard): Promise<Uint8Array<ArrayBuffer>> {
  const label = eras.find((entry) => entry.id === era)?.label ?? era;
  return toPng(
    div({ width: OG_WIDTH, height: OG_HEIGHT, backgroundColor: paper }, [
      div({ width: 40, height: OG_HEIGHT, flexShrink: 0, backgroundColor: eraColour[era] }),
      div(
        { flexDirection: "column", justifyContent: "space-between", width: OG_WIDTH - 40, minWidth: 0, overflow: "hidden", padding: "56px 80px 52px 80px" },
        [
          el("div", sans(24, 500, { color: muted, letterSpacing: 0.2 }), "LLM Lineage · How LLMs happened"),
          div({ flexDirection: "column" }, [
            el("div", display(148, 700, { lineHeight: 1, letterSpacing: -5, marginLeft: -6 }), String(year)),
            clamped(display(56, 700, { lineHeight: 1.08, letterSpacing: -1, marginTop: 10 }), 2, title),
            clamped(sans(30, 500, { lineHeight: 1.3, color: muted, marginTop: 16 }), 2, hook),
          ]),
          div({ justifyContent: "space-between", alignItems: "center" }, [
            el("div", sans(22, 700, { backgroundColor: eraColour[era], padding: "8px 20px", borderRadius: 999 }), label),
            playLink(),
          ]),
        ],
      ),
    ]),
  );
}

const rangeLabel = (from: number, to: number, index: number) =>
  index === 0 ? `≤ ${to}` : index === eras.length - 1 ? `${from} →` : `${from}–${to}`;

export function renderHomeCard(): Promise<Uint8Array<ArrayBuffer>> {
  return toPng(
    div(
      { width: OG_WIDTH, height: OG_HEIGHT, boxSizing: "border-box", backgroundColor: paper, flexDirection: "column", justifyContent: "space-between", padding: "56px 80px 52px 80px" },
      [
        el("div", sans(24, 500, { color: muted, letterSpacing: 0.2 }), "LLM Lineage"),
        div({ flexDirection: "column" }, [
          el("div", display(112, 700, { lineHeight: 1, letterSpacing: -4, marginLeft: -4 }), "How LLMs happened"),
          el("div", sans(36, 500, { color: muted, marginTop: 22 }), "From 1913 to today, one tiny game per idea."),
        ]),
        div(
          { width: "100%" },
          eras.map((entry, index) =>
            div(
              {
                flexGrow: 1,
                flexBasis: 0,
                height: 96,
                marginLeft: index === 0 ? 0 : 12,
                borderRadius: 14,
                backgroundColor: eraColour[entry.id],
                alignItems: "flex-end",
                padding: "0 14px 14px 16px",
              },
              el("div", display(22, 600, { letterSpacing: -0.3 }), rangeLabel(entry.from, entry.to, index)),
            ),
          ),
        ),
        playLink(),
      ],
    ),
  );
}
