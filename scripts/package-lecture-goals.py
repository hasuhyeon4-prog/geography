"""Make a small runnable preview plus a guarded patch against the agreed base."""
from pathlib import Path
import argparse,hashlib,json,subprocess,zipfile
ROOT=Path(__file__).resolve().parents[1]
BASE='2665750a5e174d25f7cb7945bcfc1f1d30e98cc0'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,stderr=subprocess.DEVNULL)
def digest(data):return hashlib.sha256(data).hexdigest()
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=ROOT.parent/'output/세계지리_하위목표_1차구현_20261025.zip');args=parser.parse_args()
head=git('rev-parse','HEAD').decode().strip()
if git('status','--porcelain','--untracked-files=no').strip():raise SystemExit('Commit the intended changes before packaging.')
patch=git('diff','--binary',BASE,head)
paths=git('diff','--name-only','--no-renames','-z',BASE,head).decode().split('\0')
manifest={'base':BASE,'commit':head,'files':{}}
for rel in filter(None,paths):
    try:before=git('show',BASE+':'+rel)
    except subprocess.CalledProcessError:before=None
    p=ROOT/rel
    manifest['files'][rel]={'before':digest(before)if before is not None else None,'after':digest(p.read_bytes())if p.is_file()else None}
apply='''from pathlib import Path
import hashlib,json,subprocess,sys
HERE=Path(__file__).resolve().parent
repo=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else Path.cwd()
m=json.loads((HERE/'patch-manifest.json').read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()if p.is_file()else None
if all(sha(repo/n)==s['after']for n,s in m['files'].items()):
 print('이미 같은 변경이 적용되어 있습니다.');sys.exit(0)
conflicts=[n for n,s in m['files'].items()if sha(repo/n)!=s['before']]
if conflicts:
 print('기준 파일이 달라 적용을 중단했습니다. 다른 변경을 덮어쓰지 않습니다.');print('\\n'.join(conflicts));sys.exit(2)
patch=HERE/'source.patch'
subprocess.run(['git','-C',str(repo),'apply','--check',str(patch)],check=True)
subprocess.run(['git','-C',str(repo),'apply',str(patch)],check=True)
if not all(sha(repo/n)==s['after']for n,s in m['files'].items()):raise SystemExit('적용 후 해시가 일치하지 않습니다.')
print('코드 적용 완료. node --test tests/*.test.cjs 로 검사할 수 있습니다.')
'''
progress=json.loads((ROOT/'audit/lecture-goals/progress.json').read_text())
counts=progress['statusCounts']
readme=f'''# 세계지리 하위 목표 1차 구현

검증 {counts['검증']}개 · 구현 {counts['구현']}개 · 미구현 {counts['미구현']}개. 전체 573개를 완료했다는 뜻이 아닙니다.

## 바로 보기

`app/index.html`은 전체 앱, `app/materials.html`은 새 자료형·계산 연습입니다. 기출형 화면의 새 링크로도 들어갈 수 있습니다. 로컬 파일 열기가 제한되면 app 폴더에서 `python3 -m http.server 8000`을 실행하고 http://localhost:8000 으로 접속합니다.

## 저장소에 적용

기준 커밋: {BASE}
구현 커밋: {head}

`python3 apply_patch.py /저장소/절대경로`를 실행합니다. 기준 파일이 다르면 덮어쓰지 않고 중단합니다. 같은 변경에 재실행해도 중복 적용하지 않습니다. 이전 P00/P01 OX 254개 추가안과는 별개이며 이 패치가 그 추가안을 포함하는 것은 아닙니다.

## 포함 내용

- 새 OX 637문장. 기존 217개 ID·정답·복습 기록 유지.
- 자료형·계산 30주제, 재구성 강의 표 6개, 기존 기출형 보기 확장.
- 미국·중국 1990/2020 소비량, 미국·이란·오스트레일리아 2000/2018 소비 구성.
- 목표별 상태와 생성 증거. 모든 하위 목표가 검증인 6묶음만 완료.

OX 목표는 대표 문장 연결까지만 확인해 `구현` 상태로 두었습니다. 모든 지명·사례·조건을 충족했다고 세지 않습니다. G086-1의 2025년 원자료는 없어서 ±5년 전체 검증을 유보했습니다.

## 검사와 한계

공개 전체 검사 236개 통과·원문 의존 3개 생략. 해당 3개가 속한 원문 검사 26개는 원본을 연결해 별도로 모두 통과했습니다. 에너지 추가 후 최신 신규 검사 19개가 모두 통과했습니다. 생성 표본은 자료형 4,800문항과 기존 기출형 960문항입니다.

실제 Chromium 화면 검사는 브라우저 설치 파일 다운로드 실패로 수행하지 못했습니다. DOM 제어·채점·재방문 복습 검사와 SVG 렌더 확인을 수행했습니다. 이 묶음에는 강의 전문·서술 대장·원본 DOCX·원본 그림이 없습니다.
'''
args.output.parent.mkdir(exist_ok=True,parents=True)
with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
    z.writestr('읽어보기.md',readme);z.writestr('source.patch',patch);z.writestr('apply_patch.py',apply)
    z.writestr('patch-manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    z.write(ROOT/'docs/LECTURE-GAP-IMPLEMENTATION.md','구현상태.md')
    z.write(ROOT/'data/lecture-gap-goals.json','하위목표상태.json')
    for name in git('ls-files','-z','assets','*.html').decode().split('\0'):
        if not name or name.startswith('assets/source-figures/'):continue
        if not name.startswith('assets/') and '/'in name:continue
        p=ROOT/name
        if p.is_file():z.write(p,'app/'+name)
with zipfile.ZipFile(args.output)as z:
    assert z.testzip()is None
    assert not any(n.endswith('.docx')or n.endswith('lecture-blocks.json')or 'source-figures/'in n for n in z.namelist())
assert args.output.stat().st_size<30_000_000
print(json.dumps({'file':str(args.output.resolve()),'bytes':args.output.stat().st_size,'sha256':digest(args.output.read_bytes()),'changedFiles':len(manifest['files'])},ensure_ascii=False))
