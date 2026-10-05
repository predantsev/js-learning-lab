# The server part: evidence

What was run in `server/` for each step of the Node.js stage, with the output seen. A step that was
not run says so, with the reason and what it takes to come back.

## NO-01 — the typed summary script

Node.js v25.2.1, npm 11.6.2, TypeScript 7.0.2, @types/node 22.20.5 (macOS). Not run on Node.js 22: on
22.13–22.17 the command is `node --experimental-strip-types src/summary.ts`.

`TODAY=2026-03-02 LOCALE=en npm run summary`:

```text
Pending tasks due on or before 2026-03-02: 2
- %%fixture2Name%% (2026-03-01)
- %%fixture1Name%% (2026-03-02)
```

`TODAY=2026-02-31 node src/summary.ts; echo "exit $?"` (an invalid value):

```text
TODAY must be a real date YYYY-MM-DD, got "2026-02-31"
exit 1
```

`npm run typecheck` (`tsc -p .`): no output, exit code 0.

## NO-02 — the file repository and the crash rehearsal

Node.js v25.2.1 (macOS). The data file `server/data/` is not in Git (`.gitignore`). The crash is
`CRASH_BEFORE_RENAME=1`: the process kills itself with SIGKILL after the temp file was written and
flushed, before the rename. `npm run check` repeats these checks in `server/.check/`.

```text
$ npm run summary
Created the data file with the starting tasks: ~/js-course/planner/server/data/planner.json
Pending tasks due on or before 2026-03-02: 2
- %%fixture2Name%% (2026-03-01)
- %%fixture1Name%% (2026-03-02)
$ CRASH_BEFORE_RENAME=1 node src/complete-task.ts t-01; echo "exit $?"
exit 137
$ ls data
planner.json
planner.json.4a2bc2a4-894e-4eb0-8476-4866aca05daf.tmp
$ npm run summary
Removed a temp file left by a crash: planner.json.4a2bc2a4-894e-4eb0-8476-4866aca05daf.tmp
Pending tasks due on or before 2026-03-02: 2
- %%fixture2Name%% (2026-03-01)
- %%fixture1Name%% (2026-03-02)
$ node src/complete-task.ts t-01
Saved: t-01 is done
$ npm run summary
Pending tasks due on or before 2026-03-02: 1
- %%fixture2Name%% (2026-03-01)
$ npm run check
8 of 8 checks passed
```

## NO-03 — the records server

Measured on a fresh `server/data/` (the first start created it); in the course chain the step changes another record, because step NO-02 already changed this one.

Node.js v25.2.1, curl 8.7.1 (macOS). `npm start` in one terminal, the requests in another; Ctrl+C
sends SIGINT. A change made while the server is stopped is there after the restart.

```text
$ curl -i http://127.0.0.1:4311/records
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
content-length: 577
Date: Sun, 04 Oct 2026 14:54:13 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":"t-01","title":"%%fixture1Name%%","dueDate":"2026-03-02","done":false,"priority":"normal"},{"id":"t-02","title":"%%fixture2Name%%","dueDate":"2026-03…
$ curl -i http://127.0.0.1:4311/nothing-here
HTTP/1.1 404 Not Found
content-type: application/json; charset=utf-8
content-length: 21
Date: Sun, 04 Oct 2026 14:54:13 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"not found"}
$ curl -i -X DELETE http://127.0.0.1:4311/records
HTTP/1.1 405 Method Not Allowed
allow: GET
content-type: application/json; charset=utf-8
content-length: 30
Date: Sun, 04 Oct 2026 14:54:13 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"method not allowed"}
$ npm start   (a second copy, in another terminal)
Error: listen EADDRINUSE: address already in use 127.0.0.1:4311
  code: 'EADDRINUSE',
--- the server terminal after Ctrl+C:
> js-learning-lab-planner-server@0.1.0 start
> node src/server.ts
Created the data file with the starting tasks: ~/js-course/planner/server/data/planner.json
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
GET /records → 200
GET /nothing-here → 404
DELETE /records → 405
SIGINT received: closing the server…
Server closed. Bye.
$ curl -sS http://127.0.0.1:4311/records
curl: (7) Failed to connect to 127.0.0.1 port 4311: Couldn't connect to server
$ npm run -s complete -- t-01
Saved: t-01 is done
$ curl -sS http://127.0.0.1:4311/records   (after the restart)
[{"id":"t-01","title":"%%fixture1Name%%","dueDate":"2026-03-02","done":true,"priority":"normal"},{"id":"t-02","title":"%%fixture2Name%%","dueDate":"2026-03-01","done":false,"priority":"high"},{"id":"t-03","title":"Wr…
$ npm run check:server
✔ GET /records → 200, JSON, the stored tasks
✔ GET /records?view=all → 200 (routing by pathname)
✔ GET /nothing-here → 404, JSON
✔ DELETE /records → 405 with Allow: GET, JSON
✔ Ctrl+C (SIGINT) closes the server and the process ends with code 0
✔ after a restart GET /records answers the same tasks
6 of 6 checks passed
```

