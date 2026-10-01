#!/usr/bin/env python3
"""Validate documentation inventory; never infer competence from declaration counts."""
from pathlib import Path
import argparse,json,re,sys

def validate(root,release=False):
    errors=[]
    def require(ok,msg):
        if not ok:errors.append(msg)
    try:data=json.loads((root/'docs/competencies.json').read_text())
    except (OSError,ValueError) as e:return [f'inventory: {e}'],None
    require(data.get('schema_version')==1,'unsupported inventory schema')
    require(data.get('stage_order')==['JS','RE','RN','NO'],'four-stage order changed')
    curriculum=(root/'docs/CURRICULUM.md').read_text()
    units=re.findall(r'^\| ((?:JS|RE|RN|NO)-\d+) \|',curriculum,re.M)
    require(len(units)==len(set(units)),'duplicate curriculum unit')
    stable={f'{s}-{i:02}' for s,n in [('JS',10),('RE',8),('RN',8),('NO',8)] for i in range(1,n+1)}
    require(stable<=set(units),'original unit IDs lost')
    order=[u for s in data.get('stage_order',[]) for u in data.get('unit_order',{}).get(s,[])]
    require(len(order)==len(set(order)) and set(order)==set(units),'unit teaching order must map every unit exactly once')
    pos={u:i for i,u in enumerate(order)};stagepos={s:i for i,s in enumerate(data.get('stage_order',[]))}
    reqtext=(root/'docs/REQUIREMENTS.md').read_text();vtext=(root/'docs/VERIFICATION.md').read_text()
    req=re.findall(r'^\| (REQ-\d{3}) \|',reqtext,re.M);cases=re.findall(r'^\| (V-\d+) \| ([^|]+) \|',vtext,re.M)
    require(len(req)==len(set(req)),'duplicate requirement ID')
    require({f'REQ-{i:03}' for i in range(1,36)}<=set(req),'original requirements lost')
    require(len(cases)==len({c[0] for c in cases}),'duplicate verification ID')
    coverage=set(re.findall(r'REQ-\d{3}',' '.join(c[1] for c in cases)))
    require(coverage==set(req),'verification mapping missing/unknown requirement')
    records=data.get('competencies',[]);by={r.get('id'):r for r in records};sources=data.get('sources',{})
    require(bool(records) and len(by)==len(records),'empty/duplicate competency IDs')
    mapped=set()
    for r in records:
        cid=r.get('id','?');st=r.get('stage')
        require(bool(re.fullmatch(r'[JWP RNB]-\d{2}'.replace(' ',''),cid)),f'{cid}: invalid competency ID')
        require(st in stagepos,f'{cid}: unknown stage')
        require(r.get('classification') in ['core','required-awareness'],f'{cid}: missing justified scope')
        require(r.get('depth') in ['explain-read','implement-debug','design-test-operate'],f'{cid}: missing depth')
        for field in ['title','rationale','practice','assessment','transfer','runtime','intro_bridge','prerequisite_semantics']:
            val=r.get(field,'');require(isinstance(val,str) and bool(val.strip()) and not re.search(r'\bTBD\b|\bTODO\b',val),f'{cid}: blank/placeholder {field}')
        require(bool(r.get('subskills')) and len(r['subskills'])==len(set(r['subskills'])),f'{cid}: empty/duplicate subskills')
        for skill in r.get('subskills',[]):require(bool(skill.strip()) and not re.search(r'\bTBD\b|\bTODO\b',skill),f'{cid}: placeholder skill')
        require(bool(r.get('units')),f'{cid}: no unit mapping')
        for u in r.get('units',[]):require(u in pos and u.startswith(str(st)+'-'),f'{cid}: invalid stage/unit {u}');mapped.add(u)
        require(bool(r.get('sources')) and all(s in sources for s in r['sources']),f'{cid}: missing source mapping')
        require(r.get('runtime') in ['browser-js','browser-react','concept-preview','local-web','local-native','local-node'],f'{cid}: unknown runtime')
        require(r.get('current_spec')=='explicit',f'{cid}: incomplete specification')
        require(r.get('baseline_spec') in ['explicit','partial','missing'],f'{cid}: invalid prior coverage')
        require(bool(r.get('baseline_evidence')) and bool(r.get('baseline_review_scope')),f'{cid}: no scoped baseline evidence')
        for dep in r.get('prerequisites',[]):
            require(dep in by,f'{cid}: unknown prerequisite {dep}')
            if dep in by:require(stagepos.get(by[dep].get('stage'),99)<=stagepos.get(st,-1),f'{cid}: later-stage closure dependency {dep}')
        if all(u in pos for u in r.get('units',[])) and r.get('units'):
            first=min(pos[u] for u in r['units'])
            for u in r.get('intro_prerequisite_units',[]):require(u in pos and pos.get(u,999)<first,f'{cid}: introduction blocked by later/same unit {u}')
            for dep in r.get('intro_same_unit_foundations',[]):
                require(dep in by and any(pos.get(u)==first for u in by.get(dep,{}).get('units',[])),f'{cid}: invalid same-unit introduction {dep}')
        # Structural evidence check only; V-18 still requires independent semantic/runtime review.
        require(r.get('authored') in ['not-authored','authored'],f'{cid}: invalid authoring state')
        require(r.get('implemented') in ['not-implemented','implemented'],f'{cid}: invalid implementation state')
        require(r.get('verified') in ['not-verified','verified'],f'{cid}: invalid verification state')
        if release:
            require(r.get('authored')=='authored' and r.get('implemented')=='implemented' and r.get('verified')=='verified',f'{cid}: required evidence state incomplete')
            for field in ['lesson_ids','assessment_ids','evidence_paths']:
                require(bool(r.get(field)),f'{cid}: empty {field}')
            for name in r.get('evidence_paths',[]):
                target=(root/name).resolve()
                require(target.is_relative_to(root.resolve()) and target.is_file(),f'{cid}: missing/unsafe evidence path {name}')
    require(mapped==set(units),'unmapped unit or stage-end gate')
    for sid,s in sources.items():require(s.get('url','').startswith('https://') and bool(s.get('sections')) and bool(s.get('checked_date')),f'{sid}: incomplete source baseline')
    visiting=set();done=set()
    def visit(cid):
        if cid in visiting:errors.append(f'prerequisite cycle at {cid}');return
        if cid in done:return
        visiting.add(cid)
        for dep in by[cid].get('prerequisites',[]):
            if dep in by:visit(dep)
        visiting.remove(cid);done.add(cid)
    for cid in by:visit(cid)
    for r in records:
        if r.get('stage')=='NO':require(not any(dep.startswith('N-') for dep in r.get('prerequisites',[])),f"{r['id']}: native pass must not block Node assessment")
    require('JS-10' in order and 'JS-18' in order and pos.get('JS-10',999)<pos.get('JS-18',-1),'foundational export/cumulative gate order')
    for path in root.rglob('*.md'):
        if {'.git','node_modules','dist','.runtime','.claude','.learner-data','exports'} & set(path.relative_to(root).parts):continue
        for link in re.findall(r'\[[^\]]+\]\(([^)]+)\)',path.read_text()):
            if ':' not in link and not link.startswith('#'):
                require((path.parent/link.split('#')[0]).is_file(),f'{path.relative_to(root)}: broken link {link}')
    return errors,dict(competencies=len(records),units=len(units),requirements=len(req),cases=len(cases))

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parent.parent);ap.add_argument('--release',action='store_true');args=ap.parse_args()
    errors,counts=validate(args.root,args.release)
    if errors:
        print(('RELEASE NOT READY' if args.release else 'SPECIFICATION INVALID')+f': {len(errors)} issue(s)')
        for error in errors[:20]:print('- '+error)
        return 1
    print(('STRUCTURAL RELEASE EVIDENCE PRESENT; semantic/runtime V-18 review still required' if args.release else 'SPECIFICATION PASS')+': '+json.dumps(counts))
    return 0
if __name__=='__main__':sys.exit(main())
