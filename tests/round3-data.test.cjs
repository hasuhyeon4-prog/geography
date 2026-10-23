'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const aies=()=>read('data/us-state-manufacturing-aies-2023-2024.json');
const bea=()=>read('data/us-state-manufacturing-bea-value-added.json');
function py(script,args=[]){const r=cp.spawnSync('python3',[script,...args],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);return r;}
test('AIES covers five whole states in 2023/24, with unique state-year-industry keys',()=>{
 const r=aies().rows;assert.equal(r.length,260);assert.equal(new Set(r.map(x=>[x.stateFips,x.year,x.naics].join('/'))).size,r.length);
 assert.equal(new Set(r.map(x=>x.stateFips+'/'+x.year)).size,10);
 for(const x of r){assert.equal(x.naicsVintage,2017);assert.equal(x.source.GEO_ID,'0400000US'+x.stateFips);assert.ok([2023,2024].includes(x.year));}
});
test('AIES flags preserve hidden values; Washington and California 3361 remain missing',()=>{
 for(const x of aies().rows){if(x.shipmentsFlag)assert.equal(x.shipmentsThousandUSD,null);if(x.valueAddedFlag)assert.equal(x.valueAddedThousandUSD,null);}
 for(const f of ['06','53'])for(const y of [2023,2024]){const r=aies().rows.find(x=>x.stateFips===f&&x.year===y&&x.naics==='3361');assert.equal(r.shipmentsFlag,'D');assert.equal(r.shipmentsThousandUSD,null);assert.equal(r.shareOfStateShipmentsPct,null);}
});
test('Every AIES share uses the same state, year and measure denominator',()=>{
 const r=aies().rows;
 for(const x of r){const d=r.find(q=>q.stateFips===x.stateFips&&q.year===x.year&&q.naics==='31-33');for(const [v,s] of [['shipmentsThousandUSD','shareOfStateShipmentsPct'],['valueAddedThousandUSD','shareOfStateValueAddedPct']]){assert.equal(x[s],x[v]===null||d[v]===null?null:x[v]/d[v]*100);}}
});
test('BEA has 13 years of manufacturing value added, retaining table classification and units',()=>{
 const d=bea();assert.equal(d.rows.length,1300);assert.equal(d.unit,'million current USD');assert.equal(new Set(d.rows.map(x=>[x.stateFips,x.year,x.lineCode].join('/'))).size,1300);
 for(const x of d.rows){assert.ok(x.classificationAsPublished);assert.ok(x.year>=2013&&x.year<=2025);assert.ok(x.valueAddedMillionUSD===null||Number.isFinite(x.valueAddedMillionUSD));}
 assert.equal(d.policy.exam2027Q5SourceConfirmed,false);assert.equal(d.policy.motorVehiclesLineCode,21);assert.equal(d.policy.otherTransportLineCode,22);
});
test('Mutually exclusive BEA leaf industries sum to manufacturing within published rounding',()=>{
 const d=bea();for(const f of Object.keys(d.states))for(let y=2013;y<=2025;y++){
  const r=d.rows.filter(x=>x.stateFips===f&&x.year===y),den=r.find(x=>x.lineCode===12);assert.equal(r.length,20);
  assert.ok(r.every(x=>x.valueAddedMillionUSD!==null));const sum=r.filter(x=>x.lineCode!==12).reduce((a,x)=>a+x.valueAddedMillionUSD,0);
  assert.ok(Math.abs(sum-den.valueAddedMillionUSD)<2,[f,y,sum,den.valueAddedMillionUSD]);
 }
});
test('Later 2016 ASM table still suppresses Washington aerospace 2014/15 shipments',()=>{
 const d=read('data/us-manufacturing-gap-review.json');for(const y of [2014,2015]){const r=d.suppressionIn2016Release.find(x=>x.stateFips==='53'&&x.naics==='3364'&&x.year===y);assert.equal(r.rawShipments,'0');assert.equal(r.shipmentsFlag,'D');assert.equal(r.shipmentsThousandUSD,null);}
 const r=d.suppressionIn2016Release.find(x=>x.stateFips==='53'&&x.naics==='3364'&&x.year===2015);assert.ok(r.valueAddedThousandUSD>0);assert.equal(r.shipmentsThousandUSD,null);
});
test('Aerospace direction review has nine observed years without inventing Ohio comparisons',()=>{
 const d=read('data/us-manufacturing-gap-review.json');assert.deepEqual(d.aerospaceDirectionChecks.map(x=>x.lower).sort(),['미시간','캘리포니아','텍사스'].sort());for(const c of d.aerospaceDirectionChecks){assert.equal(c.completeYears,9);assert.equal(c.allGreater,true);assert.deepEqual(c.years.map(x=>x.year),[2016,2017,2018,2019,2020,2021,2022,2023,2024]);assert.ok(c.years.every(x=>x.WashingtonSharePct>x.otherSharePct));}
 assert.equal(d.ohioJointExamEvidence.status,'notEstablished');
});
test('Exam figures have aliases but no invented precise percentages or totals',()=>{
 const f=read('data/exam-given-round3.json').forms;assert.equal(f.length,2);assert.equal(f[0].exactValues,null);assert.equal(f[0].totals,null);assert.equal(f[0].sourceAttributionInQuestion,null);assert.equal(f[0].aliases['(다)'],'워싱턴주');assert.equal(f[0].columns.length,6);assert.equal(f[1].exactValues,null);assert.equal(f[1].correctPoint,'D');
 assert.equal(read('data/us-manufacturing-gap-review.json').exam2027Q5.originalMeasureConfirmed,false);
});
test('City/state cards distinguish Chicago/Illinois and Detroit/Michigan; preserve app coordinates',()=>{
 const d=read('data/concepts/us-city-states.json');assert.equal(Object.keys(d.entities).length,8);assert.deepEqual(d.sets.state.values['시카고'],['일리노이']);assert.deepEqual(d.sets.state.values['디트로이트'],['미시간']);assert.deepEqual(d.sets.state.values['시애틀'],['워싱턴주']);assert.deepEqual(d.entities['실리콘 밸리'].place,[-122,37.38]);for(const [n,e] of Object.entries(d.entities)){assert.equal(e.place.length,2);assert.ok(e.source);assert.ok(e.sourceRefs.length);assert.equal(d.sets.state.values[n].length,1);}
});
test('Toronto clue is verbatim from L1-B1673 with the city name masked in the clue',()=>{
 const d=read('data/toronto-clues-round3.json');assert.equal(d.source.blockId,'L1-B1673');assert.match(d.verbatim,/토론토는/);assert.doesNotMatch(d.clueWithoutName,/토론토/);assert.match(d.clueWithoutName,/캐나다.*온타리오호/);assert.deepEqual(d.place,[-79.3832,43.6532]);
});
test('World city directions apply to tier averages, without mapping GaWC grades onto them',()=>{
 const d=read('data/concepts/world-city-hierarchy.json');assert.deepEqual(d.sets.nearestSameTierDistance.values['하위 세계 도시'],['가까움']);assert.deepEqual(d.sets.headquarters.values['최상위 세계 도시'],['많음']);assert.deepEqual(d.sets.producerServicesShare.values['하위 세계 도시'],['낮음']);assert.equal(d.examGiven.type,'qualitative tier-average comparison, not numerical city ranking table');assert.equal(Object.keys(d.entities).length,2);
});
test('Abuja raw XLSX January anomaly is retained while the usable mean is null',()=>{
 const a=read('data/climate-quality-review-round3.json').Abuja;assert.equal(a.publishedMeanC.length,12);assert.equal(a.publishedMeanC[0],a.publishedMeanDailyMaximumC[0]);assert.ok(a.publishedMeanC[0]-a.publishedMeanDailyMinimumC[0]>15);assert.equal(a.approvedMeanC[0],null);assert.equal(a.approvedForCompleteClimateGraph,false);assert.equal(a.approvedMeanC.filter(x=>x!==null).length,11);
});
test('New river lists separate named mainstems, border reaches, basin ambiguity and held rivers',()=>{
 const d=read('data/river-mainstem-countries-round3.json');assert.equal(d.rivers.length,5);const g=d.rivers.find(x=>x.name==='갠지스강');assert.deepEqual(g.countries,['인도','방글라데시']);assert.ok(!g.countries.includes('네팔'));const z=d.rivers.find(x=>x.name==='잠베지강');assert.equal(z.countries.length,6);assert.ok(z.countries.includes('보츠와나'));assert.ok(!z.countries.includes('말라위'));assert.equal(d.policy.absenceMeansFalse,false);assert.equal(d.policy.recallEligible,false);assert.deepEqual(d.held.map(x=>x.name),['콩고강','나일강']);
});
test('All source snapshots match pinned hashes and sizes',()=>{py('scripts/verify-round3-sources.py');});
test('Round-three outputs regenerate byte for byte',()=>{py('scripts/build-round3.py',['--check']);});
test('Regeneration needs only the archive and the pinned earlier normalized state input',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'geo-r3-'));try{
  const copy=n=>{const dest=path.join(temp,n);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,n),dest);};
  for(const n of ['scripts/build-round3.py','data/round3-source-snapshots.zip','data/us-state-manufacturing-series.json'])copy(n);
  const r=cp.spawnSync('python3',['scripts/build-round3.py'],{cwd:temp,encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);
  for(const n of ['us-state-manufacturing-aies-2023-2024.json','us-state-manufacturing-bea-value-added.json','concepts/us-city-states.json','toronto-clues-round3.json','concepts/world-city-hierarchy.json','exam-given-round3.json','us-manufacturing-gap-review.json','climate-quality-review-round3.json','river-mainstem-countries-round3.json'])assert.equal(fs.readFileSync(path.join(temp,'data',n),'utf8'),fs.readFileSync(path.join(root,'data',n),'utf8'),n);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
