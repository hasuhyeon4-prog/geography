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
    var values=[...new Set(c.cells.filter(Boolean))];if(!values.length)return;
    // Two values make a coin flip; two-row tables are asked as pairs below instead.
    if(mode==='what')t.rows.forEach(function(name,i){
     if(!c.cells[i]||values.length<3)return;
     var opts=choices(values,c.cells[i],i+j);
     result.push({t:t,row:i,col:j,key:'goal-what|'+t.id+'|'+i+'|'+j,custom:{prompt:'이 비교표에서 '+name+'의 「'+c.label+'」 서술과 일치하는 것은?',options:opts,answer:0,explain:name+' — '+c.label+': '+c.cells[i]}});
    });
    else values.forEach(function(v,vi){
     var correct=t.rows.filter(function(_,i){return c.cells[i]===v;}),groups=values.map(function(x){return t.rows.filter(function(_,i){return c.cells[i]===x;}).join(' · ');});
     var answer=correct.join(' · ');
     // A shared property has the complete set as its answer, and incomplete
     // sets as distractors. Never choose a single member of a duplicate value.
     if(values.length===1){if(correct.length<2)return;groups=[answer].concat(correct.slice(0,4));}
     // With two values the other group is the only wrong set, so an incomplete
     // set or one with an extra row is added to avoid a coin flip.
     if(groups.length<3){
      if(correct.length>=2)correct.forEach(function(_,k){groups.push(correct.filter(function(_,m){return m!==k;}).join(' · '));});
      t.rows.forEach(function(n){if(!correct.includes(n))groups.push(t.rows.filter(function(x){return correct.includes(x)||x===n;}).join(' · '));});
      groups=[...new Set(groups)];if(groups.length<3)return;
     }
     var opts=choices(groups,answer,vi+j);
     result.push({t:t,row:t.rows.indexOf(correct[0]),col:j,key:'goal-which|'+t.id+'|'+j+'|'+v,custom:{prompt:'이 비교표에 제시된 대상 중 「'+c.label+'」이 다음과 같은 대상을 빠짐없이 묶은 것은?',description:mask(v,t),options:opts,answer:0,explain:'해당 값의 모든 대상: '+answer}});
    });
   });
  });
  // A two-row table asks for a row's whole set of cells: each wrong option swaps
  // one or two columns to the other row's cell.
  if(mode==='what')tables.filter(function(t){return(domain==='all'||domain===t.domain)&&t.rows.length===2;}).forEach(function(t){
   var cols=t.columns.filter(function(c){return!t.skipQuizColumns.includes(c.label)&&c.cells[0]&&c.cells[1]&&c.cells[0]!==c.cells[1];});
   if(cols.length<2)return;
   t.rows.forEach(function(name,i){
    var pick=function(flip){return cols.map(function(c,k){return c.label+': '+c.cells[flip.includes(k)?1-i:i];}).join(' / ');};
    var opts=[pick([]),pick([0]),pick([1]),pick(cols.length>2?[2]:[0,1])];
    result.push({t:t,row:i,cols:cols.map(function(c){return t.columns.indexOf(c);}),key:'goal-pair|'+t.id+'|'+i,custom:{prompt:'이 비교표에서 '+name+'에 해당하는 서술을 바르게 묶은 것은?',options:opts,answer:0,explain:name+' — '+pick([])}});
   });
  });
  (data.questions||[]).forEach(function(q){
   var source=tables.find(function(t){return t.id===q.table;});if(!source)throw Error('Unknown question table '+q.table);
   if(domain!=='all'&&domain!==source.domain)return;
   var t=Object.assign({},source,{goalIds:q.goalIds});
   result.push({t:t,row:0,key:'goal-relation|'+mode+'|'+q.id,custom:{prompt:q.prompt,options:q.options,answer:q.answer,explain:q.explain}});
  });
  return result;
 }
 function choices(values,correct,start){
  var wrong=values.filter(function(v){return v!==correct;}),out=[correct];
  for(var i=0;i<Math.min(4,wrong.length);i++)out.push(wrong[(start+i)%wrong.length]);
  return out;
 }
 return{tables:tables,domains:(data.domains||[{id:'goal-oldmaps',name:'고지도 세부 비교',section:'P01'},{id:'goal-landforms',name:'지형 과정 비교',section:'P03'}]).filter(function(d){return tables.some(function(t){return t.domain===d.id;});}),inventory:inventory};
}
return{create:create};
});
