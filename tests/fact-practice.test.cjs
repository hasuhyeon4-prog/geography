'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('../assets/fact-practice');
const packs=['fact-statements','lecture-goal-facts','table-facts'].map(x=>require('../assets/'+x));
const all=packs.flatMap(x=>x.items),practice=P.create(all);
test('every original item keeps its identity and belongs to exactly one knowledge group',()=>{
 assert.equal(all.length,2716);assert.equal(practice.groups.length,1919);
 const members=practice.groups.flatMap(g=>g.items.map(q=>q.id));assert.equal(new Set(members).size,all.length);
 assert.deepEqual(members.slice().sort(),all.map(q=>q.id).sort());
});
test('both polarities, verified paraphrases and duplicate LPG tables share one slot',()=>{
 for(const [a,b] of [
  ['goalox-G049-2-01-o','goalox-G049-2-02-x'],
  ['goalox-G069-3-01-o','goalox-G132-4-01-o'],
  ['goalox-G114-4-01-x','goalox-G114-4-03-o'],
  ['goalox-G123-1-01-o','goalox-G123-1-03-x'],
  ['goalox-G112-1-03-o','goalox-G112-5-01-x'],
  ['table|energy:L2-B0332|LPG|성질과 방식','table|goal-table-l2-b0332|LPG|성질과 방식']
 ])assert.equal(practice.groupOf(a).id,practice.groupOf(b).id,a);
 // Similar wording about different rivers is still different knowledge.
 assert.notEqual(practice.groupOf('goalox-G038-4-04-o').id,practice.groupOf('goalox-G038-4-06-o').id);
});
test('numeric signs, decimal points and different subjects are not erased by grouping',()=>{
 const p=P.create(['-2','2','1.2','12'].map((n,i)=>({id:'number'+i,topic:'x',claim:'값은 '+n+'이다.',answer:true,explain:'값: '+n})));
 assert.equal(p.groups.length,4);
});
test('a full live-bank round covers every group once and keeps unanswered choices across reloads',()=>{
 const ids=practice.groups.map(g=>g.id);let rounds={},seen=[];
 for(let i=0;i<ids.length;i++){
  let left=practice.prepare(rounds,'all',ids),d=rounds.all,id=left[0],q=practice.variant(d,id,'all');
  rounds=JSON.parse(JSON.stringify(rounds));assert.equal(practice.variant(rounds.all,id,'all'),q);
  assert.equal(practice.groupOf(q).id,id);seen.push(id);practice.answered(rounds.all,id);
 }
 assert.equal(new Set(seen).size,ids.length);assert.deepEqual(practice.prepare(rounds,'all',ids),[]);
});
test('mastering, restoring, adding or removing eligibility never resets already answered groups',()=>{
 const ids=practice.groups.slice(0,7).map(g=>g.id),rounds={};let left=practice.prepare(rounds,'all',ids),answered=left[0],excluded=left[2];practice.answered(rounds.all,answered);
 left=practice.prepare(rounds,'all',ids.filter(x=>x!==excluded));assert(!left.includes(answered));assert(!left.includes(excluded));
 left=practice.prepare(rounds,'all',ids);assert(!left.includes(answered));assert(left.includes(excluded));
 assert.deepEqual(practice.prepare(rounds,'all',[answered]),[]);
 const added=practice.groups[8].id;assert.deepEqual(practice.prepare(rounds,'all',[answered,added]),[added]);
});
test('a deliberate next round alternates polarity when the knowledge has both O/X variants',()=>{
 const id=practice.groupOf('goalox-G049-2-01-o').id,rounds={};practice.prepare(rounds,'all',[id]);
 let q=practice.variant(rounds.all,id,'all');practice.answered(rounds.all,id);
 practice.prepare(rounds,'all',[id],{restart:true});let next=practice.variant(rounds.all,id,'all');
 assert.notEqual(practice.byId[q].answer,practice.byId[next].answer);assert.equal(rounds.all.number,2);
});
test('the old raw-item queue migrates coverage without discarding history',()=>{
 const g=practice.groupOf('goalox-G049-2-01-o'),other=practice.groupOf('goalox-G038-4-04-o'),history={'goalox-G049-2-01-o':{right:3,wrong:1,last:true}};
 const before=JSON.stringify(history),rounds={};let ids=practice.prepare(rounds,'all',[g.id,other.id],{legacyLeft:[...g.items.filter(q=>q.id!=='goalox-G049-2-01-o'),...other.items].map(q=>q.id),history});
 assert.deepEqual(ids,[other.id]);assert.equal(JSON.stringify(history),before);
});

