'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
test('UN geographical rows include Northern America 905, not USA + Canada',()=>{
 const a=read('data/urbanization-change.json').areas;
 assert.equal(a['앵글로아메리카'].location.id,905);
 assert.equal(a['라틴 아메리카'].location.id,904);
 for(const n of ['앵글로아메리카','라틴 아메리카']){
  const s=a[n].series;for(const k of ['urbanPopulation','ruralPopulation','totalPopulation','urbanShare'])assert.equal(Object.keys(s[k]).length,101,n+' '+k);
  for(const y of ['1950','2020','2050']){
   assert.ok(Math.abs(s.urbanPopulation[y]+s.ruralPopulation[y]-s.totalPopulation[y])<3,n+' rounded raw population components');
   assert.ok(Math.abs(s.urbanPopulation[y]/s.totalPopulation[y]*100-s.urbanShare[y])<0.001);
  }
 }
});
test('claim truth and falsehood never overlap; omissions remain unknown',()=>{
 for(const file of ['data/climate-type-claims.json','data/religion-type-claims.json']){
  const d=read(file);assert.equal(d.policy.absenceMeansFalse,false);
  for(const c of d.claims){assert.ok(c.claim);assert.equal(new Set([...c.trueFor,...c.falseFor]).size,c.trueFor.length+c.falseFor.length,c.id);assert.match(c.source.blockId,/^L[12]-B\d{4}$/);assert.ok(c.source.column);}
 }
});
test('overlapping stilt houses, frozen soils, and pastoralism never become false distractors',()=>{
 const c=read('data/climate-type-claims.json').claims;
 for(const [s,yes] of [['고상 가옥',['Af','ET']],['토양 동결',['Dw','ET']],['유목',['BW','BS','ET']]]){
  const q=c.find(x=>x.claim.includes(s));assert.ok(q,s);for(const t of yes){assert.ok(q.trueFor.includes(t));assert.ok(!q.falseFor.includes(t));}
 }
});
test('each claim and its contrast retain available lecture evidence blocks',()=>{
 const b=new Map(read('data/round2-sources/lecture-evidence.json').blocks.map(x=>[x.id,x]));
 for(const fn of ['data/climate-type-claims.json','data/religion-type-claims.json'])for(const c of read(fn).claims){assert.ok(b.has(c.source.blockId));for(const r of c.sourceRefs||[])assert.ok(b.has(r.blockId),r.blockId);}
});
test('highland seasonal contrast does not universalise tropical highland conditions',()=>{
 const d=read('data/concepts/highlands.json');assert.equal(d.sets.seasonality.complete,false);
 assert.ok(d.statements.some(x=>x.truth===false&&x.claim.includes('모두')));
 assert.notDeepEqual(d.sets.seasonality.values['티베트 고원'],d.sets.seasonality.values['열대 고산']);
});
test('Iran has coal; the four reported-zero countries are independently labelled',()=>{
 const d=read('data/coal-production-status.json').countries;
 for(const n of ['사우디아라비아','카타르','이라크','쿠웨이트']){
  assert.equal(d[n].series['2024'].value,0);assert.equal(d[n].series['2024'].status,'reportedZero');
 }
 assert.ok(d['이란'].series['2024'].value>0);assert.equal(d['이란'].series['2024'].status,'reportedNonzero');
});
test('Chile lignite zero is not total coal zero; gem diamonds remain a separate commodity',()=>{
 const d=read('data/mineral-production-round2.json').minerals;
 const chile=d['칠레 석탄'].rows.filter(x=>x.year==='2024');
 assert.ok(chile.some(x=>x.subCommodity==='Lignite'&&x.value===0));assert.ok(chile.some(x=>x.subCommodity==='Bituminous'&&x.value>0));
 for(const iso of ['BWA','AGO','ZAF'])assert.ok(d['다이아몬드'].rows.some(x=>x.iso3===iso&&x.subCommodity===null&&x.year==='2024'),iso+' unclassified totals must not be relabelled Gem');
 assert.equal(read('data/mineral-production-round2.json').gemCoverage.status,'held');
 assert.ok(d['은'].rows.some(x=>x.iso3==='BOL'&&x.year==='2024'));
});
test('manufacturing has all 45 state-years and separate same-year measure denominators',()=>{
 const d=read('data/us-state-manufacturing-series.json');const seen=new Set();
 for(const x of d.rows){
  assert.ok(d.states[x.stateFips]);assert.ok([2012,2017,2022].includes(x.naicsVintage));
  if(x.naics==='31-33'){seen.add(x.stateFips+'|'+x.year);assert.ok(x.shipmentsThousandUSD>0);assert.ok(Math.abs(x.shareOfStateShipmentsPct-100)<1e-9);}
  if(x.source.GEO_ID)assert.match(x.source.GEO_ID,/^040/);
  if(['D','S','X','N'].includes(x.shipmentsFlag))assert.equal(x.shipmentsThousandUSD,null);
 }
 assert.equal(seen.size,45);
 for(const n of ['3361','3362','3363','3364'])assert.ok(d.rows.some(x=>x.naics===n),n);
});
test('five US state geometries and all nine named rivers preserve source geometry',()=>{
 assert.equal(read('data/us-state-boundaries.geojson').features.length,5);
 const f=read('data/river-mainstems.geojson').features;const names=new Set(f.map(x=>x.properties.appRiverName));assert.equal(names.size,9);
 assert.ok(f.every(x=>x.geometry&&x.geometry.coordinates.length));
 const river=read('data/river-mainstem-countries.json');assert.equal(river.rivers['메콩강'].mainstemCountries.length,6);assert.ok(river.rivers['라인강'].mainstemCountries.includes('리히텐슈타인'));assert.ok(!river.rivers['라인강'].mainstemCountries.includes('룩셈부르크'));
});
test('net migration reads UN regional series rather than similarly named OWID aggregates',()=>{
 const d=read('data/net-migration-un-regions.json');assert.equal(Object.keys(d.areas).length,6);
 for(const a of Object.values(d.areas)){assert.ok(a.sourceName.endsWith('(UN)'));assert.equal(Object.keys(a.series).length,74);assert.equal(typeof a.series['2020'],'number');}
});
test('printed exam values retain their own units, periods and old vintage',()=>{
 const forms=read('data/exam-given-round2.json').forms;
 const f=forms.find(x=>x.exam==='2024학년도 수능 14번');assert.equal(f.unit,'천 명');assert.equal(f.values['아시아'],-2092);assert.equal(f.values['유럽'],1436);assert.equal(f.fertilityChart.exactValues,null);
 const g=forms.find(x=>x.exam==='2026학년도 9월 15번');assert.equal(g.table.values['멕시코'],10853);assert.equal(g.table.values['세네갈'],61);assert.equal(g.table.unit,'천 명');assert.equal(g.pairedChart.unit,'‰');assert.equal(g.pairedChart.exactValues,null);
 const a=forms.find(x=>x.exam==='2026학년도 9월 11번');assert.equal(a.chart.exactValues,null);assert.deepEqual(a.originalDfatPeriods,['1949-50','1950-51']);
});
test('Nigeria reversal is a publication-vintage difference even at the same reference year',()=>{
 const d=read('data/nigeria-religion-vintages.json');assert.equal(d.recallEligible,false);assert.equal(d.vintages[0].referenceYear,d.vintages[1].referenceYear);assert.notEqual(d.vintages[0].largestReligion,d.vintages[1].largestReligion);assert.equal(d.vintages[0].values.hinduism,'<0.1');
});
test('landlocked complete list has 44 unique ISO identities; Caspian coasts and DRC are handled',()=>{
 const d=read('data/landlocked-countries.json');assert.equal(Object.keys(d.countries).length,44);assert.equal(new Set(Object.values(d.countries).map(x=>x.iso3)).size,44);
 for(const n of ['카자흐스탄','아제르바이잔','투르크메니스탄','스위스','볼리비아','바티칸'])assert.ok(d.countries[n],n);
 for(const n of ['이란','러시아','콩고 민주 공화국'])assert.equal(d.appValues[n].isLandlocked,false,n);
 assert.equal(d.appValues['카자흐스탄'].isLandlocked,true);assert.equal(d.appValues['타이완'].isLandlocked,null);assert.equal(d.appValues['새 미등록 대상'],undefined);
});
test('OPEC year-end membership keeps join/exit years and the Indonesia intrayear exception',()=>{
 const d=read('data/opec-membership-by-year.json');assert.equal(Object.keys(d.years).length,11);
 for(const [y,n] of [['2015',12],['2016',13],['2017',14],['2018',15],['2019',14],['2020',13],['2024',12],['2025',12]])assert.equal(d.years[y].count,n,y);
 assert.ok(d.withinYearException['2016']);assert.ok(d.years['2023'].members.includes('앙골라'));assert.ok(!d.years['2024'].members.includes('앙골라'));assert.ok(d.years['2025'].members.includes('콩고 공화국'));assert.ok(!d.years['2025'].members.includes('콩고 민주 공화국'));
});
test('GaWC tiers keep ties and vintage changes instead of inventing a total rank',()=>{
 const d=read('data/world-city-gawc.json');for(const y of ['2020','2022','2024']){
  const c=d.vintages[y].cities;assert.ok(Object.keys(c).length>300);assert.equal(c.London,'Alpha++');assert.equal(c['New York'],'Alpha++');assert.equal(c.Tokyo,'Alpha+');assert.ok(!c.Download);
 }
 assert.equal(d.vintages['2022'].cities.Sydney,'Alpha');assert.equal(d.vintages['2024'].cities.Sydney,'Alpha+');
});
test('complete climate graphs use one station and the documented 1991-2020 period',()=>{
 const d=read('data/climate-normals-round2.json');for(const s of Object.values(d.stations)){
  assert.deepEqual(s.period,[1991,2020]);assert.equal(s.monthlyMeanTemperatureC.length,12);assert.equal(s.monthlyPrecipitationMm.length,12);assert.ok(s.monthlyMeanTemperatureC.every(Number.isFinite));assert.ok(s.monthlyPrecipitationMm.every(Number.isFinite));assert.equal(s.periodSource,'jma-outline.html');
 }
 assert.equal(d.metadata['아디스아바바'].elevationM,2354);assert.equal(d.partialCandidates['다르에스살람-NOAA'].monthlyMeanTemperatureC,null);assert.equal(d.partialCandidates['아부자'].climateGraph,false);
});
test('round-two outputs regenerate offline from pinned source bytes',()=>{
 const r=cp.spawnSync('python3',['scripts/build-round2.py','--check'],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);
});
test('all delivered source snapshots match the manifest hashes and byte counts',()=>{
 const r=cp.spawnSync('python3',['scripts/verify-round2-sources.py'],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);
});
test('offline regeneration works without the original working-download directory',()=>{
 const temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'round2-portable-'));
 function link(rel){const src=path.join(root,rel),dst=path.join(temp,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});try{fs.linkSync(src,dst);}catch(e){if(e.code!=='EXDEV')throw e;fs.copyFileSync(src,dst);}}
 try{
  // Data at the repository root include the already-delivered baseline ZIPs.
  for(const n of fs.readdirSync(path.join(root,'data')))if(fs.statSync(path.join(root,'data',n)).isFile())link('data/'+n);
  link('scripts/build-round2.py');link('data/extension-sources/country-boundaries.js');link('data/concepts/highlands.json');
  for(const n of ['curation.json','lecture-evidence.json','country-curation.json','pew2012-nigeria-row.json'])link('data/round2-sources/'+n);
  assert.equal(fs.readdirSync(path.join(temp,'data/round2-sources')).length,4);
  const r=cp.spawnSync('python3',['scripts/build-round2.py','--check'],{cwd:temp,encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
