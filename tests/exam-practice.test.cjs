const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const E=require('../assets/exam-practice.js');
const R=require('../assets/rankings.js');
const F=require('../assets/fact-statements.js');
const C=require('../assets/classification-sets.js');
const q=id=>E.questions.find(x=>x.id===id);

test('core questions have explicit targets and distinguish scope without memorizing dataset vintages',()=>{
 const ids=new Set();
 for(const x of E.questions){
  assert.ok(!ids.has(x.id),x.id);ids.add(x.id);
  assert.ok(R.rankings.some(r=>r.id===x.rid),x.id);
  assert.ok(x.evidence&&x.explain,x.id);
  assert.equal(new Set(x.options).size,x.options.length,x.id);
  assert.ok(x.answer.length===1&&x.options.includes(x.answer[0]),x.id);
  if(x.kind==='recall')assert.doesNotMatch(x.text,/(?:19|20)\d{2}/,x.id);
 }
 assert.equal(q('coffee-world').answer[0],'브라질');
 assert.equal(q('coffee-asia').answer[0],'베트남');
 assert.equal(q('coffee-africa').answer[0],'에티오피아');
 assert.match(q('coffee-asia').text,/아시아/);
 assert.match(q('coffee-africa').text,/아프리카/);
 assert.equal(q('country-pop-second').answer[0],'중국');
 assert.ok(!E.questions.some(x=>x.rid==='rice-prod'));
 assert.equal(q('population-africa').answer[0],'나이지리아');
 assert.equal(q('population-americas').answer[0],'미국');
});

test('world-leader recall agrees with both audited snapshots, rather than the arbitrary top-N tail',()=>{
 const ids=['coal-world','oil-world','gas-world','hydro-world','wind-world','solar-world','nuclear-world','maize-world','wheat-world','coffee-world','cocoa-world','cattle-world','pig-world','country-pop-max'];
 for(const id of ids){
  const x=q(id),r=R.rankings.find(r=>r.id===x.rid);
  assert.equal(x.answer[0],r.items[0].name,id);
  assert.equal(x.answer[0],r.audit.latest.items[0].name,id);
 }
});

test('OX preserves historical change, supplies fragile data and keeps existing answers and IDs',()=>{
 const get=id=>F.items.find(x=>x.id===id);
 assert.doesNotMatch(get('g15').claim,/2023|강의의/);
 assert.doesNotMatch(get('p07').claim,/2015|가장/);
 assert.match(get('p17').claim,/1950년.*2020년/);
 assert.match(get('p17').claim,/미국 내/);
 assert.deepEqual(get('p17').data.rows,[['1950년','500','2위'],['2020년','887','3위']]);
 assert.match(get('p03').claim,/1950~1955/);
 assert.match(get('v19').claim,/1950년.*2010년/);
 for(const id of ['g09','g24','e05','e06','e18','t15','t17']){
  const x=get(id);assert.equal(x.practice,'reading',id);assert.ok(x.data.rows.length,id);
  assert.doesNotMatch(x.claim,/(?:19|20)\d{2}/,id);
 }
 const x=get('g26');assert.equal(x.practice,'reading');assert.ok(88/260<47/80);assert.equal(x.answer,false);
 assert.match(get('t17').claim,/4배 이상/);
 assert.match(get('t09').claim,/캐나다는 무역 흑자/);
 assert.match(get('t15').claim,/1인당 GDP/);
 assert.equal(get('t17').revision,2);
 const old=require('../audit/facts-20261017.json').items;
 // Every audited item keeps its ID and answer; reading items may be added (p31 keeps a 기출 table).
 assert.ok(F.items.length>=old.length);
 for(const x of old)assert.equal(get(x.id).answer,x.answer,x.id);
});

test('classification uses stable fossil groups and supplies the historical export table',()=>{
 const s=C.byId.fossil;
 for(const [cat,rid] of Object.entries({coal:'coal-prod',oil:'oil-prod',gas:'gas-prod'})){
  const got=Object.keys(s.values).filter(n=>C.has(s,n,cat)).sort();
  const r=R.rankings.find(r=>r.id===rid);
  assert.deepEqual(got,r.items.slice(0,3).map(x=>x.name).sort());
  assert.deepEqual(got,r.audit.latest.items.slice(0,3).map(x=>x.name).sort());
 }
 assert.ok(C.byId.grainExportTop.givenData.rows.length);
 assert.match(C.byId.grainNet.scopeByName['이집트'],/밀/);
});

// Run the actual page startup and mode change against a minimal DOM. This checks
// the question flow, not a second implementation of question generation.
class Node{
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.style={};this.value='';this.className=''}
 append(...xs){this.children.push(...xs.filter(x=>x!=null))}
 appendChild(x){this.append(x)}
 replaceChildren(...xs){this.children=xs}
 setAttribute(k,v){this.attributes[k]=v}
 get textContent(){return this.ownText||this.children.map(x=>typeof x==='string'?x:x.textContent).join(' ')}
 set textContent(s){this.ownText=s;this.children=[]}
 get firstChild(){return this.children[0]}
 querySelector(s){return this.all().find(x=>s==='.big'?x.className.includes('big'):false)||null}
 all(){return this.children.flatMap(x=>typeof x==='object'?[x,...x.all()]:[])}
 focus(){} scrollIntoView(){}
}
function page(){
 const html=fs.readFileSync(require.resolve('../rankings.html'),'utf8'),nodes={};
 for(const id of ['main','groupSelect','modeSelect','policySelect'])nodes[id]=new Node('div');
 const document={getElementById:id=>nodes[id],createElement:tag=>new Node(tag),createTextNode:s=>s};
 const saved={mode:'quiz',group:'farm',miss:{}};
 const context={window:{WGRankings:R,WGRankingPolicy:require('../assets/ranking-policy.js'),WGExamPractice:E,scrollTo(){}},document,localStorage:{getItem:()=>JSON.stringify(saved),setItem(){}},Math,Set};
 vm.runInNewContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1],context);
 return nodes;
}
test('actual default quiz uses yearless curated questions; full ranking orders always supply the table',()=>{
 const n=page();
 assert.doesNotMatch(n.main.textContent,/(?:19|20)\d{2}|통계 연도 미확인|FAOSTAT/);
 assert.equal(n.main.all().filter(x=>x.className==='rows').length,0);
 n.policySelect.value='dated';n.policySelect.onchange.call(n.policySelect);
 assert.ok(n.main.all().some(x=>x.className==='rows'));
 assert.match(n.main.textContent,/아래 표/);
});
test('changed OX objectives retain old history separately and leave other learning records intact',()=>{
 const html=fs.readFileSync(require.resolve('../facts.html'),'utf8'),nodes={};
 for(const id of ['card','topicSelect','orderSelect'])nodes[id]=new Node('div');
 const original={topic:'trade',order:'weak',history:{t17:{right:3,wrong:2,last:false},g01:{right:4,wrong:0,last:true}}};
 let saved;
 const context={window:{WGFacts:F,scrollTo(){}},document:{getElementById:id=>nodes[id],createElement:tag=>new Node(tag),createTextNode:s=>s,addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(original),setItem:(k,v)=>{saved=JSON.parse(v)}},Math,Set};
 vm.runInNewContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1],context);
 nodes.orderSelect.value='random';nodes.orderSelect.onchange.call(nodes.orderSelect);
 assert.equal(saved.history.t17,undefined);
 assert.deepEqual(saved.retiredHistory['t17@1'],original.history.t17);
 assert.deepEqual(saved.history.g01,original.history.g01);
});
