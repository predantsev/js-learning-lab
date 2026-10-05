# Capstone projects: content format

The learner builds one project through the whole course: a wishlist, a planner, a habit tracker or a
simple expense tracker (`domains.yaml`). All four teach the same objectives with small domain
differences ([concept-to-capstone mapping](../../docs/CURRICULUM.md#concept-to-capstone-mapping)).
This folder holds the starting state of each project (CP-START) and one **step** per curriculum unit.
The compiler turns it into `dist/content/capstones/<capstone>.json`; the validator executes it.

## Layout

```
content/capstones/
  domains.yaml                          the four domains and their synthetic fixtures
  start/<capstone>/files/**             CP-START: a tiny runnable page (index.html, styles.css, app.js, images/…)
  start/<capstone>/strings.yaml         text of the CP-START page: { key: { uk, en } }
  steps/<UNIT>/step.yaml                wording shared by the four capstones
  steps/<UNIT>/tests.js                 optional: checks shared by the four capstones
  steps/<UNIT>/<capstone>/task.yaml     the domain variant: instructions, strings, check titles, feedback
  steps/<UNIT>/<capstone>/reference/**  the complete project AFTER the step (full file set)
  steps/<UNIT>/<capstone>/tests.js      optional: checks of this variant (overrides the shared file)
```

Capstone ids: `wishlist`, `planner`, `habits`, `expenses`. Every step folder needs all four variants.
Steps are ordered by the course teaching order (`docs/competencies.json` → `unit_order`), not by name.

## step.yaml

```yaml
unit: JS-01                    # = folder name
mode: in-platform              # in-platform (checked in the platform) | local (VS Code; checked statically)
entry: index.html              # page the project starts from (default index.html)
title: { uk, en }              # step name
intro: { uk, en }              # Markdown: what this step is about (shown in the project and in the lesson)
purpose: { uk, en }            # why the step-lesson exists (see "Capstone-step lesson")
objectives: [ { uk, en } ]     # observable abilities
transfer: { uk, en }           # text of the lesson's link to the project step
```

Shared text cannot contain `%%key%%` placeholders: they belong to one capstone.

## task.yaml (one per capstone)

```yaml
strings:                       # NEW keys of this step: { key: { uk, en } } — camelCase letters and digits
  projectTitle: { uk: "Список бажань", en: "Wishlist" }
instructions: { uk, en }       # Markdown; %%key%% shows the text the learner must type (see below)
nudge: { uk, en }              # optional hint; viewing it marks a later pass as assisted
testTitles:                    # one bilingual title per test name in tests.js (inline Markdown)
  "heading names the project": { uk: "Заголовок містить «%%projectTitle%%»", en: "…" }
feedback:                      # optional, shown under a failing check
  - when: { test: "heading names the project" }      # or { error: ReferenceError }
    message: { uk, en }
capabilities: {}               # optional, as for lesson exercises (network: lab, loopBudgetMs, …)
```

## Strings and languages

- Identifiers and comments in code are English. Text the project page shows uses `%%key%%`.
- Strings are **cumulative**: step N sees the CP-START strings plus the strings of every step up to N.
  A step adds keys; it never redefines an earlier key (learner files created earlier keep the old
  text), and the validator rejects a redefinition with different text.
- A workspace is created in the interface language of that moment; its files are localized once and
  then belong to the learner — they are never rewritten, also not on a language switch.
- Instructions, check titles, feedback and nudges are shown in the interface language, but their
  `%%key%%` placeholders are filled with the **workspace** language: the text the learner is told to
  type is the text the checks expect. Checks read the same strings from the global `L` (`L.key`).

## reference/ and tests.js

- `reference/` is the whole project after the step (every file, unchanged ones included). It is the
  starting state of the next in-platform step, the "skip this step" offer and the post-export
  download of that checkpoint.
- The starter for step N is the reference of the previous **in-platform** step (CP-START for the first).
- `tests.js` uses the lesson test API (`content/README.md` → tests.js): `screen`, `user`, `expect`,
  `waitFor`, `logs()`, `storage`, `L`, … Test names are stable ids; the learner sees `testTitles`.
- Checks run on the learner's files with an **empty** `localStorage`, so they never change the
  project's saved data.
- Images: SVG files of the project are inlined by the sandbox runner (`shared/runner.js`), so
  `<img src="images/x.svg">` works in the preview and in checks (`img.naturalWidth > 0` proves that
  the file was found). A missing file stays a broken image and the console names it.

## Provenance rules (what the platform records)

- `{ state: 'done', source: 'platform-check' }` only after every check passed on the learner's files.
- Applying a reference (missing prior steps, or "skip this step") always shows a per-file diff,
  saves a recovery snapshot first and needs an explicit choice. Covered steps become
  `{ state: 'skipped', source: 'starter' }` — never done. The workspace remembers the supplied
  base; a later pass of a step whose work came from that base is reported but not counted. After
  restoring a snapshot with the learner's own files, their own pass counts again.
- Changing the capstone creates a separate workspace; old ones keep their files, snapshots and steps.

Rules shared by the app, compiler and tests: `shared/capstone.js`.

## Capstone-step lesson

When `content/syllabus/<UNIT>.yaml` names a lesson of `kind: capstone-step` that has no folder under
`content/units/`, the compiler writes it from `step.yaml`: title and minutes from the syllabus,
`purpose` and `objectives` from the step, then two blocks — the step `intro` (explanation) and a
`transfer` block that opens `#/project/<UNIT>`. Unit authors do not write these lessons. The lesson
counts as authored (course map, validation, `--release`). Its completion follows the step in the
**active** project: completed only after a real platform check there; a supplied starter shows the
lesson as skipped. Glossary terms these lessons introduce live in `content/glossary/capstone-steps.yaml`.

## Commands

```
node scripts/content/validate.mjs                    # everything, including all capstone steps
node scripts/content/validate.mjs --unit JS-01       # one unit: its lessons and its capstone step
node scripts/content/validate.mjs --capstone planner # capstone steps of one capstone only
node --test tests/e2e/project.test.mjs               # the project screen in a real browser
```

For every capstone and every in-platform step the validator checks, in both languages: the
reference passes every check and runs without errors; the state before the step (CP-START or the
previous reference) fails at least one check; every test has a bilingual title; every `%%key%%` and
`L.key` resolves. Local steps are checked statically (texts, strings, files) only.

## Export

"Export project" produces the learner's current files plus `jsll-manifest.json` (per-file SHA-256),
a README in the workspace language, a zero-dependency `serve.mjs` with `package.json` (`npm start`; it
serves `.ts` files with their types removed by Node's `module.stripTypeScriptTypes`, as the platform runs them),
`data/exported-storage.json` and `tools/restore-data.html`. Generated files never overwrite a learner
file with the same name. Builder: `shared/project-export.js`.
