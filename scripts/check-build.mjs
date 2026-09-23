#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const distRoot = resolve("dist");

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
  const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (clean === "") return join(distRoot, "index.html");
  const direct = join(distRoot, clean);
  if (extname(direct) !== "") return direct;
  return join(direct, "index.html");
}

if (!existsSync(distRoot)) {
  throw new Error("dist/ does not exist; run Astro before the build audit.");
}

const files = walk(distRoot);
const htmlFiles = files.filter((path) => path.endsWith(".html"));
const failures = [];
const routes = [];

for (const htmlPath of htmlFiles) {
  const html = readFileSync(htmlPath, "utf8");
  const route = routeForFile(htmlPath);
  const mainCount = (html.match(/<main\b/g) ?? []).length;
  const headingCount = (html.match(/<h1\b/g) ?? []).length;
  if (mainCount !== 1) failures.push(`${route} has ${mainCount} main landmarks.`);
  if (headingCount !== 1) failures.push(`${route} has ${headingCount} h1 elements.`);

  const scriptSources = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map((match) => match[1]);
  let compressedClientBytes = 0;
  for (const scriptSource of scriptSources) {
    if (!scriptSource.startsWith("/")) continue;
    const assetPath = fileForPathname(new URL(scriptSource, "https://local.invalid").pathname);
    if (!existsSync(assetPath)) {
      failures.push(`${route} references missing script ${scriptSource}.`);
      continue;
    }
    compressedClientBytes += gzipSync(readFileSync(assetPath)).byteLength;
  }
  if (compressedClientBytes > 40 * 1024) {
    failures.push(`${route} ships ${compressedClientBytes} compressed client bytes; budget is 40960.`);
  }

  const anchors = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = match[1];
    if (!href.startsWith("/")) continue;
    const url = new URL(href, "https://local.invalid");
    const targetPath = fileForPathname(url.pathname);
    if (!existsSync(targetPath)) {
      failures.push(`${route} links to missing ${url.pathname}.`);
      continue;
    }
    if (url.hash !== "") {
      const targetHtml = targetPath === htmlPath ? html : readFileSync(targetPath, "utf8");
      const targetAnchors = targetPath === htmlPath
        ? anchors
        : new Set([...targetHtml.matchAll(/\sid="([^"]+)"/g)].map((anchorMatch) => anchorMatch[1]));
      const id = decodeURIComponent(url.hash.slice(1));
      if (!targetAnchors.has(id)) failures.push(`${route} links to missing anchor ${href}.`);
    }
  }

  routes.push({ route, compressedClientBytes, scriptCount: scriptSources.length });
}

const report = {
  generatedAt: new Date().toISOString(),
  routeCount: routes.length,
  unresolvedReferenceCount: failures.length,
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
