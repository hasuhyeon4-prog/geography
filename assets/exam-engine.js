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
  // Climate themes: a site's verified climate type and its hemisphere are what a student brings.
  var CLIMATE=kb.climate||{types:{}};
  function cl(n){var e=entity(n);return e&&e.climate}
  function typeLabel(t){return CLIMATE.types[t]||t}
  // Köppen letters as the lecture writes them: Aw, BS, Cfb, ET.
  function code(t){return t.split('').map(function(ch,i){return i===0||(i===1&&/[be]/.test(t[0]))?ch.toUpperCase():ch}).join('')}
  // Could these monthly data be of type t? Only the code letters the data decide reliably count.
  function climateFits(c,t){for(var i=0;i<Math.min(c.robust,t.length);i++)if(c.computed[i]!==t[i])return false;return true}
  // Placing site n on the row that holds site d's graph is ruled out when d's data clearly
  // contradict n's verified type, or their seasons put the row in the other hemisphere.
  function climateBreaks(n,d){var s=cl(n),r=cl(d);return !!(s.type&&!climateFits(r,s.type))||!!(r.signal&&r.signal!==s.hemisphere)}
  // Which options each region holds. A false claim must name something a country of the same
  // region really has, so "우간다는 APEC 회원국이다" never serves as a free distractor.
  var HOLDERS={};
  Object.keys(kb.entities).forEach(function(n){var e=kb.entities[n];if(!e.region)return;Object.keys(e.facts||{}).forEach(function(set){var h=HOLDERS[set]||(HOLDERS[set]={}),g=h[e.region]||(h[e.region]={});e.facts[set].values.forEach(function(v){g[v]=1})})});
  function plausible(set,name,v){var e=entity(name),g=e&&e.region&&HOLDERS[set]&&HOLDERS[set][e.region];return !!(g&&g[v])}
  // A hemisphere is worth a <보기> only for a country within this many degrees of the equator.
  var NEAR_EQUATOR=25,LINE_NEAR={equator:12,meridian:8};
  function allowed(theme,set){var f=theme.followups&&theme.followups.facts;return !f||f.indexOf(set)>=0}
  function koSort(a,b){return a.localeCompare(b,'ko')}
  function span(x,ind){if(!x.years)return '';var m=ind&&meta(ind);return m&&m.static?x.years.join('·')+'년 기준':x.years[0]+'~'+x.years[1]+'년 매년'}

  function hasData(theme,name){
   if(!entity(name))return false;
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
    relations:REL.filter(function(x){return shown.indexOf(x.indicator)>=0&&has(x.hi)&&has(x.lo)}),
    signs:SIGNS.filter(function(x){return shown.indexOf(x.indicator)>=0&&has(x.entity)})};
   if(theme.kind==='composition'){var c=composition(theme);return {orders:chosen.map(function(n){return orderOf(theme,n)}).filter(Boolean),
    relations:c.total&&c.total.indicator?REL.filter(function(x){return x.indicator===c.total.indicator&&has(x.hi)&&has(x.lo)}):[]};}
   if(theme.kind==='climate')return {sites:chosen.map(function(n){return {entity:n,type:cl(n).type,hemisphere:cl(n).hemisphere}})};
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
   if(theme.kind==='climate'){
    // All graphs share one scale, as on an exam page, so they can be compared by eye.
    var T=[],P=[];chosen.forEach(function(n){T=T.concat(cl(n).temperature);P=P.concat(cl(n).precipitation)});
    return {kind:'climate',columns:[],rows:chosen.map(function(n,i){var c=cl(n);return {label:LABELS[i],temperature:c.temperature,precipitation:c.precipitation,cells:[]}}),
     scale:{tMin:Math.min(0,Math.floor(Math.min.apply(null,T)/10)*10),tMax:Math.max(10,Math.ceil(Math.max.apply(null,T)/10)*10),pMax:Math.max(100,Math.ceil(Math.max.apply(null,P)/100)*100)},
     source:CLIMATE.period.join('~')+'년 평년값 · '+CLIMATE.source};
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
    else if(theme.kind==='climate'){var c=cl(n);if(c.type)parts.push(typeLabel(c.type));if(c.signal)parts.push((c.signal==='S'?'남반구':'북반구')+'(최한월 '+c.coldest+'월)')}
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

  // Climate <보기>: readings of the graphs, the map position, and the verified climate type.
  var GRAPH=[
   ['range','기온의 연교차','가 크다',3,'℃',function(c){return c.range}],
   ['coldest','최한월 평균 기온','이 높다',3,'℃',function(c){return Math.min.apply(null,c.temperature)}],
   ['warmest','최난월 평균 기온','이 높다',3,'℃',function(c){return Math.max.apply(null,c.temperature)}],
   ['annual','연 강수량','이 많다',0,'mm',function(c){return c.annual}],
   ['summer','연 강수량 중 6~8월 강수량의 비중','이 높다',15,'%',function(c){return c.summerShare}]
  ];
  function climateExplain(n){var c=cl(n);return n+' — 강의 기후형 '+typeLabel(c.lecture)+'('+code(c.lecture)+'), 관측소 평년값 분류 '+code(c.computed)+' · '+c.station.replace(/_\d+$/,'')}
  function climateCandidates(theme,chosen,r){
   var out=[],L=function(n){return LABELS[chosen.indexOf(n)]};
   function add(c){if(!out.some(function(x){return x.text===c.text}))out.push(c)}
   function ordered(p,va,vb){var hi=va>vb?p[0]:p[1],lo=hi===p[0]?p[1]:p[0],truth=r()<.5;return {hi:hi,lo:lo,truth:truth,s:truth?[hi,lo]:[lo,hi]}}
   pairs(chosen).forEach(function(p){
    var a=cl(p[0]),b=cl(p[1]);
    // A reading is asked only when the graphs show it plainly (3℃, 15%p, or 1.3배·150mm apart).
    GRAPH.forEach(function(g){
     var va=g[5](a),vb=g[5](b),clear=g[0]==='annual'?Math.max(va,vb)>=1.3*Math.min(va,vb)&&Math.abs(va-vb)>=150:Math.abs(va-vb)>=g[3];
     if(!clear)return;
     var o=ordered(p,va,vb);
     add({kind:'graph',key:'graph|'+g[0]+'|'+p.join('|'),text:L(o.s[0])+'는 '+L(o.s[1])+'보다 '+g[1]+g[2]+'.',truth:o.truth,
      explain:'그래프 읽기: '+o.hi+' '+fmt(g[5](cl(o.hi)))+g[4]+', '+o.lo+' '+fmt(g[5](cl(o.lo)))+g[4]+(g[0]==='range'?' (최난월 − 최한월)':''),check:{metric:g[0],subject:o.s[0],object:o.s[1]}});
    });
    var la=Math.abs(a.lat),lb=Math.abs(b.lat);
    if(Math.abs(la-lb)>=8){var o=ordered(p,la,lb);
     add({kind:'place',key:'lat|'+p.join('|'),text:L(o.s[0])+'는 '+L(o.s[1])+'보다 고위도에 위치한다.',truth:o.truth,explain:o.hi+' 위도 '+fmt(Math.abs(cl(o.hi).lat))+'°, '+o.lo+' '+fmt(Math.abs(cl(o.lo).lat))+'°',check:{place:'lat',subject:o.s[0],object:o.s[1]}})}
    if(a.elevation!=null&&b.elevation!=null&&Math.abs(a.elevation-b.elevation)>=800){var e=ordered(p,a.elevation,b.elevation);
     add({kind:'place',key:'alt|'+p.join('|'),text:L(e.s[0])+'는 '+L(e.s[1])+'보다 해발 고도가 높다.',truth:e.truth,explain:e.hi+' 관측소 해발 '+fmt(cl(e.hi).elevation)+'m, '+e.lo+' '+fmt(cl(e.lo).elevation)+'m',check:{place:'alt',subject:e.s[0],object:e.s[1]}})}
   });
   chosen.forEach(function(n){
    var c=cl(n);
    if(Math.abs(c.lat)>=5){var south=c.hemisphere==='S',t=r()<.5;
     add({kind:'place',key:'hemi|'+n,text:L(n)+'는 '+(south===t?'남반구':'북반구')+'에 위치한다.',truth:t,explain:n+' 위도 '+fmt(c.lat)+'° — '+(south?'남반구':'북반구'),check:{place:'hemisphere',entity:n,value:south===t?'S':'N'}})}
    if(!c.type)return;
    add({kind:'climate',key:'type|'+n,text:L(n)+'는 '+typeLabel(c.type)+'가 나타난다.',truth:true,explain:climateExplain(n),check:{type:c.type,entity:n}});
    // A wrong type the data clearly rule out: another site's type in this question, else one of the same group.
    var others=chosen.map(function(o){return cl(o).type}).filter(function(t){return t&&t!==c.type&&!climateFits(c,t)});
    var group=Object.keys(CLIMATE.types).filter(function(t){return t!=='h'&&t!==c.type&&t[0]===c.type[0]&&!climateFits(c,t)});
    var w=others.length?pick(others,r):group.length?pick(group,r):null;
    if(w)add({kind:'climate',key:'type|'+n,text:L(n)+'는 '+typeLabel(w)+'가 나타난다.',truth:false,explain:climateExplain(n),check:{type:w,entity:n}});
   });
   return out;
  }

  function candidates(theme,chosen,shown,r){
   if(theme.kind==='climate')return climateCandidates(theme,chosen,r);
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
    // '적도가 지난다' / '본초 자오선이 지난다': true when a landmass crosses the line; false only
    // for a country near it (within LINE_NEAR degrees but at least half a degree away).
    [['equator','적도'],['meridian','본초 자오선']].forEach(function(x){
     var l=e.lines&&e.lines[x[0]];if(!l||l.undecided||!allowed(theme,x[0]))return;
     if(!l.crosses&&(l.dist<.5||l.dist>LINE_NEAR[x[0]]))return;
     var w=x[1]+subjectParticle(x[1]);
     add({kind:'fact',key:x[0]+'|'+n,text:L(n)+'는 '+w+' 지난다.',truth:l.crosses,
      explain:n+'의 국토'+(l.crosses?'를 '+w+' 지난다.':'는 '+x[1]+'에서 약 '+fmt(l.dist)+'° 떨어져 있어 '+w+' 지나지 않는다.'),check:{line:x[0],entity:n,value:true}});
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
      // A catch-all category ('기타') names no single thing whose amount could be compared.
      if(cat==='other'||ca[cat]<1||cb[cat]<1)return;
      var amtA=ca[cat]*ta/100,amtB=cb[cat]*tb/100,s0=trap(p,ca[cat],cb[cat],amtA,amtB,1.5);if(!s0)return;
      var truth=r()<.5,s=truth?s0:[s0[1],s0[0]],amt=function(n){return n===p[0]?amtA:amtB};
      var noun=catLabel(theme,cat)+' '+(theme.amountNoun||'인구');
      add({kind:'data',key:'amount|'+cat+'|'+p[0]+'|'+p[1],check:{category:cat,subject:s[0],object:s[1]},text:L(s[0])+'는 '+L(s[1])+'보다 '+noun+subjectParticle(noun)+' 많다.',truth:truth,
       explain:'표의 비율 × '+c.total.label+': '+s0[0]+' 약 '+fmt(amt(s0[0]))+c.total.unit+', '+s0[1]+' 약 '+fmt(amt(s0[1]))+c.total.unit+' — 비율은 반대지만 '+c.total.label+' 차이 때문에 실제 '+(/수$/.test(theme.amountNoun||'')?'수':'양')+'는 이렇다. (비율·'+c.total.label+' 모두 '+c.year+'년 '+c.source+')'});
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
   function isFocus(c){return c.kind==='compare'||c.kind==='sign'||c.kind==='data'||c.kind==='graph'||c.kind==='climate'||!!(c.check&&c.check.set&&focusSets.indexOf(c.check.set)>=0)}
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

  // Map stage (theme.map): the 대상 and extra countries, five places in all, are marked A~E
  // on a map, lettered west to east. Wrong options are assignments that the shown data and
  // verified knowledge rule out. Three or more 대상 always have enough among permutations;
  // two 대상 need at least two ruled-out pairs (three options).
  function injective(names,k){
   if(!k)return [[]];var out=[];
   names.forEach(function(n,i){injective(names.slice(0,i).concat(names.slice(i+1)),k-1).forEach(function(rest){out.push([n].concat(rest))})});
   return out;
  }
  function markerStage(theme,chosen,shown,avail,r){
   var k=chosen.length,room=Math.min(5,avail.length)-k,right=chosen.join('|');
   var known1=function(n){return theme.kind==='indicators'?REL.some(function(x){return shown.indexOf(x.indicator)>=0&&(x.hi===n&&chosen.indexOf(x.lo)>=0||x.lo===n&&chosen.indexOf(x.hi)>=0)}):
    theme.kind==='composition'?!!orderOf(theme,n):theme.kind==='climate'?!!cl(n).type:!!(theme.items&&theme.items[n])};
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
   var options=shuffle([chosen].concat(useMap,rest).slice(0,5),r);
   var markers=best.names.map(function(n){return {name:n,point:entity(n).label}}).sort(function(a,b){return a.point[0]-b.point[0]});
   markers.forEach(function(m,i){m.letter='ABCDE'[i]});
   return {markers:markers,candidates:best.names.slice().sort(koSort),extra:best.extra,options:options,answer:options.map(key).indexOf(right)};
  }

  // Most draws start from a verified relation between two 대상 in the pool and add 대상
  // linked to them, so questions centre on the comparisons exams make; the rest are random.
  function draw(theme,avail,k,r){
   var has=function(list,n){return list.indexOf(n)>=0};
   var rels=theme.kind==='indicators'?REL.filter(function(x){return has(avail,x.hi)&&has(avail,x.lo)}):[];
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
   for(var attempt=0;attempt<600&&pool.length;attempt++){
    var theme=pick(pool,r),avail=theme.pool.filter(function(n){return hasData(theme,n)});
    var k=theme.pick[0]+Math.floor((attempt<400?size:r())*(theme.pick[1]-theme.pick[0]+1));if(avail.length<k)continue;
    // everyKnown themes draw the 대상 from those with verified knowledge; extras on the map may be any.
    var own=function(n){return theme.kind==='composition'?!!orderOf(theme,n):theme.kind==='climate'?!!cl(n).type:true};
    var known0=theme.everyKnown&&theme.kind!=='indicators'?avail.filter(own):avail;
    if(known0.length<k)continue;
    var chosen=draw(theme,known0,k,r),shown=[];
    if(target){
     if(avail.indexOf(target.hi)<0||avail.indexOf(target.lo)<0)continue;
     chosen=shuffle([target.hi,target.lo].concat(shuffle(avail.filter(function(n){return n!==target.hi&&n!==target.lo}),r).slice(0,k-2)),r);
    }
    if(theme.kind==='composition'&&composition(theme).total&&composition(theme).total.indicator)shown=[composition(theme).total.indicator];
    if(theme.kind==='indicators'){
     var always=theme.always||[],inds=theme.indicators.filter(function(ind){return meta(ind)&&!meta(ind).disabled&&always.indexOf(ind)<0});
     shown=always.concat(shuffle(inds,r).slice(0,theme.show));
    }
    // Skip a question the learner saw recently (opts.avoid), while other ones can still be made.
    var signature=theme.id+'|'+chosen.slice().sort(koSort).join(',')+'|'+shown.slice().sort().join(',');
    if(avoid.indexOf(signature)>=0&&attempt<450)continue;
    if(!identifiable(theme,chosen,shown))continue;
    // A column shown on every question (총인구) is there for computing totals; if it alone
    // identified the 대상, the theme's own indicators would be decoration.
    if(theme.always&&theme.always.length&&identifiable(theme,chosen,theme.always))continue;
    // everyKnown: each 대상 is identified by its own verified knowledge, never by elimination.
    if(theme.everyKnown&&chosen.some(function(n){return theme.kind!=='indicators'?!own(n):!REL.some(function(x){return shown.indexOf(x.indicator)>=0&&(x.hi===n||x.lo===n)&&chosen.indexOf(x.hi)>=0&&chosen.indexOf(x.lo)>=0})}))continue;
    var pair=theme.map?markerStage(theme,chosen,shown,avail,r):null;if(theme.map&&!pair)continue;
    var s2=chooseStatements(theme,candidates(theme,chosen,shown,r),r);if(!s2)continue;
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
     cueList.push({label:'후보',name:n,cue:!inOptions?'선택지에 나오지 않음':why.length?why.slice(0,3).join(' · '):'다른 선택지로 소거'});
    });
    cueList.forEach(function(c){c.letter=letterOf(c.name)});
    return {theme:theme,signature:signature,labels:LABELS.slice(0,k),entities:chosen,shown:shown,display:display(theme,chosen,shown),
     prompt:theme.prompt.split('{range}').join(range).split('{candidates}').join(names.join(', ')),
     mapPrompt:pair?theme.prompt.split('{range}').join(range).split('{candidates}').join('지도에 표시된 '+letters[0]+'~'+letters[letters.length-1]):null,
     stage1:{question:range+'에 해당하는 것으로 옳은 것은?',options:s1.options,answer:s1.answer,candidates:pair?names:null,markers:pair?pair.markers:null,cues:cueList,basis:basis},
     stage2:{question:range+'에 대한 설명으로 옳은 것만을 <보기>에서 고른 것은?',statements:s2.statements,options:s2.options,answer:s2.answer}};
   }
   return null;
  }
  return {themes:ready,build:build,identifiable:identifiable,candidates:candidates,known:known,relation:relation,value:value,comp:comp,total:total,seeded:seeded,LABELS:LABELS,COMBOS:COMBOS};
 }
 return {create:create,seeded:seeded,topic:topic};
});
