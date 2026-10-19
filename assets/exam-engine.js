/* 기출형 문항 엔진: 1차 식별 + 후속 판단.
 *
 * A question hides 3–4 대상 as (가)~(라) behind real data (assets/exam-themes.js), asks
 * which assignment is right, then asks which <보기> statements about the identified 대상
 * are true. Statements come from assets/entity-kb.js only:
 *   fact     categorical facts of the classification sets and data/entity-facts.json
 *   both     '(가)와 (나)는 모두 …' over the same exclusive fact
 *   sign     direction of an indicator far from zero (순유입, 자연 감소)
 *   compare  background comparison on an indicator not shown in the data
 *   data     data plus background (share × population) — the ratio-versus-total trap
 * Robustness rules (see docs/EXAM-FRAMEWORK.md): identification never rests on a gap
 * below the indicator's margin or on an unstable pair; false statements only claim
 * another option of an exclusive set; comparisons need the KB margin as well.
 */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WGExamEngine=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 var LABELS=['(가)','(나)','(다)','(라)','(마)'];
 var MARKS=['ㄱ','ㄴ','ㄷ','ㄹ'];
 // The five <보기> combinations 평가원 uses most; exactly two statements are true.
 var COMBOS=[[0,1],[0,2],[1,2],[1,3],[2,3]];
 var ROUND=['①','②','③','④','⑤'];

 function seeded(seed){var a=seed>>>0;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 function shuffle(list,r){var a=list.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
 function pick(list,r){return list[Math.floor(r()*list.length)]}
 function fmt(v){var a=Math.abs(v);return v.toLocaleString('ko-KR',{maximumFractionDigits:a>=100?0:a>=10?1:2})}
 function topic(word){var c=word.charCodeAt(word.length-1);return c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?'은':'는'}
 function permutations(list){if(list.length<=1)return [list.slice()];var out=[];list.forEach(function(x,i){permutations(list.slice(0,i).concat(list.slice(i+1))).forEach(function(p){out.push([x].concat(p))})});return out}

 // Predicates follow '(가)는 …' and also '(가)와 (나)는 모두 …'.
 var PREDICATES={
  religion:function(o){return '신자 수가 가장 많은 종교가 '+o+'이다'},
  christianity:function(o){return '크리스트교 중 '+o+' 전통이 강하다'},
  islam:function(o){return '이슬람교 신자 중 '+o+'가 다수이다'},
  buddhism:function(o){return o+' 전파권에 속한다'},
  bloc:function(o,id){return id==='none'?null:o+' 회원국이다'},
  apec:function(o,id){return id==='member'?'APEC 회원국이다':null},
  euro:function(o,id){return id==='euro'?'유로를 사용한다':null},
  latinLanguage:function(o){return o+'를 대표 공용어로 사용한다'},
  exportType:function(o){return '수출에서 '+o+'의 비중이 크다'},
  capitalCity:function(o,id){return id==='same'?'수도가 최대 도시이다':'수도와 최대 도시가 다르다'},
  grainProductionTop:function(o){return o+' 생산 상위 3개국에 속한다'},
  minerals:function(o){return o+'의 대표 산지이다'},
  fossil:function(o){return o+'에 속한다'},
  beverage:function(o){return o+'의 주요 생산국이다'},
  seas:function(o){return o+'에 접해 있다'},
  landlocked:function(){return '바다와 접하지 않은 내륙국이다'},
  opec:function(){return 'OPEC 회원국이다'}
 };

 function create(kb,themeApi){
  var ready=themeApi.themes.filter(function(t){return t.status==='ready'});
  var byId={};ready.forEach(function(t){byId[t.id]=t});

  function entity(name){return kb.entities[name]}
  function value(name,ind){var e=entity(name);return e&&e.values?e.values[ind]:undefined}
  function meta(ind){return kb.indicators[ind]}
  function unstable(ind,a,b){return (meta(ind).unstablePairs||[]).some(function(p){return p.indexOf(a)>=0&&p.indexOf(b)>=0})}
  function gapOK(ind,a,b){
   var m=meta(ind).compare;if(a==null||b==null)return false;
   if(m.type==='ratio')return a>0&&b>0&&Math.max(a,b)/Math.min(a,b)>=m.min;
   return Math.abs(a-b)>=m.min;
  }
  function comparable(ind,a,b){var m=meta(ind);return !!m&&!m.disabled&&!unstable(ind,a,b)&&gapOK(ind,value(a,ind),value(b,ind))}
  function comp(theme,name){var c=kb.compositions[theme.composition];return c&&c.values[name]}
  function catLabel(theme,id){var c=kb.compositions[theme.composition];var row=c.categories.find(function(x){return x[0]===id});return row?row[1]:id}
  function ranked(theme,name){var v=comp(theme,name),ex=(theme.signature&&theme.signature.exclude)||[];return Object.keys(v).filter(function(k){return ex.indexOf(k)<0}).sort(function(a,b){return v[b]-v[a]})}

  function hasData(theme,name){
   if(!entity(name))return false;
   if(theme.kind==='items')return !!(theme.items&&theme.items[name]);
   if(theme.kind==='composition')return !!comp(theme,name)&&(!theme.totalFrom||value(name,theme.totalFrom)!=null);
   return theme.indicators.some(function(ind){return value(name,ind)!=null});
  }
  function pairs(list){var out=[];for(var i=0;i<list.length;i++)for(var j=i+1;j<list.length;j++)out.push([list[i],list[j]]);return out}

  // The shown data must separate every pair of 대상 by a robust cue.
  function identifiable(theme,chosen,shown){
   if(theme.kind==='indicators'){
    if(chosen.some(function(n){return shown.some(function(ind){return value(n,ind)==null})}))return false;
    return pairs(chosen).every(function(p){return shown.some(function(ind){return comparable(ind,p[0],p[1])})});
   }
   if(theme.kind==='items'){
    var tops=chosen.map(function(n){return theme.items[n][0][0]});
    return new Set(tops).size===tops.length;
   }
   var sig=theme.signature,margin=sig.margin;
   if(sig.depth===1){
    var top=chosen.map(function(n){return ranked(theme,n)[0]});
    if(new Set(top).size!==top.length)return false;
    return chosen.every(function(n,i){var v=comp(theme,n)[top[i]];return chosen.every(function(o){return o===n||v-comp(theme,o)[top[i]]>=margin})});
   }
   var keys=chosen.map(function(n){return ranked(theme,n).slice(0,sig.depth).join('>')});
   if(new Set(keys).size!==keys.length)return false;
   return chosen.every(function(n){var r=ranked(theme,n),v=comp(theme,n);for(var i=0;i<sig.depth;i++)if(v[r[i]]-v[r[i+1]]<margin)return false;return true});
  }

  function display(theme,chosen,shown){
   if(theme.kind==='indicators'){
    var cols=shown.map(function(ind){var m=meta(ind);return {id:ind,label:m.label,unit:m.unit}});
    var src={};shown.forEach(function(ind){var m=meta(ind);src[m.year+' · '+m.source]=1});
    return {columns:cols,rows:chosen.map(function(n,i){return {label:LABELS[i],cells:shown.map(function(ind){return fmt(value(n,ind))})}}),source:Object.keys(src).join(' / ')};
   }
   if(theme.kind==='items'){
    return {columns:[{id:'items',label:'수출 상위 품목(비중, %)',unit:''}],rows:chosen.map(function(n,i){return {label:LABELS[i],cells:[theme.items[n].map(function(x){return x[0]+' '+fmt(x[1])}).join(', ')]}}),source:theme.year+' · '+theme.source};
   }
   var c=kb.compositions[theme.composition],show=theme.show||c.categories.map(function(x){return x[0]});
   return {columns:show.map(function(id){return {id:id,label:catLabel(theme,id),unit:'%'}}),rows:chosen.map(function(n,i){return {label:LABELS[i],cells:show.map(function(id){return fmt(comp(theme,n)[id]||0)})}}),source:c.year+' · '+c.source+' · '+c.unit};
  }

  function cues(theme,chosen,shown){
   return chosen.map(function(n,i){
    var text='';
    if(theme.kind==='indicators'){
     shown.some(function(ind){
      var vs=chosen.map(function(o){return value(o,ind)}),v=value(n,ind),others=chosen.filter(function(o){return o!==n});
      var isMax=others.every(function(o){return value(o,ind)<v&&comparable(ind,n,o)}),isMin=others.every(function(o){return value(o,ind)>v&&comparable(ind,n,o)});
      if(isMax||isMin){text=meta(ind).label+(isMax?' 최대':' 최소');return true}return false;
     });
     if(!text)text='나머지 지표로 소거';
    }else if(theme.kind==='items')text=theme.items[n].slice(0,2).map(function(x){return x[0]}).join('·')+' 조합';
    else{var r=ranked(theme,n),v=comp(theme,n);text=theme.signature.depth===1?catLabel(theme,r[0])+' '+fmt(v[r[0]])+'%':r.slice(0,2).map(function(k){return catLabel(theme,k)}).join(' > ')}
    return {label:LABELS[i],name:n,cue:text};
   });
  }

  function stage1(chosen,r){
   var all=permutations(chosen),key=function(p){return p.join('|')},right=key(chosen);
   var near=all.filter(function(p){var d=p.filter(function(x,i){return x!==chosen[i]}).length;return d===2}),far=all.filter(function(p){var d=p.filter(function(x,i){return x!==chosen[i]}).length;return d>2});
   var distract=shuffle(near,r).concat(shuffle(far,r)).slice(0,4);
   var options=shuffle([chosen].concat(distract),r);
   return {options:options,answer:options.map(key).indexOf(right)};
  }

  function factExplain(set,name,actual){
   var e=entity(name),f=e.facts[set],m=kb.factSets[set]||kb.extraFacts[set];
   var labels=f.values.map(function(v){return (kb.factSets[set]&&kb.factSets[set].options[v])||v}).join('·');
   return name+' — '+(m?m.title||m.label:set)+': '+labels+(f.note?' · '+f.note:'')+(f.source?' ('+f.source+')':'');
  }
  function optionLabel(set,id){return kb.factSets[set]?kb.factSets[set].options[id]:id}
  function predicate(set,id){var p=PREDICATES[set];return p?p(optionLabel(set,id),id):null}

  function candidates(theme,chosen,shown,r){
   var out=[],L=function(n){return LABELS[chosen.indexOf(n)]};
   function add(c){if(c.text&&!out.some(function(x){return x.text===c.text}))out.push(c)}
   chosen.forEach(function(n){
    var e=entity(n);
    Object.keys(e.facts||{}).forEach(function(set){
     // A fact the shown data already reveals would make the <보기> a reading exercise.
     if((theme.reveals||[]).indexOf(set)>=0)return;
     if(theme.followups&&theme.followups.facts&&theme.followups.facts.indexOf(set)<0)return;
     var f=e.facts[set],m=kb.factSets[set];
     f.values.forEach(function(v){var p=predicate(set,v);if(p)add({kind:'fact',key:set+'|'+n,text:L(n)+'는 '+p+'.',truth:true,explain:factExplain(set,n),check:{set:set,entity:n,value:v}})});
     if(m&&m.exclusive){
      var opts=Object.keys(m.options).filter(function(o){return f.values.indexOf(o)<0&&predicate(set,o)});
      var fromOthers=[];chosen.forEach(function(o){var g=o!==n&&entity(o).facts[set];if(g)g.values.forEach(function(v){if(opts.indexOf(v)>=0)fromOthers.push(v)})});
      var o=fromOthers.length?pick(fromOthers,r):opts.length?pick(opts,r):null;
      if(o)add({kind:'fact',key:set+'|'+n,text:L(n)+'는 '+predicate(set,o)+'.',truth:false,explain:factExplain(set,n),check:{set:set,entity:n,value:o}});
     }
    });
    if(e.ns){var north=e.ns==='N',trueIt=r()<.5;add({kind:'fact',key:'ns|'+n,text:L(n)+'는 '+((north===trueIt)?'북반구':'남반구')+'에 위치한다.',truth:trueIt,explain:n+'의 국토는 '+(north?'북반구':'남반구')+'에 있다.',check:{ns:(north===trueIt)?'N':'S',entity:n}})}
    Object.keys(kb.indicators).forEach(function(ind){
     var m=meta(ind),v=value(n,ind);if(!m.sign||m.disabled||v==null||Math.abs(v)<m.sign.min||m.entityType!==e.type)return;
     var phrase=v>0?m.sign.pos:m.sign.neg,otherPhrase=v>0?m.sign.neg:m.sign.pos;
     if(phrase)add({kind:'sign',key:ind+'|'+n,text:L(n)+'는 '+phrase+'.',truth:true,explain:n+' '+m.label+' '+fmt(v)+m.unit+' ('+m.year+', '+m.source+')',check:{ind:ind,entity:n,positive:v>0}});
     if(otherPhrase)add({kind:'sign',key:ind+'|'+n,text:L(n)+'는 '+otherPhrase+'.',truth:false,explain:n+' '+m.label+' '+fmt(v)+m.unit+' ('+m.year+', '+m.source+')',check:{ind:ind,entity:n,positive:v<0}});
    });
   });
   pairs(chosen).forEach(function(p){
    var a=entity(p[0]),b=entity(p[1]);
    Object.keys(a.facts||{}).forEach(function(set){
     var m=kb.factSets[set];if(!m||!m.exclusive||!b.facts||!b.facts[set]||(theme.reveals||[]).indexOf(set)>=0)return;
     var va=a.facts[set].values[0],vb=b.facts[set].values[0],pr=predicate(set,va);if(!pr)return;
     add({kind:'both',key:set+'|'+p[0],keys:[set+'|'+p[0],set+'|'+p[1]],text:L(p[0])+'와 '+L(p[1])+'는 모두 '+pr+'.',truth:va===vb,explain:factExplain(set,p[0])+' / '+factExplain(set,p[1]),check:{set:set,a:p[0],b:p[1],value:va}});
    });
    Object.keys(kb.indicators).forEach(function(ind){
     var m=meta(ind);if(m.entityType!==a.type||shown.indexOf(ind)>=0||!comparable(ind,p[0],p[1]))return;
     var hi=value(p[0],ind)>value(p[1],ind)?p[0]:p[1],lo=hi===p[0]?p[1]:p[0],truth=r()<.5;
     var s=truth?[hi,lo]:[lo,hi];
     add({kind:'compare',key:ind+'|'+p[0]+'|'+p[1],text:L(s[0])+'는 '+L(s[1])+'보다 '+m.more+'.',truth:truth,explain:hi+' '+fmt(value(hi,ind))+m.unit+', '+lo+' '+fmt(value(lo,ind))+m.unit+' ('+m.label+', '+m.year+', '+m.source+')',check:{ind:ind,subject:s[0],object:s[1]}});
    });
    if(theme.kind==='composition'&&theme.totalFrom){
     var tm=meta(theme.totalFrom),ca=comp(theme,p[0]),cb=comp(theme,p[1]);
     (theme.show||Object.keys(ca)).forEach(function(cat){
      // Shares under 1% or within 1 point are rounding noise, not a comparison.
      if(ca[cat]<1||cb[cat]<1||Math.abs(ca[cat]-cb[cat])<1)return;
      var amtA=ca[cat]*value(p[0],theme.totalFrom)/100,amtB=cb[cat]*value(p[1],theme.totalFrom)/100;
      if(!(amtA>0&&amtB>0)||Math.max(amtA,amtB)/Math.min(amtA,amtB)<1.5)return;
      // Only the trap is worth asking: the share order and the head-count order disagree.
      var trap=(ca[cat]>cb[cat])!==(amtA>amtB);if(!trap)return;
      var hi=amtA>amtB?p[0]:p[1],lo=hi===p[0]?p[1]:p[0],truth=r()<.5,s=truth?[hi,lo]:[lo,hi];
      add({kind:'data',key:'amount|'+cat+'|'+p[0]+'|'+p[1],check:{category:cat,subject:s[0],object:s[1]},text:L(s[0])+'는 '+L(s[1])+'보다 '+catLabel(theme,cat)+' '+(theme.amountNoun||'인구')+'가 많다.',truth:truth,
       explain:'비율 × '+tm.label+': '+hi+' 약 '+fmt(Math.max(amtA,amtB))+tm.unit+', '+lo+' 약 '+fmt(Math.min(amtA,amtB))+tm.unit+' — 비율은 반대지만 '+tm.label+' 차이 때문에 실제 양은 이렇다. ('+tm.label+' '+tm.year+', '+tm.source+')'});
     });
    }
   });
   return out;
  }

  // Two true and two false statements, varied in kind, never two about the same fact.
  function chooseStatements(cands,r){
   var picked=[],used={},kinds={};
   function take(pool,need){
    var list=shuffle(pool,r);
    while(need>0&&list.length){
     list.sort(function(a,b){return (kinds[a.kind]||0)-(kinds[b.kind]||0)});
     var c=list.shift(),keys=c.keys||[c.key];if(keys.some(function(k){return used[k]}))continue;
     picked.push(c);keys.forEach(function(k){used[k]=1});kinds[c.kind]=(kinds[c.kind]||0)+1;need--;
    }
    return need===0;
   }
   if(!take(cands.filter(function(c){return c.truth}),2)||!take(cands.filter(function(c){return !c.truth}),2))return null;
   var target=Math.floor(r()*COMBOS.length),slots=[null,null,null,null],t=picked.filter(function(c){return c.truth}),f=shuffle(picked.filter(function(c){return !c.truth}),r);
   COMBOS[target].forEach(function(pos,i){slots[pos]=t[i]});
   for(var i=0;i<4;i++)if(!slots[i])slots[i]=f.shift();
   return {statements:slots.map(function(c,i){return Object.assign({mark:MARKS[i]},c)}),options:COMBOS.map(function(c,i){return {mark:ROUND[i],text:c.map(function(x){return MARKS[x]}).join(', ')}}),answer:target};
  }

  function build(opts){
   opts=opts||{};var r=opts.rng||seeded(opts.seed==null?Math.floor(Math.random()*4294967296):opts.seed);
   var pool=opts.themeId?[byId[opts.themeId]].filter(Boolean):ready;
   for(var attempt=0;attempt<200&&pool.length;attempt++){
    var theme=pick(pool,r),avail=theme.pool.filter(function(n){return hasData(theme,n)});
    var k=theme.pick[0]+Math.floor(r()*(theme.pick[1]-theme.pick[0]+1));if(avail.length<k)continue;
    var chosen=shuffle(avail,r).slice(0,k),shown=[];
    if(theme.kind==='indicators'){
     var inds=theme.indicators.filter(function(ind){return meta(ind)&&!meta(ind).disabled});
     shown=shuffle(inds,r).slice(0,theme.show);
    }
    if(!identifiable(theme,chosen,shown))continue;
    var s2=chooseStatements(candidates(theme,chosen,shown,r),r);if(!s2)continue;
    var s1=stage1(chosen,r);
    return {theme:theme,labels:LABELS.slice(0,k),entities:chosen,shown:shown,display:display(theme,chosen,shown),
     stage1:{question:LABELS[0]+'~'+LABELS[k-1]+'에 해당하는 것으로 옳은 것은?',options:s1.options,answer:s1.answer,cues:cues(theme,chosen,shown)},
     stage2:{question:LABELS[0]+'~'+LABELS[k-1]+'에 대한 설명으로 옳은 것만을 <보기>에서 고른 것은?',statements:s2.statements,options:s2.options,answer:s2.answer}};
   }
   return null;
  }
  return {themes:ready,build:build,identifiable:identifiable,candidates:candidates,comparable:comparable,value:value,comp:comp,seeded:seeded,LABELS:LABELS,COMBOS:COMBOS};
 }
 return {create:create,seeded:seeded,topic:topic};
});
