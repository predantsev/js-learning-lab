# The server part: evidence

What was run in `server/` for each step of the Node.js stage, with the output seen. A step that was
not run says so, with the reason and what it takes to come back.

## NO-01 — the typed summary script

Node.js v25.2.1, npm 11.6.2, TypeScript 7.0.2, @types/node 22.20.5 (macOS). Not run on Node.js 22: on
22.13–22.17 the command is `node --experimental-strip-types src/summary.ts`.

`LOCALE=en npm run summary`:

```text
Food: UAH 1,056.00
Transport: UAH 520.00
Home: UAH 99.90
Fun: UAH 480.00
Total: UAH 2,155.90
```

`LOCALE=ua node src/summary.ts; echo "exit $?"` (an invalid value):

```text
LOCALE must be uk or en, got "ua"
exit 1
```

`npm run typecheck` (`tsc -p .`): no output, exit code 0.

## NO-02 — the file repository and the crash rehearsal

Node.js v25.2.1 (macOS). The data file `server/data/` is not in Git (`.gitignore`). The crash is
`CRASH_BEFORE_RENAME=1`: the process kills itself with SIGKILL after the temp file was written and
flushed, before the rename. `npm run check` repeats these checks in `server/.check/`.

```text
$ npm run summary
Created the data file with the starting expenses: ~/js-course/expenses/server/data/expenses.json
Food: UAH 1,056.00
Transport: UAH 520.00
Home: UAH 99.90
Fun: UAH 480.00
Total: UAH 2,155.90
$ CRASH_BEFORE_RENAME=1 node src/add-expense.ts Кава 6500 food 2026-03-02; echo "exit $?"
exit 137
$ ls data
expenses.json
expenses.json.9e901185-02c7-496f-ad32-83516e06718e.tmp
$ npm run summary
Removed a temp file left by a crash: expenses.json.9e901185-02c7-496f-ad32-83516e06718e.tmp
Food: UAH 1,056.00
Transport: UAH 520.00
Home: UAH 99.90
Fun: UAH 480.00
Total: UAH 2,155.90
$ node src/add-expense.ts Кава 6500 food 2026-03-02
Saved: e-07, 6500 kopiykas, food
$ npm run summary
Food: UAH 1,121.00
Transport: UAH 520.00
Home: UAH 99.90
Fun: UAH 480.00
Total: UAH 2,220.90
$ npm run check
8 of 8 checks passed
```

## NO-03 — the records server

Node.js v25.2.1, curl 8.7.1 (macOS). `npm start` in one terminal, the requests in another; Ctrl+C
sends SIGINT. A change made while the server is stopped is there after the restart.

```text
$ curl -i http://127.0.0.1:4311/records
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
content-length: 578
Date: Sun, 04 Oct 2026 14:54:20 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":"e-01","label":"%%fixture1Name%%","amountMinor":84550,"date":"2026-03-01","category":"food"},{"id":"e-02","label":"%%fixture2Name%%","amountMinor":52000,"dat…
$ curl -i http://127.0.0.1:4311/nothing-here
HTTP/1.1 404 Not Found
content-type: application/json; charset=utf-8
content-length: 21
Date: Sun, 04 Oct 2026 14:54:20 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"not found"}
$ curl -i -X DELETE http://127.0.0.1:4311/records
HTTP/1.1 405 Method Not Allowed
allow: GET
content-type: application/json; charset=utf-8
content-length: 30
Date: Sun, 04 Oct 2026 14:54:20 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"method not allowed"}
$ npm start   (a second copy, in another terminal)
Error: listen EADDRINUSE: address already in use 127.0.0.1:4311
  code: 'EADDRINUSE',
--- the server terminal after Ctrl+C:
> js-learning-lab-expenses-server@0.1.0 start
> node src/server.ts
Created the data file with the starting expenses: ~/js-course/expenses/server/data/expenses.json
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
GET /records → 200
GET /nothing-here → 404
DELETE /records → 405
SIGINT received: closing the server…
Server closed. Bye.
$ curl -sS http://127.0.0.1:4311/records
curl: (7) Failed to connect to 127.0.0.1 port 4311: Couldn't connect to server
$ npm run -s add -- Кава 6500 food 2026-03-02
Saved: e-07, 6500 kopiykas, food
$ curl -sS http://127.0.0.1:4311/records   (after the restart)
[{"id":"e-01","label":"%%fixture1Name%%","amountMinor":84550,"date":"2026-03-01","category":"food"},{"id":"e-02","label":"%%fixture2Name%%","amountMinor":52000,"date":"2026-03-01","category":"transport"},{"id":"e-03","label"…
$ npm run check:server
✔ GET /records → 200, JSON, the stored expenses
✔ GET /records?view=all → 200 (routing by pathname)
✔ GET /nothing-here → 404, JSON
✔ DELETE /records → 405 with Allow: GET, JSON
✔ Ctrl+C (SIGINT) closes the server and the process ends with code 0
✔ after a restart GET /records answers the same expenses
6 of 6 checks passed
```

