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

Names that the repository's `.gitignore` drops (`dist/`, `build/`, `coverage/`, `.env`, `.env.*`, `*.log`) work while you author but are never committed; the validator warns about them — name such folders differently (`dist-demo/`, `sample.env.txt`). The directory name equals the lesson id. Ids are stable: never rename a published lesson or block id (add a redirect in `content/redirects.yaml` instead).

## Commands

```
npm run build                                        # once, and after platform changes
node scripts/content/validate.mjs --unit JS-03       # static checks + real execution of every fixture
node scripts/content/validate.mjs --lesson <id>
node scripts/content/validate.mjs --unit JS-12 --locale uk-UA   # browser under another locale (default: en-US)
node scripts/content/smoke.mjs --unit JS-12 --locale uk-UA      # every lesson page in the real app
npm start                                            # read your lesson as a learner (http://localhost:7300)
```

The validator runs every example, every exercise fixture and every verifiable prediction in headless Chrome through the same sandbox the learner uses, in both languages. A lesson is not done until it passes. Headless Chrome reports the locale `en-US` unless `--locale` names another one (Chrome `--lang` plus the page locale: `Intl`, `navigator.language`, `localeCompare` and `toLocaleString` follow it); validate Intl-dependent lessons under `--locale uk-UA` and `--locale en-US`.

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
10. **Honest runtimes.** `browser-js` and `browser-react` are real. `isolated-node` is real Node.js running as a separate process on the learner's computer (see [isolated-node](#isolated-node-real-nodejs)). `concept-preview` (React Native through react-native-web, or any simulation) must carry `limits`. Native-device evidence and work with the learner's own local project (terminal, VS Code, `npm`) come from `local-task` blocks, confirmed by the learner.
11. **Capstone thread.** Every instructional lesson ends with a `transfer` block pointing at the unit's capstone step (`capstoneStep: <UNIT>`). The step itself is the unit's `capstone-step` lesson.

## Language rules