## NO-04 — the /v1 records API

Node.js v25.2.1, curl 8.7.1 (macOS). The server was started with `npm start` in one terminal (fresh
`server/data/`), `node try-api.mjs` ran in another, then Ctrl+C. Request ids and the idempotency key are
random and shortened to `…` here. The idempotency keys live in the server's memory: a restart forgets them.

```text
$ node try-api.mjs
== 1. POST /v1/records (Idempotency-Key: …)
{"id":"t-07","title":"%%fixture1Name%% 2","dueDate":"2026-03-04","done":false,"priority":"high"} → 201
== 2. the same POST retried with the same key
{"id":"t-07","title":"%%fixture1Name%% 2","dueDate":"2026-03-04","done":false,"priority":"high"} → 201
== 3. PATCH /v1/records/t-01 with invalid fields
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"title":"required","dueDate":"bad-date"},"requestId":"…"}} → 400
== 4. GET /v1/records?sort=dueDate&limit=3
{"items":[{"id":"t-04","title":"%%fixture4Name%%","dueDate":"2026-02-27","done":true,"priority":"high"},{"id":"t-02","title":"%%fixture2Name%%","dueDate":"2026-03-01","done":false,"priority":"high"},{"id":"t-01","title":"%%fixture1Name%%","dueDate":"2026-03-02","done":false,"priority":"normal"}],"nextCursor":"t-01"}
== 5. GET /v1/records?sort=dueDate&limit=3&cursor=t-01
{"items":[{"id":"t-07","title":"%%fixture1Name%% 2","dueDate":"2026-03-04","done":false,"priority":"high"},{"id":"t-06","title":"%%fixture6Name%%","dueDate":"2026-03-05","done":true,"priority":"low"},{"id":"t-05","title":"%%fixture5Name%%","dueDate":"2026-03-10","done":false,"priority":"normal"}],"nextCursor":"t-05"} → 200
--- the server terminal:
Created the data file with the starting tasks: ~/js-course/planner/server/data/planner.json
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
POST /v1/records → 201
POST /v1/records → 201
PATCH /v1/records/t-01 → 400
GET /v1/records?sort=dueDate&limit=3 → 200
GET /v1/records?sort=dueDate&limit=3&cursor=t-01 → 200
SIGINT received: closing the server…
Server closed. Bye.
$ node -e "…" (the records in the data file)
1 7 t-01 t-02 t-03 t-04 t-05 t-06 t-07
$ npm test
ℹ tests 13
ℹ pass 13
ℹ fail 0
```

## NO-05 — a durable store

Measured on the data file of a fresh NO-04 run; in the course chain the numbers differ by the records earlier steps changed.

A JSON file, not SQLite: the store is small and written by one server process, and Node.js 22.13 (the
course minimum) has no `sqlite.backup()` (it arrived in 22.16). Node.js v25.2.1 (macOS); the same
commands on Node.js v22.13.1 with `NODE_OPTIONS=--experimental-strip-types` printed the same lines plus
an `ExperimentalWarning` about type stripping per process, and `npm test` reported in TAP (`# pass`)
when its output went to a file. Time stamps are shortened to `<stamp>`, request ids and keys to `…`.
The server was stopped with Ctrl+C after every start. Every npm command ran with TODAY=2026-03-02.

