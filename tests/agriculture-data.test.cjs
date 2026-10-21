'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),{spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const data=require('../data/agriculture.json'),audit=require('../audit/agriculture-validation-20261021.json');
const config=require('../data/exam-relations-agriculture.json'),cards=require('../data/concepts/agriculture.json');
const kb=require('../assets/entity-kb.js');
function python(code){
 const r=spawnSync('python3',['-c',code],{cwd:ROOT,encoding:'utf8',maxBuffer:25*1024*1024});assert.equal(r.status,0,r.stderr||r.stdout);return JSON.parse(r.stdout);
}
// Parse original source records independently of the builder and its cards.
const raw=python(`
import csv,io,json,zipfile
z=zipfile.ZipFile('data/agriculture-source-snapshots.zip');out={}
for domain in ['QCL','FBS','TCL']:
 d={}
 for r in csv.DictReader(io.TextIOWrapper(z.open(domain+'/selected.csv'),encoding='utf-8-sig')):
  if r['Value'].strip():d['|'.join([r['Area Code'],r['Item Code'],r['Element Code'],r['Year']])]={'value':float(r['Value']),'unit':r['Unit'],'flag':r['Flag']}
 out[domain]=d
print(json.dumps(out))
`);
const value=(domain,a,i,e,y)=>raw[domain][[a,i,e,y].join('|')];
const area=n=>data.entities[n].areaCodes[0];
function sourceSeries(name,key){
 const [head,item]=key.split(':'),domain=head.slice(0,3).toUpperCase(),kind=head.slice(4);
 if(kind==='netExports'){
  const a=sourceSeries(name,head.slice(0,3)+'-exports:'+item),b=sourceSeries(name,head.slice(0,3)+'-imports:'+item);
  return Object.fromEntries(Object.keys(a).filter(y=>y in b).map(y=>[y,a[y]-b[y]]));
 }
 if(kind==='yield'||kind==='exportRatio'){
  const a=sourceSeries(name,(kind==='yield'?'qcl-production:':'fbs-exports:')+item),b=sourceSeries(name,(kind==='yield'?'qcl-area:':'fbs-production:')+item);
  return Object.fromEntries(Object.keys(a).filter(y=>y in b&&b[y]>0).map(y=>[y,a[y]/b[y]*(kind==='yield'?1000:100)]));
 }
 const def=data.indicators[key];assert.ok(def&&!def.derived,key);
 const code=domain==='QCL'?{area:'5312',production:'5510',stocks:'5111',meat:'5510'}[kind]:domain==='FBS'?{production:'5511',exports:'5911',imports:'5611'}[kind]:{exports:'5910',imports:'5610'}[kind];
 const out={};
 for(let y=2013;y<=2025;y++){
  const rows=data.entities[name].areaCodes.map(a=>value(domain,a,def.itemCode,code,y));
  if(rows.every(Boolean))out[y]=rows.reduce((s,r)=>s+r.value*(domain==='FBS'?1000:1),0);
 }
 return out;
}
test('all source hashes and regenerated outputs reproduce',()=>{
 const r=spawnSync('python3',['scripts/build-agriculture-data.py','--check'],{cwd:ROOT,encoding:'utf8'});assert.equal(r.status,0,r.stderr||r.stdout);
});
test('current source anchors retain rice, cattle and tea definitions',()=>{
 assert.equal(data.seriesByArea[area('중국')]['qcl-production:쌀']['2023'],206603200);
 assert.equal(data.seriesByArea[area('인도')]['qcl-production:쌀']['2023'],207753551.26);
 for(const [name,item,key,e] of [['중국','27','qcl-production:쌀','5510'],['인도','27','qcl-production:쌀','5510'],['브라질','866','qcl-stocks:소','5111']])assert.equal(data.seriesByArea[area(name)][key]['2023'],value('QCL',area(name),item,e,2023).value);
 assert.equal(data.indicators['qcl-stocks:소'].itemCode,'866');assert.equal(data.indicators['qcl-stocks:소·물소'].itemCode,'1746');
 assert.equal(data.indicators['qcl-production:차(생엽)'].itemCode,'667');assert.equal(data.indicators['qcl-production:차(가공)'].itemCode,'675');
});
test('every active pair holds in all available raw-source years',()=>{
 for(const r of audit.relations.filter(r=>r.status==='active')){
  const a=sourceSeries(r.more,r.indicator),b=sourceSeries(r.less,r.indicator),ys=Object.keys(a).filter(y=>y in b&&+y>=2015&&+y<=2025).sort();
  assert.deepEqual(ys,r.years,r.id);assert.ok(ys.length>=8,r.id);
  for(const y of ys){assert.ok(a[y]>b[y],r.id+' '+y);if(b[y]>0)assert.ok(a[y]/b[y]>=config.check.minRatio,r.id+' '+y);}
 }
});
test('active net-trade directions use raw imports and exports in the same year',()=>{
 for(const r of audit.signs.filter(r=>r.status==='active')){
  const s=sourceSeries(r.entity,r.indicator),ys=Object.keys(s).filter(y=>+y>=2015&&+y<=2025).sort();assert.deepEqual(ys,r.years);assert.ok(ys.length>=8);
  for(const y of ys)assert.ok(s[y]*r.sign>0,r.id+' '+y);
 }
});
test('active within-area orders hold in original production, export and count records',()=>{
 for(const r of audit.orders.filter(r=>r.status==='active'&&r.items))for(let i=0;i<r.items.length-1;i++){
  const a=sourceSeries(r.area,r.prefix+':'+r.items[i]),b=sourceSeries(r.area,r.prefix+':'+r.items[i+1]);
  for(const y of r.checks[i].years){assert.ok(a[y]>b[y],r.id+' '+y);assert.ok(a[y]/b[y]>=config.check.minRatio,r.id+' '+y);}
 }
});
test('world first-place recall checks every reporting country and its runner-up margin',()=>{
 for(const r of audit.orders.filter(r=>r.status==='active'&&r.entity)){
  const def=data.indicators[r.indicator],e=r.indicator.includes('-stocks:')?'5111':def.domain==='TCL'?'5910':'5510';
  for(const y of r.years){
   const v=value(def.domain,area(r.entity),def.itemCode,e,y).value;
   for(const [id,a]of Object.entries(data.sourceAreas)){
    if(a.kind!=='country'||id===area(r.entity))continue;const b=value(def.domain,id,def.itemCode,e,y);
    if(b){assert.ok(v>=b.value,r.id+' '+a.name);if(b.value>0)assert.ok(v/b.value>=config.check.minRatio,r.id+' '+a.name);}
   }
  }
 }
 const china=Object.entries(data.sourceAreas).find(([,a])=>a.name==='China')[0];assert.equal(data.sourceAreas[china].kind,'aggregate');
 assert.ok(data.rankings['qcl-production:쌀']['2023'].every(r=>r.areaCode!==china));
});
test('regional scopes and missing records stay explicit; composite ratios use sums of totals',()=>{
 assert.deepEqual(data.entities['앵글로아메리카'].areaCodes,['5203']);assert.deepEqual(data.entities['북아메리카'].areaCodes,['5203','5204','5206']);assert.deepEqual(data.entities['라틴 아메리카'].areaCodes,['5204','5206','5207']);
 assert.equal(data.seriesByArea['5206']['fbs-production:밀']['2013'],0);assert.equal(data.seriesByArea['5206']['fbs-production:밀']['2023'],undefined);
 const result=python("import importlib.util,json;s=importlib.util.spec_from_file_location('a','scripts/build-agriculture-data.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);d=json.load(open('data/agriculture.json'));print(json.dumps(m.resolve(d,'라틴 아메리카','fbs-exportRatio:곡물 전체')))" );
 for(const [y,v]of Object.entries(sourceSeries('라틴 아메리카','fbs-exportRatio:곡물 전체')))assert.ok(Math.abs(result[y]-v)<1e-7);
});
test('FBS ratios, QCL yields, tonnes and hectares never mix source domains',()=>{
 for(const name of ['세계','중국','인도','유럽'])for(const item of ['밀','쌀','옥수수'])for(const prefix of ['fbs-exportRatio','qcl-yield']){
  const result=data.seriesByArea[area(name)][prefix+':'+item];for(const [y,v]of Object.entries(sourceSeries(name,prefix+':'+item)))assert.ok(Math.abs(result[y]-v)<1e-7);
 }
 assert.equal(data.indicators['fbs-production:쌀'].itemCode,'2807');assert.equal(data.indicators['tcl-exports:정미'].itemCode,'31');assert.equal(data.indicators['qcl-area:쌀'].unit,'ha');assert.equal(data.indicators['tcl-exportValue:밀'].unit,'천 US$');
});
test('regressions reject rice revisions, changing exporters and historical livestock orders',()=>{
 assert.equal(audit.orders.find(r=>r.id==='agri-max-rice').status,'reversed');
 const maize=audit.orders.find(r=>r.id==='agri-max-maize-export');assert.equal(maize.status,'reversed');assert.ok(maize.reason.includes('2019'));assert.ok(maize.reason.includes('2023'));
 assert.equal(audit.orders.find(r=>r.id==='agri-asia-stocks').status,'reversed');assert.deepEqual(audit.counts,{active:50,insufficientYears:2,reversed:4});
 assert.deepEqual(config.relations.find(r=>r.id==='agri-rice-leaders').given.rankedEntities,['중국','인도','방글라데시']);
 const result=python(`
import importlib.util,json
s=importlib.util.spec_from_file_location('a','scripts/build-agriculture-data.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
c={'window':[2015,2025],'minYears':8,'minRatio':1.1};a={str(y):200 for y in range(2015,2025)};b={str(y):100 for y in range(2015,2025)}
a['2024']=99;r=m.validate_pair(a,b,c)['status'];a['2024']=105;q=m.validate_pair(a,b,c)['status'];p=m.validate_pair({'2023':200},{'2023':100},c)['status'];print(json.dumps([r,q,p]))
`);assert.deepEqual(result,['reversed','belowMargin','insufficientYears']);
});
test('scoped concept cards and Korean country names preserve their source boundaries',()=>{
 assert.equal(Object.keys(cards.entities).length,19);assert.equal(Object.keys(cards.sets).length,9);assert.equal(cards.statements.length,28);
 for(const s of Object.values(cards.sets)){
  assert.equal(s.complete,false);assert.ok(s.source.includes('P06'));assert.deepEqual(Object.keys(s.values),s.scope);
  for(const [n,vs]of Object.entries(s.values)){assert.ok(cards.entities[n]);if(s.exclusive)assert.equal(vs.length,1);for(const v of vs)assert.ok(s.options.includes(v));}
 }
 for(const s of cards.statements){assert.equal(typeof s.truth,'boolean');assert.ok(s.source.includes('P06'));for(const n of s.about)assert.ok(cards.entities[n]);}
 for(const [n,e]of Object.entries(data.entities))if(e.type==='country')assert.equal(kb.entities[n].iso3,e.iso3);
});
