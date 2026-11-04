import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';
function load(name) {
  const source=readFileSync(new URL(`../src/components/sequence/${name}.tsx`,import.meta.url),'utf8');
  const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact'}});
  const result={}; new Function('require','exports',outputText)(createRequire(import.meta.url),result);return result;
}
const generation=load('GravesToy'),encoder=load('EncoderToy'),attention=load('SourceAttentionToy');
const sum=values=>values.reduce((a,b)=>a+b,0);

test('higher sampling temperature spreads probability while retaining a normalized positive distribution',()=>{
  const low=generation.characterDistribution('the ca',.25).probabilities;
  const high=generation.characterDistribution('the ca',2).probabilities;
  const entropy=items=>-sum(items.map(x=>x.p*Math.log(x.p)));
  assert.ok(entropy(high)>entropy(low));
  assert.ok(low.find(x=>x.char==='t').p>high.find(x=>x.char==='t').p);
  for(const distribution of [low,high]) {assert.ok(Math.abs(sum(distribution.map(x=>x.p))-1)<1e-12);assert.ok(distribution.every(x=>x.p>0));}
});
test('sampled characters feed into later predictions and restart makes the sequence repeatable',()=>{
  const initial=generation.freshGeneration();
  const next=generation.sampleCharacter(initial,1);
  assert.equal(next.text,initial.text+next.last);assert.equal(next.generated,1);
  assert.notDeepEqual(generation.characterDistribution(next.text,1),generation.characterDistribution(initial.text,1));
  const run=t=>{let state=generation.freshGeneration();for(let i=0;i<30;i++)state=generation.sampleCharacter(state,t);return state;};
  assert.deepEqual(run(1),run(1));assert.notEqual(run(.25).text,run(2).text);
  assert.deepEqual(initial,generation.freshGeneration());
});
test('sampler stops at its visible limit and unseen contexts still give finite probabilities',()=>{
  let state=generation.freshGeneration();
  for(let i=0;i<generation.generationLimit;i++)state=generation.sampleCharacter(state,2);
  assert.equal(generation.sampleCharacter(state,2),state);
  assert.equal(state.generated,80);
  const unknown=generation.characterDistribution('xyz',1);
  assert.equal(unknown.context,'');assert.ok(unknown.probabilities.every(x=>Number.isFinite(x.p)));
});
test('encoder reads only the supplied prefix and decoder changes word order and length',()=>{
  const source=encoder.messages.fox;
  assert.deepEqual(encoder.encodeMessage(source,0),[0,0,0]);
  assert.deepEqual(encoder.encodeMessage(source,1),[1,0,0]);
  assert.deepEqual(encoder.encodeMessage(source,2),[1,1,0]);
  const packed=encoder.encodeMessage(source,3);
  assert.deepEqual(encoder.decodeSummary(packed),['le','renard','rouge','court','END']);
  assert.deepEqual(packed,[1,1,1]);
});
test('lost colour cannot be recovered by the decoder, while remaining features survive',()=>{
  const full=encoder.encodeMessage(encoder.messages.cat,3);
  const erased=encoder.encodeMessage(encoder.messages.cat,3,true);
  assert.deepEqual(encoder.decodeSummary(full),['le','chat','bleu','dort','END']);
  assert.deepEqual(encoder.decodeSummary(erased),['le','chat','?','dort','END']);
  assert.deepEqual(encoder.encodeMessage(encoder.messages.fox,3,true),[0,1,1]);
});
test('decoder requests move a normalized source read in target order including a backward move',()=>{
  const reads=[0,1,2].map(i=>attention.sourceRead(i,3));
  assert.deepEqual(reads.map(x=>x.strongest),[0,2,1]);
  for(const r of reads) {assert.ok(Math.abs(sum(r.alpha)-1)<1e-12);assert.deepEqual(r.context,r.alpha);}
});
test('flat scores remove preference and hiding a source renormalizes without inventing its value',()=>{
  const flat=attention.sourceRead(2,0);
  assert.equal(flat.strongest,null);assert.deepEqual(flat.alpha,[1/3,1/3,1/3]);
  const hidden=attention.sourceRead(2,4,true);
  assert.deepEqual(hidden.context,[.5,0,.5]);assert.equal(hidden.strongest,null);
  const animal=attention.sourceRead(1,4,true);
  assert.equal(animal.alpha[1],0);assert.equal(animal.strongest,2);assert.ok(Math.abs(sum(animal.alpha)-1)<1e-12);
});