```text
$ node -e "…" (the version, the count and the ids in the NO-04 data file)
1 7 t-01 t-02 t-03 t-04 t-05 t-06 t-07
$ npm start   (a version 1 store, before the migration)
Cannot start: planner.json is schemaVersion 1: run "npm run migrate" first
$ node -e "…" (one record in the old v1 shape)
{"id":"t-01","title":"%%fixture1Name%%","dueDate":"2026-03-02","done":false}
$ npm run migrate
Dry run: 7 tasks, the same ids and pending-due count for 2026-03-02; a second run changes nothing.
Migrated planner.json to schemaVersion 2: 7 tasks.
$ node -e "…" (the record t-01 after the migration)
{"id":"t-01","title":"%%fixture1Name%%","dueDate":"2026-03-02","done":false,"priority":"normal"}
$ npm run migrate   (again)
planner.json is already schemaVersion 2: nothing to migrate.
$ npm run backup
Backup: backups/planner.<stamp>.json — 7 tasks, 2 pending due on or before 2026-03-02, sha256 …
Verified by a restore into a scratch folder: 7 tasks, the same sha256, ids and pending-due count for 2026-03-02.
$ npm start + node try-api.mjs
== 1. POST /v1/records (Idempotency-Key: …)
{"id":"t-08","title":"%%fixture1Name%% 2","dueDate":"2026-03-04","done":false,"priority":"high"} → 201
== 2. the same POST retried with the same key
{"id":"t-08","title":"%%fixture1Name%% 2","dueDate":"2026-03-04","done":false,"priority":"high"} → 201
== 3. PATCH /v1/records/t-01 with invalid fields
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"title":"required","dueDate":"bad-date"},"requestId":"…"}} → 400
== 4. GET /v1/records?sort=dueDate&limit=3
{"items":[{"id":"t-04","title":"%%fixture4Name%%","dueDate":"2026-02-27","done":true,"priority":"high"},{"id":"t-02","title":"%%fixture2Name%%","dueDate":"2026-03-01","done":false,"priority":"high"},{"id":"t-01","title":"%%fixture1Name%%","dueDate":"2026-03-02","done":false,"priority":"normal"}],"nextCursor":"t-01"}
== 5. GET /v1/records?sort=dueDate&limit=3&cursor=t-01
{"items":[{"id":"t-07","title":"%%fixture1Name%% 2","dueDate":"2026-03-04","done":false,"priority":"high"},{"id":"t-08","title":"%%fixture1Name%% 2","dueDate":"2026-03-04","done":false,"priority":"high"},{"id":"t-06","title":"%%fixture6Name%%","dueDate":"2026-03-05","done":true,"priority":"low"}],"nextCursor":"t-06"} → 200
--- the server terminal:
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
POST /v1/records → 201
POST /v1/records → 201
PATCH /v1/records/t-01 → 400
GET /v1/records?sort=dueDate&limit=3 → 200
GET /v1/records?sort=dueDate&limit=3&cursor=t-01 → 200
SIGINT received: closing the server…
Server closed. Bye.
$ damage (one field of the first record broken) and npm start
The store was damaged: moved aside as planner.json.corrupt-<stamp>, restored 7 tasks from planner.<stamp>.json
Not in the backup: t-08
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
SIGINT received: closing the server…
Server closed. Bye.
$ ls data
backups
planner.json
planner.json.corrupt-<stamp>
$ mv data/backups data/backups-aside; damage again; npm start; echo "exit $?"
Cannot start: planner.json is damaged and there is no verified backup in ~/js-course/planner/server/data/backups: refusing to start
exit 1
$ mv data/backups-aside data/backups; npm start
The store was damaged: moved aside as planner.json.corrupt-<stamp>, restored 7 tasks from planner.<stamp>.json
Not in the backup: none
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
SIGINT received: closing the server…
Server closed. Bye.
$ npm test
ℹ tests 27
ℹ pass 27
ℹ fail 0
$ npm run check
8 of 8 checks passed
$ npm run check:server
6 of 6 checks passed
$ npm run typecheck
exit 0
```

## NO-07 — the hardened edge

Edge rules: a body over 4096 bytes is a 413 with Connection: close (a declared Content-Length at once, a
chunked body by the byte count of its chunks); the server's headersTimeout and requestTimeout answer 408;
error objects have no prototype, so `__proto__` is an unknown field; the list takes only its own
parameters, each once, and a limit of digits only; an id that does not have the project's shape is a 400
before the store; the server listens on 127.0.0.1 unless HOST says otherwise and warns off loopback; one JSON
line per request (time, level, requestId, method, route, status, durationMs) — no bodies, no query.

Node.js v25.2.1, curl 8.7.1 (macOS). The same requests on Node.js v22.13.1 with
`NODE_OPTIONS=--experimental-strip-types` printed the same lines plus an `ExperimentalWarning`. The `curl -i`
output is cut to the status line, `connection`, `x-request-id` and the body; ids, times and durations are `…`.

