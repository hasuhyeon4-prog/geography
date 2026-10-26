"""Pinned WDI delivery of UN WPP sex/age estimates. No missing value is zero."""
from pathlib import Path
import json,zipfile,hashlib,sys
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'data/remaining-population-source-manifest.json').read_text())
with zipfile.ZipFile(root/m['archive']) as z:raw=z.read(m['member'])
assert hashlib.sha256(raw).hexdigest()==m['sha256']
data=json.loads(raw)[1];countries={'ARE':'아랍 에미리트','EGY':'이집트','TUR':'튀르키예'}
codes=['0004','0509','1014','1519','2024','2529','3034','3539','4044','4549','5054','5559','6064','6569','7074','7579','80UP']
result={'source':m,'ages':[f'{i*5}~{i*5+4}세' for i in range(16)]+['80세 이상'],'countries':{}}
for iso,name in countries.items():
 result['countries'][name]={}
 for year in m['years']:
  records={x['indicator']['id']:x['value'] for x in data if x['countryiso3code']==iso and x['date']==str(year)}
  row={}
  for sex,field in [('MA','male'),('FE','female')]:
   total=records[f'SP.POP.TOTL.{sex}.IN'];values=[records[f'SP.POP.{age}.{sex}.5Y'] for age in codes]
   assert total>0 and all(isinstance(x,(int,float)) and x>=0 for x in values)
   assert abs(sum(values)-100)<.00001,(name,year,sex,sum(values))
   row[field+'Total']=total;row[field+'SexPercent']=values;row[field]=[round(total*x/100) for x in values]
  result['countries'][name][str(year)]=row
text=json.dumps(result,ensure_ascii=False,indent=1)+'\n';p=root/'data/population-pyramids.json'
if '--check' in sys.argv:assert p.read_text()==text
else:p.write_text(text)
print('Population pyramids: 3 countries × 2 years × 17 age bands × 2 sexes')
