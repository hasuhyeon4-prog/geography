"""Read fixed IRENA 2025 pages from the existing source archive, offline."""
import re,json,zipfile,hashlib,tempfile,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1]
with zipfile.ZipFile(R/'data/extensions-source-snapshots-02.zip') as z:b=z.read('irena2025.pdf')
with tempfile.TemporaryDirectory() as t:
 p=Path(t)/'source.pdf';p.write_bytes(b)
 pages=subprocess.check_output(['pdftotext','-layout',str(p),'-'],stderr=subprocess.DEVNULL).decode().split('\f')
cap={};gen={};names={'China':'중국','India':'인도','Germany':'독일','Canada':'캐나다','USA':'미국','Brazil':'브라질'}
for dest,numbers,ncols in [(cap,range(15,19),10),(gen,range(19,23),9)]:
 for pg in numbers:
  txt=pages[pg-1];assert ('CAP (MW)' if ncols==10 else 'PROD (GWh)') in txt
  for line in txt.splitlines():
   for en,ko in names.items():
    if re.match('^'+en+r'\s{2,}',line):
     cells=re.split(r'\s{2,}',line.strip())[1:];assert len(cells)==ncols,(en,cells)
     dest[ko]=int(cells[8].replace(' ',''))
assert set(cap)==set(gen)==set(names.values())
meta=json.loads((R/'data/extensions-source-manifest.json').read_text());source=next(x for x in meta['sources'] if x['path']=='irena2025.pdf')
result={'source':source,'pdfSHA256':hashlib.sha256(b).hexdigest(),'year':2023,'scope':'총 재생에너지, 같은 국가·같은 해. 용량=연말 MW, 발전량=연간 GWh. 국가 전체를 망라한 세계 순위가 아니라 제시 6개국 내 순위.','countries':{n:{'capacityMW':cap[n],'generationGWh':gen[n]} for n in names.values()}}
text=json.dumps(result,ensure_ascii=False,indent=1)+'\n';p=R/'data/renewable-capacity-comparison.json'
if '--check' in sys.argv:assert p.read_text()==text
else:p.write_text(text)
print('Same-year IRENA comparison: Germany/Canada reverse capacity and generation order')
