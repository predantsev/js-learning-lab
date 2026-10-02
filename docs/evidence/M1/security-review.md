# Evidence: independent security and correctness review of the platform layer

Date: 2026-10-02. Issue #7 (M1 platform), branch base `bdddc29`. Reviewer: an independent pass
that did not write the code under review. Contracts are in
[`docs/platform/SERVER-API.md`](../../platform/SERVER-API.md); earlier measurements are in
[`server-runtime.md`](server-runtime.md), [`app-e2e.md`](app-e2e.md),
[`node-runtime-ui.md`](node-runtime-ui.md) and [`capstone-workspace.md`](capstone-workspace.md)
and are not repeated here.

Environment: macOS 26.6.2 arm64, Node v25.2.1 (Homebrew), Chrome through `playwright-core`
(`channel: 'chrome'`). Probes started a real server with `startTestServer()` from
`tests/unit/helpers.mjs` on an ephemeral loopback port; they are scratch scripts, not committed,
and their output is copied below. Port 7300 was never bound. Claims that were not measured are
marked *(inferred from …)*; what was not looked at is listed in the last section.

## Threat model as reviewed

- The learner owns the machine and runs their own code, which may be buggy or pasted from the
  internet.
- Other web pages open in the same browser must not read or change learner data or run code
  through this server.
- Other local processes must not either (the brief's model; see finding H-1 for how far the
  current design gets).
- Learner code (browser sandbox frame or isolated Node run) must not reach the API token, the
  learner store, or files outside its scratch workspace.
- A runaway program must be stoppable and must not lose learner work.

## Findings by severity

