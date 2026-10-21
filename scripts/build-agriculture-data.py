"""Build agriculture series and recall verdicts from pinned original CSV rows.
Standard library only. Use --check to reproduce committed outputs without writes.
"""
import csv, hashlib, io, itertools, json, math
from pathlib import Path
import sys, zipfile
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
QCL={'15':'밀','27':'쌀','56':'옥수수','44':'보리','656':'커피','661':'카카오','667':'차(생엽)','675':'차(가공)',
 '866':'소','1034':'돼지','976':'양','1016':'염소','946':'물소','1746':'소·물소','867':'소','1035':'돼지','977':'양'}
FBS={'2511':'밀','2807':'쌀','2514':'옥수수','2513':'보리','2905':'곡물 전체'}
TCL={'15':'밀','27':'벼','28':'현미','29':'쌀(정미·현미 항목29)','30':'벼(정미환산)','31':'정미','32':'쇄미',
 '56':'옥수수','44':'보리','656':'커피','661':'카카오','667':'차(TCL 항목667)','1672':'쌀(무역 합계)'}
ELEMENTS={'QCL':{'5312':'area','5510':'production','5111':'stocks'},
 'FBS':{'5511':'production','5611':'imports','5911':'exports','5521':'feed','5142':'food','5154':'otherUses'},
 'TCL':{'5610':'imports','5910':'exports','5622':'importValue','5922':'exportValue'}}
def dumps(x):return json.dumps(x,ensure_ascii=False,indent=1,allow_nan=False)+'\n'
def rounded(x):return round(x,8)
class M49(HTMLParser):
 def __init__(self):super().__init__();self.active=False;self.cell=False;self.rows=[];self.row=[];self.text=''
 def handle_starttag(self,tag,attrs):
  if tag=='table' and dict(attrs).get('id')=='downloadTableEN':self.active=True
  if not self.active:return
  if tag=='tr':self.row=[]
  if tag=='td':self.cell=True;self.text=''
 def handle_data(self,text):
  if self.cell and self.active:self.text+=text
 def handle_endtag(self,tag):
  if not self.active:return
  if tag=='td':self.row.append(self.text.strip());self.cell=False
  if tag=='tr' and len(self.row)>=12:self.rows.append(self.row)
  if tag=='table':self.active=False

def resolve(data,name,key):
 ids=data['entities'][name]['areaCodes']
 if len(ids)>1 and (key.startswith('fbs-exportRatio:') or key.startswith('qcl-yield:')):
  item=key.split(':',1)[1];p,q,f=('fbs-exports:','fbs-production:',100) if key.startswith('fbs') else ('qcl-production:','qcl-area:',1000)
  a=resolve(data,name,p+item);b=resolve(data,name,q+item)
  return {y:rounded(f*a[y]/b[y]) for y in sorted(a.keys()&b.keys()) if b[y]>0}
 cols=[data['seriesByArea'].get(i,{}).get(key,{}) for i in ids]
 years=set.intersection(*(set(c) for c in cols)) if cols else set()
 return {y:rounded(sum(c[y] for c in cols)) for y in sorted(years)}

def validate_pair(a,b,c):
 ys=sorted(y for y in a.keys()&b.keys() if c['window'][0]<=int(y)<=c['window'][1]);r={'years':ys,'count':len(ys),'status':'active'}
 if len(ys)<c['minYears']:return {**r,'status':'insufficientYears','reason':f'공통 자료 {len(ys)}개 해 < {c["minYears"]}'}
 bad=[y for y in ys if a[y]<=b[y]]
 if bad:return {**r,'status':'reversed','reason':'방향 불일치: '+', '.join(bad)}
 ratios={y:max(a[y],b[y])/min(a[y],b[y]) if min(a[y],b[y])>0 else math.inf for y in ys}
 small=[y for y in ys if ratios[y]<c['minRatio']];minimum=min(ratios.values());minimum=minimum if math.isfinite(minimum) else None
 if small:return {**r,'status':'belowMargin','reason':'방향은 같으나 최소 배율 미달: '+', '.join(small),'minimumRatio':minimum}
 return {**r,'minimumRatio':minimum}

