'use strict';
// 2026-11-05: the learner judged a low coastal place as 고산 because a plateau was nearby (브라질 북동부 해안,
// 브라질 고원 = H). These checks keep the OX pairs and the 기출형 explanations tied to the station data.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('../assets/fact-practice'),L=require('../assets/fact-level');
const E=require('../assets/exam-engine.js'),K=require('../assets/entity-kb.js'),T=require('../assets/exam-themes.js');
const goal=require('../assets/lecture-goal-facts.js');
const pairs=fs.readFileSync(path.join(__dirname,'..','data','climate-trap-ox.tsv'),'utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>l.split('|'));

test('every climate-trap pair is an OX item shown in the default range',()=>{
 const all=['fact-statements','lecture-goal-facts','table-facts'].flatMap(x=>require('../assets/'+x).items),p=P.create(all),dropped=new Set(L.dropped);
 assert.equal(pairs.length,12);
 for(const [,yes,no] of pairs){
  const o=goal.items.find(q=>q.answer&&q.claim===yes),x=goal.items.find(q=>!q.answer&&q.claim===no);
  assert(o&&x,yes);assert.equal(p.groupOf(o.id).id,p.groupOf(x.id).id,'one fact, two polarities');
  assert.equal(p.screened(p.groupOf(o.id),dropped),false,yes);
 }
});

test('the numbers in the pairs match the station normals',()=>{
 const c=n=>{for(const v of Object.values(K))if(v&&typeof v==='object'&&v[n]&&v[n].climate)return v[n].climate;throw Error(n)};
 const cold=n=>Math.min(...c(n).temperature);
 assert.equal(c('리마').lecture,'bw');assert(cold('리마')<18&&cold('리마')>16);assert(Math.abs(c('리마').range-7)<0.5);assert(c('리마').elevation<50);
 assert.equal(c('브라질리아').lecture,'aw');assert(cold('브라질리아')>=18);assert(Math.abs(c('브라질리아').elevation-1160)<20);
 assert.equal(c('상파울루').lecture,'cfa');assert(cold('상파울루')<18);assert(Math.abs(c('상파울루').elevation-790)<20);
 assert.equal(c('다르에스살람').lecture,'aw');assert(c('다르에스살람').elevation<200);
 for(const n of ['보고타','아디스아바바'])assert(c(n).elevation>2000,n);
 assert.equal(c('덴버').lecture,'bs');assert(Math.abs(c('덴버').range-24)<0.6);
 assert.equal(c('로차').lecture,'cfa');
});

test('기출형 climate explanations walk the decision with the station numbers',()=>{
 const engine=E.create(K,T),seen=new Map();
 for(let seed=1;seed<1500&&!(seen.has('리마')&&seen.has('브라질리아')&&seen.has('다르에스살람'));seed++){
  let q;try{q=engine.build({themeId:'climate-graphs',seed})}catch(e){continue}
  for(const s of q.stage2.statements)if(s.kind==='climate'&&s.check&&!seen.has(s.check.entity))seen.set(s.check.entity,s.explain);
 }
 assert.match(seen.get('리마'),/연교차 7\.1℃.*판별: .*BW.*페루 한류/);
 assert.match(seen.get('브라질리아'),/최한월 19\.3℃.*해발 1,161m.*Aw.*고산 기후가 아니다/);
 assert.match(seen.get('다르에스살람'),/해안 저지라 고산 기후가 아니다/);
 // A finer station code is not shown as a second verdict; only a different one is.
 for(const e of seen.values())assert.doesNotMatch(e,/관측소 평년값으로는 (Dwb|Csa|Csb)에 가깝다/);
});
