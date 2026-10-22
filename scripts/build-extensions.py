#!/usr/bin/env python3
"""Rebuild R2-R9 concepts and country facts from pinned JSON sources (stdlib).

python3 scripts/build-extensions.py [--check]
The source block locator is authoritative. A page number is never guessed.
"""
import argparse, copy, hashlib, json, re
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'data/extension-sources'
def read(name): return json.loads((SRC/name).read_text())
def encoded(d): return json.dumps(d,ensure_ascii=False,indent=1,allow_nan=False)+'\n'
BLOCKS=read('lecture-blocks.json'); B={x['id']:x for x in BLOCKS}
C=read('curation.json')
LOC=read('location-items.json')
EXAM_LINKS=read('lecture-exam-links.json')['links']
OUT={}
def write(name,data): OUT[name]=encoded(data)
def ref(bid,row=None,column=None):
    b=B[bid]
    return {'kind':'lecture','volume':b['volume'],'section':b['section'],
            'blockId':bid,**({'tableRow':row} if row else {}),
            **({'tableColumn':column} if column else {}),
            'locator':f"강의 {b['volume']}권 {b['section']} / {bid}"+ (f' / 표 {row}행' if row else ''),
            'priorAuditExamIds':EXAM_LINKS.get(bid,[])}

def place_for(name):
    # Never invent a point: only an exact existing name or an explicit alias.
    aliases={'할롱 베이':'할롱베이','구이린':'구이린','그랑 칭기':'그랑 칭기',
             '람사르 협약':'람사르','런던 협약':'런던','몬트리올 의정서':'몬트리올',
             '바젤 협약':'바젤','교토 의정서':'교토','파리 협정':'파리'}
    key=aliases.get(name,name)
    for item in LOC:
        if item.get('name')!=key: continue
        g=item.get('geometry',{})
        if g.get('type')=='point' and g.get('lon') is not None and g.get('lat') is not None:
            return [g['lon'],g['lat']],{'kind':'existingLocation','id':item['id'],'name':item['name'],'source':item.get('source')}
    return None,None

concepts={}
def domain(name):
    if name not in concepts:
        concepts[name]={'schemaVersion':1,'about':name+' 강의 근거 개념 카드',
            'policy':{'absenceMeansFalse':False,'falseDistractors':'명시적 거짓 statements만 사용. complete:false인 세트의 교차 대입 금지.',
                'sourceLocator':'data/extension-sources/lecture-blocks.json의 blockId; 쪽수 미측정',
                'scope':'개념 카드이며 기출 재현율 또는 화면 연결 완료를 뜻하지 않는다.'},
            'entities':{},'sets':{},'statements':[]}
    return concepts[name]
def entity(d,name,typ,bid):
    if not name or name in {'None','구분','대상'}: raise ValueError(name)
    p,ps=place_for(name)
    e=d['entities'].setdefault(name,{'type':typ,'place':p,'source':ref(bid),'sourceRefs':[]})
    if ps:e['placeSource']=ps
    if ref(bid) not in e['sourceRefs']: e['sourceRefs'].append(ref(bid))
    return e
def prop(d,key,label,name,value,bid,ri,ci):
    if not value: return
    # Blank cells are unknown. Multi-valued prose is one scoped source value,
    # not an exhaustive inventory of the real world.
    s=d['sets'].setdefault(key,{'label':label,'template':'{value}',
        'exclusive':False,'complete':False,'options':[],'values':{},'evidence':{},'source':ref(bid)})
    if value not in s['options']:s['options'].append(value)
    s['values'].setdefault(name,[])
    if value not in s['values'][name]:s['values'][name].append(value)
    s['evidence'].setdefault(name,[]).append({'value':value,'source':ref(bid,ri,ci)})

