import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import {createRequire} from './helpers/component-require.mjs';
const real=createRequire(import.meta.url);
function load(path){const {outputText}=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact'}});const exports={};new Function('require','exports',outputText)(id=>id==='./played'?load('../src/components/later/played.ts'):/\.css$|\/game\/|\/lib\/progress/.test(id)?{default:()=>null,markPlayed(){}}:real(id),exports);return exports;}
const api=load('../src/components/later/OpenModels.tsx');
test('weights take billions × bits ÷ 8 GB after a quarter of memory is reserved',()=>{
 assert.equal(api.weightGB(14.8,4),7.4);assert.equal(api.weightGB(70.6,16),141.2);
 assert.equal(api.usableGB(16),12);assert.equal(api.usableGB(4),2);assert.equal(api.usableGB(128),96);
});
test('the biggest model that fits is found at 4-bit and reported at the best precision that still fits',()=>{
 assert.deepEqual(api.openModels.map(m=>m.params),[...api.openModels.map(m=>m.params)].sort((a,b)=>a-b));
 assert.equal(api.biggestFit(16).name,'Qwen3 14B');assert.equal(api.biggestFit(8).name,'Qwen3 8B');
 const big=api.biggestFit(128);assert.equal(big.name,'Qwen2.5 72B');assert.equal(api.bestPrecision(big,128),8);
 assert.equal(api.biggestFit(2048).name,'DeepSeek-V3');
 assert.ok(!api.fits(api.openModels.find(m=>m.name==='Mixtral 8×7B'),4,24));
 assert.deepEqual([1,3,4,5,6,9].map(api.openStars),[3,3,2,2,1,1]);
});
