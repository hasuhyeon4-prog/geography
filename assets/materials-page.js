(function(){
'use strict';
var $=function(id){return document.getElementById(id);},DATA=window.WGMaterialsData,M=window.WGMaterials,C=window.WGMaterialCharts;
if(!DATA||!M||!C){$('main').textContent='자료를 불러오지 못했어요. 새로고침해 주세요.';return;}
var engine=M.create(DATA),saved={};
try{saved=JSON.parse(localStorage.getItem('wg_materials_v1')||'{}');}catch(e){}
if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};
var stats=saved.stats&&typeof saved.stats==='object'&&!Array.isArray(saved.stats)?saved.stats:{};
var review=Array.isArray(saved.review)?saved.review.filter(function(x){return x&&Number.isSafeInteger(x.seed)&&engine.families.some(function(f){return f.id===x.family;});}):[];
var state={family:engine.families.some(function(f){return f.id===saved.family;})?saved.family:'all',order:['weak','random','review'].includes(saved.order)?saved.order:'weak',seed:Number.isSafeInteger(saved.seed)?saved.seed:1,q:null,a1:null,a2:null,right:0,total:0,error:null};
function save(){try{localStorage.setItem('wg_materials_v1',JSON.stringify({family:state.family,order:state.order,seed:state.seed,stats:stats,review:review}));}catch(e){}}
function el(tag,props,kids){var e=document.createElement(tag);Object.keys(props||{}).forEach(function(k){if(k==='text')e.textContent=props[k];else if(k==='onclick')e.onclick=props[k];else if(k==='className')e.className=props[k];else e.setAttribute(k,props[k]);});(kids||[]).forEach(function(c){if(c!=null)e.appendChild(typeof c==='string'?document.createTextNode(c):c);});return e;}
function pool(){return engine.families.filter(function(f){return state.family==='all'||state.family===f.id;});}
function chooseFamily(){var p=pool(),weights=p.map(function(f){var s=stats[f.id]||{right:0,wrong:0};return state.order==='weak'?1+(s.wrong+1)/(s.right+1):1;}),v=Math.random()*weights.reduce(function(a,b){return a+b;},0);for(var i=0;i<p.length;i++){v-=weights[i];if(v<=0)return p[i].id;}return p[p.length-1].id;}
function next(){
 state.a1=null;state.a2=null;state.error=null;
 var pending=review.filter(function(x){return state.family==='all'||x.family===state.family;}),id,seed;
 if(state.order==='review'){
  if(!pending.length){state.q=null;render();return;}
  var x=pending[0];id=x.family;seed=x.seed;
 }else{id=chooseFamily();seed=state.seed++;}
 try{state.q=engine.build(id,seed);}catch(e){state.q=null;state.error='이 주제의 자료를 표시하지 못했어요. 다른 주제를 선택하거나 새로고침해 주세요.';}
 save();render();
}
function choices(stage,answer,onpick){
 return el('div',{className:'choices'},stage.options.map(function(text,i){return el('button',{type:'button',className:answer===null?'':i===stage.answer?'correct':i===answer?'wrong':'',...(answer===null?{}:{disabled:'disabled'}),onclick:function(){onpick(i);},text:(i+1)+'. '+text});}));
}
function answer1(i){if(!state.q||state.a1!==null)return;state.a1=i;render();}
function answer2(i){
 if(!state.q||state.a1===null||state.a2!==null)return;state.a2=i;
 var q=state.q,ok=state.a1===q.stage1.answer&&i===q.stage2.answer;
 state.total++;if(ok)state.right++;
 var h=stats[q.id]||(stats[q.id]={right:0,wrong:0});h[ok?'right':'wrong']++;
 var key=q.id+'|'+q.seed;review=review.filter(function(x){return x.family+'|'+x.seed!==key;});
 if(!ok)review.push({family:q.id,seed:q.seed});
 save();render();
 var b=$('nextQuestion');if(b)b.focus({preventScroll:true});
}
function drawTable(t){return el('div',{className:'scroll'},[el('table',{},[el('caption',{text:t.caption||''}),el('thead',{},[el('tr',{},t.headers.map(function(h){return el('th',{scope:'col',text:String(h)});}))]),el('tbody',{},t.rows.map(function(row){return el('tr',{},row.map(function(v){return el('td',{text:typeof v==='number'?v.toLocaleString('ko-KR',{maximumFractionDigits:3}):String(v)});}));}))])]);}
function render(){
 var main=$('main');main.textContent='';$('score').textContent=state.right+' / '+state.total+' · 다시 풀기 '+review.length;
 if(!state.q){main.append(el('section',{className:'card empty'},[el('p',{text:state.error||'이 범위에 다시 풀 문항이 없어요.'}),el('a',{href:'exam.html',text:'기출형으로 돌아가기'})]));return;}
 var q=state.q,card=el('section',{className:'card'},[el('h2',{text:q.title}),el('p',{className:'note',text:q.note})]);
 q.figures.forEach(function(f){var frame=el('div',{className:'figure'});frame.innerHTML=C.render(f);card.append(frame);});
 if(q.figures.length)card.append(el('p',{className:'chartHint',text:'작은 화면에서는 그래프를 좌우로 밀어 볼 수 있어요.'}));
 q.tables.forEach(function(t){card.append(drawTable(t));});
 main.append(card);
 var s1=el('section',{className:'card'},[el('h3',{text:'1. '+q.stage1.question}),choices(q.stage1,state.a1,answer1)]);
 if(state.a1!==null)s1.append(el('div',{className:'feedback',text:(state.a1===q.stage1.answer?'정답. ':'정답은 '+(q.stage1.answer+1)+'번. ')+q.stage1.explain}));
 main.append(s1);
 if(state.a1!==null){
  var s2=el('section',{className:'card'},[el('h3',{text:'2. '+q.stage2.question}),el('ul',{className:'statements'},q.statements.map(function(s){return el('li',{},[el('span',{text:s.mark+'. '+s.text}),state.a2===null?null:el('div',{className:'correction',text:(s.truth?'O · ':'X · ')+s.explain})]);})),choices(q.stage2,state.a2,answer2)]);
  if(state.a2!==null){s2.append(el('div',{className:'feedback',text:state.a2===q.stage2.answer?'정답.':'정답은 '+(q.stage2.answer+1)+'번이에요.'}),el('p',{className:'source',text:q.source}),el('button',{id:'nextQuestion',type:'button',className:'primary',onclick:function(){next();window.scrollTo({top:0});},text:'다음 문항'}));}
  main.append(s2);
 }
}
engine.families.forEach(function(f){$('family').append(el('option',{value:f.id,text:f.title}));});
$('family').value=state.family;$('order').value=state.order;
$('family').onchange=function(){state.family=this.value;next();};$('order').onchange=function(){state.order=this.value;next();};
next();
})();
