'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),vm=require('vm');
const R=path.resolve(__dirname,'..'),D=require('../assets/materials-remaining-data.js'),base=require('../assets/materials-data.js'),E=require('../assets/materials-engine.js').create(base),C=require('../assets/materials-charts.js');
const sum=a=>a.reduce((a,b)=>a+b,0),close=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);

test('remaining inputs and original cropped panels reproduce from pinned sources',()=>{
 for(const [f,hash] of Object.entries(D.sources))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex'),hash,f);
 for(const panel of D.panels){assert.ok(panel.width>60&&panel.height>60);assert.ok(panel.crop.every(x=>x>=0&&x<=1));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(R,panel.path))).digest('hex'),panel.sha256,panel.id);}
 // This image was a West Asia map, not a population pyramid; it must never return.
 assert.ok(!D.panels.some(p=>p.sourceFigure==='L2-rId241'));assert.ok(!E.families.some(f=>f.id==='arab-pyramids'));
 assert.equal(D.panels.find(p=>p.id==='asian-exports').sourceFigure,'L2-rId232');
 cp.execFileSync(process.execPath,[R+'/scripts/build-remaining-data.cjs','--check']);
 for(const f of ['build-population-pyramids.py','build-remaining-demography.py','build-capacity-comparison.py'])cp.execFileSync('python3',[R+'/scripts/'+f,'--check']);
});

test('all population pyramid formats use the appropriate sex or whole-population denominator',()=>{
 for(const row of Object.values(D.pyramids.countries))for(const year of ['2010','2020']){
  const x=row[year];for(const sex of ['male','female']){assert.equal(x[sex].length,17);close(sum(x[sex+'SexPercent']),100,1e-5);x[sex].forEach((count,i)=>assert.ok(Math.abs(count-x[sex+'Total']*x[sex+'SexPercent'][i]/100)<=.5000001));assert.ok(Math.abs(sum(x[sex])-x[sex+'Total'])<=8.5);}
 }
 for(let seed=1;seed<=30;seed++){
  const q=E.build('population-pyramid',seed),format=seed%3;
  q.figures.forEach((f,i)=>{const x=D.pyramids.countries[q.assignment[i]]['2020'];let den=format===0?[x.maleTotal,x.femaleTotal]:format===1?[x.maleTotal+x.femaleTotal,x.maleTotal+x.femaleTotal]:[1e6,1e6];f.male.forEach((v,j)=>close(v,x.male[j]/den[0]*(format===2?1:100)));f.female.forEach((v,j)=>close(v,x.female[j]/den[1]*(format===2?1:100)));if(format===0){close(sum(f.male),100,.001);close(sum(f.female),100,.001);}if(format===1)close(sum(f.male)+sum(f.female),100,.001);});
  const cohort=E.build('pyramid-cohort',seed);for(const row of cohort.tables[0].rows){const db=D.pyramids.countries[row[0]];assert.equal(row[1],sum(db['2010'].male.slice(6,8))+sum(db['2010'].female.slice(6,8)));assert.equal(row[2],sum(db['2020'].male.slice(8,10))+sum(db['2020'].female.slice(8,10)));}
 }
});

test('new numerical claims calculate from their displayed operands independently',()=>{
 const ids=E.families.map(f=>f.id),seen=new Set();
 for(const id of ids)for(let seed=1;seed<=12;seed++)for(const p of E.build(id,seed).pairs){const c=p.check;let result;seen.add(c.op);
  if(c.op==='composition')result=c.values[c.part]/sum(c.values)*100;
  if(c.op==='relative')result=c.value/c.maximum*100;
  if(c.op==='sexRatio')result=c.male/c.female*100;
  if(c.op==='sum')result=sum(c.values);
  if(c.op==='subtract')result=c.a-c.b;
  if(c.op==='product')result=c.a*c.b;
  if(c.op==='quotient')result=c.a/c.b;
  if(c.op==='foodBalance')result=c.production+c.imports-c.exports-c.stockIncrease;
  if(result!==undefined)close(result,c.result);
 }
 for(const op of ['sexRatio','foodBalance','capacityVsGeneration','rainVsPH','statMapType'])assert.ok(seen.has(op),op);
});