## NO-04 — the /v1 records API

Node.js v25.2.1, curl 8.7.1 (macOS). The server was started with `npm start` in one terminal (fresh
`server/data/`), `sh try-api` ran in another, then Ctrl+C. Request ids and the idempotency key are
random and shortened to `…` here. The idempotency keys live in the server's memory: a restart forgets them.

```text
$ sh try-api
== 1. POST /v1/records (Idempotency-Key: …)
{"id":"e-07","label":"Продукти на тиждень 2","amountMinor":6500,"date":"2026-03-03","category":"food"} → 201
== 2. the same POST retried with the same key
{"id":"e-07","label":"Продукти на тиждень 2","amountMinor":6500,"date":"2026-03-03","category":"food"} → 201
== 3. PATCH /v1/records/e-01 with invalid fields
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"label":"required","amountMinor":"not-positive-integer"},"requestId":"…"}} → 400
== 4. GET /v1/records?sort=amountMinor&limit=3
{"items":[{"id":"e-07","label":"Продукти на тиждень 2","amountMinor":6500,"date":"2026-03-03","category":"food"},{"id":"e-04","label":"%%fixture4Name%%","amountMinor":9990,"date":"2026-02-27","category":"home"},{"id":"e-03","label":"%%fixture3Name%%","amountMinor":18000,"date":"2026-02-28","category":"fun"}],"nextCursor":"e-03"}
== 5. GET /v1/records?sort=amountMinor&limit=3&cursor=e-03
{"items":[{"id":"e-06","label":"%%fixture6Name%%","amountMinor":21050,"date":"2026-03-02","category":"food"},{"id":"e-05","label":"%%fixture5Name%%","amountMinor":30000,"date":"2026-02-27","category":"fun"},{"id":"e-02","label":"%%fixture2Name%%","amountMinor":52000,"date":"2026-03-01","category":"transport"}],"nextCursor":"e-02"} → 200
--- the server terminal:
Created the data file with the starting expenses: ~/js-course/expenses/server/data/expenses.json
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
POST /v1/records → 201
POST /v1/records → 201
PATCH /v1/records/e-01 → 400
GET /v1/records?sort=amountMinor&limit=3 → 200
GET /v1/records?sort=amountMinor&limit=3&cursor=e-03 → 200
SIGINT received: closing the server…
Server closed. Bye.
$ node -e "…" (the records in the data file)
1 7 e-01 e-02 e-03 e-04 e-05 e-06 e-07
$ npm test
ℹ tests 13
ℹ pass 13
ℹ fail 0
```

## NO-05 — a durable store

