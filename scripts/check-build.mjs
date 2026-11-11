#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const distRoot = resolve("dist");
const base = (process.env.SITE_BASE || "").replace(/\/$/, "");

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function routeForFile(path) {
  const relativePath = relative(distRoot, path).replaceAll("\\", "/");
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) return `/${relativePath.slice(0, -"index.html".length)}`;
  return `/${relativePath}`;
}

function fileForPathname(pathname) {
  if (base && pathname.startsWith(`${base}/`)) pathname = pathname.slice(base.length);
  const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (clean === "") return join(distRoot, "index.html");
  const direct = join(distRoot, clean);
  if (extname(direct) !== "") return direct;
  return join(direct, "index.html");
}

function collectJavaScript(path, visited = new Set()) {
  const normalized = resolve(path);
  if (visited.has(normalized)) return visited;
  if (!existsSync(normalized)) return visited;
  visited.add(normalized);
  const source = readFileSync(normalized, "utf8");
  for (const match of source.matchAll(/["'](\.\/[^"']+\.js)["']/g)) {
    collectJavaScript(resolve(dirname(normalized), match[1]), visited);
  }
  return visited;
}

if (!existsSync(distRoot)) {
  throw new Error("dist/ does not exist; run Astro before the build audit.");
}

const files = walk(distRoot);
const htmlFiles = files.filter((path) => path.endsWith(".html"));
const failures = [];
const routes = [];
const corpus = JSON.parse(readFileSync(resolve("data/corpus.json"), "utf8"));
const documentCache = new Map();
function documentAnchors(path) {
  if (!documentCache.has(path)) {
    const html = readFileSync(path, "utf8");
    documentCache.set(path, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])));
  }
  return documentCache.get(path);
}