function app(memory=new Map(),items=all){
 class El{constructor(){this.children=[];this.style={};this.tagName='DIV';}append(...xs){this.children.push(...xs);}appendChild(x){this.children.push(x);return x;}replaceChildren(...xs){this.children=xs;}setAttribute(){}addEventListener(){}focus(){}scrollIntoView(){}get firstChild(){return this.children[0];}}
 const elements={},document={getElementById:id=>elements[id]||(elements[id]=new El()),createElement:()=>new El(),createTextNode:text=>({textContent:text}),addEventListener:()=>{}};
 const topics=[...new Map(packs.flatMap(p=>p.topics).map(t=>[t.id,t])).values()];
 const c={document,location:{search:''},URLSearchParams,WGFactPractice:P,WGFacts:{items,topics},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},scrollTo:()=>{}};c.window=c;vm.createContext(c);
 let html=fs.readFileSync(require.resolve('../facts.html'),'utf8'),src=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
 src=src.replace(/build\(\);\s*\}\)\(\);\s*$/,'globalThis.api={state,store,practice,build,answer,nextItem,masteredButton,position};build();})();');
 vm.runInContext(src,c);return{...c.api,memory};
}
test('real page preserves answered groups and raw records across mastery and revisit',()=>{
 let a=app(),answered=[];for(let i=0;i<2;i++){let id=a.state.queue[a.state.index];answered.push(a.practice.groupOf(id).id);a.answer(a.practice.byId[id].answer);a.nextItem();}
 const third=a.state.queue[a.state.index],g=a.practice.groupOf(third);a.masteredButton(third).onclick();
 assert(g.items.every(q=>a.store.mastered[q.id]));let b=app(a.memory);
 assert(answered.every(id=>!b.state.queue.some(q=>b.practice.groupOf(q).id===id)));assert.equal(Object.keys(b.store.history).length,2);
 b.masteredButton(third).onclick();assert(g.items.every(q=>!b.store.mastered[q.id]));assert(answered.every(id=>!b.state.queue.some(q=>b.practice.groupOf(q).id===id)));
 assert.equal(b.position().done,2);
});
test('real page reopens the same unanswered wording and never repeats a group in one queue',()=>{
 let a=app(),first=a.state.queue[0],b=app(a.memory);assert.equal(b.state.queue[0],first);
 const ids=b.state.queue.map(id=>b.practice.groupOf(id).id);assert.equal(new Set(ids).size,ids.length);
});
test('wrong-only keeps the actual failed item and resolves the knowledge group after a correct review',()=>{
 let a=app(),id=a.state.queue[0],g=a.practice.groupOf(id);a.answer(!a.practice.byId[id].answer);a.state.order='wrongOnly';a.build();assert(a.state.queue.includes(id));
 assert.equal(a.state.queue.filter(x=>a.practice.groupOf(x).id===g.id).length,1);a.answer(a.practice.byId[id].answer);a.build();assert(!a.state.queue.some(x=>a.practice.groupOf(x).id===g.id));
});
test('mastered status from any old variant excludes the entire group without deleting it',()=>{
 const id='goalox-G049-2-01-o',memory=new Map([['wg_facts_v1',JSON.stringify({mastered:{[id]:1},history:{[id]:{right:8,wrong:1,last:true,revision:practice.byId[id].revision||1}}})]]),a=app(memory),g=a.practice.groupOf(id);
 assert(!a.state.queue.some(q=>a.practice.groupOf(q).id===g.id));assert.equal(a.store.history[id].right,8);assert.equal(a.practice.byId[id].claim,practice.byId[id].claim);
});
test('revision retirement still preserves older raw records in the existing archive',()=>{
 const id='goalox-G049-2-01-o',memory=new Map([['wg_facts_v1',JSON.stringify({history:{[id]:{right:8,wrong:1,last:true,revision:-1}}})]]),a=app(memory);
 assert.equal(a.store.retiredHistory[id+'@-1'].right,8);
});
