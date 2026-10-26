"""Derive additive scoped inputs solely from the repository's pinned data."""
import json,csv,io,zipfile,hashlib,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1];read=lambda p:json.loads((R/p).read_text())
e=read('data/economy-indicators.json');p=read('data/country-indicators.json');energy=read('data/energy-series.json')
D={'policy':'회상 범위와 제시 자료의 분모·연도는 각 문항에 명시. 다른 판본의 값을 혼합하지 않음.','economy2021':{},'sectorComposition2023':{},'coal2023':{},'renewables2023':{}}
for n in ['미국','중국','일본']:
 D['economy2021'][n]={'gdp':p['countries'][n]['series']['gdp']['2021'],'industry':e['countries'][n]['series']['industry']['2021']}
for n in ['중국','나이지리아','사우디아라비아']:
 v=e['countries'][n]['values'];vals=[v[k] for k in ['agriculture','industry','services']];assert all(x is not None for x in vals);D['sectorComposition2023'][n]=[x/sum(vals)*100 for x in vals]
for n in ['중국','인도','미국','러시아','이란','브라질','남아프리카 공화국']:
 s=energy['countries'][n]['series'];D['coal2023'][n]={k:s[k].get('2023') for k in ['coal_production','coal_consumption']}
raw=zipfile.ZipFile(R/'data/extensions-source-snapshots-02.zip').read('owid_energy.csv');D['renewablesSource']={'archive':'data/extensions-source-snapshots-02.zip','member':'owid_energy.csv','sha256':hashlib.sha256(raw).hexdigest(),'year':2023,'unit':'TWh','fields':['hydro_electricity','wind_electricity','solar_electricity','biofuel_electricity']}
names={'China':'중국','Brazil':'브라질','Kenya':'케냐','Iceland':'아이슬란드','New Zealand':'뉴질랜드','Denmark':'덴마크','Germany':'독일','World':'세계'}
for row in csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))):
 if row['country'] in names and row['year']=='2023':D['renewables2023'][names[row['country']]]=dict(zip(['hydro','wind','solar','bioenergy'],[float(row[k]) for k in D['renewablesSource']['fields']]))
D['migration2023']={n:read('data/remaining-demographic-balances.json')['countries'][n]['2023'] for n in ['인도','멕시코','독일']}
text=json.dumps(D,ensure_ascii=False,indent=1)+'\n'
if '--check' in sys.argv:assert (R/'data/goal-completion-source.json').read_text()==text,'completion data stale'
else:(R/'data/goal-completion-source.json').write_text(text)
