import {createRequire as nodeRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const cache=new Map();
function load(url) {
 if(cache.has(url.href))return cache.get(url.href);
 const exports={};cache.set(url.href,exports);
 const {outputText}=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}});
 const require=nodeRequire(url);
 new Function('require','exports',outputText)(id=>id.startsWith('.')?load(new URL(`${id}.ts`,url)):require(id),exports);
 return exports;
}
// Component tests compile TSX in memory; resolve the shared rendering hook from its source directory.
export function createRequire(url) {
 const require=nodeRequire(url);
 return id=>id.endsWith('/i18n/preact')?load(new URL('../../src/i18n/preact.ts',import.meta.url)):require(id);
}