for spec in C['tables']:
    bid=spec['source'];b=B[bid];rows=b['rows'];d=domain(spec['domain'])
    if spec.get('singleEntity'):
        name=spec['singleEntity'];entity(d,name,spec['type'],bid)
        for ri,row in enumerate(rows[1:],2):
            for ci,val in enumerate(row[1:],2):
                prop(d,f'{bid}-r{ri}-c{ci}',row[0]+' / '+rows[0][ci-1],name,val,bid,ri,ci)
    elif spec['transpose']:
        for ci,name in enumerate(spec['names'],1):
            entity(d,name,spec['type'],bid)
            for ri,row in enumerate(rows[1:],2):
                if ci<len(row):prop(d,f'{bid}-r{ri}',row[0],name,row[ci],bid,ri,ci+1)
    else:
        for ri,row in enumerate(rows[1:],2):
            ec=spec.get('entityColumn',0)
            original_name=row[ec]
            name=(spec.get('names') or {}).get(original_name,original_name) if isinstance(spec.get('names'),dict) else original_name
            if name in spec.get('skip',[]):continue
            entity(d,name,spec['type'],bid)
            for ci,val in enumerate(row,1):
                if ci==ec+1:continue
                label=rows[0][ci-1] if ci<=len(rows[0]) else f'속성{ci}'
                prop(d,f'{bid}-c{ci}',label,name,val,bid,ri,ci)

for spec in C['passages']:
    d=domain(spec['domain']);bid=spec['source'];name=spec['name']
    entity(d,name,spec['type'],bid)
    d['statements'].append({'id':f'{spec["domain"]}-{bid}-{len(d["statements"])+1}',
        'about':[name],'claim':B[bid]['text'],'truth':True,'source':ref(bid),
        'practice':'sourceReading','exhaustive':False})

for x in C.get('explicitStatements',[]):
    d=domain(x['domain'])
    d['statements'].append({'id':x['id'],'about':x['about'],'claim':x['claim'],
        'truth':x['truth'],'source':ref(x['sourceBlockId']),'practice':'recall',
        'explanation':B[x['sourceBlockId']]['text']})

extra=read('supplementary-curation.json')
write('data/concepts/geographic-information-supplement.json',{'schemaVersion':1,
    'about':'요청서 R9의 버퍼 분석 보완','entities':{'버퍼 분석':{'type':'concept','place':None,'source':extra['buffer']}},
    'sets':{},'statements':[{'id':'buffer-distance','about':['버퍼 분석'],
        'claim':extra['buffer']['summary'],'truth':True,'source':extra['buffer'],'practice':'suppliedData'}]})
write('data/concepts/environment-supplement.json',{'schemaVersion':1,
    'about':'생물 다양성 협약의 채택과 서명 개방 구별','entities':{'생물 다양성 협약':{'type':'treaty','place':None,'source':extra['cbd']}},
    'sets':{},'statements':[{'id':'cbd-distinct-events','about':['생물 다양성 협약'],
        'claim':'생물 다양성 협약은 1992년 나이로비에서 채택되고 리우데자네이루에서 서명에 개방되었다.',
        'truth':True,'source':extra['cbd'],'practice':'suppliedData'}]})

# Existing OX items retain their ORIGINAL claim, period, and supplied data.
# A historical statistical fact cannot become a timeless new recall question.
topic_domain={'energy':'energy','trade':'industry','population':'cities',
              'religion':'religion','climate':'climate','landform':'landforms','environment':'environment'}
for x in read('existing-ox.json')['items']:
    if x['topic'] not in topic_domain:continue
    d=domain(topic_domain[x['topic']])
    statistical=bool(re.search(r'\d{4}년|\d{4}학년도|%|생산량|소비량|세계 최대|세계 1위|신자 수|비중|인구수|인구 수',x.get('originalClaim',x['claim'])))
    d['statements'].append({'id':'existing-'+x['id'],'about':[],
        'claim':x.get('originalClaim',x['claim']),'truth':x['answer'],
        'explanation':x['explain'],'source':{'kind':'existingAuditedOX','id':x['id'],'locator':x['source']},
        'period':x.get('period'),'practice':'suppliedData' if statistical else x.get('practice','sourceReading'),
        **({'given':x['given']} if 'given' in x else {})})

# Retain the original incomplete facts, merge verified additions per value.
facts=read('entity-facts.json')
facts['schemaVersion']=2
for x in C['facts']:
    s=facts['facts'].setdefault(x['kind'],{'label':x['kind'],'complete':False,
        'source':'강의 개별 근거는 evidence 참조','values':{}})
    s.setdefault('template','{value}와 연결된다')
    s['exclusive']=False;s['complete']=False
    s['source']='개별 근거는 evidence 참조'
    s['values'].setdefault(x['country'],[])
    if x['value'] not in s['values'][x['country']]:s['values'][x['country']].append(x['value'])
    s.setdefault('evidence',{}).setdefault(x['country'],[]).append({'value':x['value'],'source':ref(x['source'])})