```text
$ npm start   (and in a second terminal:)
$ node -e 'console.log(JSON.stringify({ name: "x".repeat(5000) }))' | curl -sS -i http://127.0.0.1:4311/v1/records -H "content-type: application/json" -H "transfer-encoding: chunked" --data-binary @-
HTTP/1.1 413 Payload Too Large
x-request-id: …
connection: close
{"error":{"code":"PAYLOAD_TOO_LARGE","messageKey":"errors.payloadTooLarge","details":{"maxBytes":4096},"requestId":"…"}}
$ curl -sS -i http://127.0.0.1:4311/v1/records/..%2Fpackage.json
HTTP/1.1 400 Bad Request
x-request-id: …
Connection: keep-alive
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"id":"malformed"},"requestId":"…"}}
$ curl -sS "http://127.0.0.1:4311/v1/records?limit=1e1&page=2"
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"page":"unknown-param","limit":"out-of-range"},"requestId":"…"}}
$ curl -sS http://127.0.0.1:4311/v1/records -H "content-type: application/json" -d '{"title":"   ","dueDate":"2026-02-31","priority":"терміново"}'
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"title":"required","priority":"unknown","dueDate":"bad-date"},"requestId":"…"}}
$ curl -sS http://127.0.0.1:4311/v1/records -H "content-type: application/json" -d '{"__proto__":{"isAdmin":true}}'
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"title":"required","__proto__":"unknown-field"},"requestId":"…"}}
$ curl -sS -i -H "x-request-id: support-ticket-0042" http://127.0.0.1:4311/v1/records/t-04
HTTP/1.1 200 OK
x-request-id: support-ticket-0042
Connection: keep-alive
{"id":"t-04","title":"%%fixture4Name%%","dueDate":"2026-02-27","done":true,"priority":"high"}
--- the server terminal:
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
{"time":"…","level":"info","requestId":"…","method":"GET","route":"/v1/records","status":200,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":413,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"GET","route":"/v1/records/..%2Fpackage.json","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"GET","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"info","requestId":"support-ticket-0042","method":"GET","route":"/v1/records/t-04","status":200,"durationMs":…}
SIGINT received: closing the server…
Server closed. Bye.
$ npm test
ℹ tests 41
ℹ pass 41
ℹ fail 0
$ npm run check
8 of 8 checks passed
$ npm run check:server
6 of 6 checks passed
$ npm run typecheck
exit 0
```

## NO-11 — streamed export and import

Export: every record as one JSON line, streamed with backpressure (GET /v1/export, npm run export to a
temp file renamed only after success). Import: a bounded job (at most 20,000 lines of at most 4096 bytes)
that checks every line, writes nothing until all lines are valid, then upserts by id in one change of the
store; one import at a time (a second one is a 503 with Retry-After); a client that goes away cancels it.

Node.js v25.2.1, curl 8.7.1 (macOS), on a fresh data folder. The same commands on Node.js
v22.13.1 with `NODE_OPTIONS=--experimental-strip-types` printed the same lines plus an `ExperimentalWarning`.
Times, ids and durations are `…`; the slow import was stopped by killing its curl (`kill %1`).

