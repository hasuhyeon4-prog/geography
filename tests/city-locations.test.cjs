const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const siting=require('../assets/city-locations.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function jsonScript(id){return JSON.parse(html.match(new RegExp('<script id="'+id+'" type="application/json">(.*?)</script>','s'))[1]);}
const raw=jsonScript('auditData'),content=jsonScript('contentData');
const cities=raw.filter(it=>it.section==='도시 103').concat(content.items.filter(it=>it.topic==='city'));

test('every current city, including climate references, has exactly one valid siting entry',()=>{
  assert.equal(cities.length,191);
  assert.deepEqual(Object.keys(siting.byName).sort(),cities.map(it=>it.name).sort());
  for(const it of cities){
    const place=siting.byName[it.name];
    assert.ok(siting.labels[place.kind],it.name);
    assert.ok(place.detail.trim(),it.name);
    assert.ok(siting.sources[place.source],`${it.name}: ${place.source}`);
  }
});

test('Barcelona and the other Mediterranean coastal cities name their sea',()=>{
  for(const name of ['바르셀로나','망통','마르세유','발렌시아','제노바','알렉산드리아','베네치아','메시나']){
    assert.equal(siting.byName[name].kind,'coast',name);
    assert.match(siting.byName[name].detail,/지중해/,name);
  }
  assert.match(siting.byName['베네치아'].detail,/아드리아해/);
});

test('navigable inland river ports do not get a seaside label',()=>{
  for(const name of ['런던','함부르크','바젤','뒤스부르크','글래스고','콜카타','양곤','세비야','포틀랜드','필라델피아','몬트리올','뉴올리언스']){
    assert.equal(siting.byName[name].kind,'inland',name);
    assert.match(siting.byName[name].detail,/강/,name);
  }
});

test('freshwater lakes, the Caspian basin, and inland cities near lakes stay distinct',()=>{
  for(const name of ['시카고','토론토','제네바','로토루아','타우포'])assert.equal(siting.byName[name].kind,'lake',name);
  assert.equal(siting.byName['람사르'].kind,'closedSea');
  assert.match(siting.byName['람사르'].detail,/폐쇄성 내륙 호수/);
  assert.equal(siting.byName['이르쿠츠크'].kind,'inland');
  assert.match(siting.byName['이르쿠츠크'].detail,/바이칼호에서.*떨어져/);
});

test('coastal urban regions explicitly distinguish the inland centre',()=>{
  for(const [name,place] of Object.entries(siting.byName))if(place.kind==='coastalRegion'){
    assert.match(place.detail,/도심은.*내륙/,name);
    assert.match(place.detail,/연안|해안/,name);
  }
  for(const name of ['로마','아테네','방콕','호찌민','상하이','로스앤젤레스','휴스턴'])assert.equal(siting.byName[name].kind,'coastalRegion',name);
});

test('nearby coasts and offshore seas are not assigned to inland cities',()=>{
  for(const name of ['메카','메디나','서울','부뇰','쿠알라룸푸르','로차','상파울루','욕야카르타','삿포로'])assert.equal(siting.byName[name].kind,'inland',name);
  assert.match(siting.byName['케이프타운'].detail,/대서양/);
  assert.match(siting.byName['더반'].detail,/인도양/);
});
