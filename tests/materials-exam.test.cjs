'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../assets/materials-engine'),D=require('../assets/materials-data'),K=require('../assets/entity-kb'),C=require('../assets/materials-charts'),E=M.create(D);
const close=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(a),Math.abs(b))*1e-9,`${a} != ${b}`);
function numeric(c){switch(c.op){case'add':return c.a+c.b;case'product':return c.a*c.b;case'quotient':return c.a/c.b;case'growth':return(c.b-c.a)/c.a*100;case'capitalShare':return c.capital/(c.urban+c.rural)*100;case'workforce':return 10000/(100+c.D);case'youngDependency':return c.total-c.old;case'aging':return c.old/c.young*100;case'indexAmount':return c.base*c.index/100;case'dependency':return(c.young+c.old)/(100-c.young-c.old)*100;case'quotientShare':return c.a/c.b*100;case'industryRemainder':return 100-c.industry-c.services;case'fossilRemainder':return 100-c.coal-c.gas;case'sum':return c.values.reduce((a,b)=>a+b,0);case'weightedGrowth':return((c.u1+c.r1)/(c.u0+c.r0)-1)*100;}return undefined;}
test('every active family renders a finite, deterministic, single-submission question',()=>{
 for(const f of E.families)for(let seed=1;seed<=32;seed++){
  const raw=E.build(f.id,seed),x=E.exam(raw);assert.deepEqual(x,E.exam(raw),f.id);
  assert.ok(x.stage.options.length>=2&&x.stage.options.length<=5,f.id);assert.equal(new Set(x.stage.options).size,x.stage.options.length,f.id);assert.ok(x.stage.options[x.stage.answer]);
  for(const fig of x.figures)assert.doesNotMatch(C.render(fig),/NaN|Infinity|undefined/,f.id);
  if(x.stage.statements){const expected=x.stage.statements.filter(s=>s.truth).map(s=>s.mark).join(', ');assert.equal(x.stage.options[x.stage.answer],expected,f.id);assert.ok(x.stage.statements.some(s=>s.truth)&&x.stage.statements.some(s=>!s.truth));
   assert.ok(x.stage.options.every(o=>o&&!/없음/.test(o)),f.id);
   if(x.stage.statements.length===4)assert.ok(x.stage.options.every(o=>o.split(', ').length===2),f.id);
   if(x.stage.statements.length===2)assert.equal(x.stage.options.length,2,f.id);
  }
 }
});
test('rebuilt comparisons agree with independent arithmetic and retained geography facts',()=>{
 let checked=0;
 for(const f of E.families)for(let seed=1;seed<=12;seed++){
  const x=E.exam(E.build(f.id,seed));for(const s of x.stage.statements||[]){const c=s.check;
   if(c.op==='geographicFact'){assert.ok(K.entities[c.name].facts[c.set].values.includes(c.value));checked++;}
   if(c.op!=='examComparison')continue;
   const o=c.operands||[];
   if(o.length===2&&o[0].op){for(const operand of o){const v=numeric(operand);if(v!==undefined)close(v,operand.result);}close(c.a,o[0].result);close(c.b,o[1].result);checked++;}
   if(c.quantity==='netMigrationPeople'){close(c.a,o[0][1]*(o[0][3]-o[0][2])/100);close(c.b,o[1][1]*(o[1][3]-o[1][2])/100);checked++;}
   if(c.quantity==='exportProductionRatio'){close(c.a,o[0].y/o[0].x);close(c.b,o[1].y/o[1].x);checked++;}
   if(c.quantity==='sexRatio'){close(c.a,o[0].male/o[0].female*100);close(c.b,o[1].male/o[1].female*100);checked++;}
   assert.equal(s.truth,/(크다|많다|높다|넓다)\.$/.test(s.text)===(c.a>c.b),f.id+' '+s.text);
  }
 }
 assert.ok(checked>500);
});
test('solar tasks require season and hemisphere, never numeric declination or four-month formulas',()=>{
 const months=new Set();for(let seed=1;seed<=80;seed++){
  const x=E.exam(E.build('solar-month',seed));assert.match(x.condition,/1월과 7월/);assert.equal(x.tables[0].headers.length,2);
  const rows=x.tables[0].rows;const month=rows[0][1]>rows[2][1]?7:1;months.add(month);
  for(const s of x.stage.statements){assert.doesNotMatch(s.text,/직사 위도.*\d|적위|4월|10월|90°|소수/);assert.equal(s.check.month,month);}
 }assert.deepEqual([...months].sort(),[1,7]);
});
test('named lookup keys disappear while necessary anonymous population quantities remain',()=>{
 for(const id of ['lake-types','grain-size','cumulative','difference','grain-triangle','beverage-triangle']){
  const x=E.exam(E.build(id,1));assert.equal(x.tables.length,0,id);assert.ok(x.referenceTables.length,id);
 }
 for(const id of ['urban-change','population-pyramid']){
  const q=E.build(id,1),x=E.exam(q);assert.ok(x.tables.length);
  for(const row of x.tables[0].rows){assert.match(row[0],/^\([가-라]\)$/);assert.ok(!q.assignment.includes(row[0]));}
 }
});
test('six-city matrix has two named anchors and a unique complete assignment',()=>{
 function permutations(a){return a.length?a.flatMap((x,i)=>permutations(a.filter((_,j)=>i!==j)).map(p=>[x,...p])):[[]];}
 // Tables show three significant figures, as exam tables do.
 const km=(a,b)=>{const v=Math.round(M.math.distance(D.cities[a],D.cities[b])),k=Math.pow(10,Math.max(0,Math.floor(Math.log10(v))-2));return Math.round(v/k)*k;};
 for(let seed=1;seed<=12;seed++){
  const x=E.exam(E.build('city-distance',seed)),t=x.tables[0],unknown=['로스앤젤레스','샌프란시스코','시카고','휴스턴'];
  assert.equal(t.rows.length,6);assert.equal(t.rows[0][0],'뉴욕');assert.equal(t.rows[1][0],'보스턴');
  const fits=permutations(unknown).filter(p=>['뉴욕','보스턴'].every((anchor,i)=>p.every((n,j)=>t.rows[i][j+3]===km(anchor,n))));
  assert.equal(fits.length,1);assert.deepEqual(fits[0],x.identification);
  assert.ok(x.stage.statements.every(s=>s.check.op==='cityKnowledge'));
 }
});