```text
$ npm run -s synth -- 10000 > data/import.jsonl
$ wc -l < data/import.jsonl
10000
$ head -2 data/import.jsonl
{"id":"t-101","title":"%%fixture1Name%% 0","dueDate":null,"done":true,"priority":"low"}
{"id":"t-102","title":"%%fixture2Name%% 1","dueDate":"2026-02-02","done":false,"priority":"normal"}
$ npm run -s import -- data/import.jsonl
Imported 10000 lines in … ms: 10000 new tasks, 0 updated; the store holds 10006.
$ npm run -s import -- data/import.jsonl   (again)
Imported 10000 lines in … ms: 0 new tasks, 10000 updated; the store holds 10006.
$ npm run -s export -- data/export.jsonl
Exported 10006 tasks to data/export.jsonl
$ wc -l < data/export.jsonl
10006
$ npm start   (and in a second terminal:)
$ curl -sS -i http://127.0.0.1:4311/v1/export | grep -iE "^(HTTP|content-type)"
HTTP/1.1 200 OK
content-type: application/x-ndjson; charset=utf-8
$ curl -sS http://127.0.0.1:4311/v1/export | wc -l
10006
$ curl -sS http://127.0.0.1:4311/v1/import -H "content-type: application/x-ndjson" --data-binary @data/import.jsonl
{"lines":10000,"created":0,"updated":10000}
$ cat data/bad.jsonl
{"id":"t-01","title":"%%fixture1Name%%","dueDate":"2026-03-02","done":false,"priority":"normal"}
{"id":"t-02","title":"%%fixture2Name%%","dueDate":"2026-02-31","done":false,"priority":"high"}
{"id":"t-03","title":"Купити"
{"id":"../t-04","title":"Подзвонити","dueDate":null,"done":false,"priority":"low"}
$ curl -sS http://127.0.0.1:4311/v1/import -H "content-type: application/x-ndjson" --data-binary @data/bad.jsonl
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"line 2":"dueDate: notRealDate","line 3":"not-json","line 4":"id: malformed"},"requestId":"…"}}
$ curl -sS --limit-rate 100k http://127.0.0.1:4311/v1/import -H "content-type: application/x-ndjson" --data-binary @data/import.jsonl &   (a slow import)
$ curl -sS -i http://127.0.0.1:4311/v1/import -H "content-type: application/x-ndjson" --data-binary @data/import.jsonl | grep -iE "^(HTTP|retry-after)|^\{"
HTTP/1.1 100 Continue
HTTP/1.1 503 Service Unavailable
retry-after: 1
{"error":{"code":"IMPORT_BUSY","messageKey":"errors.importBusy","details":{},"requestId":"…"}}
$ kill %1   (the slow import is cancelled: its client goes away)
$ curl -sS http://127.0.0.1:4311/v1/export | wc -l
10006
--- the server terminal:
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
{"time":"…","level":"info","requestId":"…","method":"GET","route":"/v1/export","status":200,"durationMs":…}
{"time":"…","level":"info","requestId":"…","method":"GET","route":"/v1/export","status":200,"durationMs":…}
{"time":"…","level":"info","requestId":"…","method":"POST","route":"/v1/import","status":200,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/import","status":400,"durationMs":…}
{"time":"…","level":"error","requestId":"…","event":"failed","error":"ApiError","code":"IMPORT_BUSY"}
{"time":"…","level":"error","requestId":"…","method":"POST","route":"/v1/import","status":503,"durationMs":…}
{"time":"…","level":"error","requestId":"…","event":"failed","error":"AbortError","code":"ABORT_ERR"}
{"time":"…","level":"info","requestId":"…","method":"GET","route":"/v1/export","status":200,"durationMs":…}
SIGINT received: closing the server…
Server closed. Bye.
$ npm test
ℹ tests 52
ℹ pass 52
ℹ fail 0
$ npm run check
8 of 8 checks passed
$ npm run check:server
6 of 6 checks passed
$ npm run typecheck
exit 0
```

## NO-06 — the web client on the real API

Node.js v25.2.1 and v22.13.1 (the server with `NODE_OPTIONS=--experimental-strip-types`), the Ukrainian workspace (the page text below is Ukrainian).
`.env` of the web project: `PORT=4310`, `DATA_SOURCE=http`, `API_BASE_URL=http://127.0.0.1:4311`.
The preflight below was asked of a server started with `PORT=7391 node src/server.ts` in `server/` on a fresh
`server/data/` (`npm start` gives the same headers on 4311).

```text
$ curl -sS -i -X OPTIONS http://127.0.0.1:7391/v1/records/t-01 -H "Origin: http://127.0.0.1:4310" -H "Access-Control-Request-Method: PATCH" -H "Access-Control-Request-Headers: content-type"
HTTP/1.1 204 No Content
x-request-id: …
vary: Origin
access-control-allow-origin: http://127.0.0.1:4310
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE
access-control-allow-headers: content-type, idempotency-key
$ curl -sS -i -X OPTIONS http://127.0.0.1:7391/v1/records/t-01 -H "Origin: http://127.0.0.1:4312" -H "Access-Control-Request-Method: PATCH"
HTTP/1.1 204 No Content
x-request-id: …
vary: Origin
$ curl -sS -X PATCH http://127.0.0.1:7391/v1/records/t-01 -H "Origin: http://127.0.0.1:4310" -H "content-type: application/json" -d '{"done":true}'
{"id":"t-01","title":"%%fixture1Name%%","dueDate":"2026-03-02","done":true,"priority":"normal"}
```

