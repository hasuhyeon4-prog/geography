/* 기후 칠하기: the lecture's 14 climate types on a 0.5° grid, and grading of what the learner paints.
 * The grid (assets/climate-grid.js) holds the Köppen-Geiger class (Beck et al. 2023, 1991–2020) and mean
 * elevation per cell. The lecture type is derived here so the highland rule lives in one place. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WGClimatePaint=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Order = palette order. Colours follow the Beck et al. (2023) legend; H is brown as in textbooks.
var TYPES=[
 {id:'af',code:'Af',name:'열대 우림',color:'#1f3fe0'},
 {id:'am',code:'Am',name:'열대 몬순',color:'#2f86f0'},
 {id:'aw',code:'Aw',name:'사바나',color:'#62b4f4'},
 {id:'bw',code:'BW',name:'사막',color:'#e8382f'},
 {id:'bs',code:'BS',name:'스텝',color:'#f2a93b'},
 {id:'cs',code:'Cs',name:'지중해성',color:'#e8d81f'},
 {id:'cw',code:'Cw',name:'온대 겨울 건조',color:'#8ee38e'},
 {id:'cfa',code:'Cfa',name:'온난 습윤',color:'#c3ec5c'},
 {id:'cfb',code:'Cfb',name:'서안 해양성',color:'#4fc84a'},
 {id:'df',code:'Df',name:'냉대 습윤',color:'#2fc8d8'},
 {id:'dw',code:'Dw',name:'냉대 겨울 건조',color:'#6d78d8'},
 {id:'et',code:'ET',name:'툰드라',color:'#b9b9b9'},
 {id:'ef',code:'EF',name:'빙설',color:'#6f6f6f'},
 {id:'h',code:'H',name:'고산',color:'#9a6a3c'}
];
var INDEX={};TYPES.forEach(function(t,i){INDEX[t.id]=i+1;});
// Köppen-Geiger classes 1–30 (legend of Beck et al. 2023) → lecture type.
var KG=['','Af','Am','Aw','BWh','BWk','BSh','BSk','Csa','Csb','Csc','Cwa','Cwb','Cwc','Cfa','Cfb','Cfc','Dsa','Dsb','Dsc','Dsd','Dwa','Dwb','Dwc','Dwd','Dfa','Dfb','Dfc','Dfd','ET','EF'];
function lectureOf(k){var c=KG[k];if(!c)return 0;
 if(c[0]==='A')return INDEX[c.toLowerCase()];if(c[0]==='B')return INDEX[c.slice(0,2).toLowerCase()];
 if(c[0]==='C')return c[1]==='s'?INDEX.cs:c[1]==='w'?INDEX.cw:c==='Cfa'?INDEX.cfa:INDEX.cfb;
 if(c[0]==='D')return c[1]==='w'?INDEX.dw:INDEX.df;return INDEX[c.toLowerCase()];}
// 고산 기후 on the answer map from about 2,000 m (키토·보고타·아디스아바바·티베트·안데스). In the tropics painting
// H is also accepted from 1,500 m (나이로비·멕시코 고원 가장자리); never on a lower plateau such as 브라질리아
// (약 1,000 m), and outside the tropics not below 2,000 m (덴버 1,600 m is 스텝).
var H_SHOW=20,H_ACCEPT_TROPICS=15,TROPICS=25;
var SCOPES=[
 {id:'world',name:'전 세계',box:[-180,-60,180,84]},
 {id:'asia',name:'아시아',box:[25,-12,150,78]},
 {id:'europe',name:'유럽',box:[-25,34,60,72]},
 {id:'africa',name:'아프리카',box:[-20,-36,55,38]},
 {id:'namerica',name:'북아메리카',box:[-170,5,-50,75]},
 {id:'samerica',name:'남아메리카',box:[-85,-57,-33,14]},
 {id:'oceania',name:'오세아니아',box:[110,-48,180,0]}
];
function unrle(a,n){var out=new Uint8Array(n),p=0;for(var i=0;i<a.length;i+=2){out.fill(a[i],p,p+a[i+1]);p+=a[i+1];}if(p!==n)throw Error('grid size');return out;}
function create(grid){
 var R=grid.rows,C=grid.cols,N=R*C,kg=unrle(grid.koppen,N),el=unrle(grid.elev100,N),ref=new Uint8Array(N);
 function lat(i){return grid.north-(Math.floor(i/C)+.5)*grid.cell;}
 // Ice sheets (EF) and the polar regions stay E even where they are high (그린란드·남극 빙상).
 function highland(i,min){return kg[i]>0&&KG[kg[i]]!=='EF'&&Math.abs(lat(i))<=60&&el[i]>=min;}
 for(var i=0;i<N;i++)ref[i]=kg[i]?(highland(i,H_SHOW)?INDEX.h:lectureOf(kg[i])):0;
 function lon(i){return grid.west+(i%C+.5)*grid.cell;}
 function cellAt(lo,la){var r=Math.floor((grid.north-la)/grid.cell),c=Math.floor((lo-grid.west)/grid.cell);if(r<0||r>=R||c<0||c>=C)return -1;return r*C+c;}
 // Is painting type t at cell i right? The Köppen type is always right; H is right on high ground.
 function highAccepted(i){return highland(i,Math.abs(lat(i))<=TROPICS?H_ACCEPT_TROPICS:H_SHOW);}
 function accepts(i,t){if(!kg[i]||!t)return false;return t===lectureOf(kg[i])||t===INDEX.h&&highAccepted(i);}
 function near(i,t){var r=Math.floor(i/C),c=i%C;for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;var rr=r+dr,cc=(c+dc+C)%C;if(rr<0||rr>=R)continue;if(accepts(rr*C+cc,t))return true;}return false;}
 function inScope(i,box){var a=lat(i),o=lon(i);return kg[i]>0&&o>=box[0]&&o<=box[2]&&a>=box[1]&&a<=box[3];}
 function weight(i){return Math.cos(lat(i)*Math.PI/180);}
 // status per cell: 1 right, 2 boundary (right one cell away), 3 wrong, 4 missed (focus type not painted).
 function grade(paint,box,focus){
  var st=new Uint8Array(N),w={right:0,near:0,wrong:0,painted:0,land:0,focus:0,missed:0},byType={};
  for(var i=0;i<N;i++){if(!inScope(i,box))continue;var q=weight(i);w.land+=q;var t=paint[i];
   if(t){w.painted+=q;var b=byType[t]||(byType[t]={right:0,total:0});b.total+=q;
    if(accepts(i,t)){st[i]=1;w.right+=q;b.right+=q;}else if(near(i,t)){st[i]=2;w.near+=q;b.right+=q;}else{st[i]=3;w.wrong+=q;}}
   if(focus&&ref[i]===focus){w.focus+=q;if(t!==focus&&!accepts(i,t)){w.missed+=q;if(!t)st[i]=4;}}}
  var pct=function(a,b){return b?Math.round(a/b*100):0;};
  return {status:st,rightPct:pct(w.right+w.near,w.painted),nearPct:pct(w.near,w.painted),wrongPct:pct(w.wrong,w.painted),coveredPct:pct(w.painted,w.land),
   focusMissedPct:focus?pct(w.missed,w.focus):null,byType:Object.keys(byType).map(function(t){return {type:TYPES[t-1],pct:pct(byType[t].right,byType[t].total)};})};
 }
 function fmtLat(a){return (a>=0?'북위 ':'남위 ')+Math.abs(a).toFixed(1)+'°';}
 function fmtLon(o){return (o>=0?'동경 ':'서경 ')+Math.abs(o).toFixed(1)+'°';}
 // What a tap on cell i tells the learner, with the reason a painted type is wrong.
 function explain(i,t){if(!kg[i])return null;var r=TYPES[ref[i]-1],k=TYPES[lectureOf(kg[i])-1],m=el[i]*100,lines=[];
  lines.push(fmtLat(lat(i))+' · '+fmtLon(lon(i))+' · 해발 약 '+m.toLocaleString('ko-KR')+'m');
  lines.push('정답: '+r.name+'('+r.code+')'+(r.id==='h'?' — 쾨펜 기호로는 '+KG[kg[i]]+'('+k.name+')도 정답':' · 쾨펜 '+KG[kg[i]]));
  if(t){var p=TYPES[t-1];
   if(accepts(i,t))lines.push('칠한 것 '+p.name+'('+p.code+') — 맞음'+(t===INDEX.h&&ref[i]!==INDEX.h?' (열대의 해발 1,500m 이상 고지라 고산으로도 인정)':''));
   else{var why=near(i,t)?' — 바로 옆 칸이 '+p.name+'이라 경계로 봐줌':' — 틀림';
    if(t===INDEX.h)why+=': 해발 약 '+m.toLocaleString('ko-KR')+'m는 고산 기후 고지(대략 2,000m 이상, 열대는 1,500m 이상)가 아니다. 위도와 그래프의 기본 규칙대로 판단한다.';
    else if(k.id[0]==='b'&&p.id[0]!=='b')why+=': 건조 기후 — 한류 연안·비그늘·대륙 내부·아열대 고압대 중 무엇 때문인지 확인한다.';
    else if(k.id[0]==='a'&&p.id[0]!=='a')why+=': 최한월 18℃ 이상인 열대 — 고원이 가까워도 이 지점이 저지·해안이면 열대이다.';
    lines.push('칠한 것 '+p.name+'('+p.code+')'+why);}}
  return lines;}
 return {types:TYPES,scopes:SCOPES,rows:R,cols:C,cell:grid.cell,west:grid.west,north:grid.north,koppen:kg,elev100:el,ref:ref,
  lat:lat,lon:lon,cellAt:cellAt,accepts:accepts,grade:grade,explain:explain,inScope:inScope,lectureOf:lectureOf,KG:KG,INDEX:INDEX};
}
return {create:create,TYPES:TYPES,SCOPES:SCOPES};
});