- Every learner-facing string is bilingual: `{ uk: …, en: … }`. Ukrainian is the default and must read naturally, not like a translation. Address the learner informally (ти). Keep professional terms in English where developers do (props, state, hook, closure, callback, commit, merge, runtime) and explain them on first use; link them with `[[term-id]]` or `[[term-id|shown text]]` (inside a table cell escape the bar: `[[term-id\|shown text]]`).
- New terms go to `content/glossary/<UNIT>.yaml` (`id`, `term` = canonical English name, `name` {uk,en}, `definition` {uk,en}, optional `aliases`, `see`, `example.code`). A term is defined once for the whole course; check existing glossary files before adding.
- **Code:** identifiers and comments are English and shared by both languages. Text the example shows to its user (page headings, labels, printed sentences, sample data names) follows the lesson language: write `%%key%%` in the code and define `strings: { key: { uk: …, en: … } }` on the block. Tests read the same values from the global `L` (`L.key`). The same `%%key%%` also works in every text field of that block (`instructions`, `testTitles`, hints, `feedback`, `solutionNote`, `body`, `tryIt`, a prediction's `prompt`, options and `explanation`, a visual's `title` and `textEquivalent`): each language gets its own value, so the task can quote the exact text the checks expect. A placeholder with no entry in the block's `strings` is a validation error. A `review` block has one `strings` table for all its questions (not one per question). Synthetic data comes from `content/capstones/domains.yaml` where it fits.
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
13. **Solutions leak through more than hints:** feedback messages, glossary `example.code`, the explanation's own example and code shown in predictions must not equal (or trivially contain) an exercise solution. The glossary is one click away from the exercise, and a local task one page later is too: its intro never pastes the exercise solution as "the repairs".
14. **No term before its lesson:** a visual caption, panel label or sentence must not use a term that a later lesson defines (check the syllabus `glossary` lists); introduce it briefly with a glossary link instead.
15. **Authored visual states are data too:** mark as `changed` only what changed in that step; a wrong mark produces a false "changed" sentence in the text version.
16. **`tryIt` steps leave the example in a sensible state:** each step works when followed literally from the state the previous step left, and after the suggested change nothing prints `NaN`, `undefined` or stale output unless that is the point being taught.
17. **Words of the interface:** the product is «платформа», the place where code runs is «пісочниця»; learner files are modules («файл», «модуль»), not «скрипт». A variable is «змінна», its identifier is «назва».
18. **Predictions and review questions are also shown alone** (on the Review page, after a wrong answer): like `selfCheck` items they must not say "below", "above" or "in a minute".
19. **Locale and engine dependence:** `localeCompare` without a locale follows the browser language (Ukrainian letters reorder) — pass a locale or use data that sorts the same everywhere; an inconsistent or boolean comparator gives an engine-defined order — say "in Chrome" when you show it.
20. **A check that measures work (counts reads, calls or comparisons) is announced in the task**, and new syntax (for example a brace-less `if`) gets one sentence where it first appears.
21. **Ukrainian terminology:** «рядок» means both *string* and *line* — make the meaning unambiguous («текст у лапках», «рядок коду»). Identifiers are «назви» (назва змінної, назва функції), not «імена». A slash is «скісна риска». A flex row is «ряд» (because «рядок» is also a line), and the apostrophe is always U+2019 (’), never `'` or `ʼ`.
22. **A crash while the program loads empties `scope`:** every check then fails with "… is not a function" and all feedback shows together. Each feedback must stay true in that case, the `TypeError` rule must cover that message, and a check such as `expect(() => scope.fn(x)).toThrow(TypeError)` must first assert that `scope.fn` is a function, or it passes by mistake.
23. **Describe Run, Stop and console behaviour only after a timed run in the app.** In a stuck loop the console stays empty until the `LoopBudgetError` card appears (about 2 s), and Stop discards output printed before it.
24. **An "alternative run" state in an authored visual needs an explicit `changed` list;** otherwise the default diff against the previous state marks it as a change.
25. **Multi-file predictions cannot be verified by the validator** (`verify` runs one `index.js`). Run them in the sandbox yourself and say so in your hand-back.
26. **Check `code-trace` captions against the compiled trace** (`dist/content/lessons/<id>.json`): a caption must not describe panel state the trace does not show (an "empty" stack that still holds the file's frame, a variable that is no longer in scope).
27. **Hints and feedback name exactly what the test asserts, identically in both languages** (id vs name, row vs column). Read the Ukrainian and the English side by side against the test.
28. **Quote an earlier lesson's code verbatim from its file**, never from memory.
29. **No per-test feedback for failures before the run starts** (a missing import path, a missing extension, a bare specifier): the tests never start, so only the error card is shown and that feedback can never appear.
30. **Browser facts that were written wrong (measured in Chrome):** an input with only a `placeholder` still gets its accessible name from it — write "named only by its placeholder, there is no label", never "has no name"; real Enter in a field fires a click on the form's submit button, while `user.press('Enter', input)` in tests submits without a click; where Tab goes first depends on where navigation starts (after a click or from the top of the page).
31. **A zoom claim names a window width or is conditional.** The application switches to one column below 1100 CSS px, so the result panel can get wider when the learner zooms in; "zoom to 200 %" alone is not reproducible.
32. **`alt` fixtures model the practice the unit teaches** (a visible `<label>`, not `aria-label` alone), and a test must require what the lesson teaches rather than what a helper happens to accept (`screen.nameOf` accepts `aria-label`).
33. **What the checks print after a load crash depends on the test:** a guarded check says `type of X: expected "undefined" to be "function"`, an unguarded one `Cannot read properties of undefined (reading 'X')` — not always "… is not a function" (this refines rule 22). Say "if every check fails at once, fix the first console error". The validator warns about a `when: { error: TypeError }` message that quotes "… is not a function" in an exercise whose checks guard the function first. A starter stub must not crash the ready-made demo code (`.join`, `.set`, `.value` on `undefined`): return an empty value of the right type, or wrap each demo part in its own `try`/`catch`.
34. **`this` in callbacks, measured:** a click listener gets the element, a timer callback gets `window` (on the platform and in a browser tab alike). Never write "called with no object" or "`this` is undefined" for them.
35. **Visual labels and sample data are localized too:** labels in `sequence`/`diagram` visuals are bilingual objects, and sample strings inside `visuals/*.js` or inside `uk:` code fences go through `strings`, like any example.
36. **A fake clock in tests replaces the whole family** — `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` — with ids that cannot reach real timers (`fake-N`).
37. **Local-task lessons own their state:** create or locate every folder and repository the lesson uses; never assume an unauthored lesson left it behind. Every change of port or host is a new storage origin — say so where the port changes. "Formatting changes only whitespace" is false for Prettier (trailing commas, quotes, parentheses).
38. **Learner tests use the course runner** (`import { test, expect } from "./testing.js"`, a driver file calls `run()`). `node --test` on such files reports a pass without running anything; the local command is `node run-tests.js`. Project `.json` files are parsed before the run, so invalid JSON is an error card (rule 29), never per-test feedback.
39. **"The platform does not stop X" must say what it does instead** (the "not responding" notice after 3 s and the Stop button), and a static fixture that ignores its query must say so in the task. An absolute rule ("always…") must survive the later lessons of the same unit.
40. **Inline fields hold one paragraph:** `text` of a local-task step, `why`, `problem`, `note`, `title`, `label` and objectives are compiled as inline Markdown — a fenced block, a list or a blank line there collapses onto one line (a file that starts with `//` would be commented out when copied). File contents and multi-line output go into a block field such as the local task's `intro`, labelled by step.
41. **Local commands are captured from a real run:** commits at least one second apart (graph order), a UTF-8 terminal (npm tree characters), excerpts marked with `…`. Never run `git config --global` without checking the current value first; never repeat in a command block a `cp` or `>` that the learner was already asked to run before editing that file. In a review exercise the starter's own sample input must not already show the defect.
42. **Every stated rule of a task has a check and a `wrong` fixture** (a length limit, "do not delete tests"). Feedback of a check that only runs after a precondition (for example "your tests pass on the correct code") names that precondition first. A hint must not say "only X works" when an `alt` fixture shows otherwise, and a transfer block's claim about the project is checked against `content/capstones/steps/` — until that step exists, a claim about the capstone's layout stays conditional.
43. **DevTools steps describe the default interface state:** collapsed panes, items behind the `»` overflow, saving a snippet before a breakpoint can be set. Never say a server "cannot" answer with an error when the lab can be asked to (`/lab/status/500`).
44. **Time-zone-sensitive checks run under zones on both sides of UTC** (for example UTC+14 and UTC−11) with a full emulation of the machine's zone — the `Date` constructor and local getters, not only the formatter's default zone (see `withMachineZone` in `content/units/JS-12/js-12-10-intl-locale/`). Prove determinism with fixtures: an `alt-local` solution that is correct in local time must pass, and `wrong-*` solutions that mix local time and UTC must fail on every machine. Running the validator under several `TZ` values does not test learner variants.
45. **Say "N `console.log` calls", not "N lines of code"**, when the snippet has more lines than outputs. One long synchronous call (a runaway regular expression) is not stopped by the 2-second loop budget; the platform stays responsive and Stop ends the run — describe it only after a timed run (rule 23). Write `[ [k, v] ]` rather than `[[k, v]]` in code spans: the double bracket reads as a glossary link.
46. **Glossary link text is inline Markdown:** `[[id|text]]` renders a code span or bold inside `text` (`[[closure|\`makeCounter\` closure]]`); it cannot contain `]` (not even inside a code span such as `` `items[0]` ``) or another link. The validator reports such a link in every prose field, including hints, feedback and review questions that the smoke test never shows.
47. **Every troubleshooting row is reproduced** on the current Node and on the course minimum (Node 22) — error texts differ between versions (module-type detection on Node 25, `bad option` on Node 20); a row you cannot reproduce is removed or made conditional. Turning a compiler flag off is not "silent": run such a step on the learner's whole lab folder.
48. **TypeScript facts:** `import { type X }` is not `import type { X }` under `verbatimModuleSyntax` (the first still emits an import under `tsc`; the sandbox drops it entirely, and so do Metro and Babel — never generalise `tsc` emit to another toolchain); the sandbox strips types and checks nothing — say that `tsc` in the local task is what checks them. A visual must not trace the function the exercise asks for (rule 13); an `alt` that "returns X" must not pass by returning its raw input.
49. **Authored memory graphs draw real structures:** an array of N items is an object with `ctor: "Array(N)"` and bracketed keys, never a placeholder `Array(3)`; a module `const` that still points to a removed element is a retainer — do not caption it as unreachable.
50. **Generators and iterators, measured:** `break` in `for…of` calls `return()` and closes the generator (it does not stay paused); `finally` runs before the line after the loop.
51. **Cite the documentation of the version the task targets, at its real strength.** Link the versioned page when one exists (React Native 0.86, not "latest") and re-read per-SDK setup pages for every target: the iPhone path of Expo Go changed in SDK 57 (a paid Apple developer account and a TestFlight build). A guide that says something "usually works best" does not "recommend" it, and when the docs have no tab for a platform, name the source of the instruction or mark it unverified.
52. **Check a "there is no X" claim against that version's type definitions and source, not only its docs page.** React Native 0.86 `View` has an experimental `onClick`, off by default. Hint examples use only APIs documented for the target runtime, not ones that merely work in the browser preview; when you cite a default or an exception to it (rows within `initialNumToRender` are never unmounted), check every later number in the lesson against it.
53. **Name every preview simulation where the learner first meets it**, together with the real API it stands in for (`DeviceFrame`, `Scaled`, `SimulatedKeyboardAvoidingView`, `a11yFocus`, `platformSim`). A `tryIt` step describes what the preview actually prints or shows, never the effect on a device: grouping, focus and screen-reader announcements are device checks for a local task.
54. **A check is only as strong as its fixture data.** A right-edge test in which every name wraps passes any row layout: for each stated rule write a `wrong` fixture that breaks only that rule (rule 42) and run it. A preview check that reacts to the same DOM event as the web mistake cannot tell the two apart; simulate the native path instead (for example, call `onPress` through the fiber).
55. **React Native facts, measured:** a `Text` is accessible by default (the "needs `accessible={true}`" note is about `View`s), and react-native-web reports bare text outside `Text` with `console.error`, a red line, not a warning. The pressed style of `Pressable` comes from `onPressIn`, before `onPress`, so a slow `onPress` delays un-pressing, not pressing. The browser runs `requestAnimationFrame` callbacks before paint, so "deferred work runs after the change is drawn" is a device claim — in the preview only the order changes. Advice to "make it scroll" next to a `FlatList` warns against nesting it in a `ScrollView` of the same direction.
56. **"Prove that X is unchanged with `git diff`" needs a commit of X first:** untracked files never appear in a diff, and a later commit hides the edits made before it.

## lesson.yaml

```yaml
id: js-05-02-filter-find          # = directory name
unit: JS-05
title: { uk: …, en: … }
kind: instructional               # instructional | review | assessment | local-task | capstone-step
                                  #   (an assessment lesson has no "I know this" and is not skipped with its
                                  #   unit: it is completed only through its exercises)
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

Every block has a unique `id` (kebab-case) inside the lesson. `title` fields are plain text (no backticks or other Markdown); exercise `testTitles` are inline Markdown (code spans are fine, no block markup). All other text fields are Markdown (GitHub flavored: lists, tables, fenced code, `> [!note]`, `> [!tip]`, `> [!warning]` callouts). Raw HTML is not markup: a tag written in prose (`<ul>`, “<name>”) is shown literally as text, so quote tags freely, preferably in a code span; links are kept only for `https:`, `http:`, `mailto:`, relative and `#` addresses.

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
  assessment: true                # optional: gate/assessment tasks — "Show the solution" is offered only
                                  #   after every check passed (the solution cannot be used to pass it)
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
                                  #   (isolated-node: network none | loopback, workers, timeoutMs, testTimeoutMs)
  limits: { uk, en }              # optional (required for concept-preview): what this runtime cannot show
  starterPasses: true             # only for rare exercises where the starter is already correct by design

- id: recall
  kind: review
  title: { uk, en }
  items:
    - id: scope-of-let            # quote ids YAML would read as another type: id: "null", id: "true"
      from: js-02-03-block-scope  # the earlier lesson being retrieved
      prompt: { uk, en }
      code: |                     # optional, as in a prediction (also `lang`, `runnable`)
        { let n = 1; } console.log(typeof n);
      verify: { logs: ["undefined"] }   # as in a prediction: runs this question's own `code`, so
                                  #   verify needs `code` on the same question (never inside `answer`)
      answer: { … }               # same shapes as prediction
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
  tools: [ { name: "Node.js", version: "22.13", note: { uk, en } } ]   # version: a plain string shown in
                                  #   both languages, or { uk, en } when it has words ("22.13 or newer")
  steps: [ { text: { uk, en }, command: "npm test", expect: { uk, en } } ]
  verify: [ { id: tests-green, text: { uk, en } } ]      # what the learner confirms having seen
  troubleshooting: [ { problem: { uk, en }, fix: { uk, en } } ]
  recovery: { uk, en }            # how to get back to a working state without losing work
```

Commands in `local-task` blocks must be commands you actually ran; record the tool versions you used. Never write "works everywhere".

## Runtimes

| Runtime | What runs | Notes |
|---|---|---|
| `browser-js` | Real browser JavaScript as native ES modules, with a real DOM | Imports need the file extension (`./util.js`), as in the browser. A project `.json` file imports as its data: `import items from "./items.json" with { type: "json" }` (also `import()` with `{ with: { type: "json" } }`); the platform also accepts it without `with`, which a browser refuses, so examples write `with { type: "json" }`. Other import attributes (`type: "css"`) are refused before running. `.ts` files run after type removal. `localStorage` is an isolated per-exercise store. `fetch("./data/items.json")` reads project files; `fetch("/lab/…")` reaches the lab HTTP fixtures when `capabilities.network: lab`. `alert` shows in the console; `confirm`/`prompt` are unavailable (build the UI in the page). `console.trace()` shows in the console with the stack of the call. Stack traces (`error.stack`, the error card) name project files (`index.js:3:7`) and leave out the platform's own frames. A loop running longer than 2 s is stopped. |
| `browser-react` | Real React 19 (`react`, `react-dom/client`) | JSX only in `.jsx`/`.tsx`. Imports resolve like Vite (`./App`). Default page has `<div id="root">`. |
| `concept-preview` | React Native components through `react-native-web` | Always add `limits`: no native rendering, device APIs or performance. |
| `isolated-node` | Real Node.js in an isolated child process on the learner's computer | For Node-stage practice: real `node:http` on loopback, `node:fs` in the exercise folder, `node:sqlite`, streams. No page, no npm packages. See [isolated-node](#isolated-node-real-nodejs). |

### Runtimes per stage

Both validators (`validate.mjs` for lesson blocks, `validate-syllabus.mjs` for syllabus practice entries) apply one table, `STAGE_RUNTIMES` in `shared/content-schema.js`:

| Stage | Allowed runtimes |
|---|---|
| JS | `browser-js`, `local-web`, `concept-preview` |
| RE | `browser-react`, `browser-js`, `local-web`, `concept-preview` |
| RN | `browser-js`, `concept-preview`, `local-native`, `local-web`, `isolated-node`, `local-node` |
| NO | every runtime |

A React Native unit may contain computer-only Node.js work — the supplied mock service of `rn-06-01` runs as an `isolated-node` example and is started by the learner in a `local-node` task — because real server processes on the learner's machine are `local-node` in every stage. Such a task proves nothing about the app on a device: every RN unit still needs a `local-native` task, and every NO unit an `isolated-node` or `local-node` entry.

### Pages, images and links (`browser-js` with an `.html` entry)

- **Images: project `.svg` files** (they are text, so they live in the block directory like any other file). They show when referenced from `<img src="img/logo.svg">`, from `url(img/dot.svg)` in a linked `.css` file or an inline `<style>` (resolved from that stylesheet's or page's folder), and from JavaScript (`img.src = 'img/logo.svg'`). Binary images (`.png`, `.jpg`) are not supported; use SVG, or a `data:` URL. A `src` that matches no project file stays exactly as written, so the browser shows the `alt` text (use this on purpose to teach `alt`); the console names the missing file. External addresses (`https://…`) are blocked — the sandbox has no network — and the console says so.
- **Links between pages:** `<a href="about.html">` to another `.html` file of the project opens that page in the result panel (the learner sees its name and a way back to the entry page). Checks always run against the block's `entry`. Links to other addresses are blocked with an explanation.

## tests.js

Tests run after the learner's program finished loading (top-level `await` included). They are ES modules in the same sandbox: import learner modules by path (`import { total } from './cart.js'`). This section describes the browser runtimes; `isolated-node` checks have their own helpers ([Check helpers](#check-helpers-node-harness)).

```js
test('keeps only items at or under the limit', () => {
  expect(scope.affordable.map((item) => item.name)).toEqual([L.lamp]);
});
```

- `test(name, fn)` — `fn` may be async; each test has 4 s.
- `scope` — top-level bindings of the entry file, even without `export` (`scope.price`, `scope.greet`). `scopeOf('src/app.js')` for other files.
- `logs()` — printed lines as text (`console.log`, `info`, `warn`, `error`, `debug`, `table`, `dir`; not `alert` and not `console.trace`); `rawLogs()` — `[{ level, args }]` of all of them, a `console.trace` call as `{ level: "trace", args, stack }` (`stack`: one `at …` frame per line, in project paths, as the console shows it); `alerts()`; `loadError()`. Format specifiers in the first argument are applied as in the browser console when more arguments follow (`%s`, `%d`/`%i`, `%f`, `%o`/`%O`; `%c` styling is dropped): `console.log("%s: %d", "Lamp", 3)` gives the line `Lamp: 3` and `rawLogs()` args `["Lamp: 3"]`, in the learner's console too. `console.table` and `console.dir` are not formatted.
- `expect(value, hint?)` — `toBe`, `toEqual`, `toBeTruthy/Falsy`, `toBeNull/Undefined/Defined/NaN`, `toBeGreaterThan(OrEqual)`, `toBeLessThan(OrEqual)`, `toBeCloseTo`, `toBeInstanceOf`, `toBeTypeOf`, `toContain`, `toContainEqual`, `toHaveLength`, `toHaveProperty`, `toMatch`, `toMatchObject`, `toThrow`, `toHaveBeenCalled(Times|With)`, DOM: `toHaveTextContent`, `toBeVisible`, `toBeInTheDocument`, `toHaveFocus`, `toHaveValue`, `toHaveAttribute`, `toHaveClass`, `toBeDisabled`, `toBeChecked`; plus `.not`, `.resolves`, `.rejects`. The optional `hint` names the checked thing in the failure message.
- DOM: `screen.$(sel)`, `screen.$$(sel)`, `screen.byRole(role, { name })`, `screen.allByRole`, `screen.byText`, `screen.byLabel`, `screen.nameOf(el)`, `screen.text()` (the page's text without the content of `<script>` and `<style>`); `byRole`/`allByRole` skip hidden elements (`display: none` or `hidden` on the element or any ancestor, `visibility: hidden` on the element) unless `{ hidden: true }`, and `toBeVisible` uses the same rule; `await user.click(el)`, `user.type(el, text)`, `user.fill`, `user.clear`, `user.select`, `user.check`, `user.press('Enter', el)`, `user.submit(form)` (returns `{ prevented }`).
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

### Feedback and course runners

`feedback` rules `when: { error: Name }` match an error that reaches the platform: one the program throws while it loads (shown with the error card) or one a check in `tests.js` throws itself (shown with that check). When the learner writes their own tests and a check runs them through a course runner (`testing.js`, rule 38), an error inside a learner test — a missing import name (`ReferenceError`), a call of `undefined` — is caught by that runner and becomes a failed learner test; the check then fails with an assertion, and no `error:` rule fires. Per-check feedback (`when: { test }`) is the only path for such failures: name the precondition and say that the runner's own output in the console shows which learner test threw. The validator warns about a `when: { error: ReferenceError }` rule in an exercise whose checks use a course runner; keep such a rule only for errors while the program loads.

The validator gives each browser run — one example, prediction or fixture together with all its checks — 15 s in total and then reports `run ended with status "timeout"`, even when every check stays within its own 4 s. Keep the checks of one exercise well below that sum.

Write failure-proof tests: check observable behavior, cover the boundary cases the lesson teaches, and make each test name a sentence a learner can act on (it is translated in `testTitles`).

## isolated-node (real Node.js)

`runtime: isolated-node` runs the learner's files as a real Node.js process on their computer, started by the local platform server (API and security model: [SERVER-API.md](../docs/platform/SERVER-API.md)). The learner gets the same workspace as in the browser runtimes — Run, Check, Stop, console, checks with titles and authored feedback, hints, drafts, progress — but no Page tab: the result is what the program prints and what the checks observe. The workspace says that this is real Node.js (with its version) and lists the limits below in its "Limits of the Node.js runtime" disclosure, under the block's own `limits` (optional for this runtime).

**What happens on Run.** The files (with `%%key%%` text in the lesson language) are copied into a fresh temporary folder — the process's working directory, `process.cwd()` — and `node <entry>` runs there. stdout and stderr stream into the console as they are printed (stderr in red; paths inside the folder are shown relative, `index.js:3:7`). An uncaught error also gets the usual error card with localized guidance next to the original message. The folder is deleted after the run.

**What happens on Check.** The harness imports the entry first (its output is what `logs()` returns), then `tests.js`, then runs the tests one after another. If the program throws while loading, the learner sees that error once with "fix this error first" instead of the feedback of every failing check.

### File layout

```
<example-dir>/index.js                        the entry: what `node index.js` runs
<exercise-dir>/starter/index.js               the entry; may be a read-only driver …
<exercise-dir>/starter/app.js                 … while the learner edits app.js (editable: [app.js])
<exercise-dir>/starter/items.js               read-only data
<exercise-dir>/solution/app.js, alt/app.js, wrong[-name]/app.js
<exercise-dir>/tests.js                       checks, run by the Node harness
```

- Every `.js` file is an ES module: the platform writes `package.json` `{ "type": "module" }` unless the starter has its own. Import exercise files by relative path **with the extension** (`./app.js`) and built-in modules with `node:` (`node:fs`, `node:http`). There are **no npm packages**: a bare `import express from "express"` fails with an explanation. `.ts` files run through Node's type stripping where the installed Node supports it (`.tsx` never).
- `tests.js` imports learner modules like any module: `import { createApp } from './app.js';`. Its path in the run is `__tests__.js`, next to the learner files.

### Capabilities

```yaml
capabilities:
  network: loopback    # none (default) | loopback: this computer only (127.0.0.1, ::1, localhost)
  workers: true        # worker threads (default false)
  timeoutMs: 5000      # wall clock of the whole run or check, 100–60000 (default 10000)
  testTimeoutMs: 3000  # each check, 50–30000 (default 4000)
```

They are sent to the executor as they are; the validator rejects other keys and values. With `network: loopback` a server must listen on an explicit loopback address (`server.listen(3000, '127.0.0.1')`); `listen(3000)` is refused with that advice, because it would accept connections from the local network.

### Check helpers (Node harness)

Globals (read-only): `test(name, fn, { timeoutMs }?)`; `expect(value, hint?)` with the same matchers and failure messages as the browser runner (no DOM matchers); `spy`, `sleep`, `waitFor`; `logs({ stream }?)` — printed lines so far (`stream: 'stdout'` or `'stderr'` for one stream); `listen(server, host = '127.0.0.1')` — starts an `http.Server`/`net.Server` on a free loopback port and returns `http://127.0.0.1:<port>`, closed after the last test (needs `network: loopback`); `request(url, { method, headers, body, signal })` — one HTTP request without connection pooling → `{ status, statusText, headers, text, json }` (an object `body` is sent as JSON); `tmp(name)` — an absolute path under `.tmp/` in the exercise folder, parent folders created; `activeResources()` — open handles created by learner code, for leak lessons (a closed handle disappears one event-loop turn after its close callback: `await waitFor(() => activeResources().length === 0)`); `loadError()` — the entry's import error or `null`; `L` — the block's `strings` in the learner's language.

Not available in Node checks (browser only): `scope`, `scopeOf`, `screen`, `user`, `rerun`, `mockFetch`, `storage`, `files`, `rawLogs`, `alerts`, `settle`. An uncaught error while a check runs fails that check at once (`uncaught error during the test: …`).

### Limits and what is not isolated

| Limit | Value | When it is reached |
|---|---|---|
| Time | `timeoutMs`, default 10 s (max 60 s), for a run and for a whole check run | the process is stopped; "ran longer than N s" |
| Each check | `testTimeoutMs`, default 4 s | that check fails, the next runs |
| Output | 200 KB of stdout + stderr | the process is stopped, the output is cut off |
| Memory | 256 MB JavaScript heap (Buffers are not capped) | Node aborts the program |
| Files | 200 files, 2 MB sent; 64 MB / 5000 entries written in the folder | refused / stopped |
| Concurrent runs | 2 at a time per platform server (all tabs together) | "two Node.js programs are already running" |
| File system | read and write only inside the exercise folder | `ERR_ACCESS_DENIED`, explained to the learner |
| Processes | no child processes, no native addons, no inspector; worker threads only with `workers: true` | `ERR_ACCESS_DENIED` |
| Network | per `capabilities.network` | `ERR_JSLL_POLICY` with the reason |

Isolation is Node's permission model plus a platform guard and, on macOS, an operating-system sandbox (Seatbelt). Node itself calls its permission model a seat belt for honest code, not a sandbox against malicious code. The permission model does **not** cover `node:sqlite` database paths, a worker started with its own `execArgv`, or signals to other processes; the platform guard covers them (it stops honest mistakes; deliberate code can get around it) and, on macOS, Seatbelt does too. Linux and Windows have no operating-system layer. Write exercises for honest learners and never present the runtime as a security boundary.

### Authoring rules

1. **Examples finish on their own.** The validator requires exit code 0 within the time limit (a non-zero exit only with `expectError: true`). A server example starts on a free port, sends its own requests and closes the server, as below — a server that listens until Stop fails validation.
2. **The entry is imported before the checks**, so it must be safe to import and must end: no endless servers or timers, and every network wait has a timeout (`AbortSignal.timeout(2000)`), so that a broken handler cannot hold the check until the time limit.
3. **All checks of one run share `timeoutMs`.** A fixture whose checks each hang for the 4 s per-check limit can exceed the 10 s run limit; the validator reports that as an error. Prefer wrong fixtures that answer wrongly over ones that never answer.
4. **Localized text** works as in the browser runtimes: `%%key%%` in the files, `strings` on the block, `L.key` in the checks. Keep the keys' total under 32 KB.
5. **Validation.** `node scripts/content/validate.mjs` runs every example (in both languages when the block has `strings`) and every fixture (starter, solution, `alt*`, `wrong*`) through the real executor with the browser runtimes' pass/fail rules. On a machine where the executor is unavailable (no Node permission model, or `JSLL_NODE_RUNNER=off`) the blocks are reported as **UNVERIFIED** — a note, and the summary says `CONTENT UNVERIFIED`; with `--release` it is an error.

### Complete small example

The fixture lesson `tests/fixtures/content/units/NO-01/no-01-01-fixture-node/` is the reference (validate it with `JSLL_CONTENT_ROOT=tests/fixtures/content node scripts/content/validate.mjs --lesson no-01-01-fixture-node`). Its exercise, shortened to the essentials:

```yaml
- id: node-items-server
  kind: exercise
  mode: guided
  runtime: isolated-node
  dir: node-items-server
  entry: index.js
  editable: [app.js]
  capabilities: { network: loopback }
  strings:
    lamp: { uk: "Настільна лампа", en: "Desk lamp" }
    plant: { uk: "Кімнатна рослина", en: "House plant" }
  title: { uk: "Сервер зі списком речей", en: "A server with a list of items" }
  instructions: { uk: "…", en: "Finish createApp in app.js: GET /items answers 200 with the list as JSON; any other address answers 404." }
  testTitles:
    "GET /items answers 200 with the items as JSON": { uk: "…", en: "…" }
    "an unknown address answers 404": { uk: "…", en: "…" }
  hints: { nudge: { uk: "…", en: "…" }, explanation: { uk: "…", en: "…" } }
  solutionNote: { uk: "…", en: "…" }
  feedback:
    - when: { test: "an unknown address answers 404" }
      message: { uk: "…", en: "An address other than /items must get status 404. Check request.url." }
```

```js
// starter/items.js (read-only)
export const items = [{ id: 1, name: '%%lamp%%' }, { id: 2, name: '%%plant%%' }];

// starter/index.js (read-only entry): starts the server, sends two requests, stops it.
import { createApp } from './app.js';
const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const route of ['/items', '/missing']) {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(2000) });
    console.log(`GET ${route} → ${response.status} ${await response.text()}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}

// solution/app.js (the starter answers 'TODO' everywhere)
import http from 'node:http';
import { items } from './items.js';
export function createApp() {
  return http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/items') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(items));
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'not found' }));
  });
}

