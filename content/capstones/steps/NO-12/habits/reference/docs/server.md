# The server part: evidence

What was run in `server/` for each step of the Node.js stage, with the output seen. A step that was
not run says so, with the reason and what it takes to come back.

## NO-01 — the typed summary script

Node.js v25.2.1, npm 11.6.2, TypeScript 7.0.2, @types/node 22.20.5 (macOS). Not run on Node.js 22: on
22.13–22.17 the command is `node --experimental-strip-types src/summary.ts`.

`TODAY=2026-03-02 LOCALE=en npm run summary`:

```text
Active habits as of 2026-03-02: 5
- %%fixture1Name%%: completions 3, streak 3
- %%fixture2Name%%: completions 3, streak 2
- %%fixture3Name%%: completions 1, streak 1
- %%fixture4Name%%: completions 2, streak 1
- %%fixture6Name%%: completions 0, streak 0
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
Created the data file with the starting habits: ~/js-course/habits/server/data/habits.json
Active habits as of 2026-03-02: 5
- %%fixture1Name%%: completions 3, streak 3
- %%fixture2Name%%: completions 3, streak 2
- %%fixture3Name%%: completions 1, streak 1
- %%fixture4Name%%: completions 2, streak 1
- %%fixture6Name%%: completions 0, streak 0
$ CRASH_BEFORE_RENAME=1 node src/complete-habit.ts h-03; echo "exit $?"
exit 137
$ ls data
habits.json
habits.json.2eeedd2e-a351-4d29-a5f9-6f6c832828dc.tmp
$ npm run summary
Removed a temp file left by a crash: habits.json.2eeedd2e-a351-4d29-a5f9-6f6c832828dc.tmp
Active habits as of 2026-03-02: 5
- %%fixture1Name%%: completions 3, streak 3
- %%fixture2Name%%: completions 3, streak 2
- %%fixture3Name%%: completions 1, streak 1
- %%fixture4Name%%: completions 2, streak 1
- %%fixture6Name%%: completions 0, streak 0
$ node src/complete-habit.ts h-03
Saved: h-03 completed on 2026-03-02
$ npm run summary
Active habits as of 2026-03-02: 5
- %%fixture1Name%%: completions 3, streak 3
- %%fixture2Name%%: completions 3, streak 2
- %%fixture3Name%%: completions 2, streak 2
- %%fixture4Name%%: completions 2, streak 1
- %%fixture6Name%%: completions 0, streak 0
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
content-length: 663
Date: Sun, 04 Oct 2026 14:54:16 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":"h-01","name":"%%fixture1Name%%","frequency":"daily","active":true,"completions":["2026-02-27","2026-02-28","2026-03-01"]},{"id":"h-02","name":"Read for …
$ curl -i http://127.0.0.1:4311/nothing-here
HTTP/1.1 404 Not Found
content-type: application/json; charset=utf-8
content-length: 21
Date: Sun, 04 Oct 2026 14:54:16 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"not found"}
$ curl -i -X DELETE http://127.0.0.1:4311/records
HTTP/1.1 405 Method Not Allowed
allow: GET
content-type: application/json; charset=utf-8
content-length: 30
Date: Sun, 04 Oct 2026 14:54:16 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"method not allowed"}
$ npm start   (a second copy, in another terminal)
Error: listen EADDRINUSE: address already in use 127.0.0.1:4311
  code: 'EADDRINUSE',
--- the server terminal after Ctrl+C:
> js-learning-lab-habits-server@0.1.0 start
> node src/server.ts
Created the data file with the starting habits: ~/js-course/habits/server/data/habits.json
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
GET /records → 200
GET /nothing-here → 404
DELETE /records → 405
SIGINT received: closing the server…
Server closed. Bye.
$ curl -sS http://127.0.0.1:4311/records
curl: (7) Failed to connect to 127.0.0.1 port 4311: Couldn't connect to server
$ npm run -s complete -- h-03
Saved: h-03 completed on 2026-03-02
$ curl -sS http://127.0.0.1:4311/records   (after the restart)
[{"id":"h-01","name":"%%fixture1Name%%","frequency":"daily","active":true,"completions":["2026-02-27","2026-02-28","2026-03-01"]},{"id":"h-02","name":"%%fixture2Name%%","frequency":"daily","active":true,"completions":…
$ npm run check:server
✔ GET /records → 200, JSON, the stored habits
✔ GET /records?view=all → 200 (routing by pathname)
✔ GET /nothing-here → 404, JSON
✔ DELETE /records → 405 with Allow: GET, JSON
✔ Ctrl+C (SIGINT) closes the server and the process ends with code 0
✔ after a restart GET /records answers the same habits
6 of 6 checks passed
```

