import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import {createRequire} from './helpers/component-require.mjs';
const real=createRequire(import.meta.url);
function load(path){const {outputText}=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact'}});const exports={};new Function('require','exports',outputText)(id=>id==='./played'?load('../src/components/later/played.ts'):/\.css$|\/game\/|\/lib\/progress/.test(id)?{default:()=>null,markPlayed(){}}:real(id),exports);return exports;}
const api=load('../src/components/later/Reasoning.tsx');
test('each puzzle has exactly one path to its target',()=>{
 for(const p of api.puzzles){const s=api.solutions(p);assert.equal(s.length,1,`${p.start}→${p.target}`);assert.equal(s[0].length,p.moves);}
 assert.deepEqual(api.solutions(api.puzzles[0])[0],['+3','×2']);
});
test('depth-first search backtracks to the unique path and checks part of the tree',()=>{
 for(const p of api.puzzles){
  const nodes=api.depthFirst(p),path=nodes.filter(n=>n.onPath);
  assert.equal(path.length,p.moves+1);assert.equal(path.at(-1).value,p.target);assert.ok(nodes.length<=api.treeSize(p));
 }
 assert.equal(api.treeSize(api.puzzles[2]),121);assert.ok(api.depthFirst(api.puzzles[2]).length>20);
 assert.equal(api.puzzlePoints(true,45),95);assert.equal(api.puzzlePoints(false,30),0);
 assert.deepEqual([api.reasoningStars(3,210),api.reasoningStars(3,180),api.reasoningStars(1,60),api.reasoningStars(0,0)],[3,2,1,0]);
});
