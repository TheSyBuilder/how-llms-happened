import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from './helpers/component-require.mjs';
import test from 'node:test';
import ts from 'typescript';
const base=createRequire(import.meta.url);
// The game kit, progress store and stylesheets are not needed to test the models and scoring.
const require=id=>id.endsWith('.css')||id.includes('/game/')||id.endsWith('/progress')?{}:base(id);
function load(name) {
  const source=readFileSync(new URL(`../src/components/sequence/${name}.tsx`,import.meta.url),'utf8');
  const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'preact'}});
  const result={}; new Function('require','exports',outputText)(require,result);return result;
}
const graves=load('GravesToy'),encoder=load('EncoderToy'),attention=load('SourceAttentionToy');
const sum=values=>values.reduce((a,b)=>a+b,0);
const entropy=items=>-sum(items.map(([,p])=>p>0?p*Math.log(p):0));

test('training counts the user text and the next-character distribution is normalized and positive',()=>{
  const model=graves.trainCharModel(graves.sampleText);
  assert.equal(model.chars,graves.sampleText.length);
  assert.ok(model.vocab.has('coffee')&&model.vocab.has('keyboard'));
  const next=graves.nextDistribution(model,'the ca');
  assert.ok(Math.abs(sum(next.map(([,p])=>p))-1)<1e-9);
  assert.ok(next.every(([,p])=>p>0));
  assert.equal(next.sort((a,b)=>b[1]-a[1])[0][0],'t');
  const unseen=graves.nextDistribution(model,'qqqq');
  assert.ok(Math.abs(sum(unseen.map(([,p])=>p))-1)<1e-9);
  assert.equal(graves.trainCharModel('x'.repeat(graves.maxChars+50)).chars,graves.maxChars);
});
test('temperature spreads probability without changing which characters are possible',()=>{
  const model=graves.trainCharModel(graves.sampleText);
  const base=graves.nextDistribution(model,'the ');
  const low=graves.withTemperature(base,.3),high=graves.withTemperature(base,2);
  assert.ok(entropy(high)>entropy(low));
  assert.equal(low.length,high.length);
  for(const d of [low,high])assert.ok(Math.abs(sum(d.map(([,p])=>p))-1)<1e-9);
});
test('generated lines are repeatable for a seed, start with one of your words and feed choices back in',()=>{
  const model=graves.trainCharModel(graves.sampleText);
  const a=graves.generateLine(model,1,7),b=graves.generateLine(model,1,7);
  assert.equal(a,b);
  assert.ok(model.starts.includes(graves.wordsOf(a)[0]));
  assert.ok(a.length<=graves.maxLineChars);
  // Low temperature copies real words far more often than a hot sampler.
  const realShare=t=>{let ok=0;for(let s=1;s<=120;s++)if(graves.checkLine(model,graves.generateLine(model,t,s*7919)).allReal)ok++;return ok;};
  assert.ok(realShare(.4)>realShare(1.8)+40);
});
test('a line scores only when every word is real and long enough, and hotter lines earn more stars',()=>{
  const model=graves.trainCharModel(graves.sampleText);
  const real=graves.checkLine(model,'The cat sat on my desk again.');
  assert.equal(real.allReal,true);assert.equal(real.count,7);
  const fake=graves.checkLine(model,'The cat zorbled on my desk again.');
  assert.deepEqual(fake.invented,['zorbled']);
  assert.equal(graves.lineStars(7,1.5,false),0);
  assert.equal(graves.lineStars(5,1.5,true),0);
  assert.equal(graves.lineStars(6,.5,true),1);
  assert.equal(graves.lineStars(6,1,true),2);
  assert.equal(graves.lineStars(7,1.4,true),2);
  assert.equal(graves.lineStars(8,1.1,true),2);
  assert.equal(graves.lineStars(8,1.2,true),3);
  const best=graves.bestAttempt([{line:'a',temperature:.5,count:9,invented:[],stars:1},{line:'b',temperature:1.3,count:8,invented:[],stars:3},{line:'c',temperature:2,count:12,invented:['x'],stars:0}]);
  assert.equal(best.line,'b');
  assert.equal(graves.quote('x'.repeat(200)).length,90);
});
test('the decoder keeps packed facts, fills gaps from its habits and can guess wrong',()=>{
  const [fox,cat,dog]=encoder.sentences;
  assert.equal(encoder.survivors(fox,['colour','who','action']),3);
  assert.equal(encoder.survivors(fox,['who','time','colour']),4);
  const wrong=encoder.decodeNote(cat,['colour','place','time']);
  assert.deepEqual(wrong.find(item=>item.slot==='action'),{slot:'action',value:'sleeps',from:'guess'});
  assert.ok(wrong.some(item=>item.slot==='place'&&item.from==='note'));
  assert.equal(encoder.survivors(cat,['colour','action','time']),5);
  // A note can hold only three facts, so extra packing is ignored.
  assert.equal(encoder.survivors(dog,['size','colour','who','time']),encoder.survivors(dog,['size','colour','who']));
});
test('the longest sentence cannot survive whole and star thresholds use the best possible total',()=>{
  const best=encoder.sentences.map(encoder.bestSurvivors);
  assert.deepEqual(best,[4,5,5]);
  assert.equal(encoder.maxTotal,14);assert.equal(encoder.factTotal,15);
  assert.deepEqual([14,13,12,11,10].map(encoder.telephoneStars),[3,2,1,1,0]);
  assert.equal(encoder.sentenceText(encoder.sentences[0]),'The red fox runs at night.');
});
test('attention rows are distributions and model links follow the strongest reads',()=>{
  for(const pair of attention.pairs){
    assert.equal(pair.weights.length,pair.fr.length);
    for(const row of pair.weights){assert.equal(row.length,pair.en.length);assert.ok(Math.abs(sum(row)-1)<1e-9);}
  }
  assert.deepEqual(attention.modelLinks(attention.pairs[0]),['0-0','1-2','2-1']);
  // "not" splits across n’ and pas; "do" has no partner.
  const negation=attention.modelLinks(attention.pairs[2]);
  assert.ok(negation.includes('1-2')&&negation.includes('3-2'));
  assert.ok(!negation.some(key=>key.endsWith('-1')));
  assert.equal(attention.maxAlignment,16);
});
test('link scoring rewards matches, charges extras and never goes negative',()=>{
  const pair=attention.pairs[0];
  assert.deepEqual(attention.scoreLinks(pair,['0-0','1-2','2-1']),{hits:3,extras:0,missed:0,points:3,max:3});
  assert.equal(attention.scoreLinks(pair,['0-0','1-1','2-2']).points,0);
  assert.equal(attention.scoreLinks(pair,['1-1','2-2']).points,0);
  assert.deepEqual([16,15,14,12,11,8,7].map(attention.alignmentStars),[3,3,2,2,1,1,0]);
});