| Id | Severity | What | State |
|---|---|---|---|
| C-1 | critical | A Node run with `network: "loopback"` read the API token and dumped every learner document | fixed (guard layer), residual = H-2 |
| H-1 | high | Any local process (including another OS user's) can `GET /` and read the token | open, design-level |
| H-2 | high | C-1's fix is guard-only; Seatbelt could not express "loopback except one port" | open, design-level |
| M-1 | medium | Lab fixtures: any web page could grow server memory without bound | fixed |
| M-2 | medium | The last edit of a document over 64 KiB was lost silently when the tab closed | fixed |
| M-3 | medium | Learner data folder 0755 and files (incl. `meta.json` with the token) 0644 | fixed (defence in depth) |
| M-4 | medium | Exported `serve.mjs` answered any `Host` (DNS rebinding of the exported project) | fixed |
| L-1 | low | Malformed percent-encoding in a static path or lab id gave `500` and a server log line | fixed |
| L-2 | low | Lab data is readable and writable by every web page (CORS `*`, no token) | accepted limit, stated |
| L-3 | low | Browser-runner test results can be forged by deliberate learner code | accepted limit, stated here only |
| L-4 | low | A client that disconnects before the `start` event leaves the run until its timeout | open *(inferred)* |
| L-5 | low | No startup sweep of `.runtime/node-runs` and `.runtime/typecheck` after a crash | open *(inferred)* |
| L-6 | low | Revision lock is per process; no directory `fsync` after rename | open *(inferred)* |
| L-7 | low | The per-lesson drafts document collects sandbox storage of every block | open *(inferred)* |

### C-1 — loopback Node run → token → whole learner store (fixed, commit `946b61d`)

Probe (`token-from-node.mjs`): the learner file scanned 2000 loopback ports, sent `GET /` with
`node:http` to the port it found, took the token from the `jsll-boot` script and sent
`POST /api/backup/create`. Before the fix:

```
--- network=loopback osSandbox=macos-seatbelt
scan 2000 ports ms 59 server port found true
index status 200 token found true
backup status 200 contains learner note true
exit exited 0
```

With the token, every route is open to that code, `PUT /api/store/doc`, `POST /api/backup/apply`
(replace everything) and `POST /api/export/folder` included. `network: "none"` was already blocked
(`ERR_JSLL_POLICY`, then Seatbelt and, on Node 25, the permission model).

Fix: the server passes its own port to the platform guard (`JSLL_GUARD_PLATFORM_PORTS`, removed
from `process.env` before learner code runs, handed to workers through
`worker_threads.setEnvironmentData`). In `"loopback"` mode a connection to that port fails with
`ERR_JSLL_POLICY`, with a message that says what the port is. Regression test
`tests/unit/node-run.test.mjs` › *network "loopback": the platform server itself is unreachable*.
It connects to `localhost`, `127.0.0.1` and `::1`, uses `fetch`, connects from a worker, and checks
that the variable is gone. Without the port hand-off, measured by setting `platformPorts: () => []`:

```
actual:   'localhost CONNECTED,127.0.0.1 CONNECTED,::1 CONNECTED,fetch ALLOWED,worker ALLOWED,env undefined\n'
expected: 'localhost ERR_JSLL_POLICY,127.0.0.1 ERR_JSLL_POLICY,::1 ERR_JSLL_POLICY,fetch ERR_JSLL_POLICY,worker ERR_JSLL_POLICY,env undefined\n'
```

The same probe after the fix ends at the scan with `ERR_JSLL_POLICY` and no request reaches
the server. The learner-visible limitations list (`features.isolatedNode.limitations`), the
`enforcement` table (`platformServerPort: ['platform-guard']`) and `SERVER-API.md` now say this is
guard-only. They also say other loopback services stay reachable, and that untrusted code must not
be run with `network: "loopback"`.

### H-2 — why C-1 is guard-only (open)

The macOS Seatbelt layer was tried first. With `sandbox-exec` on this machine, a
`(deny network-outbound (remote ip "localhost:<port>"))` rule took effect only when the profile
had no `(remote ip "localhost:*")` rule. Whenever the loopback allow that `network: "loopback"`
needs was present, connections to the denied port still succeeded, in several rule orderings
(`127.0.0.1:P`, `::1:P`, `0.0.0.0:P` and `localhost:P` all `ok`). The kernel layer therefore cannot
keep a loopback run off the platform port. The guard is JavaScript in the same process and is
documented as bypassable by deliberate code. **A deliberately written guard bypass in a
`network: "loopback"` run would regain C-1.** Proposal: the H-1 launch-secret design closes this
too, because a Node run never holds the cookie. Until then, keep `network: "loopback"` to
authored lesson code and label it in the UI as not for untrusted code.

### H-1 — the token is served to any loopback client (open, design-level)

`GET /` with `Host: localhost:<port>` returns the page with the token to any process that can
open a loopback connection. Probe `gate.mjs`: `GET / app host 200 token: true`. On this machine the
home folder is `drwxr-x---` with group `staff`, which on macOS contains every local account
(`ls -ld ~`). So another OS user's process can read the token over HTTP. Before M-3 it could also
read it from `.learner-data/meta.json`. The Host allowlist stops browsers (DNS rebinding), not
local processes. Same-user processes can read the data folder anyway, so the realistic exposure
is other OS users and sandboxed same-user code with network but no file access (C-1/H-2).

Proposal (changes the start-up UX, so not done here): `npm start` prints a one-time launch URL
(`/?launch=<random>`). The server exchanges it for an `HttpOnly; SameSite=Strict` cookie and
serves the token-bearing page and `/api/*` only with that cookie. Any loopback client without it
gets a page that says to open the printed link. This mirrors Jupyter's token URL. It needs a
decision on the "open http://js-learning-lab.localhost:7300" instructions.

### M-1 — lab memory (fixed, commit `a8108a1`)

The lab needs no token and answers `access-control-allow-origin: *`, so a web page can send
`text/plain` POSTs without a preflight. Probe `lab-growth.mjs` sent 300 POSTs of 200 KB from
`Origin: https://evil.example` over 150 namespaces. Before:

```
first response acao *
statuses { '201': 300 } rss growth MB 151 cross-origin read 200 * 409673
```

After (collections ≤ 64, bytes of records written through the API ≤ 8 MB → `507 lab-full` until
`POST /lab/reset`, retry counters ≤ 1000 with the oldest dropped):

```
statuses { '201': 40, '507': 260 } rss growth MB 52 cross-origin read 200 * 204846
```

(The remaining RSS growth is request buffers before garbage collection, *inferred from* the
bounded `storedBytes` the test reads.) Tests: `tests/unit/lab.test.mjs` (byte cap including PATCH
merges, DELETE and reset freeing room, collection cap, counter bound, malformed id → 400).

### M-2 — a large edit lost on tab close (fixed, commit `e806944`)

`persist.ts` flushed every pending document on `pagehide` with `fetch(…, { keepalive: true })`.
Browsers refuse keepalive bodies over 64 KiB, counted over all keepalive requests in flight
together. `beforeunload` warned only for `failed`/`conflict`. New e2e test
`tests/e2e/app-unload-save.test.mjs` edits a lesson draft, closes the tab inside the 500 ms
debounce and reads the document back from disk. Before the fix:

```
✔ an edit of a small document made just before closing the tab is saved
✖ an edit of a document larger than the keepalive limit made just before closing the tab is saved
  AssertionError [ERR_ASSERTION]: the last edit was not saved (an older version is on disk)
```

Fix: keepalive is used within a 60 KiB budget. Anything larger, and any save already in flight,
makes `beforeunload` start the save at once and ask before leaving. Small saves still leave
silently with keepalive (the test asserts no dialog). After the fix both tests pass. The large
case asserts exactly one `beforeunload` dialog, accepted after 300 ms.

### M-3 — file permissions (fixed, commit `1c2591e`)

Before: the new store test failed with `actual: 493` (0755) for the data folder. Now folders
created by the store are 0700, documents, `.bak` and `meta.json` are 0600, and an existing
`meta.json` is tightened on open (`tests/unit/store.test.mjs` › *learner data is private to this
OS user*). This narrows file reads only; H-1 stays open.

### M-4 — exported `serve.mjs` and DNS rebinding (fixed, commit `833b863`)

The static server generated into every project export bound to `127.0.0.1` but did not check
`Host`. A rebinding page could read the exported project and `data/exported-storage.json` (the
project's saved storage). It now answers only `127.0.0.1:<port>` and `localhost:<port>`, and
returns `421` for anything else. `tests/unit/capstone.test.mjs` › *the generated serve.mjs …*
failed before with `actual: 200` for `Host: evil.example:<port>`.

## The seven questions

### 1. Host / origin / token gate — holds for browsers; open for local processes (H-1)

Measured (`gate.mjs`, `nohost.mjs`; port numbers vary):

```
GET / app host                                             200  token: true
  app CSP frame-ancestors: true
GET / sandbox host jsll-run-1.localhost                    302 http://localhost:<port>/ token: false
GET /index.html sandbox host 127.0.0.1                     302 http://localhost:<port> token: false
GET /sandbox/frame.html?net=lab                            200  token: false
OPTIONS preflight from evil origin                         403  token: false
text/plain POST (form CSRF) no token                       403  token: false
img-style GET /api/store no token, no Origin               401  token: false
DELETE /api/store/doc wrong token                          401  token: false
HTTP/1.0 no Host            → HTTP/1.1 421 Misdirected Request | token in body: false
absolute-form, evil Host    → HTTP/1.1 421 Misdirected Request
Host with trailing dot      → HTTP/1.1 421 Misdirected Request
```

Plus the existing `tests/unit/http-security.test.mjs` (rebinding hosts → 421, sandbox hosts →
302, foreign `Origin` → 403 even with the token, missing/wrong token → 401 on every route).

- **DNS rebinding:** a foreign Host → 421 before any routing (`server/config.mjs` `classifyHost`).
- **CSRF:** every `/api/*` route needs the custom `x-jsll-token` header, which a form, `<img>`,
  `<script>` or `no-cors` fetch cannot send. A preflight from a foreign origin gets 403. No GET
  route has side effects (`server/app.mjs:43-79`).
- **Token exposure:** the token appears only in the app-host page (`server/app.mjs:125`, served
  with `frame-ancestors 'none'` and `no-store`). Grep of `app/src`, `shared`, `server` and
  `scripts/*.mjs` for `.token`: it is used only as the request header (`api.ts:18`,
  `useNodeRunner.ts:88`). It does not appear in sandbox payloads (`shared/runner.js:157-178`),
  lab responses, error bodies, `start.mjs` output or exports. Backups refuse to be created if a
  document contains it (`backup.mjs:43`). The Node child environment has no token (existing test
  *the environment is clean*).
- **Another origin or the sandbox host reading `/`:** blocked by the same-origin policy (no CORS
  on `/`), `frame-ancestors 'none'`, the sandbox CSP (`connect-src 'none'` or `/lab/` on its own
  host only, `default-src 'none'`), and the 302 on sandbox hosts.
- **Timing-safe comparison:** `!==` (`app.mjs:134`) is not constant-time. It does not matter
  here: a foreign origin cannot send the header at all, and a local process can read the page
  (H-1) *(inferred from the above)*.

### 2. Static serving and paths — holds; L-1 fixed

- `serveStatic` normalizes with `path.posix.normalize('/'+decoded)` and requires the result to stay
  inside the root. New test *static paths: traversal, encoded traversal, NUL and malformed
  encoding…* covers `..`, `%2e%2e`, `%2f`, `%5c`, `%00` and malformed `%E0%A4%A` on app and sandbox
  hosts: 404, or 302 on sandbox hosts; never file content. Before L-1's fix the malformed case
  was `actual: 500`. Served folders (`dist/*`) are build output, not learner-writable *(inferred)*.
- **Store ids:** `^[a-z0-9][a-z0-9._-]{0,80}(/[a-z0-9][a-z0-9._-]{0,120}){0,2}$` and no `..`
  (`store.mjs:9,20`). Files are always `<id>.json`, so an id cannot name a `.bak` or `.tmp` file.
  Existing test *unsafe document ids are rejected*.
- **`/api/export/folder`:** writes only a brand-new folder `<exportsDir>/<safeName>-<stamp>[-N]`
  (exclusive `mkdir`, files `wx`). The name keeps letters, digits, `.`, `_` and `-` only, and leading
  dots are stripped. File paths go through `pathProblem` (no absolute, `..`, backslash, control
  characters, reserved names or `.git`). Existing `tests/unit/export.test.mjs` and server-runtime.md
  §5 (`../evil.js` → 400). It cannot write anywhere else. It can write `.vscode/*` or a
  `package.json` with scripts taken from learner files; VS Code Workspace Trust governs those
  *(not tested)*.
- **Backup restore:** JSON only, with no archive format and so no zip-slip. Ids use the store
  rules, so restore writes only `<dataDir>/docs/<id>.json`. Problems are rejected before any
  snapshot or write. Existing `tests/unit/backup.test.mjs`. Bodies up to 128 MB are buffered and
  parsed in memory (memory use *not measured*).
- **Node-run paths:** the same `pathProblem`, plus `writeFiles` re-checks the joined path. The
  permission model holds for Buffer paths, `file:` URLs, `process.chdir('..')` and
  `process.binding` (probe `prefix.mjs`, v25.2.1, `--allow-fs-read=<ws>`):
  `{"siblingPrefix":"ERR_ACCESS_DENIED","bufferPath":"ERR_ACCESS_DENIED","fileUrl":"ERR_ACCESS_DENIED","chdirThenRelative":"ERR_ACCESS_DENIED","processBinding":"ERR_ACCESS_DENIED","readdirParent":"ERR_ACCESS_DENIED"}`.
  `siblingPrefix` is a folder named `<ws>def` next to the workspace: no prefix leak.

### 3. Sandbox escape — holds for the platform; L-3 accepted

Read, not re-measured (the spikes in `spike-runner-isolation.json` and `app-e2e.md` cover parent
access and storage isolation):

- The frame is `sandbox="allow-scripts allow-forms"` (`shared/runner.js:239`) on a different site
  (`jsll-run-N.localhost` or `127.0.0.1`), with an opaque origin from both the attribute and the CSP
  `sandbox` directive. Without `allow-same-origin`, `allow-top-navigation` or `allow-popups` it can
  reach neither `parent`/`top` state nor app storage or cookies, and cannot navigate the top
  window or open popups.
- The frame CSP (above) allows network only to `/lab/` on its own host with `net=lab`. The app
  CSP `frame-src` limits where the frame can navigate to loopback sandbox hosts, and the app page
  refuses framing (`frame-ancestors 'none'`). *Inferred from the CSP:* a frame that navigates
  itself cannot leave the loopback hosts or load the token page.
- **postMessage:** the app checks `event.source === frame.contentWindow`, `jsll === 1`, `frameId`
  and the run nonce (`shared/runner.js:277-309`). The frame checks `event.source === parent`
  (`sandbox/runtime.js:753`). Every message is treated as data: console, errors, tests and trace
  are rendered as React text. `traceToSpec` sets `caption: null` for run-time traces
  (`shared/visuals/kinds/code-trace.js`). Test titles are looked up from content by test name
  (`Workspace.tsx:135`), so a forged name finds a prototype member with no `[lang]` string, not
  HTML. Every `dangerouslySetInnerHTML` in `app/src` renders compiled course content (grep list:
  `blocks.tsx`, `Lesson.tsx`, `Workspace.tsx`, `pages.tsx`, `ui.tsx`, `VisualPlayer.tsx`,
  `RenderTimeline.tsx`). The app CSP has `script-src 'self'` without `'unsafe-inline'`, so injected
  markup could not run script anyway.
- **L-3 (accepted, now stated):** the browser runner installs `test`/`expect` with
  `Object.assign(window, …)` after the learner program loaded (`sandbox/runtime.js:678`).
  Learner code in the same realm can redefine them, or patch built-ins they use, and so make checks
  pass. Browser-runner results are self-assessment, as SERVER-API.md already says for the Node
  harness *(inferred from code, not exploited)*.
- **Storage from the frame** is written into the learner's drafts or workspace document
  (`Workspace.tsx:233`, `ProjectEditor.tsx:97`). Its size is capped by the runtime (200 KB per
  block, enforced inside the frame) and by the store (5 MB per document). See L-7.

### 4. Node executor — holds except C-1/H-2; limitations text corrected

- Workspace escape, child processes, native addons, WASI, inspector and workers are denied
  (existing tests in *isolation*, plus `prefix.mjs` above). The `--allow-*` flag matrix per Node
  major is in server-runtime.md §2 (22.23.3, 24.21.0, 25.2.1, 25.9.0; not re-run).
- The environment is clean: existing test, still green after C-1's variable, which the guard
  deletes.
- Process-group `SIGKILL` on timeout, stop and disconnect: existing tests *a runaway loop is
  killed at the timeout*, *POST /api/node/stop interrupts a run*, *a dropped client connection
  kills the run*. **L-4:** the `close` listener is attached only when the first event is
  written (`server/api/node-run.mjs`), so a client that goes away before `start` leaves the run to
  its timeout. The UI covers the Stop case by stopping on `start`
  (`useNodeRunner.ts`: `if (run.stopped) stopRemote(run)`). *Inferred from code, not reproduced*.
  Proposal: attach the listener before `runner.start` and stop on `start` when already closed.
- Output cap, concurrency cap (2 → 429) and heap cap: existing tests. Result channel: existing
  test *learner output cannot forge results*.
- Permission model unavailable: existing test *without a permission model nothing is executed
  (501)*.
- Scratch cleanup: removed after every run (existing test). **L-5:** nothing sweeps
  `.runtime/node-runs` or `.runtime/typecheck` at start-up, so folders survive a server crash
  (`node-runner.mjs` creates `runsDir` without listing it). Proposal: at start-up, remove entries
  older than ten minutes, which is well above the 60 s run limit.
- **Limitations text:** now lists the loopback caveat (C-1/H-2). The other lines match
  SERVER-API.md and server-runtime.md *(compared by reading)*.

### 5. Store integrity — holds; M-2 fixed, L-6/L-7 open

Existing tests: atomic temp+fsync+rename with no leftovers, `.bak` recovery, injected
`write-fail`/`disk-full` leaving the previous version intact, conflicts on a stale revision,
two-tab conflict with both resolutions (e2e), migration snapshot restore, newer schema never
written. M-2 was the one silent-loss path found (fixed).

- **L-6:** `#withLock` serializes writers inside one process only. Two servers on the same data
  folder (two `npm start` on different ports) can interleave read-compare-write. The containing
  directory is not `fsync`ed after `rename`, so durability across power loss is *unverified*.
  *Inferred from `store.mjs:84-137`.*
- **L-7:** the per-lesson drafts document stores sandbox `localStorage` for every block. With many
  storage-heavy blocks it can approach the 5 MB document limit, after which saves fail. They fail
  visibly (`too-large`, "not saved"), not silently. *Inferred, not reproduced.*
- A corrupt document without `.bak` is reported (`corrupt`, file name only) and can be overwritten
  only with `force`. Backup apply versus a concurrent tab write is a documented limitation
  (SERVER-API.md limitation 8).

### 6. Resource exhaustion from the browser side — M-1 fixed, rest holds

- **Body limits:** every body read goes through `readBody` with a limit: 6 MB default (store PUT,
  node run, typecheck), 16 KB (node stop), 24 MB (export), 128 MB (backup preview/apply), 256 KB
  (lab). API bodies are read only after the token check. Unauthenticated, only the lab reads
  bodies.
- **Slow bodies:** the server keeps Node's defaults (`requestTimeout 300000`,
  `headersTimeout 60000`; measured with `node -e` on v25.2.1). A browser page holds at most
  Chrome's per-host connection limit; local processes are not limited (low).
- **Lab state:** bounded (M-1).
- **Scratch folders:** a run is capped at 64 MB / 5000 entries (watchdog, existing test). Type
  checks write at most 2 MB of input, run at most 2 at a time, and are killed at 20 s
  (`server/api/typecheck.mjs`).

### 7. Dependency and build surface — holds *(inferred)*

- **`@babel/standalone` 7.29.9** (`node -e …version`) transforms learner code in the app page,
  the token-holding origin (`shared/runner.js` → `shared/transform.js`, called from `useRunner`).
  It parses and transforms, and does not execute learner code. The known compile-time
  code-execution issue in Babel's `path.evaluate` (CVE-2023-45133) is fixed from 7.23.2. A future
  Babel parser bug would land in the token origin; moving the transform into a worker is the
  hardening option.
- **`tsc` (typescript 7.0.2 native binary)** runs as a child with `PATH` and `NO_COLOR` only, in a
  fresh folder with a server-generated `tsconfig.jsll.json` (`noEmit`). It is not
  permission-sandboxed. Learner `.ts` files can make it read other files through references or
  imports, but the diagnostics go only to the token holder (*not tested*).
- **`npm start` offline:** `scripts/build.mjs` and `scripts/build-sandbox.mjs` contain no network
  calls (grep for `fetch(` / `http(s)://`). The build uses local `node_modules` only *(not run
  offline)*.

## Accepted limits, stated plainly

1. Untrusted code must not be run with `network: "loopback"`. Only the platform guard keeps such a
   run off the platform's port, and every other loopback service is reachable (C-1, H-2).
2. Any process that can open a loopback connection can read the API token from `/` (H-1).
3. Check results in both runners are self-assessment. Deliberate learner code can make them pass
   (L-3; SERVER-API.md for Node).
4. Lab fixtures are public to every web page on this computer. Nothing personal belongs there
   (L-2; header of `server/lab.mjs`).
5. The permission model is a seat belt, the guard is bypassable, and there is no OS layer on
   Linux or Windows (SERVER-API.md, unchanged).

## Suite results after the changes

Before the changes (untouched branch, same machine): `npm test` 145/145 pass, `npm run test:e2e`
121/121 pass. After all five fix commits:

```
$ npx tsc --noEmit -p app/tsconfig.json   → exit 0
$ npm test                                → ℹ tests 152 · ℹ pass 152 · ℹ fail 0 · ℹ skipped 0
$ npm run test:e2e                        → ℹ tests 123 · ℹ pass 123 · ℹ fail 0 · ℹ skipped 0
```

Each new regression test was also run against the original code of the file it guards, and it
failed there. The outputs are quoted in the finding sections. For the lab, the before/after
evidence is the `lab-growth.mjs` probe, because the new test imports `LAB_LIMITS`, which the old
module does not export.

## Not examined

- Linux, Windows, and Node 22/24 for the new guard code: run only on v25.2.1. `setEnvironmentData`
  exists from Node 15.12 *(inferred from Node's documentation)*.
- Deliberate guard bypass techniques in the Node child (not attempted; the guard is documented
  as bypassable).
- Browser engines other than Chrome. Firefox and Safari keepalive limits and `*.localhost`
  behaviour.
- Memory and time for a 128 MB backup body, and slow-body behaviour under many local
  connections.
- The content compiler and validator (`scripts/content/**`), the visual tracer instrumentation
  (`sandbox/trace-runtime.js`, `shared/visuals/tracer.js`) beyond the trust boundary, and
  `shared/transform.js` internals (loop budget correctness).
- VS Code's handling of `.vscode/` files in exports.
