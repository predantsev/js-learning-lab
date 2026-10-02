# Local server API: Node executor, type checking, export, backup

Reference for the four API modules in `server/api/` (auto-loaded by `server/app.mjs`). It covers
the request/response contracts, the security model and what each isolation layer really
enforces, the limits, and the known limitations. Measured behavior is in
[`docs/evidence/M1/server-runtime.md`](../evidence/M1/server-runtime.md); statements here that
were not measured are marked *unverified*.

| Module | Routes | Requirement links |
|---|---|---|
| `node-run.mjs` (+ `lib/node-runner.mjs`, `server/node-harness/`) | `POST /api/node/run`, `POST /api/node/stop` | REQ-021, REQ-022, REQ-023, REQ-032, DEC-12 (`isolated-node` candidate) |
| `typecheck.mjs` | `POST /api/typecheck` | TypeScript practice (course skill, not platform stack) |
| `export.mjs` | `POST /api/export/folder` | REQ-012, DEC-09 |
| `backup.mjs` | `POST /api/backup/create`, `/preview`, `/apply` | REQ-025 (adopted), REQ-024, REQ-032 |

`GET /api/bootstrap` reports every module under `features` (`isolatedNode`, `typecheck`,
`exportFolder`, `backup`) so the UI can label capabilities honestly.

## Common rules for every `/api/*` route

These are implemented by `server/app.mjs` and `server/config.mjs`; the modules add nothing that
weakens them.

- **Loopback only.** The server listens on `127.0.0.1` and, when available, `::1`. It never binds
  to other interfaces.
- **Host allowlist.** Requests whose `Host` is not `js-learning-lab.localhost:<port>` or
  `localhost:<port>` get `421` (DNS-rebinding defence). Sandbox hosts (`127.0.0.1:<port>`,
  `[::1]:<port>`, `jsll-run-N.localhost:<port>`) never reach the API: `/api/*` there is redirected
  to the app host.
- **Origin.** A request carrying an `Origin` other than the two app origins gets `403`. Sandboxed
  learner frames therefore cannot call the API even if they learned the token.
- **Token.** Every API request needs `x-jsll-token` equal to the per-profile token in
  `<dataDir>/meta.json` (injected into the app page at load). Missing or wrong → `401`.
- **Bodies** are JSON, size-limited per route (6 MB unless stated), errors are
  `{ "error": "<code>", "message": "…" }` with an HTTP status.

## Isolated Node executor

Real `node` (the same binary as the server, `process.execPath`) runs learner files in a fresh
scratch workspace per run. It is the in-course runtime for Node-stage practice (NO-01 … NO-14).

### `POST /api/node/run`

Request:

```json
{
  "files": { "index.js": "…", "lib/db.js": "…" },
  "entry": "index.js",
  "mode": "run",
  "tests": { "path": "checks.test.js", "source": "…", "timeoutMs": 4000 },
  "stdin": "",
  "args": [],
  "timeoutMs": 10000,
  "capabilities": { "network": "none", "workers": false },
  "strings": { "lamp": "Desk lamp" }
}
```

- `files` — relative POSIX paths → text. Rejected (`400 bad-path`): absolute paths, drive letters,
  `..` or `.` segments, empty segments, backslashes, NUL/control characters, `< > : " | ? *`,
  Windows-reserved names, segments ending in `.`/space, `.git`, names differing only by case, a
  path used as both file and folder. At most 200 files and 2 MB in total (`413`).
- `entry` — required in `run` mode; in `test` mode optional (imported before the checks so its
  output appears in `logs()`).
- `mode` — `"run"` executes the entry; `"test"` runs the check file through the harness.
- `tests` — test mode only. `path` must not collide with a learner file. `timeoutMs` is the
  per-test timeout (default 4000, max 30000).
- `stdin` — up to 1 MB, delivered then closed (EOF), so programs reading stdin never hang.
- `args` — up to 64 strings → `process.argv.slice(2)`.
- `timeoutMs` — wall-clock limit, default 10 000, 100…60 000.
- `capabilities.network` — `"none"` (default) or `"loopback"`. `capabilities.workers` — default
  `false`.
