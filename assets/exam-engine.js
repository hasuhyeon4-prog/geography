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
 // Composition shares always with one decimal, so '57.0' does not read as '57' beside '27.3'.
 function pct(v){return v.toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}
 // Particles follow how a name is read: ASEAN 아세안 → 은, EU 이유 → 는.
 var READ={ASEAN:'아세안',MERCOSUR:'메르코수르',EU:'이유',USMCA:'유에스엠씨에이',APEC:'에이펙',OPEC:'오펙'};
 function topic(word){word=READ[word]||word;var c=word.charCodeAt(word.length-1);return c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?'은':'는'}
 function subjectParticle(word){word=READ[word]||word;var c=word.charCodeAt(word.length-1);return c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?'이':'가'}
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
  minerals:function(o){return o+'의 대표 산지이다'},
  beverage:function(o){return o+'의 주요 생산국이다'},
  seas:function(o){return o+'에 접해 있다'},
  landlocked:function(o,id){return id==='yes'?'바다와 접하지 않은 내륙국이다':null},
  opec:function(o,id){return id==='member'?'OPEC 회원국이다':null}
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
  function sameCell(names,ind){var seen={};return names.some(function(n){var t=cellText(n,ind);if(seen[t])return true;seen[t]=1;return false})}
  // An indicator with `decimals` keeps them in the table (13.0, not 13), as exam tables do.
  var cellCache={};
  function cellText(name,ind){var k=name+'|'+ind;if(k in cellCache)return cellCache[k];var v=value(name,ind),d=meta(ind)&&meta(ind).decimals;return cellCache[k]=d!=null?v.toLocaleString('ko-KR',{minimumFractionDigits:d,maximumFractionDigits:d}):fmt(v)}
  function meta(ind){return kb.indicators[ind]}
  function relation(ind,a,b){for(var i=0;i<REL.length;i++){var x=REL[i];if(x.indicator===ind&&(x.hi===a&&x.lo===b||x.hi===b&&x.lo===a))return x}return null}
  function clearlyAbove(ind,x,y){var m=meta(ind).compare;if(x==null||y==null)return false;return m.type==='ratio'?x>0&&y>0&&x/y>=m.min:x-y>=m.min}
  function composition(theme){return kb.compositions[theme.composition]}
  function comp(theme,name){var c=composition(theme);return c&&c.values[name]}
  function total(theme,name){var c=composition(theme);return c&&c.total?c.total.values[name]:undefined}
  function catLabel(theme,id){var row=composition(theme).categories.find(function(x){return x[0]===id});return row?row[1]:id}
  function orderOf(theme,name){var c=ORDERS[theme.composition];return c&&c[name]||null}
  // Climate themes: a site's verified climate type and its hemisphere are what a student brings.
  var CLIMATE=kb.climate||{types:{}};
  function cl(n){var e=entity(n);return e&&e.climate}
  function typeLabel(t){return CLIMATE.types[t]||t}
  // Köppen letters as the lecture writes them: Aw, BS, Cfb, ET.
  function code(t){return t.split('').map(function(ch,i){return i===0||(i===1&&/[be]/.test(t[0]))?ch.toUpperCase():ch}).join('')}
  // Could these monthly data be of type t? Only the code letters the data decide reliably count.
  // 고산 기후 is judged by its trace (저위도·서늘함·작은 연교차), not by the code letters.
  function climateFits(c,t){if(t==='h')return c.h!=='no';for(var i=0;i<Math.min(c.robust,t.length);i++)if(c.computed[i]!==t[i])return false;return true}
  // Placing site n on the row that holds site d's graph is ruled out when d's data clearly
  // contradict n's verified type, or their seasons put the row in the other hemisphere.
  function climateBreaks(n,d){var s=cl(n),r=cl(d);return !!(s.type&&!climateFits(r,s.type))||!!(r.signal&&r.signal!==s.hemisphere)}
  // Which options each region holds. A false claim must name something a country of the same
  // region really has, so "우간다는 APEC 회원국이다" never serves as a free distractor.
  var HOLDERS={};
  // A religion must be the 1위 of at least two countries of the region: 유대교 (이스라엘 alone) is no
  // lure for 카타르.
  Object.keys(kb.entities).forEach(function(n){var e=kb.entities[n];if(!e.region)return;Object.keys(e.facts||{}).forEach(function(set){var h=HOLDERS[set]||(HOLDERS[set]={}),g=h[e.region]||(h[e.region]={});e.facts[set].values.forEach(function(v){g[v]=(g[v]||0)+1})})});
  function plausible(set,name,v){var e=entity(name),g=e&&e.region&&HOLDERS[set]&&HOLDERS[set][e.region];return !!(g&&g[v]>=(set==='religion'?2:1))}
  // A hemisphere is worth a <보기> only for a country within this many degrees of the equator.
  var NEAR_EQUATOR=12,LINE_NEAR={equator:12,meridian:8};
  function allowed(theme,set){var f=theme.followups&&theme.followups.facts;return !f||f.indexOf(set)>=0}
  // An indicator with a domain (agriculture) is recalled only by themes listing that domain,
  // and a theme with domains recalls only those.
  function inScope(theme,ind){var m=meta(ind);return (theme.domains||[null]).indexOf(m&&m.domain||null)>=0}
  // A change between two columns ('…@1970-2020') is never a column itself; it can be read, and
  // so counts as shown, when both of its columns are in the table.
  function visible(shown,ind){var m=meta(ind);return shown.indexOf(ind)>=0||!!(m&&m.from&&m.from.every(function(x){return shown.indexOf(x)>=0}))}
  function koSort(a,b){return a.localeCompare(b,'ko')}
  function span(x,ind){if(!x.years)return '';var m=ind&&meta(ind);return m&&m.static?x.years.join('·')+'년 기준':x.years[0]+'~'+x.years[1]+'년 매년'}

  // 국가 설명 (kind 'clues'): a shown column is '<country>#<n>', the n-th lecture clue sentence.
  function clueOf(id){var i=id.lastIndexOf('#');return entity(id.slice(0,i)).clues[+id.slice(i+1)]}
  function hasData(theme,name){
   if(!entity(name))return false;
   if(theme.kind==='clues')return !!(entity(name).clues&&entity(name).clues.length);
   if(theme.kind==='items')return !!(theme.items&&theme.items[name]);
   if(theme.kind==='climate')return !!cl(name);
   if(theme.kind==='composition')return !!comp(theme,name)&&(!composition(theme).total||total(theme,name)!=null);
   return (theme.always||[]).every(function(ind){return value(name,ind)!=null})&&theme.indicators.some(function(ind){return value(name,ind)!=null});
  }
  function pairs(list){var out=[];for(var i=0;i<list.length;i++)for(var j=i+1;j<list.length;j++)out.push([list[i],list[j]]);return out}

  // What a student may bring to the shown data: verified relations among the chosen 대상
  // on the shown indicators, verified composition orders, or the theme's own item table.
  function known(theme,chosen,shown){
   var has=function(n){return chosen.indexOf(n)>=0};
   if(theme.kind==='indicators')return {
    relations:REL.filter(function(x){return visible(shown,x.indicator)&&has(x.hi)&&has(x.lo)}),
    signs:SIGNS.filter(function(x){return visible(shown,x.indicator)&&has(x.entity)})};
   if(theme.kind==='composition'){var c=composition(theme);return {orders:chosen.map(function(n){return orderOf(theme,n)}).filter(Boolean),
    relations:c.total&&c.total.indicator?REL.filter(function(x){return x.indicator===c.total.indicator&&has(x.hi)&&has(x.lo)}):[]};}
   if(theme.kind==='climate')return {sites:chosen.map(function(n){return {entity:n,type:cl(n).type,hemisphere:cl(n).hemisphere}})};
   if(theme.kind==='clues')return {clues:chosen.map(function(n){return {entity:n}})};
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
   if(theme.kind==='climate')return perm.every(function(n,i){return !climateBreaks(n,chosen[i])});
   // A clue names a place or item that no other country's clue names, so it fits only its own row.
   if(theme.kind==='clues')return perm.every(function(n,i){return n===chosen[i]});
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
    // Columns of one source at several years share one source line ('1970·2020 · UN WUP …').
    var src={},order=[];shown.forEach(function(ind){var m=meta(ind);if(!src[m.source]){src[m.source]=[];order.push(m.source)}if(src[m.source].indexOf(m.year)<0)src[m.source].push(m.year)});
    return {columns:cols,rows:chosen.map(function(n,i){return {label:LABELS[i],cells:shown.map(function(ind){return cellText(n,ind)})}}),source:order.map(function(k){return src[k].join('·')+' · '+k}).join(' / ')};
   }
   if(theme.kind==='climate'){
    // All graphs share one scale, as on an exam page, so they can be compared by eye.
    var T=[],P=[];chosen.forEach(function(n){T=T.concat(cl(n).temperature);P=P.concat(cl(n).precipitation)});
    var tMin=Math.min(0,Math.floor(Math.min.apply(null,T)/10)*10),tMax=Math.max(10,Math.ceil(Math.max.apply(null,T)/10)*10);
    var peak=Math.max(100,Math.max.apply(null,P)),rough=peak/4,power=Math.pow(10,Math.floor(Math.log(rough)/Math.LN10));
    var pStep=[1,2,2.5,5,10].map(function(n){return n*power}).filter(function(n){return n>=rough})[0];
    return {kind:'climate',columns:[],rows:chosen.map(function(n,i){var c=cl(n);return {label:LABELS[i],temperature:c.temperature,precipitation:c.precipitation,cells:[]}}),
     scale:{tMin:tMin,tMax:tMax,tStep:10,pMax:Math.ceil(peak/pStep)*pStep,pStep:pStep,plotHeight:Math.max(160,(tMax-tMin)*3)},
     source:CLIMATE.period.join('~')+'년 평년값 · '+CLIMATE.source};
   }
   if(theme.kind==='clues'){
    var srcs={};shown.forEach(function(id){srcs[clueOf(id).source]=1});
    return {columns:[{id:'clue',label:'강의의 설명',unit:''}],rows:chosen.map(function(n,i){return {label:LABELS[i],cells:[clueOf(shown[i]).shown]}}),source:Object.keys(srcs).join(' · ')};
   }
   if(theme.kind==='items'){
    return {columns:[{id:'items',label:'수출 상위 품목(비중, %)',unit:''}],rows:chosen.map(function(n,i){return {label:LABELS[i],cells:[theme.items[n].map(function(x){return x[0]+' '+fmt(x[1])}).join(', ')]}}),source:theme.year+' · '+theme.source};
   }
   var c=composition(theme),show=theme.show||c.categories.map(function(x){return x[0]});
   var cols=show.map(function(id){return {id:id,label:catLabel(theme,id),unit:'%'}});
   if(c.total)cols.push({id:c.total.indicator||'total',label:c.total.label,unit:c.total.unit});
   return {columns:cols,rows:chosen.map(function(n,i){return {label:LABELS[i],cells:show.map(function(id){return pct(comp(theme,n)[id]||0)}).concat(c.total?[fmt(total(theme,n))]:[])}}),
    source:c.year+' · '+c.source+' · '+c.unit+(c.total?' · '+(c.total.note||c.total.label+'도 '+c.total.year+'년 같은 출처'):'')};
  }

  function cues(theme,chosen,shown){
   var k=known(theme,chosen,shown);
   return chosen.map(function(n,i){
    var parts=[];
    if(theme.kind==='indicators'){
     // One line per indicator: who is known to be above and below this 대상.
     shown.concat(Object.keys(kb.indicators).filter(function(ind){return shown.indexOf(ind)<0&&visible(shown,ind)})).forEach(function(ind){
      var up=[],down=[];
      k.relations.forEach(function(x){if(x.indicator!==ind)return;if(x.lo===n)up.push(x.hi);if(x.hi===n)down.push(x.lo)});
      var chain=[up.join('·'),n,down.join('·')].filter(Boolean);
      if(chain.length>1)parts.push(meta(ind).label+' '+chain.join(' > '));
     });
     k.signs.forEach(function(x){if(x.entity===n)parts.push(meta(x.indicator).label+(x.positive?' 양(+)':' 음(−)'))});
    }else if(theme.kind==='composition'){var o=orderOf(theme,n);if(o)parts.push(o.order.map(function(id){return catLabel(theme,id)}).join(' > ')+(o.order.length===1?' 1위':''));
     (k.relations||[]).forEach(function(x){if(x.hi===n||x.lo===n)parts.push(meta(x.indicator).label+' '+x.hi+' > '+x.lo)});}
    else if(theme.kind==='climate'){var c=cl(n);if(c.type)parts.push(typeLabel(c.type));if(c.signal)parts.push((c.signal==='S'?'남반구':'북반구')+'(최한월 '+c.coldest+'월)')}
    else if(theme.kind==='clues'){var q=clueOf(shown[i]);parts.push(q.keys.join('·')+' ('+q.source+')')}
    else parts.push(theme.items[n].slice(0,2).map(function(x){return x[0]}).join('·')+' 조합');
    // Every line is kept: with three year columns the deciding relation is often the fourth.
    return {label:LABELS[i],name:n,cue:parts.length?parts.join(' · '):'나머지 대상(소거)'};
   });
  }

  // 항목 식별 (format 'columns'): the 대상 are named and three columns are labelled A~C instead
  // of their names. The learner tells which indicator or category each column is, using the same
  // verified knowledge: relations and signs (indicators) or composition orders.
  var COLS=['A','B','C'];
  function columnsFor(theme){
   if(theme.kind==='indicators')return theme.indicators.filter(function(ind){return meta(ind)&&!meta(ind).disabled&&(theme.always||[]).indexOf(ind)<0});
   return theme.kind==='composition'?(theme.hideable||[]):[];
  }
  function apart(theme,list){var out=[];list.forEach(function(id){if(!(theme.apart||[]).some(function(p){return p.indexOf(id)>=0&&p.some(function(o){return o!==id&&out.indexOf(o)>=0})}))out.push(id)});return out}
  function columnName(theme,id){return theme.kind==='indicators'?meta(id).label:catLabel(theme,id)}
  // guess[j] is what the learner takes column j to be; the column really holds hidden[j].
  function columnsConsistent(theme,rows,hidden,guess){
   var has=function(n){return rows.indexOf(n)>=0},col=function(id){return hidden[guess.indexOf(id)]};
   if(theme.kind==='indicators')
    return REL.every(function(x){return guess.indexOf(x.indicator)<0||!has(x.hi)||!has(x.lo)||!clearlyAbove(x.indicator,value(x.lo,col(x.indicator)),value(x.hi,col(x.indicator)))})&&
     SIGNS.every(function(x){if(guess.indexOf(x.indicator)<0||!has(x.entity))return true;var v=value(x.entity,col(x.indicator)),min=meta(x.indicator).sign.min;return x.positive?v>-min:v<min});
   var c=composition(theme);
   return rows.every(function(n){
    var o=orderOf(theme,n);if(!o)return true;
    var v=Object.assign({},comp(theme,n));guess.forEach(function(g,j){v[g]=comp(theme,n)[hidden[j]]});
    return !orderBroken(c,o.order,v);
   });
  }
  function columnsIdentifiable(theme,rows,hidden){
   var left=permutations(hidden).filter(function(g){return columnsConsistent(theme,rows,hidden,g)});
   return left.length===1&&left[0].join('|')===hidden.join('|');
  }
  function columnsDisplay(theme,rows,shown,hidden,rowLabels){
   var names=function(n){return rowLabels?rowLabels[rows.indexOf(n)]:n};
   if(theme.kind==='indicators'){
    var named=shown.filter(function(ind){return hidden.indexOf(ind)<0});
    var cols=named.map(function(ind){var m=meta(ind);return {id:ind,label:m.label,unit:m.unit}}).concat(hidden.map(function(id,j){return {id:id,label:COLS[j],reveal:meta(id).label,unit:''}}));
    var src={};shown.forEach(function(ind){var m=meta(ind);src[m.year+' · '+m.source]=1});
    return {columns:cols,rows:rows.map(function(n){return {label:names(n),cells:named.concat(hidden).map(function(ind){return cellText(n,ind)})}}),source:Object.keys(src).join(' / ')+' · A~C의 단위는 생략함'};
   }
   // A~C come first, so on a narrow screen the columns to identify are in view.
   var c=composition(theme),visible=(theme.show||[]).filter(function(id){return hidden.indexOf(id)<0});
   var cols=hidden.map(function(id,j){return {id:id,label:COLS[j],reveal:catLabel(theme,id),unit:'%'}}).concat(visible.map(function(id){return {id:id,label:catLabel(theme,id),unit:'%'}}));
   if(c.total)cols.push({id:c.total.indicator||'total',label:c.total.label,unit:c.total.unit});
   return {columns:cols,rows:rows.map(function(n){return {label:names(n),cells:hidden.concat(visible).map(function(id){return pct(comp(theme,n)[id]||0)}).concat(c.total?[fmt(total(theme,n))]:[])}}),
    source:c.year+' · '+c.source+' · '+c.unit};
  }
  function columnsCues(theme,rows,hidden){
   return hidden.map(function(id,j){
    var parts=[];
    if(theme.kind==='indicators'){
     // Each known relation on this indicator, as a chain where they line up.
     var rel=REL.filter(function(x){return x.indicator===id&&rows.indexOf(x.hi)>=0&&rows.indexOf(x.lo)>=0});
     rows.slice().sort(function(a,b){return value(b,id)-value(a,id)}).forEach(function(n){var below=rel.filter(function(x){return x.hi===n}).map(function(x){return x.lo});if(below.length)parts.push(n+' > '+below.join('·'))});
     SIGNS.forEach(function(x){if(x.indicator===id&&rows.indexOf(x.entity)>=0)parts.push(x.entity+(x.positive?' 양(+)':' 음(−)'))});
    }else rows.forEach(function(n){var o=orderOf(theme,n);if(o&&o.order.indexOf(id)>=0)parts.push(n+' '+o.order.map(function(k){return catLabel(theme,k)}).join(' > ')+(o.order.length===1?' 1위':''))});
    return {label:COLS[j],name:columnName(theme,id),cue:parts.length?parts.slice(0,4).join(' · '):'나머지 항목(소거)'};
   });
  }

  // 동시 식별 (format 'joint'): the 대상 rows and three category columns are both hidden, as on
  // exam tables where countries and religions are symbols. perm places the 대상 on the rows and
  // guess names the columns; only one pair may survive the verified orders.
  function jointConsistent(theme,chosen,hidden,perm,guess){
   var c=composition(theme);
   return perm.every(function(n,i){
    var o=orderOf(theme,n);if(!o)return true;
    var data=comp(theme,chosen[i]),v=Object.assign({},data);guess.forEach(function(g,j){v[g]=data[hidden[j]]});
    return !orderBroken(c,o.order,v);
   });
  }
  function jointLeft(theme,chosen,hidden){
   var out=[];permutations(chosen).forEach(function(p){permutations(hidden).forEach(function(g){if(jointConsistent(theme,chosen,hidden,p,g))out.push(p.concat(g))})});
   return out;
  }
  function jointIdentifiable(theme,chosen,hidden){var left=jointLeft(theme,chosen,hidden);return left.length===1&&left[0].join('|')===chosen.concat(hidden).join('|')}

  function stage1(chosen,r){
   var all=permutations(chosen),key=function(p){return p.join('|')},right=key(chosen);
   var near=all.filter(function(p){var d=p.filter(function(x,i){return x!==chosen[i]}).length;return d===2}),far=all.filter(function(p){var d=p.filter(function(x,i){return x!==chosen[i]}).length;return d>2});
   var options=balanced(chosen,[],near.concat(far),r);
   return {options:options,answer:options.map(key).indexOf(right)};
  }

  function factExplain(set,name){
   var e=entity(name),f=e.facts[set],m=kb.factSets[set]||kb.extraFacts[set];
   var labels=f.values.map(function(v){return (kb.factSets[set]&&kb.factSets[set].options[v])||v}).join('·');
   var note=(f.note||'').replace(/ ?무종교를 제외한 개별 종교 중 1위이며, 과반 여부와 다릅니다\.?/,'').trim();
   // Without a lecture source for this country, the fact is marked as background with its set's basis.
   return name+' — '+(m?m.title||m.label:set)+': '+labels+(note?' · '+note:'')+(f.source?' ('+f.source+')':m&&m.source?' (배경 사실 · '+m.source+')':'');
  }
  function optionLabel(set,id){return kb.factSets[set]?kb.factSets[set].options[id]:id}
  // Concept-card sets carry their own phrase: '{value}을/를 …' takes the particle the value needs.
  function fill(template,v){return template.replace(/\{value\}(이\/가|을\/를|과\/와|은\/는)?/,function(m,alt){if(!alt)return v;var c=v.charCodeAt(v.length-1),coda=c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28;return v+alt.split('/')[coda?0:1]})}
  function predicate(set,id){var p=PREDICATES[set],m=kb.factSets[set];return p?p(optionLabel(set,id),id):m&&m.template?fill(m.template,optionLabel(set,id)):null}

  // Share-versus-total traps read from the table: amounts differ by 1.5× (composition) or
  // 1.2× (indicators) and run against the order of the shares, so rounding never decides.
  // Share × total: asked only when the share order and the total order differ, so the amount needs
  // the product. Both cases are used, the larger total with the larger amount and the larger share
  // with it, so neither 'the larger total wins' nor 'the smaller share wins' answers it (audit 2026-10-23).
  // How often each trap case occurs over a theme's pool, so the commoner one can be thinned to the
  // rarer one: case 'O' (the larger total has the larger amount), case 'S' (the larger share has it).
  var trapKeep={};
  function trapCase(rateA,rateB,amtA,amtB){return (amtA>amtB)===(amtA/rateA>amtB/rateB)?'O':'S'}
  function keepTrap(theme,cs,r){
   if(!trapKeep[theme.id]){
    var n={O:0,S:0},pool=theme.pool||[];
    pool.forEach(function(a,i){pool.slice(i+1).forEach(function(b){
     if(theme.kind==='composition'&&composition(theme).total){var ca=comp(theme,a),cb=comp(theme,b),ta=total(theme,a),tb=total(theme,b);if(!ca||!cb||!ta||!tb)return;
      (theme.show||Object.keys(ca)).forEach(function(cat){if(cat==='other'||!(ca[cat]>=1&&cb[cat]>=1))return;var x=ca[cat]*ta/100,y=cb[cat]*tb/100;if(trap([a,b],ca[cat],cb[cat],x,y,1.5))n[trapCase(ca[cat],cb[cat],x,y)]++})}
     (theme.derived||[]).forEach(function(d){var ra=value(a,d.rate),rb=value(b,d.rate),ta=value(a,d.total),tb=value(b,d.total);if([ra,rb,ta,tb].some(function(v){return v==null}))return;
      var x=ta*ra/d.per,y=tb*rb/d.per;if(trap([a,b],ra,rb,x,y,1.2))n[trapCase(ra,rb,x,y)]++});
    })});
    trapKeep[theme.id]={O:n.O&&n.S?Math.min(1,n.S/n.O):1,S:n.O&&n.S?Math.min(1,n.O/n.S):1};
   }
   return r()<trapKeep[theme.id][cs];
  }
  function trap(p,rateA,rateB,amtA,amtB,minRatio){
   if(!(amtA>0&&amtB>0&&rateA>0&&rateB>0)||Math.abs(rateA-rateB)<1||Math.max(amtA,amtB)/Math.min(amtA,amtB)<minRatio)return null;
   if((rateA>rateB)===(amtA/rateA>amtB/rateB))return null;
   return amtA>amtB?[p[0],p[1]]:[p[1],p[0]];
  }

  // Climate <보기>: readings of the graphs, the map position, and the verified climate type.
  var GRAPH=[
   ['range','기온의 연교차','가 크다',3,'℃',function(c){return c.range}],
   ['coldest','최한월 평균 기온','이 높다',3,'℃',function(c){return Math.min.apply(null,c.temperature)}],
   ['warmest','최난월 평균 기온','이 높다',3,'℃',function(c){return Math.max.apply(null,c.temperature)}],
   ['annual','연 강수량','이 많다',0,'mm',function(c){return c.annual}],
   ['summer','연 강수량 중 6~8월 강수량의 비중','이 높다',15,'%',function(c){return c.summerShare}]
  ];
  function climateExplain(n){var c=cl(n),st=c.station.replace(/_\d+$/,'');
   // The lecture classifies H by its cause (고도), so the Köppen letters of the data are not shown as a second verdict.
   if(c.lecture==='h')return n+' — 강의 기후형 고산 기후(H): 위도 '+fmt(Math.abs(c.lat))+'°의 저위도인데도 최한월 '+fmt(Math.min.apply(null,c.temperature))+'℃, 연교차 '+fmt(c.range)+'℃'+(c.elevation!=null?' · 해발 '+fmt(c.elevation)+'m':'')+' · '+st;
   return n+' — 강의 기후형 '+typeLabel(c.lecture)+'('+code(c.lecture)+'), 관측소 평년값 분류 '+code(c.computed)+' · '+st}
  function climateCandidates(theme,chosen,r){
   var out=[],L=function(n){return LABELS[chosen.indexOf(n)]},S=function(n){return L(n)+'는'};
   function add(c){if(!out.some(function(x){return x.text===c.text}))out.push(c)}
   function ordered(p,va,vb){var hi=va>vb?p[0]:p[1],lo=hi===p[0]?p[1]:p[0],truth=r()<.5;return {hi:hi,lo:lo,truth:truth,s:truth?[hi,lo]:[lo,hi]}}
   pairs(chosen).forEach(function(p){
    var a=cl(p[0]),b=cl(p[1]);
    // A reading is asked only when the graphs show it plainly (3℃, 15%p, or 1.3배·150mm apart).
    GRAPH.forEach(function(g){
     var va=g[5](a),vb=g[5](b),clear=g[0]==='annual'?Math.max(va,vb)>=1.3*Math.min(va,vb)&&Math.abs(va-vb)>=150:Math.abs(va-vb)>=g[3];
     if(!clear)return;
     var o=ordered(p,va,vb);
     add({kind:'graph',key:'graph|'+g[0]+'|'+p.join('|'),text:S(o.s[0])+' '+L(o.s[1])+'보다 '+g[1]+g[2]+'.',truth:o.truth,
      explain:'그래프 읽기: '+o.hi+' '+fmt(g[5](cl(o.hi)))+g[4]+', '+o.lo+' '+fmt(g[5](cl(o.lo)))+g[4]+(g[0]==='range'?' (최난월 − 최한월)':''),check:{metric:g[0],subject:o.s[0],object:o.s[1]}});
    });
    var la=Math.abs(a.lat),lb=Math.abs(b.lat);
    if(Math.abs(la-lb)>=8){var o=ordered(p,la,lb);
     add({kind:'place',key:'lat|'+p.join('|'),text:S(o.s[0])+' '+L(o.s[1])+'보다 고위도에 위치한다.',truth:o.truth,explain:o.hi+' 위도 '+fmt(Math.abs(cl(o.hi).lat))+'°, '+o.lo+' '+fmt(Math.abs(cl(o.lo).lat))+'°',check:{place:'lat',subject:o.s[0],object:o.s[1]}})}
    if(a.elevation!=null&&b.elevation!=null&&Math.abs(a.elevation-b.elevation)>=800){var e=ordered(p,a.elevation,b.elevation);
     add({kind:'place',key:'alt|'+p.join('|'),text:S(e.s[0])+' '+L(e.s[1])+'보다 해발 고도가 높다.',truth:e.truth,explain:e.hi+' 관측소 해발 '+fmt(cl(e.hi).elevation)+'m, '+e.lo+' '+fmt(cl(e.lo).elevation)+'m',check:{place:'alt',subject:e.s[0],object:e.s[1]}})}
   });
   chosen.forEach(function(n){
    var c=cl(n);
    if(Math.abs(c.lat)>=5){var south=c.hemisphere==='S',t=r()<.5;
     add({kind:'place',key:'hemi|'+n,text:S(n)+' '+(south===t?'남반구':'북반구')+'에 위치한다.',truth:t,explain:n+' 위도 '+fmt(c.lat)+'° — '+(south?'남반구':'북반구'),check:{place:'hemisphere',entity:n,value:south===t?'S':'N'}})}
    if(!c.type)return;
    add({kind:'climate',key:'type|'+n,text:S(n)+' '+typeLabel(c.type)+'가 나타난다.',truth:true,explain:climateExplain(n),check:{type:c.type,entity:n}});
    // A wrong type the data clearly rule out: another site's type in this question, else one of the same group.
    var others=chosen.map(function(o){return cl(o).type}).filter(function(t){return t&&t!==c.type&&!climateFits(c,t)});
    var group=Object.keys(CLIMATE.types).filter(function(t){return t!=='h'&&t!==c.type&&t[0]===c.type[0]&&!climateFits(c,t)});
    var w=others.length?pick(others,r):group.length?pick(group,r):null;
    if(w)add({kind:'climate',key:'type|'+n,text:S(n)+' '+typeLabel(w)+'가 나타난다.',truth:false,explain:climateExplain(n),check:{type:w,entity:n}});
    // A lecture statement about the site's verified type (vegetation, soil, life, cause), true when
    // the type is one it describes and false only for the types the lecture contrasts it with.
    (CLIMATE.claims||[]).forEach(function(k){
     var truth=k.trueFor.indexOf(c.type)>=0;if(!truth&&k.falseFor.indexOf(c.type)<0||(k.skip||[]).indexOf(n)>=0)return;
     add({kind:'climateClaim',key:'type|'+n,text:S(n)+' '+k.claim,truth:truth,
      explain:n+' — 강의 기후형 '+typeLabel(c.type)+'. 이 설명은 '+k.trueFor.map(function(t){return typeLabel(t)}).join('·')+'에 해당한다 · '+k.source,check:{claim:k.id,entity:n,type:c.type}});
    });
   });
   return out;
  }

  // Concept-card statements name the crop or animal; on the paper it is (가)~(다). A name is
  // replaced only as a whole word, and the particle after it changes to suit the label. A
  // statement must open with one of its 대상 as subject ('밀은', '쌀의'); others are general
  // remarks ('양 사육 두수와 양모 생산량은…' would also give the answer away).
  var SWAP={'으로':'로','은':'는','이':'가','을':'를','과':'와'};
  function relabel(text,names,L,named){
   var out=text,missed=false;
   names.slice().sort(function(a,b){return b.length-a.length}).forEach(function(n){
    var hit=false,re=new RegExp('(^|[^가-힣])'+n+'(으로|이다|은|는|이|가|을|를|과|와|의|보다|에서|에|도|만|로)?(?![가-힣])','g');
    out=out.replace(re,function(m,pre,part){hit=true;return named?m:pre+L(n)+(part?(SWAP[part]||part):'')});
    if(!hit)missed=true;
   });
   var opens=new RegExp('^('+names.join('|')+')(은|는|이|가|의|과|와)').test(text);
   return !missed&&opens?out:null;
  }

  // What a clue sentence already tells about its country, so no <보기> asks it again: '수도 다카르'
  // settles 수도와 최대 도시, '남부 아프리카' the hemisphere, '내륙국' the coast.
  // A clue that names a coast or industry already answers landlocked and export-type <보기>.
  var CLUE_STATES={capitalCity:/수도/,cityCapital:/수도/,cityUN:/UN|국제 연합/,exportType:/수출|상업적 농업|공업|제조업/,landlocked:/내륙국|연안|접하|해안|반도국|섬들/,seas:/연안|접하|바다/,equator:/적도/,meridian:/본초 자오선/,
   hemisphere:/남반구|북반구|회귀선|남부 아프리카|적도/};
  // The religion fact is stated only when the clue names the country's own 1위 religion: a past
  // Buddhist site (바미얀) does not settle Afghanistan's religion, and stays a fair lure.
  var RELIGION_WORDS={christianity:/크리스트교|정교회|가톨릭|개신교/,islam:/이슬람교/,buddhism:/불교/,hinduism:/힌두교/,judaism:/유대교/};
  // named: the 대상 are shown by name (항목 식별), so <보기> use names with their particles.
  // hidden: composition categories shown as A~C; <보기> call them by their letters.
  function candidates(theme,chosen,shown,r,named,hidden){
   if(theme.kind==='climate')return climateCandidates(theme,chosen,r);
   var out=[],has=function(n){return chosen.indexOf(n)>=0};
   hidden=theme.kind==='composition'&&hidden||[];
   var CN=function(cat){var j=hidden.indexOf(cat);return j>=0?COLS[j]:catLabel(theme,cat)},CS=function(cat){return CN(cat)+(hidden.indexOf(cat)>=0?'는':topic(CN(cat)))};
   // A fact the clue sentence already states ('힌두교 신자가 가장 많은 국가') is not asked about.
   var given={};if(theme.kind==='clues')chosen.forEach(function(n,i){given[n]=clueOf(shown[i]).text});
   var stated=function(n,set){var f=entity(n).facts[set];if(!given[n])return false;if(CLUE_STATES[set]&&CLUE_STATES[set].test(given[n]))return true;
    if(set==='religion'&&f&&f.values.some(function(v){return RELIGION_WORDS[v]&&RELIGION_WORDS[v].test(given[n])}))return true;
    return !!(f&&f.values.some(function(v){return given[n].indexOf(optionLabel(set,v))>=0}))};
   var L=function(n){return named?n:LABELS[chosen.indexOf(n)]},S=function(n){return L(n)+(named?topic(n):'는')},W=function(n){return L(n)+(named?(topic(n)==='은'?'과':'와'):'와')};
   function add(c){if(c.text&&!out.some(function(x){return x.text===c.text}))out.push(c)}
   chosen.forEach(function(n){
    var e=entity(n);
    Object.keys(e.facts||{}).forEach(function(set){
     // A fact the shown data already reveals would make the <보기> a reading exercise.
     if((theme.reveals||[]).indexOf(set)>=0||stated(n,set))return;
     if(!allowed(theme,set))return;
     var f=e.facts[set],m=kb.factSets[set];
     // A set that cannot also make a false statement (광물 산지, 음료, 접한 바다, 내륙국: lists that
     // are not complete) would make every such <보기> true, which teaches the pattern, not the fact.
     if(!m||!m.exclusive)return;
     f.values.forEach(function(v){var p=predicate(set,v);if(p)add({kind:'fact',key:set+'|'+n,text:S(n)+' '+p+'.',truth:true,explain:factExplain(set,n),check:{set:set,entity:n,value:v}})});
     if(m&&m.exclusive){
      // A value another 대상 here holds is plausible by construction (states and cities have no region).
      var opts=Object.keys(m.options).filter(function(o){return f.values.indexOf(o)<0&&predicate(set,o)&&(plausible(set,n,o)||m.falseFromOthers)});
      var fromOthers=[];chosen.forEach(function(o){var g=o!==n&&entity(o).facts[set];if(g)g.values.forEach(function(v){if(opts.indexOf(v)>=0)fromOthers.push(v)})});
      // A two-valued set (내륙국, OPEC) lies only with a value another 대상 here holds, so its false
      // claims do not outnumber the true ones.
      var o=fromOthers.length?pick(fromOthers,r):opts.length&&!m.falseFromOthers?pick(opts,r):null;
      if(o)add({kind:'fact',key:set+'|'+n,text:S(n)+' '+predicate(set,o)+'.',truth:false,explain:factExplain(set,n),check:{set:set,entity:n,value:o}});
     }
    });
    // '적도가 지난다' / '본초 자오선이 지난다': true when a landmass crosses the line; false only
    // for a country near it (within LINE_NEAR degrees but at least half a degree away).
    [['equator','적도'],['meridian','본초 자오선']].forEach(function(x){
     var l=e.lines&&e.lines[x[0]];if(!l||l.undecided||!allowed(theme,x[0])||stated(n,x[0]))return;
     if(!l.crosses&&(l.dist<.5||l.dist>LINE_NEAR[x[0]]))return;
     var w=x[1]+subjectParticle(x[1]);
     add({kind:'fact',key:x[0]+'|'+n,text:S(n)+' '+w+' 지난다.',truth:l.crosses,
      explain:n+'의 국토'+(l.crosses?'를 '+w+' 지난다.':'는 '+x[1]+'에서 약 '+fmt(l.dist)+'° 떨어져 있어 '+w+' 지나지 않는다.'),check:{line:x[0],entity:n,value:true}});
    });
    if(e.ns&&e.eqDist<=NEAR_EQUATOR&&allowed(theme,'hemisphere')&&!stated(n,'hemisphere')){var north=e.ns==='N',trueIt=r()<.5;add({kind:'fact',key:'ns|'+n,text:S(n)+' '+((north===trueIt)?'북반구':'남반구')+'에 위치한다.',truth:trueIt,explain:n+'의 국토는 '+(north?'북반구':'남반구')+'에 있다.',check:{ns:(north===trueIt)?'N':'S',entity:n}})}
   });
   var polarity={};SIGNS.forEach(function(x){if(has(x.entity))(polarity[x.indicator]=polarity[x.indicator]||{})[x.positive]=1});
   SIGNS.forEach(function(x){
    var pol=polarity[x.indicator]||{};if(!pol[true]||!pol[false])return;
    if(!has(x.entity)||visible(shown,x.indicator)||!inScope(theme,x.indicator)||(theme.noRecall||[]).indexOf(x.indicator)>=0)return;
    var m=meta(x.indicator),v=value(x.entity,x.indicator),yes=x.positive?m.sign.pos:m.sign.neg,no=x.positive?m.sign.neg:m.sign.pos;
    var why=x.entity+' '+m.label+' '+fmt(v)+m.unit+' ('+m.year+', '+m.source+') · '+span(x,x.indicator)+' '+(x.positive?'양(+)':'음(−)')+' · 근거: '+x.basis;
    if(yes)add({kind:'sign',key:x.indicator+'|'+x.entity,text:S(x.entity)+' '+yes+'.',truth:true,explain:why,check:{ind:x.indicator,entity:x.entity,positive:x.positive}});
    if(no)add({kind:'sign',key:x.indicator+'|'+x.entity,text:S(x.entity)+' '+no+'.',truth:false,explain:why,check:{ind:x.indicator,entity:x.entity,positive:!x.positive}});
   });
   REL.forEach(function(x){
    if(!has(x.hi)||!has(x.lo)||visible(shown,x.indicator)||meta(x.indicator).entityType!==entity(x.hi).type||!inScope(theme,x.indicator)||(theme.noRecall||[]).indexOf(x.indicator)>=0)return;
    var m=meta(x.indicator),truth=r()<.5,s=truth?[x.hi,x.lo]:[x.lo,x.hi],neg=m.negMore&&value(x.hi,x.indicator)<0&&value(x.lo,x.indicator)<0;
    add({kind:'compare',key:x.indicator+'|'+[x.hi,x.lo].sort().join('|'),text:neg?S(s[1])+' '+L(s[0])+'보다 '+m.negMore+'.':S(s[0])+' '+L(s[1])+'보다 '+m.more+'.',truth:truth,
     explain:x.hi+' '+cellText(x.hi,x.indicator)+m.unit+', '+x.lo+' '+cellText(x.lo,x.indicator)+m.unit+' ('+m.label+', '+m.year+', '+m.source+') · '+span(x,x.indicator)+' 같은 순서 · 근거: '+x.basis,
     check:{ind:x.indicator,subject:s[0],object:s[1]}});
   });
   // One statement per group of 대상, so a claim and its reverse never meet in a question.
   if(theme.concepts)(kb.concepts||[]).forEach(function(c){
    if(c.about.some(function(n){return !has(n)}))return;
    var text=relabel(c.claim,c.about,L,named);if(!text)return;
    add({kind:'concept',key:'concept|'+c.about.slice().sort().join('|'),text:text,truth:c.truth,explain:c.claim+' ('+c.source+')',check:{concept:c.id}});
   });
   pairs(chosen).forEach(function(p){
    var a=entity(p[0]),b=entity(p[1]);
    Object.keys(a.facts||{}).forEach(function(set){
     // A multi-valued set (도시가 있는 주) has no single value two 대상 could share.
     var m=kb.factSets[set];if(!m||!m.exclusive||m.multi||theme.noBoth||!b.facts||!b.facts[set]||(theme.reveals||[]).indexOf(set)>=0||!allowed(theme,set)||stated(p[0],set)||stated(p[1],set))return;
     var va=a.facts[set].values[0],vb=b.facts[set].values[0];if(va==null||vb==null)return;var pr=predicate(set,va);if(!pr)return;
     if(va!==vb&&!plausible(set,p[1],va)&&!m.falseFromOthers)return;
     add({kind:'both',key:set+'|'+p[0],keys:[set+'|'+p[0],set+'|'+p[1]],text:W(p[0])+' '+S(p[1])+' 모두 '+pr+'.',truth:va===vb,explain:factExplain(set,p[0])+' / '+factExplain(set,p[1]),check:{set:set,a:p[0],b:p[1],value:va}});
    });
    if(theme.kind==='composition'&&composition(theme).total){
     var c=composition(theme),ca=comp(theme,p[0]),cb=comp(theme,p[1]),ta=total(theme,p[0]),tb=total(theme,p[1]);
     (theme.show||Object.keys(ca)).forEach(function(cat){
      // A catch-all category ('기타') names no single thing whose amount could be compared.
      if(cat==='other'||ca[cat]<1||cb[cat]<1)return;
      var amtA=ca[cat]*ta/100,amtB=cb[cat]*tb/100,s0=trap(p,ca[cat],cb[cat],amtA,amtB,1.5);if(!s0||!keepTrap(theme,trapCase(ca[cat],cb[cat],amtA,amtB),r))return;
      var truth=r()<.5,s=truth?s0:[s0[1],s0[0]],amt=function(n){return n===p[0]?amtA:amtB};
      var noun=CN(cat)+' '+(cat==='unaffiliated'?'인구':theme.amountNoun||'인구');
      add({kind:'data',key:'amount|'+cat+'|'+p[0]+'|'+p[1],check:{category:cat,subject:s[0],object:s[1]},text:S(s[0])+' '+L(s[1])+'보다 '+noun+subjectParticle(noun)+' 많다.',truth:truth,
       explain:(hidden.indexOf(cat)>=0?CN(cat)+'는 '+catLabel(theme,cat)+'. ':'')+'표의 비율 × '+c.total.label+': '+s0[0]+' 약 '+fmt(amt(s0[0]))+c.total.unit+', '+s0[1]+' 약 '+fmt(amt(s0[1]))+c.total.unit+' — 비율과 '+c.total.label+'의 순서가 서로 달라 곱해서 비교한다. 실제 '+(/수$/.test(theme.amountNoun||'')?'수는':'양은')+' '+s0[0]+subjectParticle(s0[0])+' 더 많다. (비율·'+c.total.label+' 모두 '+c.year+'년 '+c.source+')'});
     });
    }
    if(theme.kind==='indicators')(theme.derived||[]).forEach(function(d){
     if(shown.indexOf(d.rate)<0||shown.indexOf(d.total)<0)return;
     var rm=meta(d.rate),tm=meta(d.total),ra=value(p[0],d.rate),rb=value(p[1],d.rate),ta=value(p[0],d.total),tb=value(p[1],d.total);
     var amtA=ta*ra/d.per,amtB=tb*rb/d.per,s0=trap(p,ra,rb,amtA,amtB,1.2);if(!s0||!keepTrap(theme,trapCase(ra,rb,amtA,amtB),r))return;
     var truth=r()<.5,s=truth?s0:[s0[1],s0[0]];
     var line=function(n){return n+' '+fmt(value(n,d.total))+tm.unit+' × '+fmt(value(n,d.rate))+rm.unit+' ≈ '+fmt(value(n,d.total)*value(n,d.rate)/d.per)+tm.unit};
     add({kind:'data',key:'derived|'+d.rate+'|'+p[0]+'|'+p[1],check:{rate:d.rate,total:d.total,per:d.per,subject:s[0],object:s[1]},text:S(s[0])+' '+L(s[1])+'보다 '+d.noun+subjectParticle(d.noun)+' '+(d.more||'많다')+'.',truth:truth,
      explain:'표의 '+tm.label+' × '+rm.label+': '+line(s0[0])+', '+line(s0[1])+' — '+rm.label+'과 '+tm.label+'의 순서가 서로 달라 곱해서 비교한다. '+d.noun+topic(d.noun)+' '+s0[0]+subjectParticle(s0[0])+' 더 많다. ('+rm.year+', '+rm.source+')'});
    });
    // Two-period tables: which row changed more between the two columns (3%p apart at least).
    if(theme.kind==='indicators')(theme.changes||[]).forEach(function(d){
     if(shown.indexOf(d.from)<0||shown.indexOf(d.to)<0)return;
     // d.ratio compares growth (뒤 ÷ 앞, 1.2배 apart); otherwise the difference (d.drop: 앞 − 뒤, a fall).
     var ch=function(n){return d.ratio?value(n,d.to)/value(n,d.from):(value(n,d.to)-value(n,d.from))*(d.drop?-1:1)},ca=ch(p[0]),cb=ch(p[1]);
     if(d.ratio?!(Math.min(ca,cb)>0)||Math.max(ca,cb)/Math.min(ca,cb)<d.min:Math.abs(ca-cb)<d.min)return;
     var hi=ca>cb?p[0]:p[1],lo=hi===p[0]?p[1]:p[0],truth=r()<.5,s=truth?[hi,lo]:[lo,hi],fm=meta(d.from),tm=meta(d.to);
     var line=function(n){return n+' '+fmt(value(n,d.from))+' → '+fmt(value(n,d.to))+(d.ratio?'('+fmt(Math.round(ch(n)*10)/10)+'배)':(function(v){var u=fm.unit+(fm.unit==='%'?'p':'');return d.drop?'('+fmt(Math.round(-v*100)/100)+u+' 감소)':'('+(v>=0?'+':'')+fmt(Math.round(v*100)/100)+u+')'})(value(n,d.to)-value(n,d.from)))};
     add({kind:'data',key:'change|'+d.from+'|'+p.slice().sort().join('|'),check:{from:d.from,to:d.to,ratio:!!d.ratio,drop:!!d.drop,subject:s[0],object:s[1]},text:S(s[0])+' '+L(s[1])+'보다 '+d.noun+subjectParticle(d.noun)+' '+(d.more||'크다')+'.',truth:truth,
      explain:'표의 '+fm.label+'·'+tm.label+': '+line(s[0])+', '+line(s[1])+' ('+fm.source+')'});
    });
   });
   if(theme.kind==='indicators')chosen.forEach(function(n){
    // Whether a population column rose or fell, when it moved by 5% or more.
    (theme.changeSigns||[]).forEach(function(d){
     if(shown.indexOf(d.from)<0||shown.indexOf(d.to)<0)return;
     var a=value(n,d.from),b=value(n,d.to),pct=(b-a)/a*100;if(!(a>0)||Math.abs(pct)<d.min)return;
     var up=r()<.5,fm=meta(d.from);
     add({kind:'data',key:'sign|'+d.from+'|'+n,check:{from:d.from,to:d.to,entity:n,up:up},text:S(n)+' '+d.noun+subjectParticle(d.noun)+' '+(up?'증가하였다':'감소하였다')+'.',truth:(pct>0)===up,
      explain:'표의 '+fm.label+'·'+meta(d.to).label+': '+n+' '+fmt(a)+' → '+fmt(b)+fm.unit+' ('+(pct>=0?'+':'')+fmt(Math.round(pct))+'%)'});
    });
    // 도시화율 50%: more people in cities than in the countryside (강의 1권 P05), 2%p clear of it.
    (theme.majority||[]).forEach(function(ind){
     if(shown.indexOf(ind)<0)return;
     var v=value(n,ind),m=meta(ind);if(Math.abs(v-50)<2)return;
     var claim=r()<.5;
     add({kind:'data',key:'majority|'+ind+'|'+n,check:{majority:ind,entity:n,claim:claim},text:S(n)+' '+m.year+'년에 '+(claim?'도시 인구가 촌락 인구보다':'촌락 인구가 도시 인구보다')+' 많았다.',truth:(v>50)===claim,
      explain:'표의 '+m.label+' '+n+' '+fmt(v)+'% — 50%보다 '+(v>50?'높으므로 도시 인구가 더 많다.':'낮으므로 촌락 인구가 더 많다.')});
    });
   });
   // 항목 식별: which item a letter is, as the exam's own <보기> do ('A는 1인당 GDP이다'). A false one
   // names the item of another letter, so the wording never tells; one per question (key 'colid').
   if(named&&hidden.length===COLS.length)hidden.forEach(function(x,j){
    var item=columnName(theme,x),k=(j+1+Math.floor(r()*(hidden.length-1)))%hidden.length;
    [j,k].forEach(function(letter){
     add({kind:'colid',key:'colid|'+x,keys:['colid'],text:COLS[letter]+'는 '+item+'이다.',truth:letter===j,
      explain:COLS[j]+'는 '+item+'이다'+(letter===j?'':' ('+COLS[letter]+'는 '+columnName(theme,hidden[letter])+')'),check:{column:x,letter:COLS[letter]}});
    });
   });
   // What a hidden category is (religion: world adherents, origin, founding time, 보편/민족).
   // Asked only once a column is identified, so at least one category of each item is hidden.
   var CF=hidden.length&&(kb.categoryFacts||{})[theme.composition]||[],named0=CF.length?(theme.show||[]).filter(function(x){return composition(theme).rankExclude.indexOf(x)<0}):[];
   CF.forEach(function(f){
    if(f.status!=='active')return;
    var name=function(x){return hidden.indexOf(x)>=0?CN(x)+'('+catLabel(theme,x)+')':catLabel(theme,x)};
    if(f.kind==='order'){
     var why=f.label+': '+f.order.map(function(x){return catLabel(theme,x)}).join(' > ')+(f.values?' (세계 인구 중 비율 '+Object.keys(f.values).map(function(y){return y+'년 '+f.order.map(function(x){return fmt(f.values[y][x])}).join('·')}).join(', ')+'%, '+f.source+')':'')+' · 근거: '+f.basis;
     pairs(f.order.filter(function(x){return named0.indexOf(x)>=0})).forEach(function(p){
      // Both religions hidden: against a named one, the visible religion alone decided it (audit 2026-10-23).
      if(hidden.indexOf(p[0])<0||hidden.indexOf(p[1])<0)return;
      var truth=r()<.5,s=truth?p:[p[1],p[0]];
      add({kind:'category',key:'cat|'+f.id+'|'+p.slice().sort().join('|'),text:CS(s[0])+' '+CN(s[1])+'보다 '+f.more+'.',truth:truth,explain:name(s[0])+', '+name(s[1])+' — '+why,check:{trait:f.id,subject:s[0],object:s[1]}});
     });
    }else if(f.kind==='claim')hidden.forEach(function(x){
     var truth=f.trueFor.indexOf(x)>=0;if(!truth&&f.falseFor.indexOf(x)<0)return;
     add({kind:'category',key:'catclaim|'+x,text:CS(x)+' '+f.claim,truth:truth,explain:name(x)+' — 이 설명은 '+f.trueFor.map(function(t){return catLabel(theme,t)}).join('·')+'에 해당한다 · 근거: '+f.basis,check:{trait:f.id,category:x}});
    });else hidden.forEach(function(x){
     var v0=f.values[x];if(v0==null)return;
     var others=Object.keys(f.values).map(function(k){return f.values[k]}).filter(function(v,i,a){return v!==v0&&a.indexOf(v)===i});
     var v=others.length&&r()<.5?pick(others,r):v0;
     add({kind:'category',key:'cat|'+f.id+'|'+x,text:CS(x)+' '+fill(f.phrase,v)+'.',truth:v===v0,explain:name(x)+' — '+f.label+': '+v0+' · 근거: '+f.basis,check:{trait:f.id,category:x,value:v}});
    });
   });
   return out;
  }

  // Two true and two false statements, never two about the same fact. Up to three come from
  // the theme itself (comparisons, signs, data items, and the theme's focus fact sets); the
  // rest are background facts, with at most one '(가)와 (나)는 모두 …'.
  // A theme <보기> asks about the data (compare, sign, graph, climate), a fact the theme is about,
  // or a concept-card statement.
  function isFocus0(theme,c){var focusSets=(theme.followups&&theme.followups.focus)||[];
   // A theme that borrows another domain (대륙 곡물 with population) keeps the borrowed ones as background.
   if(theme.domains&&c.check&&c.check.ind&&(meta(c.check.ind).domain||null)!==theme.domains[0])return false;
   return c.kind==='colid'||c.kind==='concept'||c.kind==='category'||c.kind==='climateClaim'||c.kind==='compare'||c.kind==='sign'||c.kind==='data'||c.kind==='graph'||c.kind==='climate'||!!(c.check&&c.check.set&&focusSets.indexOf(c.check.set)>=0)}
  // Read straight from the table or graph, with no identification needed.
  function reading(c){return c.kind==='data'||c.kind==='graph'||c.kind==='place'&&c.check.place==='hemisphere'}
  // The predicate of a statement whatever its subject: '…는 OPEC 회원국이다', '…는 남반구에 위치한다'.
  function wording(c){var k=c.check||{};
   if(c.kind==='fact')return k.set?'f|'+k.set+'|'+k.value:k.line?'l|'+k.line:k.ns?'ns|'+k.ns:'f|'+c.key;
   if(c.kind==='both')return 'b|'+k.set+'|'+k.value;
   if(c.kind==='sign')return 's|'+k.ind+'|'+k.positive;
   if(c.kind==='climateClaim')return 'cc|'+k.claim;
   if(c.kind==='colid')return 'id|'+k.column;
   // A claim about one 대상 has its truth in its words ('…이므로 원유 매장량이 많다'); a two-대상 claim
   // ('A는 B보다 …') reads the same either way round, so only that kind is two-sided.
   if(c.kind==='concept')return 'k|'+c.text.replace(/\([가-라]\)/g,'#');
   if(c.kind==='climate')return 'ct|'+k.type;
   if(c.kind==='place'&&k.place==='hemisphere')return 'ph|'+k.value;
   if(c.kind==='category'&&k.value!=null)return 'cv|'+k.trait+'|'+k.value;
   if(c.kind==='category'&&k.category)return 'cl|'+k.trait;
   if(c.kind==='data'&&k.majority)return 'dm|'+k.majority+'|'+k.claim;
   if(c.kind==='data'&&k.up!=null)return 'du|'+k.from+'|'+k.up;
   return c.kind+'|'+c.key}
  function chooseStatements(theme,cands,r,loose){
   var isFocus=function(c){return isFocus0(theme,c)};
   // Statements are grouped by their wording (same predicate, any subject), and a wording is used
   // only when this question holds both a true and a false instance of it: then the wording cannot
   // tell the truth, and the truth depends on which 대상 is which (audit 2026-10-23: a solver reading
   // only the wording answered 37.8% of questions, now about 22%; chance is 20%).
   var groups={},list0=[];
   // A comparison's truth is drawn at random with the order of its two 대상, so its wording never tells.
   var FLIP={compare:1,graph:1};
   cands.forEach(function(c){var g=wording(c);if(!groups[g]){groups[g]={kind:c.kind,focus:isFocus(c),flip:!!FLIP[c.kind]||c.kind==='data'&&c.check.subject!=null||c.kind==='place'&&c.check.subject!=null||c.kind==='category'&&c.check.subject!=null,T:[],F:[]};list0.push(groups[g])}groups[g][c.truth?'T':'F'].push(c)});
   // Table readings: at most two, one true and one false, or they settle the answer by themselves.
   var picked=[],used={},kinds={},both=0,need={T:2,F:2},readTruth=null;
   var free=function(c){return !(c.keys||[c.key]).some(function(k){return used[k]})&&!(c.kind==='both'&&both)&&!(reading(c)&&kinds.reading>=2)};
   function take(pool,limit,last){
    var list=shuffle(pool,r),got=0;
    while(got<limit&&(need.T||need.F)&&list.length){
     list.sort(function(a,b){return (kinds[a.kind]||0)-(kinds[b.kind]||0)});
     var g=list.shift(),can=['T','F'].filter(function(t){return need[t]&&g[t].some(free)&&!(reading(g.T[0]||g.F[0])&&readTruth===t)});
     if(!last&&!g.flip&&!(g.T.some(free)&&g.F.some(free)))continue;
     if(!can.length)continue;
     var t=can.length===2?(r()<need.T/(need.T+need.F)?'T':'F'):can[0],c=pick(g[t].filter(free),r);
     picked.push(c);(c.keys||[c.key]).forEach(function(k){used[k]=1});kinds[c.kind]=(kinds[c.kind]||0)+1;if(c.kind==='both')both++;if(reading(c)){readTruth=t;kinds.reading=(kinds.reading||0)+1}need[t]--;got++;
    }
    return got;
   }
   var focus=list0.filter(function(g){return g.focus}),rest=list0.filter(function(g){return !g.focus});
   // One one-sided wording may fill the last place, so 대상 sets with few two-sided ones (니제르·카타르·
   // 벨기에) still appear; a targeted practice ('이 비교 연습') may use more to reach its pair.
   take(focus,3);take(rest,4);take(focus,4);take(list0,loose?4:1,true);
   var t=2-need.T,f=2-need.F;
   if(t<2||f<2)return null;
   // <보기> read straight from the table (kind 'data') need no identification; their places may
   // not leave only one answer combination, or the question is solved without identifying anything.
   var tr0=picked.filter(function(c){return c.truth}),fa0=picked.filter(function(c){return !c.truth}),slots=null,target=-1;
   shuffle(COMBOS.map(function(c,i){return i}),r).some(function(ti){for(var tries=0;tries<2;tries++){
    var tr=shuffle(tr0,r),fa=shuffle(fa0,r),sl=[null,null,null,null];
    COMBOS[ti].forEach(function(pos,i){sl[pos]=tr[i]});for(var i=0;i<4;i++)if(!sl[i])sl[i]=fa.shift();
    var left=COMBOS.filter(function(c){return sl.every(function(x,i){return !reading(x)||(c.indexOf(i)>=0)===x.truth})}).length;
    if(left>1){slots=sl;target=ti;return true}
   }return false});
   if(!slots)return null;
   return {statements:slots.map(function(c,i){return Object.assign({mark:MARKS[i]},c)}),options:COMBOS.map(function(c,i){return {mark:ROUND[i],text:c.map(function(x){return MARKS[x]}).join(', ')}}),answer:target};
  }

  // Map stage (theme.map): the 대상 and extra countries, five places in all, are marked A~E
  // on a map, lettered west to east. Wrong options are assignments that the shown data and
  // verified knowledge rule out. Three or more 대상 always have enough among permutations;
  // two 대상 need at least two ruled-out pairs (three options).
  // Wrong options are a uniform random choice among the ruled-out ones (at most two using a marked
  // place outside the answer). Taking the nearest swaps first left the answer at the centre of the
  // options, and 'pick the option sharing most places' found it 36~73% of the time (audit 2026-10-23).
  // With two 대상 the ruled-out assignments share a hub place, so the answer was the option sharing
  // fewest places (64%). There the four wrong options are the set that spreads each (row, place) most
  // evenly, avoiding sets where the answer is the one sharing fewest; ties are broken at random.
  function balanced(right,first,rest,r){
   var key=function(a){return a.join('|')},pool=[],seen={};seen[key(right)]=1;
   shuffle(first.concat(rest),r).forEach(function(a){if(!seen[key(a)]){seen[key(a)]=1;pool.push(a)}});
   var isMap=function(a){return first.indexOf(a)>=0};
   if(right.length!==2){var wrong=[],nMap=0;pool.forEach(function(a){if(wrong.length>=4)return;if(isMap(a)&&nMap>=2)return;wrong.push(a);if(isMap(a))nMap++});return shuffle([right].concat(wrong),r)}
   var best=null;
   (function choose(start,acc){
    if(acc.length===Math.min(4,pool.length)){
     if(acc.filter(isMap).length>2)return;
     var opts=[right].concat(acc),cnt={},spread=0;opts.forEach(function(o){o.forEach(function(n,i){cnt[i+n]=(cnt[i+n]||0)+1})});
     Object.keys(cnt).forEach(function(k){spread+=cnt[k]*cnt[k]});
     var sc=opts.map(function(x,i){return opts.reduce(function(s,y,j){return s+(i===j?0:x.filter(function(v,q){return v===y[q]}).length)},0)}),lo=Math.min.apply(null,sc);
     var cost=(sc[0]===lo&&sc.filter(function(v){return v===lo}).length===1?100:0)+spread;
     if(!best||cost<best.cost)best={cost:cost,opts:opts};
     return;
    }
    for(var i=start;i<pool.length;i++){acc.push(pool[i]);choose(i+1,acc);acc.pop()}
   })(0,[]);
   return shuffle(best.opts,r);
  }
  function injective(names,k){
   if(!k)return [[]];var out=[];
   names.forEach(function(n,i){injective(names.slice(0,i).concat(names.slice(i+1)),k-1).forEach(function(rest){out.push([n].concat(rest))})});
   return out;
  }
  function markerStage(theme,chosen,shown,avail,r,strict){
   // 실전형 (strict) has no options to narrow the pins, so only the 대상 themselves are marked: an
   // extra pin could fit a row as well (audit 2026-10-23), and their uniqueness is already checked.
   var k=chosen.length,room=strict?0:theme.mapExtras!=null?Math.min(theme.mapExtras,avail.length-k):Math.min(5,avail.length)-k,right=chosen.join('|');
   var known1=function(n){return theme.kind==='indicators'?REL.some(function(x){return visible(shown,x.indicator)&&(x.hi===n&&chosen.indexOf(x.lo)>=0||x.lo===n&&chosen.indexOf(x.hi)>=0)}):
    theme.kind==='composition'?!!orderOf(theme,n):theme.kind==='climate'?!!cl(n).type:theme.kind==='clues'?!!entity(n).clues:!!(theme.items&&theme.items[n])};
   var region=function(n){return chosen.some(function(c){return entity(c).region===entity(n).region})};
   // Countries a learner can rule out by what they know come first, then neighbours.
   var others=shuffle(avail.filter(function(n){return chosen.indexOf(n)<0}),r).map(function(n){return [(known1(n)?2:0)+(region(n)?1:0),n]})
    .sort(function(a,b){return b[0]-a[0]}).map(function(x){return x[1]});
   var sets=[];
   (function choose(start,acc){if(sets.length>=12)return;if(acc.length===room){sets.push(acc.slice());return}for(var i=start;i<others.length&&i<7;i++){acc.push(others[i]);choose(i+1,acc);acc.pop()}})(0,[]);
   var best=null;
   for(var si=0;si<sets.length;si++){
    var names=chosen.concat(sets[si]),wrong=injective(names,k).filter(function(a){return a.join('|')!==right&&!consistent(theme,chosen,known(theme,a,shown),a)});
    var viaMap=wrong.filter(function(a){return a.some(function(n){return chosen.indexOf(n)<0})});
    var score=Math.min(viaMap.length,2)*10+Math.min(wrong.length,4);
    if(!best||score>best.score)best={names:names,extra:sets[si],wrong:wrong,viaMap:viaMap,score:score};
    if(best.score>=24)break;
   }
   if(!best||best.wrong.length<(k===2?2:4))return null;
   // Up to two wrong options use a marked country outside the answer, so the map matters.
   var useMap=shuffle(best.viaMap,r).slice(0,2),key=function(a){return a.join('|')};
   var rest=shuffle(best.wrong.filter(function(a){return useMap.map(key).indexOf(key(a))<0}),r);
   var options=balanced(chosen,useMap,rest,r);
   var markers=best.names.map(function(n){return {name:n,point:entity(n).label}}).sort(function(a,b){return a.point[0]-b.point[0]});
   markers.forEach(function(m,i){m.letter='ABCDE'[i]});
   return {markers:markers,candidates:best.names.slice().sort(koSort),extra:best.extra,options:options,answer:options.map(key).indexOf(right)};
  }

  // Most draws start from a verified relation between two 대상 in the pool and add 대상
  // linked to them, so questions centre on the comparisons exams make; the rest are random.
  function draw(theme,avail,k,r,inds){
   var has=function(list,n){return list.indexOf(n)>=0};
   if(theme.sets){var fit=theme.sets.map(function(s){return s.filter(function(n){return has(avail,n)})}).filter(function(s){return s.length>=k});return fit.length?shuffle(pick(fit,r),r).slice(0,k):[]}
   if(theme.kind==='clues'){
    var first=pick(avail,r),near=shuffle(avail.filter(function(n){return n!==first&&entity(n).region===entity(first).region}),r);
    return shuffle([first].concat(near,shuffle(avail.filter(function(n){return n!==first&&!has(near,n)}),r)).slice(0,k),r);
   }
   var rels=theme.kind==='indicators'?REL.filter(function(x){return has(avail,x.hi)&&has(avail,x.lo)&&(!inds||visible(inds,x.indicator))&&inScope(theme,x.indicator)}):[];
   if(!rels.length||r()<.25)return shuffle(avail,r).slice(0,k);
   // Half the draws start from a 대상 picked uniformly, so countries with many relations
   // (중국·일본·인도) do not crowd out the rest; the other half from a relation, which keeps
   // well-connected combinations (with more comparisons for <보기>) common.
   var ends={};rels.forEach(function(x){(ends[x.hi]||(ends[x.hi]=[])).push(x);(ends[x.lo]||(ends[x.lo]=[])).push(x)});
   var first=r()<.5?pick(ends[pick(Object.keys(ends),r)],r):pick(rels,r),chosen=[first.hi,first.lo];
   while(chosen.length<k){
    var linked=[];rels.forEach(function(x){if(has(chosen,x.hi)===has(chosen,x.lo))return;var n=has(chosen,x.hi)?x.lo:x.hi;if(!has(linked,n))linked.push(n)});
    chosen.push(linked.length&&r()<.8?pick(linked,r):pick(avail.filter(function(n){return !has(chosen,n)}),r));
   }
   return shuffle(chosen,r);
  }

  function buildColumns(theme,avail,k,r,avoid,attempt){
   var hidden=apart(theme,shuffle(columnsFor(theme).filter(function(id){return (theme.noHide||[]).indexOf(id)<0}),r)).slice(0,3),own=function(n){return theme.kind!=='composition'||!!orderOf(theme,n)};
   var from=theme.kind==='composition'?avail.filter(own):avail.filter(function(n){return hidden.every(function(ind){return value(n,ind)!=null})});if(from.length<k)return null;
   var rows=theme.kind==='indicators'?draw(theme,from,k,r,hidden):shuffle(from,r).slice(0,k);
   // A composition's total column is in these tables too, so its comparisons are readings, not recall.
   var tot=theme.kind==='composition'&&composition(theme).total&&composition(theme).total.indicator;
   var shown=theme.kind==='indicators'?(theme.always||[]).concat(hidden):tot?[tot]:[];
   var signature=theme.id+'|columns|'+rows.slice().sort(koSort).join(',')+'|'+hidden.slice().sort().join(',');
   if(avoid.indexOf(signature)>=0&&attempt<450)return null;
   if(!columnsIdentifiable(theme,rows,hidden))return null;
   var s2=chooseStatements(theme,candidates(theme,rows,shown,r,true,hidden),r);if(!s2)return null;
   // 항목 식별: at least one <보기> is about A~C, or stage 2 is answered without identifying the columns.
   if(attempt<450&&!s2.statements.some(function(x){return x.kind==='colid'||x.kind==='category'}))return null;
   if(k<theme.pick[1]&&attempt<400&&s2.statements.filter(function(s){return isFocus0(theme,s)}).length<2)return null;
   var s1=stage1(hidden,r),names={};hidden.forEach(function(id){names[id]=columnName(theme,id)});
   var list=hidden.map(function(id){return names[id]}).sort(koSort).join(', ');
   return {theme:theme,format:'columns',signature:signature,labels:rows.slice(),entities:rows,hidden:hidden,shown:shown,display:columnsDisplay(theme,rows,shown,hidden),
    prompt:'표는 '+rows.join(', ')+'의 '+(theme.what||'자료')+'이다. A~C는 '+list+' 중 하나이다.',
    stage1:{question:'A~C에 해당하는 것으로 옳은 것은?',labels:COLS,names:names,options:s1.options,answer:s1.answer,cues:columnsCues(theme,rows,hidden),basis:{columns:hidden}},
    stage2:{question:'자료에 대한 설명으로 옳은 것만을 <보기>에서 고른 것은?',statements:s2.statements,options:s2.options,answer:s2.answer}};
  }

  function buildJoint(theme,avail,k,r,avoid,attempt){
   var hidden=shuffle(columnsFor(theme),r).slice(0,3),chosen=shuffle(avail,r).slice(0,k);
   var signature=theme.id+'|joint|'+chosen.slice().sort(koSort).join(',')+'|'+hidden.slice().sort().join(',');
   if(avoid.indexOf(signature)>=0&&attempt<450)return null;
   if(!jointIdentifiable(theme,chosen,hidden))return null;
   var tot=composition(theme).total&&composition(theme).total.indicator;
   var s2=chooseStatements(theme,candidates(theme,chosen,tot?[tot]:[],r,false,hidden),r);if(!s2)return null;
   if(k<theme.pick[1]&&attempt<400&&s2.statements.filter(function(s){return isFocus0(theme,s)}).length<2)return null;
   // Wrong options: one with only the 대상 swapped, one with only the columns, the rest both.
   var right=chosen.concat(hidden),key=function(o){return o.join('|')},wrong={rows:[],cols:[],both:[]};
   permutations(chosen).forEach(function(p){permutations(hidden).forEach(function(g){
    var o=p.concat(g);if(key(o)===key(right))return;
    wrong[p.join()===chosen.join()?'cols':g.join()===hidden.join()?'rows':'both'].push(o);
   })});
   // Pairs of wrong options share each part, like the answer does with them, so no option is the only
   // one whose 대상 order and column order both recur (that shape gave the answer 70%, audit 2026-10-23).
   var P=chosen.length,picked=null,rw=shuffle(wrong.rows,r),cw=shuffle(wrong.cols,r),bw=shuffle(wrong.both,r);
   for(var i=0;i<rw.length&&!picked;i++)for(var j=0;j<cw.length&&!picked;j++){
    var p1=rw[i].slice(0,P),g1=cw[j].slice(P),both=bw.find(function(o){return o.slice(0,P).join()===p1.join()&&o.slice(P).join()===g1.join()});
    var other=both&&bw.find(function(o){return o.slice(0,P).join()!==p1.join()&&o.slice(P).join()!==g1.join()});
    if(both&&other)picked=[rw[i],cw[j],both,other];
   }
   if(!picked){picked=rw.slice(0,1).concat(cw.slice(0,1));picked=picked.concat(bw.slice(0,4-picked.length))}
   var options=shuffle([right].concat(picked),r),names={};hidden.forEach(function(id){names[id]=columnName(theme,id)});
   var range=LABELS[0]+'~'+LABELS[k-1],list=hidden.map(function(id){return names[id]}).sort(koSort).join(', '),who=chosen.slice().sort(koSort).join(', ');
   var basis=known(theme,chosen,[]);basis.columns=hidden;
   return {theme:theme,format:'joint',signature:signature,labels:LABELS.slice(0,k),entities:chosen,hidden:hidden,shown:[],display:columnsDisplay(theme,chosen,[],hidden,LABELS),
    prompt:(theme.jointPrompt||theme.prompt).split('{range}').join(range).split('{candidates}').join(who).split('{columns}').join(list),
    stage1:{question:range+'와 A~C에 해당하는 것으로 옳은 것은?',rows:k,labels:COLS,names:names,options:options,answer:options.map(key).indexOf(key(right)),cues:cues(theme,chosen,[]).concat(columnsCues(theme,chosen,hidden)),basis:basis},
    stage2:{question:range+'와 A~C에 대한 설명으로 옳은 것만을 <보기>에서 고른 것은?',statements:s2.statements,options:s2.options,answer:s2.answer}};
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
   var size=r(),avoid=opts.avoid||[];
   // One question format per build: 대상 식별 (rows), 항목 식별 (columns) where the theme has
   // columns to hide, or 실전형 (implicit: no separate stage 1, as on the exam paper).
   var mode=opts.format||(target?'rows':null),roll0=r();
   for(var attempt=0;attempt<600&&pool.length;attempt++){
    var theme=pick(pool,r),avail=theme.pool.filter(function(n){return hasData(theme,n)});
    var k=theme.pick[0]+Math.floor((attempt<400?size:r())*(theme.pick[1]-theme.pick[0]+1));if(avail.length<k)continue;
    // Two 대상 only for targeted practice of a pair: their wrong options cannot share a place with the
    // answer, so 'pick the option sharing fewest' found it 56~64% of the time (audit 2026-10-23).
    if(k===2&&!target&&theme.pick[1]>2)k=3;
    // everyKnown themes draw the 대상 from those with verified knowledge; extras on the map may be any.
    var own=function(n){return theme.kind==='composition'?!!orderOf(theme,n):theme.kind==='climate'?!!cl(n).type:true};
    // A theme without three columns to hide, or a 항목 식별 draw that keeps failing, falls back to 대상 식별.
    // The format is fixed for the first attempts; later ones re-roll, so when the recent questions
    // have used up one format (전력 대상 식별 has four), another format is tried instead of a repeat.
    // A joint theme (종교) splits the 항목 식별 share with 동시 식별, where rows and columns are both hidden.
    var recipe=!target&&theme.tableRecipes&&roll0<theme.tableRecipes[0].chance?theme.tableRecipes[0]:null;
    var canHide=columnsFor(theme).length>=3&&!theme.periodTable&&!recipe,canJoint=canHide&&!!theme.joint&&theme.kind==='composition',roll=attempt<150?roll0:r();
    var format=(mode==='columns'&&!canHide)||(mode==='joint'&&!canJoint)?'rows':mode||(roll<.35&&canHide&&attempt<300?(canJoint&&roll>=.15?'joint':'columns'):roll>.8?'implicit':'rows');
    if(format==='columns'){var cq=buildColumns(theme,avail,k,r,avoid,attempt);if(cq)return cq;continue}
    if(format==='joint'){var jq=buildJoint(theme,avail,k,r,avoid,attempt);if(jq)return jq;continue}
    var known0=theme.everyKnown&&theme.kind!=='indicators'?avail.filter(own):avail;
    if(known0.length<k)continue;
    // A recipe is a lecture-backed exercise in computing a share with two denominators.
    // Keep the ordinary tables as well; targeted pair practice retains its existing draw path.
    if(recipe)known0=known0.filter(function(n){return recipe.pool.indexOf(n)>=0});
    var chosen=draw(theme,known0,k,r,recipe&&recipe.columns),shown=[];
    // theme.damp: a 대상 with many relations (중국) is kept in a draw only with this chance, so the
    // theme is not mostly about it (audit 2026-10-23: 중국 in 83% of 국가별 농목업 questions).
    if(theme.damp&&!target&&attempt<300&&chosen.some(function(n){return theme.damp[n]!=null&&r()>theme.damp[n]}))continue;
    if(target){
     if(avail.indexOf(target.hi)<0||avail.indexOf(target.lo)<0)continue;
     chosen=shuffle([target.hi,target.lo].concat(shuffle(avail.filter(function(n){return n!==target.hi&&n!==target.lo}),r).slice(0,k-2)),r);
    }
    if(theme.kind==='composition'&&composition(theme).total&&composition(theme).total.indicator)shown=[composition(theme).total.indicator];
    if(theme.kind==='clues')shown=chosen.map(function(n){return n+'#'+Math.floor(r()*entity(n).clues.length)});
    if(theme.kind==='indicators'){
     var always=theme.always||[],inds=theme.indicators.filter(function(ind){return meta(ind)&&!meta(ind).disabled&&always.indexOf(ind)<0});
     // A source without a value for one 대상 (no coffee in France) is not shown as 0; the column is left out.
     shown=recipe?recipe.columns.slice():always.concat(apart(theme,shuffle(inds.filter(function(ind){return chosen.every(function(n){return value(n,ind)!=null})&&!sameCell(chosen,ind)}),r)).slice(0,theme.show));
    }
    // Skip a question the learner saw recently (opts.avoid), while other ones can still be made.
    var signature=theme.id+'|'+chosen.slice().sort(koSort).join(',')+'|'+shown.slice().sort().join(',');
    if(avoid.indexOf(signature)>=0&&attempt<450)continue;
    if(!identifiable(theme,chosen,shown))continue;
    if(theme.requiresAllColumns&&shown.some(function(ind){return identifiable(theme,chosen,shown.filter(function(x){return x!==ind}))}))continue;
    // A column shown on every question (총인구) is there for computing totals; if it alone
    // identified the 대상, the theme's own indicators would be decoration.
    // A two-period table (periodTable) is read through its two year columns, so they may identify.
    if(theme.always&&theme.always.length&&!theme.periodTable&&identifiable(theme,chosen,theme.always))continue;
    if(theme.needsAlways&&identifiable(theme,chosen,shown.filter(function(i){return theme.always.indexOf(i)<0})))continue;
    // everyKnown: each 대상 is identified by its own verified knowledge, never by elimination.
    if(theme.everyKnown&&chosen.some(function(n){return theme.kind!=='indicators'?!own(n):!REL.some(function(x){return visible(shown,x.indicator)&&(x.hi===n||x.lo===n)&&chosen.indexOf(x.hi)>=0&&chosen.indexOf(x.lo)>=0})}))continue;
    var pair=theme.map?markerStage(theme,chosen,shown,avail,r,format==='implicit'):null;if(theme.map&&!pair)continue;
    var s2=chooseStatements(theme,candidates(theme,chosen,shown,r),r,!!target);if(!s2)continue;
    // Fewer 대상 leave fewer pairs to compare; such a draw whose <보기> are mostly background is redrawn.
    if(k<theme.pick[1]&&attempt<400&&s2.statements.filter(function(s){return isFocus0(theme,s)}).length<2)continue;
    if(target){
     var learned=(known(theme,chosen,shown).relations||[]).some(function(x){return x.indicator===target.indicator&&x.hi===target.hi&&x.lo===target.lo});
     var asked=s2.statements.some(function(s){var c=s.check;return c&&(c.ind||c.indicator)===target.indicator&&[c.subject,c.object].indexOf(target.hi)>=0&&[c.subject,c.object].indexOf(target.lo)>=0});
     if(!learned&&!asked)continue;
    }
    var s1=pair||stage1(chosen,r),range=k===2?LABELS[0]+', '+LABELS[1]:LABELS[0]+'~'+LABELS[k-1];
    var letters=pair?pair.markers.map(function(m){return m.letter}):[],letterOf=function(n){var m=pair&&pair.markers.find(function(x){return x.name===n});return m?m.letter:null};
    var names=pair?pair.candidates:chosen.slice().sort(koSort),basis=known(theme,pair?names:chosen,shown),cueList=cues(theme,chosen,shown);
    // Say how each extra candidate is ruled out.
    if(pair)pair.extra.forEach(function(n){
     var o=theme.kind==='composition'&&orderOf(theme,n),it=theme.kind==='items'&&theme.items[n],ct=theme.kind==='climate'&&cl(n);
     var why=(basis.relations||[]).filter(function(x){return x.hi===n||x.lo===n}).map(function(x){return meta(x.indicator).label+' '+x.hi+' > '+x.lo})
      .concat((basis.signs||[]).filter(function(x){return x.entity===n}).map(function(x){return meta(x.indicator).label+(x.positive?' 양(+)':' 음(−)')}))
      .concat(o?[o.order.map(function(id){return catLabel(theme,id)}).join(' > ')+(o.order.length===1?' 1위':'')]:[],it?[it[0][0]+' 1위 품목']:[],
       ct?[ct.type?typeLabel(ct.type):null,ct.hemisphere==='S'?'남반구':'북반구'].filter(Boolean):[]);
     var inOptions=s1.options.some(function(o){return o.indexOf(n)>=0});
     // A place that the shown data and knowledge cannot exclude is out only because no option uses it.
     var fits=injective(names,chosen.length).some(function(a){return a.indexOf(n)>=0&&consistent(theme,chosen,known(theme,a,shown),a)});
     cueList.push({label:'후보',name:n,cue:!inOptions?'선택지에 나오지 않음':fits?'표와 지식만으로는 배제되지 않음 · 그 배정이 선택지에 없음':why.length?why.join(' · '):'다른 선택지로 소거'});
    });
    cueList.forEach(function(c){c.letter=letterOf(c.name)});
    return {theme:theme,format:format,signature:signature,labels:LABELS.slice(0,k),entities:chosen,shown:shown,display:display(theme,chosen,shown),
     prompt:theme.prompt.split('{range}').join(range).split('{candidates}').join(names.join(', ')),
     mapPrompt:pair?theme.prompt.split('{range}').join(range).split('{candidates}').join('지도에 표시된 '+letters[0]+'~'+letters[letters.length-1]):null,
     stage1:{question:range+'에 해당하는 것으로 옳은 것은?',implicit:format==='implicit',options:s1.options,answer:s1.answer,candidates:pair?names:null,markers:pair?pair.markers:null,cues:cueList,basis:basis},
     stage2:{question:range+'에 대한 설명으로 옳은 것만을 <보기>에서 고른 것은?',statements:s2.statements,options:s2.options,answer:s2.answer}};
   }
   return null;
  }
  return {themes:ready,build:build,identifiable:identifiable,columnsIdentifiable:columnsIdentifiable,columnsConsistent:columnsConsistent,jointIdentifiable:jointIdentifiable,jointLeft:jointLeft,catLabel:catLabel,candidates:candidates,known:known,relation:relation,value:value,comp:comp,total:total,seeded:seeded,LABELS:LABELS,COMBOS:COMBOS};
 }
 return {create:create,seeded:seeded,topic:topic};
});
