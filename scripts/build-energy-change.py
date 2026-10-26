"""Extract historical energy values from the repository's pinned OWID snapshot."""
import csv,hashlib,io,json,sys,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
archive=ROOT/'data/extensions-source-snapshots-02.zip'
with zipfile.ZipFile(archive)as z:raw=z.read('owid_energy.csv')
names={'United States':'미국','China':'중국','Iran':'이란','Australia':'오스트레일리아'}
fields=['coal_consumption','oil_consumption','gas_consumption','renewables_consumption','coal_share_energy','oil_share_energy','gas_share_energy']
countries={n:{} for n in names.values()}
for row in csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))):
    if row['country']not in names or not 1965<=int(row['year'])<=2025:continue
    countries[names[row['country']]][row['year']]={f:float(row[f])if row.get(f)else None for f in fields}
# Explicitly named national-statistics endpoints; the original CSV remains unchanged.
endpoints=json.loads((ROOT/'data/coal-2025-endpoints.json').read_text())
for name,x in endpoints['countries'].items():
    row=countries[name].setdefault('2025',{f:None for f in fields})
    assert row['coal_consumption'] is None, 'Do not overwrite an available snapshot value'
    row['coal_consumption']=x['coalEJ']/.0036
checks={}
for name,up in [('미국',False),('중국',True)]:
    cases=[];missing=[]
    for first in range(1985,1996):
        for last in range(2015,2026):
            a=countries[name].get(str(first),{}).get('coal_consumption');b=countries[name].get(str(last),{}).get('coal_consumption')
            if a is None or b is None:missing.append([first,last]);continue
            cases.append({'first':first,'last':last,'up':b>a})
    assert all(c['up']==up for c in cases)
    checks[name]={'expectedUp':up,'validCases':len(cases),'allAvailableHold':True,'fullPlusMinusFiveVerified':not missing,'missingPairs':missing}
obj={'source':'OWID energy-data · Energy Institute Statistical Review of World Energy 2025','sourceUrl':'https://github.com/owid/energy-data','sourceArchive':'data/extensions-source-snapshots-02.zip','member':'owid_energy.csv','sourceSHA256':hashlib.sha256(raw).hexdigest(),'units':{'consumption':'TWh','share':'% of primary energy consumption (substitution method)','TWhToEJ':0.0036},'policy':'empty cell -> null; source category retained; no present-day values substituted for historical exam years; 2025 coal endpoints explicitly sourced from national energy statistics','coal2025Endpoints':endpoints,'countries':countries,'coalDirectionWindow':checks}
text=json.dumps(obj,ensure_ascii=False,indent=1,allow_nan=False)+'\n'
target=ROOT/'data/energy-change-source.json'
if '--check'in sys.argv:assert target.read_text()==text,'energy-change-source.json is stale'
else:target.write_text(text)
print('에너지 과거 계열',[(k,v['validCases'],v['fullPlusMinusFiveVerified'])for k,v in checks.items()])
