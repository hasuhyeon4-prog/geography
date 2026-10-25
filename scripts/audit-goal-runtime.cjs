'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const D=require('../assets/materials-data.js'),M=require('../assets/materials-engine.js').create(D),K=require('../assets/entity-kb.js'),T=require('../assets/exam-themes.js'),E=require('../assets/exam-engine.js').create(K,T),G=require('../assets/goal-tables.js').create(require('../assets/goal-tables-data.js'));
const seen={},samples={};let built=0;
for(const f of M.families)for(let seed=1;seed<=160;seed++){
 const q=M.build(f.id,seed);built++;
 for(const s of q.statements){const key=s.goal,row=seen[key]||(seen[key]={true:0,false:0,families:[]});row[s.truth]++;if(!row.families.includes(f.id))row.families.push(f.id);if(!samples[key])samples[key]={family:f.id,seed,text:s.text,check:s.check};}
}
let oldBuilt=0;const oldSeen={},oldProofs=[];
for(const themeId of ['country-economy','country-population','country-urban-reverse','country-clues'])for(let seed=1;seed<=240;seed++){
 const q=E.build({themeId,seed});if(!q)continue;oldBuilt++;
 for(const s of q.stage2.statements){const key=s.goalId||(['capricorn','arcticCircle','cancer'].includes(s.check?.line)?'G001-2':null);if(!key)continue;const row=oldSeen[key]||(oldSeen[key]={true:0,false:0});row[s.truth]++;if(!oldProofs.some(p=>p.goal===key&&p.truth===s.truth))oldProofs.push({themeId,seed,goal:key,truth:s.truth,text:s.text,check:s.check});}
}
const result={generatedAt:'2026-10-25',materialQuestions:built,materialGoals:seen,firstMaterialProof:samples,existingExamQuestions:oldBuilt,existingExamGoals:oldSeen,existingExamProofs:oldProofs,aliases:{'G135-3':'G062-2'},goalTableQuestions:{forward:G.inventory('what','all').length,reverse:G.inventory('which','all').length},scope:'생성·계산 증거이다. OX 목표의 모든 의미상 조건 완료를 뜻하지 않는다.'};
fs.writeFileSync(root+'/audit/lecture-goals/runtime-evidence.json',JSON.stringify(result,null,1)+'\n');
console.log(JSON.stringify({materials:built,existing:oldBuilt,goals:Object.keys(seen).length,oldSeen}));