for (const htmlPath of htmlFiles) {
  const html = readFileSync(htmlPath, "utf8");
  const route = routeForFile(htmlPath);
  const redirect = html.match(/http-equiv="refresh"[^>]*content="[^"]*url=([^"]+)"/i);
  if (redirect) {
    const target = fileForPathname(new URL(redirect[1], "https://local.invalid").pathname);
    if (!existsSync(target)) failures.push(`${route} redirects to a missing page.`);
    continue;
  }
  const mainCount = (html.match(/<main\b/g) ?? []).length;
  const headingCount = (html.match(/<h1\b/g) ?? []).length;
  if (mainCount !== 1) failures.push(`${route} has ${mainCount} main landmarks.`);
  if (headingCount !== 1) failures.push(`${route} has ${headingCount} h1 elements.`);

  const scriptSources = [
    ...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g),
    ...html.matchAll(/(?:component-url|renderer-url|before-hydration-url)="([^"]+\.js[^"]*)"/g),
  ].map((match) => match[1]);
  const assetPaths = new Set();
  for (const scriptSource of scriptSources) {
    if (!scriptSource.startsWith("/")) continue;
    const assetPath = fileForPathname(new URL(scriptSource, "https://local.invalid").pathname);
    if (!existsSync(assetPath)) {
      failures.push(`${route} references missing script ${scriptSource}.`);
      continue;
    }
    for (const dependency of collectJavaScript(assetPath)) assetPaths.add(dependency);
  }
  const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .filter((match) => !/\ssrc=/.test(match[0]))
    .map((match) => match[1]);
  const compressedClientBytes = [...assetPaths]
    .reduce((total, assetPath) => total + gzipSync(readFileSync(assetPath)).byteLength, 0)
    + inlineScripts.reduce((total, source) => total + gzipSync(source).byteLength, 0);
  if (compressedClientBytes > 40 * 1024) {
    failures.push(`${route} ships ${compressedClientBytes} compressed client bytes; budget is 40960.`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const anchors = new Set(ids);
  if (anchors.size !== ids.length) failures.push(`${route} contains duplicate element IDs.`);
  const compressedHtmlBytes = gzipSync(html).byteLength;
  if (/^\/journeys\/encoder-decoder-alignment\//.test(route)) {
    if (compressedClientBytes !== 0) failures.push(`${route} must retain the complete static alignment treatment without client JavaScript.`);
    if (compressedHtmlBytes > 512 * 1024) failures.push(`${route} exceeds the 512 KiB compressed HTML budget.`);
  }
  if (/^\/atlas\//.test(route)) {
    if (compressedClientBytes !== 0) failures.push(`${route} must ship zero atlas client JavaScript.`);
    if (compressedHtmlBytes > 512 * 1024) failures.push(`${route} exceeds the 512 KiB compressed HTML budget.`);
    if (route === "/atlas/beginner/" || route === "/atlas/expert/") {
      if ((html.match(/\sdata-work-id="/g) ?? []).length !== corpus.works.length) failures.push(`${route} omits or duplicates corpus works.`);
      for (const claim of corpus.claims) if (!anchors.has(`claim-${claim.id}`)) failures.push(`${route} omits claim ${claim.id}.`);
    }
    if (route === "/atlas/evidence/") {
      for (const relation of corpus.relationships) if (!anchors.has(`relation-${relation.id}`)) failures.push(`${route} omits relationship ${relation.id}.`);
      for (const source of corpus.sources) if (!anchors.has(`source-${source.id}`)) failures.push(`${route} omits source ${source.id}.`);
    }
  }
  for (const match of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = match[1];
    if (!href.startsWith("/") && !href.startsWith("#")) continue;
    const url = new URL(href, `https://local.invalid${route}`);
    const targetPath = fileForPathname(url.pathname);
    if (!existsSync(targetPath)) {
      failures.push(`${route} links to missing ${url.pathname}.`);
      continue;
    }
    if (url.hash !== "") {
      const targetAnchors = targetPath === htmlPath ? anchors : documentAnchors(targetPath);
      const id = decodeURIComponent(url.hash.slice(1));
      if (!targetAnchors.has(id)) failures.push(`${route} links to missing anchor ${href}.`);
    }
  }

  routes.push({
    route,
    compressedHtmlBytes,
    compressedClientBytes,
    scriptCount: scriptSources.length + inlineScripts.length,
    clientAssetCount: assetPaths.size,
  });
}

const katzFixturePath = resolve("data/fixtures/katz-probability-mass.json");
const katzFixtureBytes = existsSync(katzFixturePath) ? readFileSync(katzFixturePath).byteLength : 0;
if (katzFixtureBytes > 10 * 1024) {
  failures.push(`Katz fixture is ${katzFixtureBytes} bytes; budget is 10240.`);
}
const kneserFixturePath = resolve("data/fixtures/kneser-ney-context-coverage.json");
const kneserFixtureBytes = existsSync(kneserFixturePath) ? readFileSync(kneserFixturePath).byteLength : 0;
if (kneserFixtureBytes > 5 * 1024) {
  failures.push(`Kneser–Ney fixture is ${kneserFixtureBytes} bytes; budget is 5120.`);
}
const chenFixturePath = resolve("data/fixtures/chen-goodman-interpolation-discounts.json");
const chenFixtureBytes = existsSync(chenFixturePath) ? readFileSync(chenFixturePath).byteLength : 0;
if (chenFixtureBytes > 6 * 1024) {
  failures.push(`Chen–Goodman fixture is ${chenFixtureBytes} bytes; budget is 6144.`);
}

// Social cards: home plus every live chapter page (one without the "is-coming" marker) needs a
// 1200 × 630 PNG under 300 KB at /og/<slug>.png.
const chapterPages = htmlFiles
  .map((path) => routeForFile(path).match(/^\/chapters\/([^/]+)\/$/)?.[1])
  .filter((slug) => slug !== undefined);
const liveChapterSlugs = chapterPages.filter(
  (slug) => !/<article class="chapter-page[^"]*\bis-coming\b/.test(readFileSync(join(distRoot, "chapters", slug, "index.html"), "utf8")),
);
const ogImages = [];
for (const slug of ["home", ...liveChapterSlugs]) {
  const pngPath = join(distRoot, "og", `${slug}.png`);
  if (!existsSync(pngPath)) {
    failures.push(`/og/${slug}.png is missing.`);
    continue;
  }
  const png = readFileSync(pngPath);
  const isPng = png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const width = isPng ? png.readUInt32BE(16) : 0;
  const height = isPng ? png.readUInt32BE(20) : 0;
  if (width !== 1200 || height !== 630) failures.push(`/og/${slug}.png is ${width}×${height}; expected 1200×630.`);
  if (png.byteLength > 300 * 1024) failures.push(`/og/${slug}.png is ${png.byteLength} bytes; budget is 307200.`);
  ogImages.push({ slug, bytes: png.byteLength });
}

const report = {
  generatedAt: new Date().toISOString(),
  ogImageCount: ogImages.length,
  maxOgImageBytes: Math.max(0, ...ogImages.map((image) => image.bytes)),
  routeCount: routes.length,
  unresolvedReferenceCount: failures.length,
  katzFixtureBytes,
  kneserFixtureBytes,
  chenFixtureBytes,
  routes: routes.sort((left, right) => left.route.localeCompare(right.route)),
};

writeFileSync(join(distRoot, "build-report.json"), `${JSON.stringify(report, null, 2)}\n`);

if (failures.length > 0) {
  console.error(`Build audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  const maxPayload = Math.max(0, ...routes.map((route) => route.compressedClientBytes));
  console.log(`Build audit passed: ${routes.length} routes, 0 unresolved links or anchors, maximum client payload ${maxPayload} compressed bytes.`);
}
