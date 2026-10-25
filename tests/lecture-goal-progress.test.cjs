const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),goals=JSON.parse(fs.readFileSync(root+'/data/lecture-gap-goals.json','utf8')),progress=JSON.parse(fs.readFileSync(root+'/audit/lecture-goals/progress.json','utf8'));
test('goal status never closes a group with an unverified child',()=>{
 assert.equal(goals.length,573);assert.equal(new Set(goals.map(g=>g.id)).size,573);assert.equal(progress.groups.length,139);
 for(const group of progress.groups){const children=goals.filter(g=>g.group===group.id);assert.equal(group.status==='완료',children.every(g=>g.status==='검증'),group.id);}
 for(const g of goals){const p=progress.items.find(x=>x.id===g.id);assert.ok(p);assert.equal(g.status,p.status);if(g.status!=='미구현')assert.ok(p.evidence.length,g.id);}
 for(const id of ['G005-1','G020-2','G038-1','G061-3','G086-1']){assert.notEqual(goals.find(g=>g.id===id).status,'검증');assert.ok(progress.items.find(g=>g.id===id).remaining);}
 for(const g of goals.filter(g=>g.venue==='OX'))assert.equal(g.status,'구현','representative pair is not proof that every clause was practised');
});
