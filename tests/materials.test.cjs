'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'..'),D=require('../assets/materials-data.js'),M=require('../assets/materials-engine.js'),C=require('../assets/materials-charts.js'),E=M.create(D),A=M.math;
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('assets reproduce from the pinned inputs without changing the original banks',()=>{
 for(const script of ['build-materials-data.cjs','build-lecture-goal-facts.cjs','build-goal-tables.cjs'])cp.execFileSync(process.execPath,[path.join(ROOT,'scripts',script),'--check']);
 for(const [name,hash]of Object.entries(D.sources))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,name))).digest('hex'),hash,name);
 assert.equal(require('../assets/fact-statements.js').items.length,217);
});
test('monthly and cross-year cumulative differences invert the source months',()=>{
 const p=[1,2,3,4,5,6,7,8,9,10,11,12],c=A.cumulative(p);
 assert.deepEqual(c,[1,3,6,10,15,21,28,36,45,55,66,78]);
 close(A.season(c,[6,7,8]),21);close(A.season(c,[12,1,2]),15);
 for(const s of Object.values(D.climate.sites)){const c=A.cumulative(s.p);for(let m=1;m<=12;m++)close(A.season(c,[m]),s.p[m-1]);}
});
test('solar calculations obey independent equinox, solstice and hemisphere cases',()=>{
 for(const lat of [-80,-45,0,45,80])close(A.daylight(lat,0),12);
 close(A.daylight(80,23.44),24);close(A.daylight(-80,23.44),0);
 close(A.noonAltitude(-23.44,-23.44),90);close(A.noonAltitude(0,23.44),66.56);
 for(const lat of [10,23.44,45,60])close(A.daylight(lat,20)+A.daylight(-lat,20),24);
 const range=lat=>{const a=A.solar(lat);return Math.max(...a)-Math.min(...a);};assert.ok(range(1)<range(15)&&range(15)<range(40));
});
test('dependency, denominator and inverse calculations use working-age population',()=>{
 const a=A.age(20,30);assert.equal(a.w,50);assert.equal(a.total,100);assert.equal(a.young,40);assert.equal(a.old,60);assert.equal(a.aging,150);
 close(A.workforce(100),50);close(A.workforce(50),200/3);
 const d=A.age(25,11.7).total;assert.ok(Math.abs(d-36.7)>10);
 assert.throws(()=>A.age(60,40));assert.throws(()=>A.growth(0,2));
});
test('triangle vertices retain the actual expanded-axis values, radar uses each column maximum',()=>{
 const mins=[10,40,0];assert.deepEqual(A.ternary([60,40,0],mins),{x:0,y:0});assert.deepEqual(A.ternary([10,90,0],mins),{x:1,y:0});close(A.ternary([10,40,50],mins).y,Math.sqrt(3)/2);
 assert.throws(()=>A.ternary([10,20,30]));assert.throws(()=>A.ternary([5,90,5],mins));
 assert.deepEqual(A.normalize([[10,100,5],[20,50,10]],1),[[.5,1,.5],[1,.5,1]]);
});
test('September soil profile interpolation matches independent hand calculation',()=>{
 const q=E.build('soil-temperature',1),s=q.figures[0];
 close(A.zeroCrossing(s.depth,s.series[0].values),1+1/1.3);close(A.zeroCrossing(s.depth,s.series[1].values),2+.4/.7);
 assert.ok(s.series[0].values[2]<0&&s.series[1].values[2]>0);
 assert.match(q.note,/모식/);assert.match(q.note,/한 달/);
});
test('the original GIS examples and inclusive/exclusive boundaries are reproduced',()=>{
 const ai=E.build('gis-scoring',1),weights=E.build('gis-weighted',1),med=E.build('gis-medical',1),top=E.build('gis-top-two',1);
 assert.equal(ai.stage1.options[ai.stage1.answer],'이집트');assert.equal(weights.stage1.options[weights.stage1.answer],'모잠비크');assert.equal(med.stage1.options[med.stage1.answer],'A');assert.equal(top.stage1.options[top.stage1.answer],'B · C');
 assert.deepEqual(ai.pairs.filter(p=>p.check.op==='weightedScore').map(p=>p.check.result),[7,5,3,6,3]);assert.deepEqual(weights.pairs.filter(p=>p.check.op==='weightedScore').map(p=>p.check.result),[8,8,9,10,4]);
 assert.equal(A.bandScore(15,[15,30],1),2);assert.equal(A.bandScore(30,[15,30],1),3);assert.equal(A.bandScore(15,[15,30],-1),2);
 const rows=[['A',40],['B',39],['C',41]];assert.deepEqual(A.filterRows(rows,[{column:1,operator:'>=',value:40}],'AND').map(r=>r[0]),['A','C']);assert.deepEqual(A.filterRows(rows,[{column:1,operator:'>',value:40}],'AND').map(r=>r[0]),['C']);
});
test('all 30 families produce seeded, finite, uniquely scored two-step questions',()=>{
 const polarities=new Map(),kinds=new Set();
 for(const f of E.families)for(let seed=1;seed<=160;seed++){
  const q=E.build(f.id,seed);assert.equal(q.id,f.id);assert.deepEqual(q,E.build(f.id,seed));
  assert.ok(q.stage1.options.length>=2&&q.stage1.answer>=0&&q.stage1.answer<q.stage1.options.length,f.id);
  assert.equal(new Set(q.stage1.options).size,q.stage1.options.length,f.id);
  const expected=q.statements.flatMap((s,i)=>s.truth?[i]:[]);assert.deepEqual(q.stage2.subsets[q.stage2.answer],expected);
  assert.equal(q.stage2.subsets.filter(a=>a.join(',')===expected.join(',')).length,1);
  assert.ok(q.statements.some(s=>s.truth)&&q.statements.some(s=>!s.truth));
  for(const s of q.statements){assert.ok(s.explain&&s.text);const p=polarities.get(s.goal)||new Set();p.add(s.truth);polarities.set(s.goal,p);}
  for(const fig of q.figures){kinds.add(fig.kind);const svg=C.render(fig);assert.ok(!/NaN|Infinity|undefined/.test(svg),f.id);assert.match(svg,/<title>/);}
 }
 for(const [id,p]of polarities)assert.equal(p.size,2,id+' must actually be asked in both polarities');
 assert.ok(kinds.has('map')&&kinds.has('ternary')&&kinds.has('profile')&&kinds.has('three-axis'));
});
test('all generated numeric statement operands agree with independent recomputation',()=>{
 for(const f of E.families)for(let seed=1;seed<=24;seed++)for(const p of E.build(f.id,seed).pairs){
  const c=p.check;let v;
  if(c.op==='weightedGrowth')v=((c.u1+c.r1)/(c.u0+c.r0)-1)*100;
  if(c.op==='weights')v=c.gu*c.u0/(c.u0+c.r0)+c.gr*c.r0/(c.u0+c.r0);
  if(c.op==='product')v=c.a*c.b;
  if(c.op==='divideShare')v=c.value*100/c.share;
  if(c.op==='indexGrowth')v=c.index-100;
  if(c.op==='indexAmount')v=c.base*c.index/100;
  if(c.op==='restore')v=c.base+c.deviation;
  if(c.op==='weightedScore')v=c.scores.reduce((sum,x,i)=>sum+x*c.weights[i],0);
  if(c.op==='workforce')v=10000/(100+c.D);
  if(c.op==='youngDependency')v=c.total-c.old;
  if(c.op==='aging')v=c.old/c.young*100;
  if(v!==undefined)close(v,c.result,1e-7);
 }
});
test('migrant numbers stay supplied data, and false statements carry corrections',()=>{
 for(let seed=1;seed<=30;seed++){const q=E.build('migrant-stock',seed);assert.match(q.note,/제시 자료용/);assert.match(q.note,/stock/);assert.ok(q.tables.some(t=>t.rows.some(r=>r.includes(D.migrants['멕시코']))));for(const p of q.pairs)assert.equal(p.check.practice,'suppliedData');}
});
test('historical energy keeps EJ conversion, endpoint reversal and missing 2025 values explicit',()=>{
 cp.execFileSync('python3',[path.join(ROOT,'scripts/build-energy-change.py'),'--check']);
 const q=E.build('energy-change',1),idx=q.assignment.indexOf('미국');
 close(q.figures[idx].values[0][0],5337.998*.0036);
 for(const country of ['미국','중국']){
  const check=D.energy.coalDirectionWindow[country];assert.equal(check.validCases,110);assert.equal(check.allAvailableHold,true);assert.equal(check.fullPlusMinusFiveVerified,false);
  assert.equal(D.energy.countries[country]['2025'].coal_consumption,null);
 }
 const a=D.energy.countries['오스트레일리아'];assert.ok(a['2000'].coal_share_energy>a['2000'].oil_share_energy);assert.ok(a['2018'].coal_share_energy<a['2018'].oil_share_energy);
 for(let seed=1;seed<=20;seed++)for(const pair of E.build('energy-composition',seed).pairs)if(pair.check.op==='energyShareChange')assert.equal(pair.check.b>pair.check.a, D.energy.countries[pair.check.country][pair.check.to][pair.check.field]>D.energy.countries[pair.check.country][pair.check.from][pair.check.field]);
 const c=E.build('energy-composition',1);for(const fig of c.figures)for(const row of fig.values)close(row.reduce((s,x)=>s+x,0),100);
});