In Chrome 154, http://127.0.0.1:4310/: "Позначити виконаною: %%fixture1Name%%" — the server log shows
`OPTIONS /v1/records/t-01 204` then `PATCH /v1/records/t-01 200` and the lists read again; the summary line
`Треба зробити станом на 2 березня 2026 р.: 2` became `…: 1`. With the server stopped and the page reloaded:
`Список не завантажився (немає з’єднання)`. After a restart and a reload the page shows the same as after the
change; `curl -sS http://127.0.0.1:4311/v1/records/t-01` → `{…,"done":true,…}`. `/tests.html` — the user-action
tests on the fixture API: `Пройшли: 13 · не пройшли: 0`.

```text
$ npm test        (server/)
ℹ tests 63
ℹ pass 63
ℹ fail 0
```

Native companion (`~/js-course/planner-native`): `shared/contract.ts` copied unchanged, `apiBaseUrl(TARGET)`
in `src/devConfig.ts`; `npx tsc --noEmit` and `npm test` pass on the computer. On the target: **not
performed** — no emulator, simulator or phone here (EVIDENCE.md of the native project, section NO-06).

## NO-12 — local production mode

Node.js v25.2.1 (npm 11.6.2) and v22.13.1 (npm 10.9.2), macOS. The whole rehearsal of `server/RUNBOOK.md`, on a
fresh `~/js-course/planner-data`; this rehearsal ran on ports 7391/7394; yours are 4311/4312 (the commands below
say 4311/4312). The fixed day of the backup, the restore drill and `check:deploy` is 2026-03-02. Below the run on
25.2.1 (on 22.13.1 the same lines, other counts and times, and an artifact of 39203 bytes instead of 39191: the
same commit packed by another Node and npm gives other bytes — an artifact is kept, never rebuilt).

```text
$ npm run ci
▶ typecheck: npx tsc -p .
▶ test: node --test tests/*.test.ts
▶ artifact: node scripts/pack.mjs
release/: js-learning-lab-planner-server 1.0.0, 36 files (data/tasks.json, domain/tasks.ts, shared/contract.ts, data/model.ts, data/synthetic.js from the web project)
✔ artifacts/js-learning-lab-planner-server-1.0.0.tgz (39191 bytes, commit 73771fc, ci passed)
  sha256 30c3c1cd4a52b6f62ab490a66f9e13a54a2013390915ccca6c6ec805756d1660
✔ CI passed.
$ shasum -a 256 artifacts/js-learning-lab-planner-server-1.0.0.tgz
30c3c1cd4a52b6f62ab490a66f9e13a54a2013390915ccca6c6ec805756d1660  artifacts/js-learning-lab-planner-server-1.0.0.tgz
$ (cd ~/js-course/planner-run/1.0.0/package && PORT=99999 SHUTDOWN_DEADLINE_MS=5 node server/src/server.js); echo "exit $?"
PORT must be a whole number from 1 to 65535, got "99999"
SHUTDOWN_DEADLINE_MS must be a whole number from 100 to 30000, got "5"
exit 1
$ cd ~/js-course/planner-run/1.0.0/package && NODE_ENV=production PORT=4311 DATA_DIR=$HOME/js-course/planner-data node server/src/server.js
Created the data file with the starting tasks: ~/js-course/planner-data/planner.json
js-learning-lab-planner-server 1.0.0 (pid …, NODE_ENV=production) listening on http://127.0.0.1:4311
$ curl -sS http://127.0.0.1:4311/livez; curl -sS http://127.0.0.1:4311/readyz
{"status":"alive"}{"status":"ready"}
$ npm run -s load -- http://127.0.0.1:4311 3
answered {"200":4023,"201":446}, refused 0, broken 0; created (201) 446; p50 1.2 ms, p95 7.3 ms
$ curl -sS http://127.0.0.1:4311/metrics | grep 'route="/v1/records"'
http_requests_total{route="/v1/records",status="200"} 4023
http_requests_total{route="/v1/records",status="201"} 446
http_errors_total{route="/v1/records"} 0
http_request_duration_ms{route="/v1/records",quantile="0.5"} 0.7
http_request_duration_ms{route="/v1/records",quantile="0.95"} 6.4
http_request_duration_ms{route="/v1/records",quantile="0.99"} 8.6
http_request_duration_ms_count{route="/v1/records"} 4469
```

