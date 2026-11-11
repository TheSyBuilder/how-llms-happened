import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import {createRequire} from './helpers/component-require.mjs';
const real=createRequire(import.meta.url);
function load(path){const {outputText}=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact'}});const exports={};new Function('require','exports',outputText)(id=>id==='./played'?load('../src/components/later/played.ts'):/\.css$|\/game\/|\/lib\/progress/.test(id)?{default:()=>null,markPlayed(){}}:real(id),exports);return exports;}
const api=load('../src/components/later/ChainOfThought.tsx');
test('every worked solution has exactly one planted wrong step',()=>{
 assert.equal(api.puzzles.length,5);
 for(const p of api.puzzles){assert.ok(p.bad>=0&&p.bad<p.steps.length);assert.ok(p.why.length>0);}
});
test('points reward finding the step and speed; three stars need all five and pace',()=>{
 assert.equal(api.stepPoints(false,20),0);assert.equal(api.stepPoints(true,20),150);assert.equal(api.stepPoints(true,-3),50);
 assert.equal(api.MAX_POINTS,750);
 assert.deepEqual([api.chainStars(5,600),api.chainStars(5,400),api.chainStars(4,700),api.chainStars(2,100),api.chainStars(1,150)],[3,2,2,1,0]);
});
