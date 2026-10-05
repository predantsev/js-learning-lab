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
`server/data/`), `node try-api.mjs` ran in another, then Ctrl+C. Request ids and the idempotency key are
random and shortened to `…` here. The idempotency keys live in the server's memory: a restart forgets them.

```text
$ node try-api.mjs
== 1. POST /v1/records (Idempotency-Key: …)
{"id":"e-07","label":"%%fixture1Name%% 2","amountMinor":6500,"date":"2026-03-03","category":"food"} → 201
== 2. the same POST retried with the same key
{"id":"e-07","label":"%%fixture1Name%% 2","amountMinor":6500,"date":"2026-03-03","category":"food"} → 201
== 3. PATCH /v1/records/e-01 with invalid fields
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"label":"required","amountMinor":"not-positive-integer"},"requestId":"…"}} → 400
== 4. GET /v1/records?sort=amountMinor&limit=3
{"items":[{"id":"e-07","label":"%%fixture1Name%% 2","amountMinor":6500,"date":"2026-03-03","category":"food"},{"id":"e-04","label":"%%fixture4Name%%","amountMinor":9990,"date":"2026-02-27","category":"home"},{"id":"e-03","label":"%%fixture3Name%%","amountMinor":18000,"date":"2026-02-28","category":"fun"}],"nextCursor":"e-03"}
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
$ npm start + node try-api.mjs
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

## NO-06 — the web client on the real API

Node.js v25.2.1 and v22.13.1 (the server with `NODE_OPTIONS=--experimental-strip-types`), the Ukrainian workspace (the page text below is Ukrainian), Chrome 154
(macOS). `.env` of the web project: `PORT=4310`, `DATA_SOURCE=http`, `API_BASE_URL=http://127.0.0.1:4311`.
The server was started with `npm start` in `server/` on a fresh `server/data/`, the web app with `npm start`.

```text
$ curl -sS -i -X OPTIONS http://127.0.0.1:4311/v1/records/e-01 -H "Origin: http://127.0.0.1:4310" -H "Access-Control-Request-Method: DELETE"
HTTP/1.1 204 No Content
x-request-id: …
vary: Origin
access-control-allow-origin: http://127.0.0.1:4310
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE
access-control-allow-headers: content-type, idempotency-key
$ curl -sS -i -X OPTIONS http://127.0.0.1:4311/v1/records/e-01 -H "Origin: http://127.0.0.1:4312" -H "Access-Control-Request-Method: DELETE"
HTTP/1.1 204 No Content
x-request-id: …
vary: Origin
```

In Chrome 154, http://127.0.0.1:4310/: a new expense `Кава`, `65`, `2026-03-02`, `Їжа` — the server log shows
`OPTIONS /v1/records 204` then `POST /v1/records 201` and the lists read again; the totals line
`… Їжа: 1 056,00 грн · … · Разом: 2 155,90 грн` became `… Їжа: 1 121,00 грн · … · Разом: 2 220,90 грн` — the
category grew by exactly 65,00. With the server stopped and the page reloaded: `Список не завантажився (немає
з’єднання)`. After a restart and a reload the page shows the same as after the change;
`curl -sS http://127.0.0.1:4311/v1/records/e-07` → `{"id":"e-07","label":"Кава","amountMinor":6500,"date":"2026-03-02","category":"food"}`.
`/tests.html` — the user-action tests on the fixture API: `Пройшли: 13 · не пройшли: 0`.

```text
$ npm test        (server/)
ℹ tests 60
ℹ pass 60
ℹ fail 0
```

Native companion (`~/js-course/expenses-native`): `shared/contract.ts` copied unchanged, `apiBaseUrl(TARGET)`
in `src/devConfig.ts`; `npx tsc --noEmit` and `npm test` pass on the computer. On the target: **not
performed** — no emulator, simulator or phone here (EVIDENCE.md of the native project, section NO-06).

## NO-12 — local production mode

