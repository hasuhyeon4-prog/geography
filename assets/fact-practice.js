/* OX rounds visit knowledge groups, while old statement IDs keep their history. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WGFactPractice=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// These pairs were individually checked: word order or a redundant qualifier changes,
// while the fact being tested stays the same. Similar vocabulary alone is not a merge.
var EQUIVALENT=[
 ['goalox-G049-2-01','goalox-G049-2-02'],
 ['goalox-G069-3-01','goalox-G132-4-01'],
 ['goalox-G114-4-01','goalox-G114-4-03'],
 ['goalox-G123-1-01','goalox-G123-1-03'],
 ['goalox-G112-1-03','goalox-G112-5-01']
];
function norm(s){return String(s||'').replace(/\s+/g,'').replace(/[「」〈〉]/g,'').replace(/[.。]$/,'');}
function base(id){return /^goalox-/.test(id)?id.replace(/-[ox]$/,''):id;}
function shuffle(a,rng){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rng()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function create(items){
 var byId={},parents={},keys={},same={};
 items.forEach(function(q){byId[q.id]=q;var k=base(q.id);keys[q.id]=k;parents[k]=k;});
 function root(k){while(parents[k]!==k){parents[k]=parents[parents[k]];k=parents[k];}return k;}
 function join(a,b){if(!parents[a]||!parents[b])return;a=root(a);b=root(b);if(a!==b)parents[a<b?b:a]=a<b?a:b;}
 items.forEach(function(q){
  var signatures=['statement|'+q.answer+'|'+norm(q.claim)];
  if(q.cell)signatures.push('table-truth|'+norm(q.explain));
  else if(/^바른 관계:\s*/.test(q.explain||''))signatures.push('truth|'+norm(q.explain.replace(/^바른 관계:\s*/,'')));
  signatures.forEach(function(s){if(same[s])join(keys[q.id],same[s]);else same[s]=keys[q.id];});
 });
 EQUIVALENT.forEach(function(p){join(p[0],p[1]);});
 var groups=[],byGroup={},of={};
 items.forEach(function(q){var id='concept|'+root(keys[q.id]),g=byGroup[id];if(!g){g=byGroup[id]={id:id,items:[],topics:[]};groups.push(g);}g.items.push(q);if(g.topics.indexOf(q.topic)<0)g.topics.push(q.topic);of[q.id]=g;});
 function inTopic(q,topic){return topic==='all'||q.topic===topic||topic==='table-all'&&q.topic.indexOf('table-')===0;}
 function scoped(topic){return groups.filter(function(g){return g.items.some(function(q){return inTopic(q,topic);});});}
 function mastered(g,m){return g.items.some(function(q){return !!m[q.id];});}
 function prepare(rounds,scope,ids,options){
  options=options||{};var d=rounds[scope],rng=options.rng||Math.random;
  if(!d||!Array.isArray(d.left)||!Array.isArray(d.done)||options.restart){
   var last=d?Object.assign({},d.last||{},d.choices||{}):{},done=[];
   // Migrate the old statement queue once. A group already answered in that round
   // counts as covered; never remove the original per-statement learning history.
   if(!d&&!options.restart&&Array.isArray(options.legacyLeft)){
    var old=new Set(options.legacyLeft),history=options.history||{};
    ids.forEach(function(id){if(byGroup[id].items.some(function(q){return history[q.id]&&!old.has(q.id);}))done.push(id);});
   }
   d=rounds[scope]={left:[],done:done,choices:{},last:last,number:d?(d.number||1)+1:1};
  }
  if(!d.choices||typeof d.choices!=='object')d.choices={};
  if(!d.last||typeof d.last!=='object')d.last={};
  var eligible=new Set(ids),doneSet=new Set(d.done),leftSet=new Set();
  d.left=d.left.filter(function(id){if(!eligible.has(id)||doneSet.has(id)||leftSet.has(id))return false;leftSet.add(id);return true;});
  var missing=ids.filter(function(id){return !doneSet.has(id)&&!leftSet.has(id);});
  d.left=d.left.concat(shuffle(missing,rng));
  // An empty round stays complete until the learner explicitly starts another.
  // A scope/mastery change can therefore never silently restart answered content.
  return d.left.slice();
 }
 function variant(d,id,topic,rng){
  var candidates=byGroup[id].items.filter(function(q){return inTopic(q,topic);});
  var chosen=byId[d.choices[id]];if(chosen&&candidates.indexOf(chosen)>=0)return chosen.id;
  var previous=byId[d.last[id]],opposite=previous?candidates.filter(function(q){return q.answer!==previous.answer;}):[];
  if(opposite.length)candidates=opposite;
  else{var other=candidates.filter(function(q){return q.id!==d.last[id];});if(other.length)candidates=other;}
  chosen=candidates[Math.floor((rng||Math.random)()*candidates.length)];d.choices[id]=chosen.id;return chosen.id;
 }
 function answered(d,id){if(d.done.indexOf(id)<0)d.done.push(id);d.left=d.left.filter(function(x){return x!==id;});}
 return{groups:groups,byId:byId,byGroup:byGroup,groupOf:function(id){return of[id];},scoped:scoped,inTopic:inTopic,mastered:mastered,prepare:prepare,variant:variant,answered:answered};
}
return{create:create};
});
