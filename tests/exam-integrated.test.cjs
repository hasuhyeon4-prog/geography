'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../assets/exam-engine').create(require('../assets/entity-kb'),require('../assets/exam-themes'));
function simple(s){const c=s.check||{};return s.kind==='graph'||s.kind==='place'&&c.place==='hemisphere'||c.op==='relativePosition'||s.kind==='data'&&(c.majority||c.up!=null);}
test('integrated questions never rely on stage-one options to disambiguate extra map candidates',()=>{
 for(const t of E.themes)for(let seed=1;seed<=20;seed++){
  const q=E.build({themeId:t.id,integrated:true,seed});assert.ok(q,t.id+' '+seed);
  if(q.stage1.markers)assert.deepEqual(q.stage1.markers.map(m=>m.name).sort(),q.entities.slice().sort(),t.id);
  assert.ok(q.stage2.statements.filter(simple).length<=1,t.id);
 }
});
test('the real page asks the integrated engine and postpones all identification feedback',()=>{
 const html=fs.readFileSync(require.resolve('../exam.html'),'utf8');
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.trim());
 for(const s of scripts)new vm.Script(s);
 assert.match(html,/var o=Object\.assign\(\{\},opts,\{integrated:true\}\);[^\n]{0,120}engine\.build\(o\)/);
 assert.match(html,/revealed=state\.a2!==null/);
 const answer1=html.slice(html.indexOf('function answer1('),html.indexOf('function answer2('));
 assert.doesNotMatch(answer1,/record\(|remember|session\.n1/);
 assert.match(html,/state\.a2!==null&&!q\.readingOnly&&!implicit/);
});
