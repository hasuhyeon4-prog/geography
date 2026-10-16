const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const R=require('../assets/rankings.js');
const P=require('../assets/ranking-policy.js');
const C=require('../assets/classification-sets.js');
const S=require('../assets/country-boundaries.js');
const G=require('../assets/location-grading.js');
const F=require('../assets/fact-statements.js');
const get=id=>R.rankings.find(r=>r.id===id);
const row=(r,n)=>r.items.find(x=>x.name===n);

test('a fixed-year population answer cannot reverse India and China because their figures are close',()=>{
 const r=get('country-pop'),options=['인도','중국'];
 assert.equal(P.allowed(r,row(r,'인도'),row(r,'중국'),false),true);
 assert.equal(P.orderCorrect(r,options,['인도','중국']),true);
 assert.equal(P.orderCorrect(r,options,['중국','인도']),false);
 assert.equal(P.orderCorrect(r,options,['인도','인도']),false);
 assert.equal(P.orderCorrect(r,options,[]),false);
});
test('only identical displayed values can be interchanged, including negative numbers',()=>{
 const r={digits:1,items:[{name:'A',value:1.04},{name:'B',value:1.02},{name:'C',value:-2}]};
 assert.equal(P.orderCorrect(r,['A','B','C'],['B','A','C']),true);
 assert.equal(P.orderCorrect(r,['A','B','C'],['A','C','B']),false);
 assert.equal(P.allowed(r,r.items[0],r.items[1],true),false);
});
test('documented reversals are excluded from basic questions and remain strictly graded in dated practice',()=>{
 for(const r of R.rankings)for(const [a,b] of r.audit.unstablePairs){
  const x=row(r,a),y=row(r,b);if(!x||!y)continue;
  assert.equal(P.allowed(r,x,y,false),false,r.id);
  if(!P.equal(r,x,y))assert.equal(P.allowed(r,x,y,true),true,r.id);
 }
 for(const id of ['primary-mix','cont-gdp','cont-gdppc','wheat-export','grain-trade']){
  assert.equal(P.canQuiz(get(id),false),false,id);
  assert.equal(P.canQuiz(get(id),true),true,id);
 }
});
function questionFunctions(){
 const html=fs.readFileSync(require.resolve('../rankings.html'),'utf8');
 const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
 function source(name){
  const start=script.indexOf('function '+name+'(');assert.ok(start>=0,name);
  const firstEnd=script.indexOf('\n',start);
  return script.slice(start,script.slice(start,firstEnd).endsWith('}')?firstEnd:script.indexOf('\n}',start)+2);
 }
 const c={P,state:{explicit:false},Math};vm.createContext(c);
 vm.runInContext(['shuffle','pick','head','pairQ','extremeQ','orderQ'].map(source).join('\n'),c);return c;
}
test('the actual question generators respect the exclusion policy',()=>{
 const c=questionFunctions();
 for(const r of R.rankings.filter(r=>P.canQuiz(r,false)))for(let i=0;i<5;i++){
  for(const fn of ['pairQ','extremeQ','orderQ']){
   const q=c[fn](r);if(!q)continue;
   if(q.type==='order'){for(const a of q.options)for(const b of q.options)if(a!==b)assert.ok(!P.unstable(r,row(r,a),row(r,b)),r.id)}
   else if(q.type==='pair'){assert.ok(P.allowed(r,row(r,q.options[0]),row(r,q.options[1]),false),r.id)}
   else{for(const n of q.options)if(n!==q.answer[0])assert.ok(P.allowed(r,row(r,q.answer[0]),row(r,n),false),r.id)}
  }
 }
});
test('French Guiana uses its American polygon for display, regional pools and hit testing',()=>{
 const s=C.byId.latinLanguage,p=C.polygonsFor(s,'프랑스',S.byName['프랑스']);
 assert.ok(p.length);
 assert.ok(C.assignPool(s,'americas').includes('프랑스'));
 assert.ok(!C.assignPool(s,'europe').includes('프랑스'));
 assert.ok(G.inPolygons({lon:-53,lat:4},p));
 assert.ok(!G.inPolygons({lon:2.35,lat:48.85},p));
 assert.ok(G.inPolygons({lon:2.35,lat:48.85},C.polygonsFor(C.byId.bloc,'프랑스',S.byName['프랑스'])));
});
test('surface-area totals no longer propagate the Canadian coastal-water figure',()=>{
 const c=get('country-area');assert.ok(Math.abs(row(c,'캐나다').value-9.98467)<1e-8);
 assert.ok(row(get('bloc-area'),'USMCA').value>21.7&&row(get('bloc-area'),'USMCA').value<21.9);
 assert.ok(row(get('cont-area'),'유럽').value>row(get('cont-area'),'앵글로아메리카').value);
});
test('religion classifications use a single dated source rather than arbitrary mixed exclusions',()=>{
 const a=require('../audit/religion-2020.json');
 for(const [n,id] of Object.entries(C.byId.religion.values)){
  const d=a.countries[n];assert.ok(d,n);assert.equal(d.year,'2020');
  assert.equal(id,Object.keys(d.values).sort((x,y)=>d.values[y]-d.values[x])[0],n);
  assert.ok(d.values[id]>d.otherReligions,n);
 }
 assert.equal(C.byId.religion.values['보스니아 헤르체고비나'],'islam');
 assert.equal(C.byId.religion.values['대한민국'],'christianity');
 assert.ok(!/과반이 아니/.test(C.byId.islam.mixed['보스니아 헤르체고비나']));
});
test('omitted climate anchors and question-time reference periods are included',()=>{
 const v=C.byId.climateCities.values;
 for(const [n,id] of Object.entries({'리마':'bw','브라질리아':'aw','아디스아바바':'h','시안':'cw','모스크바':'df','로스앤젤레스':'cs'}))assert.equal(v[n],id,n);
 for(const s of C.sets)assert.ok(s.period,s.id);
 assert.match(F.items.find(x=>x.id==='p17').claim,/미국 내/);
 assert.match(F.items.find(x=>x.id==='c15').claim,/0℃ 이상 10℃ 미만/);
 assert.match(F.items.find(x=>x.id==='e18').period,/2021년/);
 for(const r of R.rankings)assert.ok(r.audit.checkedAt&&r.audit.sourceUrls.length,r.id);
});
