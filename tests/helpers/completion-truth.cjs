'use strict';
const assert=require('node:assert/strict'),D=require('../../data/goal-completion-source.json'),energy=require('../../data/energy-series.json'),groups=require('../../data/group-series.json');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
// Intentional definition review is checked against these reviewed meanings; quantities
// and comparisons are recomputed below rather than trusting the generator's truth flag.
module.exports=function(s,q,K){const c=s.check,v=s.completionWording;
 if(c.op==='completionClause'){
  const yes={'bloc-integration':'경제 통합 수준이 높은 블록이 GDP 총액도 반드시 가장 큰 것은 아니다.','mineral-denominator':'광물별 세계 총생산량이 다르므로 구리와 철광석의 비중만으로 생산 무게를 비교할 수 없다.','primary-vs-electricity':'브라질의 1차 에너지원 중 석유가 가장 크다는 것과 전력 생산에서 수력이 우세하다는 것은 함께 성립할 수 있다.','electricity-vs-primary':'네팔의 전력 생산에서 수력의 비중이 매우 높아도 전체 1차 에너지의 같은 비중이라는 뜻은 아니다.','renewable-four-denominator':'이 표의 100%는 각 국가의 수력·풍력·태양광·바이오에너지 발전량 합이다.','asian-export-items':'중국의 기계류·의류, 일본의 기계류·자동차, 인도네시아의 석탄·팜유·가스, 오스트레일리아의 석탄·철광석을 구별한다.'};
  assert.ok(yes[v],'unreviewed definition '+v);return s.text===yes[v];
 }
 if(c.op==='coalProductionRatio'){
  const a=energy.countries[c.entity].series;close(c.result,a.coal_consumption['2023']/a.coal_production['2023']*100);return !s.text.includes('수입 의존도');
 }
 if(c.op==='energyPerCapita')return energy.countries[c.subject].series.energy_per_capita['2023']>energy.countries[c.object].series.energy_per_capita['2023'];
 if(c.op==='electricityDenominators'){
  const x=D.renewables2023[c.entity],within=x.hydro/Object.values(x).reduce((a,b)=>a+b,0)*100,world=x.hydro/D.renewables2023['세계'].hydro*100;close(c.within,within);close(c.worldShare,world);assert.ok(Math.abs(within-world)>1);return s.text.includes('자국 네 발전원');
 }
 if(c.op==='sectorRemainder'){close(c.result,100-c.second-c.third);close(c.result,D.sectorComposition2023[c.entity][0]);assert.ok(q.shown.includes('goal-sector2')&&q.shown.includes('goal-sector3'));return !s.text.includes('더한 값');}
 if(c.op==='migrationTotal'){const f=n=>D.migration2023[n]?.netMigration??groups.groups[n].series.netmig['2023'];assert.ok(q.shown.includes(c.rate)&&q.shown.includes(c.population));return Math.abs(f(c.subject))>Math.abs(f(c.object));}
 if(c.op==='internalLivestock'){close(c.denominator,q.entities.reduce((sum,n)=>sum+K.entities[n].values[c.ind],0));return K.entities[c.subject].values[c.ind]>K.entities[c.object].values[c.ind];}
 throw Error('unreviewed completion op '+c.op);
};