Node.js v25.2.1 (npm 11.6.2) and v22.13.1 (npm 10.9.2), macOS. The whole rehearsal of `server/RUNBOOK.md`, on a
fresh `~/js-course/expenses-data`; this rehearsal ran on ports 7393/7396; yours are 4311/4312. Below the run on
25.2.1 (on 22.13.1 the same lines, other counts and times, an `ExperimentalWarning` of type stripping before the
output of every `node` start — that version needs `--experimental-strip-types` — and an artifact of 39581 bytes
instead of 39555: the same commit packed by another Node and npm gives other bytes — an artifact is kept, never
rebuilt).

```text
$ npm run ci
▶ typecheck: npx tsc -p .
▶ test: node --test tests/*.test.ts
▶ artifact: node scripts/pack.mjs
release/: js-learning-lab-expenses-server 1.0.0, 37 files (data/expenses.json, domain/expenses.ts, shared/contract.ts, data/model.ts, data/synthetic.js from the web project)
✔ artifacts/js-learning-lab-expenses-server-1.0.0.tgz (39555 bytes, commit ea47e0f, ci passed)
  sha256 031827034d49dc9bd80aae7b7d23ec3fa5e1bcbfdfd905791f35a17177af76c1
✔ CI passed.
$ shasum -a 256 artifacts/js-learning-lab-expenses-server-1.0.0.tgz
031827034d49dc9bd80aae7b7d23ec3fa5e1bcbfdfd905791f35a17177af76c1  artifacts/js-learning-lab-expenses-server-1.0.0.tgz
$ (cd ~/js-course/expenses-run/1.0.0/package && PORT=99999 SHUTDOWN_DEADLINE_MS=5 node server/src/server.js); echo "exit $?"
PORT must be a whole number from 1 to 65535, got "99999"
SHUTDOWN_DEADLINE_MS must be a whole number from 100 to 30000, got "5"
exit 1
$ cd ~/js-course/expenses-run/1.0.0/package && NODE_ENV=production PORT=7393 DATA_DIR=$HOME/js-course/expenses-data node server/src/server.js
Created the data file with the starting expenses: ~/js-course/expenses-data/expenses.json
js-learning-lab-expenses-server 1.0.0 (pid …, NODE_ENV=production) listening on http://127.0.0.1:7393
$ curl -sS http://127.0.0.1:7393/livez; curl -sS http://127.0.0.1:7393/readyz
{"status":"alive"}{"status":"ready"}
$ npm run -s load -- http://127.0.0.1:7393 3
answered {"200":4291,"201":476}, refused 0, broken 0; created (201) 476; p50 1.2 ms, p95 6.9 ms
$ curl -sS http://127.0.0.1:7393/metrics | grep 'route="/v1/records"'
http_requests_total{route="/v1/records",status="200"} 4291
http_requests_total{route="/v1/records",status="201"} 476
http_errors_total{route="/v1/records"} 0
http_request_duration_ms{route="/v1/records",quantile="0.5"} 0.7
http_request_duration_ms{route="/v1/records",quantile="0.95"} 6.0
http_request_duration_ms{route="/v1/records",quantile="0.99"} 7.2
http_request_duration_ms_count{route="/v1/records"} 4767
```

The per-route latency histogram of `/v1/records`: p95 6.0 ms on the server's own clock (the `perf_hooks` histogram
of `src/metrics.ts`), 6.9 ms as the load client saw it — the client's number also holds the time on the wire.

SIGTERM under load: a second `npm run -s load -- http://127.0.0.1:7393 4` and, 1.5 s into it, `kill -TERM <pid>`.
The server: `SIGTERM received: closing the server, waiting at most 5000 ms for the requests in flight…`,
`Server closed. Bye.`, exit code 0. The load: `answered {"200":1457,"201":161}, refused 104, broken 0; created
(201) 161` — refused: new connections after the signal; no answer was lost: every 201 is on disk. On disk: 643
expenses = 6 starting + 476 + 161 (on 22.13.1: 639 = 6 + 468 + 165).

