(function(r,f){var api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.WGGoalTables=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(data){
 var tables=data.tables.map(function(t){return{id:t.id,domain:t.domain,lecture:t.lecture,block:t.source.join(' · '),rows:t.rows.map(function(r){return r[0];}),tokens:t.rows.map(function(r){return[r[0]];}),columns:t.headers.slice(1).map(function(h,j){return{label:h,cells:t.rows.map(function(r){return r[j+1];}),askable:false};}),exams:[],goalTable:true,goalIds:t.goalIds,source:t.source,skipQuizColumns:t.skipQuizColumns||[],forwardOnly:!!t.forwardOnly};});
 function mask(s,t){var out=s; t.rows.slice().sort(function(a,b){return b.length-a.length;}).forEach(function(n){out=out.split(n).join('○○');});return out;}
 function inventory(mode,domain){
  var result=[];
  tables.filter(function(t){return domain==='all'||domain===t.domain;}).forEach(function(t){
   if(mode==='which'&&t.forwardOnly)return;
   t.columns.forEach(function(c,j){
    if(t.skipQuizColumns.includes(c.label))return;
    var values=[...new Set(c.cells.filter(Boolean))];if(values.length<2)return;
    if(mode==='what')t.rows.forEach(function(name,i){
     if(!c.cells[i])return;
     result.push({t:t,row:i,key:'goal-what|'+t.id+'|'+i+'|'+j,custom:{prompt:name+'の'.replace('の','의')+' 「'+c.label+'」에 해당하는 것은?',options:values,answer:values.indexOf(c.cells[i]),explain:name+' — '+c.label+': '+c.cells[i]}});
    });
    else values.forEach(function(v){
     var correct=t.rows.filter(function(_,i){return c.cells[i]===v;}),groups=values.map(function(x){return t.rows.filter(function(_,i){return c.cells[i]===x;}).join(' · ');});
     result.push({t:t,row:t.rows.indexOf(correct[0]),key:'goal-which|'+t.id+'|'+j+'|'+v,custom:{prompt:'이 비교표에 제시된 대상 중 「'+c.label+'」이 다음과 같은 대상을 모두 묶은 것은?',description:mask(v,t),options:groups,answer:values.indexOf(v),explain:'해당 값의 모든 대상: '+correct.join(' · ')}});
    });
   });
  });return result;
 }
 return{tables:tables,domains:[{id:'goal-oldmaps',name:'고지도 세부 비교',section:'P01'},{id:'goal-landforms',name:'지형 과정 비교',section:'P03'}],inventory:inventory};
}
return{create:create};
});
