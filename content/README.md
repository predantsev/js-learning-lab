# Content authoring guide

The contract for everyone who writes course content. Normative background: [requirements](../docs/REQUIREMENTS.md), [content contracts](../docs/CONTENT-DATA.md), [competency matrix](../docs/COMPETENCY-MATRIX.md). The lesson plan is the syllabus in `content/syllabus/<UNIT>.yaml` (lesson ids, order, objectives, subskills, misconceptions, retrieval targets). Visual step-throughs are specified in [VISUALS.md](VISUALS.md).

Reference lesson to imitate: `content/units/JS-01/js-01-01-code-runs/`.

## Layout

```
content/
  course.yaml                     stage titles
  syllabus/<UNIT>.yaml            the plan for a unit (keep it true: update it when a lesson changes scope)
  glossary/<UNIT>.yaml            terms first introduced in that unit
  capstones/domains.yaml          the four capstone domains and synthetic fixtures
  units/<UNIT>/<lesson-id>/
    lesson.yaml                   structure + all bilingual text
    <example-dir>/…               files of an example block
    <exercise-dir>/starter/…      what the learner starts from
    <exercise-dir>/solution/…     only the files that differ from the starter
    <exercise-dir>/alt[-name]/…   another valid solution (required whenever a different approach is natural)
    <exercise-dir>/wrong[-name]/… deliberately failing attempt(s) — at least one, modelling a real misconception
    <exercise-dir>/tests.js       behavior tests
```

The directory name equals the lesson id. Ids are stable: never rename a published lesson or block id (add a redirect in `content/redirects.yaml` instead).

## Commands

```
npm run build                                        # once, and after platform changes
node scripts/content/validate.mjs --unit JS-03       # static checks + real execution of every fixture
node scripts/content/validate.mjs --lesson <id>
npm start                                            # read your lesson as a learner (http://localhost:7300)
```

The validator runs every example, every exercise fixture and every verifiable prediction in headless Chrome through the same sandbox the learner uses, in both languages. A lesson is not done until it passes.

## Teaching rules

