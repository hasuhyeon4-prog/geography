/* Exact SVG plots for the supplied-data questions. No remote dependencies. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WGMaterialCharts=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
var colors=['#096b83','#b14622','#7b479a','#427545'],dash=['','8 4','3 3','10 3 2 3'];
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c];});}
function num(v){if(!Number.isFinite(v))throw Error('Non-finite chart coordinate');return Math.round(v*1000)/1000;}
function txt(x,y,s,anchor,size,color){return'<text x="'+num(x)+'" y="'+num(y)+'" text-anchor="'+(anchor||'middle')+'" font-size="'+Math.max(size||13,14)+'" fill="'+(color||'#304652')+'">'+esc(s)+'</text>';}
function line(x1,y1,x2,y2,color,width,d){return'<line x1="'+num(x1)+'" y1="'+num(y1)+'" x2="'+num(x2)+'" y2="'+num(y2)+'" stroke="'+(color||'#bfd0d8')+'" stroke-width="'+(width||1)+'"'+(d?' stroke-dasharray="'+d+'"':'')+'/>';}
function dot(x,y,r,color){return'<circle cx="'+num(x)+'" cy="'+num(y)+'" r="'+num(r)+'" fill="white" stroke="'+color+'" stroke-width="2"/>';}
function nice(max,min){var span=max-min;if(!span)span=Math.max(Math.abs(max)*.1,1);var raw=span/5,p=10**Math.floor(Math.log10(raw)),a=raw/p,step=(a<=1?1:a<=2?2:a<=5?5:10)*p;return{min:Math.floor(min/step)*step,max:Math.ceil((max===min?max+span:max)/step)*step,step:step};}
function label(v){return String(Math.round(v*1000)/1000);}
function wrap(s,size){var a=[...String(s)],out=[];while(a.length)out.push(a.splice(0,size).join(''));return out;}
function legend(series){return series.map(function(s,i){return line(85+i*150,415,110+i*150,415,colors[i%4],2,dash[i%4])+txt(118+i*150,420,s.name,'start',13);}).join('');}
function cartesian(f){
 var out='',left=90,right=650,top=34,bottom=345,values=[],xs=[];
 if(f.kind==='line'){xs=f.x;values=f.series.flatMap(function(s){return s.values;});}
 else if(f.kind==='bars'){xs=f.labels.map(function(_,i){return i;});values=f.values;}
 else{xs=f.points.map(function(p){return p.x;});values=f.points.map(function(p){return p.y;});}
 if(!xs.length||!values.length||!xs.every(Number.isFinite)||!values.every(Number.isFinite))throw Error('Invalid chart data');
 var minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs);if(f.zero&&f.kind==='scatter')minX=Math.min(0,minX);
 var xBounds=f.kind==='scatter'?nice(maxX,minX):{min:minX,max:maxX===minX?maxX+1:maxX};
 var minY=Math.min.apply(null,values),maxY=Math.max.apply(null,values);
 if(f.zero||f.kind==='bars'){minY=Math.min(0,minY);maxY=Math.max(0,maxY);}
 var b=f.domainY?{min:f.domainY[0],max:f.domainY[1],step:(f.domainY[1]-f.domainY[0])/6}:nice(maxY,minY);
 if(f.diagonal){var low=Math.min(xBounds.min,b.min),high=Math.max(xBounds.max,b.max);xBounds=nice(high,low);b=nice(high,low);}
 function X(v){return left+(v-xBounds.min)/(xBounds.max-xBounds.min)*(right-left);}
 function Y(v){return bottom-(v-b.min)/(b.max-b.min)*(bottom-top);}
 for(var v=b.min,n=0;v<=b.max+b.step/10&&n<15;v+=b.step,n++)out+=line(left,Y(v),right,Y(v),'#e0e8ec')+txt(left-10,Y(v)+4,label(v),'end',12);
 out+=line(left,top,left,bottom,'#304652')+line(left,bottom,right,bottom,'#304652');
 if(f.kind==='scatter'){
  for(var xv=xBounds.min,ii=0;xv<=xBounds.max+xBounds.step/10&&ii<15;xv+=xBounds.step,ii++)out+=line(X(xv),top,X(xv),bottom,'#e0e8ec')+txt(X(xv),bottom+22,label(xv),'middle',12);
  if(xBounds.min<0&&xBounds.max>0)out+=line(X(0),top,X(0),bottom,'#91a7b3',1.5);
  if(b.min<0&&b.max>0)out+=line(left,Y(0),right,Y(0),'#91a7b3',1.5);
  if(f.diagonal)out+=line(X(xBounds.min),Y(xBounds.min),X(xBounds.max),Y(xBounds.max),'#6c7881',1.5,'6 4');
  (f.movements||[]).forEach(function(m){var x0=X(m.from.x),y0=Y(m.from.y),x1=X(m.to.x),y1=Y(m.to.y),angle=Math.atan2(y1-y0,x1-x0),len=11;
   out+=line(x0,y0,x1,y1,'#6c7881',1.5,'5 3')+'<polygon points="'+[[x1,y1],[x1-len*Math.cos(angle-.4),y1-len*Math.sin(angle-.4)],[x1-len*Math.cos(angle+.4),y1-len*Math.sin(angle+.4)]].map(function(p){return p.map(num).join(',');}).join(' ')+'" fill="#6c7881"/>';
  });
  f.points.forEach(function(p,i){var radius=f.sizeLabel?Math.sqrt(p.size)*3:p.size>1?Math.sqrt(p.size)*3:6;out+=dot(X(p.x),Y(p.y),radius,colors[i%4]);});
  // White-filled bubbles must not paint over an earlier point's label.
  f.points.forEach(function(p,i){out+=txt(X(p.x)+10,Y(p.y)-10,p.name,'start',14,colors[i%4]);});
 }else if(f.kind==='bars'){
  var bw=(right-left)/(f.labels.length*1.7),bx=function(i){return left+(i+.5)*(right-left)/f.labels.length;};
  f.values.forEach(function(v,i){var inside=v>0&&Y(v)<top+22;out+='<rect x="'+num(bx(i)-bw/2)+'" y="'+num(Y(Math.max(v,0)))+'" width="'+num(bw)+'" height="'+num(Math.abs(Y(v)-Y(0)))+'" fill="'+colors[i%4]+'"/>'+txt(bx(i),Y(v)+(inside?20:-8),label(v),'middle',12,inside?'white':null)+txt(bx(i),bottom+24,f.labels[i],'middle',13);});
 }else{
  f.x.forEach(function(x){out+=txt(X(x),bottom+22,x,'middle',12);});
  f.series.forEach(function(s,i){out+='<polyline points="'+s.values.map(function(y,j){return num(X(f.x[j]))+','+num(Y(y));}).join(' ')+'" fill="none" stroke="'+colors[i%4]+'" stroke-width="2.3"'+(dash[i%4]?' stroke-dasharray="'+dash[i%4]+'"':'')+'/>';s.values.forEach(function(y,j){out+=dot(X(f.x[j]),Y(y),2.5,colors[i%4]);});});
  out+=legend(f.series);
 }
 out+=txt((left+right)/2,393,f.xLabel||'',null,14)+txt(left,18,f.yLabel||'','start',14);if(f.sizeLabel)out+=txt(350,423,f.sizeLabel,null,14);return out;
}
function radar(f){
 var out='',cx=350,cy=205,R=150,N=f.labels.length;
 function point(v,i){var a=-Math.PI/2+i*2*Math.PI/N;return[cx+R*v/f.maximum*Math.cos(a),cy+R*v/f.maximum*Math.sin(a)];}
 for(var k=1;k<=4;k++){out+='<polygon points="'+f.labels.map(function(_,i){return point(f.maximum*k/4,i).map(num).join(',');}).join(' ')+'" fill="none" stroke="#d5e0e6"/>'+txt(cx+6,cy-R*k/4,label(f.maximum*k/4),'start',12);}
 f.labels.forEach(function(s,i){var p=point(f.maximum,i),labelP=point(f.maximum*1.18,i);out+=line(cx,cy,p[0],p[1],'#839fae')+txt(labelP[0],labelP[1],s,null,14);});
 f.series.forEach(function(s,i){out+='<polygon points="'+s.values.map(function(v,j){return point(v,j).map(num).join(',');}).join(' ')+'" fill="none" stroke="'+colors[i%4]+'" stroke-width="2.5"'+(dash[i%4]?' stroke-dasharray="'+dash[i%4]+'"':'')+'/>';});
 return out+legend(f.series);
}
function triangle(f){
 var out='',mins=f.minimum||[0,0,0],rest=100-mins.reduce(function(a,b){return a+b;},0),P=[[100,338],[600,338],[350,52]];
 function xy(v){var w=v.map(function(a,i){return(a-mins[i])/rest;});return[P.reduce(function(s,p,i){return s+p[0]*w[i];},0),P.reduce(function(s,p,i){return s+p[1]*w[i];},0)];}
 out+='<polygon points="'+P.map(function(p){return p.join(',');}).join(' ')+'" fill="#f6f9fa" stroke="#507485" stroke-width="1.5"/>';
 for(var i=0;i<3;i++){
  for(var k=1;k<=4;k++){var a=mins.slice(),b=mins.slice();a[i]+=rest*k/5;b[i]+=rest*k/5;a[(i+1)%3]+=rest*(1-k/5);b[(i+2)%3]+=rest*(1-k/5);var u=xy(a),v=xy(b);out+=line(u[0],u[1],v[0],v[1],'#d7e2e7');out+=txt(u[0]+(i===0?-8:8),u[1]-5,label(mins[i]+rest*k/5),'middle',11);}
  var v=mins.slice();v[i]+=rest;
  var tx=P[i][0],ty=P[i][1]+(i===2?-22:25);out+=txt(tx,ty,f.labels[i],null,14)+txt(tx,ty+17,v.join(' / ')+'%',null,11);
 }
 out+=txt(350,405,'좌표 순서: '+f.labels.join(' / '),null,13);
 f.points.forEach(function(p,i){var xy0=xy(p.values),flip=xy0[0]>350;out+=dot(xy0[0],xy0[1],5,colors[i%4])+txt(xy0[0]+(flip?-11:11),xy0[1]-10,p.name,flip?'end':'start',14,colors[i%4]);});return out;
}
function profile(f){
 var left=90,right=650,top=35,bottom=350,all=f.series.flatMap(function(s){return s.values;}),b=nice(Math.max.apply(null,all),Math.min.apply(null,all)),maxD=Math.max.apply(null,f.depth),out='';
 function X(x){return left+(x-b.min)/(b.max-b.min)*(right-left);}function Y(d){return top+d/maxD*(bottom-top);}
 for(var x=b.min;x<=b.max+b.step/10;x+=b.step)out+=line(X(x),top,X(x),bottom,'#e0e8ec')+txt(X(x),bottom+23,label(x));
 f.depth.forEach(function(d){out+=line(left,Y(d),right,Y(d),'#e0e8ec')+txt(left-12,Y(d)+4,d,'end',12);});
 out+=line(X(0),top,X(0),bottom,'#596e78',2,'5 4');
 f.series.forEach(function(s,i){out+='<polyline points="'+s.values.map(function(t,j){return num(X(t))+','+num(Y(f.depth[j]));}).join(' ')+'" fill="none" stroke="'+colors[i%4]+'" stroke-width="2.5"'+(dash[i%4]?' stroke-dasharray="'+dash[i%4]+'"':'')+'/>';});
 return out+txt(350,394,f.xLabel,null,14)+txt(left,20,f.yLabel+' · 아래로 깊어짐','start',14)+legend(f.series);
}
function axes3(f){
 var O=[280,325],V=[[280,0],[140,-140],[0,-245]],out='';
 function xy(a){return[O[0]+a.reduce(function(s,v,i){return s+v*V[i][0];},0)*.62,O[1]+a.reduce(function(s,v,i){return s+v*V[i][1];},0)*.62];}
 for(var mask=0;mask<8;mask++)for(var axis=0;axis<3;axis++)if(!(mask&(1<<axis))){var a=[0,1,2].map(function(i){return(mask>>i)&1;}),b=a.slice();b[axis]=1;var u=xy(a),v=xy(b);out+=line(u[0],u[1],v[0],v[1],'#c8d7de',1,'4 4');}
 f.labels.forEach(function(s,i){var e=[O[0]+V[i][0],O[1]+V[i][1]];out+=line(O[0],O[1],e[0],e[1],'#5b7583',2);wrap(s,12).forEach(function(t,j){out+=txt(e[0]+(i===0?0:10),e[1]-12+j*17,t,i===2?'end':'middle',13);});out+=txt(e[0],e[1]+30,'상대적으로 큼',null,12);});
 out+=txt(O[0]-10,O[1]+25,'상대적으로 작음',null,12);
 f.points.forEach(function(p,i){var a=xy(p.values);out+=dot(a[0],a[1],6,colors[i%4])+txt(a[0]+10,a[1]-10,p.name,'start',15);});
 return out+txt(350,410,'계층 평균의 상대 위치 · 수치 축이 아닌 모식도',null,13);
}
function energyBars(f){
 var out=txt(350,23,f.name||'',null,16),left=90,right=650,top=58,bottom=330;
 if(f.kind==='stacked'){
  // Keep long category labels inside the SVG, including "원주민 및 기타".
  left=Math.max(left,Math.min(200,12+Math.max.apply(null,f.labels.map(function(s){return [...String(s)].length;}))*14));
  var limit=f.maximum||100,step=limit/5;
  for(var v=0;v<=limit+step/10;v+=step)out+=line(left+v/limit*(right-left),top,left+v/limit*(right-left),bottom,'#e0e8ec')+txt(left+v/limit*(right-left),bottom+24,label(v));
  var band=(bottom-top)/f.values.length,bh=Math.min(45,band*.55);
  f.values.forEach(function(row,i){var x=left,y=top+(i+.25)*band;out+=txt(left-12,y+bh/2+5,f.labels[i],'end',14);row.forEach(function(v,j){var width=v/limit*(right-left);out+='<rect x="'+num(x)+'" y="'+num(y)+'" width="'+num(width)+'" height="'+num(bh)+'" fill="'+colors[j%4]+'"/>';if(width>38)out+=txt(x+width/2,y+bh/2+5,label(v),null,14,'white');x+=width;});});
  out+=txt(350,391,f.xLabel||'%',null,14);
 }else{
  var axis=nice(f.maximum,Math.min(0,...f.values.flat())),max=axis.max;
  function barY(v){return bottom-(v-axis.min)/(max-axis.min)*(bottom-top);}
  for(var value=axis.min;value<=max+axis.step/10;value+=axis.step){var y=barY(value);out+=line(left,y,right,y,value===0?'#597785':'#e0e8ec')+txt(left-12,y+4,label(value),'end',14);}
  var group=(right-left)/f.labels.length,bw=group/(f.categories.length+1.5);
  f.values.forEach(function(row,i){row.forEach(function(v,j){var h=Math.abs(barY(v)-barY(0)),x=left+i*group+(j+.4)*bw;out+='<rect x="'+num(x)+'" y="'+num(Math.min(barY(v),barY(0)))+'" width="'+num(bw*.82)+'" height="'+num(h)+'" fill="'+colors[j%4]+'"/>';});out+=txt(left+(i+.5)*group,bottom+27,f.labels[i],null,14);});
  out+=txt(left,44,f.yLabel,'start',14);
 }
 return out+legend(f.categories.map(function(name){return{name:name};}));
}
function map(f){
 var b=f.bounds,left=70,right=640,top=28,bottom=396,spanX=b[2]-b[0],spanY=b[3]-b[1],scale=Math.min((right-left)/spanX,(bottom-top)/spanY),cx=(left+right)/2,cy=(top+bottom)/2;
 function xy(p){return[cx+(p[0]-(b[0]+b[2])/2)*scale,cy- (p[1]-(b[1]+b[3])/2)*scale];}
 var out='';f.regions.forEach(function(region){var path=region.polygons.map(function(poly){return poly.map(function(ring){return ring.map(function(p,i){var v=xy(p);return(i?'L':'M')+num(v[0])+','+num(v[1]);}).join(' ')+'Z';}).join(' ');}).join(' ');out+='<path d="'+path+'" fill="#e6eff1" fill-rule="evenodd" stroke="#7d9ba8" stroke-width=".7"/>';});
 f.regions.forEach(function(region){if(!region.letter)return;var p=xy(region.label);out+=dot(p[0],p[1],9,'#096b83')+txt(p[0],p[1]+5,region.letter,null,12,'#143542');});
 return out+txt(350,425,'북쪽 ↑ · 국가 경계: Natural Earth',null,13);
}

function gridMap(f){
 var out=txt(350,30,f.name||'가상 지역',null,16),v=f.values||[10,20,30,40,50,60],max=Math.max.apply(null,v);
 var palette=f.breaks?['#dbe9ed','#86baca','#397d96']:['#dbe9ed','#a8d0da','#69a9bd','#397d96'];
 v.forEach(function(x,i){var px=110+i%3*160,py=70+Math.floor(i/3)*140,grade=f.breaks?f.breaks.filter(function(limit){return x>limit;}).length:Math.min(3,Math.floor(x/max*3));out+='<rect x="'+px+'" y="'+py+'" width="155" height="135" fill="'+palette[grade]+'" stroke="white"/>'+txt(px+77,py+55,'ABCDEF'[i],null,20)+txt(px+77,py+90,x,null,17);});return out+txt(350,418,'가상 지역 · 북쪽 ↑',null,14);
}
function statMap(f){
 var v=[10,20,30,40,50,60],out='',mode=f.mode;
 if(mode===0)return gridMap({values:v,breaks:[20,40],name:'가상 지역의 비율(%) · 0~20 / 21~40 / 41~60'});
 if(mode===5){var x=90;v.forEach(function(n,i){var w=n/210*520;out+='<rect x="'+num(x)+'" y="120" width="'+num(w)+'" height="220" fill="'+colors[i%4]+'" stroke="white"/>'+txt(x+w/2,225,'ABCDEF'[i],null,16,'white');x+=w;});return out+txt(350,395,'직사각형 면적=양 · 실제 국토 면적이 아님',null,14);}
 for(var i=0;i<6;i++){
  var x=110+i%3*160,y=60+Math.floor(i/3)*145;out+='<rect x="'+x+'" y="'+y+'" width="155" height="140" fill="#edf4f6" stroke="#8aa7b2"/>'+txt(x+25,y+25,'ABCDEF'[i],null,15);
  if(mode===1)for(var k=0;k<i+1;k++)out+=dot(x+43+(k%3)*30,y+55+Math.floor(k/3)*35,4,'#096b83');
  if(mode===3)out+=dot(x+80,y+82,Math.sqrt(v[i])*6,'#397d96');
 }
 if(mode===2){[[190,125,510,125,8],[510,270,190,270,16],[350,125,350,270,5]].forEach(function(e){out+=line(e[0],e[1],e[2],e[3],'#096b83',e[4]);var angle=Math.atan2(e[3]-e[1],e[2]-e[0]),a=[e[2]-22*Math.cos(angle)+15*Math.sin(angle),e[3]-22*Math.sin(angle)-15*Math.cos(angle)],b=[e[2]-22*Math.cos(angle)-15*Math.sin(angle),e[3]-22*Math.sin(angle)+15*Math.cos(angle)];out+='<polygon points="'+e[2]+','+e[3]+' '+num(a[0])+','+num(a[1])+' '+num(b[0])+','+num(b[1])+'" fill="#096b83"/>';});}
 if(mode===4){[60,110,160].forEach(function(w,j){out+='<ellipse cx="350" cy="205" rx="'+(w*1.4)+'" ry="'+w*.75+'" fill="none" stroke="#096b83" stroke-width="3"/>'+txt(350+w*1.4,205,(j+1)*100,null,14);});}
 return out+txt(350,410,['','점 1개=10 단위','선 굵기=이동량 · 화살표=방향','원 면적=양 · 10 / 20 / 30 / 40 / 50 / 60','선 위의 모든 점은 같은 값'][mode],null,14);
}
function valueMap(f){
 var b=f.bounds,scale=Math.min(570/(b[2]-b[0]),360/(b[3]-b[1])),xy=function(p){return[350+(p[0]-(b[0]+b[2])/2)*scale,210-(p[1]-(b[1]+b[3])/2)*scale];},out=txt(350,22,f.name,null,16);
 f.regions.forEach(function(e){var path=e.polygons.map(function(poly){return poly.map(function(ring){return ring.map(function(p,i){var c=xy(p);return(i?'L':'M')+num(c[0])+','+num(c[1]);}).join(' ')+'Z';}).join(' ');}).join(' '),fill=f.mode==='gdp'?'#edf3f5':e.value<42?'#dbe9ed':e.value<50?'#86baca':'#397d96';out+='<path d="'+path+'" fill="'+fill+'" fill-rule="evenodd" stroke="#7d9ba8" stroke-width=".7"/>';});
 f.regions.forEach(function(e){var p=xy(e.label);if(f.mode==='gdp')out+=dot(p[0],p[1],Math.sqrt(e.value)*.7,'#397d96') ;out+=txt(p[0],p[1]+5,e.name,null,13,f.mode==='gdp'?'white':'#143542');});
 return '<defs><clipPath id="value-map-frame"><rect x="60" y="35" width="580" height="355"/></clipPath></defs><g clip-path="url(#value-map-frame)">'+out+'</g>'+txt(350,22,f.name,null,16)+txt(350,418,f.mode==='gdp'?'원 면적 ∝ GDP(십억 달러)':'1인당 GDP(천 달러) · 밝음 <42 / 중간 42~<50 / 어두움 ≥50',null,13);
}
function facilityMap(){
 var out='';[[60,65,'본국'],[410,65,'해외 시장 1'],[410,245,'해외 시장 2']].forEach(function(a){out+='<rect x="'+a[0]+'" y="'+a[1]+'" width="225" height="130" rx="30" fill="#edf4f6" stroke="#7d9ba8"/>'+txt(a[0]+112,a[1]+25,a[2],null,15);});
 out+=txt(120,135,'★',null,28)+txt(210,135,'△',null,28)+txt(475,135,'△',null,28)+txt(570,135,'□',null,28)+txt(515,325,'□',null,28);
 out+=line(260,150,425,150,'#7d9ba8',2,'6 5')+line(250,170,450,290,'#7d9ba8',2,'6 5');return out+txt(350,410,'★ 본사 · △ 전문 인력·대학 주변 · □ 해외 시장·물류 거점',null,13);
}
function render(f){
 var title=(f.xLabel||f.labels?.join(' · ')||'자료')+' / '+(f.yLabel||f.kind),body;
 if(f.kind==='stat-map')body=statMap(f);
 else if(f.kind==='grid-map')body=gridMap(f);
 else if(f.kind==='value-map')body=valueMap(f);
 else if(f.kind==='facility-map')body=facilityMap();
 else if(f.kind==='symbol'){
  body='';if(f.symbol==='wheel'){body+='<circle cx="350" cy="220" r="135" fill="none" stroke="#304652" stroke-width="15"/><circle cx="350" cy="220" r="25" fill="#304652"/>';for(var j=0;j<8;j++){var a=j*Math.PI/4;body+=line(350,220,350+145*Math.cos(a),220+145*Math.sin(a),'#304652',12);}}
  else if(f.symbol==='crescent')body='<circle cx="330" cy="220" r="135" fill="#304652"/><circle cx="385" cy="185" r="120" fill="white"/>'+txt(487,210,'★',null,80,'#304652');
  else if(f.symbol==='cross')body='<rect x="325" y="60" width="50" height="320" fill="#304652"/><rect x="230" y="150" width="240" height="50" fill="#304652"/>';
  else throw Error('Unknown symbol');
 }else if(f.kind==='anticline'){
  body='<defs><clipPath id="reservoir"><path d="M100 300 Q350 -60 600 300 L600 360 L100 360Z"/></clipPath></defs><rect x="50" y="35" width="600" height="350" fill="#f3eee4"/><g clip-path="url(#reservoir)"><rect x="90" y="80" width="520" height="100" fill="#ead78f"/><rect x="90" y="180" width="520" height="60" fill="#a59170"/><rect x="90" y="240" width="520" height="130" fill="#b6dce7"/></g><path d="M100 285 Q350 -75 600 285" fill="none" stroke="#6c655c" stroke-width="20"/>'+txt(350,151,f.labels[0],null,20)+txt(350,217,f.labels[1],null,20)+txt(350,300,f.labels[2],null,20)+txt(350,414,'배사 트랩 모식도 · 위쪽=얕음',null,14);
 }else if(f.kind==='meander'){
  body='<g transform="rotate('+num(f.rotation)+' 250 220)"><path d="M250 80 A140 140 0 0 1 250 360 L250 300 A80 80 0 0 0 250 140Z" fill="#c9e5ef" stroke="#597785" stroke-width="2"/>'+dot(395,220,5,'#b14622')+'<g transform="rotate('+num(-f.rotation)+' 422 220)">'+txt(422,225,f.outer,null,18)+'</g>'+dot(325,220,5,'#096b83')+'<g transform="rotate('+num(-f.rotation)+' 303 220)">'+txt(303,225,f.inner,null,18)+'</g>'+line(360,200,360,240,'#304652',3)+'<polygon points="353,230 360,245 367,230" fill="#304652"/></g>'+txt(550,75,'하천 종단면 모식도',null,14)+line(465,185,665,185,'#597785')+line(465,90,465,185,'#597785')+'<polyline points="470,95 500,125 550,150 600,165 660,177" fill="none" stroke="#096b83" stroke-width="3"/>'+txt(475,210,'상류',null,14)+txt(650,210,'하류',null,14)+txt(350,420,'굽은 바깥쪽·안쪽을 기준으로 판정',null,14);
 }else if(f.kind==='pyramid'){
  var cx=350,left=70,right=650,top=60,bottom=355,N=f.ages.length,step=(bottom-top)/N,max=Math.max.apply(null,f.male.concat(f.female)),bound=nice(max,0).max,scale=265/bound;body=txt(350,22,f.name||'인구 피라미드',null,16)+txt(200,43,'남성',null,14)+txt(500,43,'여성',null,14);
  f.ages.forEach(function(age,i){var y=bottom-(i+1)*step,h=step*.8;body+='<rect x="'+num(cx-f.male[i]*scale)+'" y="'+num(y)+'" width="'+num(f.male[i]*scale)+'" height="'+num(h)+'" fill="#096b83"/><rect x="350" y="'+num(y)+'" width="'+num(f.female[i]*scale)+'" height="'+num(h)+'" fill="#b14622"/>'+txt(left-5,y+h/2+4,age.replace('세 이상','+').replace('세',''),'end',12);});
  for(var k=0;k<=4;k++){var x=bound*k/4;body+=line(cx-x*scale,top,cx-x*scale,bottom,'#c9d8de',.6)+line(cx+x*scale,top,cx+x*scale,bottom,'#c9d8de',.6)+txt(cx-x*scale,bottom+24,label(x))+ (k?txt(cx+x*scale,bottom+24,label(x)):'');}
  body+=txt(350,418,f.xLabel,null,14);
 }else if(f.kind==='area'){
  var total=f.entries.reduce(function(s,e){return s+e.value;},0),p=f.entries.map(function(e){return e.value/total;}),group=p[0]+p[1],x0=70,y0=55,W=580,HH=315,xm=x0+W*group,rects=[[x0,y0,W*group,HH*p[0]/group],[x0,y0+HH*p[0]/group,W*group,HH*p[1]/group],[xm,y0,W*(1-group),HH*p[2]/(1-group)],[xm,y0+HH*p[2]/(1-group),W*(1-group),HH*p[3]/(1-group)]];body=txt(350,24,f.name||'면적 자료',null,16);
  f.entries.forEach(function(e,i){var b=rects[i];body+='<rect x="'+num(b[0])+'" y="'+num(b[1])+'" width="'+num(b[2])+'" height="'+num(b[3])+'" fill="'+colors[i]+'" stroke="white" stroke-width="2"/>';if(b[2]>80&&b[3]>35)body+=txt(b[0]+b[2]/2,b[1]+b[3]/2,e.name+' '+label(p[i]*100)+'%',null,14,'white');});body+=txt(350,415,f.caption||'조각의 면적=구성비',null,14);
 }else if(f.kind==='decision-tree'){
  var pos=[[350,55],[120,190],[500,190],[365,330],[610,330]];body='';
  f.edges.forEach(function(e){var a=pos[e[0]],b=pos[e[1]];body+=line(a[0],a[1]+20,b[0],b[1]-24,'#597785',2)+txt((a[0]+b[0])/2,(a[1]+b[1])/2-7,e[2],null,14);});
  f.nodes.forEach(function(n,i){var p=pos[i],w=i===0||i===2?180:90;body+='<rect x="'+(p[0]-w/2)+'" y="'+(p[1]-22)+'" width="'+w+'" height="44" rx="10" fill="#edf5f7" stroke="#597785"/>'+txt(p[0],p[1]+5,n,null,14);});
 }else if(f.kind==='image'||f.kind==='image-regions'){
  if(!/^assets\/goal-figures\/[a-z0-9-]+\.(?:webp|png)$/.test(f.src))throw Error('Unsafe local figure path');
  body='<image href="'+esc(f.src)+'" x="12" y="35" width="676" height="380" preserveAspectRatio="xMidYMid meet"/>'+txt(350,23,f.name||'제시 그림',null,14);
  if(f.kind==='image-regions'){var scale=Math.min(676/f.width,380/f.height),w=f.width*scale,h=f.height*scale,ox=12+(676-w)/2,oy=35+(380-h)/2;f.regions.forEach(function(m){var x=ox+m.x*w,y=oy+m.y*h;body+='<g role="button" tabindex="0" data-material-option="'+m.option+'" aria-label="'+esc(m.letter)+' 영역 선택" style="cursor:pointer">'+dot(x,y,16,'#096b83')+txt(x,y+5,m.letter,null,16)+'<circle cx="'+num(x)+'" cy="'+num(y)+'" r="24" fill="transparent"/></g>';});}
 }else if(['line','bars','scatter'].includes(f.kind))body=cartesian(f);
  else if(f.kind==='radar')body=radar(f);else if(f.kind==='ternary')body=triangle(f);else if(f.kind==='profile')body=profile(f);else if(f.kind==='three-axis')body=axes3(f);else if(f.kind==='map')body=map(f);else if(f.kind==='stacked'||f.kind==='grouped-bars')body=energyBars(f);else throw Error('Unknown chart '+f.kind);
 return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 440" font-family="Noto Sans KR, sans-serif" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title><rect width="700" height="440" fill="#fff"/>'+body+'</svg>';
}
return{render:render,nice:nice};
});
