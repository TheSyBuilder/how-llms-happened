import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Load the real chapter definitions so newly live chapters join this contract automatically.
function load(url){
 if(url.pathname.endsWith('.json'))return JSON.parse(readFileSync(url,'utf8'));
 const {outputText}=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}});
 const api={};new Function('require','exports',outputText)(id=>load(new URL(id.endsWith('.json')?id:`${id}.ts`,url)),api);return api;
}
const api=load(new URL('../src/lib/first-steps.ts',import.meta.url));
const {chapters,chapterSourceCredit}=load(new URL('../src/lib/chapters.ts',import.meta.url));
const live=chapters.filter(chapter=>chapter.status==='live').map(chapter=>chapter.slug);
const labels=['How to play','Listen','Why it works','et al.'];
const catalogs=Object.fromEntries(['zh','ar'].map(locale=>{
 const directory=new URL(`../src/i18n/${locale}/`,import.meta.url);
 return [locale,Object.fromEntries(readdirSync(directory).filter(name=>name.endsWith('.json')).map(name=>[name,JSON.parse(readFileSync(new URL(name,directory),'utf8'))]))];
}));

for(const slug of live)test(`${slug} has a short brief and exact Chinese and Arabic translations`,()=>{
 const step=api.firstSteps[slug];
 assert.ok(step?.brief?.trim(),`${slug}: missing brief`);
 assert.ok(step?.howTo?.trim(),`${slug}: missing howTo`);
 assert.ok(!/["«»]/u.test(step.howTo),`${slug}: English howTo must use curly double quotes`);
 assert.ok(step.brief.trim().split(/\s+/u).length<=60,`${slug}: brief exceeds 60 English words`);
 for(const locale of ['zh','ar'])for(const source of [step.brief,step.howTo]){
  const translated=catalogs[locale][`${slug}.json`].text[source];
  assert.ok(translated?.trim(),`${locale}/${slug}: missing exact translation for ${source}`);
  assert.notEqual(translated,source,`${locale}/${slug}: untranslated copy`);
 }
});

test('new brief labels have paired keys and one definition in each common catalog',()=>{
 for(const label of labels)for(const locale of ['zh','ar']){
  assert.ok(catalogs[locale]['common.json'].text[label]?.trim(),`${locale}: missing ${label}`);
  const definitions=Object.entries(catalogs[locale]).filter(([,catalog])=>Object.hasOwn(catalog.text??{},label)||Object.hasOwn(catalog.rich??{},label));
  assert.deepEqual(definitions.map(([name])=>name),['common.json'],`${locale}: duplicate ${label}`);
 }
});

test('Arabic howTos use balanced guillemets for quoted controls',()=>{
 for(const slug of live){
  const translated=catalogs.ar[`${slug}.json`].text[api.firstSteps[slug].howTo];
  assert.ok(translated?.trim(),`${slug}: missing Arabic howTo`);
  assert.ok(!/[“”"]/u.test(translated),`${slug}: Arabic howTo must use guillemets`);
  if(api.firstSteps[slug].howTo.includes('“'))assert.ok(translated.includes('«'),`${slug}: missing Arabic guillemets`);
  assert.match(translated,/^(?:[^«»]|«[^«»]*»)*$/u,`${slug}: unbalanced Arabic guillemets`);
 }
});

test('source credits use compact surnames and keep the cited publication year',()=>{
 const expected={
  'next-letter':{year:1913,author:'Markov',multiple:false},
  'zero-counts':{year:1953,author:'I. J. Good',multiple:false},
  elman:{year:1990,author:'Elman',multiple:false},
  graves:{year:2013,author:'Graves',multiple:false},
  speech:{year:1975,author:'Jelinek, Bahl & Mercer',multiple:false},
  lstm:{year:1997,author:'Hochreiter & Schmidhuber',multiple:false},
  'sequence-to-sequence':{year:2014,author:'Sutskever, Vinyals & Le',multiple:false},
  attention:{year:2015,author:'Bahdanau, Cho & Bengio',multiple:false},
  'mixture-of-experts':{year:2021,author:'Fedus, Zoph & Shazeer',multiple:false},
  transformer:{year:2017,author:'Vaswani',multiple:true},
  tokens:{year:2016,author:'Sennrich, Haddow & Birch',multiple:false},
  chatgpt:{year:2022,author:'OpenAI',multiple:false},
  reasoning:{year:2025,author:'DeepSeek-AI',multiple:false},
 };
 for(const [slug,credit] of Object.entries(expected))assert.deepEqual(chapterSourceCredit(chapters.find(chapter=>chapter.slug===slug)),credit,slug);
});