## NO-04 — the /v1 records API

Node.js v25.2.1, curl 8.7.1 (macOS). The server was started with `npm start` in one terminal (fresh
`server/data/`), `node try-api.mjs` ran in another, then Ctrl+C. Request ids and the idempotency key are
random and shortened to `…` here. The idempotency keys live in the server's memory: a restart forgets them.

```text
$ node try-api.mjs
== 1. POST /v1/records (Idempotency-Key: …)
{"id":"h-07","name":"%%fixture1Name%% 2","frequency":"weekly","active":true,"completions":[]} → 201
== 2. the same POST retried with the same key
{"id":"h-07","name":"%%fixture1Name%% 2","frequency":"weekly","active":true,"completions":[]} → 201
== 3. PATCH /v1/records/h-01 with invalid fields
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required","completions":"not-unique-ascending"},"requestId":"…"}} → 400
== 4. GET /v1/records?sort=name&limit=3
{"items":[{"id":"h-07","name":"%%fixture1Name%% 2","frequency":"weekly","active":true,"completions":[]},{"id":"h-03","name":"%%fixture3Name%%","frequency":"daily","active":true,"completions":["2026-03-01"]},{"id":"h-06","name":"%%fixture6Name%%","frequency":"daily","active":true,"completions":[]}],"nextCursor":"h-06"}
== 5. GET /v1/records?sort=name&limit=3&cursor=h-06
{"items":[{"id":"h-05","name":"%%fixture5Name%%","frequency":"daily","active":false,"completions":["2026-02-20"]},{"id":"h-01","name":"%%fixture1Name%%","frequency":"daily","active":true,"completions":["2026-02-27","2026-02-28","2026-03-01"]},{"id":"h-02","name":"%%fixture2Name%%","frequency":"daily","active":true,"completions":["2026-02-26","2026-02-28","2026-03-01"]}],"nextCursor":"h-02"} → 200
== 6. POST /v1/records/h-03/completions twice with the same day
{"id":"h-03","name":"%%fixture3Name%%","frequency":"daily","active":true,"completions":["2026-03-01","2026-03-02"]} → 200
{"id":"h-03","name":"%%fixture3Name%%","frequency":"daily","active":true,"completions":["2026-03-01","2026-03-02"]} → 200
--- the server terminal:
Created the data file with the starting habits: ~/js-course/habits/server/data/habits.json
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
POST /v1/records → 201
POST /v1/records → 201
PATCH /v1/records/h-01 → 400
GET /v1/records?sort=name&limit=3 → 200
GET /v1/records?sort=name&limit=3&cursor=h-06 → 200
POST /v1/records/h-03/completions → 200
POST /v1/records/h-03/completions → 200
SIGINT received: closing the server…
Server closed. Bye.
$ node -e "…" (the records in the data file)
1 7 h-01 h-02 h-03 h-04 h-05 h-06 h-07
$ npm test
ℹ tests 14
ℹ pass 13
ℹ fail 1
```

## NO-05 — a durable store

Measured on the data file of a fresh NO-04 run; in the course chain the numbers differ by the records earlier steps changed.

A JSON file, not SQLite: the store is small and written by one server process, and Node.js 22.13 (the
course minimum) has no `sqlite.backup()` (it arrived in 22.16). Node.js v25.2.1 (macOS); the same
commands on Node.js v22.13.1 with `NODE_OPTIONS=--experimental-strip-types` printed the same lines plus
an `ExperimentalWarning` about type stripping per process, and `npm test` reported in TAP (`# pass`)
when its output went to a file. Time stamps are shortened to `<stamp>`, request ids and keys to `…`.
The server was stopped with Ctrl+C after every start. Every npm command ran with TODAY=2026-03-01.

