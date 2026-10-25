/* DOM integration fixture: exercises the real page controller, not a second controller.
 * Pixel/layout inspection is recorded separately; this is not a real browser screenshot test.
 */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const M=require('../assets/materials-engine.js'),D=require('../assets/materials-data.js'),C=require('../assets/materials-charts.js');
function fixture(family,prior){
 class Node{constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this._text='';this.value='';}set textContent(s){this._text=String(s);this.children=[];}get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}appendChild(x){this.children.push(x);return x;}append(...xs){for(const x of xs)if(x!=null)this.appendChild(typeof x==='string'?Object.assign(new Node('#text'),{textContent:x}):x);}setAttribute(k,v){this.attributes[k]=String(v);if(k==='id')this.id=v;if(k==='class')this.className=v;}focus(){}scrollIntoView(){}replaceChildren(...xs){this.children=[];this._text='';this.append(...xs);}}
 const roots=['main','family','order','score'].map(id=>{const n=new Node(id==='main'?'main':'div');n.id=id;return n;}),walk=function(nodes){return nodes.flatMap(n=>[n,...walk(n.children)]);};
 const document={createElement:tag=>new Node(tag),createTextNode:t=>Object.assign(new Node('#text'),{textContent:t}),getElementById:id=>walk(roots).find(n=>n.id===id)||null};
 let saved=prior===undefined?JSON.stringify({family,seed:1}):prior;
 const context={document,WGMaterials:M,WGMaterialsData:D,WGMaterialCharts:C,localStorage:{getItem:()=>saved,setItem:(k,v)=>{saved=v;}},scrollTo(){}};context.window=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve('../assets/materials-page.js'),'utf8'),context);
 return{get saved(){return JSON.parse(saved);},nodes:()=>walk(roots),find:(fn)=>walk(roots).find(fn),document,context};
}
test('all families really render and complete two answer steps without double grading',()=>{
 for(const f of M.create(D).families){
  const p=fixture(f.id),q=M.create(D).build(f.id,1);
  const groups=()=>p.nodes().filter(n=>n.className==='choices');
  assert.equal(groups().length,1,f.id+' must hide second-step answer until identification');
  const oldFirst=groups()[0].children[q.stage1.answer];oldFirst.onclick();oldFirst.onclick();
  assert.equal(groups().length,2,f.id);const second=groups()[1].children[q.stage2.answer];second.onclick();second.onclick();
  assert.equal(p.saved.stats[f.id].right,1,f.id+' duplicate click');assert.equal(p.saved.review.length,0);
  assert.ok(p.document.getElementById('nextQuestion'));p.document.getElementById('nextQuestion').onclick();assert.equal(groups().length,1);assert.equal(p.saved.seed,3);
 }
});
test('wrong attempts survive reload in the same family and leave review only after both steps are right',()=>{
 const family='gis-filters',p=fixture(family),q=M.create(D).build(family,1);
 let groups=p.nodes().filter(n=>n.className==='choices');groups[0].children[(q.stage1.answer+1)%q.stage1.options.length].onclick();groups=p.nodes().filter(n=>n.className==='choices');groups[1].children[q.stage2.answer].onclick();
 assert.equal(p.saved.review[0].family,family);assert.equal(p.saved.review[0].seed,1);assert.equal(p.saved.stats[family].wrong,1);
 const record={...p.saved,order:'review'},again=fixture(family,JSON.stringify(record));groups=again.nodes().filter(n=>n.className==='choices');groups[0].children[q.stage1.answer].onclick();groups=again.nodes().filter(n=>n.className==='choices');groups[1].children[q.stage2.answer].onclick();assert.equal(again.saved.review.length,0);
 again.document.getElementById('nextQuestion').onclick();assert.match(again.document.getElementById('main').textContent,/다시 풀 문항이 없/);
});
test('malformed saved data and unavailable storage do not prevent practice',()=>{
 for(const bad of ['null','[]','not-json']){const p=fixture('cumulative',bad);assert.ok(p.nodes().some(n=>n.className==='choices'));}
 const html=fs.readFileSync(require.resolve('../materials.html'),'utf8');assert.match(html,/assets\/materials-page\.js/);assert.match(html,/aria-live="polite"/);assert.match(fs.readFileSync(require.resolve('../exam.html'),'utf8'),/href="materials.html"/);
});
