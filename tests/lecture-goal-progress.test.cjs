const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),goals=JSON.parse(fs.readFileSync(root+'/data/lecture-gap-goals.json','utf8')),progress=JSON.parse(fs.readFileSync(root+'/audit/lecture-goals/progress.json','utf8'));
test('goal status never closes a group with an unverified child',()=>{
 const M=require('../assets/materials-engine').create(require('../assets/materials-data'));
 assert.equal(goals.length,573);assert.equal(new Set(goals.map(g=>g.id)).size,573);assert.equal(progress.groups.length,139);
 for(const group of progress.groups){const children=goals.filter(g=>g.group===group.id);assert.equal(group.status==='완료',children.every(g=>g.status==='검증'),group.id);}
 for(const g of goals){const p=progress.items.find(x=>x.id===g.id);assert.ok(p);assert.equal(g.status,p.status);if(g.status!=='미구현')assert.ok(p.evidence.length,g.id);}
 for(const id of ['G020-2','G061-3','G086-1']){const c=require('../data/goal-completion-review-20261026.json').items.find(x=>x.id===id);assert.equal(c.verdict,'criteria-pass');assert.ok(c.initialRemaining&&c.evidence.length>=3);assert.equal(goals.find(g=>g.id===id).status,'검증');}
 for(const id of ['G005-1','G038-1'])assert.equal(goals.find(g=>g.id===id).status,'검증');
 const v=require('../data/goal-verification.json');
 for(const g of goals.filter(g=>g.venue==='OX'))if(g.status==='검증'||g.status==='보류'){assert.ok(v.verifiedGoals.includes(g.id));assert.ok(v.reviews?.[g.id]?.criteria&&v.reviews[g.id].evidence.length,g.id+' needs individual content review');}else assert.equal(g.status,'구현');

 // Goals reachable only through paused families are held, and their groups stay open.
 for(const g of goals.filter(g=>g.status==='검증')){const p=progress.items.find(x=>x.id===g.id);assert.ok(p.evidence.some(e=>e.venue!=='자료형·계산(보류)'),g.id);}
 for(const g of goals.filter(g=>g.status==='보류'))assert.notEqual(progress.groups.find(x=>x.id===g.group).status,'완료',g.id);
});