- `strings` — the block's localized example text in the learner's language (`{ key: text }`, keys
  `[a-zA-Z][a-zA-Z0-9_]*`, at most 500 keys and 32 KB, else `400`/`413`). Test mode exposes it to
  the checks as `L`, as the browser runner does; a run in `run` mode ignores it (the learner files
  already contain the text).
- If the workspace has no `package.json`, a `{ "type": "module" }` one is written, so `.js` files
  are ES modules (the course standard). A learner-supplied `package.json` is used as is.

Response: `200`, `content-type: application/x-ndjson; charset=utf-8`, one JSON event per line,
written as produced:

| Event | Fields |
|---|---|
| `start` | `runId`, `node` (version), `mode`, `cwd` (workspace path, for shortening stack traces in the UI), `policy` { `network`, `workers`, `osSandbox`, `networkEnforcedBy`, `typescript` } |
| `stdout` / `stderr` | `data` (UTF-8 text; multi-byte characters are never split) |
| `tests` | test mode only: `results` [{ `name`, `status`: `pass`\|`fail`, `message?`, `errorName?`, `expected?`, `actual?`, `stack?`, `ms` }], optional `harnessError`, `loadError`, `errors` (uncaught errors outside a test, each with `phase`: `load` = before the first test, while the program loaded, or `idle` = between or after tests) |
| `exit` | `code`, `signal`, `timedOut`, `truncated`, `durationMs`, `reason`, `stopped`, `error?` |

`reason` distinguishes the REQ-032 states: `exited` · `timeout` · `output-limit` ·
`workspace-limit` · `stopped` · `disconnected` (client went away) · `crashed` (a signal the
platform did not send, e.g. `SIGABRT` when the JavaScript heap is exhausted) · `spawn-failed`.
`expected`/`actual` use the same serialized value shape as the browser runner.

Errors before streaming starts: `400`/`413` validation, `429 {"error":"busy"}` when two runs are
already active, `501 {"error":"isolation-unavailable"}` when this machine cannot isolate (see
*Availability*). Nothing is executed in those cases.

### `POST /api/node/stop`

`{ "runId": "nr-…" }` → `{ "stopped": true }` if the run was active (its `exit` event then has
`reason: "stopped"`), `{ "stopped": false }` otherwise. Closing the `/run` response connection
also stops the run (`reason: "disconnected"`).

### Test harness (test mode)

The check file is a real ES module imported by `server/node-harness/test-main.mjs` inside the
restricted process; it imports learner modules with ordinary `import`. Globals (non-writable):

| Name | Purpose |
|---|---|
| `test(name, fn, { timeoutMs }?)` | register a test; tests run sequentially |
| `expect(value, hint?)` | matchers with the same names, semantics and messages as the browser runner: `toBe`, `toEqual`, `toBeTruthy/Falsy`, `toBeNull/Undefined/Defined/NaN`, `toBeGreaterThan(OrEqual)`, `toBeLessThan(OrEqual)`, `toBeCloseTo`, `toBeInstanceOf`, `toBeTypeOf`, `toContain`, `toContainEqual`, `toHaveLength`, `toHaveProperty`, `toMatch`, `toMatchObject`, `toThrow`, `toHaveBeenCalled(Times/With)`, `.not`, `.resolves`, `.rejects` |
| `spy(impl?)`, `sleep(ms)`, `waitFor(check, { timeout, interval })` | as in the browser runner |
| `logs({ stream }?)` | lines printed so far (stdout and stderr in order, or one stream) |
| `listen(server, host = '127.0.0.1')` | listen on an ephemeral loopback port → `http://127.0.0.1:<port>`; closed automatically after the last test (needs `network: "loopback"`) |
| `request(url, { method, headers, body, signal })` | HTTP request without connection pooling → `{ status, statusText, headers, text, json }`; an object `body` is sent as JSON |
| `activeResources()` | `process.getActiveResourcesInfo()` minus the harness's own handles, for leak lessons. Node drops a closed handle one event-loop turn after its close callback, so check with `await waitFor(() => activeResources().length === 0)` |
| `tmp(name)` | absolute path under `<workspace>/.tmp/`, parent folders created |
| `loadError()` | the entry's import error (described), or `null` |
| `L` | the request's `strings` (frozen object): localized example text, as in the browser runner |

An uncaught error (or unhandled rejection) while a test runs fails that test at once with
`uncaught error during the test: <Name>: <message>` — a request handler that throws would otherwise
leave the test waiting for a response until its timeout.