A JSON file, not SQLite: the store is small and written by one server process, and Node.js 22.13 (the
course minimum) has no `sqlite.backup()` (it arrived in 22.16). Node.js v25.2.1 (macOS); the same
commands on Node.js v22.13.1 with `NODE_OPTIONS=--experimental-strip-types` printed the same lines plus
an `ExperimentalWarning` about type stripping per process, and `npm test` reported in TAP (`# pass`)
when its output went to a file. Time stamps are shortened to `<stamp>`, request ids and keys to `…`.
The server was stopped with Ctrl+C after every start.

```text
$ node -e "…" (the version, the count and the ids in the NO-04 data file)
1 7 e-01 e-02 e-03 e-04 e-05 e-06 e-07
$ npm start   (a version 1 store, before the migration)
Cannot start: expenses.json is schemaVersion 1: run "npm run migrate" first
$ node -e "…" (one record in the old v1 shape)
{"id":"e-05","label":"%%fixture5Name%%","amountMinor":12.5,"date":"2026-02-27","category":"fun"}
$ npm run migrate
Dry run: 6 kept + 1 quarantined = 7 expenses, the same ids and per-category totals; a second run changes nothing.
Quarantined 1 expense in data/expenses.quarantine.json: e-05 (amountMinor: notPositiveWhole)
Migrated expenses.json to schemaVersion 2: 6 expenses kept, 1 quarantined.
$ cat data/expenses.quarantine.json
{
  "fromSchemaVersion": 1,
  "records": [
    {
      "record": {
        "id": "e-05",
        "label": "%%fixture5Name%%",
        "amountMinor": 12.5,
        "date": "2026-02-27",
        "category": "fun"
      },
      "problems": [
        "amountMinor: notPositiveWhole"
      ]
    }
  ]
}
$ node -e "…" (the record e-05 after the migration)
undefined
$ npm run migrate   (again)
expenses.json is already schemaVersion 2: nothing to migrate.
$ npm run backup
Backup: backups/expenses.<stamp>.json — 6 expenses, by category food:112100,transport:52000,home:9990,fun:18000, sha256 …
Verified by a restore into a scratch folder: 6 expenses, the same sha256, ids and per-category totals.
$ npm start + sh try-api
== 1. POST /v1/records (Idempotency-Key: …)
{"id":"e-08","label":"%%fixture1Name%% 2","amountMinor":6500,"date":"2026-03-03","category":"food"} → 201
== 2. the same POST retried with the same key
{"id":"e-08","label":"%%fixture1Name%% 2","amountMinor":6500,"date":"2026-03-03","category":"food"} → 201
== 3. PATCH /v1/records/e-01 with invalid fields
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"label":"required","amountMinor":"not-positive-integer"},"requestId":"…"}} → 400
== 4. GET /v1/records?sort=amountMinor&limit=3
{"items":[{"id":"e-07","label":"%%fixture1Name%% 2","amountMinor":6500,"date":"2026-03-03","category":"food"},{"id":"e-08","label":"%%fixture1Name%% 2","amountMinor":6500,"date":"2026-03-03","category":"food"},{"id":"e-04","label":"%%fixture4Name%%","amountMinor":9990,"date":"2026-02-27","category":"home"}],"nextCursor":"e-04"}
== 5. GET /v1/records?sort=amountMinor&limit=3&cursor=e-04
{"items":[{"id":"e-03","label":"%%fixture3Name%%","amountMinor":18000,"date":"2026-02-28","category":"fun"},{"id":"e-06","label":"%%fixture6Name%%","amountMinor":21050,"date":"2026-03-02","category":"food"},{"id":"e-02","label":"%%fixture2Name%%","amountMinor":52000,"date":"2026-03-01","category":"transport"}],"nextCursor":"e-02"} → 200
--- the server terminal:
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
POST /v1/records → 201
POST /v1/records → 201
PATCH /v1/records/e-01 → 400
GET /v1/records?sort=amountMinor&limit=3 → 200
GET /v1/records?sort=amountMinor&limit=3&cursor=e-04 → 200
SIGINT received: closing the server…
Server closed. Bye.
$ damage (one field of the first record broken) and npm start
The store was damaged: moved aside as expenses.json.corrupt-<stamp>, restored 6 expenses from expenses.<stamp>.json
Not in the backup: e-08
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
SIGINT received: closing the server…
Server closed. Bye.
$ ls data
backups
expenses.json
expenses.json.corrupt-<stamp>
expenses.quarantine.json
$ mv data/backups data/backups-aside; damage again; npm start; echo "exit $?"
Cannot start: expenses.json is damaged and there is no verified backup in ~/js-course/expenses/server/data/backups: refusing to start
exit 1
$ mv data/backups-aside data/backups; npm start
The store was damaged: moved aside as expenses.json.corrupt-<stamp>, restored 6 expenses from expenses.<stamp>.json
Not in the backup: none
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
SIGINT received: closing the server…
Server closed. Bye.
$ npm test
ℹ tests 25
ℹ pass 25
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
$ curl -sS http://127.0.0.1:4311/v1/records -H "content-type: application/json" -d '{"label":"%%fixture1Name%% для всієї родини, кава з друзями, квитки в кіно і таксі додому","amountMinor":-12.5,"date":"2026-03-05","category":"подорожі"}'
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"label":"too-long","amountMinor":"not-positive-integer","category":"unknown"},"requestId":"…"}}
$ curl -sS http://127.0.0.1:4311/v1/records -H "content-type: application/json" -d '{"__proto__":{"isAdmin":true}}'
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"label":"required","amountMinor":"not-positive-integer","category":"unknown","date":"bad-date","__proto__":"unknown-field"},"requestId":"…"}}
$ curl -sS -i -H "x-request-id: support-ticket-0042" http://127.0.0.1:4311/v1/records/e-04
HTTP/1.1 200 OK
x-request-id: support-ticket-0042
Connection: keep-alive
{"id":"e-04","label":"%%fixture4Name%%","amountMinor":9990,"date":"2026-02-27","category":"home"}
--- the server terminal:
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
{"time":"…","level":"info","requestId":"…","method":"GET","route":"/v1/records","status":200,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":413,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"GET","route":"/v1/records/..%2Fpackage.json","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"GET","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"info","requestId":"support-ticket-0042","method":"GET","route":"/v1/records/e-04","status":200,"durationMs":…}
SIGINT received: closing the server…
Server closed. Bye.
$ npm test
ℹ tests 37
ℹ pass 37
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
{"id":"e-101","label":"%%fixture1Name%% 0","amountMinor":1,"date":"2025-01-01","category":"food"}
{"id":"e-102","label":"%%fixture2Name%% 1","amountMinor":138,"date":"2025-01-02","category":"transport"}
$ npm run -s import -- data/import.jsonl
Imported 10000 lines in … ms: 10000 new expenses, 0 updated; the store holds 10006.
$ npm run -s import -- data/import.jsonl   (again)
Imported 10000 lines in … ms: 0 new expenses, 10000 updated; the store holds 10006.
$ npm run -s export -- data/export.jsonl
Exported 10006 expenses to data/export.jsonl
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
{"id":"e-01","label":"%%fixture1Name%%","amountMinor":84550,"date":"2026-03-01","category":"food"}
{"id":"e-02","label":"Таксі","amountMinor":12.5,"date":"2026-03-02","category":"transport"}
{"id":"e-03","label":"Кіно"
{"id":"../e-04","label":"Кава","amountMinor":9000,"date":"2026-03-03","category":"fun"}
$ curl -sS http://127.0.0.1:4311/v1/import -H "content-type: application/x-ndjson" --data-binary @data/bad.jsonl
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"line 2":"amountMinor: notPositiveWhole","line 3":"not-json","line 4":"id: malformed"},"requestId":"…"}}
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
ℹ tests 48
ℹ pass 48
ℹ fail 0
$ npm run check
8 of 8 checks passed
$ npm run check:server
6 of 6 checks passed
$ npm run typecheck
exit 0
```
