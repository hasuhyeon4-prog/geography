/* 기출형 문항 엔진: 1차 식별 + 후속 판단.
 *
 * A question hides 3–4 대상 as (가)~(라) behind real data (assets/exam-themes.js), asks
 * which assignment is right, then asks which <보기> statements about the identified 대상
 * are true. Background knowledge comes only from the verified whitelist in assets/entity-kb.js
 * (data/exam-relations.json checked in every year of its window, status 'active'):
 *   fact     categorical facts of the classification sets and data/entity-facts.json
 *   both     '(가)와 (나)는 모두 …' over the same exclusive fact
 *   sign     whitelisted direction (순유입, 자연 감소) on an indicator not shown
 *   compare  whitelisted comparison on an indicator not shown
 *   data     computed from the shown table: share × total of the same year (the trap)
 * Identification: the true assignment must be the only one the shown data allow under the
 * whitelisted relations and composition orders, so it never rests on an unchecked gap.
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
 function subjectParticle(word){var c=word.charCodeAt(word.length-1);return c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?'이':'가'}
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
  function active(x){return x.status==='active'}
  var REL=(kb.relations||[]).filter(active),SIGNS=(kb.signs||[]).filter(active);
  // The longest verified order of each 대상 in each composition.
  var ORDERS={};
  (kb.orders||[]).filter(active).forEach(function(o){var c=ORDERS[o.composition]||(ORDERS[o.composition]={}),cur=c[o.entity];if(!cur||o.order.length>cur.order.length)c[o.entity]=o});

  function entity(name){return kb.entities[name]}
  function value(name,ind){var e=entity(name);return e&&e.values?e.values[ind]:undefined}
  function meta(ind){return kb.indicators[ind]}
  function relation(ind,a,b){for(var i=0;i<REL.length;i++){var x=REL[i];if(x.indicator===ind&&(x.hi===a&&x.lo===b||x.hi===b&&x.lo===a))return x}return null}
  function clearlyAbove(ind,x,y){var m=meta(ind).compare;if(x==null||y==null)return false;return m.type==='ratio'?x>0&&y>0&&x/y>=m.min:x-y>=m.min}
  function composition(theme){return kb.compositions[theme.composition]}
  function comp(theme,name){var c=composition(theme);return c&&c.values[name]}
  function total(theme,name){var c=composition(theme);return c&&c.total?c.total.values[name]:undefined}
  function catLabel(theme,id){var row=composition(theme).categories.find(function(x){return x[0]===id});return row?row[1]:id}
  function orderOf(theme,name){var c=ORDERS[theme.composition];return c&&c[name]||null}
  // Which options each region holds. A false claim must name something a country of the same
  // region really has, so "우간다는 APEC 회원국이다" never serves as a free distractor.
  var HOLDERS={};
  Object.keys(kb.entities).forEach(function(n){var e=kb.entities[n];if(!e.region)return;Object.keys(e.facts||{}).forEach(function(set){var h=HOLDERS[set]||(HOLDERS[set]={}),g=h[e.region]||(h[e.region]={});e.facts[set].values.forEach(function(v){g[v]=1})})});
  function plausible(set,name,v){var e=entity(name),g=e&&e.region&&HOLDERS[set]&&HOLDERS[set][e.region];return !!(g&&g[v])}
  // A hemisphere is worth a <보기> only for a country within this many degrees of the equator.
  var NEAR_EQUATOR=25;
  function allowed(theme,set){var f=theme.followups&&theme.followups.facts;return !f||f.indexOf(set)>=0}
  function koSort(a,b){return a.localeCompare(b,'ko')}
  function span(x,ind){if(!x.years)return '';var m=ind&&meta(ind);return m&&m.static?x.years.join('·')+'년 기준':x.years[0]+'~'+x.years[1]+'년 매년'}

  function hasData(theme,name){
   if(!entity(name))return false;
   if(theme.kind==='items')return !!(theme.items&&theme.items[name]);
   if(theme.kind==='composition')return !!comp(theme,name)&&(!composition(theme).total||total(theme,name)!=null);
   return (theme.always||[]).every(function(ind){return value(name,ind)!=null})&&theme.indicators.some(function(ind){return value(name,ind)!=null});
  }
  function pairs(list){var out=[];for(var i=0;i<list.length;i++)for(var j=i+1;j<list.length;j++)out.push([list[i],list[j]]);return out}

  // What a student may bring to the shown data: verified relations among the chosen 대상
  // on the shown indicators, verified composition orders, or the theme's own item table.
  function known(theme,chosen,shown){
   var has=function(n){return chosen.indexOf(n)>=0};
   if(theme.kind==='indicators')return {
    relations:REL.filter(function(x){return shown.indexOf(x.indicator)>=0&&has(x.hi)&&has(x.lo)}),
    signs:SIGNS.filter(function(x){return shown.indexOf(x.indicator)>=0&&has(x.entity)})};
   if(theme.kind==='composition'){var c=composition(theme);return {orders:chosen.map(function(n){return orderOf(theme,n)}).filter(Boolean),
    relations:c.total&&c.total.indicator?REL.filter(function(x){return x.indicator===c.total.indicator&&has(x.hi)&&has(x.lo)}):[]};}
   return {items:chosen.map(function(n){return {entity:n,top:theme.items[n][0][0]}})};
  }
  // A row clearly breaks an order when a category ranked below beats it by the margin.
  function orderBroken(c,order,v){
   var rest=c.categories.map(function(x){return x[0]}).filter(function(k){return order.indexOf(k)<0&&c.rankExclude.indexOf(k)<0});
   return order.some(function(k,i){return (i+1<order.length?[order[i+1]]:rest).some(function(b){return (v[b]||0)-(v[k]||0)>=c.orderMargin})});
  }
  // perm[i] is the 대상 a student would put on the row that holds chosen[i]'s data. The
  // assignment is ruled out only by a clear contradiction; a near tie stays possible.
  function consistent(theme,chosen,k,perm){
   var row={};perm.forEach(function(n,i){row[n]=chosen[i]});
   if(theme.kind==='indicators')
    return k.relations.every(function(x){return !clearlyAbove(x.indicator,value(row[x.lo],x.indicator),value(row[x.hi],x.indicator))})&&
     k.signs.every(function(x){var v=value(row[x.entity],x.indicator),min=meta(x.indicator).sign.min;return x.positive?v>-min:v<min});
   if(theme.kind==='composition'){var c=composition(theme);return k.orders.every(function(o){return !orderBroken(c,o.order,comp(theme,row[o.entity]))})&&
    (k.relations||[]).every(function(x){return !clearlyAbove(x.indicator,total(theme,row[x.lo]),total(theme,row[x.hi]))});}
   return k.items.every(function(x){return theme.items[row[x.entity]][0][0]===x.top});
  }
  // Identification holds when the true assignment is the only one left.
  function identifiable(theme,chosen,shown){
   if(theme.kind==='indicators'&&chosen.some(function(n){return shown.some(function(ind){return value(n,ind)==null})}))return false;
   var k=known(theme,chosen,shown),left=permutations(chosen).filter(function(p){return consistent(theme,chosen,k,p)});
   return left.length===1&&left[0].join('|')===chosen.join('|');
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
   var c=composition(theme),show=theme.show||c.categories.map(function(x){return x[0]});
   var cols=show.map(function(id){return {id:id,label:catLabel(theme,id),unit:'%'}});
   if(c.total)cols.push({id:c.total.indicator||'total',label:c.total.label,unit:c.total.unit});
   return {columns:cols,rows:chosen.map(function(n,i){return {label:LABELS[i],cells:show.map(function(id){return fmt(comp(theme,n)[id]||0)}).concat(c.total?[fmt(total(theme,n))]:[])}}),
    source:c.year+' · '+c.source+' · '+c.unit+(c.total?' · '+c.total.label+'도 '+c.total.year+'년 같은 출처':'')};
  }

  function cues(theme,chosen,shown){
   var k=known(theme,chosen,shown);
   return chosen.map(function(n,i){
    var parts=[];
    if(theme.kind==='indicators'){
     // One line per indicator: who is known to be above and below this 대상.
     shown.forEach(function(ind){
      var up=[],down=[];
      k.relations.forEach(function(x){if(x.indicator!==ind)return;if(x.lo===n)up.push(x.hi);if(x.hi===n)down.push(x.lo)});
      var chain=[up.join('·'),n,down.join('·')].filter(Boolean);
      if(chain.length>1)parts.push(meta(ind).label+' '+chain.join(' > '));
     });
     k.signs.forEach(function(x){if(x.entity===n)parts.push(meta(x.indicator).label+(x.positive?' 양(+)':' 음(−)'))});
    }else if(theme.kind==='composition'){var o=orderOf(theme,n);if(o)parts.push(o.order.map(function(id){return catLabel(theme,id)}).join(' > ')+(o.order.length===1?' 1위':''));
     (k.relations||[]).forEach(function(x){if(x.hi===n||x.lo===n)parts.push(meta(x.indicator).label+' '+x.hi+' > '+x.lo)});}
    else parts.push(theme.items[n].slice(0,2).map(function(x){return x[0]}).join('·')+' 조합');
    return {label:LABELS[i],name:n,cue:parts.length?parts.slice(0,3).join(' · '):'나머지 대상(소거)'};
   });
  }

  function stage1(chosen,r){
   var all=permutations(chosen),key=function(p){return p.join('|')},right=key(chosen);
   var near=all.filter(function(p){var d=p.filter(function(x,i){return x!==chosen[i]}).length;return d===2}),far=all.filter(function(p){var d=p.filter(function(x,i){return x!==chosen[i]}).length;return d>2});
   var distract=shuffle(near,r).concat(shuffle(far,r)).slice(0,4);
   var options=shuffle([chosen].concat(distract),r);
   return {options:options,answer:options.map(key).indexOf(right)};
  }

  function factExplain(set,name){
   var e=entity(name),f=e.facts[set],m=kb.factSets[set]||kb.extraFacts[set];
   var labels=f.values.map(function(v){return (kb.factSets[set]&&kb.factSets[set].options[v])||v}).join('·');
   return name+' — '+(m?m.title||m.label:set)+': '+labels+(f.note?' · '+f.note:'')+(f.source?' ('+f.source+')':'');
  }
  function optionLabel(set,id){return kb.factSets[set]?kb.factSets[set].options[id]:id}
  function predicate(set,id){var p=PREDICATES[set];return p?p(optionLabel(set,id),id):null}

  // Share-versus-total traps read from the table: amounts differ by 1.5× (composition) or
  // 1.2× (indicators) and run against the order of the shares, so rounding never decides.
  function trap(p,rateA,rateB,amtA,amtB,minRatio){
   if(!(amtA>0&&amtB>0)||Math.abs(rateA-rateB)<1||Math.max(amtA,amtB)/Math.min(amtA,amtB)<minRatio)return null;
   if((rateA>rateB)===(amtA>amtB))return null;
   return amtA>amtB?[p[0],p[1]]:[p[1],p[0]];
  }

  function candidates(theme,chosen,shown,r){
   var out=[],L=function(n){return LABELS[chosen.indexOf(n)]},has=function(n){return chosen.indexOf(n)>=0};
   function add(c){if(c.text&&!out.some(function(x){return x.text===c.text}))out.push(c)}
   chosen.forEach(function(n){
    var e=entity(n);
    Object.keys(e.facts||{}).forEach(function(set){
     // A fact the shown data already reveals would make the <보기> a reading exercise.
     if((theme.reveals||[]).indexOf(set)>=0)return;
     if(!allowed(theme,set))return;
     var f=e.facts[set],m=kb.factSets[set];
     f.values.forEach(function(v){var p=predicate(set,v);if(p)add({kind:'fact',key:set+'|'+n,text:L(n)+'는 '+p+'.',truth:true,explain:factExplain(set,n),check:{set:set,entity:n,value:v}})});
     if(m&&m.exclusive){
      var opts=Object.keys(m.options).filter(function(o){return f.values.indexOf(o)<0&&predicate(set,o)&&plausible(set,n,o)});
      var fromOthers=[];chosen.forEach(function(o){var g=o!==n&&entity(o).facts[set];if(g)g.values.forEach(function(v){if(opts.indexOf(v)>=0)fromOthers.push(v)})});
      var o=fromOthers.length?pick(fromOthers,r):opts.length?pick(opts,r):null;
      if(o)add({kind:'fact',key:set+'|'+n,text:L(n)+'는 '+predicate(set,o)+'.',truth:false,explain:factExplain(set,n),check:{set:set,entity:n,value:o}});
     }
    });
    if(e.ns&&e.eqDist<=NEAR_EQUATOR&&allowed(theme,'hemisphere')){var north=e.ns==='N',trueIt=r()<.5;add({kind:'fact',key:'ns|'+n,text:L(n)+'는 '+((north===trueIt)?'북반구':'남반구')+'에 위치한다.',truth:trueIt,explain:n+'의 국토는 '+(north?'북반구':'남반구')+'에 있다.',check:{ns:(north===trueIt)?'N':'S',entity:n}})}
   });
   SIGNS.forEach(function(x){
    if(!has(x.entity)||shown.indexOf(x.indicator)>=0)return;
    var m=meta(x.indicator),v=value(x.entity,x.indicator),yes=x.positive?m.sign.pos:m.sign.neg,no=x.positive?m.sign.neg:m.sign.pos;
    var why=x.entity+' '+m.label+' '+fmt(v)+m.unit+' ('+m.year+', '+m.source+') · '+span(x,x.indicator)+' '+(x.positive?'양(+)':'음(−)')+' · 근거: '+x.basis;
    if(yes)add({kind:'sign',key:x.indicator+'|'+x.entity,text:L(x.entity)+'는 '+yes+'.',truth:true,explain:why,check:{ind:x.indicator,entity:x.entity,positive:x.positive}});
    if(no)add({kind:'sign',key:x.indicator+'|'+x.entity,text:L(x.entity)+'는 '+no+'.',truth:false,explain:why,check:{ind:x.indicator,entity:x.entity,positive:!x.positive}});
   });
   REL.forEach(function(x){
    if(!has(x.hi)||!has(x.lo)||shown.indexOf(x.indicator)>=0||meta(x.indicator).entityType!==entity(x.hi).type)return;
    var m=meta(x.indicator),truth=r()<.5,s=truth?[x.hi,x.lo]:[x.lo,x.hi];
    add({kind:'compare',key:x.indicator+'|'+[x.hi,x.lo].sort().join('|'),text:L(s[0])+'는 '+L(s[1])+'보다 '+m.more+'.',truth:truth,
     explain:x.hi+' '+fmt(value(x.hi,x.indicator))+m.unit+', '+x.lo+' '+fmt(value(x.lo,x.indicator))+m.unit+' ('+m.label+', '+m.year+', '+m.source+') · '+span(x,x.indicator)+' 같은 순서 · 근거: '+x.basis,
     check:{ind:x.indicator,subject:s[0],object:s[1]}});
   });
   pairs(chosen).forEach(function(p){
    var a=entity(p[0]),b=entity(p[1]);
    Object.keys(a.facts||{}).forEach(function(set){
     var m=kb.factSets[set];if(!m||!m.exclusive||!b.facts||!b.facts[set]||(theme.reveals||[]).indexOf(set)>=0||!allowed(theme,set))return;
     var va=a.facts[set].values[0],vb=b.facts[set].values[0],pr=predicate(set,va);if(!pr)return;
     if(va!==vb&&!plausible(set,p[1],va))return;
     add({kind:'both',key:set+'|'+p[0],keys:[set+'|'+p[0],set+'|'+p[1]],text:L(p[0])+'와 '+L(p[1])+'는 모두 '+pr+'.',truth:va===vb,explain:factExplain(set,p[0])+' / '+factExplain(set,p[1]),check:{set:set,a:p[0],b:p[1],value:va}});
    });
    if(theme.kind==='composition'&&composition(theme).total){
     var c=composition(theme),ca=comp(theme,p[0]),cb=comp(theme,p[1]),ta=total(theme,p[0]),tb=total(theme,p[1]);
     (theme.show||Object.keys(ca)).forEach(function(cat){
      if(ca[cat]<1||cb[cat]<1)return;
      var amtA=ca[cat]*ta/100,amtB=cb[cat]*tb/100,s0=trap(p,ca[cat],cb[cat],amtA,amtB,1.5);if(!s0)return;
      var truth=r()<.5,s=truth?s0:[s0[1],s0[0]],amt=function(n){return n===p[0]?amtA:amtB};
      var noun=catLabel(theme,cat)+' '+(theme.amountNoun||'인구');
      add({kind:'data',key:'amount|'+cat+'|'+p[0]+'|'+p[1],check:{category:cat,subject:s[0],object:s[1]},text:L(s[0])+'는 '+L(s[1])+'보다 '+noun+subjectParticle(noun)+' 많다.',truth:truth,
       explain:'표의 비율 × '+c.total.label+': '+s0[0]+' 약 '+fmt(amt(s0[0]))+c.total.unit+', '+s0[1]+' 약 '+fmt(amt(s0[1]))+c.total.unit+' — 비율은 반대지만 '+c.total.label+' 차이 때문에 실제 수는 이렇다. (비율·'+c.total.label+' 모두 '+c.year+'년 '+c.source+')'});
     });
    }
    if(theme.kind==='indicators')(theme.derived||[]).forEach(function(d){
     if(shown.indexOf(d.rate)<0||shown.indexOf(d.total)<0)return;
     var rm=meta(d.rate),tm=meta(d.total),ra=value(p[0],d.rate),rb=value(p[1],d.rate),ta=value(p[0],d.total),tb=value(p[1],d.total);
     var amtA=ta*ra/d.per,amtB=tb*rb/d.per,s0=trap(p,ra,rb,amtA,amtB,1.2);if(!s0)return;
     var truth=r()<.5,s=truth?s0:[s0[1],s0[0]];
     var line=function(n){return n+' '+fmt(value(n,d.total))+tm.unit+' × '+fmt(value(n,d.rate))+rm.unit+' ≈ '+fmt(value(n,d.total)*value(n,d.rate)/d.per)+tm.unit};
     add({kind:'data',key:'derived|'+d.rate+'|'+p[0]+'|'+p[1],check:{rate:d.rate,total:d.total,per:d.per,subject:s[0],object:s[1]},text:L(s[0])+'는 '+L(s[1])+'보다 '+d.noun+'가 많다.',truth:truth,
      explain:'표의 '+tm.label+' × '+rm.label+': '+line(s0[0])+', '+line(s0[1])+' — '+rm.label+'은 반대지만 '+tm.label+' 차이 때문에 '+d.noun+'는 이렇다. ('+rm.year+', '+rm.source+')'});
    });
   });
   return out;
  }

  // Two true and two false statements, never two about the same fact. Up to three come from
  // the theme itself (comparisons, signs, data items, and the theme's focus fact sets); the
  // rest are background facts, with at most one '(가)와 (나)는 모두 …'.
  function chooseStatements(theme,cands,r){
   var focusSets=(theme.followups&&theme.followups.focus)||[];
   function isFocus(c){return c.kind==='compare'||c.kind==='sign'||c.kind==='data'||!!(c.check&&c.check.set&&focusSets.indexOf(c.check.set)>=0)}
   var picked=[],used={},kinds={},both=0;
   function take(pool,truth,need){
    var list=shuffle(pool.filter(function(c){return c.truth===truth}),r),got=0;
    while(got<need&&list.length){
     list.sort(function(a,b){return (kinds[a.kind]||0)-(kinds[b.kind]||0)});
     var c=list.shift(),keys=c.keys||[c.key];
     if(keys.some(function(k){return used[k]})||c.kind==='both'&&both)continue;
     picked.push(c);keys.forEach(function(k){used[k]=1});kinds[c.kind]=(kinds[c.kind]||0)+1;if(c.kind==='both')both++;got++;
    }
    return got;
   }
   var focus=cands.filter(isFocus),rest=cands.filter(function(c){return !isFocus(c)});
   var ft=r()<.5?2:1,t=take(focus,true,ft),f=take(focus,false,3-ft);
   t+=take(rest,true,2-t);f+=take(rest,false,2-f);
   t+=take(focus,true,2-t);f+=take(focus,false,2-f);
   if(t<2||f<2)return null;
   var target=Math.floor(r()*COMBOS.length),slots=[null,null,null,null],tr=picked.filter(function(c){return c.truth}),fa=shuffle(picked.filter(function(c){return !c.truth}),r);
   COMBOS[target].forEach(function(pos,i){slots[pos]=tr[i]});
   for(var i=0;i<4;i++)if(!slots[i])slots[i]=fa.shift();
   return {statements:slots.map(function(c,i){return Object.assign({mark:MARKS[i]},c)}),options:COMBOS.map(function(c,i){return {mark:ROUND[i],text:c.map(function(x){return MARKS[x]}).join(', ')}}),answer:target};
  }

  // With two 대상 the answer is chosen among four named countries, so stage 1 has five options:
  // the right pair and four pairs that the shown data and verified relations rule out. When no
  // four can be ruled out, the best set with at least two is used (three or four options).
  function pairStage(theme,chosen,shown,avail,r){
   // Try first the countries tied to the pair by a verified relation on the shown columns.
   var ties=function(n){return REL.filter(function(x){return shown.indexOf(x.indicator)>=0&&(x.hi===n&&chosen.indexOf(x.lo)>=0||x.lo===n&&chosen.indexOf(x.hi)>=0)}).length};
   var others=shuffle(avail.filter(function(n){return chosen.indexOf(n)<0}),r).map(function(n){return [ties(n),n]}).sort(function(a,b){return b[0]-a[0]}).slice(0,8).map(function(x){return x[1]});
   var best=null;
   search:for(var i=0;i<others.length;i++)for(var j=i+1;j<others.length;j++){
    var names=chosen.concat([others[i],others[j]]),wrong=[];
    names.forEach(function(a){names.forEach(function(b){
     if(a===b||a===chosen[0]&&b===chosen[1])return;
     if(!consistent(theme,chosen,known(theme,[a,b],shown),[a,b]))wrong.push([a,b]);
    })});
    if(!best||wrong.length>best.wrong.length)best={names:names,extra:[others[i],others[j]],wrong:wrong};
    if(wrong.length>=4)break search;
   }
   if(!best||best.wrong.length<2)return null;
   var options=shuffle([chosen].concat(shuffle(best.wrong,r).slice(0,4)),r);
   return {candidates:best.names.slice().sort(koSort),extra:best.extra,options:options,answer:options.map(function(p){return p.join('|')}).indexOf(chosen.join('|'))};
  }

  // Most draws start from a verified relation between two 대상 in the pool and add 대상
  // linked to them, so questions centre on the comparisons exams make; the rest are random.
  function draw(theme,avail,k,r){
   var has=function(list,n){return list.indexOf(n)>=0};
   var rels=theme.kind==='indicators'?REL.filter(function(x){return has(avail,x.hi)&&has(avail,x.lo)}):[];
   if(!rels.length||r()<.25)return shuffle(avail,r).slice(0,k);
   var first=pick(rels,r),chosen=[first.hi,first.lo];
   while(chosen.length<k){
    var linked=rels.filter(function(x){return has(chosen,x.hi)!==has(chosen,x.lo)}).map(function(x){return has(chosen,x.hi)?x.lo:x.hi});
    chosen.push(linked.length&&r()<.8?pick(linked,r):pick(avail.filter(function(n){return !has(chosen,n)}),r));
   }
   return shuffle(chosen,r);
  }

  function build(opts){
   opts=opts||{};var r=opts.rng||seeded(opts.seed==null?Math.floor(Math.random()*4294967296):opts.seed);
   var pool=opts.themeId?[byId[opts.themeId]].filter(Boolean):ready;
   var target=opts.targetKey?(kb.relations||[]).find(function(x){return x.indicator+'|'+[x.hi,x.lo].sort().join('|')===opts.targetKey&&['active','belowMargin'].indexOf(x.status)>=0}):null;
   if(opts.targetKey&&!target)return null;
   if(target)pool=pool.filter(function(t){return t.pool.indexOf(target.hi)>=0&&t.pool.indexOf(target.lo)>=0});
   if(target&&target.status==='belowMargin'){
    var original=pool.find(function(t){return t.kind==='indicators'&&t.indicators.concat(t.always||[]).indexOf(target.indicator)>=0});
    if(!original)return null;
    var names=shuffle([target.hi,target.lo],r),ind=target.indicator,m=meta(ind),truth=r()<.5;
    var subject=truth?target.hi:target.lo,object=truth?target.lo:target.hi;
    var readingTheme=Object.assign({},original,{title:'자료로 비교 · '+m.label,prompt:'표에 주어진 값을 사용해 설명을 판단하세요.'});
    return {theme:readingTheme,readingOnly:true,labels:LABELS.slice(0,2),entities:names,shown:[ind],display:display(readingTheme,names,[ind]),
     stage1:{options:[],answer:null,cues:[],basis:{}},
     stage2:{question:'제시된 자료에 대한 설명이 옳은가?',statements:[{mark:'ㄱ',kind:'data',truth:truth,
      text:LABELS[names.indexOf(subject)]+'는 '+LABELS[names.indexOf(object)]+'보다 '+m.more+'.',
      explain:'제시된 값: '+target.hi+' '+fmt(value(target.hi,ind))+m.unit+', '+target.lo+' '+fmt(value(target.lo,ind))+m.unit+' ('+m.year+', '+m.source+')',
      check:{indicator:ind,subject:subject,object:object}}],options:[{mark:'①',text:'옳다'},{mark:'②',text:'옳지 않다'}],answer:truth?0:1}};
   }
   // The number of 대상 is drawn once, so the easier two-대상 case does not crowd out three.
   var size=r();
   for(var attempt=0;attempt<600&&pool.length;attempt++){
    var theme=pick(pool,r),avail=theme.pool.filter(function(n){return hasData(theme,n)});
    var k=theme.pick[0]+Math.floor((attempt<400?size:r())*(theme.pick[1]-theme.pick[0]+1));if(avail.length<k)continue;
    var chosen=draw(theme,avail,k,r),shown=[];
    if(target){
     if(avail.indexOf(target.hi)<0||avail.indexOf(target.lo)<0)continue;
     chosen=shuffle([target.hi,target.lo].concat(shuffle(avail.filter(function(n){return n!==target.hi&&n!==target.lo}),r).slice(0,k-2)),r);
    }
    if(theme.kind==='composition'&&composition(theme).total&&composition(theme).total.indicator)shown=[composition(theme).total.indicator];
    if(theme.kind==='indicators'){
     var always=theme.always||[],inds=theme.indicators.filter(function(ind){return meta(ind)&&!meta(ind).disabled&&always.indexOf(ind)<0});
     shown=always.concat(shuffle(inds,r).slice(0,theme.show));
    }
    if(!identifiable(theme,chosen,shown))continue;
    // A column shown on every question (총인구) is there for computing totals; if it alone
    // identified the 대상, the theme's own indicators would be decoration.
    if(theme.always&&theme.always.length&&identifiable(theme,chosen,theme.always))continue;
    var pair=k===2?pairStage(theme,chosen,shown,avail,r):null;if(k===2&&!pair)continue;
    var s2=chooseStatements(theme,candidates(theme,chosen,shown,r),r);if(!s2)continue;
    if(target){
     var learned=(known(theme,chosen,shown).relations||[]).some(function(x){return x.indicator===target.indicator&&x.hi===target.hi&&x.lo===target.lo});
     var asked=s2.statements.some(function(s){var c=s.check;return c&&(c.ind||c.indicator)===target.indicator&&[c.subject,c.object].indexOf(target.hi)>=0&&[c.subject,c.object].indexOf(target.lo)>=0});
     if(!learned&&!asked)continue;
    }
    var s1=pair||stage1(chosen,r),range=k===2?LABELS[0]+', '+LABELS[1]:LABELS[0]+'~'+LABELS[k-1];
    var names=pair?pair.candidates:chosen.slice().sort(koSort),basis=known(theme,pair?names:chosen,shown),cueList=cues(theme,chosen,shown);
    // Say how each extra candidate is ruled out.
    if(pair)pair.extra.forEach(function(n){
     var why=basis.relations.filter(function(x){return x.hi===n||x.lo===n}).map(function(x){return meta(x.indicator).label+' '+x.hi+' > '+x.lo})
      .concat(basis.signs.filter(function(x){return x.entity===n}).map(function(x){return meta(x.indicator).label+(x.positive?' 양(+)':' 음(−)')}));
     var inOptions=s1.options.some(function(o){return o.indexOf(n)>=0});
     cueList.push({label:'후보',name:n,cue:!inOptions?'선택지에 나오지 않음':why.length?why.slice(0,3).join(' · '):'다른 선택지로 소거'});
    });
    return {theme:theme,labels:LABELS.slice(0,k),entities:chosen,shown:shown,display:display(theme,chosen,shown),
     prompt:theme.prompt.split('{range}').join(range).split('{candidates}').join(names.join(', ')),
     stage1:{question:range+'에 해당하는 것으로 옳은 것은?',options:s1.options,answer:s1.answer,candidates:pair?names:null,cues:cueList,basis:basis},
     stage2:{question:range+'에 대한 설명으로 옳은 것만을 <보기>에서 고른 것은?',statements:s2.statements,options:s2.options,answer:s2.answer}};
   }
   return null;
  }
  return {themes:ready,build:build,identifiable:identifiable,candidates:candidates,known:known,relation:relation,value:value,comp:comp,total:total,seeded:seeded,LABELS:LABELS,COMBOS:COMBOS};
 }
 return {create:create,seeded:seeded,topic:topic};
});
