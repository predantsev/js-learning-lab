# Evidence: capstone workspace, step checks and VS Code export (M1 slice, partial)

Date: 2026-10-01. Branch `worktree-agent-a88b9660d1257a737`, on top of `feat/7-platform-foundation`
at `290c2df` (server APIs, visuals, final syllabus and the nine authored JS-01 lessons merged before
these runs). Content version `5a639758b635`. All results below were produced by the commands shown,
in this environment; anything not listed under "Verified" is not claimed.

## Environment

| Item | Version |
|---|---|
| OS | macOS 26.6.2 (25G83), arm64 |
| Node.js / npm | v25.2.1 / 11.6.2 |
| Browser | Google Chrome 154.0.8037.58, headless, driven by playwright-core 1.63.0 (`channel: 'chrome'`) |
| Libraries used by the feature | fflate 0.8.3 (zip), diff 9.0.0 (line diffs, unified diffs) |

## What exists

- Content format `content/capstones/` (documented in `content/capstones/README.md`): CP-START for
  wishlist, planner, habits, expenses (`index.html`, `styles.css`, `app.js`, one SVG image, bilingual
  strings) and step `JS-01` (shared `step.yaml` and `tests.js`, four `task.yaml` variants and
  references).
- Compiler `scripts/content/capstones.mjs` (hooked into `scripts/content/lib.mjs`):
  `dist/content/capstones/<capstone>.json`, static checks, and the synthesized capstone-step lesson
  `js-01-10-capstone-starter-page` (syllabus title/minutes, step purpose/objectives, intro +
  transfer to `#/project/JS-01`). Glossary terms of that lesson: `content/glossary/capstone-steps.yaml`.
- Validator `scripts/content/validate.mjs`: executes every in-platform step in both languages
  (reference passes, state before the step fails ≥ 1 check, no runtime error, bilingual titles).
- Project screen `app/src/components/project/`: steps with provenance, multi-file editor, preview,
  console, checks, storage, starters with diff preview + snapshot + explicit choice, snapshots,
  capstone switching, zip/folder export, after-export references and diffs. Shared rules:
  `shared/capstone.js`; export builder: `shared/project-export.js`.

## Verified

| Command | Observed result |
|---|---|
| `node scripts/build.mjs` | `content: 10/528 lessons, 33 glossary terms, version 5a639758b635, 0 issue(s)` · `build finished in 1.5 s` |
| `node scripts/content/validate.mjs` | `CONTENT VALID: 10 lesson(s), 16 example run(s), 104 exercise fixture run(s), 10 verified prediction(s), 4 capstone step variant(s) with 16 capstone run(s), 0 error(s)` — JS-01 is now fully authored (9 lessons + the synthesized step lesson), so the unit-level teaching-loop checks ran too |
| `node scripts/content/validate.mjs --unit JS-01` | same summary line as above |
| `node scripts/content/validate.mjs --lesson js-01-10-capstone-starter-page` | `CONTENT VALID: 1 lesson(s), 0 example run(s), 0 exercise fixture run(s), 0 verified prediction(s), 4 capstone step variant(s) with 16 capstone run(s), 0 error(s)` |
| Negative check (before the JS-01 merge): `images/wish.svg` → `images/wsh.svg` in the wishlist reference, then `validate.mjs --capstone wishlist --unit JS-01` (file restored afterwards) | `✖ capstone wishlist › step JS-01 — reference (uk) must pass every check, but fails: "picture has alt text and is shown" (the picture file was found and shown: expected false to be true)`, the same for `(en)`, `CONTENT INVALID: … 1 capstone step variant(s) with 4 capstone run(s), 2 error(s)` |
| `node scripts/content/smoke.mjs --unit JS-01` | `SMOKE OK: 10 lesson(s), 54 page view(s), 0 problem(s)` (includes the synthesized lesson in uk and en) |
| `npx tsc --noEmit -p app/tsconfig.json` | no output, exit 0 |
| `node --test tests/unit/capstone.test.mjs` | `tests 11 · pass 11 · fail 0` |
| `npm test` (all unit suites) | `tests 121 · pass 121 · fail 0` |
| `node --test tests/e2e/project.test.mjs` | `tests 16 · pass 16 · fail 0` (list below) |
| `npm run test:e2e` (runner, visuals, project) | `tests 59 · pass 59 · fail 0` |
| `node scripts/content/validate.mjs --static --release` | `CONTENT INVALID … 760 error(s)` — expected: the course is not complete; no error line mentions JS-01, the capstone content or `js-01-10-capstone-starter-page` |
| `python3 scripts/validate_competencies.py` | `SPECIFICATION PASS: {"competencies": 60, "units": 56, "requirements": 38, "cases": 19}` |

`tests/e2e/project.test.mjs` (real Chrome, real server, real sandbox):

