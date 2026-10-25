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
 var minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),xBounds=f.kind==='scatter'?nice(maxX,minX):{min:minX,max:maxX===minX?maxX+1:maxX};
 var minY=Math.min.apply(null,values),maxY=Math.max.apply(null,values);
 if(f.zero||f.kind==='bars')minY=Math.min(0,minY);
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
  f.points.forEach(function(p,i){out+=dot(X(p.x),Y(p.y),p.size>1?Math.sqrt(p.size)*3:6,colors[i%4])+txt(X(p.x)+10,Y(p.y)-10,p.name,'start',14,colors[i%4]);});
 }else if(f.kind==='bars'){
  var bw=(right-left)/(f.labels.length*1.7),bx=function(i){return left+(i+.5)*(right-left)/f.labels.length;};
  f.values.forEach(function(v,i){out+='<rect x="'+num(bx(i)-bw/2)+'" y="'+num(Y(Math.max(v,0)))+'" width="'+num(bw)+'" height="'+num(Math.abs(Y(v)-Y(0)))+'" fill="'+colors[i%4]+'"/>'+txt(bx(i),Y(v)-8,label(v),'middle',12)+txt(bx(i),bottom+24,f.labels[i],'middle',13);});
 }else{
  f.x.forEach(function(x){out+=txt(X(x),bottom+22,x,'middle',12);});
  f.series.forEach(function(s,i){out+='<polyline points="'+s.values.map(function(y,j){return num(X(f.x[j]))+','+num(Y(y));}).join(' ')+'" fill="none" stroke="'+colors[i%4]+'" stroke-width="2.3"'+(dash[i%4]?' stroke-dasharray="'+dash[i%4]+'"':'')+'/>';s.values.forEach(function(y,j){out+=dot(X(f.x[j]),Y(y),2.5,colors[i%4]);});});
  out+=legend(f.series);
 }
 out+=txt((left+right)/2,393,f.xLabel||'',null,14)+txt(left,18,f.yLabel||'','start',14);return out;
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
  for(var v=0;v<=100;v+=20)out+=line(left+v/100*(right-left),top,left+v/100*(right-left),bottom,'#e0e8ec')+txt(left+v/100*(right-left),bottom+24,v);
  f.values.forEach(function(row,i){var x=left,y=96+i*125;out+=txt(left-12,y+25,f.labels[i],'end',14);row.forEach(function(v,j){var width=v/100*(right-left);out+='<rect x="'+num(x)+'" y="'+num(y)+'" width="'+num(width)+'" height="45" fill="'+colors[j%4]+'"/>';if(width>38)out+=txt(x+width/2,y+27,label(v),null,14,'white');x+=width;});});
  out+=txt(350,391,f.xLabel||'%',null,14);
 }else{
  var axis=nice(f.maximum,0),max=axis.max;
  for(var value=0;value<=max+axis.step/10;value+=axis.step){var y=bottom-value/max*(bottom-top);out+=line(left,y,right,y,'#e0e8ec')+txt(left-12,y+4,label(value),'end',14);}
  var group=(right-left)/f.labels.length,bw=group/(f.categories.length+1.5);
  f.values.forEach(function(row,i){row.forEach(function(v,j){var h=v/max*(bottom-top),x=left+i*group+(j+.4)*bw;out+='<rect x="'+num(x)+'" y="'+num(bottom-h)+'" width="'+num(bw*.82)+'" height="'+num(h)+'" fill="'+colors[j%4]+'"/>';});out+=txt(left+(i+.5)*group,bottom+27,f.labels[i],null,14);});
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
function render(f){
 var title=(f.xLabel||f.labels?.join(' · ')||'자료')+' / '+(f.yLabel||f.kind),body;
 if(['line','bars','scatter'].includes(f.kind))body=cartesian(f);
  else if(f.kind==='radar')body=radar(f);else if(f.kind==='ternary')body=triangle(f);else if(f.kind==='profile')body=profile(f);else if(f.kind==='three-axis')body=axes3(f);else if(f.kind==='map')body=map(f);else if(f.kind==='stacked'||f.kind==='grouped-bars')body=energyBars(f);else throw Error('Unknown chart '+f.kind);
 return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 440" font-family="Noto Sans KR, sans-serif" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title><rect width="700" height="440" fill="#fff"/>'+body+'</svg>';
}
return{render:render,nice:nice};
});
