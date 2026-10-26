'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const F=require('../assets/lecture-goal-facts.js'),G=require('../assets/goal-tables.js').create(require('../assets/goal-tables-data.js'));
const K=require('../assets/entity-kb.js'),T=require('../assets/exam-themes.js'),E=require('../assets/exam-engine.js').create(K,T);
test('all 296 OX goals have real true and false questions and browser merge is idempotent',()=>{
 const base=require('../assets/fact-statements.js'),all=[...base.items,...F.items],byid=new Map(all.map(q=>[q.id,q]));
 assert.equal(Object.keys(F.bindings).length,297);assert.ok(F.bindings['G040-1']);const goals=require('../data/lecture-gap-goals.json');assert.equal(Object.keys(F.bindings).filter(id=>goals.find(g=>g.id===id).venue==='OX').length,296);assert.equal(new Set(all.map(q=>q.id)).size,all.length);
 for(const [id,ids]of Object.entries(F.bindings)){const qs=ids.map(qid=>byid.get(qid));assert.ok(qs.every(Boolean),id);assert.ok(qs.some(q=>q.answer)&&qs.some(q=>!q.answer),id);for(const q of qs){assert.ok(q.explain&&q.source);assert.equal(q.practice,'recall');}}
 const context={WGFacts:JSON.parse(JSON.stringify(base))};vm.createContext(context);const src=fs.readFileSync(require.resolve('../assets/lecture-goal-facts.js'),'utf8');vm.runInContext(src,context);vm.runInContext(src,context);assert.equal(context.WGFacts.items.length,base.items.length+F.items.length);
});
test('rebuilt cave tables use landforms as rows and duplicate crust values never give a single boundary answer',()=>{
 const cave=G.tables.find(t=>t.id==='goal-cave-deposition');assert.deepEqual(cave.rows,['종유석','석순','석주','석회화 단구·트래버틴']);
 const reverse=G.inventory('which','all').filter(q=>q.t.id==='goal-crust-change');const removal=reverse.find(q=>q.custom.description==='소멸');assert.ok(removal);assert.equal(removal.custom.options[removal.custom.answer],'해양–대륙 수렴 · 해양–해양 수렴');
 for(const q of G.inventory('what','all')){assert.ok(q.custom.options.every(Boolean));assert.equal(new Set(q.custom.options).size,q.custom.options.length);}
 assert.ok(G.inventory('what','all').some(q=>q.t.id==='goal-caldera-karst'));
});
test('computed parallels respect country polygons and do not borrow city latitude',()=>{
 assert.equal(K.entities['나미비아'].lines.capricorn.crosses,true);assert.equal(K.entities['모리타니'].lines.capricorn.crosses,false);
 assert.equal(K.entities['캐나다'].lines.arcticCircle.crosses,true);assert.equal(K.entities['인도'].lines.arcticCircle.crosses,false);
 const th=T.themes.find(t=>t.id==='country-population');const ns=['나미비아','모리타니','캐나다'];const c=E.candidates(th,ns,[],E.seeded(9),true);assert.ok(c.some(s=>s.check?.line==='capricorn'&&s.check.entity==='나미비아'&&s.truth));assert.ok(c.some(s=>s.check?.line==='capricorn'&&s.check.entity==='모리타니'&&!s.truth));
});
test('existing exam actually emits relative productivity, inverse urban totals and representative-point comparisons',()=>{
 const seen={relativeProductivity:new Set(),inverseUrban:new Set(),relativePosition:new Set()},proof=[];
 for(const themeId of ['country-economy','country-urban-reverse','country-population'])for(let seed=1;seed<=240;seed++){
  const q=E.build({themeId,seed});assert.ok(q,themeId+' '+seed);
  for(const s of q.stage2.statements){const c=s.check||{};
   if(c.op==='relativeProductivity'){
    const ratio=K.entities[c.entity].values.industry/K.entities[c.entity].values.industryEmployment;const saidMore=/많다\.$/.test(s.text);assert.equal(s.truth,saidMore?ratio>c.benchmark:ratio<c.benchmark);assert.match(s.explain,/자국 전 산업 평균/);seen.relativeProductivity.add(s.truth);proof.push({themeId,seed,goal:s.goalId,check:c});
   }
   if(c.op==='inverseUrban'){
    const amount=n=>{const e=K.entities[n].values,u=e[c.part],total=u*100/e[c.rate];return c.kind==='rural'?total-u:total;};assert.equal(s.truth,amount(c.subject)>amount(c.object));assert.ok(q.shown.includes(c.part)&&q.shown.includes(c.rate));assert.ok(!q.shown.includes('wup-total@2020')&&!q.shown.includes('wup-rural@2020'));seen.inverseUrban.add(s.truth);proof.push({themeId,seed,goal:s.goalId,check:c});
   }
   if(c.op==='relativePosition'){const a=K.entities[c.entity].label[c.axis],b=K.entities[c.object].label[c.axis];assert.ok(Math.abs(a-b)>=5);assert.equal(s.truth,a>b);assert.match(s.explain,/대표점/);seen.relativePosition.add(s.truth);}
  }
 }
 for(const [kind,v]of Object.entries(seen))assert.equal(v.size,2,kind+' both polarities must be emitted, not merely stored');
});
