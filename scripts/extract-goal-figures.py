"""Extract only approved figure panels, never lecture prose or source documents.
Usage: CODEX_PRIMARY_RUNTIME_PYTHON scripts/extract-goal-figures.py PRIVATE_DOCX_DIR
"""
from pathlib import Path
import hashlib,io,json,sys,zipfile,xml.etree.ElementTree as ET
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]);out=ROOT/'assets/goal-figures';out.mkdir(exist_ok=True)
NS={'r':'http://schemas.openxmlformats.org/package/2006/relationships'}
# Fractions are reviewed panel boundaries; caption strips are deliberately out.
spec=[
 ('L1-rId122',[('babylon',[.12,.025,.37,.42],'바빌로니아 지도'),('ptolemy',[.61,.10,.88,.36],'프톨레마이오스 지도'),('to-map',[.13,.55,.36,.88],'T-O 지도'),('idrisi',[.60,.54,.90,.92],'알 이드리시 지도')]),
 ('L1-rId123',[('cheonhado',[.02,.04,.43,.43],'천하도'),('daeming',[.53,.04,.94,.43],'대명 혼일도'),('kangnido',[.04,.56,.45,.90],'혼일강리'),('kunyu',[.51,.55,.97,.91],'곤여만국전도')]),
 ('L1-rId124',[('hemispheres',[.015,.035,.49,.43],'지구전후도'),('hereford',[.57,.02,.94,.43],'헤리퍼드 지도'),('portolan',[.055,.53,.47,.92],'포르톨라노 해도'),('mercator',[.54,.53,.96,.91],'메르카토르 지도')]),
 ('L1-rId49',[('mangrove',[.065,.025,.433,.30],'맹그로브'),('coral',[.593,.025,.964,.30],'산호섬'),('lagoon',[.065,.505,.434,.781],'석호'),('sea-stack',[.593,.505,.962,.781],'해식애·시스택')]),
 ('L1-rId130',[('hindu-temple',[.008,.018,.321,.38],'힌두교 사원'),('church',[.733,.02,.924,.44],'크리스트교 성당'),('buddhist-temple',[.012,.548,.326,.916],'불교 사원'),('mosque',[.737,.548,.990,.916],'이슬람교 모스크')]),
 ('L1-rId66',[('ger',[.005,.09,.49,.50],'게르'),('gassho',[.515,.09,.99,.50],'갓쇼즈쿠리'),('stilt',[.515,.59,.99,.995],'고상 가옥')]),
 ('L1-rId86',[('manhattan',[.005,.16,.495,.985],'맨해튼 격자형'),('paris-roads',[.505,.16,.995,.985],'파리 개선문 방사형')]),
 ('L1-rId89',[('rio',[.005,.20,.326,.98],'리우데자네이루'),('mexico-city',[.338,.20,.659,.98],'멕시코시티'),('cusco',[.674,.20,.995,.98],'쿠스코')]),
 ('L2-rId239',[('pivot-irrigation',[.017,.16,.486,.98],'중심축 회전식 관개'),('qanat',[.514,.16,.988,.98],'카나트')]),
 ('L1-rId125',[('night-lights',[0,0,1,1],'스리랑카·타이완')]),
 ('L2-rId100',[('china-grains',[0,0,1,1],'중국 곡물 분포')]),
 ('L2-rId232',[('asian-exports',[0,0,1,1],'중국·일본·인도네시아·오스트레일리아')]),
 ('L1-rId128',[('cohort',[0,0,1,1],'인구 코호트')]),
 ('L2-rId216',[('sea-ice-anomaly',[.015,.505,.985,.98],'북극 해빙 편차')]),
 ('L2-rId217',[('ozone-area',[0,0,1,1],'남반구 오존 구멍 면적')]),
 ('L2-rId218',[('ice-and-ozone-maps',[0,0,1,1],'북극 해빙과 남극 오존')]),
 ('L2-rId206',[('trade-bubble',[0,0,1,1],'수입·수출·1인당 무역액')]),
 ('L2-rId207',[('trade-triangle',[0,0,1,1],'수출·수입 품목 구성')]),
 ('L2-rId208',[('north-america-trade',[0,0,1,1],'북미 양방향 교역')]),
 ('L2-rId209',[('eu-trade-arrows',[0,0,1,1],'EU 교역 방향과 품목 비중')]),
 ('L2-rId212',[('bloc-trade',[0,0,1,1],'블록별 역내·역외 교역')]),
]
books={}
for v in [1,2]:
 f=next(source.glob(f'*{v}권*.docx'));z=zipfile.ZipFile(f);rels={x.attrib['Id']:x.attrib['Target'] for x in ET.fromstring(z.read('word/_rels/document.xml.rels'))};books[v]=(z,rels)
result=[p for p in json.loads((ROOT/'data/goal-figure-panels.json').read_text()) if p.get('license')]
for rid,panels in spec:
 v=int(rid[1]);r=rid.split('-')[1];z,rels=books[v];original=z.read('word/'+rels[r]);image=Image.open(io.BytesIO(original)).convert('RGB');w,h=image.size
 for name,box,answer in panels:
  im=image.crop(tuple(round(n*s) for n,s in zip(box,[w,h,w,h])));im.thumbnail((1100,850));target=out/(name+'.webp');im.save(target,'WEBP',quality=86)
  result.append({'id':name,'path':'assets/goal-figures/'+target.name,'answer':answer,'sourceFigure':rid,'sourceSHA256':hashlib.sha256(original).hexdigest(),'crop':box,'width':im.width,'height':im.height,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'provenance':'강의에 수록된 평가원 원그림에서 문항용 패널만 분리. 원문 서술·원본 문서 제외.'})
(ROOT/'data/goal-figure-panels.json').write_text(json.dumps(result,ensure_ascii=False,indent=1)+'\n')
print('Figure panels:',len(result),'bytes:',sum((ROOT/x['path']).stat().st_size for x in result))
