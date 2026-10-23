'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
// The lecture full text is kept out of the public repository (2026-10-22, docs/DATA-REQUESTS.md).
// Checks against it run where the bundle's lecture-blocks.json is placed at the same path.
const haveLecture=fs.existsSync(path.join(ROOT,'data/extension-sources/lecture-blocks.json'));
const blocks=haveLecture?Object.fromEntries(read('data/extension-sources/lecture-blocks.json').map(b=>[b.id,b])):{};
const needsLecture=haveLecture?{}:{skip:'강의 원문(lecture-blocks.json)은 공개 저장소에 두지 않음'};
const concepts=fs.readdirSync(path.join(ROOT,'data/concepts')).filter(n=>n.endsWith('.json')).map(n=>[n,read('data/concepts/'+n)]);

test('all delivered lecture property values equal their exact source table cells',needsLecture,()=>{
  for(const [file,d] of concepts)for(const s of Object.values(d.sets||{})){
    if(s.complete===true){
      assert.ok(s.completeScope,file+' complete sets require an explicit finite scope');
      assert.deepEqual(Object.keys(s.values).sort(),Object.keys(d.entities).sort(),file+' complete scope must cover every named entity');
    }else assert.equal(s.complete,false,file+' does not permit inference from omissions');
    for(const [entity,evs] of Object.entries(s.evidence||{}))for(const ev of evs){
      const r=ev.source,b=blocks[r.blockId];assert.ok(b?.rows,file+' '+r.blockId);
      assert.equal(ev.value,b.rows[r.tableRow-1][r.tableColumn-1],file+' '+entity);
      assert.ok(s.values[entity].includes(ev.value));
    }
  }
});
test('source passages and country clues remain verbatim source text',needsLecture,()=>{
  for(const [,d] of concepts)for(const s of d.statements||[])if(s.practice==='sourceReading'){
    assert.equal(s.claim,blocks[s.source.blockId].text);
  }
  for(const rows of Object.values(read('data/country-clues.json').countries))for(const r of rows){
    assert.ok(blocks[r.source.blockId].text.includes(r.text));
    if(r.eligibleIdentification){assert.equal(typeof r.prompt,'string');assert.ok(r.prompt.includes('이 국가'));}
  }
});
test('source-country facts have individual evidence and never mark omissions false',()=>{
  const f=read('data/entity-facts.json').facts;
  for(const s of Object.values(f))assert.notEqual(s.complete,true);
  assert.ok(f.rivers.values['라오스'].includes('메콩강'));
  assert.ok(f.languages.values['브라질'].includes('포르투갈어'));
  assert.ok(f.landlocked.values['볼리비아'].includes('내륙국'));
  assert.ok(!f.landlocked.values['콩고 민주 공화국']);
});
test('every supplied coordinate is an exact existing app point with its identity',()=>{
  const loc=read('data/extension-sources/location-items.json');
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const embedded=id=>JSON.parse(html.match(new RegExp('<script id="'+id+'"[^>]*>([\\s\\S]*?)</script>'))[1]);
  const current=new Map(embedded('auditData').map(x=>[x.id,x]));
  for(const x of embedded('contentData').items)current.set(x.id,x);
  const overrides=embedded('geometryData').items;
  for(const [,d] of concepts)for(const [name,e] of Object.entries(d.entities||{})){
    if(e.place==null)continue;
    assert.equal(e.place.length,2);assert.ok(e.placeSource,name);
    if(e.placeSource.file==='index.html'){
      const p=current.get(e.placeSource.id);assert.ok(p,name);
      const g=overrides[p.id]||p.geometry;assert.deepEqual(e.place,[g.lon,g.lat]);
    }else{
      const p=loc.find(x=>x.id===e.placeSource.id);assert.ok(p,name);
      assert.deepEqual(e.place,[p.geometry.lon,p.geometry.lat]);
    }
  }
});
test('all 19 requested countries have actual lecture evidence; absent eligibility stays visible',()=>{
  const c=read('data/country-clues.json');
  for(const [name,s] of Object.entries(c.requestedCountryCoverage)){
    assert.ok(s.evidencePassages>0,name);assert.ok(c.countries[name].length>=s.evidencePassages);
  }
});
test('climate family and required landform types are present and distinct',()=>{
  const c=read('data/concepts/climate.json').entities;
  for(const x of ['Af','Am','Aw','BW','BS','Cfa','Cfb','Cs','Cw','Df','Dw','ET','EF','H'])assert.ok(c[x],x);
  const l=read('data/concepts/landforms.json').entities;
  for(const x of ['돌리네','우발라','탑 카르스트','권곡','호른','U자곡','모레인','에스커','드럼린','메사','뷰트','와디','플라야','선상지','바하다','사구','리아스','사주','석호','삼각주','해식애','칼데라','순상 화산','용암 대지'])assert.ok(l[x],x);
});
test('old maps and treaty identity use actual names, not adoption years as entity names',()=>{
  const m=read('data/concepts/oldmaps.json').entities;
  for(const x of ['바빌로니아 점토판 지도','프톨레마이오스 지도','T-O 지도','알 이드리시 지도','혼일강리역대국도지도','대명 혼일도','곤여만국전도','지구전후도','천하도'])assert.ok(m[x],x);
  const e=read('data/concepts/environment.json').entities;
  for(const x of ['람사르 협약','몬트리올 의정서','바젤 협약','런던 협약','교토 의정서','파리 협정','유엔 사막화 방지 협약'])assert.ok(e[x],x);
  assert.ok(!e['1971']);
  const cbd=read('data/concepts/environment-supplement.json').entities['생물 다양성 협약'].source;
  assert.equal(cbd.adoptionCity,'나이로비');assert.equal(cbd.signatureCity,'리우데자네이루');
});
test('R9 OX additions preserve all pre-existing question IDs and data byte-for-byte as JSON',()=>{
  const before=read('data/extension-sources/existing-ox.json');
  const after=require(path.join(ROOT,'assets/fact-statements.js'));
  for(const x of before.items)assert.deepEqual(after.items.find(y=>y.id===x.id),x);
  const ids=after.items.map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
  assert.ok(after.items.some(x=>x.topic==='oldmaps'&&!x.answer));
  assert.ok(after.items.some(x=>x.topic==='geographic-information'&&!x.answer));
});
test('urban and rural population sums reconcile to UN totals with original rounding',()=>{
  const d=read('data/urbanization-change.json');
  for(const [name,a] of Object.entries(d.areas))for(const [y,total] of Object.entries(a.series.totalPopulation||{})){
    const u=a.series.urbanPopulation[y],r=a.series.ruralPopulation[y],s=a.series.urbanShare[y];
    assert.ok(Math.abs(u+r-total)<=1.1,name+' '+y+' totals');
    if(total>0)assert.ok(Math.abs(s-u/total*100)<0.00011,name+' '+y+' share');
  }
  assert.equal(d.years[0],1950);assert.equal(d.years[1],2050);
  assert.match(d.definition,/national/);assert.match(d.projection,/전망/);
});
test('fertility UN regions retain official grouping instead of a mean of country TFRs',()=>{
  const d=read('data/fertility-un-regions.json');
  for(const name of ['아프리카','아시아','유럽','라틴 아메리카','앵글로아메리카','오세아니아']){
    const r=d.areas[name];assert.ok(r,name);assert.match(r.sourceName,/\(UN\)/);assert.ok(r.series['2023']>0);
  }
});
test('IRENA geothermal anchors, units and original missing observations survive parsing',()=>{
  const d=read('data/geothermal-generation.json');assert.equal(d.unit,'GWh');
  const expect={'세계':98159,'미국':19500,'인도네시아':16936,'필리핀':10730,'뉴질랜드':8224,'아이슬란드':6006,'케냐':6086};
  for(const [name,v] of Object.entries(expect))assert.equal(d.areas[name].generationGWh['2023'],v,name);
  assert.equal(d.areas.Ethiopia.generationGWh['2023'],undefined);
  assert.equal(d.areas.Ethiopia.generationGWh['2022'],29);
  assert.equal(d.areas['튀르키예'].flags['2022'],'o');
});
test('migrant stocks reconcile by sex without becoming annual flows',()=>{
  const d=read('data/us-migrants-by-origin.json');assert.equal(d.destination.M49,840);
  assert.match(d.definition,/stock/);
  for(const [name,r] of Object.entries(d.countries))for(const [y,total] of Object.entries(r.bothSexes)){
    assert.ok(total>=0,name);assert.equal(r.male[y]+r.female[y],total,name+' '+y);
  }
  assert.ok(d.countries['멕시코'].bothSexes['2024']>1e6);
  const old=read('data/us-migrants-lecture-given.json');assert.equal(old.data['세네갈'],61000);assert.equal(old.year,'2020');
});
test('religion percentages and population always share a source year, with all seven groups',()=>{
  const d=read('data/religion-composition-extension.json');
  assert.equal(d.populationUnit,'명');assert.ok(d.countries['포르투갈']);
  for(const [name,c] of Object.entries(d.countries))for(const [y,mix] of Object.entries(c.series)){
    assert.equal(Object.keys(mix).length,7);assert.ok(c.populationSeries[y]>0);
    assert.ok(Math.abs(Object.values(mix).reduce((a,b)=>a+b,0)-100)<0.0001,name+' '+y);
  }
});
test('mineral shares keep ore/metal-content units and their original row IDs',()=>{
  const raw=read('data/mineral-production.json');const share=read('data/mineral-production-shares.json');
  for(const [mineral,groups] of Object.entries(share.minerals)){
    const byId=new Map(raw.minerals[mineral].rows.map(r=>[r.id,r]));
    for(const g of groups){let sum=0;const keys=new Set();
      for(const r of g.countries){const orig=byId.get(r.sourceRowId);assert.ok(orig);assert.equal(orig.value,r.value);assert.equal(orig.unit,g.unit);assert.equal(orig.subCommodity,g.subCommodity);
        assert.ok(!keys.has(orig.iso3+'|'+orig.sourceName),mineral+' duplicate country in denominator');keys.add(orig.iso3+'|'+orig.sourceName);sum+=r.shareOfReportedTotalPct;
      }
      assert.ok(Math.abs(sum-100)<1e-7,mineral+' '+g.year);
    }
  }
});
test('EIA trade and reserves retain stock/flow definitions and physical units',()=>{
  const d=read('data/fossil-trade-reserves.json');
  for(const [key,ds] of Object.entries(d.datasets))for(const r of ds.rows){
    assert.match(r.period,/^20\d\d$/);assert.ok(['c','r'].includes(r.countryRegionTypeId));
    assert.equal(r.activityId,key.endsWith('exports')?'4':key.endsWith('reserves')?'6':'1');
    assert.notEqual(r.unit,'TWh');
  }
});
test('energy recall candidates require eight unanimous years and do not turn pair orders into top ranks',()=>{
  const s=read('data/energy-series.json').countries;
  for(const r of read('audit/energy-validation-20261022.json').candidates){
    const failed=r.years.filter(y=>!(s[r.country].series[r.hi][y]>s[r.country].series[r.lo][y]));assert.deepEqual(failed,r.failedYears);
    assert.equal(r.status==='active',r.years.length>=8&&failed.length===0);
  }
  const audit=read('audit/energy-validation-20261022.json');
  for(const r of audit.topOrders){
    const failures=[];
    for(const [y,rank] of Object.entries(r.annualRanks)){
      const actual=[...rank].sort((a,b)=>s[r.country].series[b+'_share_energy'][y]-s[r.country].series[a+'_share_energy'][y]||a.localeCompare(b));
      assert.deepEqual(actual,rank);
      if(JSON.stringify(rank.slice(0,r.expected.length))!==JSON.stringify(r.expected))failures.push(y);
    }
    assert.deepEqual(failures,r.failedYears);
    assert.equal(r.status==='active',r.years.length>=8&&!failures.length);
  }
  const allowed=read('data/exam-relations-energy.json').orders;
  assert.equal(allowed.length,6);assert.ok(!allowed.some(x=>x.orders['프랑스']));
  assert.ok(audit.topOrders.find(x=>x.country==='프랑스').failedYears.includes('2022'));
});
test('new climate source cannot manufacture missing means or unblock known suspect values',()=>{
  const d=read('data/climate-normals-extension.json');const s=d.sites.find(x=>x.name==='싱가포르'),i=d.sites.find(x=>x.name==='이키토스');
  assert.ok(s.usage.climateGraph);assert.equal(s.temperatureC[0],26.8);assert.equal(s.precipitationMm[11],332.1);
  assert.ok(i.temperatureC.every(x=>x===null));assert.ok(!i.usage.climateGraph);assert.ok(i.usage.precipitationReading);
  assert.equal(d.reviewedHolds.find(x=>x.name==='키토').status,'partial');
  const q=d.sites.find(x=>x.name==='키토');assert.equal(q.temperatureC.length,12);
  assert.deepEqual(q.temperatureC,[15,15,14.9,15,15.2,15.4,15.4,15.7,15.7,15.1,14.8,14.9]);
  assert.ok(q.precipitationMm.every(x=>x===null));assert.ok(!q.usage.climateGraph);
  assert.equal(d.reviewedHolds.find(x=>x.name==='아부자').status,'hold');
});
test('all outputs reproduce deterministically from shipped inputs without a network call',needsLecture,()=>{
  for(const script of ['build-extensions.py','build-statistics.py','build-completions.py'])
    cp.execFileSync('python3',[path.join(ROOT,'scripts',script),'--check'],{cwd:ROOT,stdio:'pipe'});
});