```text
$ node -e "…" (the version, the count and the ids in the NO-04 data file)
1 7 h-01 h-02 h-03 h-04 h-05 h-06 h-07
$ npm start   (a version 1 store, before the migration)
Cannot start: habits.json is schemaVersion 1: run "npm run migrate" first
$ node -e "…" (one record in the old v1 shape)
{"id":"h-01","name":"%%fixture1Name%%","active":true,"completions":["2026-03-01","2026-02-28","2026-02-27","2026-03-01","2026-02-28","2026-02-27"]}
$ npm run migrate
Dry run on 2026-03-01: 7 habits, the same ids, 11 completion days and streaks h-01:3,h-02:2,h-03:1,h-04:1,h-05:0,h-06:0,h-07:0; a second run changes nothing.
Migrated habits.json to schemaVersion 2: 7 habits, completions unique and in date order.
$ node -e "…" (the record h-01 after the migration)
{"id":"h-01","name":"%%fixture1Name%%","frequency":"daily","active":true,"completions":["2026-02-27","2026-02-28","2026-03-01"]}
$ npm run migrate   (again)
habits.json is already schemaVersion 2: nothing to migrate.
$ npm run backup
Backup: backups/habits.<stamp>.json — 7 habits, 11 completion days, streaks on 2026-03-01 h-01:3,h-02:2,h-03:1,h-04:1,h-05:0,h-06:0,h-07:0, sha256 …
Verified by a restore into a scratch folder: 7 habits, the same sha256, ids, completion days and streaks.
$ npm start + node try-api.mjs
== 1. POST /v1/records (Idempotency-Key: …)
{"id":"h-08","name":"%%fixture1Name%% 2","frequency":"weekly","active":true,"completions":[]} → 201
== 2. the same POST retried with the same key
{"id":"h-08","name":"%%fixture1Name%% 2","frequency":"weekly","active":true,"completions":[]} → 201
== 3. PATCH /v1/records/h-01 with invalid fields
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required","completions":"not-unique-ascending"},"requestId":"…"}} → 400
== 4. GET /v1/records?sort=name&limit=3
{"items":[{"id":"h-05","name":"%%fixture5Name%%","frequency":"daily","active":false,"completions":["2026-02-20"]},{"id":"h-03","name":"%%fixture3Name%%","frequency":"daily","active":true,"completions":["2026-03-01","2026-03-02"]},{"id":"h-04","name":"%%fixture4Name%%","frequency":"weekly","active":true,"completions":["2026-02-22","2026-03-01"]}],"nextCursor":"h-04"}
== 5. GET /v1/records?sort=name&limit=3&cursor=h-04
{"items":[{"id":"h-06","name":"%%fixture6Name%%","frequency":"daily","active":true,"completions":[]},{"id":"h-01","name":"%%fixture1Name%%","frequency":"daily","active":true,"completions":["2026-02-27","2026-02-28","2026-03-01"]},{"id":"h-07","name":"%%fixture1Name%% 2","frequency":"weekly","active":true,"completions":[]}],"nextCursor":"h-07"} → 200
== 6. POST /v1/records/h-03/completions twice with the same day
{"id":"h-03","name":"%%fixture3Name%%","frequency":"daily","active":true,"completions":["2026-03-01","2026-03-02"]} → 200
{"id":"h-03","name":"%%fixture3Name%%","frequency":"daily","active":true,"completions":["2026-03-01","2026-03-02"]} → 200
--- the server terminal:
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
POST /v1/records → 201
POST /v1/records → 201
PATCH /v1/records/h-01 → 400
GET /v1/records?sort=name&limit=3 → 200
GET /v1/records?sort=name&limit=3&cursor=h-04 → 200
POST /v1/records/h-03/completions → 200
POST /v1/records/h-03/completions → 200
SIGINT received: closing the server…
Server closed. Bye.
$ damage (one field of the first record broken) and npm start
The store was damaged: moved aside as habits.json.corrupt-<stamp>, restored 7 habits from habits.<stamp>.json
Not in the backup: h-08
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
SIGINT received: closing the server…
Server closed. Bye.
$ ls data
backups
habits.json
habits.json.corrupt-<stamp>
$ mv data/backups data/backups-aside; damage again; npm start; echo "exit $?"
Cannot start: habits.json is damaged and there is no verified backup in ~/js-course/habits/server/data/backups: refusing to start
exit 1
$ mv data/backups-aside data/backups; npm start
The store was damaged: moved aside as habits.json.corrupt-<stamp>, restored 7 habits from habits.<stamp>.json
Not in the backup: none
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
SIGINT received: closing the server…
Server closed. Bye.
$ npm test
ℹ tests 29
ℹ pass 29
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
$ curl -sS http://127.0.0.1:4311/v1/records -H "content-type: application/json" -d '{"name":"   ","frequency":"щомісяця","completions":["2026-02-30","2026-02-30"]}'
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required","frequency":"unknown","completions":"bad-date"},"requestId":"…"}}
$ curl -sS http://127.0.0.1:4311/v1/records -H "content-type: application/json" -d '{"__proto__":{"isAdmin":true}}'
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required","__proto__":"unknown-field"},"requestId":"…"}}
$ curl -sS -i -H "x-request-id: support-ticket-0042" http://127.0.0.1:4311/v1/records/h-05
HTTP/1.1 200 OK
x-request-id: support-ticket-0042
Connection: keep-alive
{"id":"h-05","name":"%%fixture5Name%%","frequency":"daily","active":false,"completions":["2026-02-20"]}
--- the server terminal:
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
{"time":"…","level":"info","requestId":"…","method":"GET","route":"/v1/records","status":200,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":413,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"GET","route":"/v1/records/..%2Fpackage.json","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"GET","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"info","requestId":"support-ticket-0042","method":"GET","route":"/v1/records/h-05","status":200,"durationMs":…}
SIGINT received: closing the server…
Server closed. Bye.
$ npm test
ℹ tests 44
ℹ pass 44
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
{"id":"h-101","name":"%%fixture1Name%% 0","frequency":"daily","active":false,"completions":["2023-01-01","2023-01-02","2023-01-03","2023-01-04","2023-01-05","2023-01-06","2023-01-07","2023-01-08","2023-01-09","2023-01-10","2023-01-11","2023-01-12","2023-01-13","2023-01-14","2023-01-15","2023-01-16","2023-01-17","2023-01-18","2023-01-19","2023-01-20","2023-01-21","2023-01-22","2023-01-23","2023-01-24","2023-01-25","2023-01-26","2023-01-27","2023-01-28","2023-01-29","2023-01-30"]}
{"id":"h-102","name":"%%fixture2Name%% 1","frequency":"daily","active":true,"completions":["2023-01-01","2023-01-03","2023-01-05","2023-01-07","2023-01-09","2023-01-11","2023-01-13","2023-01-15","2023-01-17","2023-01-19","2023-01-21","2023-01-23","2023-01-25","2023-01-27","2023-01-29"]}
$ npm run -s import -- data/import.jsonl
Imported 10000 lines in … ms: 10000 new habits, 0 updated; the store holds 10006 habits with 183355 completions.
$ npm run -s import -- data/import.jsonl   (again)
Imported 10000 lines in … ms: 0 new habits, 10000 updated; the store holds 10006 habits with 183355 completions.
$ npm run -s export -- data/export.jsonl
Exported 10006 habits to data/export.jsonl
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
{"id":"h-01","name":"%%fixture1Name%%","frequency":"daily","active":true,"completions":["2026-02-27","2026-02-28","2026-03-01"]}
{"id":"h-02","name":"%%fixture2Name%%","frequency":"daily","active":true,"completions":["2026-02-30"]}
{"id":"h-03","name":"Пити"
{"id":"../h-04","name":"%%fixture4Name%%","frequency":"weekly","active":true,"completions":[]}
$ curl -sS http://127.0.0.1:4311/v1/import -H "content-type: application/x-ndjson" --data-binary @data/bad.jsonl
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"line 2":"completions: bad-date","line 3":"not-json","line 4":"id: malformed"},"requestId":"…"}}
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
ℹ tests 57
ℹ pass 57
ℹ fail 0
$ npm run check
8 of 8 checks passed
$ npm run check:server
6 of 6 checks passed
$ npm run typecheck
exit 0
```