```
✔ the compiler writes the capstone-step lesson for JS-01 and it links to the project step
✔ onboarding creates a workspace with the CP-START files in the interface language
✔ the lesson page of the step links to the project; reading it does not complete it
✔ step JS-01 fails on the start state and passes after the reference edits typed in the editor (all four capstones)
✔ restart keeps the files, the step state and the active project
✔ the project screen works in the three styles
✔ a missing project image is explained in the console
✔ unsafe paths are rejected; files are created, renamed and deleted with confirmation
✔ skipping a step applies its reference only after a preview, a snapshot and an explicit choice — never as a pass
✔ restoring a snapshot saves the current state first; own work after it counts again
✔ changing the capstone keeps the old workspace intact and starts the new one unpassed
✔ export: the zip has every current file (including unsaved typed edits) and matching manifest hashes
✔ the exported project runs locally with npm start and restores the saved data
✔ folder export writes a new folder through POST /api/export/folder
✔ after export the project explains local authority and offers reference downloads and diffs
✔ opening a later step with missing earlier work offers the reference before it (synthetic second step)
ℹ tests 16 · pass 16 · fail 0 · duration_ms 23596
```

What the e2e assertions establish (each from the test of the same name):

- Workspaces copy CP-START localized in the interface language (`uk`; one project created with the
  English interface gets English files) and keep them when the interface language changes.
- For all four capstones the JS-01 check fails on CP-START and passes after the reference
  `index.html` is typed into CodeMirror; the record is `{ state: 'done', source: 'platform-check' }`.
- Reload keeps files, step state and the active project.
- "Skip this step": cancel changes nothing and creates no snapshot; apply creates
  `workspaces/<id>/snap-1` holding the previous files, overlays the reference, records
  `{ state: 'skipped', source: 'starter' }`; the supplied files then pass the checks but are reported
  "not counted" and the record stays skipped; the step lesson shows as skipped, not completed.
- Restoring a snapshot first saves the current state (`before-restore`), returns the previous files
  and base; the learner's own pass afterwards counts (marked assisted, because the reference had been
  previewed). Manual snapshots with a label are stored as separate documents.
- Capstone change creates a new workspace with no step passed; the `js-01-01-code-runs` progress
  entry is deep-equal before/after; the old workspace re-activates with its files and step intact.
- Zip export with saving forced to fail (`/api/__test/fault write-fail`) contains the typed-but-unsaved
  `app.js`; every manifest entry's SHA-256 and byte length match the zip content; manifest has
  `format`, `formatVersion`, `capstoneId`, `workspaceId`, `exportedAt`, `contentVersion`, `language`.
- The unzipped project starts with `npm start -- --port <free port>` (bound to 127.0.0.1), shows the
  same page and image; `tools/restore-data.html` writes the exported `localStorage` only on click; the
  page then continues the platform's count (`visits: 2` in the platform → `visits: 3` locally);
  raw traversal paths and `.git/config` answer 404.
- Folder export through the merged `POST /api/export/folder` writes the same files; its manifest
  hashes match the files on disk.
- After export the screen states that local files are authoritative and never synced/overwritten,
  offers reference zips (files + `jsll-reference.json` with hashes + `JSLL-REFERENCE.md` with the
  unified diff) and a readable diff CP-START → JS-01.
- With a synthetic JS-02 step (built by the test from a copy of the real content), opening JS-02
  offers the reference after JS-01; declining hides the offer until the learner reopens it; applying
  records JS-01 as supplied, and the learner's own JS-02 pass counts. On that second server the
  folder-export feature is removed from `/api/bootstrap`: the export dialog then offers only the zip
  and explains why.

## Not covered / unverified

- VS Code itself was not opened; the exported folder was run with `npm start` and checked in headless
  Chrome. Windows and Linux were not tested (the `npm.cmd` branch of the test is unexercised).
- Only one real step exists (JS-01). The missing-prior-work path is verified on a synthetic step;
  local-mode steps are supported by the compiler statically but no local step is authored.
- Bilingual texts (content, UI strings, README/restore page of exports) were written and reviewed by an
  agent only; no human linguistic or instructional review.
- Accessibility: keyboard use is tested for file creation and deletion only; no screen-reader run, no
  automated contrast audit; viewports below 1100 px were not tested.
- Two tabs creating snapshots of one workspace at once, storage quota errors during snapshots, and
  workspaces created before this change (empty files; the screen offers CP-START) are untested.
- The "continue with my files" choice is stored in the workspace document but was asserted only within
  one session (not across a reload). The capstone-step lesson mirror treats a missing or unreadable
  active workspace as "no project"; that path is untested.
- The optional post-export "compare an explicitly selected snapshot" (CURRICULUM.md) is not built.