def validate(d,config):
 c=config['check'];relations=[];orders=[];signs=[]
 for row in config['relations']:
  pairs=list(row.get('pairs',[]));tiers=row.get('tiers',[])
  pairs += [[a,b] for i,t in enumerate(tiers) for u in tiers[i+1:] for a in t for b in u]
  pairs += list(itertools.combinations(row.get('group',[]),2))
  for a,b in pairs:
   relations.append({'id':row['id']+':'+a+'>'+b,'indicator':row['indicator'],'more':a,'less':b,'basis':row['basis'],**validate_pair(resolve(d,a,row['indicator']),resolve(d,b,row['indicator']),c)})
  for name in row.get('signs',[]):
   s=resolve(d,name,row['indicator']);ys=sorted(y for y in s if c['window'][0]<=int(y)<=c['window'][1]);sign=row['expectedSign'];status='active';reason=''
   if len(ys)<c['minYears']:status='insufficientYears';reason='자료 연수 부족'
   elif any(sign*s[y]<=0 for y in ys):status='reversed';reason='부호 불일치: '+', '.join(y for y in ys if sign*s[y]<=0)
   signs.append({'id':row['id']+':'+name,'indicator':row['indicator'],'entity':name,'sign':sign,'years':ys,'status':status,'reason':reason,'basis':row['basis']})
 for row in config['orders']:
  if row.get('entity'):
   code=d['entities'][row['entity']]['areaCodes'];assert len(code)==1
   table=d['rankings'].get(row['indicator'],{});actual={y:next(r['rank'] for r in rs if r['areaCode']==code[0]) for y,rs in table.items() if any(r['areaCode']==code[0] for r in rs)}
   ys=sorted(y for y in actual if c['window'][0]<=int(y)<=c['window'][1]);bad=[y for y in ys if actual[y]!=row['rank']]
   status='insufficientYears' if len(ys)<c['minYears'] else 'reversed' if bad else 'active'
   ratios={y:table[y][0]['value']/table[y][1]['value'] for y in ys if actual[y]==1 and len(table[y])>1 and table[y][1]['value']>0};below=[y for y,v in ratios.items() if v<c['minRatio']]
   if status=='active' and below:status='belowMargin'
   reason='순위 불일치: '+', '.join(bad) if bad else '1·2위 차이 미달: '+', '.join(below) if below else ''
   orders.append({**row,'years':ys,'status':status,'reason':reason,'minimumRatio':min(ratios.values(),default=None),'ranks':{y:actual[y] for y in ys}})
  else:
   keys=[row['prefix']+':'+i for i in row['items']];results=[validate_pair(resolve(d,row['area'],a),resolve(d,row['area'],b),c) for a,b in zip(keys,keys[1:])]
   status=next((s for s in ['reversed','insufficientYears','belowMargin'] if any(r['status']==s for r in results)),'active');orders.append({**row,'status':status,'checks':results})
 counts={s:sum(r['status']==s for r in relations+orders+signs) for s in sorted({r['status'] for r in relations+orders+signs})}
 return {'about':'자료 검증 결과이며 앱 출제 연결 완료를 뜻하지 않는다. 누락/역전/차이 미달을 구별한다.','check':c,'counts':counts,'relations':relations,'orders':orders,'signs':signs}