**Result channel.** The server writes a random per-run nonce to the child's fd 3 and closes it;
the harness reads it before any learner code runs, closes fd 3 and writes `"<nonce> <json>"` to
fd 4. The server accepts only the first line carrying the nonce. Printing a fake result, or
writing to fd 3/4, cannot forge results (tested). Learner code shares the process with the
harness, so code written *to cheat* (patching built-ins the harness uses) is not prevented; the
results are self-assessment, not a security decision.

An ESM `SyntaxError` carries its location only in Node's uncaught-error printout. The harness
reports the error, then re-throws it so Node prints `file:///…:line` and the caret to stderr; the
server copies that location into `harnessError.file/line`.

### Process launch

For each run the server writes the files to `<runtimeDir>/node-runs/<runId>/` (realpath), then
starts, on macOS/Linux:

```
/bin/sh -c 'ulimit -t <cpu> && shift && exec /usr/bin/env -u SHLVL -u PWD -u OLDPWD -u _ "$@"' jsll-run <cpu> \
  [/usr/bin/sandbox-exec -p <profile>]  <node> \
  --permission --allow-fs-read=<workspace> --allow-fs-read=<server/node-harness> --allow-fs-write=<workspace> \
  [--allow-net] [--allow-worker] --disable-warning=ExperimentalWarning [--disable-warning=SecurityWarning] \
  --max-old-space-size=256 [--experimental-strip-types] \
  --require <server/node-harness/guard-net-none.cjs | guard-net-loopback.cjs> \
  <workspace>/<entry> | <server/node-harness/test-main.mjs> <config>
```

- Every flag is taken from `process.allowedNodeEnvironmentFlags`; a flag this Node lacks is never
  passed (`--experimental-permission` is used where `--permission` does not exist, and so on).
- `cwd` = workspace. Environment = `NO_COLOR=1`, `TMPDIR=<workspace>/.tmp` (so `os.tmpdir()`
  works inside the sandbox), plus `SystemRoot`/`windir`/`TEMP`/`TMP` on Windows only. Nothing
  else is inherited: no token, no data-directory path, no `HOME`, no `PATH`. (macOS adds
  `__CF_USER_TEXT_ENCODING` to every process; it is not a secret.)
