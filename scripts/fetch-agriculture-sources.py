"""Download official FAOSTAT bulk files and pin unchanged selected CSV records.

python3 scripts/fetch-agriculture-sources.py --cache-dir /tmp/faostat-agriculture
Standard library only. Existing snapshots are checked, never silently repinned.
"""
import argparse, concurrent.futures, csv, hashlib, io, json
from pathlib import Path
import urllib.request, zipfile

ROOT=Path(__file__).resolve().parents[1]
SELECTION={
 'QCL':{'15':['5312','5510'],'27':['5312','5510'],'56':['5312','5510'],'44':['5312','5510'],
        **{k:['5510'] for k in ['656','661','667','675','867','1035','977']},
        **{k:['5111'] for k in ['866','1034','976','1016','946','1746']}},
 'FBS':{k:['5511','5611','5911','5521','5142','5154'] for k in ['2511','2807','2514','2513','2905']},
 'TCL':{k:['5610','5910','5622','5922'] for k in ['15','27','28','29','30','31','32','56','44','656','661','667','1672']}}
def sha(b):return hashlib.sha256(b).hexdigest()
class Lines:
 def __init__(self,f):self.f=f;self.parts=[]
 def __iter__(self):return self
 def __next__(self):
  b=next(self.f);self.parts.append(b);return b.decode('utf-8-sig')
 def take(self):
  b=b''.join(self.parts);self.parts=[];return b
def get(url,path):
 if path.exists() and path.suffix=='.zip' and not zipfile.is_zipfile(path):path.unlink()
 if not path.exists():
  for attempt in range(3):
   urllib.request.urlretrieve(url+('?recovery=20261021' if attempt else ''),path)
   if path.suffix!='.zip' or zipfile.is_zipfile(path):break
   path.unlink()
  else:raise ValueError('Incomplete archive: '+str(path))
 return path.read_bytes()
def run(cache):
 cache.mkdir(parents=True,exist_ok=True)
 url='https://bulks-faostat.fao.org/production/datasets_E.json'
 metadata=get(url,cache/'datasets_E.json')
 datasets=json.loads(metadata)['Datasets']['Dataset']
 chosen=[next(d for d in datasets if d['DatasetCode']==k) for k in SELECTION]
 def download(d):
  p=cache/(d['DatasetCode']+'.zip');get(d['FileLocation'],p);return d,p
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:downloads=list(pool.map(download,chosen))
 target=ROOT/'data/agriculture-source-snapshots.zip';mp=ROOT/'data/agriculture-sources/manifest.json'
 old=json.loads(mp.read_text()) if mp.exists() else None
 entries={};manifest={'about':'Selected original FAOSTAT CSV records, not complete bulk archives. Source bytes, units, flags and notes retained.','retrievedAt':'2026-10-21','sources':[]}
 def put(name,b,url,**extra):
  entries[name]=b;manifest['sources'].append({'path':name,'url':url,'sha256':sha(b),'sizeBytes':len(b),**extra})
 put('datasets_E.json',metadata,url)
 for d,p in downloads:
  tag=d['DatasetCode'];bulk=p.read_bytes();z=zipfile.ZipFile(io.BytesIO(bulk));member=next(n for n in z.namelist() if 'Normalized' in n)
  if old:
   pinned=next(s for s in old['sources'] if s.get('domain')==tag)
   assert sha(bulk)==pinned['bulkSha256'],tag+' upstream release changed; explicit review required'
  with z.open(member) as f:
   lines=Lines(f);reader=csv.DictReader(lines);reader.fieldnames;out=bytearray(lines.take());count=0
   for r in reader:
    record=lines.take()
    if int(r['Year'])>=2013 and r['Element Code'] in SELECTION[tag].get(r['Item Code'],[]):out.extend(record);count+=1
  if old:assert sha(out)==pinned['sha256']
  put(tag+'/selected.csv',bytes(out),d['FileLocation'],domain=tag,releaseDate=d['DateUpdate'],bulkSha256=sha(bulk),member=member,filter={'yearMin':2013,'itemsAndElements':SELECTION[tag]},recordCount=count)
  for n in z.namelist():
   if n!=member:put(tag+'/'+n,z.read(n),d['FileLocation'],bulkSha256=sha(bulk),member=n)
  print(tag,count,'unchanged original records',flush=True)
 for name,u in [('m49.html','https://unstats.un.org/unsd/methodology/m49/overview/'),('QCL-method.pdf','https://files-faostat.fao.org/production/QCL/QCL_methodology_e.pdf')]:
  put(name,get(u,cache/name),u)
 if old:
  with zipfile.ZipFile(target) as z:
   for s in old['sources']:assert sha(z.read(s['path']))==s['sha256']
  print('Pinned snapshots and complete bulk extraction verified',flush=True);return
 target.parent.mkdir(exist_ok=True);mp.parent.mkdir(exist_ok=True)
 with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for name,b in entries.items():z.writestr(name,b)
 mp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print('Pinned snapshot bytes',target.stat().st_size,flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--cache-dir',type=Path,required=True);run(p.parse_args().cache_dir)
