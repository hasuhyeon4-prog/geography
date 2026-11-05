'use strict';
// 기후 칠하기 (2026-11-05): the learner paints climate types on a world map and the page grades each 0.5° cell.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const grid=require('../assets/climate-grid.js'),M=require('../assets/climate-paint.js'),G=M.create(grid);
const at=(lon,lat)=>{const i=G.cellAt(lon,lat);assert(i>=0&&G.koppen[i],lon+','+lat);return i;};
const code=(lon,lat)=>G.types[G.ref[at(lon,lat)]-1].code;
const T=id=>G.INDEX[id];

test('the grid is the 0.5° Beck et al. 1991–2020 map with its sources recorded',()=>{
 assert.equal(grid.rows,360);assert.equal(grid.cols,720);assert.equal(grid.cell,0.5);
 assert.match(grid.source,/Beck et al\. \(2023\).*CC BY 4\.0/);assert.match(grid.sourceSha256,/^[0-9a-f]{64}$/);assert.match(grid.elevationSha256,/^[0-9a-f]{64}$/);
 let land=0;for(const v of G.koppen)if(v)land++;assert.equal(land,95447);
});

test('reference types at the places the lecture and the learner use',()=>{
 const want={'리마':[-77.04,-12.05,'BW'],'브라질리아':[-47.9,-15.8,'Aw'],'헤시피':[-34.9,-8.05,'Am'],'사우바도르':[-38.5,-12.97,'Af'],
  '부에노스아이레스':[-58.4,-34.6,'Cfa'],'덴버':[-104.99,39.74,'BS'],'키토':[-78.5,-0.2,'H'],'보고타':[-74.1,4.7,'H'],'아디스아바바':[38.75,9.0,'H'],
  '라싸':[91.1,29.65,'H'],'마나우스':[-60,-3.1,'Af'],'다르에스살람':[39.28,-6.8,'Aw'],'상파울루':[-46.63,-23.55,'Cfa'],'모스크바':[37.6,55.75,'Df'],
  '런던':[-0.12,51.5,'Cfb'],'퍼스':[115.86,-31.95,'Cs'],'그린란드 내륙':[-40,72,'EF'],'사하라':[10,23,'BW']};
 for(const [n,[lo,la,c]] of Object.entries(want))assert.equal(code(lo,la),c,n);
});

test('H is right only on high ground: never on the Brazilian plateau, the NE coast or Denver',()=>{
 assert.equal(G.accepts(at(-47.9,-15.8),T('h')),false,'브라질리아 ~1,000 m');
 assert.equal(G.accepts(at(-34.9,-8.05),T('h')),false,'브라질 북동부 해안');
 assert.equal(G.accepts(at(-104.99,39.74),T('h')),false,'덴버 1,700 m outside the tropics');
 assert.equal(G.accepts(at(36.82,-1.29),T('h')),true,'나이로비: tropical 1,500 m+ also accepted');
 assert.equal(G.accepts(at(-78.5,-0.2),T('h')),true,'키토');
 assert.equal(G.accepts(at(-78.5,-0.2),T('et')),true,'the Köppen type is also right in the highland');
 assert.equal(G.accepts(at(-40,72),T('h')),false,'ice sheets stay EF');
});

test('grading: painting the reference is all right, the H mistake is wrong, misses of the chosen type count',()=>{
 const box=G.scopes.find(s=>s.id==='samerica').box,N=G.rows*G.cols;
 let paint=new Uint8Array(N);for(let i=0;i<N;i++)if(G.inScope(i,box))paint[i]=G.ref[i];
 let r=G.grade(paint,box,T('aw'));assert.equal(r.rightPct,100);assert.equal(r.coveredPct,100);assert.equal(r.focusMissedPct,0);
 paint=new Uint8Array(N);
 for(let lat=-20;lat<=-12;lat+=0.5)for(let lon=-52;lon<=-44;lon+=0.5)paint[G.cellAt(lon,lat)]=T('h');
 r=G.grade(paint,box,T('aw'));assert(r.wrongPct>90,'plateau painted as H is wrong');assert(r.focusMissedPct>80,'Aw left unpainted is missed');
 const i=at(-47.9,-15.8),lines=G.explain(i,T('h')).join(' ');
 assert.match(lines,/정답: 사바나\(Aw\)/);assert.match(lines,/고산 기후 고지\(대략 2,000m 이상, 열대는 1,500m 이상\)가 아니다/);
 // One cell off a boundary counts, but is shown separately.
 paint=new Uint8Array(N);const lima=at(-77.04,-12.05);paint[lima+1]=T('bw');r=G.grade(paint,box,0);assert(r.status[lima+1]===1||r.status[lima+1]===2);
});

test('the page links from every practice page and loads the grid, grader and borders',()=>{
 const root=path.join(__dirname,'..');
 for(const f of ['index.html','classify.html','rankings.html','facts.html','concepts.html','exam.html','materials.html'])
  assert.match(fs.readFileSync(path.join(root,f),'utf8'),/<a href="climate-map\.html">기후 칠하기<\/a>/,f);
 const html=fs.readFileSync(path.join(root,'climate-map.html'),'utf8');
 for(const s of ['assets/country-boundaries.js','assets/climate-grid.js','assets/climate-paint.js'])assert(html.includes(s),s);
});
