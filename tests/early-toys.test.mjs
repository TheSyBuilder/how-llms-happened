import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from './helpers/component-require.mjs';
import test from 'node:test';
import ts from 'typescript';
function toy(name) {
 const source=readFileSync(new URL(`../src/components/early/${name}.tsx`,import.meta.url),'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact'}});
 const result={};new Function('require','exports',outputText)(createRequire(import.meta.url),result);return result;
}
const {letterOdds}=toy('LetterToy');
const {reserveOdds}=toy('ZeroToy');
const {decodeCream}=toy('SpeechToy');
const {nearestWords}=toy('VectorToy');
const {readHistory}=toy('ElmanToy');
const {gatedCell}=toy('GateToy');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('same letter totals hide different transition distributions',()=>{
 assert.deepEqual(letterOdds('ABABABAB','A',false).probabilities,[.5,.5]);
 assert.deepEqual(letterOdds('AAAABBBB','A',false).probabilities,[.5,.5]);
 assert.deepEqual(letterOdds('ABABABAB','A',true).probabilities,[0,1]);
 assert.deepEqual(letterOdds('AAAABBBB','A',true).probabilities,[.75,.25]);
});
test('letter counts never wrap the end or invent unseen outgoing transitions',()=>{
 assert.deepEqual(letterOdds('AABB','B',true).counts,[0,1]);
 assert.equal(letterOdds('A','A',true).total,0);
 assert.equal(letterOdds('123!','A',false).total,0);
 assert.deepEqual(letterOdds('a b!','A',true).counts,[0,1]);
});
test('reserve mass is conserved and changing fallback does not alter observed probabilities',()=>{
 for(const r of [0,.1,.25,.5]) for(const broad of [false,true]) near(reserveOdds(r,broad).reduce((a,b)=>a+b),1);
 const equal=reserveOdds(.2,false),contexts=reserveOdds(.2,true);
 assert.deepEqual(equal.slice(0,3),contexts.slice(0,3));
 near(contexts[4]/contexts[3],4);near(contexts[3]+contexts[4],.2);
 assert.equal(reserveOdds(0,false)[3],0);
});
test('speech priors can settle ambiguity while strong sound can overturn them',()=>{
 assert.ok(decodeCream(40,80,true).posterior[0]>.5);
 assert.ok(decodeCream(40,20,true).posterior[0]<.5);
 assert.ok(decodeCream(95,20,true).posterior[0]>.5);
 near(decodeCream(40,80,false).posterior[0],.4);
 near(decodeCream(50,50,true).posterior[0],.5);
});
test('all slider-end speech distributions remain finite and normalised',()=>{
 for(const s of [5,95])for(const p of [5,95])for(const lm of [true,false]){
 const r=decodeCream(s,p,lm);near(r.posterior.reduce((a,b)=>a+b),1);assert.ok(r.posterior.every(n=>n>0&&n<1));
 }
});
test('word-vector neighbours depend on direction and survive rescaling',()=>{
 assert.equal(nearestWords(.9,.2)[0].word,'shore');
 assert.equal(nearestWords(.2,.9)[0].word,'coin');
 const a=nearestWords(.3,.6),b=nearestWords(.15,.3);
 a.forEach((n,i)=>{assert.equal(n.word,b[i].word);near(n.similarity,b[i].similarity);});
});
test('the same word inherits opposing histories only with the recurrent copy',()=>{
 const a=readHistory(1,2,true),b=readHistory(-1,2,true);
 assert.ok(a.state>0&&b.state<0);near(a.water+b.water,1);
 assert.equal(readHistory(1,2,false).state,0);assert.equal(readHistory(-1,2,false).state,0);
 assert.ok(Math.abs(readHistory(1,6,true).state)<Math.abs(a.state));
 assert.equal(readHistory(1,0,true).water,.5);
});
test('LSTM protection, replacement and hiding affect different paths',()=>{
 const protectedCell=gatedCell(1,-1,1,0,1);near(protectedCell.cell,1);
 const hidden=gatedCell(1,-1,1,0,0);near(hidden.cell,1);near(hidden.visible,0);
 near(gatedCell(1,-1,0,1,1).cell,-1);
 near(gatedCell(1,-1,.8,.5,1).cell,.3);
 let state=1;for(let i=0;i<12;i++)state=gatedCell(state,-1,1,0,1).cell;near(state,1);
});
