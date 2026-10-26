'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'..'),D=require('../assets/materials-data.js'),M=require('../assets/materials-engine.js'),E=M.create(D),C=require('../assets/materials-charts.js');
const ids=['car-growth','capital-share','birth-death','city-distance','climate-restore','religion-relative','religion-selected','religion-other','crop-yield','urban-rural-scatter'];
const close=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
function permutations(a){return a.length<2?[a]:a.flatMap((x,i)=>permutations(a.filter((_,j)=>i!==j)).map(p=>[x,...p]));}

test('official input can be rebuilt offline and missing OICA parts are never zero-filled',()=>{
 const python=process.env.CODEX_PRIMARY_RUNTIME_PYTHON||'python3';
 cp.execFileSync(python,[path.join(ROOT,'scripts/build-goal-continuation-source.py'),'--check']);
 const s=D.continuation;
 assert.deepEqual(s.cars.years,[2010,2012,2014]);
 assert.equal(s.cars.countries['독일']['2010'].total,5905985);
 assert.equal(s.cars.countries['멕시코']['2014'].total,3368010);
 for(const rows of Object.values(s.cars.countries))for(const row of Object.values(rows)){
  assert.ok(row.passenger>=0&&row.commercial>=0);assert.equal(row.total,row.passenger+row.commercial);
 }
 assert.equal(s.capitals.year,2025);assert.match(s.capitals.definition,/DEGURBA/);assert.match(s.capitals.definition,/2018.*재현이 아니다/);
 for(const x of Object.values(s.capitals.countries)){assert.equal(x.year,2025);assert.ok(x.capitalPopulation>0&&x.capitalPopulation<x.urban+x.rural);}
 assert.equal(s.capitals.countries['브라질'].capitalPopulation,1521.148);
});

test('every newly asked numeric claim agrees with a fresh calculation from its operands',()=>{
 const operations=new Set();
 for(const id of ids)for(let seed=1;seed<=160;seed++){
  const q=E.build(id,seed);
  for(const p of q.pairs){
   const c=p.check;operations.add(c.op);let v;
   if(c.op==='subtract')v=c.a-c.b;
   if(c.op==='add')v=c.a+c.b;
   if(c.op==='growth')v=(c.b-c.a)/c.a*100;
   if(c.op==='capitalShare')v=100*c.capital/(c.urban+c.rural);
   if(c.op==='relativeShare')v=100*c.value/c.total;
   if(c.op==='product')v=c.a*c.b;
   if(c.op==='quotient')v=c.a/c.b;
   if(c.op==='cropPerPerson')v=c.productionThousandTonnes*1000000/(c.populationTenThousands*10000);
   if(c.op==='urbanShareChange')v=100*c.u1/(c.u1+c.r1)-100*c.u0/(c.u0+c.r0);
   if(c.op==='cityDistance'){
    // Independent cosine formula, rather than calling the generator's haversine.
    const rad=Math.PI/180,a=c.a,b=c.b;
    v=Math.round(6371*Math.acos(Math.sin(a.lat*rad)*Math.sin(b.lat*rad)+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.cos((a.lon-b.lon)*rad)));
   }
   if(v!==undefined)close(v,c.result);
   if(c.op==='growthVsLevel'){
    const a=c.mexico,b=c.germany;
    assert.ok(a['2014'].total<b['2014'].total);
    assert.ok(a['2014'].total/a['2010'].total>b['2014'].total/b['2010'].total);
   }
  }
 }
 for(const op of ['capitalShare','growth','cropPerPerson','cityDistance','relativeShare','urbanShareChange'])assert.ok(operations.has(op),op);
});

