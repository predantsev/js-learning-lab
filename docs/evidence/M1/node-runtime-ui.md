# Evidence: the isolated Node runtime in lessons and in the content validator

Date: 2026-10-02. Issue #7 (M1 platform; DEC-12 "RN/Node concept exercise with real edited code/output,
capability labels", REQ-013, REQ-014, REQ-021–REQ-023, REQ-032). Everything below was run on this
machine on top of `feat/7-platform-foundation` (last merged: `cdee864`, merge commit `53bc057`).
Outputs are copied from the terminal; claims that were not measured are marked *unverified*.
The executor itself (API, isolation layers, limits) is documented in
[`SERVER-API.md`](../../platform/SERVER-API.md) and measured in [`server-runtime.md`](server-runtime.md).

## What was built

| Part | Files |
|---|---|
| Lesson UI: `isolated-node` blocks run through `POST /api/node/run`; output streams into the Console; Check runs `tests.js` in the Node harness with the same titles, authored feedback (`when.test`, `when.error`) and progress recording as browser exercises; Stop, time limit, output limit, busy (429), lost connection, unreachable server and "unavailable" each have a localized status and keep the code; no Page or Storage tab; runtime note with the real engine version; "Limits of the Node.js runtime" disclosure (block `limits` + platform limits + the server's own list) | `app/src/components/useNodeRunner.ts`, `NodeRuntime.tsx`, small edits in `Workspace.tsx`, `pages.tsx` (Settings → How code runs), `app/src/i18n/uk.ts` + `en.ts`, `app/src/styles/app.css`, `app/src/lib/types.ts` |
| Errors in Node's own terms: the uncaught error that ended a run is parsed from Node's printout (name, message, code, learner file/line, parse errors as "could not start"); node-specific guidance for `ERR_ACCESS_DENIED`, `ERR_JSLL_POLICY`, module resolution | `shared/node-run.js` (`parseUncaughtError`), `Workspace.tsx` `guidanceKey` |
| Load errors in checks (both runtimes): an error thrown before the browser sandbox's `loaded` event, or before the first Node check, is shown once with "fix this error first"; per-check authored feedback is hidden, the rows stay | `useRunner.ts` (`atLoad`), `Workspace.tsx` (`TestsView quiet`), `server/node-harness/test-main.mjs` (`phase: "load"`) |
| Executor additions: `strings` → `L` in checks; an uncaught error during a check fails that check at once; `JSLL_NODE_RUNNER=off` and `overrides.nodeRunner` to turn execution off / exercise the real "no permission model" path | `server/api/lib/node-runner.mjs`, `server/api/node-run.mjs`, `server/app.mjs`, `server/node-harness/test-main.mjs` |
| Content: block → request mapping (`capabilities.network` none\|loopback, `workers`, `timeoutMs`, `testTimeoutMs`; `%%key%%` strings); schema check of those capabilities | `shared/node-run.js` (`nodeRunRequest`), `shared/content-schema.js` |
| Validator: `isolated-node` examples and fixtures (starter/solution/alt/wrong, both languages when the block has strings) run through the real API with the browser runtimes' pass/fail rules; executor unavailable → `UNVERIFIED` note, error with `--release`; Chrome starts only when a browser run is needed | `scripts/content/validate.mjs` |
| Fixture root (synthetic, `tests/fixtures/content/`): `no-01-01-fixture-node` (example writes/reads `notes.txt` in the exercise folder and prints `process.version`; exercise: HTTP server on loopback checked by real requests, solution/alt/wrong/wrong-no-type) and `rn-01-01-fixture-preview` (concept-preview example and exercise, both with `limits`) | `tests/fixtures/content/syllabus/{NO-01,RN-01}.yaml`, `tests/fixtures/content/units/{NO-01,RN-01}/…` |
| Authoring docs | `content/README.md` § isolated-node (real Node.js); `docs/platform/SERVER-API.md` (`strings`/`L`, error `phase`, fail-fast, off switch) |

## Environment

```
$ sw_vers; uname -m
ProductName:    macOS
ProductVersion: 26.6.2
BuildVersion:   25G83
arm64
$ node --version                       → v25.2.1 (runs every suite below)
playwright-core chromium.launch({ channel: 'chrome' }).version() → 154.0.8037.93
Node 22/24 checks: the npx-cached binaries v22.23.3 and v24.21.0 (no dependency added)
features.isolatedNode on this machine: available true, node v25.2.1, osSandbox macos-seatbelt active, typescript native
```

## 1. Verify commands (final run, merge commit `53bc057`)

| Command | Exit | Last line(s) |
|---|---|---|
| `npx tsc --noEmit -p app/tsconfig.json` | 0 | (no output) |
| `npm test` | 0 | `ℹ tests 145` · `ℹ pass 145` · `ℹ fail 0` |
| `npm run test:e2e` (build + all suites) | 0 | `ℹ tests 121` · `ℹ pass 121` · `ℹ fail 0` |
| `node scripts/content/validate.mjs` | 0 | `CONTENT VALID: 52 lesson(s), 93 example run(s), 644 exercise fixture run(s), 156 verified prediction(s), 0 isolated-node run(s), 4 capstone step variant(s) with 16 capstone run(s), 0 error(s)` |
| `node scripts/content/smoke.mjs` | 0 | `SMOKE OK: 52 lesson(s), 312 page view(s), 0 problem(s)` |
| `JSLL_CONTENT_ROOT=tests/fixtures/content node scripts/content/validate.mjs` | 0 | `CONTENT VALID: 5 lesson(s), 5 example run(s), 36 exercise fixture run(s), 3 verified prediction(s), 12 isolated-node run(s), 4 capstone step variant(s) with 16 capstone run(s), 0 error(s)` |

The real course (`content/`) has no `isolated-node` block yet, hence `0 isolated-node run(s)` there.
The 12 runs on the fixture root are the example ×2 languages and five exercise fixtures ×2 languages.

## 2. End-to-end: `tests/e2e/app-node-runtime.test.mjs` (real Chrome + real server)

`node --test tests/e2e/app-node-runtime.test.mjs` → `ℹ tests 11`, `ℹ pass 11`, `ℹ fail 0`:

```
✔ a Node example runs in real Node: its version and a file written and read back in the exercise folder; an edit changes the output
✔ reading a file outside the exercise folder is denied, with localized guidance next to the verbatim diagnostic
✔ an infinite loop ends at the time limit with a localized explanation; Stop ends a run at once; the next run works
✔ an output flood is cut at the output limit with a localized explanation; the console keeps the latest lines
✔ Check runs tests.js through the Node harness: failing checks show their authored feedback, a passing solution records progress
✔ a program that throws while loading: one error card and one line instead of misleading per-check feedback (browser and Node)
✔ busy: when two Node runs are already active, Run explains it and keeps the code; afterwards runs work
✔ a lost connection to the server is explained, the code is kept, and the next run works once the server is back
✔ without proven isolation the block says why, Run and Check stay disabled and drafts are kept and saved
✔ the React Native concept-preview block is labeled, shows its limits and runs in the preview
✔ the content validator executes the Node fixtures for real, and reports them UNVERIFIED (an error with --release) when the executor is unavailable
```

What the assertions pin down (all in the test file):

- **Real Node output**: the console lines are exactly `Node.js v25.2.1` (equal to the server's
  `process.version`), `Збережено у файлі: notes.txt (2)`, `- Купити лампу`, `- Полити квіти`; after an
  edit the new note appears and the old one is gone; the draft is saved. The request body is
  `mode: run`, `entry: index.js`, `timeoutMs: 5000` (the block's `capabilities.timeoutMs`),
  `capabilities: { network: 'none', workers: false }`, with the Ukrainian text substituted.
- **Denied read** of `/etc/hosts`: status "Виконано з помилкою.", one error card titled at
  `index.js, рядок 3` with `err.guide.node.access` and the verbatim
  `Error: Access to this API has been restricted…`, `code: 'ERR_ACCESS_DENIED'`,
  `resource: '/etc/hosts'`; no content of the file reaches the console; stack paths are shown as
  `at index.js:3:…`.
- **Time limit**: `for (;;) {}` ends with `ws.node.timeout` (`… довше за 5 с …`) after ≥ 4.5 s; output
  printed before the loop is kept. **Stop** ends the next run within 2 s with `ws.stopped`, the
  server has no run left, and the next run prints `again number`.
- **Output limit**: a print flood ends with `ws.node.outputLimit` (200 KB); the console keeps the
  latest lines (more than 100, at most 1000).
- **Check**: the starter fails 3 of 3 checks, each with its authored feedback; a realistic wrong
  server fails only the 404 check (`status of GET /missing: expected 200 to be 404`) with its
  feedback; the solution passes, the status shows "Вправу виконано" and `progress` stores `passedAt`;
  the check request carries `mode: test`, `tests.path: __tests__.js`,
  `capabilities.network: loopback` and `strings: { lamp: 'Настільна лампа', plant: 'Кімнатна рослина' }`.
- **Load errors** (coordinator addition): browser — `console.log(lable, 3)` makes both checks fail;
  2 rows listed, 0 `.test-feedback` in the list, one `ReferenceError: lable is not defined` card and
  the `ws.loadErrorFirst` line. Node — a handler using an undefined `item` throws during the entry's
  own requests; 3 rows, 2 failing with `uncaught error during the test: ReferenceError: item is not
  defined`, one card at `app.js, рядок 8`, the same line, no per-check feedback.
- **Busy**: two runs held open through the API → Run shows `ws.node.busy`, the code is unchanged; after
  they end, Run works.
- **Lost connection**: the server is restarted during a run → `ws.node.disconnected`, code unchanged,
  Stop gone; the next run after the restart prints `back`. (The cut stream is the scenario; the test
  allows only that `requestfailed` entry.)
- **Unavailable**: a server started with `overrides.nodeRunner.support.permissionFlag = null` reports
  `Node v25.2.1 has no permission model (--permission / --allow-fs-read). Code is never run without
  isolation.`; the block shows `ws.nodeUnavailable` with that reason, Run and Check have
  `aria-disabled="true"`, a forced click sends nothing to `/api/node/run`, the seeded draft is shown
  and an edit is saved; Settings shows the same reason.
- **React Native concept preview**: chip `concept-preview`, note `ws.runtime.concept-preview`, the
  "Межі цього перегляду" disclosure contains the authored limits; Run renders the card and a press
  changes `Подобається: 0` to `Подобається: 1` inside the preview frame.

## 3. Unit tests added

`npm test` (145 tests) includes:

```
✔ localized example strings reach the checks as a read-only L (test mode only)
✔ an error thrown by a request handler fails the running test at once; errors while loading are marked "load"
✔ execution can be turned off (JSLL_NODE_RUNNER=off or a server override): reported as unavailable, nothing runs
✔ runtime errors: name, message and the learner file and line, from the first frame in the exercise
✔ parse errors of the code are "syntax" with the location of the bad token, also in an imported file
✔ errors with a code keep it, and paths inside the exercise are shown relative to it
✔ non-Error throws and exits without an uncaught error
✔ check results: load errors first and marked, parse errors in learner files recognized, paths shortened
✔ a block becomes the executor request: capabilities one to one, checks with the strings as L
```

The parser tests (`tests/unit/node-errors.test.mjs`) run real child processes under the permission
model in a folder whose name contains a space. Node version matrix for the changed executor and the
parser:

| Command | Result |
|---|---|
| `<node 22.23.3> --test tests/unit/node-run.test.mjs` | `tests 42`, `pass 41`, `skipped 1` (the Node 25+ `--allow-net` test) |
| `<node 24.21.0> --test tests/unit/node-run.test.mjs` | `tests 42`, `pass 41`, `skipped 1` (same) |
| `<node 22.23.3> --test tests/unit/node-errors.test.mjs` | `tests 6`, `pass 6`, `fail 0` |
| `<node 24.21.0> --test tests/unit/node-errors.test.mjs` | `tests 6`, `pass 6`, `fail 0` |

## 4. Validator behaviour on broken content and without an executor

Scratch check (not committed): a copy of the fixture root with four defects — the example prints an
undefined name, the solution answers every address, `wrong-no-type` replaced by the solution, and an
`alt-hang` fixture whose `createApp` never returns — then the validator with and without the executor:

```
--- mutated (exit 1)
CONTENT INVALID: 1 lesson(s), 0 example run(s), 0 exercise fixture run(s), 0 verified prediction(s), 14 isolated-node run(s), 0 capstone step variant(s) with 0 capstone run(s), 8 error(s)
✖ no-01-01-fixture-node › node-notes — example (uk) throws ReferenceError: missingName is not defined (set expectError: true if the error is the point)
✖ no-01-01-fixture-node › node-items-server — solution (uk) must pass every test, but fails: "an unknown address answers 404" (status of GET /missing: expected 200 to be 404)
✖ no-01-01-fixture-node › node-items-server — alt-hang (uk): the run reached its 10000 ms time limit (examples and checks must finish on their own)
✖ no-01-01-fixture-node › node-items-server — wrong-no-type (uk) passes every test — a deliberately wrong fixture must fail at least one test
… (the same four in en)
--- executor off (JSLL_NODE_RUNNER=off; exit 0)
CONTENT UNVERIFIED: 1 lesson(s), 0 example run(s), 0 exercise fixture run(s), 0 verified prediction(s), 0 isolated-node run(s) (2 isolated-node block(s) UNVERIFIED: executor unavailable), 0 capstone step variant(s) with 0 capstone run(s), 0 error(s)
· no-01-01-fixture-node › node-notes — UNVERIFIED: the isolated Node executor is not available on this machine, so this isolated-node block was not executed (Isolated Node.js execution is turned off for this installation (JSLL_NODE_RUNNER=off).)
--- executor off, --release (exit 1)
✖ no-01-01-fixture-node › node-notes — UNVERIFIED: the isolated Node executor is not available on this machine, …
✖ no-01-01-fixture-node › node-items-server — UNVERIFIED: …
```

The executor-off and `--release` cases are also asserted by the last end-to-end test above. The JSON
report (`--json`) carries `verified: false` in that case.

## 5. Measurements behind design choices

**XMLHttpRequest instead of fetch for the run stream.** Scratch page script on the app origin
(Chrome 154, Playwright `requestfailed` / `requestfinished`), reading the same `/api/node/run`
response in different ways:

```
FAILED   …/api/node/run net::ERR_ABORTED   ← fetch, body.getReader() read until done
FINISHED …/api/node/run                    ← fetch, response.text()
FAILED   …/api/node/run net::ERR_ABORTED   ← fetch, body.pipeTo(WritableStream)
FINISHED …/api/node/run                    ← fetch, getReader() with 100 ms pauses between reads
FINISHED …/api/node/run                    ← XMLHttpRequest with progress events (566/566 bytes)
```

The fully read stream was reported as aborted whenever the reader finished before the load
completed (*inferred* from the delayed-read variant finishing normally), so the UI streams with XHR
progress events; the validator (Node, no DevTools protocol) keeps `fetch` + `readNdjson`.

**Node's uncaught-error printout** (location block, `error.stack`, `{ code: … }`, `Node.js vX`) was
captured for 17 cases (reference, type, parse, link, JSON, async, rejection, non-Error throw, missing
module, access denied, `process.exit`…) on 22.23.3, 24.21.0 and 25.2.1; the parser returned the same
name/code/file/line/kind on all three.

## 6. What learners are told (quoted from `app/src/i18n/en.ts`; Ukrainian in `uk.ts`)

- Runtime note: "Real Node.js in an isolated process on your computer · engine: Node.js v25.2.1".
- Limits disclosure ("Limits of the Node.js runtime"), after the block's own `limits`:
  "Every run gets a fresh temporary folder with a copy of the exercise files. The program reads and
  writes files only there, and the folder is deleted after the run." · "Time: up to {s} s per run,
  then the process is stopped." · "Output: up to {kb} KB." · "Memory: {mb} MB for JavaScript objects
  (memory outside it, such as Buffers, is not capped)." · "Network: off." / "Network: this computer
  only (127.0.0.1, ::1, localhost). A server must listen on an explicit address, for example
  server.listen(3000, "127.0.0.1")." · "No child processes and no npm packages: only built-in node:
  modules and the exercise files." · "Worker threads are off." / "… are allowed." · "Isolation: the
  Node.js permission model is a “seat belt” for honest code, not a sandbox against malicious code."
  + "On this computer an operating-system sandbox (macOS Seatbelt) is active as well." / "No
  operating-system sandbox is active on this computer."
- Nested "Technical details from the local server": the server's `features.isolatedNode.limitations`
  verbatim (English); on this machine 7 sentences, starting "Node documents its permission model as
  a "seat belt" for trusted code, not a sandbox against malicious code." and including the
  `node:sqlite`, worker `execArgv`, loopback-listen, memory, disk-polling and `--allow-net` notes.
- Settings → How code runs → "Node.js on this computer": "Available: Node.js v25.2.1 in an isolated
  process." (or the unavailable reason) and the same list with the network line "Network: off unless
  the exercise allows this computer only (127.0.0.1)."
- Unavailable: "Isolated Node.js execution is not available in this installation: {reason}" with the
  server's reason verbatim.

## 7. Not covered / unverified

- **Other environments**: Linux, Windows, Firefox and Safari were not run (*unverified*). Only Chrome
  154 on macOS 26.6.2 arm64. Node 22.13–22.22 and Node newer than 25.2.1 for the UI path:
  *unverified* (the executor/parser unit tests also ran on 22.23.3 and 24.21.0).
- **Status mappings not exercised in a browser**: `crashed` (heap exhaustion), `workspace-limit`,
  `spawn-failed`, `ws.node.rejected` (400/413) and `ws.node.serverError`; the server side of these
  reasons is covered by `tests/unit/node-run.test.mjs`, the UI texts only by reading the code.
- **Real course content**: no `isolated-node` block exists in `content/` yet; the Node slice is
  the synthetic fixture lesson. Linguistic review of the new Ukrainian UI strings and fixture text
  was done by the author agent only (no human review).
- **React Native**: the fixture is a react-native-web preview with explicit limits; no native
  rendering, device or emulator verification is implied (that stays `local-native`).
- **Run-mode error cards** come from parsing Node's stderr (format stable on 22/24/25 as measured);
  a future Node that changes the printout would fall back to the plain console output without a
  card (*inferred* from the parser returning `null` without the `Node.js vX` trailer).
- **Accessibility**: no axe/keyboard pass was run on the new disclosure and notes beyond the
  existing suites (*unverified*).
