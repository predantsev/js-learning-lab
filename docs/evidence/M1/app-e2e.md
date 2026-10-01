# M1 evidence: application end-to-end suite

Date: 2026-10-01. Scope: learner flows of the platform in a real browser (issue #7). This is test
evidence for the implemented M1 slice only; it is not a release or course-completion claim.

## Environment

| Item | Value | How obtained |
|---|---|---|
| OS | macOS 26.6.2 (build 25G83), Apple silicon | `sw_vers` |
| Browser | Google Chrome 154.0.8037.58, headless | `browser.version()` of `chromium.launch({ channel: 'chrome' })` |
| Driver | playwright-core 1.63.0 | `require('playwright-core/package.json').version` |
| Node.js | v25.2.1 | `node --version` |
| Commit tested | `9e2d556` (worktree branch, includes `feat/7-platform-foundation` up to `8e581c0`) | `git log --oneline -1` |
| Content | real build: `content: 10/528 lessons, 33 glossary terms, version f245228d42b2, 0 issue(s)`; fixtures: `tests/fixtures/content` | build output |

Learner data: every test uses a fresh temporary data directory (`os.tmpdir()/jsll-e2e-data-*`) and
synthetic fixture content; nothing is written under the repository.

## Commands and results

```
npm run test:e2e        # pretest:e2e builds (node scripts/build.mjs), then node --test "tests/e2e/*.test.mjs"
ℹ tests 101
ℹ suites 0
ℹ pass 101
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 38489.808333

npm test                # node --test "tests/unit/*.test.mjs"
ℹ tests 123
ℹ pass 123
ℹ fail 0

npx tsc --noEmit -p app/tsconfig.json      # exit 0, no output

JSLL_CONTENT_ROOT=tests/fixtures/content node scripts/content/validate.mjs
CONTENT VALID: 3 lesson(s), 3 example run(s), 20 exercise fixture run(s), 3 verified prediction(s),
4 capstone step variant(s) with 16 capstone run(s), 0 error(s)
```

The 101 end-to-end tests are 42 application tests added here (`tests/e2e/app-*.test.mjs`) plus the
existing runner (21), visuals (22) and project (16) suites; all passed in the same run. Files run in
parallel by default (13 at a time on this 14-core machine); after the last test change the whole
suite ran 4 times in parallel (3 loop runs and the run above): 4/4 green, 36.6–38.9 s each.

## Fixture content and plumbing

- `tests/fixtures/content/` is a synthetic content root (two JS-01 lessons, one JS-02 lesson, a
  planned-only lesson per unit, 11 glossary terms, redirects). `scripts/content/lib.mjs` reads
  `JSLL_CONTENT_ROOT` (default `content/`). `tests/e2e/helpers.mjs` compiles it into a temporary
  dist directory that links the built `dist/app` and `dist/sandbox`, and starts
  `server/app.mjs` with `testHooks: true` on a temporary data directory (restart = same port, same data).
- The fixture root passes the real validator (above), so fixtures are real, executable content.
- `tests/unit/content-fixture-compile.test.mjs` checks the content-root override and compiled shapes.

## Test → verification case → requirement

| Test (file › name) | V-case | REQ |
|---|---|---|
| app-persistence › typed code, active file, lesson page, capstone and settings survive reload and restart | V-03 | REQ-004, REQ-024 |
| app-persistence › a failed write is reported honestly, offers retry and download, and retry saves after recovery | V-03, V-12 (part) | REQ-024, REQ-032 |
| app-persistence › a full disk is reported as not saved with its cause, and saving resumes when space is back | V-12 (part) | REQ-024, REQ-032 |
| app-persistence › two tabs editing the same data get a conflict; both resolutions work | V-03 | REQ-024 |
| app-language › fresh profile is Ukrainian; the global switch keeps code, page and progress; starters follow the lesson language | V-08 | REQ-015 |
| app-language › the per-block EN/UA control translates only its block, in both directions, keeping state and focus | V-08 | REQ-015, REQ-016, REQ-017 |
| app-hints › hints and the solution are voluntary, ordered, separate from the editor and recorded as evidence | V-09 | REQ-018, REQ-019, REQ-033 |
| app-hints › an independent exercise has no hints; its solution still needs confirmation | V-09 | REQ-018 |
| app-bookmarks › bookmarked explanation, example and exercise open at the exact block after a restart; removal persists | V-10 | REQ-020 |
| app-bookmarks › moved and missing bookmark targets keep the bookmark with guidance; redirects open the new place | V-10 | REQ-020 |
| app-skip › skip without a check: visibly skipped, nothing passed, revisitable and resumable | V-02 (lesson level) | REQ-003, REQ-033 |
| app-skip › a passed self-check is separate evidence, keeps the lesson draft and never passes the exercise | V-02 (lesson level) | REQ-003, REQ-033, REQ-016 |
| app-skip › a failed self-check is recorded without a pass; skipping a whole unit skips only authored lessons | V-02 (lesson level) | REQ-003, REQ-033 |
| app-runner-ui › an infinite loop is stopped by the loop budget with localized guidance and the verbatim diagnostic | V-11 (UI) | REQ-022, REQ-019 |
| app-runner-ui › a runaway that defeats the loop guard: the page stays responsive, Stop works, code survives, the next run is fresh | V-11 (UI) | REQ-022 |
| app-runner-ui › an unresponsive run that nobody stops is stopped automatically and explained | V-11 (UI) | REQ-022 |
| app-keyboard › a whole lesson is completed with the keyboard only, with visible focus at every stop | V-15 | REQ-031 |
| app-keyboard › focusable learner content in a hidden result frame cannot capture keyboard focus | V-15 | REQ-031 |
| app-keyboard › file and result tabs follow the ARIA tabs pattern: one tab stop, arrow keys, Home and End | V-15 | REQ-031 |
| app-keyboard › the glossary popover opens by keyboard, closes with Escape and returns focus | V-15, V-08 | REQ-031, REQ-017 |
| app-errors › a missing lesson and a corrupt lesson file show distinct states; learner data stays intact | V-15 | REQ-032 |
| app-errors › a corrupt course index stops with a bilingual explanation and touches no learner data | V-15 | REQ-032 |
| app-errors › an unreachable server: work stays, nothing claims saved, unloaded lessons explain, restart recovers | V-15 | REQ-032, REQ-024 |
| app-errors › a sandbox that cannot start is explained; the editor keeps the code and a later run works | V-15, V-11 | REQ-032, REQ-022 |
| app-errors › damaged learner data: recovered from the backup copy with a notice, or a clear stop without touching the file | V-15, V-12 (part) | REQ-032, REQ-024 |
| app-a11y › accessibility scan: names, landmarks, headings, unique ids and valid references on every screen | V-15 | REQ-031 |
| app-a11y › design tokens: every text color pair reaches 4.5:1 in all three styles, light and dark | V-15, V-17 | REQ-031, REQ-035 |
| app-a11y › rendered screens: every visible text element reaches WCAG AA contrast in all styles and appearances | V-15, V-17 | REQ-031, REQ-035 |
| app-styles › Calm Studio by default; every style and appearance keeps all learner state and works | V-17 | REQ-035, REQ-016 |
| app-styles › the chosen style and appearance survive a restart | V-17 | REQ-035, REQ-024 |
| app-styles › unknown, retired or missing style ids fall back to Calm Studio without losing other data | V-17 | REQ-035 |
| app-pages › review: answered retrieval questions come back; due items are counted; practice records the next date | V-04 (part) | REQ-007 |
| app-pages › glossary: list, search by term, local name and alias, see-also links and deep links land on the term | V-08 | REQ-017 |
| app-pages › settings: language, style, appearance and text size apply at once, persist, and work with arrow keys | V-08, V-17 | REQ-015, REQ-035, REQ-031 |
| app-layout › 1280×800: explanation and practice side by side, usable editor and result, no horizontal scroll | — | REQ-011, REQ-030 |
| app-layout › 1440×900: explanation and practice side by side, usable editor and result, no horizontal scroll | — | REQ-011, REQ-030 |
| app-lesson-content › project SVG images show in HTML, CSS and from JavaScript; failed resources are explained honestly | V-11 (part) | REQ-023, REQ-019 |
| app-lesson-content › a link to another page of the project opens that page, with a way back to the entry page | — | REQ-011 |
| app-lesson-content › authored feedback for SyntaxError appears next to a syntax error found before running; check titles render code | V-09 | REQ-019 |
| app-lesson-content › code-trace hides the Variables, Call stack and Heap panels that are empty in every step | V-04 (part) | REQ-006 |
| app-lesson-content › the content validator accepts a prediction whose code does not compile when it expects SyntaxError | V-01 (validator) | REQ-005, REQ-008 |
| app-smoke › real content: onboarding, the first lesson, a real run, a check and the full course map | V-01 (part) | REQ-001, REQ-002, REQ-011 |

Accessibility checks used no extra dependency: Chrome's own accessibility tree through CDP
(`Accessibility.getFullAXTree`) for names/roles/landmarks, DOM checks for unique ids, ARIA
references and a single `h1`, and WCAG 2.x relative-luminance contrast computed from computed colors
(alpha and ancestor opacity composited, finite animations finished first) — 48 token pairs × 3
styles × 2 appearances, and every visible text element of the lesson (with output, errors, test
results, hints, answers, a visual), course map, settings and glossary screens.

## Defects found and fixed

Each was found by a test in this suite (or the exploratory run before it) and is covered by it.

| Area | File(s) | Defect → fix |
|---|---|---|
| Build | `scripts/build-sandbox.mjs` | The app shipped React's **development** build: the sandbox build restored `process.env.NODE_ENV = undefined`, which stores the string "undefined", so Vite did not default to production (bundle contained dev-only warnings; StrictMode double effects). Now the variable is deleted. Bundle 1,235,222 → 984,603 bytes. |
| Favicon | `app/index.html` | Missing favicon logged a 404 on every page → inline SVG data URL. |
| Save status | `app/src/lib/persist.ts` | Typing while a save had failed flipped the status back to "pending" and hid the failure banner; a retry in flight showed "saving". A failed document now stays visibly failed until a write succeeds. |
| React store | `app/src/components/blocks.tsx` | Review block selector returned a new `{}` per call ("getSnapshot should be cached"). |
| Compiler | `scripts/content/lib.mjs`, `Workspace.tsx` | Check titles rendered as literal `<p>…</p>`; text-answer placeholder showed `<p>Число</p>`; objectives/tool notes were wrapped in paragraphs. Test titles now compile inline and render as HTML (code spans work), placeholders plain. |
| Focus | `CodeEditor.tsx` | The code editor had no focus indicator (`outline: none`) → 2px focus ring. |
| Focus | `blocks.tsx` | After submitting an answer (or "try again") the button unmounted and focus fell to `<body>` → focus moves to the result / first answer. |
| Focus | `Workspace.tsx` | Tab entered the invisible off-screen result frame → hidden preview is `inert`. Run/Check became `disabled` while focused (focus dropped to `<body>`) → `aria-disabled`; Stop returns focus to Run. File/result tabs now follow the ARIA tabs pattern. |
| Dialogs | `ui.tsx` | `Dialog` re-ran `close()`+`showModal()` on every parent re-render (inline `onClose` in deps), moving focus mid-task; same pattern in the glossary popover → mount-only effect with a callback ref. |
| Language | `CodeEditor.tsx`, `Workspace.tsx`, `lib/types.ts` | Choosing a file tab, storing sandbox data or an editor re-sync (language switch, reload from disk) created a draft that froze the untouched starter's language. Only learner edits snapshot files now (`files` optional in a draft entry; old documents remain valid). |
| Language | `state/app.ts`, `blocks.tsx` | Switching a block back to the interface language left a sticky override, so that block ignored later global language changes → the override is removed. |
| Self-check | `Lesson.tsx`, `blocks.tsx`, `Workspace.tsx` | The self-check edited the lesson's own draft (overwrote learner code) and duplicated the block DOM id → separate draft key `selfcheck:<block>` and DOM id. |
| Errors | `Lesson.tsx`, `state/app.ts`, `server/app.mjs` | A lesson that failed to load during an outage never loaded again (rejected drafts promise cached) and had no retry; a missing lesson could be reported as "server unreachable"; the damaged-file message named no file («») → fixed, retry action added (`error.retry` in uk/en). |
| Runner | `sandbox/runtime.js` | Errors raised through runtime helpers (LoopBudgetError) named the sandbox frame URL instead of `index.js` (runtime is inlined into frame.html; stack filter missed it). |
| Contrast | `tokens.css`, `app.css` | Comment syntax color on light code backgrounds 4.01–4.29:1 → `#5f6b74` (≥ 4.77:1). Unpublished lesson rows faded to 2.4–4.0:1 with `opacity: 0.6` → italic at full contrast. |
| Glossary, settings | `pages.tsx` | A term deep link highlighted the term but stayed at the page top → scrolls to and focuses it; unknown term explained. Settings radio groups now use arrow keys (ARIA radio pattern). |
| Lesson author report | `shared/runner.js`, `sandbox/runtime.js`, `Workspace.tsx`, `validate.mjs`, `visuals/players/CodeTrace.tsx` | Project SVGs in CSS `url()`; a missing image `src` stays as written; failed resources explained as missing project file vs blocked external address; JS-assigned project SVGs load; links between project pages open the page with a way back; `when.error: SyntaxError` feedback matches pre-run syntax errors; validator accepts `verify: { logs: [], error: SyntaxError }`; code-trace hides panels empty in every step. Docs: `content/README.md`, `content/VISUALS.md`. |

## Not covered / unverified

- **Screen reader output** was not observed (no VoiceOver/NVDA run): only roles, names and live
  regions in the DOM/accessibility tree are asserted. Unverified.
- **Zoom/200 % text and reduced motion** in the lesson UI are not tested here (the visuals suite
  covers reduced motion of the players). Text size preferences are tested.
- **Other OS/browsers**: only macOS 26.6.2 + Chrome 154 headless. Headed Chrome, Firefox, Safari,
  Windows and Linux are unverified.
- **Origin change** (hostname/port) recovery, **backup/import**, **export failure**, **import
  conflict** and **missing local tooling** states (REQ-024/025/032 parts) are not covered by this
  suite; the project suite covers export.
- **Project/capstone screen** beyond the existing project suite (out of this scope); the onboarding
  capstone choice is a radio group without arrow-key support (capstone screen owner).
- **Output printed in the same task as a guard-defeating runaway** (e.g. `console.log(…);
  eval("for(;;){}")`) never reaches the console: Chrome delivers the stuck frame's messages only when
  its task yields (measured: an immediate `postMessage` did not arrive either). The run is still
  stopped; output from earlier tasks arrives. Documented limitation, not fixed.
- **First pointer event into a freshly created cross-site frame** was occasionally lost in headless
  Chrome (link in view, first trusted click without effect, second click worked). The page-link test
  waits until `:hover` reaches the frame before clicking; real-user impact unverified.
- **Flakes observed during development**: once the application shell did not render under parallel
  load (diagnostics added to `openApp`, not reproduced since); once the review-page test failed after
  19.7 s in a parallel run (output not kept; it passed in the 9 parallel runs since; cause
  unconfirmed); two test-side races (reading run status before the run finished) were fixed.
- **Instructional/linguistic review** of the fixture texts was not performed (synthetic test content).