## NO-06 — the web client on the real API

Node.js v25.2.1 and v22.13.1 (the server with `NODE_OPTIONS=--experimental-strip-types`), the Ukrainian workspace (the page text below is Ukrainian). `.env` of the web
project: `PORT=4310`, `DATA_SOURCE=http`, `API_BASE_URL=http://127.0.0.1:4311`. For the curl check below the
server was started with `PORT=7392 node src/server.ts` in `server/` on a fresh `server/data/`; the default port
is 4311.

The marked day is the narrow request of the habit tracker: `markDay` sends only the day,
`POST /v1/records/:id/completions {"day":"YYYY-MM-DD"}`, and its preflight is a POST with `content-type`. A
save of the form sends PATCH, not PUT: the form has name, frequency and active, and a PUT without
`completions` replaces the habit with an empty history (`PUT /v1/records/h-01` with those three fields
answered `"completions":[]`; the same body as PATCH kept every day).

```text
$ curl -sS -i -X OPTIONS http://127.0.0.1:7392/v1/records/h-01/completions -H "Origin: http://127.0.0.1:4310" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type"
HTTP/1.1 204 No Content
x-request-id: …
vary: Origin
access-control-allow-origin: http://127.0.0.1:4310
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE
access-control-allow-headers: content-type, idempotency-key
$ curl -sS -i -X OPTIONS http://127.0.0.1:7392/v1/records/h-01 -H "Origin: http://127.0.0.1:4310" -H "Access-Control-Request-Method: PATCH" -H "Access-Control-Request-Headers: content-type"
HTTP/1.1 204 No Content
x-request-id: …
vary: Origin
access-control-allow-origin: http://127.0.0.1:4310
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE
access-control-allow-headers: content-type, idempotency-key
$ curl -sS -i -X OPTIONS http://127.0.0.1:7392/v1/records/h-01 -H "Origin: http://localhost:4310" -H "Access-Control-Request-Method: PATCH"
HTTP/1.1 204 No Content
x-request-id: …
vary: Origin
```

