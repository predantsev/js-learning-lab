# Evidence: server runtime APIs (Node executor, type checking, export, backup)

Date: 2026-10-01. Issue #7 (M1 platform). Contracts and the security model are in
[`docs/platform/SERVER-API.md`](../../platform/SERVER-API.md). Everything below was run on this
machine; outputs are copied from the terminal (machine-specific paths replaced by `<tmp>`/`<repo>`).
Claims that were not measured are marked *unverified*.

## Environment

```
$ sw_vers; uname -m
ProductName:    macOS
ProductVersion: 26.6.2
BuildVersion:   25G83
arm64
$ node --version          → v25.2.1   (Homebrew; the default for npm test)
$ npx -y node@22 --version → v22.23.3
$ npx -y node@24 --version → v24.21.0
$ npx -y node@25 --version → v25.9.0
$ node_modules/.bin/tsc --version → Version 7.0.2
```

`npx -y node@N` downloads the official Node binary into the npm cache for this compatibility
check only; no dependency was added to the project.

## 1. Unit suite and Node version matrix

`npm test` now runs `node --test "tests/unit/*.test.mjs"`. The previous script
(`node --test tests/unit/`) does not work on any tested version — Node treats the directory as a
module path (checked in a scratch folder containing one passing test file):

```
$ npx -y node@22 --test tests/unit/   (same on 24 and 25)
Error: Cannot find module '<tmp>/tests/unit'
```