def build():
 manifest=json.loads((ROOT/'data/agriculture-sources/manifest.json').read_text())
 d={'meta':{'retrievedAt':'2026-10-21','yearMin':2013,'source':'FAOSTAT QCL · TCL · FBS',
 'namespaceRule':'QCL 생산·수확면적·두수 / TCL 원품목 교역 / FBS 가공품 환산 포함 수급. 영역간 분자·분모 혼합 금지.',
 'missingRule':'없는 값은 생략. 원문에 명시된 0만 0으로 유지.',
 'riceRule':'QCL 쌀은 벼. TCL은 가공 단계별 별도 항목. FBS는 쌀 및 제품의 환산 기준. 임의 환산·단순 합산 금지.',
 'teaRule':'QCL 차 생엽(667)과 가공 차(675)를 구분. TCL과 생엽 생산량으로 수출 비율을 만들지 않음.',
 'livestockRule':'소 866은 물소 제외. 물소 946, 소·물소 1746 별도. 육류 생산량은 두수와 다른 지표.',
 'tradeRule':'대륙 교역에는 역내 국가간 교역도 포함. 세계 수출입 합계의 일치를 가정하지 않음.'},
 'sources':manifest['sources'],'indicators':{},'sourceAreas':{},'entities':{},'seriesByArea':{},'rankings':{}}
 with zipfile.ZipFile(ROOT/'data/agriculture-source-snapshots.zip') as z:
  for s in manifest['sources']:assert hashlib.sha256(z.read(s['path'])).hexdigest()==s['sha256'],s['path']
  p=M49();p.feed(z.read('m49.html').decode('utf-8'));iso={r[9]:r[11] for r in p.rows if r[9].isdigit() and len(r[11])==3};iso['158']='TWN'
  for domain,items in [('QCL',QCL),('FBS',FBS),('TCL',TCL)]:
   for r in csv.DictReader(io.TextIOWrapper(z.open(domain+'/selected.csv'),encoding='utf-8-sig')):
    a=r['Area Code'];m=r['Area Code (M49)'].lstrip("'").zfill(3)
    d['sourceAreas'][a]={'name':r['Area'],'m49':m,'iso3':iso.get(m),'kind':'country' if int(a)<5000 and r['Area']!='China' else 'aggregate'}
    if not r['Value'].strip():continue
    v=float(r['Value']);assert math.isfinite(v) and v>=0
    kind=ELEMENTS[domain][r['Element Code']]
    if domain=='QCL' and r['Item Code'] in ['867','977','1035']:kind='meat'
    key=domain.lower()+'-'+kind+':'+items[r['Item Code']]
    unit='ha' if kind=='area' else 'An' if kind=='stocks' else '1000 USD' if kind in ['importValue','exportValue'] else '1000 t' if domain=='FBS' else 't'
    assert r['Unit']==unit,(key,r['Unit'],unit)
    scale=1000 if domain=='FBS' else 1;display='ha' if kind=='area' else '마리' if kind=='stocks' else '천 US$' if kind in ['importValue','exportValue'] else 't'
    d['indicators'][key]={'domain':domain,'itemCode':r['Item Code'],'sourceItem':r['Item'],'sourceElement':r['Element'],'sourceUnit':r['Unit'],'unit':display,'scale':scale}
    col=d['seriesByArea'].setdefault(a,{}).setdefault(key,{})
    assert r['Year'] not in col,('duplicate',a,key,r['Year']);col[r['Year']]=rounded(v*scale)
 names=json.loads((ROOT/'data/agriculture-sources/entity-names.json').read_text())['namesByIso3']
 for a,s in d['sourceAreas'].items():
  n=names.get(s['iso3'])
  if n and s['kind']=='country':
   assert n not in d['entities'];d['entities'][n]={'type':'country','areaCodes':[a],'iso3':s['iso3']}
 groups={'세계':['5000'],'아시아':['5300'],'아프리카':['5100'],'유럽':['5400'],'아메리카':['5200'],'오세아니아':['5500'],
 '앵글로아메리카':['5203'],'라틴 아메리카':['5204','5206','5207'],'북아메리카':['5203','5204','5206'],'남아메리카':['5207'],
 '동아시아':['5302'],'동남아시아':['5304'],'남아시아':['5303'],'중앙아시아':['5301'],'서아시아':['5305']}
 for n,areas in groups.items():d['entities'][n]={'type':'world' if n=='세계' else 'region','areaCodes':areas,'aggregation':'FAOSTAT 원집계' if len(areas)==1 else 'FAOSTAT 하위 지역의 공통 연도만 합산'}
 for metrics in d['seriesByArea'].values():
  for prefix,items in [('fbs',FBS),('tcl',TCL)]:
   for item in items.values():
    ex=metrics.get(prefix+'-exports:'+item,{});im=metrics.get(prefix+'-imports:'+item,{})
    if ex.keys()&im.keys():metrics[prefix+'-netExports:'+item]={y:rounded(ex[y]-im[y]) for y in sorted(ex.keys()&im.keys())}
  for item in FBS.values():
   prod=metrics.get('fbs-production:'+item,{});ex=metrics.get('fbs-exports:'+item,{})
   if prod.keys()&ex.keys():metrics['fbs-exportRatio:'+item]={y:rounded(ex[y]/prod[y]*100) for y in sorted(prod.keys()&ex.keys()) if prod[y]>0}
  for item in ['밀','쌀','옥수수','보리']:
   prod=metrics.get('qcl-production:'+item,{});ha=metrics.get('qcl-area:'+item,{})
   if prod.keys()&ha.keys():metrics['qcl-yield:'+item]={y:rounded(prod[y]/ha[y]*1000) for y in sorted(prod.keys()&ha.keys()) if ha[y]>0}
 for key in list(d['indicators']):
  ranks={};years=sorted({y for m in d['seriesByArea'].values() for y in m.get(key,{})})
  for year in years:
   vals=[{'areaCode':a,'name':names.get(d['sourceAreas'][a]['iso3'],d['sourceAreas'][a]['name']),'value':m[key][year]} for a,m in d['seriesByArea'].items() if year in m.get(key,{}) and d['sourceAreas'][a]['kind']=='country']
   vals.sort(key=lambda v:(-v['value'],v['areaCode']));prev=None;rank=0
   for i,v in enumerate(vals,1):
    if v['value']!=prev:rank=i
    v['rank']=rank;prev=v['value']
   ranks[year]=vals[:10]
  d['rankings'][key]=ranks
 for key in sorted({k for m in d['seriesByArea'].values() for k in m}-d['indicators'].keys()):d['indicators'][key]={'domain':key[:3].upper(),'derived':True,'unit':'%' if 'Ratio:' in key else 'kg/ha' if '-yield:' in key else 't'}
 d['meta']['yearsByDomain']={prefix:sorted({y for m in d['seriesByArea'].values() for k,s in m.items() if k.startswith(prefix.lower()+'-') for y in s}) for prefix in ['QCL','FBS','TCL']}
 return d,validate(d,json.loads((ROOT/'data/exam-relations-agriculture.json').read_text()))
def main():
 d,a=build()
 for p,x in [('data/agriculture.json',d),('audit/agriculture-validation-20261021.json',a)]:
  p=ROOT/p;content=dumps(x)
  if '--check' in sys.argv:assert p.read_text()==content,str(p)+' differs'
  else:p.write_text(content)
 print(json.dumps({'entities':len(d['entities']),'indicators':len(d['indicators']),'verdicts':a['counts']},ensure_ascii=False))
if __name__=='__main__':main()
