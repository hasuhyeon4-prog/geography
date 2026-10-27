/* Pure, seeded data-reading generators. Supplied values never become recall facts.
 * Identification uses explicit reference data, not an unverified country ranking.
 * Every statement stores its operands and a correct reading (including false cases).
 */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WGMaterials=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
var L=['(가)','(나)','(다)'],MARKS=['ㄱ','ㄴ','ㄷ','ㄹ'];
function rng(seed){var a=seed>>>0;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(a,r){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function sum(a){return a.reduce(function(s,x){return s+x;},0);}
function mean(a){return sum(a)/a.length;}
function round(x,n){var p=Math.pow(10,n==null?1:n);return Math.round(x*p)/p;}
function fmt(x,n){return round(x,n).toLocaleString('ko-KR',{maximumFractionDigits:n==null?1:n});}
function perms(a){if(a.length<2)return[a.slice()];return a.flatMap(function(x,i){return perms(a.slice(0,i).concat(a.slice(i+1))).map(function(p){return[x].concat(p);});});}
function finite(x){if(!Number.isFinite(x))throw Error('Missing or non-finite input');return x;}
function growth(a,b){if(!(a>0))throw Error('Growth denominator must be positive');return(b-a)/a*100;}
function cumulative(a){var n=0;return a.map(function(v){return n+=finite(v);});}
function season(c,months){return sum(months.map(function(m){return c[m-1]-(m===1?0:c[m-2]);}));}
function age(y,o){var w=100-y-o;if(y<0||o<0||w<=0)throw Error('Invalid age shares');return{y:y,o:o,w:w,young:y/w*100,old:o/w*100,total:(y+o)/w*100,aging:y?o/y*100:null};}
function workforce(d){if(d<0)throw Error('Negative dependency');return 10000/(100+d);}
var RAD=Math.PI/180;
function declination(day){return 23.44*Math.sin(2*Math.PI*(day-80)/365);}
function daylight(lat,decl){var h=-Math.tan(lat*RAD)*Math.tan(decl*RAD);return h>=1?0:h<=-1?24:24/Math.PI*Math.acos(h);}
function noonAltitude(lat,decl){return 90-Math.abs(lat-decl);}
var DAY=[15,46,74,105,135,166,196,227,258,288,319,349];
function solar(lat){return DAY.map(function(d){return daylight(lat,declination(d));});}
function normalize(rows,max){return rows.map(function(row){return row.map(function(v,j){var den=Math.max.apply(null,rows.map(function(x){return x[j];}));if(den<=0)throw Error('Zero radar maximum');return v/den*max;});});}
function ternary(v,min){min=min||[0,0,0];if(Math.abs(sum(v)-100)>1e-6)throw Error('Composition must total 100');var rest=100-sum(min);if(rest<=0||v.some(function(x,i){return x<min[i]-1e-9;}))throw Error('Outside ternary bounds');var a=v.map(function(x,i){return(x-min[i])/rest;});return{x:a[1]+a[2]/2,y:a[2]*Math.sqrt(3)/2};}
function distance(a,b){var f1=a.lat*RAD,f2=b.lat*RAD,df=f2-f1,dl=(b.lon-a.lon)*RAD;var h=Math.sin(df/2)**2+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
function zeroCrossing(depth,temp){for(var i=1;i<depth.length;i++){if(temp[i-1]>=0&&temp[i]<=0)return depth[i-1]+(depth[i]-depth[i-1])*temp[i-1]/(temp[i-1]-temp[i]);}throw Error('No thaw-front crossing');}
function bandScore(value,limits,direction){var score=value<limits[0]?1:value<limits[1]?2:3;return direction===-1?4-score:score;}
function filterRows(rows,conditions,logic){return rows.filter(function(row){var hits=conditions.map(function(c){var v=row[c.column];return c.operator==='>='?v>=c.value:c.operator==='>'?v>c.value:c.operator==='<='?v<=c.value:v<c.value;});return logic==='OR'?hits.some(Boolean):hits.every(Boolean);});}
function seedState(seed){return rng(seed==null?1:seed);}
function table(headers,rows,caption){return{kind:'table',headers:headers,rows:rows,caption:caption||''};}
function pair(goal,yes,no,explain,check){return{goal:goal,yes:yes,no:no,explain:explain,check:check||{}};}
function finish(q,r){
 if(q.assignment){var assignments=perms(q.assignment);if(assignments.length>6)assignments=[q.assignment].concat(shuffle(assignments.filter(function(x){return x.join('|')!==q.assignment.join('|');}),r).slice(0,4));var options=shuffle(assignments,r);q.stage1={question:q.identify||q.assignment.map(function(_,i){return L[i];}).join('·')+'에 해당하는 대상을 순서대로 고른 것은?',options:options.map(function(x){return x.join(' · ');}),answer:options.findIndex(function(x){return x.join('|')===q.assignment.join('|');}),explain:q.identifyExplain||'제시한 기준표의 값과 그래프의 값을 대응한다.'};}
 if(!q.stage1)throw Error('Identification is required');
 // Reorder supplied options too: several fixed source examples otherwise
 // expose the same answer position on every attempt.
 var order=shuffle(q.stage1.options.map(function(_,i){return i;}),r),answer=q.stage1.answer;
 q.stage1.options=order.map(function(i){return q.stage1.options[i];});
 q.stage1.answer=order.indexOf(answer);
 var selected=shuffle(q.pairs,r).slice(0,Math.min(4,q.pairs.length));
 var flags=selected.map(function(){return r()<.5;});
 q.statements=selected.map(function(p,i){var truth=flags[i];return{text:truth?p.yes:p.no,truth:truth,explain:p.explain,goal:p.goal,check:p.check,mark:MARKS[i]};});
 var correct=q.statements.map(function(x,i){return x.truth?i:-1;}).filter(function(i){return i>=0;});
 // All subsets, rather than a hard-coded five combinations, keep every truth pattern playable.
 var subsets=[];for(var mask=0;mask<(1<<selected.length);mask++)subsets.push(selected.map(function(_,i){return mask&(1<<i)?i:-1;}).filter(function(i){return i>=0;}));
 var others=shuffle(subsets.filter(function(s){return s.join(',')!==correct.join(',');}),r).slice(0,4);
 var answers=shuffle([correct].concat(others),r);
 q.stage2={question:'자료에 대한 설명으로 옳은 것만 고른 것은?',options:answers.map(function(a){return a.length?a.map(function(i){return MARKS[i];}).join(', '):'옳은 설명 없음';}),answer:answers.findIndex(function(a){return a.join(',')===correct.join(',');}),subsets:answers};
 q.goalIds=[...new Set(q.pairs.map(function(p){return p.goal;}))];return q;
}
function create(data){
 var sites=data.climate.sites;
 function site(n){if(!sites[n])throw Error('Unavailable station '+n);return sites[n];}
 function picked(names,r){return shuffle(names.map(function(n){return site(n);}),r);}
 function base(id,title,seed,source){return{id:id,title:title,seed:seed,source:source||'',figures:[],tables:[],pairs:[],note:'제시 자료의 수치를 읽는 연습이다.'};}
 function energyQ(mode,seed){
  var r=seedState(seed),composition=mode==='energy-composition',names=shuffle(composition?['미국','이란','오스트레일리아']:['미국','중국'],r),years=composition?['2000','2018']:['1990','2020'],fields=composition?['coal_share_energy','oil_share_energy','gas_share_energy']:['coal_consumption','oil_consumption','gas_consumption','renewables_consumption'],labels=composition?['석탄','석유','천연가스','기타']:['석탄','석유','천연가스','재생에너지'];
  var q=base(mode,composition?'두 시점 1차 에너지 소비 구성':'두 시점 에너지원별 소비량',seed,data.energy.source+' · 고정 원자료');q.assignment=names;
  q.note=composition?'원자료의 1차 에너지 소비 구성(대체법)이다. 기타는 100−세 화석 연료 비중이다. 비중 그래프만으로 총공급량 변화를 정하지 않는다.':'미국·중국 중 하나이다. TWh를 EJ로 환산했다(1TWh=0.0036EJ). 제시한 네 에너지원만의 자료이며 합계가 국가 전체 소비량은 아니다. 수치를 외우지 않고 변화 방향을 읽는다.';
  q.identifyExplain=composition?'미국의 석탄 비중 감소·가스 증가, 이란의 가스 증가, 오스트레일리아의 석탄→석유 1위 역전을 함께 대응한다.':'1990~2020년 미국의 석탄 소비량은 감소하고 중국은 증가했다. 석탄 방향은 기준 연도 주변의 가용 원자료에서도 같다.';
  if(!composition)q.note+=' 기준 연도 ±5년의 석탄 방향 검증은 1985~1995×2015~2025의 121쌍이다. 2025년 끝점은 미국 EIA·중국 국가통계국의 국가 통계로 보완했고, 중국은 잠정 총량×비중 복원값이다. 기관·판본 차이가 있어 끝점 검증 외에 다른 값으로 일반화하지 않는다.';
  var values=names.map(function(n){return years.map(function(y){var row=data.energy.countries[n][y],v=fields.map(function(f){return finite(row[f]);});if(composition){var other=100-sum(v);if(other<0)throw Error('Invalid primary-energy shares');return v.concat(other);}return v.map(function(x){return x*.0036;});});});
  var max=Math.max.apply(null,values.flat(2));
  names.forEach(function(n,i){
   if(composition)q.figures.push({kind:'stacked',name:L[i],labels:years,categories:labels,values:values[i],xLabel:'1차 에너지 소비 구성(%)'});
   else q.figures.push({kind:'grouped-bars',name:L[i],labels:years,categories:labels,values:values[i],maximum:Math.ceil(max/10)*10,yLabel:'에너지원별 소비량(EJ)'});
   q.tables.push(table(['연도'].concat(labels),values[i].map(function(v,j){return[years[j]].concat(v.map(function(x){return round(x,2);}));}),L[i]+' · '+(composition?'%':'EJ')));
   if(!composition){
    [0,3].forEach(function(j){var a=values[i][0][j],b=values[i][1][j],up=b>a;q.pairs.push(pair('G086-1',L[i]+'의 '+labels[j]+' 소비량은 '+years[0]+'~'+years[1]+'년에 '+(up?'증가했다.':'감소했다.'),L[i]+'의 '+labels[j]+' 소비량은 '+years[0]+'~'+years[1]+'년에 '+(up?'감소했다.':'증가했다.'),'같은 에너지원의 두 시점 실제 소비량을 비교한다. 구성비 변화로 바꾸어 읽지 않는다.',{op:'energyChange',country:n,field:fields[j],from:years[0],to:years[1],a:a,b:b}));});
   }else{
    [0,2].forEach(function(j){var a=values[i][0][j],b=values[i][1][j],up=b>a;q.pairs.push(pair('G086-2',L[i]+'의 '+labels[j]+' 비중은 '+years[0]+'~'+years[1]+'년에 '+(up?'상승했다.':'하락했다.'),L[i]+'의 '+labels[j]+' 비중은 '+years[0]+'~'+years[1]+'년에 '+(up?'하락했다.':'상승했다.'),'같은 분모 종류인 1차 에너지 소비 구성에서 비중을 비교한다.',{op:'energyShareChange',country:n,field:fields[j],from:years[0],to:years[1],a:a,b:b}));});
   }
  });
  if(composition){
   q.pairs.push(pair('G086-2','비중 변화만으로 국가의 총에너지 소비량이 늘었는지 확정할 수 없다.','석탄 비중이 하락하면 국가의 총에너지 소비량도 반드시 감소했다.','비중의 분모인 총량은 두 시점에 달라질 수 있다.',{op:'shareVsTotal'}));
   q.pairs.push(pair('G086-2','오스트레일리아는 두 시점 사이에 석탄과 석유의 비중 순서가 바뀌었다.','오스트레일리아는 두 시점 모두 석유 비중이 석탄 비중보다 높았다.','2000년에는 석탄>석유, 2018년에는 석유>석탄이다.',{op:'australiaReversal'}));
  }
  return finish(q,r);
 }
 function gisQ(mode,seed){
  var r=seedState(seed),source=mode==='medical'||mode==='filters'?data.given.medical:mode==='weighted'?data.given.weighted:mode==='top-two'?data.given.topTwo:data.given.ai;
  var q=base(mode,'GIS 조건·배점·선정',seed,'강의 '+source.source.join(' · ')),rows=source.rows.map(function(a){return a.slice();}),labels={};
  q.note='제시한 원표·조건으로 계산한다. 서로 다른 단위의 원자료를 그대로 합하지 않는다.';
  if(mode==='filters'||mode==='medical'){
   var conditions=mode==='filters'&&seed%2===0?[{column:1,operator:'<',value:53},{column:2,operator:'>',value:44},{column:3,operator:'>=',value:7}]:[{column:1,operator:'<=',value:60},{column:2,operator:'>=',value:40},{column:3,operator:'>=',value:6}],logic=mode==='filters'&&seed%2===0?'OR':'AND',eligible=filterRows(rows,conditions,logic);
   q.tables.push(table(source.headers,rows,source.year+'년 기출 제시 자료'));
   q.tables.push(table(['조건','기준'],conditions.map(function(c){return[source.headers[c.column],c.value+' '+({'<=':'이하','>=':'이상','<':'미만','>':'초과'})[c.operator]];}),'세 조건을 '+(logic==='AND'?'모두':'하나 이상')+' 만족'));
   if(mode==='filters')q.note='강의 원표 수치에 조건·논리어를 바꾸어 적용하는 연습이다. 표에 적힌 이번 문항의 조건을 적용한다.';
   if(mode==='medical'){
    var mapOrder=['소말리아','케냐','탄자니아','모잠비크','남아프리카 공화국'];mapOrder.forEach(function(n,i){labels[n]='ABCDE'[i];});
    q.figures.push({kind:'map',bounds:[8,-36,54,20],regions:Object.entries(data.maps).filter(function(e){return mapOrder.includes(e[0]);}).map(function(e){return{...e[1],letter:labels[e[0]]};})});
    var winner=eligible.slice().sort(function(a,b){return a[4]-b[4];})[0];q.stage1={question:'세 조건을 모두 만족한 국가 중 1인당 GDP가 가장 낮은 국가의 지도 문자는?',options:['A','B','C','D','E'],answer:'ABCDE'.indexOf(labels[winner[0]]),explain:'소말리아와 모잠비크가 세 조건을 만족한다. GDP 447달러와 492달러를 비교하면 소말리아이며 지도의 A이다.'};
    q.pairs.push(pair('G139-2','지원 대상은 1인당 GDP 447달러인 소말리아이다.','의료 보장 지수가 가장 높은 남아프리카 공화국이 지원 대상이다.','필터를 통과한 후보끼리 추가 기준인 GDP를 비교한다.',{op:'medicalWinner',rows:rows,result:winner[0]}));
   }else{
    var correct=eligible.map(function(a){return a[0];}).join(' · '),subsets=[];for(var mask=1;mask<(1<<rows.length);mask++)subsets.push(rows.filter(function(_,i){return mask&(1<<i);}).map(function(a){return a[0];}).join(' · '));
    var opts=shuffle([correct].concat(shuffle(subsets.filter(function(s){return s!==correct;}),r).slice(0,4)),r);q.stage1={question:'발문의 논리어에 따라 조건을 만족하는 국가를 모두 묶은 것은?',options:opts,answer:opts.indexOf(correct),explain:(logic==='AND'?'교집합':'합집합')+'을 구한다. 남는 국가는 '+correct+'이다.'};
   }
   q.pairs.push(pair('G009-1','발문이 모두 만족이면 조건별 결과의 교집합을 구한다.','발문이 모두 만족이면 조건별 결과의 합집합을 구한다.','모두=AND, 하나 이상=OR. 이상·이하의 경계값은 포함한다.',{op:'filter',conditions:conditions,logic:logic,rows:rows,result:eligible.map(function(a){return a[0];})}));
   q.pairs.push(pair('G009-1','40% 이상이라는 조건은 정확히 40%인 값도 포함한다.','40% 이상이라는 조건은 정확히 40%인 값을 제외한다.','이상·이하는 포함하고 초과·미만은 제외한다.',{op:'inclusiveBoundary'}));
  }else{
   var directions=mode==='score-directions'?[-1,1,-1]:[1,1,1],scores=rows.map(function(row){return mode==='weighted'||mode==='top-two'?row.slice(1):row.slice(1).map(function(v,j){return bandScore(v,source.thresholds[j],directions[j]);});});
   var weights=mode==='weighted'?source.weights:[1,1,1],totals=scores.map(function(v){return sum(v.map(function(x,j){return x*weights[j];}));});
   q.tables.push(table(source.headers||['국가','항목1 점수','항목2 점수','항목3 점수'],rows,mode==='top-two'?source.note:'강의 제시값 · '+(source.year||'점수')));
   if(source.thresholds)q.tables.push(table(['항목','경계 1','경계 2','점수 방향'],source.thresholds.map(function(v,i){return[source.headers[i+1],v[0],v[1],directions[i]===1?'작은 구간부터 1·2·3점':'작은 구간부터 3·2·1점'];}),'경계 1 미만 / 경계 1 이상~경계 2 미만 / 경계 2 이상'));
   if(mode==='weighted')q.tables.push(table(['항목','가중치'],[['종사자 수 점수',1],['1인당 GDP 점수',1],['단수 점수',2]],'가중치는 해당 점수에 곱한 뒤 합산'));
   if(mode==='score-directions')q.note='강의의 원표 수치를 이용하되 평가 목적과 점수 방향을 바꾼 모식 연습이다. 이 조건을 원래 기출의 조건으로 외우지 않는다.';
   if(mode==='tie-break'){
    var ordered=rows.map(function(a,i){return{name:a[0],score:totals[i],second:a[2]};}).sort(function(a,b){return b.score-a.score||b.second-a.second;});
    var mapNames=rows.map(function(a){return a[0];});mapNames.forEach(function(n,i){labels[n]='ABCDE'[i];});
    q.figures.push({kind:'map',bounds:[8,-36,54,32],regions:mapNames.map(function(n){return{...data.maps[n],letter:labels[n]};})});
    var correct=ordered.slice(0,4).map(function(x){return labels[x.name];}).sort().join(' · '),choices=mapNames.map(function(_,skip){return mapNames.filter(function(_,i){return i!==skip;}).map(function(n){return labels[n];}).sort().join(' · ');});
    q.note='원표의 배점을 적용한 상위 네 국가를 고른다. 합계 동점이면 전송 속도가 큰 국가를 먼저 고른다. 원래 기출의 선정 개수를 바꾼 조건 연습이다.';
    q.stage1={question:'합계와 2차 기준을 적용한 상위 네 국가의 지도 문자는?',options:choices,answer:choices.indexOf(correct),explain:'이집트 7점·남아프리카 공화국 6점·케냐 5점 다음, 앙골라와 마다가스카르는 3점 동점이다. 전송 속도 0.3과 0.1을 비교해 앙골라를 포함한다.'};
    q.pairs.push(pair('G009-5','앙골라와 마다가스카르는 합계가 같아 전송 속도라는 2차 기준을 적용한다.','앙골라와 마다가스카르는 합계 동점이므로 2차 기준을 무시하고 둘 중 하나를 임의로 고른다.','발문의 기준 순서대로 합계 다음 2차 기준을 적용한다.',{op:'tieBreak'}));
   }else if(mode==='top-two'){
    var mapOrder=['타이','라오스','캄보디아','필리핀','베트남'];mapOrder.forEach(function(n,i){labels[n]='ABCDE'[i];});
    q.figures.push({kind:'map',bounds:[90,-2,130,27],regions:Object.entries(data.maps).filter(function(e){return mapOrder.includes(e[0])||['미얀마','말레이시아','싱가포르'].includes(e[0]);}).map(function(e){return{...e[1],letter:labels[e[0]]||''};})});
    q.stage1={question:'합계가 높은 상위 두 국가에 대응하는 지도 문자를 모두 묶은 것은?',options:['A · B','B · C','C · D','D · E','A · E'],answer:1,explain:'라오스와 캄보디아는 각각 7점으로 공동 1위이고 두 국가를 모두 선정한다. 지도의 B·C이다.'};
    q.pairs.push(pair('G009-5','상위 두 국가를 고르므로 7점인 두 국가를 함께 선정한다.','1위 점수가 같으면 발문이 상위 두 국가여도 한 국가만 임의로 고른다.','동점과 선정 개수를 함께 적용한다.',{op:'topTwo',scores:totals,result:['라오스','캄보디아']}));
   }else{
    q.stage1={question:'배점·가중치를 적용한 합계가 가장 높은 국가는?',options:rows.map(function(a){return a[0];}),answer:totals.indexOf(Math.max.apply(null,totals)),explain:rows.map(function(row,i){return row[0]+' '+totals[i]+'점';}).join(' · ')};
   }
   var goal=mode==='weighted'?'G009-3':mode==='score-directions'?'G009-4':mode==='top-two'||mode==='tie-break'?'G009-5':'G009-2';
   rows.forEach(function(row,i){q.pairs.push(pair(goal,row[0]+'의 점수 합계는 '+totals[i]+'점이다.',row[0]+'의 점수 합계는 '+(totals[i]+2)+'점이다.','항목별 점수 '+scores[i].join('·')+'에 가중치 '+weights.join('·')+'를 각각 곱한 뒤 더한다.',{op:'weightedScore',scores:scores[i],weights:weights,result:totals[i]}));});
   if(mode==='weighted')q.pairs.push(pair('G009-3','단수 점수의 가중치 2는 그 항목 점수에 2를 곱한다는 뜻이다.','가중치 2는 모든 항목을 더한 뒤 합계에 2점만 더한다는 뜻이다.','가중치는 해당 항목에 적용한다.',{op:'weightMeaning'}));
  }
  return finish(q,r);
 }
 function climate(mode,seed){
  var r=seedState(seed),names=mode==='cumulative'?['뭄바이','다윈','퍼스']:mode==='difference'?['창춘','덴버','디트로이트']:mode==='common-deviation'?(seed%2?['퍼스','로차','덴버']:['창춘','덴버','디트로이트']):mode==='self-deviation'?['푸저우','다윈','퍼스']:['양곤','다윈','퍼스'];
  var chosen=picked(names,r),q=base(mode,'누적 강수·편차 자료',seed,'관측소 월평년값 · '+data.climate.period.join('~'));
  q.note='관측소 월평년값을 변환한 제시 자료이다. 수치의 세부 순위를 외우지 않는다.';q.assignment=chosen.map(function(s){return s.name;});
  q.tables.push(table(['후보 지점','1월 기온(℃)','7월 기온(℃)','1월 강수(mm)','7월 강수(mm)'],names.map(function(n){var s=site(n);return[n,s.t[0],s.t[6],s.p[0],s.p[6]];}),'대응에 사용할 기준 자료'));
  if(mode==='cumulative'){
   q.title='누적 강수량';var cs=chosen.map(function(s){return cumulative(s.p);});
   q.figures.push({kind:'line',x:[0,1,2,3,4,5,6,7,8,9,10,11,12],series:cs.map(function(c,i){return{name:L[i],values:[0].concat(c)};}),xLabel:'월(0은 전년 말)',yLabel:'누적 강수량(mm)',zero:true});
   var c=cs[0],s=chosen[0],m=1+(seed%12);
   q.pairs.push(pair('G020-1',L[0]+'의 '+m+'월 강수량은 '+fmt(s.p[m-1])+'mm이다.',L[0]+'의 '+m+'월 강수량은 '+fmt(s.p[m-1]+100)+'mm이다.','그달 누적값에서 직전 달 누적값을 뺀다.',{op:'month',cumulative:c,month:m,result:s.p[m-1]}));
   [[6,7,8],[12,1,2]].forEach(function(ms){var amount=season(c,ms);q.pairs.push(pair('G133-2',L[0]+'의 '+ms.join('·')+'월 강수량 합은 '+fmt(amount)+'mm이다.',L[0]+'의 '+ms.join('·')+'월 강수량 합은 '+fmt(amount+200)+'mm이다.','겨울의 합은 12월 누적−11월 누적+2월 누적, 여름은 8월 누적−5월 누적이다.',{op:'season',cumulative:c,months:ms,result:amount}));});
   q.pairs.push(pair('G020-2','6~8월 강수가 많은 지점은 그 구간 누적선의 증가량도 크다.','누적선이 평탄할수록 그 기간의 월 강수량이 많다.','같은 시간 간격의 증가량이 해당 기간 강수량이다.',{op:'slope'}));
   q.pairs.push(pair('G020-1',L[0]+'의 연 강수량은 '+fmt(c[11])+'mm이다.',L[0]+'의 연 강수량은 각 달 누적값을 모두 더한 값이다.','12월 누적값 자체가 그해 연 강수량이다.',{op:'annual',result:c[11]}));
  }else if(mode==='difference'){
   q.title='1월−7월 기온·강수 차이';
   q.figures.push({kind:'scatter',xLabel:'1월−7월 기온(℃)',yLabel:'1월−7월 강수(mm)',points:chosen.map(function(s,i){return{name:L[i],x:round(s.t[0]-s.t[6]),y:round(s.p[0]-s.p[6]),size:1};})});
   chosen.forEach(function(s,i){var d=s.t[0]-s.t[6];q.pairs.push(pair('G021-5',L[i]+'는 1월 기온이 7월보다 '+(d>0?'높다.':'낮다.'),L[i]+'는 1월 기온이 7월보다 '+(d>0?'낮다.':'높다.'),'가로 좌표는 1월−7월이다. 0보다 작으면 1월이 더 춥다.',{op:'difference',a:s.t[0],b:s.t[6],result:d}));});
   q.pairs.push(pair('G021-5','차이가 음수라도 실제 기온이나 강수량이 음수라는 뜻은 아니다.','강수 차이 좌표가 음수이면 한 달의 강수량이 음수이다.','두 비음수 강수량의 차이는 음수가 될 수 있다.',{op:'differenceMeaning'}));
  }else{
   var isRain=mode==='precip-deviation',isSelf=mode==='self-deviation'||isRain,reference=site('싱가포르');
   var fields=chosen.map(function(s){return isRain?s.p:s.t;}),columnMean=fields[0].map(function(_,m){return mean(fields.map(function(x){return x[m];}));});
   var bases=fields.map(function(v){return isSelf?v.map(function(){return mean(v);}):mode==='reference-deviation'?reference.t:columnMean;});
   var deviations=fields.map(function(v,i){return v.map(function(x,m){return x-bases[i][m];});});
   q.title=isRain?'강수량의 자기 월평균 대비 편차':isSelf?'자기 연평균 기준 기온 편차':mode==='reference-deviation'?'싱가포르와의 월별 기온 차이':'제시 지역의 같은 달 평균 대비 편차';
   q.figures.push({kind:'line',x:[1,2,3,4,5,6,7,8,9,10,11,12],series:deviations.map(function(v,i){return{name:L[i],values:v};}),xLabel:'월',yLabel:'편차('+(isRain?'mm':'℃')+')'});
   q.tables.push(table(['자료','기준값'],chosen.map(function(s,i){return[L[i],isSelf?fmt(bases[i][0],3):'아래 월별 기준'];}),'기준값을 편차에 더하면 실제 값'));
   if(!isSelf)q.tables.push(table(['월'].concat(Array.from({length:12},function(_,i){return i+1;})),[['공통 기준(℃)'].concat(bases[0].map(function(x){return round(x,3);}))],'복원 기준: '+(mode==='reference-deviation'?'싱가포르 월평균 기온':'제시 세 지역의 같은 달 기온 평균')));
   var m=seed%12,actual=fields[0][m],goal=isRain?'G020-3':isSelf?'G021-1':mode==='reference-deviation'?'G021-3':'G021-2';
   q.pairs.push(pair(goal,L[0]+'의 '+(m+1)+'월 실제 값은 약 '+fmt(actual)+(isRain?'mm':'℃')+'이다.',L[0]+'의 '+(m+1)+'월 실제 값은 약 '+fmt(actual+10)+(isRain?'mm':'℃')+'이다.','실제 값 = 편차 + 그 편차를 계산한 기준값. 그래프의 기준을 먼저 확인한다.',{op:'restore',deviation:deviations[0][m],base:bases[0][m],result:actual}));
   if(isRain)q.pairs.push(pair('G020-3','강수 편차가 음수인 달에도 비가 내릴 수 있다.','강수 편차가 음수인 달의 강수량은 반드시 0이다.','음의 편차는 기준보다 강수량이 적다는 뜻이다.',{op:'negativeDeviation'}));
   else if(isSelf){
    q.pairs.push(pair('G133-3','같은 지점의 1월−7월 기온 차이는 두 편차를 빼서 구할 수 있다.','서로 다른 지점의 1월 기온 차이는 각 지점의 편차 차이와 항상 같다.','같은 지점의 기준은 상쇄된다. 서로 다른 지점은 연평균 기준값이 다를 수 있다.',{op:'selfDifference',means:fields.map(mean)}));
    q.pairs.push(pair('G133-3','지역별 연평균을 알면 지역 간 실제 기온도 복원해 비교할 수 있다.','지역별 연평균을 알아도 편차에서 실제 기온을 복원할 수 없다.','각 편차에 각 지역의 연평균을 더한다.',{op:'restoreEach'}));
   }else{
    q.pairs.push(pair(mode==='reference-deviation'?'G021-3':'G133-4','같은 달 지점 간 편차의 순서는 실제 기온의 순서와 같다.','서로 다른 달의 편차를 바로 빼면 실제 기온 차이가 된다.','한 달 안에서는 공통 기준이 상쇄된다. 서로 다른 달의 기준은 다를 수 있다.',{op:'commonDifference',bases:bases[0]}));
    if(mode==='common-deviation'){
     q.pairs.push(pair('G133-4','같은 달 제시 세 지역의 편차 합은 반올림 오차를 제외하면 0이다.','같은 달 제시 세 지역의 편차 합은 그달 평균 기온이다.','평균을 빼서 만든 편차의 합은 0이다.',{op:'zeroSum',deviations:deviations}));
     var a=fields[0][0],b=fields[1][0];q.pairs.push(pair('G024-1',L[0]+'의 1월 실제 기온은 '+L[1]+'보다 '+(a>b?'높다.':'낮다.'),L[0]+'의 1월 실제 기온은 '+L[1]+'보다 '+(a>b?'낮다.':'높다.'),'같은 달의 공통 기준 편차이므로 그 열 안의 순서를 유지한다.',{op:'compare',a:a,b:b}));
    }
   }
  }
  return finish(q,r);
 }
 function solarQ(mode,seed){
  var r=seedState(seed),names=mode==='solar-climate'?['양곤','다윈','퍼스']:mode==='solar-altitude'?['홍콩','카슈가르','오클랜드']:['마닐라','도쿄','웰링턴'];
  var points=shuffle(names.map(function(n){var x=data.cities[n]||site(n);return{name:n,lat:x.lat};}),r);
  var q=base(mode,'태양 고도·낮 길이',seed,'지점 위도 · 태양 적위 근사식');q.assignment=points.map(function(x){return x.name;});
  q.note='매월 15일 부근의 태양 중심·평탄한 지평선 기준 근삿값이다. 대기 굴절·지형·시차는 포함하지 않는다. 계절·위도 관계를 비교한다.';
  q.tables.push(table(['후보 지점','위도'],names.map(function(n){var c=data.cities[n]||site(n);return[n,fmt(c.lat,2)+'°'];}),'지점 대응 기준'));
  var decl=declination(DAY[seed%12]),m=seed%12;
  if(mode==='solar-altitude'||mode==='solar-climate'){
   q.title='정오 태양 고도';q.figures.push({kind:'line',x:DAY.map(function(_,i){return i+1;}),series:points.map(function(p,i){return{name:L[i],values:DAY.map(function(d){return noonAltitude(p.lat,declination(d));})};}),xLabel:'월',yLabel:'정오 태양 고도(°)'});
   q.pairs.push(pair('G012-2',(m+1)+'월 '+L[0]+'의 정오 태양 고도는 약 '+fmt(noonAltitude(points[0].lat,decl))+'°이다.',(m+1)+'월 '+L[0]+'의 정오 태양 고도는 약 '+fmt(noonAltitude(points[0].lat,decl)+10)+'°이다.','정오 태양 고도 = 90° − |지점 위도 − 태양 적위|.',{op:'solarAltitude',lat:points[0].lat,decl:decl,result:noonAltitude(points[0].lat,decl)}));
   var month=seed%2?7:1;q.pairs.push(pair('G022-1',L[0]+'의 '+month+'월 태양 고도는 약 '+fmt(noonAltitude(points[0].lat,declination(DAY[month-1])))+'°이다.',L[0]+'의 '+month+'월 태양 고도는 약 '+fmt(noonAltitude(points[0].lat,declination(DAY[month-1]))+15)+'°이다.','월별 직사 위도가 달라진다. 절대 위도만으로 모든 달의 태양 고도를 비교하지 않는다.',{op:'solarAltitude',lat:points[0].lat,decl:declination(DAY[month-1]),result:noonAltitude(points[0].lat,declination(DAY[month-1]))}));
   if(mode==='solar-climate'){
    q.tables.push(table(['자료 지점','제시 월','기온(℃)','강수(mm)'],points.map(function(p,i){var s=site(p.name);return[L[i],m+1,s.t[m],s.p[m]];}),'태양 자료와 같은 지점의 월평년값'));
    var a=site(points[0].name).p[m],b=site(points[1].name).p[m];q.pairs.push(pair('G022-2',(m+1)+'월 강수량은 '+L[0]+'가 '+L[1]+'보다 '+(a>b?'많다.':'적다.'),(m+1)+'월 강수량은 '+L[0]+'가 '+L[1]+'보다 '+(a>b?'적다.':'많다.'),'태양 자료로 지점을 대응한 다음 같은 월의 강수를 읽는다. 태양 고도만으로 강수량을 계산하지 않는다.',{op:'compare',a:a,b:b}));
   }
  }else if(mode==='solar-night'){
   q.title='위도와 밤 길이 차이';q.figures.push({kind:'bars',labels:L,values:points.map(function(p){var a=solar(p.lat);return a[6]-a[0];}),yLabel:'1월−7월 밤 길이(시간)'});
   var nights=solar(points[0].lat);q.pairs.push(pair('G024-2',L[0]+'의 1월 밤 길이는 약 '+fmt(24-nights[0])+'시간이다.',L[0]+'의 1월 밤 길이는 약 '+fmt(24-nights[0]+3)+'시간이다.','밤 길이 = 24시간 − 낮 길이. 차이의 부호로 반구를 판단한다.',{op:'night',lat:points[0].lat,month:1,result:24-nights[0]}));
  }else{
   q.title='위도에 따른 월별 낮 길이';q.figures.push({kind:'line',x:DAY.map(function(_,i){return i+1;}),series:points.map(function(p,i){return{name:L[i],values:solar(p.lat)};}),xLabel:'월',yLabel:'낮 길이(시간)',domainY:[0,24]});
   var hi=points.reduce(function(a,b){return Math.abs(a.lat)>Math.abs(b.lat)?a:b;}),lo=points.reduce(function(a,b){return Math.abs(a.lat)<Math.abs(b.lat)?a:b;});
   q.pairs.push(pair('G002-1',hi.name+'는 '+lo.name+'보다 낮 길이의 연중 변화 폭이 크다.',lo.name+'는 '+hi.name+'보다 낮 길이의 연중 변화 폭이 크다.','적도에서 멀어질수록 연중 낮 길이 변화 폭이 커진다.',{op:'dayRange',hi:hi.lat,lo:lo.lat}));
   q.pairs.push(pair('G002-2','웰링턴의 낮 길이는 1월이 7월보다 길다.','웰링턴의 낮 길이는 7월이 1월보다 길다.','남반구 여름에 낮이 길다. 북반구와 반대 계절이다.',{op:'hemisphere'}));
   q.pairs.push(pair('G002-2','북위 80°에서 6월에 백야이면 남위 80°의 같은 시기에는 극야가 나타난다.','북위 80°에서 6월에 백야이면 남위 80°에서도 같은 시기에 백야이다.','극지의 백야와 극야는 같은 시기에 남북 반구가 반대이다.',{op:'polar',north:daylight(80,23.44),south:daylight(-80,23.44)}));
  }
  q.pairs.push(pair('G012-2','정오 태양 고도는 같은 날의 직사 위도에 가까울수록 높다.','정오 태양 고도는 계절과 관계없이 적도에서 항상 가장 높다.','적위가 남·북으로 이동하므로 최고 태양 고도가 나타나는 위도도 바뀐다.',{op:'declinationMeaning'}));
  return finish(q,r);
 }
 function solarMonthQ(seed){
  var r=seedState(seed),months=[1,4,7,10],month=months[seed%4],names=Math.floor((seed-1)/4)%2===0?['홍콩','카슈가르','오클랜드']:['양곤','다윈','퍼스'],q=base('solar-month','태양 고도로 제시 월 찾기',seed,'기존 도시·관측소 좌표 · 태양 적위 근사식');
  q.note='각 달 15일 부근의 정오 태양 고도 근삿값이다. 태양 중심·평탄한 지평선을 기준으로 하며 대기 굴절은 제외한다.';
  var decl=declination(DAY[month-1]);
  q.tables.push(table(['지점','위도','제시 월의 정오 태양 고도(°)'],names.map(function(n){var p=data.cities[n]||site(n);return[n,round(p.lat,2),round(noonAltitude(p.lat,decl),1)];}),'1·4·7·10월 중 한 달의 계산 자료'));
  q.stage1={question:'제시한 정오 태양 고도에 해당하는 달은?',options:months.map(function(m){return m+'월';}),answer:months.indexOf(month),explain:'지점 위도와 직사 위도의 차이가 작을수록 정오 태양 고도가 높다. 같은 달의 세 지점 값을 함께 비교한다.'};
  q.pairs.push(pair('G022-1','이 자료의 직사 위도는 약 '+fmt(decl)+'°이다.','이 자료의 직사 위도는 약 '+fmt(decl+15)+'°이다.','90°−태양 고도는 해당 지점과 직사 위도의 위도 차이다. 남북 부호를 구분한다.',{op:'declination',month:month,result:decl}));
  var a=noonAltitude((data.cities[names[0]]||site(names[0])).lat,decl),b=noonAltitude((data.cities[names[2]]||site(names[2])).lat,decl);
  q.pairs.push(pair('G012-2','이 시기의 정오 태양 고도는 '+names[0]+'가 '+names[2]+'보다 '+(a>b?'높다.':'낮다.'),'이 시기의 정오 태양 고도는 '+names[0]+'가 '+names[2]+'보다 '+(a>b?'낮다.':'높다.'),'절대 위도가 아니라 그날의 직사 위도와의 거리를 비교한다.',{op:'compare',a:a,b:b}));
  if(names.every(function(n){return !!sites[n];})){
   q.tables.push(table(['지점','같은 달 기온(℃)','같은 달 강수(mm)'],names.map(function(n){var s=site(n);return[n,s.t[month-1],s.p[month-1]];}),'태양 고도로 정한 달의 관측소 월평년값'));
   var p0=site(names[0]).p[month-1],p1=site(names[1]).p[month-1];
   q.pairs.push(pair('G022-2','태양 자료로 정한 '+month+'월 강수량은 '+names[0]+'가 '+names[1]+'보다 '+(p0>p1?'많다.':'적다.'),'태양 자료로 정한 '+month+'월 강수량은 '+names[0]+'가 '+names[1]+'보다 '+(p0>p1?'적다.':'많다.'),'먼저 태양 고도로 달을 대응한 뒤 같은 달의 실제 관측소 강수 자료를 읽는다.',{op:'compare',a:p0,b:p1}));
  }
  return finish(q,r);
 }
 function ages(mode,seed){
  var r=seedState(seed),names=shuffle(['일본','인도','니제르'],r),q=base(mode,'연령 구성·부양비',seed,'세계은행 WDI · 제시 연도의 연령 구성');q.note='반올림된 제시 비율로 계산한다. 청장년층은 100 − 유소년층 − 노년층이다.';
  var rows=names.map(function(n){var v=data.countries[n].values;return age(v.young,v.old);});
  if(mode==='age-triangle'){
   q.assignment=names;q.title='연령 구조 삼각 도표';var mins=seed%2?[10,40,0]:[0,0,0];
   q.figures.push({kind:'ternary',labels:['유소년','청장년','노년'],minimum:mins,points:rows.map(function(a,i){return{name:L[i],values:[a.y,a.w,a.o]};})});
   q.tables.push(table(['후보 국가','유소년 비율(%)','노년 비율(%)'],names.slice().sort().map(function(n){var v=data.countries[n].values;return[n,v.young,v.old];}),'대응 기준(2023년)'));
   q.pairs.push(pair('G134-1',seed%2?'이 확대 삼각 도표의 꼭짓점은 세 축 모두 100%를 뜻하지 않는다.':'이 전체 삼각 도표의 꼭짓점은 해당 축 100%를 뜻한다.',seed%2?'이 확대 삼각 도표의 모든 꼭짓점은 해당 축 100%이다.':'삼각 도표의 세 비율은 합계가 300%이다.','각 꼭짓점에 적힌 실제 세 비율을 읽는다. 확대 그래프는 최소값이 0이 아닐 수 있다.',{op:'ternaryBounds',minimum:mins}));
   q.pairs.push(pair('G056-3','중위 연령은 인구를 나이순으로 배열했을 때 가운데에 놓이는 연령이다.','중위 연령은 모든 사람의 나이를 더해 총인구로 나눈 평균 연령이다.','중위 연령과 평균 연령을 구별한다. 세 연령 집단의 비율만으로 정확한 중위 연령 수치를 역산하지 않는다.',{op:'medianAgeDefinition'}));
  }else{
   q.title='부양비 계산과 역산';q.tables.push(table(['국가','총부양비','노년 부양비'],rows.map(function(a,i){return[names[i],round(a.total,2),round(a.old,2)];}),'청장년층 100명당 부양 인구 · 비율 반올림'));
   var ans=rows.map(function(a){return a.w;});var index=ans.indexOf(Math.max.apply(null,ans));q.stage1={question:'청장년층 인구 비율이 가장 높은 국가는?',options:names,answer:index,explain:'청장년 비율 = 10,000 ÷ (100 + 총부양비).'};
   // Use displayed dependency values for inversion; do not imply extra precision.
   rows=rows.map(function(a){var total=round(a.total,2),old=round(a.old,2),w=workforce(total);return{...a,total:total,old:old,young:total-old,w:w,aging:old/(total-old)*100};});
  }
  var a=rows[0],label=mode==='age-triangle'?L[0]:names[0];
  q.pairs.push(pair('G056-2',label+'의 청장년층 비율은 약 '+fmt(a.w)+'%이다.',label+'의 청장년층 비율은 약 '+fmt(a.w+10)+'%이다.','총부양비 D에서 청장년 비율은 10,000÷(100+D)로 복원한다.',{op:'workforce',D:a.total,result:a.w}));
  q.pairs.push(pair('G134-2',label+'의 유소년 부양비는 약 '+fmt(a.young)+'이다.',label+'의 유소년 부양비는 약 '+fmt(a.young+20)+'이다.','유소년 부양비 = 총부양비 − 노년 부양비. 부양 대상의 전체 인구 비율과 다르다.',{op:'youngDependency',total:a.total,old:a.old,result:a.young}));
  q.pairs.push(pair('G134-2',label+'의 노령화 지수는 약 '+fmt(a.aging)+'이다.',label+'의 노령화 지수는 약 '+fmt(a.aging+30)+'이다.','노령화 지수 = 노년 부양비÷유소년 부양비×100. 두 부양비의 청장년 분모가 상쇄된다.',{op:'aging',young:a.young,old:a.old,result:a.aging}));
  q.pairs.push(pair('G134-2','부양 대상이 전체 인구의 36.7%라는 것과 총부양비 36.7은 다르다.','부양 대상이 전체 인구의 36.7%이면 총부양비도 36.7이다.','총부양비의 분모는 전체 인구가 아니라 청장년층이다.',{op:'dependencyDenominator'}));
  return finish(q,r);
 }
 function urbanQ(mode,seed){
  var r=seedState(seed),names=shuffle(['미국','브라질','파키스탄'],r),q=base(mode,'도시·촌락 인구 변화',seed,'UN WUP 2025 · 국가별 도시 정의 · 인구 단위: 천 명');
  q.note='제시 자료의 반올림된 인구로 계산한다. 도시화율 = 도시 인구 ÷ (도시+촌락 인구) ×100.';
  var y0=mode==='urban-change'?1960:1970,y1=mode==='urban-change'?2015:2020;
  var rows=names.map(function(n){var a=data.urban[n][y0],b=data.urban[n][y1];return{name:n,a:a,b:b,s0:a.u/(a.u+a.r)*100,s1:b.u/(b.u+b.r)*100};});
  q.tables.push(table(['국가',y0+' 도시',y0+' 촌락',y1+' 도시',y1+' 촌락'],rows.map(function(x){return[x.name,x.a.u,x.a.r,x.b.u,x.b.r];}),'두 시점 도시·촌락 인구(천 명)'));
  if(mode==='urban-change'){
   q.assignment=names;q.title='두 시점 도시화율 산점도';q.figures.push({kind:'scatter',xLabel:y0+' 도시화율(%)',yLabel:y1+' 도시화율(%)',diagonal:true,points:rows.map(function(x,i){return{name:L[i],x:x.s0,y:x.s1,size:1};})});
  }else{
   var winner=rows.map(function(x){return growth(x.a.u+x.a.r,x.b.u+x.b.r);});q.stage1={question:'제시 기간의 총인구 증가율이 가장 높은 국가는?',options:names,answer:winner.indexOf(Math.max.apply(null,winner)),explain:'시작 시점 도시·촌락 인구를 합해 분모로 삼고 총증가량을 나눈다.'};
  }
  rows.forEach(function(x,i){var label=mode==='urban-change'?L[i]:x.name,gu=growth(x.a.u,x.b.u),gr=growth(x.a.r,x.b.r),gt=growth(x.a.u+x.a.r,x.b.u+x.b.r);
   q.pairs.push(pair('G053-2',label+'의 총인구 증가율은 약 '+fmt(gt)+'%이다.',label+'의 총인구 증가율은 약 '+fmt(gt+20)+'%이다.','전체 증가율은 시작 시점 도시·촌락 비중으로 가중한다. 증가율을 단순히 더하지 않는다.',{op:'weightedGrowth',u0:x.a.u,r0:x.a.r,u1:x.b.u,r1:x.b.r,result:gt}));
   q.pairs.push(pair('G136-1',label+'는 도시화율이 '+(x.s1>x.s0?'상승했다.':'하락했다.'),label+'는 도시화율이 '+(x.s1>x.s0?'하락했다.':'상승했다.'),'세로 좌표가 가로보다 크면 도시화율 상승이다. 도시·촌락 총인구의 증감은 별도 계산한다.',{op:'compare',a:x.s1,b:x.s0}));
   q.pairs.push(pair('G136-2',label+'의 전체 증가율은 도시·촌락 증가율을 시작 비중으로 가중한 값이다.',label+'의 전체 증가율은 도시·촌락 증가율을 종료 비중으로 가중한 값이다.','시작 인구가 각 증가량의 분모이므로 시작 비중을 사용한다.',{op:'weights',u0:x.a.u,r0:x.a.r,gu:gu,gr:gr,result:gt}));
   q.pairs.push(pair('G136-1',label+'의 도시 인구 증가율은 약 '+fmt(gu)+'%, 촌락 인구 증가율은 약 '+fmt(gr)+'%이다.',label+'의 도시 인구 증가율은 약 '+fmt(gu)+'%, 촌락 인구 증가율은 약 '+fmt(gr+20)+'%이다.','도시화율이 상승해도 도시·촌락 인구 증가율이 모두 양수일 수 있다. 두 집단을 각각 원래 인구로 나눈다.',{op:'urbanRuralGrowth',u0:x.a.u,r0:x.a.r,u1:x.b.u,r1:x.b.r,urban:gu,rural:gr}));
  });
  return finish(q,r);
 }
 function radarQ(seed){
  var r=seedState(seed),names=shuffle(['미국','브라질','파키스탄'],r),rows=names.map(function(n){var x=data.urban[n]['2020'];return[x.u,x.u/(x.u+x.r)*100,x.u+x.r];}),q=base('urban-radar','항목별 최댓값 1의 방사형 그래프',seed,'UN WUP 2025 · 2020년 · 각 축의 세 국가 최댓값=1');
  q.assignment=names;q.note='각 축의 분모는 그 항목의 최댓값이다. 도시 인구·도시화율·총인구는 단위가 서로 다르다.';
  var norm=normalize(rows,1);q.figures.push({kind:'radar',labels:['도시 인구','도시화율','총인구'],maximum:1,series:norm.map(function(v,i){return{name:L[i],values:v};})});
  q.tables.push(table(['후보 국가','도시 인구(천 명)','도시화율(%)','총인구(천 명)'],names.slice().sort().map(function(n){var x=data.urban[n]['2020'];return[n,x.u,round(x.u/(x.u+x.r)*100,2),x.u+x.r];}),'대응 기준'));
  q.pairs.push(pair('G063-1','한 항목의 값이 0.96이면 그 항목의 세 국가 최댓값의 96%이다.','한 항목의 값이 0.96이면 그 나라 전체 인구의 96%이다.','축마다 서로 다른 최댓값으로 나눴다.',{op:'radarMeaning'}));
  q.pairs.push(pair('G063-1','한 국가의 세 축 값의 합은 1일 필요가 없다.','한 국가의 세 축 값은 구성비이므로 합계가 반드시 1이다.','방사형 그래프의 정규화 값은 구성비가 아니다.',{op:'radarSum',values:norm[0]}));
  var v=norm[0][0];q.pairs.push(pair('G063-1',L[0]+'의 도시 인구는 세 국가 최대 도시 인구의 약 '+fmt(v*100)+'%이다.',L[0]+'의 도시 인구는 세 국가 최대 도시 인구의 약 '+fmt(v*100+15)+'%이다.','같은 축 안에서만 정규화 비율을 해석한다.',{op:'normalize',value:rows[0][0],maximum:Math.max.apply(null,rows.map(function(x){return x[0];})),result:v}));
  return finish(q,r);
 }
 function tierQ(seed){
  var r=seedState(seed),q=base('city-tier','세계 도시 계층 평균의 세 축',seed,'강의 L1-B1695 · 2016학년도 6월 13번 · data/concepts/world-city-hierarchy.json');
  q.note='계층 평균의 상대 관계를 그린 모식도이다. 수치·개별 도시의 순위·실측 거리를 뜻하지 않는다.';
  var pts=shuffle([[1,1,1],[1,0,0],[0,1,0],[0,0,1]],r);
  q.figures.push({kind:'three-axis',labels:['다국적 기업 본사 수','생산자 서비스업 비중','최근접 동일 계층 도시까지 거리'],points:pts.map(function(v,i){return{name:['A','B','C','D'][i],values:v};})});
  q.stage1={question:'최상위 세계 도시 계층의 평균에 대응하는 점은?',options:['A','B','C','D'],answer:pts.findIndex(function(v){return v.every(function(x){return x===1;});}),explain:'최상위 계층 평균은 세 지표가 모두 상대적으로 크다. 가장 가까운 동일 계층 도시까지의 거리도 상대적으로 멀다.'};
  q.pairs.push(pair('G069-2','상위 계층 평균은 하위 계층 평균보다 생산자 서비스업 비중이 높다.','모든 상위 계층 도시의 생산자 서비스업 비중이 모든 하위 계층 도시보다 높다.','제시 관계는 계층 평균의 상대 비교이며 개별 도시 전부의 순위를 보장하지 않는다.',{op:'tierScope'}));
  q.pairs.push(pair('G069-2','상위 계층 평균은 가장 가까운 같은 계층 도시까지의 거리가 상대적으로 멀다.','상위 계층 평균은 가장 가까운 같은 계층 도시까지의 거리가 상대적으로 가깝다.','동일 계층 도시의 최근접 거리 축을 읽는다.',{op:'tierDistance'}));
  return finish(q,r);
 }
 function soilQ(seed){
  var r=seedState(seed),q=base('soil-temperature','지중 온도와 활동층',seed,'강의 L1-B0790 주변 지중 온도 관계 · 9월 모식 자료');
  var depth=[0,1,2,3,4,5],old=[3,1,-.3,-1,-1.5,-2],recent=[4,2,.4,-.3,-1,-1.7],z0=zeroCrossing(depth,old),z1=zeroCrossing(depth,recent);
  q.note='1985·2001년의 관계를 설명하기 위한 9월 모식 곡선이다. 2m의 온도 부호는 강의 조건을 따르며 나머지 수치는 연습용이다. 한 달의 자료로 연중 온도를 확정하지 않는다.';
  q.figures.push({kind:'profile',xLabel:'지중 온도(℃)',yLabel:'깊이(m)',depth:depth,series:[{name:'1985년(모식)',values:old},{name:'2001년(모식)',values:recent}]});
  q.tables.push(table(['깊이(m)','1985년(℃)','2001년(℃)'],depth.map(function(d,i){return[d,old[i],recent[i]];}),'계산용 모식 수치'));
  q.stage1={question:'이 9월 자료에서 0℃ 교점이 더 깊은 시기는?',options:['1985년','2001년'],answer:1,explain:'온도가 양수에서 음수로 바뀌는 깊이가 2001년에 더 깊다.'};
  q.pairs.push(pair('G032-2','두 점 사이를 직선으로 읽으면 2001년 0℃ 깊이는 약 '+fmt(z1)+'m이다.','두 점 사이를 직선으로 읽으면 2001년 0℃ 깊이는 약 '+fmt(z1+1)+'m이다.','0℃를 사이에 둔 두 깊이 사이에서 교점을 보간한다.',{op:'zeroCrossing',depth:depth,temp:recent,result:z1}));
  q.pairs.push(pair('G110-5','깊이 2m는 1985년 9월에 0℃ 아래, 2001년 9월에 0℃ 위이다.','깊이 2m는 두 시기 모두 0℃ 아래이다.','같은 깊이의 두 곡선 온도를 비교한다.',{op:'soil2m',old:old[2],recent:recent[2]}));
  q.pairs.push(pair('G110-5','0℃ 아래인 더 깊은 지층까지 모두 녹았다고 할 수 없다.','2001년에 2m가 0℃ 위이므로 5m까지 모두 녹았다고 할 수 있다.','융해 여부는 각 깊이의 온도와 관측 범위를 구분한다.',{op:'frozenDepth'}));
  q.pairs.push(pair('G110-5','9월 관측만으로 그 깊이가 연중 0℃ 위라고 확정할 수 없다.','9월에 0℃ 위인 깊이는 연중 0℃ 위이다.','한 달의 관측과 연중 상태는 다르다.',{op:'singleMonth'}));
  return finish(q,r);
 }
 function corporateQ(seed){
  var r=seedState(seed),k=1+seed%4,rows=shuffle([['A',20*k,8,40],['B',10*(1+(seed+1)%4),14,25],['C',30*(1+(seed+2)%4),4,60]],r),q=base('headquarters','본사 수·평균 매출·집중도',seed,'강의 관계에 따른 모식 자료');
  q.note='도시 A~C의 연습용 모식 수치다. 국가·도시의 실제 순위를 뜻하지 않는다.';
  q.tables.push(table(['도시','본사 수(개)','본사당 평균 매출(십억 달러)','자국 본사 집중도(%)'],rows,'본사 수와 평균·비율의 분모를 구분한다'));
  var amounts=rows.map(function(a){return a[1]*a[2];});q.stage1={question:'본사 기업의 매출 합계가 가장 큰 도시는?',options:rows.map(function(a){return a[0];}),answer:amounts.indexOf(Math.max.apply(null,amounts)),explain:'매출 합계 = 본사 수 × 본사당 평균 매출액.'};
  rows.forEach(function(a){var total=a[1]*a[2],country=a[1]/(a[3]/100);q.pairs.push(pair('G070-1',a[0]+'의 본사 매출 합계는 '+total+'십억 달러이다.',a[0]+'의 본사 매출 합계는 '+(total+50)+'십억 달러이다.','개수×평균으로 합계를 구한다.',{op:'product',a:a[1],b:a[2],result:total}));q.pairs.push(pair('G070-1',a[0]+'가 속한 국가의 본사 수는 '+fmt(country)+'개이다.',a[0]+'가 속한 국가의 본사 수는 '+fmt(country+20)+'개이다.','도시 본사 수÷국가 내 집중도(소수)로 국가 본사 수를 복원한다.',{op:'divideShare',value:a[1],share:a[3],result:country}));});
  return finish(q,r);
 }
 function migrantQ(seed){
  var r=seedState(seed),q=base('migrant-stock','미국 이민자 출신국 자료 읽기',seed,data.migrantSource.source+' · 2020년'),names=shuffle(Object.keys(data.migrants),r);
  q.note='제시 자료용. 특정 시점 미국에 거주하는 국제 이주민 stock이며 그해 유입 flow가 아니다. 출신국별 숫자는 외우지 않는다.';
  q.figures.push({kind:'bars',labels:names,values:names.map(function(n){return data.migrants[n]/10000;}),yLabel:'미국 거주 이민자 수(만 명)'});
  q.tables.push(table(['출신국','미국 거주 이민자(명)'],names.map(function(n){return[n,data.migrants[n]];}),'같은 제시 자료의 수치'));
  var max=names.reduce(function(a,b){return data.migrants[a]>data.migrants[b]?a:b;});q.stage1={question:'제시한 네 출신국 중 미국 거주 이민자 수가 가장 많은 출신국은?',options:names,answer:names.indexOf(max),explain:'제시한 2020년 stock 값을 비교한다. 과거 기출의 다른 판본으로 바꾸어 읽지 않는다.'};
  q.pairs.push(pair('G061-3','이 자료는 특정 시점 미국에 거주하는 이민자 수이다.','이 자료는 2020년 한 해 미국으로 새로 들어온 이민자 수이다.','국제 이주민 stock과 연간 이동 flow는 다르다.',{op:'stock',practice:'suppliedData'}));
  q.pairs.push(pair('G061-3','멕시코와 독일의 미국 거주 이민자 수는 제시한 값으로 비교할 수 있다.','막대가 긴 출신국일수록 그 출신국 전체 인구에서 이민자가 차지하는 비율도 반드시 높다.','출신국 전체 인구라는 분모가 없으므로 이민자 비율은 정할 수 없다.',{op:'migrantDenominator',practice:'suppliedData'}));
  q.pairs.push(pair('G061-3','제시 출신국을 아메리카·아시아·유럽·아프리카 권역으로 묶어 합계를 비교할 수 있다.','출신국별 인원만으로 권역별 이주 원인이 오직 공용어 하나라고 확정한다.','멕시코·인도·독일·세네갈의 권역을 먼저 구분한다. 언어·인접성·기존 이주 네트워크는 가능한 해석 요인이며 단일 통계로 인과를 확정하지 않는다.',{op:'migrantRegions',practice:'suppliedData'}));
  q.pairs.push(pair('G061-3','멕시코는 미국의 인접국이라는 공간적 조건과 연결할 수 있다.','출신국별 이민자 수만으로 모든 이동의 원인이 오직 언어라고 확정할 수 있다.','인접성·이주 네트워크는 해석 조건이다. 한 통계만으로 단일 원인을 확정하지 않는다.',{op:'migrantContext',practice:'suppliedData'}));
  return finish(q,r);
 }
 function indexQ(seed){
  var r=seedState(seed),names=shuffle(['인도','일본','미국'],r),rows=names.map(function(n){var s=data.countries[n].series.pop;return{name:n,base:s['2010'],later:s['2023'],index:s['2023']/s['2010']*100};}),q=base('population-index','기준 연도 100 지수',seed,'세계은행 WDI · 총인구(만 명) · 2010=100');
  q.figures.push({kind:'bars',labels:names,values:rows.map(function(x){return x.index;}),yLabel:'2023년 지수(2010=100)'});
  q.tables.push(table(['국가','2010년 인구(만 명)','2023년 지수'],rows.map(function(x){return[x.name,x.base,round(x.index,2)];}),'기준량이 국가마다 다르다'));
  rows=rows.map(function(x){x.index=round(x.index,2);x.later=x.base*x.index/100;return x;});var vals=rows.map(function(x){return x.later;});q.stage1={question:'제시한 기준량과 지수로 복원한 2023년 인구가 가장 많은 국가는?',options:names,answer:vals.indexOf(Math.max.apply(null,vals)),explain:'실제량 = 기준량 × 지수÷100. 국가별 지수만으로 실제 인구 순위를 정하지 않는다.'};
  rows.forEach(function(x){q.pairs.push(pair('G137-2',x.name+'의 인구 증가율은 약 '+fmt(x.index-100)+'%이다.',x.name+'의 인구 증가율은 약 '+fmt(x.index)+'%이다.','기준 연도=100일 때 증가율은 지수−100이다.',{op:'indexGrowth',index:x.index,result:x.index-100}));q.pairs.push(pair('G137-2',x.name+'의 2023년 인구는 약 '+fmt(x.later,0)+'만 명이다.',x.name+'의 2023년 인구는 약 '+fmt(x.later*1.2,0)+'만 명이다.','기준량과 지수를 곱해 실제량을 복원한다.',{op:'indexAmount',base:x.base,index:x.index,result:x.later}));});
  return finish(q,r);
 }
 function carGrowthQ(seed){
  var r=seedState(seed),d=data.continuation.cars,names=shuffle(['독일','멕시코','브라질'],r),periods=[[2010,2012],[2012,2014],[2010,2014]],period=periods[seed%3];
  var q=base('car-growth','자동차 생산 증가량·증가율',seed,'OICA 공식 생산 통계 · 승용차+상용차 · 2010·2012·2014년');
  q.note='국내에서 생산한 자동차 수(대)이다. 증가량과 증가율은 이번 문항에 지정한 기간으로 계산한다. 생산량·수출량·자국 기업의 해외 생산량을 구별한다.';
  q.tables.push(table(['국가'].concat(d.years.map(function(y){return y+'년(대)';})),names.map(function(n){return[n].concat(d.years.map(function(y){return d.countries[n][y].total;}));}),'세 시점 자동차 생산량'));
  var gs=names.map(function(n){var s=d.countries[n];return growth(s[period[0]].total,s[period[1]].total);});
  q.stage1={question:period[0]+'~'+period[1]+'년 생산량 증가율이 가장 높은 국가는?',options:names,answer:gs.indexOf(Math.max.apply(null,gs)),explain:'증가율=(나중 생산량−처음 생산량)÷처음 생산량×100. 증가량 자체와 구별한다.'};
  names.forEach(function(n){var a=d.countries[n][period[0]].total,b=d.countries[n][period[1]].total;
   q.pairs.push(pair('G098-1',n+'의 이 기간 생산 증가량은 '+fmt(b-a,0)+'대이다.',n+'의 이 기간 생산 증가량은 '+fmt(b,0)+'대이다.','증가량은 나중 값에서 처음 값을 뺀다. 음수는 생산 감소를 뜻한다.',{op:'subtract',a:b,b:a,result:b-a}));
   q.pairs.push(pair('G098-1',n+'의 이 기간 생산 증가율은 약 '+fmt(growth(a,b))+'%이다.',n+'의 이 기간 생산 증가율은 약 '+fmt(growth(a,b)+100)+'%이다.','나중÷처음×100은 지수이며 증가율은 거기서 100을 뺀다.',{op:'growth',a:a,b:b,result:growth(a,b)}));
  });
  q.pairs.push(pair('G098-1','2014년 멕시코의 생산량은 독일보다 적지만, 2010~2014년 증가율은 더 높다.','2014년 멕시코의 생산량이 독일보다 적으므로 2010~2014년 증가율도 반드시 더 낮다.','총량의 순서로 증가율을 정하지 않는다. 두 나라를 각각 2010년 생산량으로 나눈다.',{op:'growthVsLevel',mexico:d.countries['멕시코'],germany:d.countries['독일']}));
  return finish(q,r);
 }
 function capitalShareQ(seed){
  var r=seedState(seed),d=data.continuation.capitals2018,names=shuffle(Object.keys(d.countries),r),q=base('capital-share','수도 인구의 국가 내 비율',seed,'강의 1권 P05 · 남아메리카 수도 인구 · 2025학년도 수능 8번 · 제시 자료 2018년');
  q.note=d.definition+' 단위는 모두 천 명이다. 수도 인구는 총인구의 일부이며 도시·촌락 합계에 다시 더하지 않는다.';
  var rows=names.map(function(n){var x=d.countries[n];return{name:n,capital:x.capital,c:round(x.capitalPopulation,1),u:round(x.urban,1),r:round(x.rural,1)};});
  q.tables.push(table(['국가','수도','수도 인구','도시 인구','촌락 인구'],rows.map(function(x){return[x.name,x.capital,x.c,x.u,x.r];}),'2018년 인구(천 명) · 해당 기출의 수도 범위'));
  var shares=rows.map(function(x){return x.c/(x.u+x.r)*100;});
  q.stage1={question:'제시 자료에서 수도 인구가 국가 총인구에서 차지하는 비율이 가장 높은 국가는?',options:names,answer:shares.indexOf(Math.max.apply(null,shares)),explain:'수도 인구÷(도시 인구+촌락 인구)×100. 수도 인구 자체가 가장 많은 국가를 고르지 않는다.'};
  rows.forEach(function(x){var v=x.c/(x.u+x.r)*100;
   q.pairs.push(pair('G062-5',x.name+'의 수도 인구 비율은 약 '+fmt(v)+'%이다.',x.name+'의 수도 인구 비율은 약 '+fmt(x.c/x.u*100)+'%이다.','분모는 국가 총인구인 도시+촌락이다. 수도÷도시는 도시 인구 중 수도 인구 비율로 다른 지표이다.',{op:'capitalShare',capital:x.c,urban:x.u,rural:x.r,result:v}));
  });
  q.pairs.push(pair('G062-5','국가 총인구는 도시 인구와 촌락 인구를 더해 구한다.','국가 총인구는 도시 인구·촌락 인구·수도 인구를 모두 더해 구한다.','수도 인구를 다시 더하면 총인구 일부를 중복 계산한다.',{op:'capitalDenominator'}));
  return finish(q,r);
 }
 function birthDeathQ(seed){
  var r=seedState(seed),names=shuffle(['일본','독일','니제르'],r),q=base('birth-death','자연 증가율로 출생률 복원',seed,'세계은행 WDI · SP.DYN.CBRT.IN / SP.DYN.CDRT.IN · 2023년');
  q.note='출생률·사망률·자연 증가율은 모두 인구 1,000명당(‰)이다. 제시한 반올림 값으로 계산한다. 자연 증가에는 국제 이동이 포함되지 않는다.';
  var rows=names.map(function(n){var s=data.continuation.rates.countries[n],birth=round(s.birth,2),death=round(s.death,2);return{name:n,birth:birth,death:death,nir:round(birth-death,2)};});
  q.tables.push(table(['국가','자연 증가율(‰)','사망률(‰)'],rows.map(function(x){return[x.name,x.nir,x.death];}),'출생률은 표에 직접 제시하지 않는다'));
  var births=rows.map(function(x){return x.nir+x.death;});q.stage1={question:'복원한 출생률이 가장 높은 국가는?',options:names,answer:births.indexOf(Math.max.apply(null,births)),explain:'출생률=자연 증가율+사망률. 자연 감소 국가도 부호를 그대로 넣는다.'};
  rows.forEach(function(x){q.pairs.push(pair('G056-5',x.name+'의 출생률은 약 '+fmt(x.nir+x.death,2)+'‰이다.',x.name+'의 출생률은 약 '+fmt(x.nir+x.death+10,2)+'‰이다.','자연 증가율=출생률−사망률이므로 출생률은 두 제시값의 합이다.',{op:'add',a:x.nir,b:x.death,result:x.nir+x.death}));});
  q.pairs.push(pair('G134-3','10‰는 1%와 같다.','10‰는 10%와 같다.','‰는 1,000분율, %는 100분율이다. 같은 수치의 ‰를 %로 바꾸려면 10으로 나눈다.',{op:'perMille',perMille:10,percent:1}));
  q.pairs.push(pair('G056-5','사망률만으로 의료 수준의 높고 낮음을 확정할 수 없다.','사망률이 높은 국가의 의료 수준은 반드시 더 낮다.','조사망률은 연령 구성의 영향을 받는다. 고령 인구가 많은 국가의 높은 사망률을 의료 수준만으로 설명하지 않는다.',{op:'ageStructureConfound'}));
  return finish(q,r);
 }
 function cityDistanceQ(seed){
  var r=seedState(seed),candidates=seed%2?['뉴욕','보스턴','시카고']:['샌프란시스코','로스앤젤레스','휴스턴'],names=shuffle(candidates,r),q=base('city-distance','도시 간 거리 행렬 복원',seed,'앱 도시 좌표 · 구면 대권 거리 · 지구 반지름 6,371km');
  function km(a,b){return a===b?0:Math.round(distance(data.cities[a],data.cities[b]));}
  q.assignment=names;q.note='기준표와 익명 표는 같은 도시 좌표에서 계산한 대권 거리(km)이다. 실제 도로·비행 경로 거리나 항공편 수가 아니다. 거리 수치를 암기할 필요는 없다.';
  q.tables.push(table(['기준 도시'].concat(candidates),candidates.map(function(n){return[n].concat(candidates.map(function(m){return km(n,m);}));}),'후보 도시 기준 거리표(km)'));
  q.tables.push(table(['익명 도시'].concat(L),names.map(function(n,i){return[L[i]].concat(names.map(function(m){return km(n,m);}));}),'동일 도시를 순서만 바꾼 거리표(km)'));
  q.identifyExplain='대칭인 칸은 같은 도시 쌍이다. 각 행에 연결된 두 거리의 조합을 기준표와 맞춘다.';
  var a=km(names[0],names[1]),b=km(names[0],names[2]);
  q.pairs.push(pair('G068-2','(가)~(나)의 거리는 '+fmt(a,0)+'km이다.','(가)~(나)의 거리는 '+fmt(b,0)+'km이다.','행과 열이 만나는 칸을 읽는다. 표의 반대편 대칭 칸도 같은 도시 쌍이다.',{op:'cityDistance',a:data.cities[names[0]],b:data.cities[names[1]],result:a}));
  q.pairs.push(pair('G130-1','(가)에서 더 가까운 도시는 '+(a<b?'(나)':'(다)')+'이다.','(가)에서 더 가까운 도시는 '+(a<b?'(다)':'(나)')+'이다.','같은 출발 도시의 행 안에서 두 거리 값을 비교한다.',{op:'distanceCompare',a:a,b:b}));
  q.pairs.push(pair('G068-2','거리표만으로 도시의 세계 도시 계층을 확정할 수 없다.','다른 도시와의 거리가 가장 짧은 도시는 반드시 최상위 세계 도시이다.','이 표는 거리를 제시한다. 본사·생산자 서비스·항공편 수 등 다른 기능 자료는 없다.',{op:'distanceScope'}));
  q.pairs.push(pair('G130-1','두 도시 사이 거리는 행과 열의 순서를 바꾸어 읽어도 같다.','도시 사이 거리표에서는 행과 열을 바꾸면 반드시 다른 거리이다.','같은 두 점을 잇는 대권 거리는 대칭이다. 방향별 항공편·교역액과 구별한다.',{op:'distanceSymmetry'}));
  return finish(q,r);
 }
 function climateRestoreQ(seed){
  var r=seedState(seed),names=shuffle(['울란바토르','배로(우트키아빅)','아비장'],r),q=base('climate-restore','최한월·연교차로 최난월 복원',seed,'앱의 관측소 월평년 자료');
  q.assignment=names;q.figures.push({kind:'map',bounds:[-180,-60,180,85],regions:data.worldLand.concat(['울란바토르','배로(우트키아빅)','아비장'].map(function(n,i){var p=site(n);return{polygons:[],label:[p.lon,p.lat],letter:'ABC'[i]};}))});q.identifyExplain='A는 몽골 내륙 울란바토르, B는 알래스카 북극해 연안 배로, C는 기니만 연안 아비장이다. 최난월=최한월+연교차로 복원한 뒤 지도와 대응한다.';q.stationNames=names.slice();q.assignment=names.map(function(n){return {'울란바토르':'A','배로(우트키아빅)':'B','아비장':'C'}[n];});q.note='연교차=최난월 기온−최한월 기온이다. 몽골 내륙·알래스카 북극해 연안·기니만 연안의 관측소를 지도 문자와 대응한다.';
  q.tables.push(table(['자료','최한월 기온(℃)','연교차(℃)'],names.map(function(n,i){var a=site(n).t,min=Math.min.apply(null,a),max=Math.max.apply(null,a);return[L[i],min,round(max-min,3)];}),'최난월 기온은 숨긴 값'));
  q.tables.push(table(['후보 관측소','기후 단서'],[['울란바토르','몽골 내륙 · 최난월 10℃ 이상'],['배로(우트키아빅)','알래스카 북극해 연안 · 최난월 0~10℃ 미만'],['아비장','기니만 연안 · 모든 달 18℃ 이상']],'이 문항의 지역 대응 기준'));
  names.forEach(function(n,i){var ts=site(n).t,min=Math.min.apply(null,ts),max=Math.max.apply(null,ts),range=round(max-min,3);
   q.pairs.push(pair('G133-1',L[i]+'의 최난월 기온은 약 '+fmt(min+range)+'℃이다.',L[i]+'의 최난월 기온은 약 '+fmt(range)+'℃이다.','최난월 기온=최한월 기온+연교차. 최한월이 음수여도 부호를 유지한다.',{op:'add',a:min,b:range,result:min+range}));
  });
  q.pairs.push(pair('G133-1','최난월 0~10℃ 미만인 자료는 제시한 기준에서 배로(우트키아빅)에 대응한다.','기온 연교차가 가장 큰 자료가 반드시 툰드라 기후이다.','툰드라 판정은 연교차가 아니라 최난월 0~10℃ 미만이라는 온도 기준을 쓴다.',{op:'warmestThreshold'}));
  return finish(q,r);
 }
 function religionQ(mode,seed){
  var r=seedState(seed),relative=mode==='religion-relative',names=shuffle(relative?['방글라데시','스리랑카','필리핀']:['미얀마','방글라데시','스리랑카'],r),keys=relative?['christianity','islam','hinduism','buddhism','judaism','unaffiliated','other']:['christianity','islam','hinduism'],labels=relative?['크리스트교','이슬람교','힌두교','불교','유대교','무종교','기타 종교']:['크리스트교','이슬람교','힌두교'];
  var q=base(mode,relative?'최대 종교=100 상대값':'선택 종교 합=100 삼각 도표',seed,'Pew 2025 발표 · 2020년 국가별 종교 구성');q.assignment=names;
  q.note=relative?'국가마다 가장 큰 종교 집단=100이다. 전체 인구=100%가 아니다. 무종교·기타 종교까지 포함한 모든 범주의 상대값을 제시한다. 반올림 오차가 있다.':'따로 표시한 세 종교만의 신자 합=100%이다. 불교·기타 종교·무종교는 제외된다. 국가 전체 인구=100%가 아니다.';
  var rows=names.map(function(n){var s=data.religions[n].values,v=keys.map(function(k){return s[k];}),den=relative?Math.max.apply(null,v):sum(v);return v.map(function(x){return x/den*100;});});
  q.tables.push(table(['자료'].concat(labels),rows.map(function(v,i){return[L[i]].concat(v.map(function(x){return round(x,3);}));}),relative?'국가별 최댓값=100 · 상대값':'선택 세 종교 신자 합=100%'));
  q.tables.push(table(['후보 국가','대응 기준'],names.slice().sort().map(function(n){return[n,n==='방글라데시'?'제시 종교 중 이슬람교 우세':n==='스리랑카'?(relative?'불교 우세':'제시 세 종교 중 힌두교>이슬람교>크리스트교'):n==='필리핀'?'크리스트교 우세':'제시 세 종교 중 크리스트교>이슬람교>힌두교'];}),'범례의 범위를 확인한 뒤 대응'));
  if(!relative)q.figures.push({kind:'ternary',labels:labels,points:rows.map(function(v,i){return{name:L[i],values:v};})});
  if(relative){
   rows.forEach(function(v,i){q.figures.push({kind:'bars',labels:labels,values:v.map(function(x){return round(x,3);}),yLabel:L[i]+' · 최대=100 상대값'});});
   rows.forEach(function(v,i){var shown=v.map(function(x){return round(x,3);}),j=v.indexOf(100),share=shown[j]/sum(shown)*100;
    q.pairs.push(pair('G137-1',L[i]+'에서 '+labels[j]+'의 국가 전체 인구 비율은 약 '+fmt(share)+'%이다.',L[i]+'에서 '+labels[j]+'의 국가 전체 인구 비율은 100%이다.','모든 범주의 상대값이 있으므로 해당 상대값÷상대값 합×100으로 구성비를 복원한다. 최대값 100을 인구 100%로 읽지 않는다.',{op:'relativeShare',value:shown[j],total:sum(shown),result:share}));
   });
   q.pairs.push(pair('G043-3','국가별 최대값=100이라는 상대값만으로 국가 간 실제 신자 수를 비교할 수 없다.','서로 다른 국가에서 상대값 100인 두 종교는 실제 신자 수가 같다.','각 국가의 기준 집단 실제 신자 수가 다를 수 있다. 구성비를 복원해도 인구 총량이 없으면 신자 수는 정할 수 없다.',{op:'relativeDenominator'}));
  }else{
   var values=rows[0],j=values.indexOf(Math.max.apply(null,values));
   q.pairs.push(pair('G043-3',L[0]+'에서 '+labels[j]+'는 제시한 세 종교 신자 합 중 약 '+fmt(values[j])+'%이다.',L[0]+'에서 '+labels[j]+'는 국가 전체 인구 중 약 '+fmt(values[j])+'%이다.','이 삼각 도표의 분모는 국가 전체 인구가 아니라 선택한 세 종교의 신자 합이다.',{op:'selectedReligions',country:names[0],keys:keys,result:values[j]}));
   q.pairs.push(pair('G041-2','이 도표만으로 미얀마의 국가 전체 최대 종교를 정할 수 없다.','미얀마는 제시 세 종교 중 크리스트교 비중이 가장 높으므로 국가 전체에서도 크리스트교가 최대이다.','불교를 범례에서 제외했다. 표시 집단끼리의 순위를 국가 전체 순위로 확장하지 않는다.',{op:'omittedReligion'}));
   q.pairs.push(pair('G043-3','세 축의 비율 합은 제시 세 종교 신자 합을 기준으로 100%이다.','세 축의 합이 100%이므로 국가 내에 다른 종교나 무종교 인구는 없다.','선택 범주를 다시 100으로 만든 구성비이다. 제외 범주의 인구가 0이라는 뜻은 아니다.',{op:'subsetComposition'}));
  }
  return finish(q,r);
 }
 function cropYieldQ(seed){
  var r=seedState(seed),names=shuffle(['프랑스','독일','인도'],r),mode=seed%3,q=base('crop-yield','수확 면적·단수·총생산량 복원',seed,'FAOSTAT QCL · 밀 · 2023년');
  q.note='같은 연도·품목의 수확 면적(ha), 단수(t/ha), 생산량(t)을 사용한다. ha와 km², t와 kg을 섞지 않는다. 표시된 반올림 값을 기준으로 계산한다.';
  var rows=names.map(function(n){var d=data.agriculture[n],a=round(d['qcl-area:밀']/1000,3),p=round(d['qcl-production:밀']/1000,3),y=round(p/a,3);return{name:n,a:a,p:p,y:y};});
  q.tables.push(table(['국가'].concat(mode===0?['수확 면적(천 ha)','단수(t/ha)']:mode===1?['생산량(천 t)','수확 면적(천 ha)']:['생산량(천 t)','단수(t/ha)']).concat(['인구(만 명)']),rows.map(function(x){return[x.name].concat(mode===0?[x.a,x.y]:mode===1?[x.p,x.a]:[x.p,x.y]).concat([data.countries[x.name].series.pop['2023']]);}),'세 생산 지표 중 두 값만 제시 · 인구: 같은 해 WDI'));
  var vals=rows.map(function(x){return mode===0?x.a*x.y:mode===1?x.p/x.a:x.p/x.y;});
  q.stage1={question:'복원한 '+(mode===0?'생산량':mode===1?'단수':'수확 면적')+'이 가장 큰 국가는?',options:names,answer:vals.indexOf(Math.max.apply(null,vals)),explain:'생산량=면적×단수, 단수=생산량÷면적, 면적=생산량÷단수. 같은 단위 배율끼리 계산한다.'};
  rows.forEach(function(x,i){var v=vals[i],unit=mode===0?'천 t':mode===1?'t/ha':'천 ha';q.pairs.push(pair('G075-1',x.name+'의 복원한 값은 약 '+fmt(v)+' '+unit+'이다.',x.name+'의 복원한 값은 약 '+fmt(v*1.2)+' '+unit+'이다.','이번 표에서 숨긴 값을 나머지 두 지표로 복원한다.',{op:mode===0?'product':'quotient',a:mode===0?x.a:x.p,b:mode===1?x.a:x.y,result:v}));});
  var x=rows[seed%3],production=mode===0?x.a*x.y:x.p,population=data.countries[x.name].series.pop['2023'],perPerson=production*100/population;
  q.pairs.push(pair('G075-1',x.name+'의 1인당 밀 생산량은 약 '+fmt(perPerson)+'kg이다.',x.name+'의 1인당 밀 생산량은 약 '+fmt(perPerson*10)+'kg이다.','생산량(천 t)×1,000,000kg을 인구(만 명)×10,000명으로 나눈다. 총생산량과 1인당 생산량을 구별한다.',{op:'cropPerPerson',productionThousandTonnes:production,populationTenThousands:population,result:perPerson}));
  q.pairs.push(pair('G075-1','단수가 높다는 이유만으로 총생산량도 더 많다고 확정할 수 없다.','단수가 가장 높은 국가는 수확 면적과 관계없이 생산량도 반드시 가장 많다.','단수는 단위 면적당 생산량이다. 총생산량에는 수확 면적도 필요하다.',{op:'yieldVsTotal'}));
  return finish(q,r);
 }
 function religionOtherQ(seed){
  var r=seedState(seed),names=shuffle(['미얀마','스리랑카','방글라데시'],r),q=base('religion-other','종교 범례의 기타 묶음',seed,'Pew 2025 발표 · 2020년 구성 · 선택 범례로 재구성');q.assignment=names;
  q.note='크리스트교·이슬람교·힌두교만 따로 표시하고, 불교·유대교·무종교·기타 종교를 모두 나머지 묶음으로 표시했다. 묶음 이름인 기타는 하나의 종교가 아니다.';
  var vals=names.map(function(n){var v=data.religions[n].values;return[v.christianity,v.islam,v.hinduism,round(100-v.christianity-v.islam-v.hinduism,3)];});
  q.figures.push({kind:'stacked',labels:L,categories:['크리스트교','이슬람교','힌두교','기타 묶음'],values:vals,xLabel:'국가 전체 인구=100%'});
  q.tables.push(table(['자료','크리스트교','이슬람교','힌두교','기타 묶음'],vals.map(function(v,i){return[L[i]].concat(v);}),'국가 전체 인구 대비 % · 반올림 잔차는 기타에 포함'));
  q.tables.push(table(['후보 국가','표시된 세 종교 중 큰 순서'],[['미얀마','크리스트교>이슬람교>힌두교'],['스리랑카','힌두교>이슬람교>크리스트교'],['방글라데시','이슬람교>힌두교>크리스트교']],'범례에 따로 표시된 집단끼리만 비교한 대응 기준'));
  q.pairs.push(pair('G041-2','미얀마에서 따로 표시한 세 종교 중에는 크리스트교 비율이 가장 높다.','미얀마에서 크리스트교는 기타 묶음 안의 모든 개별 종교보다 비율이 높다.','나머지 묶음에는 불교 등이 들어 있다. 따로 표시한 세 종교 순위와 전체 종교 순위는 다르다.',{op:'religionOtherScope'}));
  q.pairs.push(pair('G041-2','기타 묶음이 가장 커도 그 안의 어느 하나가 국가 최대 종교인지는 이 그래프만으로 확정할 수 없다.','기타 묶음이 가장 크면 기타라는 한 종교가 국가 최대 종교이다.','묶음 합과 묶음 안의 개별 집단 값을 구분한다. 기타에 여러 집단을 더했으므로 한 종교로 취급하지 않는다.',{op:'otherNotSingle'}));
  q.pairs.push(pair('G041-2','범례 구성이 달라지면 같은 국가도 기타 묶음의 비율이 달라질 수 있다.','같은 국가에서 기타 묶음의 비율은 범례 구성과 관계없이 항상 같다.','따로 표시하지 않은 항목을 합친 잔여 범주이므로 어떤 항목을 따로 표시하는지 확인한다.',{op:'otherDependsOnLegend'}));
  return finish(q,r);
 }
 function urbanScatterQ(seed){
  var r=seedState(seed),names=shuffle(['아시아','아프리카','유럽'],r),q=base('urban-rural-scatter','도시·촌락 인구의 좌표와 이동',seed,'UN WUP 2025 · 국가별 도시 정의 · 권역 원집계');q.assignment=names;
  q.note='가로=촌락 인구, 세로=도시 인구(모두 백만 명). 원점과 점을 이은 기울기는 도시÷촌락이다. 도시화율은 도시÷(도시+촌락)이며 기울기와 값 자체는 다르다.';
  var rows=names.map(function(n){var a=data.urban[n]['1970'],b=data.urban[n]['2020'];return{name:n,a:{u:round(a.u/1000,1),r:round(a.r/1000,1)},b:{u:round(b.u/1000,1),r:round(b.r/1000,1)}};});
  q.tables.push(table(['후보 권역','1970 도시','1970 촌락','2020 도시','2020 촌락'],rows.slice().sort(function(a,b){return a.name.localeCompare(b.name);}).map(function(x){return[x.name,x.a.u,x.a.r,x.b.u,x.b.r];}),'1970·2020년 인구(백만 명) · 대응 기준'));
  q.figures.push({kind:'scatter',zero:true,xLabel:'촌락 인구(백만 명)',yLabel:'도시 인구(백만 명)',movements:rows.map(function(x){return{from:{x:x.a.r,y:x.a.u},to:{x:x.b.r,y:x.b.u}};}),points:rows.flatMap(function(x,i){return[{name:L[i]+' 1970',x:x.a.r,y:x.a.u,size:1},{name:L[i]+' 2020',x:x.b.r,y:x.b.u,size:1}];})});
  rows.forEach(function(x,i){var s0=x.a.u/(x.a.u+x.a.r)*100,s1=x.b.u/(x.b.u+x.b.r)*100;
   q.pairs.push(pair('G062-4',L[i]+'의 도시화율은 두 시점 사이에 '+(s1>s0?'상승했다.':'하락했다.'),L[i]+'의 도시화율은 두 시점 사이에 '+(s1>s0?'하락했다.':'상승했다.'),'도시÷(도시+촌락)으로 계산한다. 원점 기울기가 클수록 도시화율도 높다.',{op:'urbanShareChange',u0:x.a.u,r0:x.a.r,u1:x.b.u,r1:x.b.r,result:s1-s0}));
  });
  q.pairs.push(pair('G062-4','원점 기울기가 1인 점은 도시화율 50%에 해당한다.','원점 기울기가 1인 점은 도시화율 100%에 해당한다.','기울기 1은 도시=촌락이다. 도시화율은 1÷(1+1)=50%이다.',{op:'urbanSlope',slope:1,share:50}));
  return finish(q,r);
 }
 var families=[
  ['car-growth','자동차 생산 증가량·증가율',carGrowthQ],
  ['capital-share','수도 인구의 국가 내 비율',capitalShareQ],
  ['birth-death','출생률 복원·‰와 %',birthDeathQ],
  ['city-distance','도시 간 거리 행렬',cityDistanceQ],
  ['climate-restore','최한월·연교차로 최난월 복원',climateRestoreQ],
  ['religion-relative','최대 종교=100 상대값',function(s){return religionQ('religion-relative',s);}],
  ['religion-selected','선택 종교 구성 삼각 도표',function(s){return religionQ('religion-selected',s);}],
  ['religion-other','종교 범례의 기타 묶음',religionOtherQ],
  ['crop-yield','수확 면적·단수·생산량',cropYieldQ],
  ['urban-rural-scatter','도시·촌락 인구 좌표',urbanScatterQ],
  ['energy-change','미국·중국 에너지 두 시점',function(s){return energyQ('energy-change',s);}],
  ['energy-composition','에너지 구성의 두 시점',function(s){return energyQ('energy-composition',s);}],
  ['gis-filters','GIS 조건 필터',function(s){return gisQ('filters',s);}],
  ['gis-medical','GIS 의료 지원·지도 대응',function(s){return gisQ('medical',s);}],
  ['gis-scoring','GIS 구간 배점',function(s){return gisQ('scoring',s);}],
  ['gis-directions','GIS 점수 방향 바꾸기',function(s){return gisQ('score-directions',s);}],
  ['gis-weighted','GIS 가중치',function(s){return gisQ('weighted',s);}],
  ['gis-top-two','GIS 상위 두 국가·동점',function(s){return gisQ('top-two',s);}],
  ['gis-tie-break','GIS 동점·2차 기준',function(s){return gisQ('tie-break',s);}],
  ['cumulative','누적 강수량',function(s){return climate('cumulative',s);}],
  ['self-deviation','자기 연평균 기온 편차',function(s){return climate('self-deviation',s);}],
  ['common-deviation','지역 평균 기준 기온 편차',function(s){return climate('common-deviation',s);}],
  ['reference-deviation','기준 도시와의 기온 차이',function(s){return climate('reference-deviation',s);}],
  ['precip-deviation','강수량 편차',function(s){return climate('precip-deviation',s);}],
  ['difference','기온·강수 차이 산점도',function(s){return climate('difference',s);}],
  ['daylight','월별 낮 길이',function(s){return solarQ('daylight',s);}],
  ['solar-altitude','월별 정오 태양 고도',function(s){return solarQ('solar-altitude',s);}],
  ['solar-month','태양 고도로 달 찾기',solarMonthQ],
  ['solar-climate','태양 고도와 기후 자료',function(s){return solarQ('solar-climate',s);}],
  ['solar-night','위도·밤 길이 차이',function(s){return solarQ('solar-night',s);}],
  ['age-triangle','연령 구조 삼각 도표',function(s){return ages('age-triangle',s);}],
  ['dependency','부양비 계산과 역산',function(s){return ages('dependency',s);}],
  ['urban-weighted','도시·촌락 증가율 결합',function(s){return urbanQ('urban-weighted',s);}],
  ['urban-change','두 시점 도시화율 산점도',function(s){return urbanQ('urban-change',s);}],
  ['urban-radar','도시 지표 방사형 그래프',radarQ],['city-tier','세계 도시의 세 축 모식도',tierQ],
  ['soil-temperature','지중 온도·활동층',soilQ],['headquarters','본사 수·매출·집중도',corporateQ],
  ['migrant-stock','미국 이민자 제시 자료',migrantQ],['population-index','기준 연도 100 지수',indexQ]
 ];
 var more=typeof module==='object'&&module.exports?require('./materials-remaining.js'):globalThis.WGRemainingMaterials;
 var moreData=typeof module==='object'&&module.exports?require('./materials-remaining-data.js'):globalThis.WGRemainingData;
 if(more&&moreData)families=families.concat(more.create(data,moreData,{shuffle:shuffle,seedState:seedState,base:base,pair:pair,finish:finish,table:table,round:round,fmt:fmt,math:{sum:sum,age:age,declination:declination,daylight:daylight}}));
 function build(id,seed){var f=families.find(function(x){return x[0]===id;});if(!f)throw Error('Unknown material '+id);var q=f[2](seed==null?1:seed);q.mode=q.id;q.id=id;return q;}
 var examModule=typeof module==='object'&&module.exports?require('./materials-exam.js'):globalThis.WGMaterialExam;
 var exam=examModule&&examModule.create(data,{distance:distance});
 return{families:families.map(function(f){return{id:f[0],title:f[1]};}),build:build,exam:exam&&exam.prepare,paused:exam&&exam.paused||{}};
}
return{create:create,math:{sum:sum,mean:mean,cumulative:cumulative,season:season,age:age,workforce:workforce,growth:growth,declination:declination,daylight:daylight,noonAltitude:noonAltitude,solar:solar,normalize:normalize,ternary:ternary,distance:distance,zeroCrossing:zeroCrossing,bandScore:bandScore,filterRows:filterRows},rng:rng};
});
