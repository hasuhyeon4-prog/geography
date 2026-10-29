/* DOM integration fixture: exercises the real page controller, not a second controller.
 * Pixel/layout inspection is recorded separately; this is not a real browser screenshot test.
 */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const M=require('../assets/materials-engine.js'),D=require('../assets/materials-data.js'),C=require('../assets/materials-charts.js');
function fixture(family,prior){
 class Node{constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this._text='';this.value='';}set textContent(s){this._text=String(s);this.children=[];}get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}appendChild(x){this.children.push(x);return x;}append(...xs){for(const x of xs)if(x!=null)this.appendChild(typeof x==='string'?Object.assign(new Node('#text'),{textContent:x}):x);}setAttribute(k,v){this.attributes[k]=String(v);if(k==='id')this.id=v;if(k==='class')this.className=v;}querySelectorAll(){return [];}focus(){}scrollIntoView(){}replaceChildren(...xs){this.children=[];this._text='';this.append(...xs);}}
 const roots=['main','family','order','score'].map(id=>{const n=new Node(id==='main'?'main':'div');n.id=id;return n;}),walk=function(nodes){return nodes.flatMap(n=>[n,...walk(n.children)]);};
 const document={createElement:tag=>new Node(tag),createTextNode:t=>Object.assign(new Node('#text'),{textContent:t}),getElementById:id=>walk(roots).find(n=>n.id===id)||null};
 let saved=prior===undefined?JSON.stringify({family,seed:1}):prior;
 const context={document,WGMaterials:M,WGMaterialsData:D,WGMaterialCharts:C,localStorage:{getItem:()=>saved,setItem:(k,v)=>{saved=v;}},scrollTo(){}};context.window=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve('../assets/materials-page.js'),'utf8'),context);
 return{get saved(){return JSON.parse(saved);},nodes:()=>walk(roots),find:(fn)=>walk(roots).find(fn),document,context};
}
test('practice is answered once; answer keys, notes and lookup tables stay absent until submission',()=>{
 const E=M.create(D);
 for(const f of E.families){
  const p=fixture(f.id),x=E.exam(E.build(f.id,1));
  const group=()=>p.nodes().filter(n=>n.className==='choices');
  assert.equal(group().length,1,f.id);
  assert.ok(!p.nodes().some(n=>n.tagName==='DETAILS'),f.id+' source notes must not appear before submission');
  assert.ok(!p.document.getElementById('nextQuestion'));
  const old=group()[0].children[x.stage.answer];old.onclick();old.onclick();
  assert.equal(p.saved.stats[f.id].right,1,f.id+' duplicate click');assert.equal(p.saved.review.length,0);
  assert.ok(p.nodes().some(n=>n.tagName==='DETAILS'),f.id+' feedback retains the source');
  // A seed is used up only by an answer (2026-10-29): one answered question, seed 1 → 2.
  p.document.getElementById('nextQuestion').onclick();assert.equal(group().length,1);assert.equal(p.saved.seed,2);
 }
});
test('a wrong final answer persists and is removed only on a correct review answer',()=>{
 const family='gis-filters',p=fixture(family),x=M.create(D).exam(M.create(D).build(family,1));
 let group=p.nodes().find(n=>n.className==='choices');group.children[(x.stage.answer+1)%x.stage.options.length].onclick();
 assert.equal(p.saved.review[0].family,family);assert.equal(p.saved.review[0].seed,1);assert.equal(p.saved.stats[family].wrong,1);
 const again=fixture(family,JSON.stringify({...p.saved,order:'review'}));group=again.nodes().find(n=>n.className==='choices');group.children[x.stage.answer].onclick();assert.equal(again.saved.review.length,0);
 again.document.getElementById('nextQuestion').onclick();assert.match(again.document.getElementById('main').textContent,/다시 풀 문항이 없/);
});
test('old results and review items of deleted families are retained as old results only',()=>{
 const p=fixture('gis-tie-break',JSON.stringify({family:'gis-tie-break',stats:{'gis-tie-break':{right:8,wrong:2}},review:[{family:'gis-tie-break',seed:9}]}));
 assert.equal(p.saved.family,'all');assert.equal(p.saved.retiredStats['before-20261027']['gis-tie-break'].right,8);
 assert.equal(p.saved.review.length,0);assert.ok(!('pausedReview' in p.saved));
 assert.ok(!p.nodes().some(n=>n.tagName==='OPTION'&&n.attributes.value==='gis-tie-break'));
});
test('malformed saved data and unavailable storage do not prevent practice',()=>{
 for(const bad of ['null','[]','not-json']){const p=fixture('cumulative',bad);assert.ok(p.nodes().some(n=>n.className==='choices'));}
 const html=fs.readFileSync(require.resolve('../materials.html'),'utf8');assert.match(html,/assets\/materials-exam\.js/);assert.match(html,/aria-live="polite"/);
});
test('the corpus revision archives the previous scoring separately and drops reviews of deleted families',()=>{
 const p=fixture('religion-selected',JSON.stringify({revision:2,family:'religion-selected',seed:5,stats:{'religion-selected':{right:7,wrong:2}},retiredStats:{'before-20261027':{first:{right:3}}},review:[{family:'religion-selected',seed:8},{family:'cumulative',seed:9}]}));
 assert.equal(p.saved.revision,3);assert.equal(p.saved.retiredStats['before-20261027'].first.right,3);
 assert.equal(p.saved.retiredStats['before-20261027-corpus']['religion-selected'].right,7);// The kept 'cumulative' miss is shown again first and stays listed until answered right.
 assert.deepEqual(p.saved.review.map(x=>x.family),['cumulative']);
 assert.deepEqual(p.saved.stats,{});assert.equal(p.saved.family,'all');
});
