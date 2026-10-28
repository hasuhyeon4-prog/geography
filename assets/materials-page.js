(function(){
'use strict';
var $=function(id){return document.getElementById(id);},DATA=window.WGMaterialsData,M=window.WGMaterials,C=window.WGMaterialCharts;
if(!DATA||!M||!C){$('main').textContent='자료를 불러오지 못했어요. 새로고침해 주세요.';return;}
var engine=M.create(DATA),saved={};
if(!engine.exam){$('main').textContent='문항을 불러오지 못했어요. 새로고침해 주세요.';return;}
var families=engine.families;
try{saved=JSON.parse(localStorage.getItem('wg_materials_v1')||'{}');}catch(e){}
if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};
var stats=saved.stats&&typeof saved.stats==='object'&&!Array.isArray(saved.stats)?saved.stats:{};
var retiredStats=saved.retiredStats&&typeof saved.retiredStats==='object'&&!Array.isArray(saved.retiredStats)?saved.retiredStats:{};
if(saved.revision!==3){retiredStats[saved.revision===2?'before-20261027-corpus':'before-20261027']=stats;stats={};}
var review=Array.isArray(saved.review)?saved.review.filter(function(x){return x&&Number.isSafeInteger(x.seed)&&families.some(function(f){return f.id===x.family;});}):[];
var state={family:families.some(function(f){return f.id===saved.family;})?saved.family:'all',order:['weak','random','review'].includes(saved.order)?saved.order:'weak',seed:Number.isSafeInteger(saved.seed)?saved.seed:1,q:null,x:null,answer:null,right:0,total:0,error:null};
function save(){try{localStorage.setItem('wg_materials_v1',JSON.stringify({revision:3,family:state.family,order:state.order,seed:state.seed,stats:stats,retiredStats:retiredStats,review:review}));}catch(e){}}
function el(tag,props,kids){var e=document.createElement(tag);Object.keys(props||{}).forEach(function(k){if(props[k]==null)return;if(k==='text')e.textContent=props[k];else if(k==='onclick')e.onclick=props[k];else if(k==='className')e.className=props[k];else e.setAttribute(k,props[k]);});(kids||[]).forEach(function(c){if(c!=null)e.appendChild(typeof c==='string'?document.createTextNode(c):c);});return e;}
function pool(){return families.filter(function(f){return state.family==='all'||state.family===f.id;});}
function chooseFamily(){var p=pool(),weights=p.map(function(f){var s=stats[f.id]||{right:0,wrong:0};return state.order==='weak'?1+(s.wrong+1)/(s.right+1):1;}),v=Math.random()*weights.reduce(function(a,b){return a+b;},0);for(var i=0;i<p.length;i++){v-=weights[i];if(v<=0)return p[i].id;}return p[p.length-1].id;}
function next(){
 state.answer=null;state.error=null;state.x=null;
 var pending=review.filter(function(x){return state.family==='all'||x.family===state.family;}),id,seed;
 if(state.order==='review'){
  if(!pending.length){state.q=null;render();return;}
  var x=pending[0];id=x.family;seed=x.seed;
 }else{id=chooseFamily();seed=state.seed++;}
 try{state.q=engine.build(id,seed);state.x=engine.exam(state.q);}catch(e){state.q=null;state.error='이 주제의 자료를 표시하지 못했어요. 다른 주제를 선택하거나 새로고침해 주세요.';}
 save();render();
}
function answer(i){
 if(!state.q||state.answer!==null||!Number.isInteger(i)||i<0||i>=state.x.stage.options.length)return;
 state.answer=i;var q=state.q,ok=i===state.x.stage.answer;
 state.total++;if(ok)state.right++;
 var h=stats[q.id]||(stats[q.id]={right:0,wrong:0});h[ok?'right':'wrong']++;
 var key=q.id+'|'+q.seed;review=review.filter(function(x){return x.family+'|'+x.seed!==key;});
 if(!ok)review.push({family:q.id,seed:q.seed});
 save();render();var b=$('nextQuestion');if(b)b.focus({preventScroll:true});
}
function drawTable(t){return el('div',{className:'scroll'},[el('table',{},[el('caption',{text:t.caption||''}),el('thead',{},[el('tr',{},t.headers.map(function(h){return el('th',{scope:'col',text:String(h)});}))]),el('tbody',{},t.rows.map(function(row){return el('tr',{},row.map(function(v){return el('td',{text:typeof v==='number'?v.toLocaleString('ko-KR',{maximumFractionDigits:5}):String(v)});}));}))])]);}
// Charts fit the card width; on a phone the labels are enlarged instead of
// cropping the 700-unit drawing behind a horizontal scroll.
function textScale(photo){var w=Math.max(200,($('main').clientWidth||700)-60);return photo?1:Math.max(1,11/(14*w/700));}
function render(){
 var main=$('main');main.textContent='';$('score').textContent=state.right+' / '+state.total+' · 다시 풀기 '+review.length;
 if(!state.q){main.append(el('section',{className:'card empty'},[el('p',{text:state.error||'이 범위에 다시 풀 문항이 없어요.'}),el('a',{href:'exam.html',text:'기출형으로 돌아가기'})]));return;}
 var q=state.q,x=state.x,done=state.answer!==null,card=el('section',{className:'card'},[el('h2',{text:x.stage.question}),x.condition?el('p',{className:'note',text:x.condition}):null]);
 var figureHost=x.figureLayout==='photos'?el('div',{className:'photo-grid'}):card;
 x.figures.forEach(function(f){var frame=el('div',{className:'figure'});frame.innerHTML=C.render(f,{textScale:textScale(x.figureLayout==='photos')});
  if(x.figureLayout==='photos')frame.append(el('p',{className:'photo-label',text:f.name}));
  frame.querySelectorAll('[data-material-option]').forEach(function(marker){
   // Old source markers point into raw stage-one choices; map by label into the
   // final displayed choices, which may have been shuffled/reduced.
   var raw=Number(marker.getAttribute('data-material-option')),label=q.stage1.options[raw],i=x.stage.options.indexOf(label);
   if(i<0)return;marker.addEventListener('click',function(){answer(i);});marker.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();answer(i);}});
  });figureHost.append(frame);
 });
 if(figureHost!==card)card.append(figureHost);
 x.tables.forEach(function(t){card.append(drawTable(t));});
 if(q.credit)card.append(el('p',{className:'source'},[document.createTextNode(q.credit.author+' · '),el('a',{href:q.credit.licenseUrl,text:q.credit.license,target:'_blank',rel:'noopener noreferrer'}),document.createTextNode(' · '),el('a',{href:q.credit.url,text:'사진 원출처',target:'_blank',rel:'noopener noreferrer'})]));
 if(x.stage.statements)card.append(el('ul',{className:'statements'},x.stage.statements.map(function(s){return el('li',{},[el('span',{text:s.mark+'. '+s.text}),done?el('div',{className:'correction',text:(s.truth?'O · ':'X · ')+s.explain}):null]);})));
 card.append(el('div',{className:'choices'},x.stage.options.map(function(text,i){return el('button',{type:'button',className:!done?'':i===x.stage.answer?'correct':i===state.answer?'wrong':'',disabled:done?'disabled':null,onclick:function(){answer(i);},text:(i+1)+'. '+text});})));
 if(done){
  var ok=state.answer===x.stage.answer;card.append(el('div',{className:'feedback '+(ok?'good':'bad'),role:'status',text:(ok?'정답':'오답 — 정답은 '+(x.stage.answer+1)+'번')+(x.stage.explain?' · '+x.stage.explain:'')}));
  if(x.identification)card.append(el('p',{className:'correction',text:'대상 대응: '+x.identification.map(function(n,i){return (x.identificationLabels||['(가)','(나)','(다)','(라)'])[i]+' '+n;}).join(' · ')}));
  var detail=el('details',{},[el('summary',{text:'자료 해설·출처'})]);
  if(x.note)detail.append(el('p',{text:x.note}));
  x.referenceTables.forEach(function(t){detail.append(drawTable(t));});
  detail.append(el('p',{className:'source',text:x.source}));card.append(detail);
  card.append(el('button',{id:'nextQuestion',type:'button',className:'primary',onclick:function(){next();window.scrollTo({top:0});},text:'다음 문항'}));
 }
 main.append(card);
}
families.forEach(function(f){$('family').append(el('option',{value:f.id,text:f.title}));});
$('family').value=state.family;$('order').value=state.order;
$('family').onchange=function(){state.family=this.value;next();};$('order').onchange=function(){state.order=this.value;next();};
if(typeof window.addEventListener==='function'){var lastWidth=window.innerWidth;window.addEventListener('resize',function(){if(Math.abs(window.innerWidth-lastWidth)>40){lastWidth=window.innerWidth;render();}});}
// Keyboard: 1~5 choose an option, Enter goes to the next question (as on the other pages).
if(typeof document.addEventListener==='function')document.addEventListener('keydown',function(e){
 if(e.altKey||e.ctrlKey||e.metaKey||/^(INPUT|SELECT|TEXTAREA)$/.test((e.target&&e.target.tagName)||''))return;
 if(/^[1-5]$/.test(e.key)){var group=document.querySelector('#main .choices'),b=group&&group.children[+e.key-1];if(b&&!b.disabled){e.preventDefault();b.click();}}
 else if(e.key==='Enter'){var n=$('nextQuestion');if(n&&document.activeElement!==n){e.preventDefault();n.click();}}
});
next();
})();
