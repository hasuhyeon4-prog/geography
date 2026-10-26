'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../assets/materials-engine.js').create(require('../assets/materials-data.js'));
const C=require('../assets/materials-charts.js');

test('answer positions vary in every material family, including fixed source examples',()=>{
 for(const f of E.families){
  const positions=new Set();
  for(let seed=1;seed<=80;seed++){
   const q=E.build(f.id,seed);positions.add(q.stage1.answer);
   assert.equal(new Set(q.stage1.options).size,q.stage1.options.length,f.id);
   assert.ok(q.stage1.options[q.stage1.answer]);
  }
  assert.ok(positions.size>1,f.id+' exposes a fixed answer position');
 }
 // Hand-calculated source examples must still retain their correct answers.
 const expected={'gis-medical':'A','gis-weighted':'모잠비크','trade-bubble':'A',
  'livestock-denominators':null,'soil-temperature':'2001년'};
 for(const [id,answer]of Object.entries(expected))if(answer){
  const q=E.build(id,1);assert.equal(q.stage1.options[q.stage1.answer],answer,id);
 }
});

test('truth patterns vary independently of statement position and seed parity',()=>{
 for(const id of ['population-index','food-stock-balance']){
  const patterns=new Set(),byParity=[new Set(),new Set()];
  for(let seed=1;seed<=200;seed++){
   const q=E.build(id,seed),pattern=q.statements.map(s=>+s.truth).join('');
   assert.equal(q.statements.length,4);patterns.add(pattern);byParity[seed%2].add(pattern);
   assert.deepEqual(q.stage2.subsets[q.stage2.answer],q.statements.flatMap((s,i)=>s.truth?[i]:[]));
  }
  assert.equal(patterns.size,16,id+' must allow every four-statement truth pattern');
  assert.ok(byParity.every(s=>s.size>8),id+' must not expose answers through parity');
 }
});

test('the choropleth uses exactly its three stated bins, including upper boundaries',()=>{
 const svg=C.render({kind:'stat-map',mode:0});
 const fills=[...svg.matchAll(/<rect x="\d+" y="\d+" width="155" height="135" fill="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(fills,['#dbe9ed','#dbe9ed','#86baca','#86baca','#397d96','#397d96']);
});

test('negative-only bars include zero without extending above the plot',()=>{
 const svg=C.render({kind:'bars',labels:['A','B'],values:[-3,-1],yLabel:'편차'});
 const bars=[...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#[^"]+"\/>/g)];
 assert.equal(bars.length,2);
 for(const b of bars){assert.ok(+b[2]>=34);assert.ok(+b[2]+ +b[4]<=345.001);}
});

test('the population-stack category label has space before the plotting area',()=>{
 const q=E.build('ethnic-stacks',1),f=q.figures.find(f=>f.kind==='stacked'),svg=C.render(f);
 const label=svg.match(/<text x="([\d.]+)"[^>]*>원주민 및 기타<\/text>/);
 assert.ok(label);assert.ok(+label[1]>=100,'the Korean label needs at least 100 SVG units to its left');
});

test('overlapping white bubbles cannot paint over any point label',()=>{
 const svg=C.render({kind:'scatter',zero:true,sizeLabel:'원 면적',points:[{name:'first-label',x:10,y:10,size:20},{name:'second-label',x:11,y:11,size:100}]});
 const lastBubble=[...svg.matchAll(/<circle\b[^>]*\/>/g)].at(-1).index;
 for(const text of ['first-label','second-label'])assert.ok(svg.indexOf('>'+text+'</text>')>lastBubble,text+' must be above all bubbles');
});

test('China grain identification asks for map letters rather than continent legend symbols',()=>{
 for(let seed=1;seed<=12;seed++){
  const q=E.build('china-grain-map',seed);
  assert.match(q.stage1.question,/A·B·C/);
  assert.equal(q.stage1.options[q.stage1.answer],'옥수수 · 밀 · 쌀');
  assert.match(q.stage1.explain,/대륙 기호/);
 }
});