```text
$ DATA_DIR=$HOME/js-course/expenses-data npm run -s backup
Backup: backups/expenses.2026-10-04T23-13-45-830Z.json — 643 expenses, by category food:742600,transport:52000,home:9990,fun:48000, sha256 6a23b3024ecc…
Verified by a restore into a scratch folder: 643 expenses, the same sha256, ids and per-category totals.
$ DATA_DIR=$HOME/js-course/expenses-data npm run -s restore-drill -- $HOME/js-course/expenses-drill
Restored backups/expenses.2026-10-04T23-13-45-830Z.json into ~/js-course/expenses-drill
live:     643 expenses, total 852590, food:742600,transport:52000,home:9990,fun:48000 (amountMinor), ids d26f85f19f73
restored: 643 expenses, total 852590, food:742600,transport:52000,home:9990,fun:48000 (amountMinor), ids d26f85f19f73
✔ the restored store answers the same as the live one
```

The overall total and every category total match to the minor unit. The same artifact on the live folder (7393)
and on the drill folder (`PORT=7396`): `npm run -s check:deploy` of both — every line `✔`, both
`summary: 643 expenses, total 852590, food 742600, transport 52000, home 9990, fun 48000 (amountMinor)`.

A CPU profile under load (`node --cpu-prof --cpu-prof-dir=… server/src/server.js`, 3 s of load, SIGTERM;
local only — never on a server people use):

```text
$ npm run -s profile:top -- profiles/*.cpuprofile
  1232.7 ms  writeSync node:fs:882
   396.5 ms  parseStore src/contract.js:99
   350.1 ms  decode node:internal/encoding:440
   127.7 ms  checkRecords src/contract.js:32
   105.4 ms  (anonymous) src/contract.js:38
```

The biggest: the log line written synchronously for every request (`writeSync`); then reading the store on every
list request — decoding the file (`decode`), parsing it and checking every record against the contract
(`parseStore`, `checkRecords`). The sort of `GET /v1/records` compares numbers and dates and does not show in the
top five. Nothing was changed for it: p95 stayed under 10 ms here; the latency test in `tests/ops.test.ts` guards
20,000 expenses sorted by `amountMinor` (measured p95 18.8–24.3 ms on 25.2.1 and 19.6–21.9 ms on 22.13.1 on this
computer, budget 100 ms).

The rollback rehearsal: on a branch, 1.1.0 with a defect in `src/list.ts` (the `category` filter inverted).
`npm run ci` → `✖ CI stopped at "test" (exit code 1). No artifact was produced.` — the guard works. Packed by
hand to rehearse the incident: `npm run -s pack` → `✔ artifacts/js-learning-lab-expenses-server-1.1.0.tgz
(39556 bytes, commit 52ef7d0, ci skipped)`. Deployed (1.0.0 stopped, 1.1.0 started on the same data):

```text
$ npm run -s check:deploy -- http://127.0.0.1:7393
✔ GET /readyz answers 200
✔ every page of /v1/records keeps the v1 contract (934 expenses)
✖ ?category=food answers only food expenses — e-04, e-05, e-03, e-02
✖ ?category=transport answers only transport expenses — e-04, e-05, e-03, e-01, e-06 and 928 more
✖ ?category=home answers only home expenses — e-05, e-03, e-01, e-02, e-06 and 928 more
✖ ?category=fun answers only fun expenses — e-04, e-01, e-02, e-06, e-07 and 927 more
✖ the four categories together are the whole list — 2802 ≠ 934
✔ ?sort=amountMinor goes up
summary: 934 expenses, total 1143590, food 1033600, transport 52000, home 9990, fun 48000 (amountMinor)
```

Runbook section 7: data check — `schemaVersion 2`, which 1.0.0 knows: no restore. `kill -TERM` 1.1.0 (exit 0);
`shasum -a 256` of the 1.0.0 artifact equals its record; 1.0.0 started from its folder: `/readyz` →
`{"status":"ready"}`, `check:deploy` — every line `✔`. The branch was deleted; both artifacts stay in `artifacts/`.

```text
$ npm test        (server/)
ℹ tests 69
ℹ pass 69
ℹ fail 0
```
