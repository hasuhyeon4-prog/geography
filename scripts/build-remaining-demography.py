"""Rebuild explicitly approximate WDI demographic balances from pinned bytes."""
from pathlib import Path
import json,hashlib,zipfile,sys
R=Path(__file__).resolve().parents[1]
m=json.loads((R/'data/remaining-demographic-manifest.json').read_text())
with zipfile.ZipFile(R/m['archive']) as z:b=z.read(m['member'])
assert hashlib.sha256(b).hexdigest()==m['sha256']
records=json.loads(b)[1];result={'source':m,'countries':{}}
for iso,name in [('IND','인도'),('MEX','멕시코'),('DEU','독일')]:
 rows={}
 for y in range(2010,2024):
  d={x['indicator']['id']:x['value'] for x in records if x['countryiso3code']==iso and x['date']==str(y)}
  assert all(isinstance(v,(int,float)) for v in d.values()) and len(d)==4
  p=d['SP.POP.TOTL'];natural=p*(d['SP.DYN.CBRT.IN']-d['SP.DYN.CDRT.IN'])/1000
  rows[str(y)]={'population':p,'birthPerThousand':d['SP.DYN.CBRT.IN'],'deathPerThousand':d['SP.DYN.CDRT.IN'],'naturalApprox':natural,'netMigration':d['SM.POP.NETM']}
 result['countries'][name]=rows
text=json.dumps(result,ensure_ascii=False,indent=1)+'\n';p=R/'data/remaining-demographic-balances.json'
if '--check' in sys.argv:assert p.read_text()==text
else:p.write_text(text)
print('Demographic balances: 3 countries × 14 years; natural change is an approximation')