test('capacity rankings are independently sorted for the same six countries and year',()=>{
 const db=D.capacity.countries,rankings=require('../assets/rankings.js');
 assert.equal(D.capacity.year,2023);assert.ok(db['독일'].capacityMW>db['캐나다'].capacityMW);assert.ok(db['독일'].generationGWh<db['캐나다'].generationGWh);
 for(const [id,field]of [['renewable-capacity-six','capacityMW'],['renewable-generation-six','generationGWh']]){
  const t=rankings.rankings.find(x=>x.id===id);assert.equal(t.year,'2023');assert.match(t.scope,/제시 6개국/);assert.deepEqual(t.items.map(x=>x.name),Object.keys(db).sort((a,b)=>db[b][field]-db[a][field]));
 }
});

test('demographic periods preserve signed migration, units and explicit approximation scope',()=>{
 for(let seed=1;seed<=30;seed++){
  const q=E.build('population-periods',seed);assert.match(q.note,/근사/);assert.match(q.note,/정확한 차이/);
  for(const row of q.tables[0].rows){let expected=[];for(const [a,b]of [[2010,2014],[2015,2019]]){let natural=0,net=0;for(let y=a;y<=b;y++){const x=D.demography.countries[row[0]][y];natural+=x.population*(x.birthPerThousand-x.deathPerThousand)/1000;net+=x.netMigration;}expected.push(Math.round(natural/1000)/1000,Math.round(net/1000)/1000);}row.slice(1).forEach((v,i)=>close(v,expected[i]));}
  const rates=E.build('migration-continents',seed);for(const p of rates.pairs.filter(x=>x.check.op==='migrationDenominator'))for(const x of p.check.rows)close(x.social,x.net/x.p*100);
 }
 const q=E.build('population-periods',1),signed=q.figures.flatMap(f=>f.values.flat());assert.ok(signed.some(x=>x<0));for(const f of q.figures){const svg=C.render(f);for(const [,height]of svg.matchAll(/height="(-?[\d.]+)"/g))assert.ok(+height>=0);assert.ok(!/NaN|Infinity/.test(svg));}
});

test('all religion rank symbols are present and recover the two leaders in both source years',()=>{
 for(const year of ['2010','2020'])for(const [n,db]of Object.entries(D.religions)){
  const order=Object.entries(db.series[year]).filter(([k])=>!['unaffiliated','other'].includes(k)).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>k);assert.ok(order.every(k=>['hinduism','buddhism','islam'].includes(k)),n+year);
 }
 for(let seed=1;seed<=30;seed++){const q=E.build('religion-top-two',seed);assert.ok(q.tables[0].rows.every(row=>row.slice(1).every(x=>['(가)','(나)','(다)'].includes(x))));}
});

test('all six statistical map types are drawable and four-country assignments have compact options',()=>{
 for(let seed=0;seed<6;seed++){const q=E.build('stat-map-types',seed);assert.equal(q.stage1.options[q.stage1.answer],['단계 구분도','점묘도','유선도','도형표현도','등치선도','왜상 지도'][seed]);assert.equal(q.figures[0].mode,seed);assert.ok(!/NaN|Infinity|undefined/.test(C.render(q.figures[0])));}
 for(const id of ['andes-conditions','asian-export-items'])for(let seed=1;seed<=30;seed++){const q=E.build(id,seed);assert.equal(q.assignment.length,4);assert.equal(q.stage1.options.length,5);assert.equal(q.stage1.options[q.stage1.answer],q.assignment.join(' · '));assert.ok(!q.stage1.question.includes('undefined'));}
});

test('new browser scripts load in the actual HTML order and include the full family bank',()=>{
 const html=fs.readFileSync(R+'/materials.html','utf8'),context={};context.globalThis=context;vm.createContext(context);
 for(const [,f]of html.matchAll(/<script src="([^"?]+)[^"]*"><\/script>/g)){if(f.endsWith('materials-page.js'))continue;vm.runInContext(fs.readFileSync(R+'/'+f,'utf8'),context,{filename:f});}
 const web=context.WGMaterials.create(context.WGMaterialsData);assert.equal(web.families.length,E.families.length);for(const id of ['population-pyramid','stat-map-types','renewable-capacity-ranks','food-stock-balance'])assert.deepEqual(JSON.parse(JSON.stringify(web.build(id,7))),E.build(id,7));
});