SIGTERM under load: a second `npm run -s load -- http://127.0.0.1:4311 4` and, 1.5 s into it, `kill -TERM <pid>`.
The server: `SIGTERM received: closing the server, waiting at most 5000 ms for the requests in flight…`,
`Server closed. Bye.`, exit code 0. The load: `answered {"200":1492,"201":165}, refused 104, broken 0; created
(201) 165` — refused: new connections after the signal (no answer was lost: every 201 is on disk). On disk:
617 tasks = 6 starting + 446 + 165. (On 22.13.1: 608 = 6 + 457 + 145, refused 104, broken 0.)

```text
$ DATA_DIR=$HOME/js-course/planner-data TODAY=2026-03-02 npm run -s backup
Backup: backups/planner.2026-10-04T23-18-03-044Z.json — 617 tasks, 613 pending due on or before 2026-03-02, sha256 62aec9137d70…
Verified by a restore into a scratch folder: 617 tasks, the same sha256, ids and pending-due count for 2026-03-02.
$ DATA_DIR=$HOME/js-course/planner-data TODAY=2026-03-02 npm run -s restore-drill -- $HOME/js-course/planner-drill
Restored backups/planner.2026-10-04T23-18-03-044Z.json into ~/js-course/planner-drill
live:     617 tasks, pending 615, due on or before 2026-03-02 613, ids 1335193a5542
restored: 617 tasks, pending 615, due on or before 2026-03-02 613, ids 1335193a5542
✔ the restored store answers the same as the live one
```

The same artifact on the live folder (4311) and on the drill folder (`PORT=4312`):
`npm run -s check:deploy -- <url> 2026-03-02` of both — every line `✔`, both
`summary: 617 tasks, pending 615, due on or before 2026-03-02 613`.

A CPU profile under load (`node --cpu-prof --cpu-prof-dir=… server/src/server.js`, 3 s of load, SIGTERM;
local only — never on a server people use):

```text
$ npm run -s profile:top -- profiles/*.cpuprofile
  1425.9 ms  writeSync node:fs:882
   386.4 ms  parseStore src/contract.js:103
   303.8 ms  decode node:internal/encoding:440
   132.4 ms  checkRecords src/contract.js:31
   100.4 ms  (anonymous) src/contract.js:37
```

The biggest: the log line written synchronously for every request (`writeSync`; on 22.13.1 it shows as
`writeBuffer`), then reading the store — every request parses and checks the whole data file (`parseStore`,
`checkRecords`). The load lists by the default sort (`dueDate`, plain text comparison), so no comparator is
in the top five. Nothing was changed for it: p95 stayed under 10 ms here. The slowest list query is
`?sort=title` (`localeCompare` with the Ukrainian locale): the latency test in `tests/ops.test.ts` guards it on
20,000 tasks (measured p95 63.9, 68.0, 64.1 ms on 25.2.1 and 52.1, 50.6, 49.1 ms on 22.13.1; budget 300 ms).

The rollback rehearsal: on a branch, 1.1.0 with a defect in `src/list.ts` (the priority order inverted:
low first). `npm run ci` → `✖ ?sort takes title, dueDate and priority, each across cursor pages with the id for
ties; …` and `✖ CI stopped at "test" (exit code 1). No artifact was produced.` — the guard works. Packed by hand
to rehearse the incident: `npm run -s pack` → `✔ artifacts/js-learning-lab-planner-server-1.1.0.tgz (39190
bytes, commit b628991, ci skipped)`. Deployed (1.0.0 stopped, 1.1.0 started on the same data):

```text
$ npm run -s check:deploy -- http://127.0.0.1:4311 2026-03-02
✔ GET /readyz answers 200
✔ every page of /v1/records keeps the v1 contract (896 tasks)
✔ ?done=false answers only pending tasks
✔ ?done=true answers only done tasks
✔ the two filters together are the whole list
✖ ?sort=priority goes high, normal, low — out of order: t-01, t-02
summary: 896 tasks, pending 894, due on or before 2026-03-02 892
```

Runbook section 7: data check — `schemaVersion 2`, which 1.0.0 knows: no restore. `kill -TERM` 1.1.0 (exit 0);
`shasum -a 256` of the 1.0.0 artifact equals its record; 1.0.0 started from its folder: `/readyz` →
`{"status":"ready"}`, `check:deploy` — every line `✔`. The branch was deleted; both artifacts stay in `artifacts/`.

```text
$ npm test        (server/)
ℹ tests 72
ℹ pass 72
ℹ fail 0
```