// tests.js
import { createApp } from './app.js';
test('GET /items answers 200 with the items as JSON', async () => {
  const response = await request(`${await listen(createApp())}/items`);
  expect(response.status, 'status of GET /items').toBe(200);
  expect(response.json, 'body of GET /items').toEqual([{ id: 1, name: L.lamp }, { id: 2, name: L.plant }]);
});
test('an unknown address answers 404', async () => {
  const response = await request(`${await listen(createApp())}/missing`);
  expect(response.status, 'status of GET /missing').toBe(404);
});
```

The same lesson's example (`node-notes`) writes `notes.txt` in the exercise folder, reads it back and prints `process.version` — output only real Node.js can produce.

## Lab HTTP fixtures (`capabilities.network: lab`)

Real loopback HTTP served by the platform, synthetic in-memory data: `GET /lab/ping`, `/lab/echo`, `/lab/status/<code>`, `/lab/delay/<ms>`, `/lab/flaky?key=K&fail=2`, `/lab/search?q=…` (shorter queries answer slower — stale-response race), collections `/lab/<wishlist|planner|habits|expenses>/items[/<id>]` (GET/POST/PUT/PATCH/DELETE, `?lang=uk|en`, `?delay=ms`, `?status=503`, `?flaky=N&key=K`), CORS cases `/lab/cors/open|closed|preflight|credentials`, `POST /lab/reset`.

Measured while authoring JS-08 (real sandbox, Chrome):

- `/lab/echo` reports `origin: "null"` because the sandbox has an opaque origin. `/lab/flaky` counters live for the whole server lifetime: use a unique key per run. `/lab/search` waits about 300 ms.
- A URL outside the lab is rejected with `TypeError: Failed to fetch (blocked by the sandbox network policy)` and a console note that the network is disabled. Do not present that as "offline"; simulate offline with `mockFetch({ networkError: true })`.

## Timers, promises and `fetch` in the browser sandbox (measured)

- **Timing limits:** a run waits only for timers of 1500 ms or less and settles at 3000 ms; a loop running longer than 2 s is stopped with `LoopBudgetError`. Keep every delay whose output is checked below those limits.
- **Order of a click and a timer:** in Chrome a click made during a long task is handled before a timer callback that was queued earlier. Never claim the opposite.
- **Fake clock in tests:** replacing `window.setTimeout` inside a test works, and so does `rerun()` under it. The fake must skip non-function callbacks, or the typical mistake `setTimeout(fn(), ms)` crashes the test instead of failing it. Flush promise callbacks with `sleep(0)`.
- **Project files through `fetch`:** `./data/x.json` answers 200 `application/json`, a missing file answers 404 "Not Found". They are served inside the sandbox, so they never appear in the DevTools Network panel. A prediction runs only `index.js`, so a prediction that fetches a project file needs `runnable: false`.
- **Abort:** an aborted request rejects with a `DOMException` named `AbortError`; `AbortSignal.timeout` gives `TimeoutError`. `mockFetch` honours the signal; to inspect it, pass a handler function and read `init.signal`.
- **Rejections:** an awaited rejection at top level is reported as a runtime error with the reason's name (so `verify.error` works); a fire-and-forget rejection is reported as an unhandled rejection. A solution that triggers either fails validation, and event-loop visuals must finish without any rejection.

## Before you report a unit as done

- `node scripts/content/validate.mjs --unit <UNIT>` prints `CONTENT VALID`.
- Every syllabus subskill of the unit's lessons appears in `subskills` with the right depth; the unit has prediction, guided, debug and independent practice, retrieval questions, and its capstone step.
- You read every lesson once as a learner in the running app, in both languages, and ran each example yourself.
- The report lists what you could not verify.
