'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..'),K=require('../assets/entity-kb.js'),T=require('../assets/exam-themes.js'),E=require('../assets/exam-engine.js').create(K,T),D=require('../assets/materials-data.js'),M=require('../assets/materials-engine.js').create(D),C=require('../assets/classification-sets.js');
const close=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`),sum=a=>a.reduce((x,y)=>x+y,0);

test('remaining exam goals reach both polarities with every required crop and historical variant',()=>{
 const runtime=require('../audit/lecture-goals/runtime-evidence.json'),expect=['G004-2','G015-4','G018-4','G023-1','G074-1','G074-6','G077-3','G078-1','G092-4','G100-2','G114-5','G123-4','G124-5','G131-2','G132-3'];
 for(const id of expect){const x=runtime.existingExamGoals[id];assert.ok(x?.true>0&&x?.false>0,id);}
 for(const [id,variants]of [['G074-1',['쌀','밀','옥수수']],['G074-6',['agri-maize','agri-riceExports','아르헨티나']],['G077-3',['rice-sheep','wheat-pigs']],['G078-1',['인도','인도네시아']],['G123-4',['인도','중국']],['G131-2',['콜롬비아','에콰도르','페루','볼리비아']]])for(const variant of variants){const x=runtime.existingExamGoals[id].variants[variant];assert.ok(x?.true&&x?.false,id+' '+variant);}
 for(const n of ['멕시코','칠레','아르헨티나','브라질'])assert.ok(runtime.examCoverage['export-composition'].entities[n],n);
});

test('physical followups have usable default questions and source-bounded negative facts',()=>{
 const seen={};for(let seed=1;seed<=160;seed++){
  const q=E.build({themeId:'country-physical-clues',seed});assert.ok(q);
  for(const s of q.stage2.statements)if(['G004-2','G131-2'].includes(s.goalId)){
   const c=s.check,f=K.entities[c.entity].facts[c.set];assert.equal(s.truth,f.values.includes(c.value),s.text);
   if(!s.truth&&K.factSets[c.set].falseFromKnownOnly)assert.ok(f.falseValues.includes(c.value));
   (seen[s.goalId]??=new Set()).add(s.truth);
  }
 }
 for(const id of ['G004-2','G131-2'])assert.equal(seen[id]?.size,2,id);
 for(const n of ['라오스','볼리비아'])assert.deepEqual(K.entities[n].facts.landlocked.values,['yes']);
 assert.ok(K.entities['카자흐스탄'].facts.seas.falseValues.includes('홍해'));
});

test('historical double leaders agree with every country in each stated year, including the rice change',()=>{
 const db=require('../data/agriculture.json');
 for(const spec of K.goalAgricultureMaxima)for(const key of spec.keys)for(let y=spec.from;y<=spec.to;y++){
  const code=db.entities['중국'].areaCodes[0],value=db.seriesByArea[code][key][y];
  for(const [area,meta]of Object.entries(db.sourceAreas))if(meta.kind==='country')assert.ok(!(db.seriesByArea[area]?.[key]?.[y]>value),spec.id+' '+y+' '+meta.name);
 }
 for(const year of ['2023','2024'])assert.equal(db.rankings['qcl-production:쌀'][year][0].name,'인도');
});

test('three language territories and summit anchors are reachable in existing modes',()=>{
 const a=C.byId.languageBranch,b=C.byId.westAsiaLanguage,l=C.byId.latinLanguage;
 for(const [n,id]of Object.entries({'영국':'germanic','독일':'germanic','프랑스':'romance','에스파냐':'romance','포르투갈':'romance','브라질':'romance'}))assert.equal(C.entry(a,n).values[0],id,n);
 for(const [n,id]of Object.entries({'이란':'persian','튀르키예':'turkish','사우디아라비아':'arabic'}))assert.equal(C.entry(b,n).values[0],id,n);
 for(const [n,id]of Object.entries({'가이아나':'english','수리남':'dutch','프랑스':'french'}))assert.equal(C.entry(l,n).values[0],id,n);
 assert.equal(l.displayNames['프랑스'],'프랑스령 기아나');assert.ok(l.geometryOverrides?.['프랑스']||l.countryShapes?.['프랑스']||l.scopeByName?.['프랑스']||l.notes['프랑스'].includes('기아나'));
 const html=fs.readFileSync(R+'/index.html','utf8'),a0=JSON.parse(html.match(/<script id="auditData" type="application\/json">(.*?)<\/script>/s)[1]);
 for(const [n,mountain]of [['몽블랑산','알프스'],['나로드나야산','우랄'],['에베레스트산','히말라야']]){const x=a0.find(x=>x.name===n);assert.equal(x.geometry.kind,'peak');assert.match(x.memo,new RegExp(mountain));assert.ok(!x.referenceOnly);}
});

test('industry residual and GDP products preserve their explicitly displayed denominators and years',()=>{
 for(let seed=1;seed<=20;seed++){
  const q=M.build('industry-remainder',seed);assert.match(q.note,/세 산업.*합=100/);
  const values=q.tables[0].rows.map(row=>100-row[1]-row[2]);assert.equal(q.stage1.options[q.stage1.answer],q.tables[0].rows[values.indexOf(Math.max(...values))][0]);
  const b=M.build('industry-bubble',seed);assert.match(b.note,/원 면적은 1인당 GDP/);
  for(const p of b.pairs.filter(x=>x.check.op==='industryRemainder'))close(p.check.result,100-p.check.industry-p.check.services);
  const z=M.build('industry-amount',seed);for(const row of z.tables[0].rows){close(row[1],D.countries[row[0]].series.gdp['2021']);close(row[2],D.countries[row[0]].economySeries.industry['2021']);}
  const comparison=z.pairs.find(p=>p.check.op==='industryAmountComparison').check;assert.ok(comparison.china>comparison.usa);assert.equal(comparison.year,'2021');
 }
});

test('population stacks calculate actual segment amounts and never silently convert them to 100% bars',()=>{
 const db=require('../data/ethnic-stacks-given.json'),chart=require('../assets/materials-charts.js');assert.match(db.method,/근삿값/);assert.match(db.zeroNote,/0이라는 뜻이 아니다/);
 for(let seed=1;seed<=20;seed++){
  const q=M.build('ethnic-stacks',seed),f=q.figures.find(f=>f.kind==='stacked');assert.equal(f.maximum,20);assert.equal(f.categories.length,3);
  for(let j=0;j<4;j++)for(let i=0;i<3;i++)close(f.values[j][i],db.countries[f.categories[i]][j]);
  const rows=q.tables[0].rows;for(const row of rows)close(sum(row.slice(2)),100);
  const europ=rows.map(row=>row[1]*row[3]/100);assert.equal(q.stage1.options[q.stage1.answer],rows[europ.indexOf(Math.max(...europ))][0]);
  assert.ok(!/NaN|Infinity|undefined/.test(chart.render(f)));
 }
});

test('cohort exercises show both dated pyramids and trace the same birth cohort',()=>{
 const db=require('../data/population-pyramids.json');for(let seed=1;seed<=12;seed++){
  const q=M.build('pyramid-cohort',seed);assert.equal(q.figures.length,6);
  for(const row of q.tables[0].rows){const n=row[0];for(const y of ['2010','2020'])assert.ok(q.figures.some(f=>f.name===n+' '+y+'년'));const a=db.countries[n]['2010'],b=db.countries[n]['2020'];close(row[1],sum(a.male.slice(6,8))+sum(a.female.slice(6,8)));close(row[2],sum(b.male.slice(8,10))+sum(b.female.slice(8,10)));}
 }
});
