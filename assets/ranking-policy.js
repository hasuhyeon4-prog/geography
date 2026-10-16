/* Fixed-year answers are exact; temporal uncertainty changes the question pool. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WGRankingPolicy=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function shownValue(r,x){return Number(x.toFixed(r.digits))}
 function equal(r,a,b){return shownValue(r,a.value)===shownValue(r,b.value)}
 function unstable(r,a,b){return ((r.audit&&r.audit.unstablePairs)||[]).some(function(p){return p.includes(a.name)&&p.includes(b.name)})}
 function allowed(r,a,b,explicit){return !equal(r,a,b)&&(explicit||!unstable(r,a,b))}
 function canQuiz(r,explicit){return explicit||!(r.audit&&r.audit.quizDisabled)}
 function orderCorrect(r,options,seq){
  if(seq.length!==options.length||new Set(seq).size!==options.length||seq.some(function(n){return !options.includes(n)}))return false;
  var items={};r.items.forEach(function(i){items[i.name]=i});
  for(var i=1;i<seq.length;i++){
   var a=items[seq[i-1]],b=items[seq[i]];
   if(!a||!b||a.value<b.value&&!equal(r,a,b))return false;
  }
  return true;
 }
 return {equal:equal,unstable:unstable,allowed:allowed,canQuiz:canQuiz,orderCorrect:orderCorrect};
});
