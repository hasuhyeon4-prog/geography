#!/usr/bin/env python3
"""Read only pinned JMA Normal columns; never average daily maxima/minima."""
import copy,re,json,html,hashlib,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]

def build(data):
 """Add the pinned completion stations without mutating the base dataset."""
 d=copy.deepcopy(data)
 for fn,name,wmo,typ,region in [('bamako','바마코','61291','aw','africa'),('mumbai-colaba','뭄바이','43057','am','asia'),('ulaanbaatar','울란바토르','44292','bs','asia'),('abidjan','아비장','65578','am','africa')]:
  file='data/completion-sources/'+fn+'-jma.html';b=(root/file).read_bytes();s=b.decode();rows={}
  for tr in re.findall(r'<tr[^>]*>(.*?)</tr>',s,re.S):
   cs=[html.unescape(re.sub(r'<[^>]*>','',x)).strip() for x in re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>',tr,re.S)]
   if cs and re.fullmatch(r'\d{4}-\d{2}',cs[0]):
    vals=[float(x) if re.fullmatch(r'-?\d+(\.\d+)?',x) else None for x in cs[1:]]
    if len(vals)>=6 and None not in vals[4:6]:
     m=int(cs[0][-2:]);v=vals[4:6]
     if m in rows:assert rows[m]==v, 'Normal differs between observation years'
     rows[m]=v
  assert set(rows)==set(range(1,13)),name
  plain=html.unescape(re.sub(r'<[^>]*>',' ',s))
  c=re.search(r'Lat\.:\s*([\d.]+)\s*°([NS])\s*/\s*Lon\.:\s*([\d.]+)\s*°([EW]).*?Height:\s*([\d.]+)',plain,re.S);assert c,name
  lat=float(c[1])*(-1 if c[2]=='S' else 1);lon=float(c[3])*(-1 if c[4]=='W' else 1)
  d['sites']=[x for x in d['sites'] if x['name']!=name]
  d['sites'].append(dict(name=name,mapPoint=[lon,lat],region=region,lectureClimate=typ,sourceBlockId='강의 P02·P11 / G015-4·G020-2·G133-1',normalPeriod=[1991,2020],station=dict(id=wmo,idScheme='WMO',name='JMA WMO '+wmo,latitude=lat,longitude=lon,elevationM=float(c[5]),distanceFromMapPointKm=0),sourceFile=file,sourceId='jma-'+wmo,sourceUrl='https://ds.data.jma.go.jp/tcc/tcc/products/climate/climatview/graph_mkhtml.php?n='+wmo+'&y=2025&m=10',sourceSHA256=hashlib.sha256(b).hexdigest(),temperatureC=[rows[i][0] for i in range(1,13)],precipitationMm=[rows[i][1] for i in range(1,13)],temperatureYears=[None]*12,precipitationYears=[None]*12,status='complete',usage=dict(climateGraph=True,temperatureReading=True,precipitationReading=True),issues=['JMA ClimatView Normal列。平年期間1991–2020、要素別有効年数は非公表。最高・最低気温からの合成なし。']))
 return d

def main():
 p=root/'data/climate-normals-extension.json'
 text=json.dumps(build(json.loads(p.read_text())),ensure_ascii=False,indent=1)+'\n'
 if '--check' in sys.argv:assert p.read_text()==text,'completion station input stale'
 else:p.write_text(text)
 print('4 JMA stations, 96 monthly normals; coordinates from same station header')

if __name__=='__main__':main()
