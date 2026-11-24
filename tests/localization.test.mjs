import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const {outputText}=ts.transpileModule(readFileSync(new URL('../src/i18n/core.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}});
const api={};new Function('exports',outputText)(api);
test('locale links preserve chapters and anchors without rewriting external sources',()=>{
 assert.equal(api.localePath('/ar/chapters/bert/#play','zh'),'/zh/chapters/bert/#play');
 assert.equal(api.localePath('/zh/chapters/bert/','en'),'/chapters/bert/');
 for(const path of ['https://arxiv.org/a','#play','/_astro/a.js','//example.org'])assert.equal(api.localePath(path,'ar'),path);
 assert.equal(api.localeFromPath('/archive/'),'en');
});
test('translated results retain variable values and surrounding spacing',()=>{
 const t=api.translator({'Keep {0} of {1} messages':'保留 {1} 条中的 {0} 条','Read?':'نقرأ؟'});
 assert.equal(t('Keep 2 of 4 messages'),'保留 4 条中的 2 条');
 assert.equal(t(' Read? '),' نقرأ؟ ');
 assert.equal(t('untranslated data'),'untranslated data');
});
test('project hosting preserves locale, hashes and external destinations',()=>{
 const hosted={};new Function('__SITE_BASE__','exports',outputText)('/how-llms-happened',hosted);
 assert.equal(hosted.localeFromPath('/how-llms-happened/ar/chapters/bert/'),'ar');
 assert.equal(hosted.localePath('/how-llms-happened/ar/chapters/bert/#play','zh'),'/how-llms-happened/zh/chapters/bert/#play');
 assert.equal(hosted.localePath('/chapters/bert/','en'),'/how-llms-happened/chapters/bert/');
 assert.equal(hosted.withSiteBase('/how-llms-happened/'),'/how-llms-happened/');
 for(const path of ['https://arxiv.org/a','#play','//example.org'])assert.equal(hosted.withSiteBase(path),path);
});
test('templates match most specific first, whatever their catalog order',()=>{
 const t=api.translator({'Par {0}':'标准杆 {0}','Par {0} · best {1}':'标准杆 {0} · 最佳 {1}'});
 assert.equal(t('Par 3 · best 2'),'标准杆 3 · 最佳 2');
 assert.equal(t('Par 4'),'标准杆 4');
});
test('catalog and slot lookups ignore Object.prototype',()=>{
 const t=api.translator({'Word {0}':'词 {0}'});
 assert.equal(t('constructor'),'constructor');
 assert.equal(t('Word constructor'),'词 constructor');
});
test('the client catalog keeps island and runtime strings and drops static-only ones',()=>{
 const used=[];const t=api.translator({'Story paragraph.':'故事。','Play again':'再玩一次','Score {0}':'得分 {0}','Hidden until play':'玩后才出现','Counting':'计数'},key=>used.push(key));
 t('Story paragraph.');t('Score Counting');
 assert.deepEqual(used,['Story paragraph.','Score {0}','Counting']);
 const story='A story paragraph long enough to count as static copy, not a label.';
 const applied=new Set([story,'Play again','Counting']),island=new Set(['Play again']);
 assert.deepEqual(Object.keys(api.clientMessages({[story]:'故事。','Play again':'再玩一次','Hidden until play':'玩后才出现','Counting':'计数'},applied,island)),['Play again','Hidden until play','Counting']);
 assert.deepEqual(Object.keys(api.clientMessages({[story]:'故事。'},applied,island)),[]);
 assert.deepEqual(Object.keys(api.clientMessages({[story]:'故事。'},applied,island,new Set([story]))),[story]);
});
