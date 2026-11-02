'use strict';
// 범위 (2026-11-02): the OX page opens on the hand-picked detail/confusing statements only.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('../assets/fact-practice'),L=require('../assets/fact-level');
const packs=['fact-statements','lecture-goal-facts','table-facts'].map(x=>require('../assets/'+x));
const all=packs.flatMap(x=>x.items),practice=P.create(all),dropped=new Set(L.dropped);
const key=id=>/^goalox-/.test(id)?id.replace(/-[ox]$/,''):id;
const byClaim=text=>{const q=all.find(q=>q.claim&&q.claim.includes(text));assert(q,text);return practice.groupOf(q.id);};

test('the screened list names only current statements and leaves 384 knowledge groups',()=>{
 const keys=new Set(all.map(q=>key(q.id)));
 assert.deepEqual(L.dropped.filter(id=>!keys.has(id)),[]);
 assert.equal(new Set(L.dropped).size,L.dropped.length);
 const picked=practice.groups.filter(g=>!practice.screened(g,dropped));
 assert.equal(picked.length,384);
 const kind=g=>g.items.some(q=>q.cell)?'table':g.items.some(q=>/^goalox-/.test(q.id))?'lecture':'base';
 const n={base:0,lecture:0,table:0};picked.forEach(g=>n[kind(g)]++);
 assert.deepEqual(n,{base:62,lecture:238,table:84});
});

test('items the learner missed in the level check stay; basics and reading mechanics go',()=>{
 const tableRow=(row,col)=>practice.groupOf(all.find(q=>q.cell&&q.cell.row===row&&q.cell.head[1]===col).id);
 for(const g of [tableRow('미나레트','의미'),tableRow('세계 사막화 방지의 날','날짜'),byClaim('선광은 광석에서 유용 성분을')])
  assert.equal(practice.screened(g,dropped),false,g.id);
 for(const g of [byClaim('N·S는 북위·남위'),byClaim('면적 기준 도형표현도에서 원의 반지름이 두 배'),tableRow('원유 생산','지리적으로 연결되는 조건')])
  assert.equal(practice.screened(g,dropped),true,g.id);
});

test('a group stays visible when any of its statements is not on the list',()=>{
 const g=practice.groups.find(g=>g.items.length>1&&practice.screened(g,dropped));
 const partial=new Set(L.dropped.filter(id=>id!==key(g.items[0].id)));
 assert.equal(practice.screened(g,partial),false);
 assert.equal(practice.screened(g,new Set()),false);
});

function app(memory=new Map()){
 class El{constructor(tag){this.children=[];this.style={};this.tagName=String(tag||'div').toUpperCase();}append(...xs){this.children.push(...xs);}appendChild(x){this.children.push(x);return x;}replaceChildren(...xs){this.children=xs;}setAttribute(k,v){this[k]=v;}addEventListener(){}focus(){}scrollIntoView(){}get firstChild(){return this.children[0];}}
 const elements={},document={getElementById:id=>elements[id]||(elements[id]=new El()),createElement:tag=>new El(tag),createTextNode:text=>({textContent:text}),addEventListener:()=>{}};
 const topics=[...new Map(packs.flatMap(p=>p.topics).map(t=>[t.id,t])).values()];
 const c={document,location:{search:''},URLSearchParams,WGFactPractice:P,WGFactLevel:L,WGFacts:{items:all,topics},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},scrollTo:()=>{}};c.window=c;vm.createContext(c);
 let html=fs.readFileSync(require.resolve('../facts.html'),'utf8'),src=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
 src=src.replace(/build\(\);\s*\}\)\(\);\s*$/,'globalThis.api={state,store,practice,build,answer,nextItem,position,setLevel};build();})();');
 vm.runInContext(src,c);return{...c.api,memory,elements};
}
const groupsOf=a=>a.state.queue.map(id=>a.practice.groupOf(id));

test('the page opens on the picked range and the wider range adds only screened groups',()=>{
 const a=app();assert.equal(a.state.level,'picked');
 assert.equal(a.state.queue.length,384);assert(groupsOf(a).every(g=>!practice.screened(g,dropped)));
 const levelOptions=a.elements.levelSelect.children.map(o=>o.textContent);
 assert.deepEqual(levelOptions,['세부·헷갈리는 것만 (384)','걸러낸 것도 포함 (1919)']);
 const first=a.state.queue[0];a.answer(a.practice.byId[first].answer);a.nextItem();
 a.setLevel('all');assert.equal(a.state.queue.length,1918);
 assert(!a.state.queue.some(id=>a.practice.groupOf(id).id===a.practice.groupOf(first).id),'answered group stays answered');
 const b=app(a.memory);assert.equal(b.state.level,'all');
 b.setLevel('picked');assert.equal(b.state.queue.length,383);assert.equal(b.position().done,1);
});

test('a topic with nothing picked offers the wider range instead of a dead end',()=>{
 const a=app(new Map([['wg_facts_v1',JSON.stringify({topic:'geographic-information'})]]));
 assert.equal(a.state.queue.length,0);
 const card=a.elements.card.children,button=card.find(x=>x.tagName==='BUTTON');
 assert.match(card[0].textContent,/걸러 냈어요/);button.onclick();
 assert.equal(a.state.level,'all');assert.equal(a.state.queue.length,12);
});