facts['facts'].setdefault('ethnicity',{'label':'인구 집단','complete':False,'values':{},
    'policy':'강의가 정확한 최다 집단을 고정하지 않은 국가는 given 자료로만 다룬다.'})
facts['ethnicityGiven']={'source':ref('L1-B1250'),'rows':B['L1-B1250']['rows'],
    'practice':'suppliedData','policy':'광역 경향을 국가별 최다 집단으로 변환하지 않는다.'}
for key,s in C.get('datedFactSets',{}).items():
    s=copy.deepcopy(s)
    s['evidence']={country:[{'value':v,'source':s['source']} for v in vs] for country,vs in s['values'].items()}
    facts['facts'][key]=s
write('data/entity-facts.json',facts)
write('data/entity-facts-supplement.json',read('country-language-supplement.json'))

# Backwards-compatible data module. Existing IDs and fields stay intact;
# only explicit, source-supported R9 OX statements are appended.
ox=read('existing-ox.json')
ox['topics'] += [{'id':'oldmaps','name':'고지도','lecture':'1권 P01'},
                 {'id':'geographic-information','name':'GIS·지리 정보','lecture':'1권 P01'}]
for x in C.get('explicitStatements',[]):
    b=B[x['sourceBlockId']]
    ox['items'].append({'id':'r9-'+x['id'],'topic':x['domain'],
        'claim':x['claim'],'originalClaim':x['claim'],'answer':x['truth'],
        'explain':b['text'],'source':ref(b['id'])['locator'],'period':'개념',
        'practice':'recall','auditStatus':'lecture-explicit'})
# Repository additions (2026-10-22): statements taken from lecture table cells of the concept
# cards, so each new topic mixes true and false items (tests/fact-statements.test.cjs).
ox['items'] += json.loads((ROOT/'data/ox-cards-20261022.json').read_text())['items']
OUT['assets/fact-statements.js']="/* Existing OX + source-bound R9 additions + repository card items. Generated by scripts/build-extensions.py. */\n(function(root){var api="+json.dumps(ox,ensure_ascii=False,separators=(',',':'))+";if(typeof module==='object'&&module.exports)module.exports=api;else root.WGFacts=api;})(typeof globalThis!=='undefined'?globalThis:this);\n"

# Country clues preserve source wording and report eligibility explicitly.
codes=dict(re.findall(r'"([^\"]+)":\{"code":"([A-Z]{3})"',(SRC/'country-boundaries.js').read_text()))
names=sorted(set(codes)|set(C['requestedCountries']),key=lambda s:(-len(s),s))
def mentions(text):
    found=[];s=text
    for name in names:
        pattern=re.escape(name)+r'(?![가-힣A-Za-z])' if name in {'인도','이란','오만','칠레'} else re.escape(name)
        # Postpositions must remain matchable; only specific collisions are masked.
        if name=='인도':pattern=r'인도(?!네시아|양|차이나)'
        if re.search(pattern,s):found.append(name);s=re.sub(pattern,'§',s)
    return found
clues=defaultdict(list)
for b in BLOCKS:
    if b['section'] not in {'P00','P04','P05','P07','P08','P10'} or b['kind']!='paragraph' or len(b['text'])<45:continue
    ms=mentions(b['text'])
    if not ms:continue
    for country in ms:
        # Clues with multiple countries are evidence reading, not ambiguous
        # identification prompts. This gate is separate from a source citation.
        eligible=len(ms)==1 and not re.search(r'\d{4}년|\d{4}학년도|\(가\)|\(나\)|\(다\)',b['text'])
        clues[country].append({'id':country+'-'+b['id'],'text':b['text'],
            'source':ref(b['id']),'factsMentioned':ms,'eligibleIdentification':eligible,
            'prompt':b['text'].replace(country,'이 국가') if eligible else None,
            'factSets':[key for key,s in facts['facts'].items() if country in s.get('values',{})]})
    for si,sentence in enumerate(re.split(r'(?<=[.!?])\s+',b['text'])):
        cm=mentions(sentence)
        if len(cm)!=1 or sentence==b['text'] or len(sentence)<30:continue
        country=cm[0]
        eligible=not re.search(r'\d{4}년|\d{4}학년도|\(가\)|\(나\)|\(다\)',sentence)
        clues[country].append({'id':country+'-'+b['id']+'-s'+str(si),
            'text':sentence,'source':ref(b['id']),'factsMentioned':cm,
            'eligibleIdentification':eligible,'exactSourceSentence':True,
            'prompt':sentence.replace(country,'이 국가') if eligible else None,
            'factSets':[key for key,s in facts['facts'].items() if country in s.get('values',{})]})