test('computed first answers use the displayed rounded table, with no hidden precision',()=>{
 for(let seed=1;seed<=100;seed++){
  let q=E.build('capital-share',seed),rows=q.tables[0].rows;
  let values=rows.map(r=>r[2]/(r[3]+r[4]));assert.equal(q.stage1.options[q.stage1.answer],rows[values.indexOf(Math.max(...values))][0]);
  q=E.build('birth-death',seed);rows=q.tables[0].rows;values=rows.map(r=>r[1]+r[2]);assert.equal(q.stage1.options[q.stage1.answer],rows[values.indexOf(Math.max(...values))][0]);
  q=E.build('crop-yield',seed);rows=q.tables[0].rows;values=rows.map(r=>seed%3===0?r[1]*r[2]:r[1]/r[2]);assert.equal(q.stage1.options[q.stage1.answer],rows[values.indexOf(Math.max(...values))][0]);
  for(const p of q.pairs.filter(p=>p.check.op==='cropPerPerson')){
   const row=rows.find(r=>p.yes.startsWith(r[0]));
   const production=seed%3===0?row[1]*row[2]:row[1];close(p.check.result,production*100/row[3]);
  }
 }
});

test('distance matching is unique among all six assignments, symmetric and not an aviation statistic',()=>{
 for(let seed=1;seed<=40;seed++){
  const q=E.build('city-distance',seed),ref=q.tables[0],anon=q.tables[1],cities=ref.rows.map(r=>r[0]);
  const km=(a,b)=>ref.rows[cities.indexOf(a)][cities.indexOf(b)+1];
  const valid=permutations(cities).filter(p=>p.every((n,i)=>p.every((m,j)=>km(n,m)===anon.rows[i][j+1])));
  assert.equal(valid.length,1);assert.deepEqual(valid[0],q.assignment);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)assert.equal(anon.rows[i][j+1],anon.rows[j][i+1]);
  assert.match(q.note,/항공편 수가 아니다/);
 }
 close(M.math.distance({lat:0,lon:0},{lat:0,lon:90}),Math.PI*6371/2);
});

test('relative and subset religion denominators remain distinct from country totals and counts',()=>{
 for(let seed=1;seed<=80;seed++){
  let q=E.build('religion-relative',seed);
  for(const row of q.tables[0].rows)assert.equal(Math.max(...row.slice(1)),100);
  assert.ok(q.figures.every(f=>f.kind==='bars'));
  q=E.build('religion-selected',seed);for(const p of q.figures[0].points)close(p.values.reduce((a,b)=>a+b,0),100);
  assert.match(q.note,/불교.*제외/);
  q=E.build('religion-other',seed);for(const row of q.figures[0].values)close(row.reduce((a,b)=>a+b,0),100);
  assert.match(q.note,/불교.*무종교/);assert.ok(q.pairs.some(p=>p.check.op==='otherNotSingle'));
 }
});

test('climate restoration preserves the sign of the coldest month and urban slopes are not urban percentages',()=>{
 for(let seed=1;seed<=60;seed++){
  const q=E.build('climate-restore',seed);
  for(let i=0;i<3;i++)close(q.tables[0].rows[i][1]+q.tables[0].rows[i][2],Math.max(...D.climate.sites[q.stationNames[i]].t));
  const s=E.build('urban-rural-scatter',seed);assert.equal(s.figures[0].movements.length,3);assert.equal(s.figures[0].zero,true);
  assert.match(s.note,/기울기와 값 자체는 다르다/);
  const svg=C.render(s.figures[0]);assert.match(svg,/<polygon/);assert.ok(!/NaN|Infinity/.test(svg));
 }
});

test('restored map and historical-capital clauses retain evidence and GDP residuals are not renamed agriculture',()=>{
 const p=require('../audit/lecture-goals/progress.json');
 for(const id of ['G062-5','G133-1']){const x=p.items.find(x=>x.id===id),c=require('../data/goal-completion-review-20261026.json').items.find(x=>x.id===id);assert.equal(x.status,'검증');assert.ok(c.initialRemaining&&c.evidence.length>=4);}
 assert.match(E.build('capital-share',1).source,/2018/);assert.ok(E.build('climate-restore',1).figures.some(f=>f.kind==='map'));
 assert.ok(p.limitations.some(x=>/G127-2.*100/.test(x)));
 const v=require('../data/economy-indicators.json').countries['인도'].values;
 assert.ok(Math.abs((100-v.industry-v.services)-v.agriculture)>1);
});
