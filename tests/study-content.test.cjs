const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const contentFix=require('../assets/study-content.js');
const grading=require('../assets/location-grading.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function data(id){return JSON.parse(html.match(new RegExp('<script id="'+id+'" type="application/json">(.*?)</script>','s'))[1])}
const content=data('contentData'),geometry=data('geometryData');
function items(){
  const list=data('auditData').filter(it=>!['국가 관계','지명 → 국가·도시'].includes(it.section)).concat(content.items);
  for(const it of list){it.geometry=geometry.items[it.id]||it.geometry;Object.assign(it,content.updates[it.id]||{})}
  return list;
}
test('comparison repair preserves identities and resolves every comparison target',()=>{
  const list=items(),ids=list.map(it=>it.id);contentFix.apply(list);
  assert.deepEqual(list.map(it=>it.id),ids);
  const byId=new Map(list.map(it=>[it.id,it]));
  for(const it of list)for(const id of it.compareIds||[]){assert.ok(byId.has(id),it.name);assert.notEqual(id,it.id)}
  assert.ok(list.find(it=>it.name==='필바라').compareIds.includes(list.find(it=>it.name==='퍼스').id));
  assert.ok(list.find(it=>it.name==='카카두 국립공원').compareIds.includes(list.find(it=>it.name==='울루루-카타추타 국립공원').id));
});
test('prairie and subcontinent extents cover distinct locations, with schematic grading',()=>{
  const list=items();contentFix.apply(list);
  for(const [name,inside,outside] of [
    ['프레리',[[-106.7,52.1],[-97.3,37.7]],[[-123.1,49.3],[-74,40.7]]],
    ['인도 아대륙',[[77.2,28.6],[74.3,31.5],[90.4,23.8]],[[116.4,39.9],[85,34]]]
  ]){
    const it=list.find(it=>it.name===name),poly=[[it.geometry.pts]];
    for(const [lon,lat] of inside)assert.ok(grading.inPolygons({lon,lat},poly),`${name}: ${lon},${lat}`);
    for(const [lon,lat] of outside)assert.ok(!grading.inPolygons({lon,lat},poly),`${name}: ${lon},${lat}`);
    assert.equal(grading.grade(it,{lon:inside[0][0],lat:inside[0][1]}).status,'uncertain');
    assert.match(it.extentNote,/개략/);
  }
});
test('Hong Kong and park comparisons contain the actual distinction',()=>{
  const list=items();contentFix.apply(list);
  const find=name=>list.find(it=>it.name===name);
  assert.match(find('홍콩').memo,/강수량.*적다/);
  assert.match(find('홍콩').memo,/남반구.*반대/);
  assert.match(find('카카두 국립공원').memo,/습지.*사막/);
  assert.ok(find('울루루-카타추타 국립공원').aliases.includes('울루루'));
});
