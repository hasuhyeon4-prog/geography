#!/usr/bin/env python3
"""Rebuild the follow-up data from pinned snapshots, using only the stdlib.

New files only. No engine, UI, existing data, or generated entity KB is changed.
"""
import argparse,csv,hashlib,io,json,math,re,zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1]
Z=zipfile.ZipFile(R/'data/round3-source-snapshots.zip');OUT={}
def src(n):return Z.read(n)
def js(n):return json.loads(src(n))
def out(n,v):OUT[n]=json.dumps(v,ensure_ascii=False,indent=1,allow_nan=False)+'\n'
def number(v,flag=''):
 if flag.strip():return None
 try:x=float(v)
 except (ValueError,TypeError):return None
 return x if math.isfinite(x) else None
def ratio(v,d):return None if v is None or d is None or d<=0 else v/d*100
def xlsx_rows(blob,sheet):
 z=zipfile.ZipFile(io.BytesIO(blob));ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 strings=[''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in z.namelist() else []
 book=ET.fromstring(z.read('xl/workbook.xml'));rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
 rid=next(n.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'] for n in book.find('s:sheets',ns) if n.attrib['name']==sheet)
 target=next(n.attrib['Target'] for n in rels if n.attrib['Id']==rid);p=target.lstrip('/') if target.startswith('/') else 'xl/'+target
 for _,row in ET.iterparse(io.BytesIO(z.read(p)),events=['end']):
  if not row.tag.endswith('}row'):continue
  vals={}
  for c in row:
   if not c.tag.endswith('}c'):continue
   k=0
   for ch in re.match('[A-Z]+',c.attrib['r'])[0]:k=k*26+ord(ch)-64
   v=c.find('s:v',ns);t=c.get('t')
   vals[k-1]=''.join(c.find('s:is',ns).itertext()) if t=='inlineStr' else None if v is None else strings[int(v.text)] if t=='s' else v.text if t in ['str','e'] else number(v.text)
  if vals:yield int(row.attrib['r']),[vals.get(i) for i in range(max(vals)+1)]
  row.clear()

C=js('reviewed.json');E=js('lecture-selected.json');B={x['id']:x for x in E['blocks']};P=js('app-places-selected.json')['items']
ST={'06':'캘리포니아','39':'오하이오','48':'텍사스','26':'미시간','53':'워싱턴주'}
keep=lambda c:c=='31-33' or len(c)==3 or c in ['3361','3362','3363','3364']
# Census AIES: 2017 NAICS, not 2022 NAICS. Geography must be the full state.
rows=[]
for y in [2023,2024]:
 fn=f'aies-{y}.zip'
 with zipfile.ZipFile(io.BytesIO(src(fn))) as z:
  rr=csv.DictReader(io.StringIO(z.read('AIES31BASIC02.dat').decode('utf-8-sig')),delimiter='|')
  for line,r in enumerate(rr,2):
   fips=r['ST'];code=r['NAICS2017']
   if fips not in ST or r['#GEO_ID']!='0400000US'+fips or r['YEAR']!=str(y) or not keep(code):continue
   rows.append({'stateFips':fips,'state':ST[fips],'year':y,'naicsVintage':2017,'naics':code,'industry':r['NAICS2017_LABEL'],
    'shipmentsThousandUSD':number(r['RCPT_TOT_VAL'],r['RCPT_TOT_VAL_F']),'valueAddedThousandUSD':number(r['VALUE_ADDED_DVAL'],r['VALUE_ADDED_DVAL_F']),
    'rawShipments':r['RCPT_TOT_VAL'],'shipmentsFlag':r['RCPT_TOT_VAL_F'],'rawValueAdded':r['VALUE_ADDED_DVAL'],'valueAddedFlag':r['VALUE_ADDED_DVAL_F'],
    'shipmentsCVPct':number(r['RCPT_TOT_CV'],r['RCPT_TOT_CV_F']),
    'source':{'file':fn,'member':'AIES31BASIC02.dat','line':line,'GEO_ID':r['#GEO_ID']}})
tot={(r['stateFips'],r['year']):r for r in rows if r['naics']=='31-33'}
for r in rows:
 d=tot[r['stateFips'],r['year']];r['shareOfStateShipmentsPct']=ratio(r['shipmentsThousandUSD'],d['shipmentsThousandUSD']);r['shareOfStateValueAddedPct']=ratio(r['valueAddedThousandUSD'],d['valueAddedThousandUSD'])
out('data/us-state-manufacturing-aies-2023-2024.json',{'schemaVersion':1,'source':'U.S. Census Bureau AIES31BASIC02, reference years 2023/2024','states':ST,'unit':'thousand current USD','rows':rows,'practice':'suppliedData','policy':{'missingIsZero':False,'mergeBy':['stateFips','year','naicsVintage','naics','measure'],'transition':'AIES replaces ASM; sample linking is documented in aies-methodology2023.pdf, PDF page 11. Preserve survey and NAICS vintages. These files retain the separately pinned annual releases.','2023Revision':'The 2024 release notes historical revisions to 2023; a future revised 2023 snapshot must be a new vintage, not silently substituted.','sourceFor2027Q5':False,'sourceFor2027Q5Reason':'The 2024 AIES release is dated 2026-09-03, after the 2026-06 examination. Same reference year does not prove provenance.'}})
# BEA GDP is VALUE ADDED, a different measure from Census shipments. Keep the
# full manufacturing denominator and mutually exclusive leaf industries.
bea=[];leaf=[*range(14,25),*range(26,34)]
for abbr,fips in [('CA','06'),('OH','39'),('TX','48'),('MI','26'),('WA','53')]:
 fn=next(n for n in Z.namelist() if n.startswith('SAGDP2_'+abbr+'_') and n.endswith('.csv'))
 for line,r in enumerate(csv.DictReader(io.StringIO(src(fn).decode('utf-8-sig')),skipinitialspace=True),2):
  if str(r.get('LineCode','')).strip() not in {str(c) for c in [12]+leaf}:continue
  assert r['GeoFIPS'].strip().strip('"')==fips+'000'
  assert r['Unit']=='Millions of current dollars'
  for y in range(2013,2026):
   bea.append({'stateFips':fips,'state':ST[fips],'year':y,'lineCode':int(r['LineCode']),'classificationAsPublished':r['IndustryClassification'].strip(),'industry':r['Description'].strip(),'valueAddedMillionUSD':number(r[str(y)]),'rawValue':r[str(y)],'source':{'file':fn,'line':line,'column':str(y)}})
btot={(r['stateFips'],r['year']):r['valueAddedMillionUSD'] for r in bea if r['lineCode']==12}
for r in bea:r['shareOfManufacturingValueAddedPct']=ratio(r['valueAddedMillionUSD'],btot[r['stateFips'],r['year']])
out('data/us-state-manufacturing-bea-value-added.json',{'schemaVersion':1,'source':'U.S. BEA SAGDP2, annual current-dollar GDP by state and industry, downloaded 2026-10-23','unit':'million current USD','years':[2013,2025],'states':ST,'rows':bea,'practice':'suppliedData','recallEligible':False,'policy':{'measure':'GDP/value added, not shipments, gross output, or total sales','denominatorLineCode':12,'mutuallyExclusiveLeafLineCodes':leaf,'motorVehiclesLineCode':21,'motorVehiclesScope':'motor vehicles, bodies, trailers, and parts as published; not Census 3361 alone','otherTransportLineCode':22,'otherTransportScope':'other transportation equipment as published; broader than aerospace 3364','exam2027Q5SourceConfirmed':False,'examProvenance':'The six displayed category names align closely with this classification, but the original question does not cite a publisher or define production value. Current revised 2024 percentages are NOT the question given.','noAutomaticReplacement':'Never fill Census suppressed shipment cells with BEA GDP. Do not combine current-dollar values with chained-dollar GDP.'}})
# Positive city-to-state facts, quoted lecture evidence plus Census place identity.
with zipfile.ZipFile(io.BytesIO(src('census-places-2025.zip'))) as z:
 gaz=list(csv.DictReader(io.StringIO(z.read('2025_Gaz_place_national.txt').decode('utf-8-sig')),delimiter='|'))
entities={};statevals={};identity=[]
for ko,en,abbr,state,bid in C['cityStates']:
 place=P[ko];g=place['geometry'];refs=[{'file':'lecture-selected.json','blockId':bid,'volume':B[bid]['volume'],'section':B[bid]['section']}]
 if en:
  hit=[r for r in gaz if r['USPS']==abbr and r['NAME']==en];assert len(hit)==1
  refs.append({'file':'census-places-2025.zip','member':'2025_Gaz_place_national.txt','GEOID':hit[0]['GEOID'],'USPS':abbr,'placeName':en})
 entities[ko]={'type':'industrialRegion' if ko=='실리콘 밸리' else 'city','place':[g['lon'],g['lat']],'source':{'kind':'lecture','volume':2,'section':'P08','blockId':bid,'locator':'강의 2권 P08 / '+bid},'sourceRefs':refs,'appPlaceId':place['id'],'placeSource':{'file':'index.html','id':place['id'],'snapshot':'app-places-selected.json','rule':'현재 auditData/contentData에 geometryData의 좌표 재정의를 적용한 값'}};statevals[ko]=[state]
 identity.append({'city':ko,'state':state,'usps':abbr,'censusPlace':en,'place':[g['lon'],g['lat']],'sourceRefs':refs})
out('data/concepts/us-city-states.json',{'about':'강의에 등장한 미국 7개 도시와 실리콘 밸리의 소속 주. 좌표는 기존 위치 모드를 그대로 사용.','entities':entities,'sets':{'state':{'label':'소속 주','template':'{value}에 위치한다','exclusive':True,'complete':True,'options':sorted(set(v[0] for v in statevals.values())),'values':statevals,'source':'강의 2권 P08 선택 블록 및 Census 2025 places','completeScope':'Only the eight named entities; not a complete list of cities in each state.'}},'statements':[],'identityAudit':identity})
toronto=P['토론토'];g=toronto['geometry'];original=B['L1-B1673']['text'];sentence=next(x.strip()+'다.' for x in original.split('다.') if '토론토는' in x)
out('data/toronto-clues-round3.json',{'schemaVersion':1,'city':'토론토','place':[g['lon'],g['lat']],'appPlaceId':toronto['id'],'verbatim':sentence,'clueWithoutName':sentence.replace('토론토는 ',''),'source':{'file':'lecture-selected.json','blockId':'L1-B1673','volume':1,'section':'P05'},'policy':'단서 문장이 없다는 상태를 보완. 온타리오호와 캐나다를 설명에 제시하면 그 사실을 다시 회상 보기로 묻지 않는다. 토론토를 수도나 최상위 도시로 추가하지 않는다.'})
h=C['hierarchy2016'];metric=[('headquarters','다국적 기업 본사 수','많음','적음'),('producerServicesShare','생산자 서비스업 비중','높음','낮음'),('nearestSameTierDistance','가장 인접한 동일 계층 도시까지 거리','멀음','가까움')]
sets={}
for key,label,top,low in metric:
 sets[key]={'label':label,'template':'계층 평균의 '+label+'을 비교하면 ‘{value}’에 해당한다','exclusive':True,'complete':True,'completeScope':'Only the two named tier-average entities in this card. No city-level inference.','options':[top,low],'values':{'최상위 세계 도시':[top],'하위 세계 도시':[low]},'source':'2016학년도 6월 13번 및 강의 1권 P05 L1-B1695','scope':'계층 평균의 상대 비교만. 특정 도시 쌍의 실측 비교가 아니다.'}
out('data/concepts/world-city-hierarchy.json',{'about':'기출의 최상위·하위 세계 도시 계층 평균 비교. GaWC 도시별 등급과 별개.','entities':{k:{'type':'cityTier','place':None,'source':'2016학년도 6월 13번'} for k in ['최상위 세계 도시','하위 세계 도시']},'sets':sets,'statements':[],'examGiven':h,'policy':'숫자 계층표를 창작하지 않는다. 뉴욕·런던·도쿄는 이 문항의 대표 기준점이며 다른 기관·판본의 등급을 강제로 맞추지 않는다.'})
out('data/exam-given-round3.json',{'schemaVersion':1,'practice':'suppliedData','forms':[C['exam2027'],h],'policy':'수치 없는 원그림의 막대 길이·축을 정확한 백분율/점수로 바꾸지 않는다. 선택 문항 그림은 원자료 ZIP에 보존.'})
# Raw suppression review from the later 2016 tabulation, retaining every flag.
old=[]
with zipfile.ZipFile(io.BytesIO(src('asm-area-2016.zip'))) as z:
 for line,r in enumerate(csv.DictReader(io.StringIO(z.read('ASMAREA2012.dat').decode()),delimiter='|'),2):
  if r['ST'] not in ['06','53'] or r['GEO_ID']!='0400000US'+r['ST'] or r['NAICS2012'] not in ['3361','3364'] or r['YEAR'] not in ['2014','2015']:continue
  old.append({'state':ST[r['ST']],'stateFips':r['ST'],'year':int(r['YEAR']),'naics':r['NAICS2012'],'shipmentsThousandUSD':number(r['RCPTOT'],r['RCPTOT_F']),'rawShipments':r['RCPTOT'],'shipmentsFlag':r['RCPTOT_F'],'valueAddedThousandUSD':number(r['VALADD'],r['VALADD_F']),'rawValueAdded':r['VALADD'],'valueAddedFlag':r['VALADD_F'],'source':{'file':'asm-area-2016.zip','member':'ASMAREA2012.dat','line':line}})
base=json.loads((R/'data/us-state-manufacturing-series.json').read_text())['rows'];combined=base+rows
checks=[]
for other in ['06','48','26']:
 values=[]
 for y in range(2016,2025):
  a=next((r for r in combined if r['stateFips']=='53' and r['year']==y and r['naics']=='3364'),None);b=next((r for r in combined if r['stateFips']==other and r['year']==y and r['naics']=='3364'),None)
  av=a['shareOfStateShipmentsPct'] if a else None;bv=b['shareOfStateShipmentsPct'] if b else None
  values.append({'year':y,'WashingtonSharePct':av,'otherSharePct':bv,'greater':None if av is None or bv is None else av>bv})
 checks.append({'higher':'워싱턴주','lower':ST[other],'metric':'share of shipments, NAICS 3364','years':values,'completeYears':sum(v['greater'] is not None for v in values),'allGreater':all(v['greater'] is True for v in values),'basis':'기존 허용 목록 L2-B0705에 있는 쌍만 검토. 오하이오와의 새 회상 관계는 만들지 않음.'})
candidate=[]
for fips in ['06','48','53','26']:
 r={x['lineCode']:x for x in bea if x['stateFips']==fips and x['year']==2024};v={k:r[c]['shareOfManufacturingValueAddedPct'] for k,c in [('컴퓨터 및 전자 제품',19),('화학 제품',32),('기타 운송 장비',22),('석유 및 석탄 제품',31),('자동차 및 부품',21)]};v['기타']=None if any(x is None for x in v.values()) else 100-sum(v.values());candidate.append({'state':ST[fips],'referenceYear':2024,'source':'current revised BEA SAGDP2 snapshot, not question given','percentages':v})
out('data/us-manufacturing-gap-review.json',{'schemaVersion':1,'suppressionIn2016Release':old,'suppressionConclusion':'워싱턴주 3364의 2014·2015 출하액은 후속 2016 발표판에도 D. 2015 부가가치는 공개되어 있어도 출하액 대체 불가. 자동차 3361 비공개 값은 계속 null.','aies2023and2024':'공개된 항공 우주 출하액이 추가되어, 기존 2016~2022와 합치면 9개 연도 방향을 검토할 수 있다. 공식 AIES 표본 연결 방법과 분류 판본을 함께 보존. 기존 엔진의 7개년 예외는 이 묶음에서 자동 수정하지 않는다.','aerospaceDirectionChecks':checks,'exam2027Q5':{'originalPublisherConfirmed':False,'originalMeasureConfirmed':False,'candidate':'BEA manufacturing value-added composition','evidence':'범례가 BEA 업종명과 대응하고 주별 구성 패턴이 유사함. 이것만으로 원출처나 원판본을 확정할 수 없음.','candidateData':candidate,'rejectedSubstitution':'2024 AIES는 시험 이후인 2026-09-03 발표. 현재 BEA 개정 수치와 Census 출하액 모두 기출 given을 덮어쓰지 않음.'},'ohioJointExamEvidence':{'status':'notEstablished','reviewed':['강의 L2-B0694~0706','2016학년도 9월 7번의 강의 연결','2027학년도 6월 5번 원문'],'finding':'확인한 두 제조업 자료는 오하이오·캘리포니아·텍사스와 캘리포니아·텍사스·워싱턴주·미시간으로 서로 다름. 전체 구기출 원문을 전수 확인한 부재 증명은 아님.','policy':'오하이오–미시간/워싱턴주의 새 회상 관계는 계속 보류.'}})
# Original Nigeria XLSX proves that the published January mean duplicates its
# maximum. Preserve that source value, but do not silently "repair" it.
ar={i:r for i,r in xlsx_rows(src('nigeria-normals-actual.xlsx'),'Abuja_65125')};mean=ar[59][4:16];mx=ar[41][4:16];mn=ar[50][4:16]
assert mean[0]==mx[0] and mean[0]>mn[0]
out('data/climate-quality-review-round3.json',{'schemaVersion':1,'Abuja':{'stationWmo':'65125','normalPeriod':'1991–2020','sourceFile':'nigeria-normals-actual.xlsx','sheet':'Abuja_65125','sourceCells':{'mean':'E59:P59','meanDailyMaximum':'E41:P41','meanDailyMinimum':'E50:P50','metadata':'A10:D10'},'publishedMeanC':mean,'publishedMeanDailyMaximumC':mx,'publishedMeanDailyMinimumC':mn,'approvedMeanC':[None]+mean[1:],'approvedForCompleteClimateGraph':False,'finding':'1월 월평균 E59가 월평균 일최고 E41과 소수점 끝까지 동일. 2~12월은 원표상 최고·최저의 중간값이나 1월만 그렇지 않다. 원본 XLSX도 같은 값이라 단순 CSV 변환 문제가 아님.','action':'의심 1월을 null로 유지. 최고·최저를 평균하여 1월 값을 창작하거나 연평균 28.0으로 정당화하지 않는다. 완전 관측소로 연결하지 않는다.'},'Quito':{'status':'held','finding':'확인한 NCEI 6.6 Ecuador CSV 목록은 RUMIPAMBASALCEDO_84143 한 지점. 키토 M0024와 다름. 공항·다른 지점의 강수로 대체하지 않음.','sourceFile':'ecuador-csv-index.html'}})
out('data/river-mainstem-countries-round3.json',{'schemaVersion':1,'rivers':C['rivers'],'held':C['heldRivers'],'practice':'suppliedData','policy':{'recallEligible':False,'scope':'이름 붙은 본류 통과와 국경 구간을 포함. 지류·유역 회원국은 별도. 각 river.scope를 반드시 함께 사용.','absenceMeansFalse':False,'completenessDoesNotAuthorizeRecall':'completeForScope는 명시한 본류 범위에 대한 목록 완전성 검토. 강의·기출이 묻지 않은 국가 쌍의 회상 허용과 다름.','previousData':'메콩·라인의 검토 목록과 9개 강의 Natural Earth 10m 중심선은 2차 제공분 유지. 이번 파일은 새 5개 강만 추가.','ambiguousCountries':'basinOnlyOrTributaryUncertain 목록은 본류라고 단정하지 말라는 경계 목록. 별도 원문 근거 없이 부정 사실 회상으로 바꾸지 않는다.'}})

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args();bad=[]
 for n,v in OUT.items():
  p=R/n
  if args.check:
   if not p.exists() or p.read_text()!=v:bad.append(n)
  else:p.parent.mkdir(exist_ok=True,parents=True);p.write_text(v)
 if bad:raise SystemExit('Regeneration mismatch: '+', '.join(bad))
 print(('Verified' if args.check else 'Wrote'),len(OUT),'round-three data files')
