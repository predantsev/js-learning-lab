#!/usr/bin/env python3
"""Record which authored lessons teach and assess each competency family.

Reads the compiled lessons (dist/content/lessons/*.json, so run `npm run build` first) and
writes `lesson_ids` and `assessment_ids` in docs/competencies.json for the units named in
--units. Only name units whose lessons passed validation and an independent review: these
fields are evidence, not a plan.

The states `authored`, `implemented` and `verified` are never changed here. A family is
authored only when every subskill is assessed in authored lessons of all its units, and
verified only after the V-18 review; both are decisions, not something to derive.

  python3 scripts/sync_competency_lessons.py --units JS-01,JS-02          # write
  python3 scripts/sync_competency_lessons.py --units JS-01,JS-02 --check  # report only
"""
import argparse
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
INVENTORY = ROOT / 'docs' / 'competencies.json'
LESSONS = ROOT / 'dist' / 'content' / 'lessons'
DEPTH_RANK = {'intro': 1, 'practice': 2, 'assess': 3}


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--units', required=True, help='comma-separated unit ids whose lessons were validated and reviewed')
    parser.add_argument('--check', action='store_true', help='print the coverage report without writing')
    args = parser.parse_args()
    units = [u.strip() for u in args.units.split(',') if u.strip()]

    if not LESSONS.is_dir():
        sys.exit('dist/content/lessons not found: run "npm run build" first.')
    inventory = json.loads(INVENTORY.read_text(encoding='utf-8'))
    known_units = {u for stage in inventory['unit_order'].values() for u in stage}
    unknown = [u for u in units if u not in known_units]
    if unknown:
        sys.exit(f'unknown unit id(s): {", ".join(unknown)}')

    lessons = []
    for path in sorted(LESSONS.glob('*.json')):
        lesson = json.loads(path.read_text(encoding='utf-8'))
        if lesson.get('unit') in units:
            lessons.append(lesson)

    report = []
    for family in inventory['competencies']:
        taught, assessed, depth = [], [], {}
        for lesson in lessons:
            entries = [s for s in lesson.get('subskills', []) if s.get('family') == family['id']]
            if not entries:
                continue
            taught.append(lesson['id'])
            if any(s.get('depth') == 'assess' for s in entries):
                assessed.append(lesson['id'])
            for s in entries:
                if DEPTH_RANK.get(s.get('depth'), 0) > DEPTH_RANK.get(depth.get(s.get('skill')), 0):
                    depth[s['skill']] = s['depth']
        family['lesson_ids'] = taught
        family['assessment_ids'] = assessed
        if taught:
            subskills = family.get('subskills', [])
            unknown_skills = sorted(set(depth) - set(subskills))
            missing_units = [u for u in family.get('units', []) if u not in units]
            report.append({
                'id': family['id'],
                'lessons': len(taught),
                'assessed': sum(1 for s in subskills if depth.get(s) == 'assess'),
                'touched': sum(1 for s in subskills if s in depth),
                'total': len(subskills),
                'missing_units': missing_units,
                'unknown_skills': unknown_skills,
            })

    print(f'units: {", ".join(units)} · lessons read: {len(lessons)}')
    for row in report:
        tail = f' · units not included: {", ".join(row["missing_units"])}' if row['missing_units'] else ''
        print(f'{row["id"]}: {row["lessons"]} lesson(s); subskills assessed {row["assessed"]}/{row["total"]}, touched {row["touched"]}/{row["total"]}{tail}')
        for skill in row['unknown_skills']:
            print(f'  ! lesson subskill not in the inventory: {skill}')
    if any(row['unknown_skills'] for row in report):
        sys.exit('lessons name subskills that the inventory does not have; fix the lessons or the inventory first.')
    if args.check:
        print('check only: nothing written.')
        return
    INVENTORY.write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'written: {INVENTORY.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
