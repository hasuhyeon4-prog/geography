'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const M=require('../assets/materials-engine'),D=require('../assets/materials-data'),X=require('../assets/materials-remaining-data'),K=require('../assets/entity-kb'),E=M.create(D);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(a),Math.abs(b)),a+' != '+b);
test('essential scope conditions are keyed to real theme IDs and remain available before judgment',()=>{
 const html=fs.readFileSync(require.resolve('../exam.html'),'utf8'),body=html.slice(html.indexOf('function examCondition('),html.indexOf('function render(){',html.indexOf('function examCondition(')));
 const condition=require('node:vm').runInNewContext(body+';examCondition'),T=require('../assets/exam-engine').create(K,require('../assets/exam-themes')).themes;
 for(const [id,pattern] of [['continent-fertility',/러시아는 유럽/],['export-composition',/다이아몬드/],['climate-graphs',/1991~2020/]])assert.match(condition(T.find(t=>t.id===id)),pattern,id);
});
test('photo judgments use several anonymous panels and their own properties, never a name-only answer',()=>{
 for(const id of ['oldmap-images','coast-images','religious-buildings','traditional-houses','city-images','road-images'])for(let seed=1;seed<=24;seed++){
  const x=E.exam(E.build(id,seed));assert.ok(x.judgment);assert.ok(x.figures.length>=2);assert.equal(new Set(x.figures.map(f=>f.src)).size,x.figures.length);
  assert.ok(x.figures.every(f=>/^\([가-다]\)$/.test(f.name)));assert.equal(new Set(x.stage.statements.map(s=>s.text)).size,x.stage.statements.length);
  for(const s of x.stage.statements){assert.equal(s.check.op,'photoKnowledge');assert.ok(x.figures.some(f=>f.src===X.panels.find(p=>p.id===s.check.panel).path));assert.doesNotMatch(s.text,/모든 주민|모든 시설|모든 도로|한 번도|모든 대권/);}
 }
});
test('relative religion identifies anonymous religions from countries before judging religion knowledge',()=>{
 for(let seed=1;seed<=40;seed++){
  const q=E.build('religion-relative',seed),x=E.exam(q),t=x.tables[0];assert.deepEqual(t.headers,['국가','A','B','C','D']);assert.deepEqual(x.identificationLabels,['A','B','C','D']);
  for(let i=0;i<t.rows.length;i++){assert.equal(t.rows[i][0],q.assignment[i]);for(let j=0;j<4;j++){const v=q.tables[0].rows[i][q.tables[0].headers.indexOf(x.identification[j])];assert.ok(Math.abs(t.rows[i][j+1]-v)<=Math.abs(v)*.005,t.rows[i][j+1]+' ~ '+v);}}
  assert.ok(x.stage.statements.every(s=>s.check.op==='religionTrait'));assert.equal(x.figures.length,0);
 }
});
test('new numeric comparisons recompute from the actual supplied operands and same-year data',()=>{
 for(const id of ['migrant-stock','renewables-denominators','gdp-map-denominators'])for(let seed=1;seed<=24;seed++){
  const x=E.exam(E.build(id,seed));for(const s of x.stage.statements){const c=s.check;if(c.op!=='examComparison')continue;
   if(c.quantity==='migrantNaturalRate'){const o=c.operands;near(c.a,o[0].birthPerThousand-o[0].deathPerThousand);near(c.b,o[1].birthPerThousand-o[1].deathPerThousand);}
   if(c.quantity==='migrantNaturalPeople'){for(let i=0;i<2;i++){const o=c.operands[i];near(i?c.b:c.a,o.population*(o.birthPerThousand-o.deathPerThousand)/1000);}}
   if(/^renewable/.test(c.quantity)){for(let i=0;i<2;i++){const j=c.indices[i];near(i?c.b:c.a,c.totals[j]*c.shares[j][c.column]/100);}}
   if(c.quantity==='gdpPopulation'){near(c.a,c.operands[0][1]/c.operands[0][2]);near(c.b,c.operands[1][1]/c.operands[1][2]);}
   assert.equal(s.truth,/(크다|많다|높다|넓다)\.$/.test(s.text)===(c.a>c.b));
  }
 }
});
test('partner symbols conceal the answers; export/import labels and denominators remain supplied',()=>{
 assert.ok(K.entities['일본'].values.old>K.entities['중국'].values.old);assert.ok(!K.entities['영국'].facts.bloc.values.includes('eu'));
 for(let seed=1;seed<=30;seed++){
  const x=E.exam(E.build('australia-trade-change',seed));assert.equal(x.tables.length,0);assert.deepEqual(x.figures.map(f=>f.name),['수출','수입']);
  for(const f of x.figures){assert.ok(f.categories.slice(0,3).every(s=>/^[ABC]$/.test(s)));assert.equal(f.categories[3],'기타');}
  assert.deepEqual(x.identification.slice().sort(),['영국','일본','중국'].sort());assert.ok(x.stage.statements.every(s=>s.check.op==='partnerKnowledge'));
 }
 for(const id of ['andes-conditions'])assert.equal(E.exam(E.build(id,1)).tables.length,0);
});
test('unsupported extensions are deleted while necessary source knowledge stays elsewhere',()=>{
 const ids=new Set(E.families.map(f=>f.id));
 for(const id of ['food-stock-balance','gis-tie-break','solar-altitude','solar-climate','religion-selected','religion-other','renewable-capacity-ranks','rain-ph-maps','religious-landmarks','pyramid-cohort','meander-banks'])assert.ok(!ids.has(id),id);
 for(const id of ['religious-buildings','religion-relative','population-pyramid','regional-radar','solar-month','mineral-relative'])assert.ok(ids.has(id),id);
});
test('mineral relative values keep the original supplied regional case instead of new production-rank recall',()=>{
 const source=require('../data/given-source-figures.json').figures.find(f=>f.id==='lecture2-rId190');
 assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(require.resolve('../assets/goal-figures/mineral-relative-source.png'))).digest('hex'),source.sha256);
 for(let seed=1;seed<=24;seed++){
  const x=E.exam(E.build('mineral-relative',seed));assert.ok(x.judgment);assert.deepEqual(x.identification,['볼리비아','브라질','칠레']);
  assert.equal(x.figures[0].src,'assets/goal-figures/mineral-relative-source.png');assert.ok(fs.existsSync(require('node:path').join(__dirname,'..',x.figures[0].src)));assert.equal(x.tables.length,0);assert.equal(x.referenceTables.length,0);assert.match(x.condition,/2022년/);
  for(const s of x.stage.statements)assert.doesNotMatch(s.text,/멕시코|페루|중국|생산량.*\d/);
 }
 assert.equal(E.exam(E.build('city-distance',1)).referenceTables.length,0);
});