test('country comparisons use the stated indicator in eight or more common years',()=>{
 const d=read('data/energy-series.json').countries,a=read('audit/energy-validation-20261022.json');
 for(const r of a.countryComparisons){assert.ok(r.years.length>=8);
  const failures=r.years.filter(y=>d[r.hi].series[r.indicator][y]<=d[r.lo].series[r.indicator][y]);
  assert.deepEqual(failures,r.failedYears);assert.equal(r.status==='active',!failures.length);
 }
});
test('reserves preserve actual 2020 endpoint, source regions, stock units and same-year world denominator',()=>{
 const d=read('data/fossil-reserves-ei.json').datasets;
 assert.equal(d.oil.unit,'billion barrels');assert.equal(d.gas.unit,'trillion cubic metres');
 assert.equal(d.oil.areas['Canada'].series['2020'],168.087610819228);
 assert.equal(d.oil.areas['Venezuela: Orinoco Belt'].category,'subset');
 assert.equal(d.oil.areas['Canadian Oil Sands: Total'].isAggregate,true);
 assert.equal(d.oil.areas['Canada'].name,'캐나다');
 for(const ds of Object.values(d)){
  const world=ds.areas['Total World'].series;assert.ok(ds.areas['Total CIS']);
  for(const e of Object.values(ds.areas))for(const [y,v] of Object.entries(e.series)){
   assert.ok(+y>=2013&&+y<=2020);assert.equal(e.shareOfWorldPct[y],v/world[y]*100);
  }
 }
});
test('post-2020 oil trade separates crude/products and original workbook vintages',()=>{
 const d=read('data/oil-trade-ei.json');assert.equal(d.unit,'million tonnes');
 assert.equal(d.rows.length,44);const identities=new Set();
 const years=new Set();for(const r of d.rows)for(const [y,v] of Object.entries(r.series)){
  assert.equal(r.unit,'million tonnes');assert.ok(r.sourceRow<28,'exclude second table in thousand barrels daily');
  const id=r.snapshot+'|'+r.sourceName+'|'+y;assert.ok(!identities.has(id));identities.add(id);
  years.add(y);assert.equal(r.snapshot,+y<=2022?'ei2023.xlsx':'ei2025.xlsx');
  assert.deepEqual(Object.keys(v),['crudeImports','productImports','crudeExports','productExports']);
 }
 assert.deepEqual([...years].sort(),['2021','2022','2023','2024']);
 const c=d.rows.find(x=>x.sourceName==='Canada'&&x.snapshot==='ei2025.xlsx');
 assert.equal(c.series['2024'].crudeExports,219.35359411910494);
 assert.notEqual(c.series['2024'].crudeExports,c.series['2024'].productExports);
});
test('2013 ASM source matches all three lecture totals and uses shipments, not GDP',()=>{
 const d=read('data/us-state-manufacturing-2013.json');assert.equal(d.year,2013);
 for(const [name,expected] of Object.entries({California:524493882,Ohio:320149723,Texas:731707956})){
  const s=d.states[name];assert.equal(s.total.shipmentsThousandUSD,expected);
  assert.equal(Object.keys(s.industries).length,21);
  let sum=0;for(const [code,i] of Object.entries(s.industries)){
   assert.match(code,/^\d{3}$/);assert.equal(i.sharePct,i.shipmentsThousandUSD/expected*100);sum+=i.sharePct;
  }
  assert.ok(Math.abs(sum-100)<0.001,name);
 }
});
test('Australian trade keeps goods/fiscal/calendar distinctions and suppressed values',()=>{
 const d=read('data/australia-trade-change.json');
 for(const typ of ['Exports','Imports']){
  const hist=d.historical.datasets[typ],cur=d.calendar.datasets[typ];
  assert.ok(hist.economies['United Kingdom'].series['1950-51']>0);
  assert.equal(hist.economies['United Kingdom'].series['1950'],undefined);
  assert.equal(hist.unitByPeriod['1950-51'],"A$'000");
  const total=cur['Total (By BOP)'].series['2020'];assert.ok(total>0);
  assert.ok(cur.China.sharePct['2020']>cur.Japan.sharePct['2020']);
  assert.ok(cur.Japan.sharePct['2020']>cur['United Kingdom'].sharePct['2020']);
  for(const e of Object.values(cur))for(const y of Object.keys(e.flags||{}))assert.equal(e.series[y],null);
 }
 const e=d.calendar.datasets.Exports;
 assert.ok(e.Japan.sourceCacheRows['2020'].length>1,'duplicate cache records handled as publisher pivot sums');
 assert.ok(Math.abs(e.Japan.series['2020']-44926.664837)<1e-6);
});
test('all 19 countries have usable scoped identification, with historical Angola requiring its given table',()=>{
 const d=read('data/country-clues.json');
 for(const [n,c] of Object.entries(d.requestedCountryCoverage))assert.ok(c.eligibleIdentification>0,n);
 const a=d.countries['앙골라'].find(x=>x.id.includes('curated'));
 assert.equal(a.practice,'suppliedData');assert.equal(a.requiresGiven,true);assert.equal(a.given.year,2023);
 assert.deepEqual(a.candidatePool,['앙골라','브라질','독일']);
 const l=d.countries['라오스'].find(x=>x.id.includes('curated'));assert.equal(l.requiresGiven,false);assert.ok(l.prompt.includes('비엔티안'));
 const f=read('data/entity-facts.json').facts;
 assert.equal(Object.keys(f.opec.values).length,12);assert.equal(f.opec.source.publicationYear,2025);
 assert.ok(f.opec.values['콩고 공화국']);assert.ok(!f.opec.values['앙골라']);
 assert.equal(f.ethnicity.practice,'suppliedData');assert.deepEqual(f.ethnicity.values['파라과이'],['메스티소']);
});
test('linked sacred cities and conflict geometry preserve exact original locations',()=>{
 const loc=read('data/extension-sources/location-items.json');
 for(const [,d] of concepts)for(const e of Object.values(d.entities||{}))for(const x of e.linkedLocations||[]){
  const old=loc.find(y=>y.id===x.id);assert.ok(old);assert.deepEqual(x.geometry,old.geometry);
 }
 const r=read('data/concepts/religion-places.json').entities;
 assert.deepEqual(r['메카·메디나'].linkedLocations.map(x=>x.name),['메카','메디나']);
 const c=read('data/concepts/conflicts.json').entities;
 assert.equal(c['카탈루냐'].linkedLocations[0].geometry.type,'box');
});
test('new world-city relationship and supplementary languages retain their evidence limits',()=>{
 const d=read('data/exam-relations-cities.json');
 assert.deepEqual(d.relations[0].pairs,[['뉴욕','토론토']]);assert.equal(d.given[0].year,2025);assert.equal(d.given[0].practice,'suppliedData');
 const s=read('data/entity-facts-supplement.json');assert.equal(s.practice,'suppliedData');
 assert.ok(s.facts.find(x=>x.country==='케냐').values.includes('스와힐리어'));
 assert.ok(s.facts.every(x=>x.source.recallEligible===false));
});
