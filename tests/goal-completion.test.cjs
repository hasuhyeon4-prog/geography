'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),F=require('../assets/lecture-goal-facts.js'),goals=require('../data/lecture-gap-goals.json'),D=require('../assets/materials-data.js'),R=require('../assets/materials-remaining-data.js'),M=require('../assets/materials-engine.js').create(D),K=require('../assets/entity-kb.js'),T=require('../assets/exam-themes.js'),E=require('../assets/exam-engine.js').create(K,T),truth=require('./helpers/completion-truth.cjs');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const baseline=require('../data/goal-completion-baseline.json');
test('completion preserves every existing OX identity, claim, answer and correction',()=>{
 const old=F.items.filter(q=>baseline.ids.includes(q.id)).map(({id,claim,answer,explain})=>({id,claim,answer,explain}));assert.equal(old.length,645);assert.equal(crypto.createHash('sha256').update(JSON.stringify(old)).digest('hex'),baseline.sha256);assert.equal(require('../assets/fact-statements.js').items.length,217);
 const added=fs.readFileSync(ROOT+'/data/goal-completion-ox.tsv','utf8').split(/\r?\n/).filter(s=>s&&!s.startsWith('#')).map(s=>s.split('|'));
 const initial=require('../data/goal-completion-review-20261026.json');for(const x of initial.items.filter(x=>goals.find(g=>g.id===x.id).venue==='OX'))assert.ok(added.some(a=>a[0]===x.id),x.id);
 for(const [id,yes,no]of added){assert.notEqual(yes,no);const qs=F.bindings[id].map(qid=>F.items.find(q=>q.id===qid)).filter(Boolean);assert.ok(qs.some(q=>q.claim===yes&&q.answer),id);assert.ok(qs.some(q=>q.claim===no&&!q.answer),id);}
});
test('named table omissions and side OX are individually present',()=>{
 const tables=require('../data/lecture-goal-table-overrides.json').tables;
 for(const [id,terms]of Object.entries({'G014-4':['22℃','40mm','1/10'],'G042-1':['서남아시아 전체'],'G052-4':['야크 버터'],'G064-1':['초기 단계','가속화 단계','종착 단계'],'G072-4':['원예 농업'],'G082-5':['−162℃'],'G085-1':['2차 에너지','최종 에너지 소비'],'G088-3':['투수성','유발 지진'],'G097-2':['총산출','중간 투입'],'G129-4':['국경 양쪽']})){
  const text=JSON.stringify(tables.filter(t=>t.goalIds.includes(id)));for(const term of terms)assert.ok(text.includes(term),id+' '+term);
 }
 for(const id of ['G027-3','G051-4','G058-2','G076-3','G082-3','G088-4','G090-5','G096-3','G105-3','G128-1'])assert.ok(F.bindings[id],id);
});
test('four complete JMA stations reproduce their normal columns without replacing old stations',()=>{
 cp.execFileSync('python3',[ROOT+'/scripts/build-completion-climate.py','--check']);cp.execFileSync('python3',[ROOT+'/scripts/build-completion-source.py','--check']);
 for(const n of ['바마코','뭄바이','울란바토르','아비장']){const s=D.climate.sites[n];assert.deepEqual(s.period,[1991,2020]);assert.equal(s.t.length,12);assert.equal(s.p.length,12);assert.ok(s.t.concat(s.p).every(Number.isFinite));}
 const q=M.build('cumulative',2);assert.ok(q.assignment.includes('뭄바이'));assert.ok(q.assignment.includes('다윈'));assert.ok(D.climate.sites['뭄바이'].p[6]>700);assert.ok(D.climate.sites['다윈'].p[6]<1);
 let july=false;for(let seed=1;seed<=32;seed++){const x=M.build('solar-month',seed);if(x.stage1.options[x.stage1.answer]==='7월'&&x.tables[0].rows.some(r=>r[0]==='홍콩'))july=true;}assert.ok(july);
});
test('original exam routes actually emit every required completion in both polarities',()=>{
 const routes={'continent-indicators':['G057-3'],'country-population':['G057-3'],'livestock-identification':['G079-3'],'primary-energy':['G083-2','G085-3','G085-4'],'electricity-mix':['G085-3','G085-6','G089-5','G138-3'],'country-minerals':['G092-2'],'country-economy':['G097-4','G127-2'],'bloc-indicators':['G107-2'],'export-items':['G123-5'],'climate-graphs':['G015-4']};
 for(const [theme,ids]of Object.entries(routes)){
  const seen=Object.fromEntries(ids.map(id=>[id,new Set()]));
  for(let seed=1;seed<=600;seed++){const q=E.build({themeId:theme,seed});assert.ok(q,theme+' '+seed);for(const s of q.stage2.statements){if(s.completionWording)assert.equal(truth(s,q,K),s.truth,s.text);const gs=(s.goalIds||[]).concat(s.goalId||[]);for(const id of ids)if(gs.includes(id)){
   if(id==='G015-4'&&s.check.entity!=='바마코')continue;
   if(id==='G097-4'&&(!['미국','중국'].every(n=>[s.check.subject,s.check.object].includes(n))||s.check.rate!=='goal-industry2021'))continue;
   if(id==='G085-6'&&!['중국','브라질'].every(n=>[s.check.subject,s.check.object].includes(n)))continue;
   if(id==='G123-5')assert.deepEqual(q.entities.slice().sort(),['중국','일본','인도네시아','오스트레일리아'].sort());
   seen[id].add(s.truth);
  }}}
  for(const id of ids)assert.equal(seen[id].size,2,theme+' '+id+' true and false are reachable');
 }
});
test('the original Chad and 2018 capital cases use the specified quantities and denominators',()=>{
 const q=M.build('dependency-change',1),c=q.pairs.find(p=>p.check.op==='dependencyCounterexample').check;assert.deepEqual(c.before,[39.5,4.1]);assert.deepEqual(c.after,[47.6,2.5]);assert.ok((c.after[0]+c.after[1])/(100-c.after[0]-c.after[1])>(c.before[0]+c.before[1])/(100-c.before[0]-c.before[1]));
 const cap=M.build('capital-share',1);assert.equal(cap.stage1.options[cap.stage1.answer],'우루과이');assert.match(cap.source,/2018/);for(const p of cap.pairs.filter(p=>p.check.op==='capitalShare'))close(p.check.result,p.check.capital/(p.check.urban+p.check.rural)*100);
 const restore=M.build('climate-restore',1);assert.ok(restore.figures[0].regions.some(r=>r.letter==='A'));for(let i=0;i<3;i++)close(restore.tables[0].rows[i][1]+restore.tables[0].rows[i][2],Math.max(...D.climate.sites[restore.stationNames[i]].t));
});
test('all 242 energy window pairs and the explicitly sourced 2025 endpoint conversions are independently checked',()=>{
 const d=D.energy,e=d.coal2025Endpoints.countries;close(e['미국'].coalEJ,8.670671*1.05505585262);close(e['중국'].coalEJ,61.7*1e8*.514*29.3076/1e9);
 for(const [n,up]of [['미국',false],['중국',true]]){let count=0;for(let a=1985;a<=1995;a++)for(let b=2015;b<=2025;b++){assert.equal(d.countries[n][b].coal_consumption>d.countries[n][a].coal_consumption,up);count++;}assert.equal(count,121);assert.ok(d.coalDirectionWindow[n].fullPlusMinusFiveVerified);assert.equal(d.countries[n]['2025'].oil_consumption,null);}
 const roundedLower=61.65*1e8*.5135*29.3076/1e9;for(let a=1985;a<=1995;a++)assert.ok(roundedLower>D.energy.countries['중국'][a].coal_consumption*.0036);
});
test('photos cover two examples per religion and both omitted city scenes',()=>{
 const ids=new Set(),categories={};for(let seed=1;seed<=8;seed++){const q=M.build('religious-buildings',seed);const a=q.stage1.options[q.stage1.answer];categories[a]=(categories[a]||0)+1;assert.match(q.stage1.explain,/단서/);}for(const n of ['힌두교','크리스트교','불교','이슬람교'])assert.ok(categories[n]>=2,n);
 const city=new Set(Array.from({length:5},(_,i)=>M.build('city-images',i+1).stage1.options[M.build('city-images',i+1).stage1.answer]));assert.ok(city.has('타워브리지')&&city.has('시드니 오페라하우스'));
 for(const p of R.panels.filter(p=>p.license)){assert.ok(p.author&&p.sourceUrl&&p.licenseUrl);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(ROOT+'/'+p.path)).digest('hex'),p.sha256);}
});
test('map region hit targets map to shuffled answers and Schengen classification has the stated cross membership',()=>{
 const targets=new Set();for(let seed=1;seed<=24;seed++){const q=M.build('oldmap-regions',seed);targets.add(q.pairs[0].check.target);const f=q.figures[0];for(const m of f.regions)assert.equal(q.stage1.options[m.option],m.letter);assert.ok(require('../assets/materials-charts.js').render(f).includes('data-material-option'));}
 for(const n of ['지중해','나일강','인도양'])assert.ok(targets.has(n));
 const C=require('../assets/classification-sets.js'),s=C.byId.schengen;assert.equal(Object.values(s.values).filter(x=>x==='member').length,29);for(const n of ['스위스','노르웨이','덴마크','스웨덴'])assert.equal(s.values[n],'member');for(const n of ['아일랜드','키프로스','영국'])assert.equal(s.values[n],'outside');
});
