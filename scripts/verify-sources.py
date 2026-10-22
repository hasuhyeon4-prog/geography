#!/usr/bin/env python3
"""Verify pinned source bytes. Optionally fetch to a separate directory.

python3 scripts/verify-sources.py
python3 scripts/verify-sources.py --fetch /tmp/new-geography-sources
Fresh publisher revisions are reported as different, never used to overwrite pins.
"""
import argparse,hashlib,json,urllib.error,urllib.request,zipfile,contextlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--fetch',type=Path);a=ap.parse_args()
manifest=json.loads((ROOT/'data/extensions-source-manifest.json').read_text())
errors=[];verified=0
paths=sorted((ROOT/'data').glob('extensions-source-snapshots-*.zip'))
if (ROOT/'data/extensions-source-snapshots.zip').exists():paths=[ROOT/'data/extensions-source-snapshots.zip']
with contextlib.ExitStack() as stack:
    archives=[stack.enter_context(zipfile.ZipFile(path)) for path in paths]
    for s in manifest['sources']:
        matches=[z for z in archives if s['path'] in z.namelist()]
        assert len(matches)==1,('Missing/duplicate source',s['path'])
        data=matches[0].read(s['path']);assert len(data)==s['bytes'],s['path']
        assert hashlib.sha256(data).hexdigest()==s['sha256'],s['path']
        verified+=1
        if not a.fetch or s['url'].startswith('derived:'):continue
        a.fetch.mkdir(parents=True,exist_ok=True)
        try:
            response=urllib.request.urlopen(urllib.request.Request(s['url'],headers={'User-Agent':'GeographySourceVerification/1.0'}),timeout=30)
            fresh=response.read();(a.fetch/s['path']).write_bytes(fresh)
            if hashlib.sha256(fresh).hexdigest()!=s['sha256']:errors.append({'file':s['path'],'result':'publisher bytes changed; pinned archive retained'})
        except Exception as e:errors.append({'file':s['path'],'result':str(e)})
print(json.dumps({'verifiedPinnedSources':verified,'fetchResults':errors},ensure_ascii=False))
if errors:raise SystemExit(1)
