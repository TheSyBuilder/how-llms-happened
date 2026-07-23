#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { validateCorpus } from "./lib/validate-corpus.mjs";

const corpusUrl = new URL("../data/corpus.json", import.meta.url);
const schemaUrl = new URL("../schemas/corpus.schema.json", import.meta.url);

const [corpus, schema] = await Promise.all(
  [corpusUrl, schemaUrl].map(async (url) => {
    const contents = await readFile(fileURLToPath(url), "utf8");
    return JSON.parse(contents);
  }),
);

const errors = validateCorpus(corpus, schema);

if (errors.length > 0) {
  console.error(`Corpus validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Corpus valid: ${corpus.works.length} works, ${corpus.claims.length} claims, ${corpus.relationships.length} relationships.`,
  );
}