1. **One new idea per lesson, 5–15 minutes.** If the syllabus lesson turns out to need more, split it and update the syllabus file.
2. **Explanation → prediction → run/change → exercise → transfer.** Every instructional lesson has all five. Explanations are short (60–160 words per block), concrete and start from something the learner can see. Never assume a concept that was not taught in an earlier lesson — check the syllabus order.
3. **Name the misconception and dislodge it.** The syllabus lists the wrong mental models for each lesson. Build the prediction so that the wrong model gives a wrong answer, and give that wrong option a `why`.
4. **Predictions are committed before running.** The answer stays hidden until submission. Whenever the question is "what does this print", add `verify.logs` so the validator proves the claimed output by executing the code.
5. **Real code, real results.** Examples and exercises run for real. Exercises are checked by behavior (what the program prints, returns, renders or stores), never by matching source text. Accept every reasonable solution; add an `alt` fixture to prove it.
6. **Exercise ladder inside a unit:** `guided` (hints available) → `debug` (a seeded, realistic defect in working-looking code) → `independent` (no hints, combines the unit's ideas). Each unit needs all three, plus at least one prediction.
7. **Hints never give the answer away at level one.** `nudge` points where to look; `explanation` explains the idea needed; the full solution is separate and is recorded when viewed. Authored `feedback` for the failures a beginner will actually hit (a named test, or an error name such as `ReferenceError`) is worth more than a long hint.
8. **Review blocks never sit alone at the top of a lesson**: retrieval comes after the lesson's own first explanation.
9. **Retrieval.** From the second unit on, a unit contains `review` blocks with at least two questions about earlier lessons (one recent, one distant), asked without restating the answer. Use the syllabus `retrieval` entries.
9. **Difficult concepts get a `visual` block and an `analogy` block with its `limits`** (where the analogy breaks). Mandatory for scope/closure, reference identity/mutation, event loop/async, render/state snapshot, effect/cleanup, client/server and native/web boundaries.
10. **Honest runtimes.** `browser-js` and `browser-react` are real. `concept-preview` (React Native through react-native-web, or any simulation) must carry `limits`. Native-device and real-server evidence comes from `local-task` blocks, confirmed by the learner.
11. **Capstone thread.** Every instructional lesson ends with a `transfer` block pointing at the unit's capstone step (`capstoneStep: <UNIT>`). The step itself is the unit's `capstone-step` lesson.

## Language rules

- Every learner-facing string is bilingual: `{ uk: …, en: … }`. Ukrainian is the default and must read naturally, not like a translation. Address the learner informally (ти). Keep professional terms in English where developers do (props, state, hook, closure, callback, commit, merge, runtime) and explain them on first use; link them with `[[term-id]]` or `[[term-id|shown text]]` (inside a table cell escape the bar: `[[term-id\|shown text]]`).
- New terms go to `content/glossary/<UNIT>.yaml` (`id`, `term` = canonical English name, `name` {uk,en}, `definition` {uk,en}, optional `aliases`, `see`, `example.code`). A term is defined once for the whole course; check existing glossary files before adding.
- **Code:** identifiers and comments are English and shared by both languages. Text the example shows to its user (page headings, labels, printed sentences, sample data names) follows the lesson language: write `%%key%%` in the code and define `strings: { key: { uk: …, en: … } }` on the block. Tests read the same values from the global `L` (`L.key`). Synthetic data comes from `content/capstones/domains.yaml` where it fits.
- No personal data, no real brands' content, nothing copied from other courses.

## Mistakes found by independent review (check your unit against every line)

1. **Lists:** an inline `1) … 2) … 3)` sequence in a Markdown field renders as one item. Put each step on its own line as a real list.
2. **Hints never contain the exact solution line** (not in `nudge`, not in `explanation`): that bypasses the "solution viewed" record. Explain the idea with a *different* but similar example.
3. **An exercise or question never repeats an example from the explanation.** Change the situation so the idea has to be applied.
4. **`selfCheck` items are shown alone** (no neighbouring blocks, no example editor, no hints). Write them self-contained: no "above", "below", "on the right", "the next example".
5. **Feedback must be true in every case in which its test fails** — including when the learner's code throws inside that test: the app shows the feedback of every failing test at once. Phrase it as what is required, not as what "happened".
6. **Feedback on `SyntaxError` matches errors found before the code runs.** The learner then sees the card "The code could not start" with the original parser message, not the word `SyntaxError` — describe what the learner actually sees.
7. **Describe the interface only after checking it**: quote button and tab names from `app/src/i18n/uk.ts` / `en.ts` and run the example yourself.
8. **Add `alt` fixtures for the obvious longhand variants** of a solution (for example `18 + 18 + 18` next to `18 * 3`).
9. **Check content, not only structure**: when the task specifies data, the tests require non-empty rendered text, not just the right elements.
10. **Every new word is explained the first time it appears**, including inside `tryIt` and instructions (focus, px, object…).
11. **Contrast in authored pages:** `gray` on white fails WCAG AA (3.95:1). Use `dimgray` or darker; example pages model good practice.
12. **Feedback states what the check expects, not a diagnosis.** Every failing check shows its feedback — also after the program crashed while loading, when every check fails. Write "this check expects …; if you see X, then Y" instead of asserting a specific defect. One test asserts one thing, so its feedback can be right.
13. **Solutions leak through more than hints:** feedback messages, glossary `example.code`, the explanation's own example and code shown in predictions must not equal (or trivially contain) an exercise solution. The glossary is one click away from the exercise.
14. **No term before its lesson:** a visual caption, panel label or sentence must not use a term that a later lesson defines (check the syllabus `glossary` lists); introduce it briefly with a glossary link instead.
15. **Authored visual states are data too:** mark as `changed` only what changed in that step; a wrong mark produces a false "changed" sentence in the text version.
16. **`tryIt` steps leave the example in a sensible state:** each step works when followed literally from the state the previous step left, and after the suggested change nothing prints `NaN`, `undefined` or stale output unless that is the point being taught.
17. **Words of the interface:** the product is «платформа», the place where code runs is «пісочниця»; learner files are modules («файл», «модуль»), not «скрипт». A variable is «змінна», its identifier is «назва».
18. **Ukrainian terminology:** «рядок» means both *string* and *line* — make the meaning unambiguous («текст у лапках», «рядок коду»). Identifiers are «назви» (назва змінної, назва функції), not «імена». A slash is «скісна риска».

## lesson.yaml

```yaml
id: js-05-02-filter-find          # = directory name
unit: JS-05
title: { uk: …, en: … }
kind: instructional               # instructional | review | assessment | local-task | capstone-step
minutes: 10                       # 5–15 for instructional lessons
contentVersion: 1
objectives: [ { uk: …, en: … } ]  # observable abilities
purpose: { uk: …, en: … }         # required for non-instructional lessons: why this lesson exists
prerequisites: [js-05-01-map]     # direct prerequisites, earlier in teaching order
subskills:                        # exact strings from docs/competencies.json
  - { family: J-05, skill: "map/filter/find/some/every/reduce", depth: practice }   # intro | practice | assess
glossary: [predicate]             # term ids introduced here
selfCheck: [predict-keep, keep-affordable]   # 1–3 prediction/exercise block ids for the "I know this" self-check
blocks: [ … ]                     # read top to bottom; every example/exercise block ends a page
```

### Block kinds

Every block has a unique `id` (kebab-case) inside the lesson. `title` fields and exercise `testTitles` are plain text (no backticks or other Markdown). All other text fields are Markdown (GitHub flavored: lists, tables, fenced code, `> [!note]`, `> [!tip]`, `> [!warning]` callouts).

```yaml
- id: keep-what-matters
  kind: explanation
  title: { uk, en }
  body: { uk, en }

- id: sieve
  kind: analogy
  body: { uk, en }
  limits: { uk, en }              # where the analogy stops being true

- id: filter-flow
  kind: visual
  visual: pipeline                # see VISUALS.md for kinds and spec formats
  title: { uk, en }
  textEquivalent: { uk, en }      # full prose alternative of the whole visual
  spec: { … }

- id: predict-keep
  kind: prediction
  prompt: { uk, en }
  code: |                         # optional; shown highlighted; may use %%key%% with block `strings`
    console.log([1, 2, 3].filter((n) => n > 1).length);
  lang: js                        # optional highlighting of `code`: js (default), html, css, json, ts…
  runnable: false                 # optional: hide "Run and check" after answering (code that is not
                                  #   JavaScript, e.g. lang: html, or that is not meant to run)
  verify: { logs: ["2"] }         # exact console lines (and `error: TypeError` when it throws);
                                  #   code that does not compile: verify: { logs: [], error: SyntaxError }
  answer:
    type: choice                  # choice | multi | text | order
    options:
      - { id: two, text: { uk, en } }                    # or `code: "…"` instead of text
      - { id: three, text: { uk, en }, why: { uk, en } } # `why` is shown when this wrong option was picked
    correct: [two]
    # type: text  → accept: ["2", "two"] (case/space-insensitive), optional placeholder {uk,en}
    # type: order → items: [{ id, text | code }] listed in the correct order
  explanation: { uk, en }

- id: try-filter
  kind: example                   # working code to run and change
  runtime: browser-js             # browser-js | browser-react | concept-preview | isolated-node
  dir: try-filter
  entry: index.js                 # or index.html for pages
  title: { uk, en }
  body: { uk, en }
  tryIt: { uk, en }               # what to change and observe
  strings: { key: { uk, en } }    # optional
  expectError: true               # only when the error is the point of the example
  preview: true                   # optional: show the Page tab (default: true for an .html entry,
                                  #   browser-react and concept-preview; false for a .js entry)

- id: keep-affordable
  kind: exercise
  mode: guided                    # guided | debug | independent
  assessment: true                # optional: gate/assessment tasks
  runtime: browser-js
  dir: keep-affordable
  entry: index.js
  editable: [index.js]            # default: every starter file; other files are read-only
  title: { uk, en }
  instructions: { uk, en }
  testTitles: { "test name in tests.js": { uk, en } }    # one per test; inline Markdown (`code`) is fine
  hints: { nudge: { uk, en }, explanation: { uk, en } }  # omit for mode: independent
  solutionNote: { uk, en }        # shown with the solution: why it works
  feedback:
    - when: { test: "test name" } # or { error: ReferenceError } — shown next to that error, whether the
      message: { uk, en }         #   program threw it while loading or a test threw it (shown with that
                                  #   test); { error: SyntaxError } also matches code that does not compile
  preview: false                  # optional, as for examples
  capabilities: { network: lab }  # optional: none (default) | lab; also loopBudgetMs, testTimeoutMs
  starterPasses: true             # only for rare exercises where the starter is already correct by design

- id: recall
  kind: review
  title: { uk, en }
  items:
    - id: scope-of-let
      from: js-02-03-block-scope  # the earlier lesson being retrieved
      prompt: { uk, en }
      answer: { … }               # same shapes as prediction; `code`/`verify` allowed
      explanation: { uk, en }

- id: to-project
  kind: transfer
  capstoneStep: JS-05             # or checkpoint: CP-JS
  body: { uk, en }

- id: run-locally
  kind: local-task                # guided work outside the platform, confirmed by the learner
  runtime: local-web              # local-web | local-node | local-native
  title: { uk, en }
  intro: { uk, en }
  tools: [ { name: "Node.js", version: "22 or newer", note: { uk, en } } ]
  steps: [ { text: { uk, en }, command: "npm test", expect: { uk, en } } ]
  verify: [ { id: tests-green, text: { uk, en } } ]      # what the learner confirms having seen
  troubleshooting: [ { problem: { uk, en }, fix: { uk, en } } ]
  recovery: { uk, en }            # how to get back to a working state without losing work
```

Commands in `local-task` blocks must be commands you actually ran; record the tool versions you used. Never write "works everywhere".

## Runtimes

| Runtime | What runs | Notes |
|---|---|---|
| `browser-js` | Real browser JavaScript as native ES modules, with a real DOM | Imports need the file extension (`./util.js`), as in the browser. `.ts` files run after type removal. `localStorage` is an isolated per-exercise store. `fetch("./data/items.json")` reads project files; `fetch("/lab/…")` reaches the lab HTTP fixtures when `capabilities.network: lab`. `alert` shows in the console; `confirm`/`prompt` are unavailable (build the UI in the page). A loop running longer than 2 s is stopped. |
| `browser-react` | Real React 19 (`react`, `react-dom/client`) | JSX only in `.jsx`/`.tsx`. Imports resolve like Vite (`./App`). Default page has `<div id="root">`. |
| `concept-preview` | React Native components through `react-native-web` | Always add `limits`: no native rendering, device APIs or performance. |
| `isolated-node` | Real Node.js in an isolated child process | For Node-stage practice: real `node:http` on loopback, `node:fs` in a scratch folder, `node:sqlite`, streams. |

### Pages, images and links (`browser-js` with an `.html` entry)

- **Images: project `.svg` files** (they are text, so they live in the block directory like any other file). They show when referenced from `<img src="img/logo.svg">`, from `url(img/dot.svg)` in a linked `.css` file or an inline `<style>` (resolved from that stylesheet's or page's folder), and from JavaScript (`img.src = 'img/logo.svg'`). Binary images (`.png`, `.jpg`) are not supported; use SVG, or a `data:` URL. A `src` that matches no project file stays exactly as written, so the browser shows the `alt` text (use this on purpose to teach `alt`); the console names the missing file. External addresses (`https://…`) are blocked — the sandbox has no network — and the console says so.
- **Links between pages:** `<a href="about.html">` to another `.html` file of the project opens that page in the result panel (the learner sees its name and a way back to the entry page). Checks always run against the block's `entry`. Links to other addresses are blocked with an explanation.

## tests.js

Tests run after the learner's program finished loading (top-level `await` included). They are ES modules in the same sandbox: import learner modules by path (`import { total } from './cart.js'`).

```js
test('keeps only items at or under the limit', () => {
  expect(scope.affordable.map((item) => item.name)).toEqual([L.lamp]);
});
```

- `test(name, fn)` — `fn` may be async; each test has 4 s.
- `scope` — top-level bindings of the entry file, even without `export` (`scope.price`, `scope.greet`). `scopeOf('src/app.js')` for other files.
- `logs()` — printed lines as text; `rawLogs()` — `[{ level, args }]`; `alerts()`; `loadError()`.
- `expect(value, hint?)` — `toBe`, `toEqual`, `toBeTruthy/Falsy`, `toBeNull/Undefined/Defined/NaN`, `toBeGreaterThan(OrEqual)`, `toBeLessThan(OrEqual)`, `toBeCloseTo`, `toBeInstanceOf`, `toBeTypeOf`, `toContain`, `toContainEqual`, `toHaveLength`, `toHaveProperty`, `toMatch`, `toMatchObject`, `toThrow`, `toHaveBeenCalled(Times|With)`, DOM: `toHaveTextContent`, `toBeVisible`, `toBeInTheDocument`, `toHaveFocus`, `toHaveValue`, `toHaveAttribute`, `toHaveClass`, `toBeDisabled`, `toBeChecked`; plus `.not`, `.resolves`, `.rejects`. The optional `hint` names the checked thing in the failure message.
- DOM: `screen.$(sel)`, `screen.$$(sel)`, `screen.byRole(role, { name })`, `screen.allByRole`, `screen.byText`, `screen.byLabel`, `screen.nameOf(el)`, `screen.text()`; `await user.click(el)`, `user.type(el, text)`, `user.fill`, `user.clear`, `user.select`, `user.check`, `user.press('Enter', el)`, `user.submit(form)` (returns `{ prevented }`).
- Async: `await sleep(ms)`, `await settle()`, `await waitFor(() => condition)`.
- `spy(fn?)`, `mockFetch({ '/api/items': { status: 200, body: […] , delay: 50 } })` → `{ calls, restore }`, `storage` (the exercise's `localStorage`), `L` (localized strings), `files`.
- `await rerun({ globals })` — runs the entry file again as a fresh module (new top-level bindings) with the given values defined as globals, and returns `{ logs, rawLogs, alerts, scope, error }` of that run only (its output does not reach the learner's console or `logs()`; `error` is what it threw, or `null`). Use it to check a top-level script against several inputs, including the boundaries:

  ```js
  // index.js reads `temperature` (given as a global by a read-only input.js: globalThis.temperature ??= 30)
  test('25 and below is cool', async () => {
    expect((await rerun({ globals: { temperature: 25 } })).logs).toEqual([L.cool]);
    expect((await rerun({ globals: { temperature: -4 } })).logs).toEqual([L.cool]);
  });
  ```

  Only the entry module is evaluated again: modules it imports and the page (DOM) are shared, not reset. Await each `rerun` before the next; injected globals are removed after the test. Only globals can be injected: a value declared in the learner's file (`const temperature = 30`) or imported from another module cannot be replaced, so the starter reads its input from a global, as in the example.

Write failure-proof tests: check observable behavior, cover the boundary cases the lesson teaches, and make each test name a sentence a learner can act on (it is translated in `testTitles`).

## Lab HTTP fixtures (`capabilities.network: lab`)

Real loopback HTTP served by the platform, synthetic in-memory data: `GET /lab/ping`, `/lab/echo`, `/lab/status/<code>`, `/lab/delay/<ms>`, `/lab/flaky?key=K&fail=2`, `/lab/search?q=…` (shorter queries answer slower — stale-response race), collections `/lab/<wishlist|planner|habits|expenses>/items[/<id>]` (GET/POST/PUT/PATCH/DELETE, `?lang=uk|en`, `?delay=ms`, `?status=503`, `?flaky=N&key=K`), CORS cases `/lab/cors/open|closed|preflight|credentials`, `POST /lab/reset`.

## Before you report a unit as done

- `node scripts/content/validate.mjs --unit <UNIT>` prints `CONTENT VALID`.
- Every syllabus subskill of the unit's lessons appears in `subskills` with the right depth; the unit has prediction, guided, debug and independent practice, retrieval questions, and its capstone step.
- You read every lesson once as a learner in the running app, in both languages, and ran each example yourself.
- The report lists what you could not verify.
