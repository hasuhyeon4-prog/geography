'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {createRequire}=require('node:module'),ROOT=path.resolve(__dirname,'..');
const goals=require('../data/lecture-gap-goals.json'),review=require('../data/lecture-goal-review-20261026.json'),verification=require('../data/goal-verification.json'),gaps=require('../data/lecture-goal-review-gaps.json').gaps;
const fingerprint=g=>crypto.createHash('sha256').update(JSON.stringify({id:g.id,goal:g.goal,done:g.done,venue:g.venue,scope:g.scope})).digest('hex');

test('the individual review covers the exact 573 criteria without silently reviewing future changes',()=>{
 assert.equal(review.items.length,goals.length);assert.equal(new Set(review.items.map(g=>g.id)).size,goals.length);
 for(const g of goals){const r=review.items.find(r=>r.id===g.id);assert.ok(r,g.id);assert.equal(r.criteriaSHA256,fingerprint(g),g.id+' changed criteria require review');assert.equal(r.criteria,g.done);assert.ok(r.evidence.length);}
});

test('partial completion remains open and verified goals retain explicit individual evidence',()=>{
 const p=require('../audit/lecture-goals/progress.json');
 for(const g of goals){const r=review.items.find(r=>r.id===g.id),v=verification.reviews[g.id];
  assert.equal(r.verdict==='partial',Object.hasOwn(gaps,g.id),g.id);
  if(r.verdict==='partial'){
   assert.equal(g.status,'구현',g.id);assert.ok(!verification.verifiedGoals.includes(g.id));
   assert.equal(p.items.find(x=>x.id===g.id).remaining,gaps[g.id]);
  }else{
   assert.equal(g.status,'검증',g.id);assert.equal(v.criteriaSHA256,fingerprint(g));assert.equal(v.criteria,g.done);
   for(const file of v.evidence)assert.ok(fs.existsSync(path.join(ROOT,file)),g.id+' '+file);
  }
 }
 for(const id of ['G016-3','G018-3','G018-5','G022-1']){const h=require('../data/goal-completion-review-20261026.json').items.find(x=>x.id===id);assert.ok(h&&h.initialRemaining);assert.equal(review.items.find(x=>x.id===id).previousVerdict,'partial');assert.equal(goals.find(g=>g.id===id).status,'검증',id+' must only close after the originally missing criterion is supplemented');}
});

test('removing verification evidence reopens a previously verified goal when rebuilding status',()=>{
 const file=path.join(ROOT,'scripts/audit-lecture-goals.cjs'),localRequire=createRequire(file),writes=new Map(),id='G001-3';
 const changed={...verification,verifiedGoals:verification.verifiedGoals.filter(x=>x!==id)};
 const mockFs={...fs,readFileSync:(name,...args)=>String(name)===path.join(ROOT,'data/goal-verification.json')?JSON.stringify(changed):fs.readFileSync(name,...args),writeFileSync:(name,value)=>writes.set(String(name),value),mkdirSync:()=>{}};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),{__dirname:path.dirname(file),require:name=>name==='fs'?mockFs:localRequire(name),process:{argv:[process.execPath,file,'--write-status']},console:{log(){}}},{filename:file});
 const rebuilt=JSON.parse(writes.get(path.join(ROOT,'data/lecture-gap-goals.json')));
 assert.equal(rebuilt.find(g=>g.id===id).status,'구현');
 const progress=JSON.parse(writes.get(path.join(ROOT,'audit/lecture-goals/progress.json')));
 assert.equal(progress.statusCounts.검증,verification.verifiedGoals.length-1);
 assert.equal(progress.groups.find(g=>g.id==='G001').status,'진행 중');
});
