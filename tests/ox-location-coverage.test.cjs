'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const read=id=>JSON.parse(html.match(new RegExp('<script id="'+id+'" type="application/json">(.*?)</script>','s'))[1]);
const content=read('contentData'),raw=read('auditData'),geo=read('geometryData');
const extra=content.items.filter(x=>x.id.startsWith('OX위치보완::'));
const norm=s=>s.replace(/\s+/g,'');
const ox=[...require('../assets/fact-statements').items,...require('../assets/lecture-goal-facts').items,...require('../assets/table-facts').items];
function list(){
 const rows=raw.filter(x=>!['국가 관계','지명 → 국가·도시'].includes(x.section)).concat(content.items).map(x=>Object.assign({},x,{geometry:geo.items[x.id]||x.geometry},content.updates[x.id]||{}));
 const refs=new Set(content.studyPolicy.referenceOnly.map(x=>x.id));rows.forEach(x=>x.referenceOnly=refs.has(x.id));
 require('../assets/study-content').apply(rows);return rows;
}
function source(name){const at=html.indexOf('function '+name+'('),eol=html.indexOf('\n',at);assert(at>=0);return html.slice(at,html.slice(at,eol).endsWith('}')?eol:html.indexOf('\n}',at)+2);}
test('OX case locations have unique searchable entries supported by actual active statements',()=>{
 assert.equal(extra.length,17);const rows=list(),ids=rows.map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
 for(const x of extra){
  const names=[x.name,...x.aliases].map(norm);
  assert(ox.some(q=>names.some(n=>norm(q.cell?q.cell.row:q.claim).includes(n))),x.name+' is not an active OX case');
  assert(x.references.some(r=>/^https:\/\//.test(r.url)),x.name);
  assert(!x.referenceOnly&&x.source!=='보충',x.name);
 }
});
test('added OX places enter the actual default location quiz pool without enabling extras',()=>{
 const c={items:list(),state:{topic:'all',region:'all',filter:'all',recall:true,climate:false,supplement:false,review:false},known:new Set(),isDue:()=>true,locationQuiz:()=>true,inRegion:()=>true};vm.createContext(c);
 for(const f of ['available','scopeItems','passFilter','quizEligible'])vm.runInContext(source(f),c);
 const pool=vm.runInContext('scopeItems().filter(passFilter).filter(quizEligible)',c);
 for(const x of extra)assert(pool.some(p=>p.id===x.id),x.name);
 for(const x of pool)assert(!x.referenceOnly,'climate-only exclusions changed');
});
test('OX spellings resolve to one existing place and Te Wahipounamu grades in the South Island',()=>{
 const rows=list(),find=n=>rows.find(x=>x.name===n),te=find('테 와히포우나무');
 assert(te.aliases.includes('테와히포우나무'));
 assert(find('남알프스 산맥').aliases.includes('서던알프스'));
 assert(find('보홀섬').aliases.includes('보홀'));
 const G=require('../assets/location-grading');te.featureKind='park';
 assert.equal(G.grade(te,{lon:167.6,lat:-45.4}).status,'correct');
 assert.equal(G.grade(te,{lon:175.6,lat:-39.3}).status,'wrong');
 for(const x of extra){assert(['point','line','poly'].includes(x.geometry.type));if(x.geometry.approximate)assert(x.extentNote);}
});