- The child is its own process group (`detached`); timeouts and stops `SIGKILL` the whole group.
- `stdout`/`stderr` pipes are switched to blocking writes in the child, so output reaches the
  server as it is produced even during a synchronous loop (macOS pipes are otherwise
  asynchronous and would queue output in the child's memory).
- The workspace is deleted after the run; `ExperimentalWarning` (and, with workers,
  `SecurityWarning`) lines are suppressed because the platform's own flags would otherwise print
  them on every run — this also hides Node's experimental notice for `node:sqlite`.
- TypeScript: `.ts/.mts/.cts` files run through Node's own type stripping when available
  (`features.isolatedNode.typescript`: `"native"` = on by default, `"flag"` = enabled with
  `--experimental-strip-types`, `false` = this Node cannot run TypeScript and the run fails with
  Node's own error). `.tsx` is not supported by Node type stripping.

### Security model: four layers

| Layer | Mechanism | Strength |
|---|---|---|
| `node-permission` | Node's permission model (`--permission`) | Enforced inside Node's C++ APIs. Node documents it as a "seat belt" for trusted code, not a sandbox against malicious code. |
| `os-sandbox` | macOS Seatbelt profile via `/usr/bin/sandbox-exec` (macOS only, when its self-test passes) | Enforced by the kernel for the whole process, including native code such as SQLite. Apple marks `sandbox-exec` deprecated. |
| `platform-guard` | `server/node-harness/guard.cjs`, preloaded with `--require` into the main thread and every worker | JavaScript-level checks with clear `ERR_JSLL_POLICY` errors. Bypassable by code that deliberately reaches Node internals (for example raw socket handles); it stops mistakes, not attackers. |
| process limits | wall-clock timeout, output cap, heap cap, CPU-time `ulimit`, workspace-size watchdog, orphan watchdog | See *Limits*. |

What each concern is enforced by (`features.isolatedNode.enforcement` reports the same table for
the running machine):

| Concern | Enforced by | Notes |
|---|---|---|
| Read files outside workspace + harness | node-permission | `fs`, `import`, `require`, symlinks and hard links included (measured). |
| Write files outside workspace | node-permission | |
| Child processes | node-permission (+ os-sandbox: no fork/exec) | |
| Native addons, WASI, inspector | node-permission | |
| Worker threads when not requested | node-permission | |
| A worker started with its own `execArgv` | platform-guard (+ os-sandbox) | **Such a worker runs without the permission model on every tested Node**; the guard rejects the `execArgv` option in the main thread and in workers. |
| `node:sqlite` database files | platform-guard (+ os-sandbox) | **`node:sqlite` ignores the permission model on every tested Node: it reads and writes database files anywhere.** The guard limits paths to the workspace and rejects `ATTACH`, `VACUUM INTO`, storage-directory pragmas, extensions and backups outside the workspace. Seatbelt confines writes to the workspace and closes reads in `/Users`, `/Volumes`, `/private/var/folders`, `/private/tmp`, `/private/var/tmp`. |
| Signals to other processes (e.g. the server) | platform-guard (+ os-sandbox) | **Not covered by the permission model**: without the other layers learner code can kill the platform server. `process.kill(process.pid, sig)` still works. |
| `network: "none"` | node-permission on Node ≥ 25 (`--allow-net` absent); os-sandbox; platform-guard | Node < 25 has no network permission at all. |
| `network: "loopback"` outbound | os-sandbox (outbound to localhost only); platform-guard | Node 25's `--allow-net` is all-or-nothing: once given, every address and interface is allowed. |
| `network: "loopback"` listening address | platform-guard only | Seatbelt cannot tell loopback binds from other binds. The guard requires an explicit loopback host (`server.listen(3000, '127.0.0.1')`); `listen(3000)` is rejected with that advice, because it would accept connections from the local network. |

Network guard details: in `"none"` every `net`/`tls`/`http(s)`/`http2`/`fetch` connection,
`listen`, UDP bind/send/connect and DNS lookup/resolve throws `ERR_JSLL_POLICY`. In
`"loopback"` connections and lookups are allowed only for `localhost`, `127.0.0.0/8`, `::1` and
IPv4-mapped loopback; Unix sockets only inside the workspace; DNS `resolve*` (which always
queries DNS servers) is blocked.

Bare imports (`import express from "express"`) fail with `ERR_MODULE_NOT_FOUND` and the
explanation that the course runner has no npm packages (the permission model would otherwise
report `ERR_ACCESS_DENIED` when module resolution walks up to an outside `node_modules`).

### Availability (`features.isolatedNode`)

At startup the server proves isolation instead of trusting flag names: it runs a probe child with
the real launch arguments and requires *write inside allowed*, *read outside →
`ERR_ACCESS_DENIED`*, *child process → `ERR_ACCESS_DENIED`*. If any of these fails, or Node has no
permission model, `available` is `false`, `reason` explains why and `/api/node/run` answers `501`
— code is never run without isolation. On macOS a second probe (no guard) checks that Seatbelt
blocks a SQLite write outside the workspace and a signal to the parent; only then is
`osSandbox.active` true. `JSLL_NODE_OS_SANDBOX=off` disables the Seatbelt layer for
troubleshooting. `JSLL_NODE_RUNNER=off` turns Node execution off entirely (`available: false`
with that reason, every run `501`); code that starts the server can pass `createNodeRunner`
options as `overrides.nodeRunner` (the end-to-end suite passes a `support` override to exercise the
real "no permission model" path). Turning execution off never weakens isolation.

```json
{ "available": true, "node": "v25.2.1", "flags": ["--permission", "--allow-fs-read", "…"],
  "typescript": "native", "osSandbox": { "kind": "macos-seatbelt", "active": true },
  "limits": { "…": "…" }, "enforcement": { "fsRead": ["node-permission"], "…": [] },
  "limitations": ["…"] }
```

### Limits

| Limit | Value | On breach |
|---|---|---|
| Wall-clock timeout | default 10 s, max 60 s | process group `SIGKILL`, `reason: "timeout"` |
| Output (stdout + stderr) | 200 KB | output cut at the cap, process killed, `truncated: true`, `reason: "output-limit"` |
| Concurrent runs | 2 per server | `429 busy` |
| Files / total size | 200 files, 2 MB (incl. the check file) | `413` |
| JavaScript heap | 256 MB (`--max-old-space-size`) | Node aborts (`SIGABRT`), `reason: "crashed"`, Node's heap message on stderr |
| Workspace on disk | 64 MB or 5000 entries, checked every 250 ms | `reason: "workspace-limit"` |
| CPU time | `ulimit -t` = timeout × 2 + 5 s (× 8 with workers) | kernel `SIGXCPU`; normally the wall-clock timeout fires first |
| Per-test timeout | default 4 s, max 30 s | that test fails, the next one runs |
| stdin / args | 1 MB / 64 × 4 KB | `400` |
| `strings` | 500 keys, 32 KB | `400` / `413` |

**Runs never outlive the server.** The server kills live run groups on a normal exit. If it is
killed or interrupted (Ctrl+C does not run exit handlers and runs are in their own process group),
the guard's orphan watchdog ends an idle run within about a second, and the CPU-time limit ends a
run stuck in a synchronous loop. All three paths are tested (`runs never outlive the server`).

## Type checking

### `POST /api/typecheck`

```json
{ "files": { "src/app.tsx": "…" }, "options": { "strict": true, "jsx": true, "lib": ["ES2022", "DOM"] } }
```

→ `{ "diagnostics": [{ "file", "line", "column", "code", "category": "error"|"warning", "message" }], "truncated", "durationMs", "tsVersion" }`

- The installed `typescript@7` is the native compiler with no JavaScript API. Each request writes
  the files plus a generated `tsconfig.jsll.json` (reserved name) to
  `<runtimeDir>/typecheck/<id>/` and runs the compiler binary (located through the package's
  `getExePath`, falling back to `node_modules/typescript/bin/tsc` run by this Node) with
  `-p tsconfig.jsll.json --pretty false`; the folder is deleted afterwards.
- Generated options: `noEmit`, `strict` (default true), `target ES2022`, `module ESNext`,
  `moduleResolution bundler`, `allowImportingTsExtensions`, `skipLibCheck`, `isolatedModules`,
  `jsx: react-jsx` when `options.jsx`, `lib` default `["ES2022","DOM","DOM.Iterable"]`, `types: []`,
  and absolute `typeRoots`/`paths` for `react` and `react-dom` typings, so React resolves wherever
  the runtime folder is.
- Output parsing: `file(line,col): error TS…: …` lines, indented continuation lines appended to the
  message, file-less configuration errors (`file: null`). Paths are relative to the project;
  "no inputs" (TS18003) is rewritten to "No TypeScript files to check".
- Limits: 200 files / 2 MB, 20 s (`504 typecheck-timeout`), 2 concurrent (`429`), first 500
  diagnostics (`truncated: true`).
- `features.typecheck` = `{ available, tsVersion, limits, nodeTypes }`; availability requires
  the compiler to answer `--version` at startup.
- **Limitation:** `@types/node` is not installed (and no dependency may be added), so imports of
  `node:*` modules are TS2591 errors (`features.typecheck.nodeTypes: false`). Type checking suits
  browser/React TypeScript; Node-stage TypeScript runs (with type stripping) but cannot be
  type-checked against Node's API here.

## Project export

### `POST /api/export/folder`

`{ "name": "Wishlist", "files": { "path": "text" }, "manifest": { … } }` →
`{ "path": "<exportsDir>/Wishlist-20261001-173757", "folderName": "…", "fileCount": 4 }`

- Folder name: the learner's name with letters of any script, digits, `.`, `_`, `-` kept (other
  runs become `-`, at most 60 characters, `project` if empty or Windows-reserved) plus a local
  `YYYYMMDD-HHmmss` stamp. The folder is created with an exclusive `mkdir`; if it exists, `-2`,
  `-3`, … is appended. **No existing folder is ever written to**, so earlier exports that the
  learner edits in VS Code are never touched. Files are written with `wx` (no overwrite).
- `jsll-manifest.json` (reserved name) = the given manifest plus `format: "jsll-export"`,
  `formatVersion: 1`, `exportedAt` and `files: [{ path, bytes, sha256 }]`.
- Path rules are the same as for the Node executor (including `.git`, case collisions and
  file/folder conflicts). At most 1000 files / 8 MB; manifest ≤ 256 KB.
- A failed write removes the half-written new folder (created by this request) and answers
  `507 export-failed`.

## Backup and restore

Format `jsll-backup`, version 1:

```json
{ "format": "jsll-backup", "formatVersion": 1, "schemaVersion": 1, "appVersion": "0.1.0",
  "createdAt": "…", "docs": [{ "id": "profile", "rev": 3, "updatedAt": "…", "data": { } }],
  "unreadable": [], "checksum": "<sha256 hex>" }
```

`checksum` = SHA-256 of the canonical JSON of `docs` (object keys sorted at every level, no
whitespace, documents sorted by id). The envelope contains no token and no machine path; document
`data` is included verbatim. Creation refuses (`500 backup-unsafe`) if any document contains the
API token. Documents that cannot be read (damaged, no `.bak`) are listed in `unreadable` instead
of failing the whole backup.

- `POST /api/backup/create` → the backup object (the UI saves it outside tracked paths, REQ-026).
- `POST /api/backup/preview` `{ backup, mode? }` → `{ ok, problems: [{ code, message, id? }], summary, summaries: { merge, replace } }`.
  Nothing is changed. `summary` = `{ mode, total, new, replacing, unchanged, keptLocal, localOnly, removing }`.
  Problem codes: `not-a-backup`, `wrong-format`, `bad-format-version`, `newer-format`,
  `bad-schema-version`, `newer-schema`, `older-schema`, `bad-docs`, `too-many-docs` (> 20 000),
  `bad-doc`, `bad-id` (same id rules as the store, so `../` is impossible), `duplicate-id`,
  `bad-rev`, `bad-date`, `too-large` (> 5 MB per document), `no-checksum`, `checksum-mismatch`.
- `POST /api/backup/apply` `{ backup, mode: "replace" | "merge" }`:
  - Any problem → `422 invalid-backup` with `problems`, **before** a snapshot or any write.
  - Store not ready (newer schema on disk, failed migration) → `409 store-not-ready`.
  - Otherwise copies `<dataDir>/docs` to `<dataDir>/snapshots/pre-restore-<timestamp>-<rand>/`,
    then writes. `replace`: the profile becomes exactly the backup (local-only documents are
    removed). `merge`: new documents are added, documents whose backup copy is newer
    (`updatedAt`) replace the local copy, newer local copies and local-only documents are kept.
    Identical documents are skipped in both modes.
  - Restored documents go through the store with a new revision (local revision + 1), so a tab
    holding an older revision gets a `409` conflict instead of silently overwriting the restore.
    The backup's own `rev`/`updatedAt` are not reused.
  - If any write fails, `docs` is replaced by the snapshot and the answer is
    `500 restore-failed` with `restored: true` (tested by failing the second write). If even the
    rollback fails, the message names the snapshot folder.
  - Success → `{ ok, mode, summary, written, removed, snapshot: "snapshots/pre-restore-…" }`.
    Snapshots are kept; nothing deletes them automatically.
- Request bodies up to 128 MB. One apply at a time (`409 busy`).

## Known limitations (summary)

1. The permission model is a seat belt, not a malware sandbox (Node's own documentation); the
   platform guard is bypassable by deliberate code. On Linux and Windows there is no OS layer
   (*not implemented*), so `node:sqlite` paths, worker `execArgv` and signals rely on the guard
   alone, and on Node < 25 so does `network: "none"`.
2. Loopback-only *listening* is guard-only on every OS.
3. Memory outside the JavaScript heap (Buffers, ArrayBuffers) is not capped; the workspace size
   is polled, not enforced by a quota.
4. Platform guards apply in workers too; the result channel resists output forgery but not
   deliberate tampering inside the same process.
5. Windows: process-group kill, CPU-time limit and clean environment rules are implemented but
   *unverified* (no Windows run was performed). Linux: *unverified* (no Linux run was performed).
6. Node versions measured: 22.23.3, 24.21.0, 25.2.1, 25.9.0 on macOS arm64. `engines` says
   `>=22.13`; 22.13–22.22 are *unverified* (the friendly bare-import message needs
   `module.registerHooks`, present in 22.23.3; without it Node's own error is shown).
7. Type checking has no Node typings (`@types/node` not installed).
8. Backup apply is not isolated from concurrent writes by an open tab during the apply window;
   a write in that window can be lost if the apply rolls back.