In Chrome 154, http://127.0.0.1:4310/: "Позначити сьогодні: %%fixture3Name%%" — the server log shows
`OPTIONS /v1/records/h-03/completions 204` then `POST /v1/records/h-03/completions 200` and the lists read
again; the card now says `Востаннє виконано: 2 березня 2026 р.` and `Сьогодні виконано`. With the server
stopped and the page reloaded: `Список не завантажився (немає з’єднання)`. After a restart and a reload the page
shows the same as after the change; `curl -sS http://127.0.0.1:4311/v1/records/h-03` →
`{…,"completions":["2026-03-01","2026-03-02"]}`. `/tests.html` — the user-action tests on the fixture API:
`Пройшли: 13 · не пройшли: 0`.

```text
$ npm test        (server/)
ℹ tests 69
ℹ pass 69
ℹ fail 0
$ npm test        (the web project)
Пройшли: 38 · не пройшли: 0
```

Native companion (`~/js-course/habits-native`): `shared/contract.ts` copied unchanged, `apiBaseUrl(TARGET)`
in `src/devConfig.ts`; `npx tsc --noEmit` and `npm test` pass on the computer. On the target: **not
performed** — no emulator, simulator or phone here (EVIDENCE.md of the native project, section NO-06).

## NO-12 — local production mode

Node.js v25.2.1 (npm 11.6.2) and v22.13.1 (npm 10.9.2), macOS. The whole rehearsal of `server/RUNBOOK.md`, on a
fresh `~/js-course/habits-data`, with the fixed day 2026-03-01 for every streak; below the run on 25.2.1 (on
22.13.1 the same lines, other counts and times, and an artifact of 41531 bytes instead of 41544: the same commit
packed by another Node and npm gives other bytes — an artifact is kept, never rebuilt). This rehearsal ran on
ports 7392/7395; yours are 4311/4312.