for i,x in enumerate(C.get('manualClues',[])):
    country=x['country'];assert x['text'] in B[x['source']]['text']
    clues[country].append({'id':country+'-curated-'+str(i),'text':x['text'],
        'source':ref(x['source']),'factsMentioned':mentions(x['text']),
        'eligibleIdentification':True,'exactSourceSentence':True,
        'prompt':x.get('prompt',x['text'].replace(country,'이 국가')),
        'candidatePool':x['candidates'],'practice':x['practice'],
        'requiresGiven':x['practice']=='suppliedData',
        **({'given':x['given']} if 'given' in x else {}),
        'factSets':[k for k,s in facts['facts'].items() if country in s.get('values',{})]})
country_report={c:{'evidencePassages':len(clues[c]),'eligibleIdentification':sum(x['eligibleIdentification'] for x in clues[c]),
                   'mapped':c in codes} for c in C['requestedCountries']}
write('data/country-clues.json',{'schemaVersion':1,'policy':'원문 그대로 보존. eligibleIdentification:true만 단독 국가 식별에 사용.',
    'countries':dict(sorted(clues.items())),'requestedCountryCoverage':country_report})

# Place cards use exactly the app's recorded point and country, cross-linked to
# a lecture occurrence. Representative area geometry is never guessed as a point.
for item in LOC:
    name=item.get('name','')
    if not name or len(name)<2 or any(x in name for x in [' / ',' → ','–']):continue
    refs=[b for b in BLOCKS if b['section']=='P03' and name in b['text']]
    if not refs or not item.get('geometry'):continue
    if item['geometry'].get('kind')=='country':continue
    d=domain('landform-places');e=entity(d,name,'place',refs[0]['id'])
    e['geometry']=item['geometry']
    e['existingLocationId']=item['id']
    if item.get('country'):e['country']=item['country']
    e['sourceRefs']=[ref(b['id']) for b in refs]
    e['lectureExcerpts']=[{'text':b['text'],'source':ref(b['id'])} for b in refs]

# No guessed signs or orders are injected into the existing engine's whitelist.
# R2 numerical candidates are built and tested by build-statistics.py.
for name,d in concepts.items():
    split={'메카·메디나':['메카','메디나'],'바라나시·갠지스강':['바라나시','갠지스강'],
           '로마·바티칸':['로마','바티칸']}
    for en,e in d['entities'].items():
        matches=[x for x in LOC if x.get('name') in split.get(en,[en]) and x.get('geometry')]
        linked=[];seen=set()
        for x in matches:
            if x['id'] in seen:continue
            seen.add(x['id'])
            linked.append({'id':x['id'],'name':x['name'],'geometry':x['geometry'],
                'source':'data/extension-sources/location-items.json'})
        if linked:e['linkedLocations']=linked
    d['counts']={'entities':len(d['entities']),'sets':len(d['sets']),'statements':len(d['statements'])}
    write(f'data/concepts/{name}.json',d)
report={'generatedAt':'2026-10-22','counts':{k:v['counts'] for k,v in concepts.items()},
    'countryFacts':len(C['facts']),'countryClues':sum(len(v) for v in clues.values()),
    'requestedCountryCoverage':country_report,
    'sourcePolicy':'원표 셀과 원문을 보존. 판정 미확정 값은 별도 보류.',
    'notes':C['notes']}
write('audit/extensions-build-20261022.json',report)

def main():
    check=argparse.ArgumentParser();check.add_argument('--check',action='store_true');a=check.parse_args()
    bad=[]
    for name,text in OUT.items():
        p=ROOT/name
        if a.check:
            if not p.exists() or p.read_text()!=text:bad.append(name)
        else:p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
    if bad:raise SystemExit('Out of date: '+', '.join(bad))
    print(json.dumps({'files':len(OUT),'conceptEntities':sum(len(v['entities']) for v in concepts.values()),
        'countryClues':report['countryClues']},ensure_ascii=False))
if __name__=='__main__':main()
