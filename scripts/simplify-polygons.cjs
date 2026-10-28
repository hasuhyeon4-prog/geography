/* Douglas-Peucker simplification for materials maps, which draw a whole country or the world in a phone-width figure. */
'use strict';
function line(ring,tol){
 const keep=new Uint8Array(ring.length);keep[0]=keep[ring.length-1]=1;const stack=[[0,ring.length-1]];
 while(stack.length){
  const [a,b]=stack.pop(),[x1,y1]=ring[a],[x2,y2]=ring[b],dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);let far=-1,max=tol;
  for(let i=a+1;i<b;i++){const [x,y]=ring[i],d=len?Math.abs(dy*x-dx*y+x2*y1-y2*x1)/len:Math.hypot(x-x1,y-y1);if(d>max){max=d;far=i;}}
  if(far>0){keep[far]=1;stack.push([a,far],[far,b]);}
 }
 return ring.filter((_,i)=>keep[i]);
}
const round=(p,d)=>p.map(v=>+v.toFixed(d));
// tol in degrees; rings that collapse below a triangle are dropped, but each polygon keeps its outer ring.
function simplify(polygons,tol,digits){
 return polygons.map(poly=>poly.map((ring,i)=>{const r=line(ring,tol).map(p=>round(p,digits));return r.length>=4||i===0&&r.length>=3?r:null}).filter(Boolean)).filter(poly=>poly.length&&poly[0].length>=3);
}
function extent(polygons){let a=Infinity,b=-Infinity,c=Infinity,d=-Infinity;for(const p of polygons)for(const [x,y] of p[0]){a=Math.min(a,x);b=Math.max(b,x);c=Math.min(c,y);d=Math.max(d,y);}return Math.max(b-a,d-c);}
// A country map is about 600 px across; keep detail to about a fifth of a pixel.
// Islands narrower than about a pixel are dropped, but a shape never loses its largest part.
function drop(polygons,min){const big=polygons.filter(p=>extent([p])>=min);return big.length?big:polygons.slice().sort((a,b)=>extent([b])-extent([a])).slice(0,1);}
const country=polygons=>{const e=extent(polygons);return simplify(drop(polygons,e/600),e/3000,3);};
const world=polygons=>simplify(drop(polygons,0.4),0.05,2);
module.exports={simplify,country,world};