```text
$ npm run ci
▶ typecheck: npx tsc -p .
▶ test: node --test tests/*.test.ts
▶ artifact: node scripts/pack.mjs
release/: js-learning-lab-habits-server 1.0.0, 37 files (data/habits.json, domain/habits.ts, shared/contract.ts, data/model.ts, ui/streak.ts, data/synthetic.js from the web project)
✔ artifacts/js-learning-lab-habits-server-1.0.0.tgz (41544 bytes, commit 10647f2, ci passed)
  sha256 89dec4fe46777734d33fad89074d2795a0386eb711396eac5c9fce7c2d374826
✔ CI passed.
$ shasum -a 256 artifacts/js-learning-lab-habits-server-1.0.0.tgz
89dec4fe46777734d33fad89074d2795a0386eb711396eac5c9fce7c2d374826  artifacts/js-learning-lab-habits-server-1.0.0.tgz
$ (cd ~/js-course/habits-run/1.0.0/package && PORT=99999 SHUTDOWN_DEADLINE_MS=5 node server/src/server.js); echo "exit $?"
PORT must be a whole number from 1 to 65535, got "99999"
SHUTDOWN_DEADLINE_MS must be a whole number from 100 to 30000, got "5"
exit 1
$ cd ~/js-course/habits-run/1.0.0/package && NODE_ENV=production PORT=7392 DATA_DIR=$HOME/js-course/habits-data node server/src/server.js
js-learning-lab-habits-server 1.0.0 (pid …, NODE_ENV=production) listening on http://127.0.0.1:7392
$ curl -sS http://127.0.0.1:7392/livez; curl -sS http://127.0.0.1:7392/readyz
{"status":"alive"}{"status":"ready"}
$ npm run -s load -- http://127.0.0.1:7392 3
answered {"200":2349,"201":260}, refused 0, broken 0; created (201) 260, completions (200) 261; p50 1.1 ms, p95 17.5 ms
$ curl -sS http://127.0.0.1:7392/metrics | grep -E 'route="/v1/records(/:id/completions)?"|^habit_'
habit_completions_recorded_total 259
http_requests_total{route="/v1/records",status="200"} 2088
http_requests_total{route="/v1/records/:id/completions",status="200"} 261
http_requests_total{route="/v1/records",status="201"} 260
http_errors_total{route="/v1/records"} 0
http_errors_total{route="/v1/records/:id/completions"} 0
http_request_duration_ms{route="/v1/records",quantile="0.5"} 0.4
http_request_duration_ms{route="/v1/records",quantile="0.95"} 14.9
http_request_duration_ms{route="/v1/records",quantile="0.99"} 18.1
http_request_duration_ms_count{route="/v1/records"} 2348
http_request_duration_ms{route="/v1/records/:id/completions",quantile="0.5"} 14.6
http_request_duration_ms{route="/v1/records/:id/completions",quantile="0.95"} 19.6
http_request_duration_ms{route="/v1/records/:id/completions",quantile="0.99"} 23.6
http_request_duration_ms_count{route="/v1/records/:id/completions"} 261
```

261 "done" requests answered 200, but `habit_completions_recorded_total` is 259: the load's first two days were
2026-03-01 for h-01 and 2026-02-28 for h-02, days the starting habits already had — answered, nothing added,
not counted.

SIGTERM under load: a second `npm run -s load -- http://127.0.0.1:7392 4` and, 1.5 s into it, `kill -TERM <pid>`.
The server: `SIGTERM received: closing the server, waiting at most 5000 ms for the requests in flight…`,
`Server closed. Bye.` (the drained path, exit code 0). The load: `answered {"200":891,"201":99}, refused 104,
broken 0; created (201) 99, completions (200) 99` — refused: new connections after the signal. The second load
sent the same days again, so it added no completion day. On disk: 365 habits = 6 starting + 260 + 99 — every
confirmed 201 is there (on 22.13.1: 373 = 6 + 264 + 103, with 2 broken keep-alive connections cut between two
requests).

