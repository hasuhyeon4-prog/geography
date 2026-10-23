#!/usr/bin/env python3
"""Rebuild round-two data from pinned snapshots. Python standard library only.

Does not modify the exam engine, themes, or screens. Run with --check for an
offline byte-for-byte regeneration check. Missing cells never become zero.
"""
import argparse,csv,hashlib,html,io,json,math,re,zipfile
from collections import defaultdict
from pathlib import Path
from html.parser import HTMLParser
import xml.etree.ElementTree as E
R=Path(__file__).resolve().parents[1];S=R/'data/round2-sources';OUT={}
def js(p):return json.loads((R/p).read_text())
def source(name):
 archive=R/'data/round2-source-snapshots.zip'
 if archive.exists():
  with zipfile.ZipFile(archive) as z:
   if name in z.namelist():return z.read(name)
 if (S/name).exists():return (S/name).read_bytes()
 for p in sorted((R/'data').glob('extensions-source-snapshots*.zip')):
  with zipfile.ZipFile(p) as z:
   if name in z.namelist():return z.read(name)
 raise FileNotFoundError(name)
def num(v):
 try:x=float(v)
 except (TypeError,ValueError):return None
 return x if math.isfinite(x) else None
def write(n,d):OUT[n]=json.dumps(d,ensure_ascii=False,indent=1,allow_nan=False)+'\n'
def rows_xlsx(name,sheet):
 z=zipfile.ZipFile(io.BytesIO(source(name)));ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 strings=[''.join(n.itertext()) for n in E.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in z.namelist() else []
 book=E.fromstring(z.read('xl/workbook.xml'));rel=E.fromstring(z.read('xl/_rels/workbook.xml.rels'))
 rid=next(x.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id') for x in book.find('s:sheets',ns) if x.get('name')==sheet)
 p=next(x.get('Target') for x in rel if x.get('Id')==rid);p=p.lstrip('/') if p.startswith('/') else 'xl/'+p
 for _,row in E.iterparse(io.BytesIO(z.read(p)),events=['end']):
  if not row.tag.endswith('}row'):continue
  vals={}
  for c in row:
   if not c.tag.endswith('}c'):continue
   ci=0
   for ch in re.match('[A-Z]+',c.get('r'))[0]:ci=ci*26+ord(ch)-64
   v=c.find('s:v',ns);t=c.get('t')
   val=''.join(c.find('s:is',ns).itertext()) if t=='inlineStr' else None if v is None else strings[int(v.text)] if t=='s' else v.text if t in ['str','e'] else num(v.text)
   vals[ci-1]=val
  if vals:yield int(row.get('r')),[vals.get(i) for i in range(max(vals)+1)]
  row.clear()

# Reviewed positive/negative claim lists. Absence is always unknown.
cur=js('data/round2-sources/curation.json');ev=js('data/round2-sources/lecture-evidence.json');blocks={b['id']:b for b in ev['blocks']}
typeblock={'Af':'L1-B0327','Am':'L1-B0327','Aw':'L1-B0327','BW':'L1-B0343','BS':'L1-B0343','Cfa':'L1-B0372','Cw':'L1-B0372','Cfb':'L1-B0379','Cs':'L1-B0379','Df':'L1-B0390','Dw':'L1-B0390','ET':'L1-B0400','EF':'L1-B0400','H':'L1-B0400'}
for q in cur['climateClaims']:
 ids=list(dict.fromkeys([x['blockId'] for x in q['sourceRefs']]+[typeblock[t] for t in q['trueFor']+q['falseFor']]))
 q['sourceRefs']=[{'blockId':i,'volume':blocks[i]['volume'],'section':blocks[i]['section'],'column':q['source']['column'] if i==q['source']['blockId'] else '対象 기후형의 명시적 표 열·행'} for i in ids]
write('data/climate-type-claims.json',{'schemaVersion':1,'about':'기후형 <보기>용 검토된 참·거짓 범위','climateTypes':list(typeblock),'claims':cur['climateClaims'],'policy':{'absenceMeansFalse':False,'overlaps':'고상 가옥 Af/ET, 동결 토양 Dw/ET, 유목 BW/BS/ET는 함께 참. falseFor=[]인 문장은 거짓 보기를 만들지 않는다.','sourceSnapshot':'data/round2-sources/lecture-evidence.json'}})
write('data/religion-type-claims.json',{'schemaVersion':1,'claims':cur['religionClaims'],'policy':{'absenceMeansFalse':False,'sharedSites':'예루살렘을 특정 한 종교만의 성지로 만드는 교차 대입 금지','sourceSnapshot':'data/round2-sources/lecture-evidence.json'}})
write('data/concepts/highlands.json',cur['highlandConcepts'])
old=js('data/round2-sources/pew2012-nigeria-row.json')
new=js('data/religion-composition-extension.json')['countries']['나이지리아']
write('data/nigeria-religion-vintages.json',{'schemaVersion':1,'country':'나이지리아','practice':'suppliedData','recallEligible':False,'vintages':[{'publication':2012,'referenceYear':2010,'values':{k:old[k] for k in ['christianity','islam','unaffiliated','folk','hinduism','buddhism','other','judaism']},'sourceFile':'pew2012-nigeria-row.json','largestReligion':'christianity'},{'publication':2025,'referenceYear':2010,'values':new['series']['2010'],'largestReligion':'islam'},{'publication':2025,'referenceYear':2020,'values':new['series']['2020'],'largestReligion':'islam'}],'policy':'같은 2010년 추정도 2012·2025 발행판에서 1위가 달라진다. 연도 변화와 추정판 개정을 분리한다. 현재의 고정 1위 회상으로 사용하지 않는다. <0.1을 0으로 바꾸지 않는다.'})
write('data/entity-facts-round2.json',{'schemaVersion':1,'facts':js('data/round2-sources/country-curation.json')['facts'],'policy':'추가 자료 패키지. 기존 entity-facts.json의 complete를 바꾸지 않는다. 완전한 공용어·접한 바다·내륙국 목록으로 오인하지 않는다.'})
# The EI 2025 definition sheet supplies the exact 2025 membership baseline.
# OPEC's own exhibitor profile supplies joins/exits; no 2026 change is projected
# backward. Annual snapshots mean 31 December, not every day within that year.
profile=json.loads(source('opec-profile-events.json'))
assert {x['country'] for x in profile['events']}=={'Gabon','Indonesia','Equatorial Guinea','Republic of Congo','Qatar','Ecuador','Angola'}
baseline=['이란','이라크','쿠웨이트','사우디아라비아','아랍 에미리트','알제리','리비아','적도 기니','가봉','나이지리아','콩고 공화국','베네수엘라']
annual={}
for y in range(2015,2026):
 members=baseline.copy()
 if y<2016:members.remove('가봉')
 if y<2017:members.remove('적도 기니')
 if y<2018:members.remove('콩고 공화국')
 if y<2019:members.append('카타르')
 if y<2020:members.append('에콰도르')
 if y<2024:members.append('앙골라')
 annual[str(y)]={'asOf':str(y)+'-12-31','members':sorted(members),'count':len(members)}
baselineRow=next(row[0] for ri,row in rows_xlsx('ei2025.xlsx','Definitions') if ri==60)
assert 'Republic of Congo' in baselineRow and 'Angola' not in baselineRow
write('data/opec-membership-by-year.json',{'schemaVersion':1,'years':annual,'practice':'suppliedData','withinYearException':{'2016':'인도네시아는 1월 재가입 후 11월 다시 자격 정지. 연말 목록에는 없지만 2016년 내내 비회원이었다고 해석하면 안 된다. 가봉도 7월 재가입.'},'sources':[{'file':'ei2025.xlsx','sheet':'Definitions','row':60,'role':'2025 기준판 원목록','sourceText':baselineRow},{'file':'opec-profile-events.json','publisher':'OPEC exhibitor self-description, World Petroleum Congress','role':'가입·탈퇴 연혁','limitation':'OPEC 원 홈페이지/ASB 직접 요청은 403. 공식 기관 자체 전시 소개의 연혁을 사용.'}],'policy':'연말 기준 목록이며 EI 연도별 통계가 이 구성으로 재집계됐다는 뜻이 아니다. 2025 이후 현재 회원 명단으로 덮어쓰지 않는다. 콩고=Republic of Congo, 콩고 민주 공화국과 다름.'})
# Globally recognised states: UN LLDC 32 + Europe 9 + Belarus/Serbia/Holy See.
# Completeness is explicitly scoped; unrecognised/partly recognised polities do
# not become coastal by absence. Caspian shores are inland, not ocean access.
groups=js('data/round2-sources/country-curation.json')['landlockedGroups'];landlocked={}
countryinfo={r[0]:r for r in csv.reader(io.StringIO(source('geonames-countryInfo.txt').decode()),delimiter='\t') if r and not r[0].startswith('#')}
boundary=dict(re.findall(r'"([^\"]+)":\{"code":"([A-Z]{3})"',(R/'data/extension-sources/country-boundaries.js').read_text()));iso_ko={iso:ko for ko,iso in boundary.items()}
extra={'AD':'안도라','AM':'아르메니아','AZ':'아제르바이잔','BT':'부탄','SZ':'에스와티니','KG':'키르기스스탄','LS':'레소토','MK':'북마케도니아','MD':'몰도바','RW':'르완다','TJ':'타지키스탄','TM':'투르크메니스탄','UZ':'우즈베키스탄','BY':'벨라루스','LI':'리히텐슈타인','SM':'산마리노','VA':'바티칸','BF':'부르키나파소','BI':'부룬디','CF':'중앙아프리카 공화국','MW':'말라위'}
for g in groups:
 for iso2 in g['iso2']:
  info=countryinfo[iso2];iso3='SDS' if iso2=='SS' else info[1];ko=iso_ko.get(iso3,extra.get(iso2,info[4]))
  assert ko not in landlocked
  landlocked[ko]={'iso2':iso2,'iso3':iso3,'sourceName':info[4],'source':{k:v for k,v in g.items() if k!='iso2'}}
assert len(landlocked)==44
land_isos={x['iso3'] for x in landlocked.values()}
write('data/landlocked-countries.json',{'schemaVersion':1,'countries':landlocked,'scope':'UN 회원국 및 교황청. 부분 승인국·속령은 이 전체 목록의 범위 밖.','completeForScope':True,'caspians':{'landlocked':['아제르바이잔','카자흐스탄','투르크메니스탄'],'notLandlocked':['러시아','이란'],'rule':'카스피해는 외양으로 직접 통하는 해안으로 세지 않는다. 러시아·이란은 다른 바다의 해안으로 구별.'},'appValues':{ko:{'iso3':iso,'isLandlocked':None if iso=='TWN' else iso in land_isos} for ko,iso in boundary.items()},'practice':'suppliedData','policy':'목록에 없는 모든 이름을 해안국으로 단정하지 않는다. appValues에 없는 새 대상·부분 승인국은 unknown. 항구와 운하·호수·카스피해 연안을 바다 해안으로 간주하지 않는다. 국가 식별 문제의 회상 승인은 강의·기출 허용 범위와 별도로 연결해야 한다.','nameMappingSource':'GeoNames countryInfo CC-BY 4.0, ISO identity mapping only'})
write('data/energy-evidence-round2.json',{'schemaVersion':1,'items':[{'request':'R2.1 지역별 자원 생산 관계','status':'notAuthorizedForRecall','sourceBlockIds':['L2-B0338','L2-B0340','L2-B0342'],'finding':'강의가 주요 생산국 조합을 명시하지만 아시아·오세아니아 등 지역별 고정 순서까지 명시하지 않는다. 기존 지역 비중 표는 suppliedData로 사용.'},{'request':'R2.4 보크사이트','status':'suppliedDataOnly','sourceBlockIds':['L2-B0452','L2-B0471','L2-B0472','L2-B0476'],'finding':'오스트레일리아·기니는 대표 생산국으로 연결되며 브라질까지 포함한 연도 불변 순위는 강의에 없다. 기존 BGS 연도별 표로만 연습한다.'},{'request':'R2.5 미국 에너지','status':'compositionRankNotStated','sourceBlockIds':['L2-B0368','L2-B0373','L2-B0377'],'finding':'총량 중국>미국>인도, 1인당·가스 미국>중국은 명시. 미국 내부 구성은 석유·가스 비중이 크다고만 적어 정확한 에너지원 순위를 창작하지 않는다. 총량 비교를 승인한 것과 미국을 구성 식별 후보로 승인한 것을 구분한다.'}]})

# WPP2024 aggregates: accept only the explicitly labelled (UN) series.
meta=json.loads(source('net-migration-metrics.metadata.json'));assert '2024' in meta['chart']['citation']
names={'Africa (UN)':'아프리카','Asia (UN)':'아시아','Europe (UN)':'유럽','Latin America and the Caribbean (UN)':'라틴 아메리카','Northern America (UN)':'앵글로아메리카','Oceania (UN)':'오세아니아'}
migration={k:{'sourceName':en,'series':{}} for en,k in names.items()}
for row in csv.DictReader(io.StringIO(source('net-migration-metrics.csv').decode('utf-8-sig'))):
 if row['Entity'] in names:
  v=num(row['Annual net migration'])
  if v is not None:migration[names[row['Entity']]]['series'][row['Year']]=v
assert all(len(x['series'])>=70 for x in migration.values())
write('data/net-migration-un-regions.json',{'schemaVersion':1,'source':'UN WPP 2024, OWID distribution, explicitly named UN regional rows','unit':'명/연간','period':'1950–2023 estimates','areas':migration,'policy':'OWID 자체 대륙 합계 Africa/Asia 등을 사용하지 않는다. WPP2024 추정값이며 기출의 과거 판본 given을 덮어쓰지 않는다.','sourceFiles':['net-migration-metrics.csv','net-migration-metrics.metadata.json']})

# 2024 CSAT Q14 exact printed values, visually verified PDF p3. Fertility bars
# have no numerical labels; preserve the figure, do not invent exact decimals.
write('data/exam-given-round2.json',{'schemaVersion':1,'forms':[{'exam':'2024학년도 수능 14번','practice':'suppliedData','year':2020,'unit':'천 명','columns':['지역(대륙)','순 이주'],'values':{'유럽':1436,'앵글로아메리카':871,'오세아니아':151,'라틴 아메리카':-164,'아프리카':-202,'아시아':-2092},'aliases':{'(가)':'유럽','(나)':'라틴 아메리카','(다)':'아프리카','(라)':'아시아'},'notes':['러시아는 유럽에 포함','순 이주=유입 인구−유출 인구','해당 대륙에 속한 모든 국가의 순 이주를 합산한 값'],'fertilityChart':{'years':[1960,1990,2020],'unit':'명/여성 1명','exactValues':None,'reason':'막대에 정확한 수치가 표기되지 않았다. 원문 그림으로 제시한다.'},'source':{'snapshot':'q2024-q14-data.png','originalDocument':'2024학년도 수능 문제지','page':3,'question':14,'verification':'rendered PDF visual review'},'lectureBlockIds':['L1-B1415','L1-B1416']}]})
given=json.loads(OUT['data/exam-given-round2.json'])
given['forms'].append({'exam':'2026학년도 9월 15번','practice':'suppliedData','source':{'snapshot':'q2026-q15-data.png','originalDocument':'2026학년도 9월 문제지','page':3,'question':15,'verification':'원문 표·그래프를 렌더링하여 대조'},'lectureBlockIds':['L1-B1420','L1-B1421'],'table':{'title':'미국 내 이민자 수','year':2020,'unit':'천 명','columns':['출신 국가','이민자 수'],'values':{'멕시코':10853,'세네갈':61,'인도':2724,'독일':534},'aliases':{'(가)':'멕시코','(나)':'세네갈','(다)':'인도','(라)':'독일'}},'pairedChart':{'title':'인구의 자연 증가율','periods':['1960–1965','2015–2020'],'unit':'‰','exactValues':None,'reason':'눈금 10‰ 간격이며 점에 정확한 숫자가 없다. 원문 그림을 함께 제시한다.'}})
given['forms'].append({'exam':'2026학년도 9월 11번','practice':'suppliedData','source':{'snapshot':'q2026-q11-data.png','originalDocument':'2026학년도 9월 문제지','page':3,'question':11,'verification':'강의 rId210 및 원문 대조'},'chart':{'title':'오스트레일리아의 무역 상대국','periods':[1950,2020],'unit':'%','directions':['수출','수입'],'aliases':{'A':'미국','B':'중국','C':'일본'},'displayedTop3':{'1950':{'수출':['영국','미국','프랑스'],'수입':['영국','미국','인도']},'2020':{'수출':['중국','일본','대한민국'],'수입':['중국','미국','일본']}},'remainderLabel':'기타','exactValues':None,'reason':'각 조각의 수치가 표기되지 않은 누적 막대이다. 픽셀을 정확한 백분율로 바꾸지 않는다.'},'originalDfatPeriods':['1949-50','1950-51'],'periodPolicy':'강의·기출의 1950 표기는 그대로 given에 보존. DFAT 회계연도 수치로 덮어쓰지 않는다.'})
write('data/exam-given-round2.json',given)

# Explicit reported zero is different from absent data. Iranian production is
# NONZERO: it must not be included with the four zero-producing Gulf states.
eia=json.loads(source('eia-coal-production.json'))['response'];assert len(eia['data'])==int(eia['total'])
iso_names={'SAU':'사우디아라비아','QAT':'카타르','IRN':'이란','IRQ':'이라크','KWT':'쿠웨이트','CHL':'칠레','ZAF':'남아프리카 공화국'}
coal={k:{'iso3':iso,'series':{}} for iso,k in iso_names.items()}
for row in eia['data']:
 iso=row['countryRegionId']
 if iso not in iso_names or row['countryRegionTypeId']!='c':continue
 v=num(row['value']);coal[iso_names[iso]]['series'][row['period']]={'value':v,'rawValue':row['value'],'status':'missing' if v is None else 'reportedZero' if v==0 else 'reportedNonzero','flag':row['dataFlagId'],'flagDescription':row['dataFlagDescription']}
write('data/coal-production-status.json',{'schemaVersion':1,'source':'U.S. EIA International annual coal production, product 7/activity 1/unit TST','unit':'thousand short tons','countries':coal,'policy':'0은 원표에 0으로 명시된 경우만. 이란은 생산국이다. OWID TWh null을 0으로 덮어쓰거나 물리 단위와 혼합하지 않는다.','practice':'suppliedData','sourceFile':'eia-coal-production.json'})
mineral={}
for short,fn in [('은','bgs-silver-mine.json'),('다이아몬드','bgs-diamond.json'),('칠레 석탄','bgs-coal-chile.json')]:
 d=json.loads(source(fn));assert len(d['features'])==d['numberMatched'];rr=[]
 for f in d['features']:
  p=f['properties'];y=p['year'][:4]
  if not '2013'<=y<='2024':continue
  rr.append({'id':f['id'],'year':y,'iso3':p['country_iso3_code'],'sourceName':p['country_trans'],'commodity':p['bgs_commodity_trans'],'subCommodity':p.get('bgs_sub_commodity_trans'),'value':p['quantity'],'valueAsPublished':p['quantity_in_book_style'],'unit':p['units'],'flag':p['sdmx_code'],'flagMeaning':p['sdmx_translation'],'tableNotes':p['concat_table_notes_text'],'figureNotes':p['concat_figure_notes_text']})
 mineral[short]={'sourceFile':fn,'rows':rr}
write('data/mineral-production-round2.json',{'schemaVersion':1,'source':'British Geological Survey World Mineral Statistics API','minerals':mineral,'gemCoverage':{'status':'held','reason':'보츠와나·앙골라·남아공의 최근 BGS 원행은 subCommodity=null인 총 다이아몬드다. 보석용으로 이름을 바꾸지 않는다.'},'policy':'보석용 다이아몬드는 subCommodity=Gem만 사용. Industrial·분류 없는 합계와 합산 금지. 칠레는 Lignite가 2021년부터 0이나 Bituminous가 계속 양수다.','practice':'suppliedData'})

# US manufacturing, pinned releases and classification vintages. Geography
# must be the STATE summary, never U.S. totals, counties, or metro divisions.
ST={'06':('California','캘리포니아'),'39':('Ohio','오하이오'),'48':('Texas','텍사스'),'26':('Michigan','미시간'),'53':('Washington','워싱턴주')};states={};series=[]
keep=lambda code:code=='31-33' or len(code)==3 or code in ['3361','3362','3363','3364']
for y in [2014,2015,2016]:
 fn=f'asm-{y}.xlsx';sheet=f'ASM_{y}_31AS101_with_ann';names_en={v[0]:k for k,v in ST.items()}
 for ri,row in rows_xlsx(fn,sheet):
  if ri==1 or row[0] not in names_en or int(row[3])!=y:continue
  code=str(int(row[1])) if isinstance(row[1],(int,float)) else str(row[1])
  if not keep(code):continue
  series.append({'stateFips':names_en[row[0]],'year':y,'naicsVintage':2012,'naics':code,'industry':row[2],'shipmentsThousandUSD':num(row[16]),'valueAddedThousandUSD':num(row[18]),'rawShipments':row[16],'rawValueAdded':row[18],'shipmentsRelativeSEPct':num(row[17]),'valueAddedRelativeSEPct':num(row[19]),'source':{'file':fn,'sheet':sheet,'row':ri}})
for y in [2017,2018,2019,2020,2021,2022]:
 fn='asm-state-2021.zip' if 2018<=y<=2021 else 'ec-'+str(y)+'.zip'
 with zipfile.ZipFile(io.BytesIO(source(fn))) as z:
  n=next(n for n in z.namelist() if n.endswith('.dat'));rows=csv.DictReader(io.StringIO(z.read(n).decode('utf-8-sig')),delimiter='|')
  vintage=2022 if y==2022 else 2017
  for ri,row in enumerate(rows,2):
   fips=row.get('ST');code=row.get('NAICS'+str(vintage),'');geo=row.get('GEO_ID',row.get('#GEO_ID',''))
   if fips not in ST or geo!='0400000US'+fips or row.get('YEAR')!=str(y) or not keep(code):continue
   def value(k):return None if row.get(k+'_F') in ['D','S','X','N'] else num(row.get(k))
   series.append({'stateFips':fips,'year':y,'naicsVintage':vintage,'naics':code,'industry':row.get('NAICS'+str(vintage)+'_LABEL',row.get('NAICS'+str(vintage)+'_TTL')),'shipmentsThousandUSD':value('RCPTOT'),'valueAddedThousandUSD':value('VALADD'),'rawShipments':row.get('RCPTOT'),'rawValueAdded':row.get('VALADD'),'shipmentsFlag':row.get('RCPTOT_F'),'valueAddedFlag':row.get('VALADD_F'),'shipmentsRelativeSEPct':num(row.get('RCPTOT_S')),'source':{'file':fn,'member':n,'line':ri,'GEO_ID':geo}})
tot={(x['stateFips'],x['year']):x for x in series if x['naics']=='31-33'}
for x in series:
 t=tot.get((x['stateFips'],x['year']),{})
 for v,o in [('shipmentsThousandUSD','shareOfStateShipmentsPct'),('valueAddedThousandUSD','shareOfStateValueAddedPct')]:
  x[o]=x[v]/t[v]*100 if x[v] is not None and t.get(v) is not None and t[v]>0 else None
write('data/us-state-manufacturing-series.json',{'schemaVersion':1,'source':'U.S. Census Bureau ASM 2014–2016/2018–2021, Economic Census 2017/2022','states':{k:{'sourceName':v[0],'name':v[1]} for k,v in ST.items()},'rows':series,'practice':'suppliedData','policy':'출하액 RCPTOT와 부가가치 VALADD를 각각 보존. 같은 해·주·지표 총계만 분모. 2012/2017/2022 NAICS 개정을 명시. 3361–3363 자동차와 3364 항공우주 구분, 336 상위 합계와 중복 합산 금지. 2027학년도 6월의 2024 생산액과 같은 지표라고 단정하지 않는다.'})

# Full source geometry is retained; generate only the requested US state and
# named-river geometries. Never infer a complete country list from low-res maps.
geo=json.loads(source('naturalearth-states.geojson'));ff=[f for f in geo['features'] if f['properties'].get('adm0_a3')=='USA' and f['properties'].get('name') in [v[0] for v in ST.values()]]
assert len(ff)==5
write('data/us-state-boundaries.geojson',{'type':'FeatureCollection','source':'Natural Earth 1:50m admin-1 states/provinces, public domain','features':ff})
river_names={'메콩강':['Mekong'],'이라와디강':['Irrawaddy','Ayeyarwady'],'짜오프라야강':['Chao Phraya'],'인더스강':['Indus'],'갠지스강':['Ganges'],'라인강':['Rhine'],'콩고강':['Congo'],'잠베지강':['Zambezi'],'나일강':['Nile']}
geo=json.loads(source('naturalearth-rivers.geojson'));ff=[]
for f in geo['features']:
 for ko,ens in river_names.items():
  if f['properties'].get('name') in ens or f['properties'].get('name_en') in ens:
   f['properties']['appRiverName']=ko;ff.append(f);break
write('data/river-mainstems.geojson',{'type':'FeatureCollection','source':'Natural Earth 1:10m rivers and lake centerlines, public domain','policy':'하천 도형만. 본류/지류/유역 국가의 완전한 목록을 도형에서 자동 승인하지 않는다. 지도 축척상의 일반화·분할을 유지한다.','features':ff})
write('data/river-mainstem-countries.json',{'schemaVersion':1,'rivers':{'메콩강':{'mainstemCountries':['중국','미얀마','라오스','타이','캄보디아','베트남'],'includesBoundarySections':True,'complete':True,'sourceFile':'mekong.html','publisher':'Mekong River Commission'},'라인강':{'mainstemCountries':['스위스','리히텐슈타인','오스트리아','독일','프랑스','네덜란드'],'includesBoundarySections':True,'complete':True,'sourceFiles':['rhine-waterworks.html','rhine-alpine.html'],'publisher':'IAWR / International Commission for the Protection of the Rhine','notMainstem':['룩셈부르크'],'note':'룩셈부르크는 유역·위원회 회원국과 본류 통과국을 혼동하지 않도록 별도로 둔다.'}},'unresolved':['이라와디강','짜오프라야강','인더스강','갠지스강','콩고강','잠베지강','나일강'],'practice':'suppliedData','policy':'complete:true는 해당 하천의 본류(국경 구간 포함)만. 미해결 하천의 지류·유역 국가를 임의로 true/false에 넣지 않는다.'})

# GaWC categories are categories, not a total ordinal ranking within each tier.
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.tokens=[]
 def handle_data(self,d):
  if d.strip():self.tokens.append(d.strip())
tiers=['Alpha++','Alpha+','Alpha','Alpha-','Beta+','Beta','Beta-','Gamma+','Gamma','Gamma-','High Sufficiency','Sufficiency'];gawc={}
for year in [2020,2022,2024]:
 text=source(f'gawc{year}.html').decode();cities={}
 sections=[]
 for m in re.finditer(r'<strong[^>]*>(.*?)</strong>',text,re.S):
  label=html.unescape(re.sub('<[^>]+>','',m[1])).strip()
  tier=next((t for t in tiers if re.sub(r'\s+','',t).lower()==re.sub(r'\s+','',label).lower()),None)
  if tier:sections.append((m.start(),m.end(),tier))
 for i,(_,start,tier) in enumerate(sections):
  end=sections[i+1][0] if i+1<len(sections) else len(text)
  segment=text[start:end].split('</main>')[0].split('>Contact</h2>')[0]
  for li in re.findall(r'<li[^>]*>(.*?)</li>',segment,re.S):
   city=html.unescape(re.sub('<[^>]+>','',li)).strip()
   if city:
    assert city not in cities,(year,city)
    cities[city]=tier
 assert len(cities)>250,(year,len(cities));gawc[str(year)]={'sourceFile':f'gawc{year}.html','cities':cities}
write('data/world-city-gawc.json',{'schemaVersion':1,'source':'Globalization and World Cities Research Network, Loughborough University','tiersHighToLow':tiers,'vintages':gawc,'practice':'suppliedData','policy':'동일 계층 안의 나열 순서는 서열이 아니다. 강의의 2025 기관 미상 순위와 섞지 않는다. 3개 판만으로 연간 8개 해 검증을 통과했다고 표현하지 않는다.'})
write('data/world-city-clues-round2.json',{'schemaVersion':1,'clues':cur['cityClues'],'capitalStatus':{'런던':True,'파리':True,'도쿄':True,'싱가포르':True,'뉴욕':False,'시드니':False},'capitalSourceBlockId':'L1-B1706','policy':'기존 장소명·좌표는 data/concepts/cities.json에서 연결. 원문 1690–1709의 특정 기관·계층 평균·개별 도시 조건을 지우지 않는다.'})

# Dar es Salaam: exact NOAA/WMO parameter 5, not (Tmax+Tmin)/2.
rows=list(csv.reader(io.StringIO(source('dar.csv').decode('utf-8-sig'))))
def parameter(code,calc):
 rr=next((r for r in rows if len(r)>=16 and r[0]=='63894' and r[1]==str(code) and r[2]==calc),None)
 return [num(x) for x in rr[4:16]] if rr else None
t=parameter(5,'Mean');p=parameter(1,'Sum');assert p and all(x is not None for x in p)
def jma_series(fn,station):
 text=source(fn).decode();plain=html.unescape(re.sub('<[^>]+>',' ',text))
 assert station in plain,(fn,'wrong station')
 rr=[]
 for tr in re.findall(r'<tr[^>]*>(.*?)</tr>',text,re.S|re.I):
  cells=[html.unescape(re.sub('<[^>]+>','',x)).strip() for x in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>',tr,re.S|re.I)]
  if len(cells)==3 and re.fullmatch(r'\d{2}',cells[0]):rr.append([int(cells[0]),num(cells[1]),num(cells[2])])
 assert [x[0] for x in rr]==list(range(1,13)),fn
 return {'monthlyMeanTemperatureC':[x[1] for x in rr],'monthlyPrecipitationMm':[x[2] for x in rr]}
assert '1991 - 2020' in source('jma-outline.html').decode()
dar=jma_series('jma-dar.html','DAR ES SALAAM');iquitos=jma_series('jma-iquitos.html','IQUITOS')
write('data/climate-normals-round2.json',{'schemaVersion':1,'stations':{'다르에스살람':{'wmoId':'63894','period':[1991,2020],'sourceFile':'jma-dar.html','periodSource':'jma-outline.html','climateGraph':all(x is not None for a in dar.values() for x in a),'lectureBlockId':'L1-B0494',**dar},'이키토스':{'wmoId':'84377','period':[1991,2020],'sourceFile':'jma-iquitos.html','periodSource':'jma-outline.html','climateGraph':True,'policy':'JMA 84377의 기온·강수를 함께 사용. 기존 San Roque/다른 관측소 강수와 결합하지 않는다.',**iquitos}},'metadata':{'아디스아바바':{'wmoId':'63450','nameInSource':'ADDIS ABABA-BOLE','elevationM':2354,'sourceFile':'jma-addis.html','verification':'같은 WMO 번호인 JMA 관측소 표기','policy':'다른 등록 시점/관측점의 2332·2355m를 혼합하지 않는다.'}},'partialCandidates':{'다르에스살람-NOAA':{'wmoId':'63894','coordinates':[39.2,-6.87],'elevationM':53,'period':[1991,2020],'monthlyPrecipitationMm':p,'monthlyMeanTemperatureC':t,'sourceFile':'dar.csv','climateGraph':False,'reason':'WMO CSV에는 parameter 5 월평균 기온이 없다. 최고·최저의 평균으로 채우지 않는다.'},'키토':{'climateGraph':False,'reason':'JMA n=84072가 WAKKANAI로 반환됨. INAMHI M0024와 다른 지점 자료를 합치지 않는다.'},'아부자':{'climateGraph':False,'reason':'JMA n=65125가 WAKKANAI로 반환됨. 12개 수치가 있다는 이유로 아부자 기온으로 채택하지 않는다.'}}})

def main():
 a=argparse.ArgumentParser();a.add_argument('--check',action='store_true');args=a.parse_args();bad=[]
 for name,text in OUT.items():
  p=R/name
  if args.check:
   if not p.exists() or p.read_text()!=text:bad.append(name)
  else:p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
 if bad:raise SystemExit('Out of date: '+', '.join(bad))
 print(json.dumps({'outputs':len(OUT),'climateClaims':len(cur['climateClaims']),'religionClaims':len(cur['religionClaims']),'manufacturingRows':len(series),'stateYears':len(tot),'riverSegments':len(ff),'gawcCities':{y:len(x['cities']) for y,x in gawc.items()}},ensure_ascii=False))
if __name__=='__main__':main()