Results (each line is the runner's own summary):

| Command | Node | tests | pass | fail | skipped |
|---|---|---|---|---|---|
| `npm test` | v25.2.1 | 77 | 77 | 0 | 0 |
| `JSLL_NODE_OS_SANDBOX=off npm test` | v25.2.1 | 77 | 76 | 0 | 1 |
| `npx -y node@22 --test "tests/unit/*.test.mjs"` | v22.23.3 | 77 | 76 | 0 | 1 |
| `npx -y node@24 --test "tests/unit/*.test.mjs"` | v24.21.0 | 77 | 76 | 0 | 1 |
| `npx -y node@25 --test "tests/unit/*.test.mjs"` | v25.9.0 | 77 | 77 | 0 | 0 |

The suite runs real child processes with `process.execPath`, so each row exercises the executor
on that Node version. Skips, verbatim:

```
﹣ without --allow-net, Node itself blocks the network (Node 25+) # Node v24.21.0 has no --allow-net: network "none" relies on the platform guard and Seatbelt
ok 2 - without --allow-net, Node itself blocks the network (Node 25+) # SKIP Node v22.23.3 has no --allow-net: network "none" relies on the platform guard and Seatbelt
﹣ the macOS Seatbelt layer blocks sqlite reads/writes outside the workspace and signals to other processes # no OS sandbox layer on darwin   ← JSLL_NODE_OS_SANDBOX=off run
```

`JSLL_NODE_OS_SANDBOX=off` is the closest available stand-in for Linux/Windows (permission model
+ platform guard, no OS layer): every isolation test still passed. A real Linux or Windows run was
**not** performed (*unverified*).

`engines.node` stays `>=22.13`: nothing measured requires a change, but 22.13–22.22 were not run
(*unverified*). The only feature found that is newer than 22.13 is `module.registerHooks`
(friendly bare-import message); the guard checks for it and falls back to Node's own error.

Tests in the local run (`npm test`, v25.2.1, all ✔):

```
backup:      create → wipe → apply(replace) restores every document · preview summarizes merge and
             replace without changing anything · a corrupted backup is rejected and the data stays
             untouched · newer schemas, newer formats, unsafe ids and non-backups are rejected · a
             failure during apply puts the previous data back · canonical JSON sorts keys at every level
export:      an export writes every file plus a manifest with SHA-256 hashes · unsafe paths are
             rejected and nothing is written · an export never overwrites an existing folder,
             including earlier exports edited locally · folder names are safe and keep non-Latin letters
http:        a valid request from the application succeeds · unknown Host headers are refused (DNS
             rebinding) · the API is not served on sandbox hosts · cross-origin requests are refused
             even with the token · requests without the local token are refused · the server listens
             on loopback only
expect:      passing matchers do not throw · failure messages match the browser runner · failures
             carry serialized expected/actual values for diffs · .resolves and .rejects await the
             promise · spies record calls and results; waitFor polls until true · deepEqual follows
             the browser runner rules
node-run:    availability (2) · real execution (6) · limits and interruption (8) · isolation (10) ·
             what each layer enforces on its own (3) · test mode (7) · runs never outlive the server (3)
store:       writes are atomic · a stale revision is a conflict · .bak recovery / corrupt · injected
             write failures leave the previous version intact · a failed migration restores the
             pre-migration snapshot · a successful migration records the new schema version · data
             from a newer schema is never written to · unsafe document ids are rejected · HTTP 409/507
typecheck:   the feature reports the compiler version · type errors come back with file, line,
             column, code and message · a clean project has no diagnostics; strict can be turned off ·
             React components type-check against the installed React typings · unsafe paths,
             reserved names and bad options are rejected · sending no TypeScript files is explained ·
             parseDiagnostics handles chained messages and file-less errors
```

Full names of the node-run tests: see `tests/unit/node-run.test.mjs`.

## 2. What Node's permission model enforces on its own

Probe committed as `tests/unit/probes/node-permission-probe.mjs` (no platform guard, no OS
sandbox; flags `--permission --allow-fs-read=<ws> --allow-fs-write=<ws>`; no outside network
traffic). Commands:

```
node tests/unit/probes/node-permission-probe.mjs
npx -y node@22 tests/unit/probes/node-permission-probe.mjs   (and @24, @25)
```

Output, condensed per version (values are exactly the probe's):

| Check | 22.23.3 | 24.21.0 | 25.2.1 | 25.9.0 |
|---|---|---|---|---|
| `--allow-net` flag exists | false | false | true | true |
| fs read outside | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED |
| fs write outside | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED |
| symlink / hard link to outside | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED |
| child process / worker / WASI / inspector | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED |
| native addon | ERR_DLOPEN_DISABLED | ERR_DLOPEN_DISABLED | ERR_DLOPEN_DISABLED | ERR_DLOPEN_DISABLED |
| `process.kill(process.ppid, 0)` | **allowed: true** | **allowed: true** | **allowed: true** | **allowed: true** |
| `node:sqlite` open/create outside | **allowed** | **allowed** | **allowed** | **allowed** |
| `node:sqlite` ATTACH outside | **allowed** | **allowed** | **allowed** | **allowed** |
| `node:sqlite` read a database outside | **allowed: top secret** | **allowed: top secret** | **allowed: top secret** | **allowed: top secret** |
| files created outside by sqlite | escaped.db, attached.db | escaped.db, attached.db | escaped.db, attached.db | escaped.db, attached.db |
| worker (`--allow-worker`), inherited execArgv, read outside | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED | ERR_ACCESS_DENIED |
| worker with `execArgv: []`, read outside | **allowed** | **allowed** | **allowed** | **allowed** |
| no `--allow-net`: listen 127.0.0.1 / 0.0.0.0 / lookup localhost | allowed / allowed / allowed | allowed / allowed / allowed | ERR_ACCESS_DENIED ×3 | ERR_ACCESS_DENIED ×3 |
| with `--allow-net`: listen 127.0.0.1 / 0.0.0.0 / lookup localhost | — | — | allowed ×3 | allowed ×3 |

Conclusions used in the design (each traced to a row above):

- Filesystem isolation through Node APIs holds on every tested version → the stop-and-ask
  condition ("no filesystem isolation on any tested version") is **not** met.
- `node:sqlite`, signals and worker `execArgv` are holes in the permission model on every tested
  version → covered by the platform guard and, on macOS, Seatbelt; stated as limitations.
- `--allow-net` (Node 25) is all-or-nothing → `network: "none"` is runtime-enforced only on
  Node ≥ 25; loopback-only is never enforced by Node itself.

Earlier ad-hoc probe on Node 25.2.1 (scratch script, not committed) with `--allow-net`: an
outbound `net.connect(80, '1.1.1.1')` printed `ok: connected` and `fetch('http://example.com/')`
printed `ok: 200` — confirming that `--allow-net` opens the outside network too. Without the flag
on 25.x, `server.listen()` fails with `ERR_ACCESS_DENIED` thrown asynchronously (uncaught, the
process exits); the platform guard turns this into a synchronous, catchable `ERR_JSLL_POLICY`.

## 3. macOS Seatbelt experiments (choosing the profile)

Scratch scripts, not committed; profiles and output verbatim. Node 25.9.0 under
`/usr/bin/sandbox-exec -p '<profile>' node n4.mjs`, where `n4.mjs` binds a server to each host:

```
(allow default)(deny network-bind (local ip "*:*"))(allow network-bind (local ip "localhost:*"))
127.0.0.1 ok | ::1 ok | 0.0.0.0 ok | :: ok | 192.168.0.201 ok
(allow default)(deny network-bind)
127.0.0.1 ERR EPERM | ::1 ERR EPERM | 0.0.0.0 ERR EPERM | :: ERR EPERM | 192.168.0.201 ERR EPERM
```

→ Seatbelt cannot allow loopback binds while refusing others, so the listening address is
guard-only. With `(deny network-inbound)(allow network-inbound (local ip "localhost:*"))` a server
bound to `::` still answered a connection to the machine's LAN address (`LAN connect got x`), so
inbound filtering is not relied on either.

Outbound and signals (`(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))`,
`(deny signal)(allow signal (target self))`):

```
{"listen-127":"ok: 53322","connect-127":"ok: x","listen-0.0.0.0":"ok: 53324","connect-external":"ERR EPERM connect EPERM 1.1.1.1:80 - Local (0.0.0.0:0)","kill-sleeper":"ERR EPERM kill EPERM"}
```

Name resolution under that profile: `dns.lookup('localhost')` → `::1, 127.0.0.1`;
`dns.lookup('example.com')` → `ENOTFOUND`; `net.connect('/var/run/docker.sock')` → `EPERM`.

File rules: with writes denied outside the workspace, `new DatabaseSync('../outside.db')` →
`ERR_SQLITE_ERROR unable to open database file`. The final profile (`seatbeltProfile()` in
`server/api/lib/node-runner.mjs`) is verified by the committed test *the macOS Seatbelt layer
blocks sqlite reads/writes outside the workspace and signals to other processes*: without the
platform guard, a SQLite write outside the workspace, a SQLite read of a database in the
temporary folder and `process.kill(process.ppid, 0)` print
`sqlite-write ERR_SQLITE_ERROR,sqlite-read ERR_SQLITE_ERROR,signal EPERM`. Reads of databases
outside the closed folders (`/Users`, `/Volumes`, `/private/var/folders`, `/private/tmp`,
`/private/var/tmp`) remain possible through SQLite (*by design of the profile; not exercised*).

Nested sandboxing: `sandbox-exec -p '(version 1)(allow default)' /bin/echo nested-sandbox-ok`
printed `nested-sandbox-ok` from this session's shell. The server's self-test decides at startup;
a failing self-test leaves `osSandbox.active: false` with a reason (that path is exercised only
through `JSLL_NODE_OS_SANDBOX=off`, not through a real failure — *unverified*).

## 4. Problems found while testing, and fixes

**Output flood ended in a heap crash instead of the output cap (Node 24/25.9 under load).**
Repeated full-suite runs on Node 24 before the fix:

```
AssertionError [ERR_ASSERTION]: {"type":"exit","code":null,"signal":"SIGABRT","timedOut":false,"truncated":false,"durationMs":840,"reason":"exited","stopped":false}
```

Cause (*inferred from the SIGABRT and from Node's documentation that pipes are asynchronous on
macOS*): during `for (;;) console.log(line)` the child's event loop never runs, so once the pipe is
full the writes queue in the child's memory until the 256 MB heap is exhausted. Fix: the guard
switches stdout/stderr pipe handles to blocking writes; exits by a signal the platform did not
send are now `reason: "crashed"`. After the fix, four consecutive full-suite runs on Node 24:
`ℹ fail 0` ×4.

**SyntaxError location lost in test mode.** `error.stack` of an ESM SyntaxError has no file/line
(checked on 25.2.1 and 22.23.3: own properties `[ 'stack', 'message' ]`, first stack line
`SyntaxError: Unexpected token ';'`); Node prints the location only for an uncaught error. The
harness now re-throws after reporting; Node then prints `file:///…/broken.mjs:2` plus the caret,
and the server copies it into `harnessError` (test: *a syntax error in learner code is reported as
a harness error with location* → `['broken.js', 1]`).

**Bare import message.** With the runtime folder outside the repository, `import "react"` gave
Node's plain `ERR_MODULE_NOT_FOUND`; inside the repository it gives `ERR_ACCESS_DENIED` (module
resolution walks up to the repo's `node_modules`). Both now carry the explanation that the
runner has no npm packages.

**`activeResources()` right after `server.close()`.** Measured in plain Node 25.2.1:

```
open [ 'TCPServerWrap' ]
after close cb [ 'TCPServerWrap' ]
after immediate [ 'TCPServerWrap' ]
after timeout0 []
```

This is Node's behavior, not the harness's; lessons and the test wait with `waitFor`.

**Shell variables.** The CPU-limit wrapper (`/bin/sh -c 'ulimit -t …'`) first leaked `PWD` and
`SHLVL` into the learner environment (test failure: `actual: [ 'PWD', 'SHLVL' ]`); `unset` did not
help (`SHLVL=0` re-exported by bash), `exec /usr/bin/env -u SHLVL -u PWD -u OLDPWD -u _` does:

```
$ env -i NO_COLOR=1 /bin/sh -c 'ulimit -t "$1" && shift && exec /usr/bin/env -u SHLVL -u PWD -u OLDPWD -u _ "$@"' jsll-run 5 /usr/bin/env
NO_COLOR=1
```

## 5. API samples (server started with `startServer({ port: 0, … })`, v25.2.1)

```
GET /api/bootstrap → features: [ 'backup', 'exportFolder', 'isolatedNode', 'typecheck' ]
  typecheck: { available: true, tsVersion: '7.0.2', limits: { timeoutMs: 20000, concurrent: 2 }, nodeTypes: false }

POST /api/node/run {"files":{"i.js":"console.log(process.version)"},"entry":"i.js"}
200 application/x-ndjson; charset=utf-8
{"type":"start","runId":"nr-mupq1llq-ea60f5c62839","node":"v25.2.1","mode":"run","cwd":"<tmp>/rt/node-runs/nr-mupq1llq-ea60f5c62839","policy":{"network":"none","workers":false,"osSandbox":"macos-seatbelt","networkEnforcedBy":["node-permission","os-sandbox","platform-guard"],"typescript":"native"}}
{"type":"stdout","data":"v25.2.1\n"}
{"type":"exit","code":0,"signal":null,"timedOut":false,"truncated":false,"durationMs":66,"reason":"exited","stopped":false}

POST /api/typecheck {"files":{"a.ts":"const x: number = \"a\";\ntype P = { a: string; b: number };\nconst p: P = { a: \"x\" };\n"}}
200 {"diagnostics":[{"file":"a.ts","line":1,"column":7,"code":2322,"category":"error","message":"Type 'string' is not assignable to type 'number'."},{"file":"a.ts","line":3,"column":7,"code":2741,"category":"error","message":"Property 'b' is missing in type '{ a: string; }' but required in type 'P'."}],"truncated":false,"durationMs":40,"tsVersion":"7.0.2"}

POST /api/export/folder {"name":"Мій список бажань","files":{…2 files…},"manifest":{"capstone":"wishlist"}}
200 {"path":"<tmp>/exports/Мій-список-бажань-20261001-180119","folderName":"Мій-список-бажань-20261001-180119","fileCount":2}
POST /api/export/folder {"name":"x","files":{"../evil.js":""}}
400 {"error":"bad-path","message":"Unsafe file path \"../evil.js\": \".\" and \"..\" segments are not allowed.","path":"../evil.js"}

POST /api/backup/create
200 {"format":"jsll-backup","formatVersion":1,"schemaVersion":1,"appVersion":"0.1.0","createdAt":"2026-10-01T16:01:19.259Z","docs":[{"id":"profile","rev":1,"updatedAt":"2026-10-01T16:01:19.253Z","data":{"lang":"uk"}}],"unreadable":[],"checksum":"e38a978adf1a8ea41b06086787bccf0dfb80dcb7b2c10acd72f6ea4f5e67d9d3"}
POST /api/backup/preview {"backup": <the above>}
200 {"ok":true,"problems":[],"summary":{"mode":"merge","total":1,"new":0,"replacing":0,"unchanged":1,"keptLocal":0,"localOnly":0,"removing":0},…}
```

Startup cost of the executor's self-tests (permission probe + Seatbelt probe), measured by a
scratch script calling `createNodeRunner()` directly: `init ms 112` (v25.2.1), `108` (v22.23.3),
`91` (v24.21.0); `61` with the Seatbelt layer off.

## 6. Not verified

- Linux and Windows (no runs). On Windows the CPU-time limit and process-group kill are not
  available; the code falls back to `child.kill('SIGKILL')` (*unverified*).
- Node 22.13–22.22 and any Node newer than 25.9.0.
- A real Seatbelt self-test failure (only the configuration switch was exercised).
- Concurrent tab writes during a backup apply (documented limitation, not tested).
- Behavior with the real application UI: no UI consumes these endpoints yet (`app/**` is out of
  scope for this change).