```text
$ TODAY=2026-03-01 DATA_DIR=$HOME/js-course/habits-data npm run -s backup
Backup: backups/habits.2026-10-04T23-16-16-713Z.json — 365 habits, 269 completion days, streaks on 2026-03-01 h-01:3,h-02:2,h-03:1,h-04:1,h-05:0,h-06:0,h-07:0,…
Verified by a restore into a scratch folder: 365 habits, the same sha256, ids, completion days and streaks.
$ TODAY=2026-03-01 DATA_DIR=$HOME/js-course/habits-data npm run -s restore-drill -- $HOME/js-course/habits-drill
Restored backups/habits.2026-10-04T23-16-16-713Z.json into ~/js-course/habits-drill
live:     365 habits, 269 completion days, streaks on 2026-03-01 0596968f22a8, ids e3188864e429
restored: 365 habits, 269 completion days, streaks on 2026-03-01 0596968f22a8, ids e3188864e429
✔ the restored store answers the same as the live one
```

269 completion days = 10 starting + 259 recorded — the number the metric showed. The same artifact on the live
folder (7392) and on the drill folder (7395): `npm run -s check:deploy -- <address> 2026-03-01` of both — every
line `✔`, both `summary: 365 habits, 269 completion days; streaks on 2026-03-01: sum 7, longest 3, 0596968f22a8`
(the same streak fingerprint as the drill's).

A CPU profile under load (`node --cpu-prof --cpu-prof-dir=… server/src/server.js`, 3 s of load, SIGTERM;
local only — never on a server people use):

```text
$ npm run -s profile:top -- profiles/*.cpuprofile
  1475.3 ms  writeSync node:fs:882
   516.7 ms  byName src/list.js:12
   127.9 ms  parseStore src/contract.js:99
   127.0 ms  decode node:internal/encoding:440
    51.3 ms  checkRecords src/contract.js:32
```

The two biggest: the log line written synchronously for every request (`writeSync`), and `byName` of
`GET /v1/records` (`localeCompare` with the Ukrainian locale) — every list request sorts every habit. Nothing
was changed for it: p95 stayed under 20 ms here; the latency test in `tests/ops.test.ts` guards 20,000 habits
with a month of completions each (measured p95 89–94 ms on this computer on 25.2.1, 87–94 ms on 22.13.1;
budget 400 ms).

The rollback rehearsal: on a branch, 1.1.0 with a defect in `src/list.ts` (the `active` filter inverted).
`npm run ci` → `✖ CI stopped at "test" (exit code 1). No artifact was produced.` — the guard works. Packed by
hand to rehearse the incident: `npm run -s pack` → `✔ artifacts/js-learning-lab-habits-server-1.1.0.tgz
(41547 bytes, commit 1b80137, ci skipped)`. Deployed (1.0.0 stopped, 1.1.0 started on the same data):

```text
$ npm run -s check:deploy -- http://127.0.0.1:7392 2026-03-01
✔ GET /readyz answers 200
✔ every page of /v1/records keeps the v1 contract (548 habits)
✖ ?active=true answers only active habits — h-05
✖ ?active=false answers only paused habits — h-03, h-04, h-06, h-01, h-02 and 542 more
✔ the two filters together are the whole list
✔ ?sort=name goes by the name in the Ukrainian order, equal names by id
summary: 548 habits, 269 completion days; streaks on 2026-03-01: sum 7, longest 3, e7865b95fc70
```

Runbook section 7: data check — `schemaVersion 2`, which 1.0.0 knows: no restore. `kill -TERM` 1.1.0;
`shasum -a 256` of the 1.0.0 artifact equals its record; 1.0.0 started from its folder: `/readyz` →
`{"status":"ready"}`, `check:deploy` — every line `✔`. The branch was deleted; both artifacts stay in `artifacts/`.

```text
$ npm test        (server/)
ℹ tests 79
ℹ pass 79
ℹ fail 0
```
