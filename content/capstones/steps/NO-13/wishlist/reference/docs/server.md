# The server part: evidence

What was run in `server/` for each step of the Node.js stage, with the output seen. A step that was
not run says so, with the reason and what it takes to come back.

## NO-01 — the typed summary script

Node.js v25.2.1, npm 11.6.2, TypeScript 7.0.2, @types/node 22.20.5 (macOS). Not run on Node.js 22: on
22.13–22.17 the command is `node --experimental-strip-types src/summary.ts`.

`LOCALE=en npm run summary`:

```text
Wishes: 6
Still wanted for: UAH 365
Wanted without a price: 1
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
Created the data file with the starting wishes: ~/js-course/wishlist/server/data/wishlist.json
Wishes: 6
Still wanted for: UAH 365
Wanted without a price: 1
$ CRASH_BEFORE_RENAME=1 node src/acquire.ts w-02; echo "exit $?"
exit 137
$ ls data
wishlist.json
wishlist.json.883e5938-c44b-4aa0-98c0-debac1f29ceb.tmp
$ npm run summary
Removed a temp file left by a crash: wishlist.json.883e5938-c44b-4aa0-98c0-debac1f29ceb.tmp
Wishes: 6
Still wanted for: UAH 365
Wanted without a price: 1
$ node src/acquire.ts w-02
Saved: w-02 is acquired
$ npm run summary
Wishes: 6
Still wanted for: UAH 320
Wanted without a price: 1
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
content-length: 496
Date: Sun, 04 Oct 2026 14:54:09 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":"w-01","name":"%%fixture1Name%%","price":80,"acquired":false,"category":"%%firstCategory%%"},{"id":"w-02","name":"%%fixture2Name%%","price":45,"acquired":false,"category":"%%homeCategory%%"},…
$ curl -i http://127.0.0.1:4311/nothing-here
HTTP/1.1 404 Not Found
content-type: application/json; charset=utf-8
content-length: 21
Date: Sun, 04 Oct 2026 14:54:09 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"not found"}
$ curl -i -X DELETE http://127.0.0.1:4311/records
HTTP/1.1 405 Method Not Allowed
allow: GET
content-type: application/json; charset=utf-8
content-length: 30
Date: Sun, 04 Oct 2026 14:54:09 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"method not allowed"}
$ npm start   (a second copy, in another terminal)
Error: listen EADDRINUSE: address already in use 127.0.0.1:4311
  code: 'EADDRINUSE',
--- the server terminal after Ctrl+C:
> js-learning-lab-wishlist-server@0.1.0 start
> node src/server.ts
Created the data file with the starting wishes: ~/js-course/wishlist/server/data/wishlist.json
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
GET /records → 200
GET /nothing-here → 404
DELETE /records → 405
SIGINT received: closing the server…
Server closed. Bye.
$ curl -sS http://127.0.0.1:4311/records
curl: (7) Failed to connect to 127.0.0.1 port 4311: Couldn't connect to server
$ npm run -s acquire -- w-02
Saved: w-02 is acquired
$ curl -sS http://127.0.0.1:4311/records   (after the restart)
[{"id":"w-01","name":"%%fixture1Name%%","price":80,"acquired":false,"category":"%%firstCategory%%"},{"id":"w-02","name":"%%fixture2Name%%","price":45,"acquired":true,"category":"%%homeCategory%%"},{"id":"w-03","name":"%%fixture3Name%%","price":240,"acquired":false,"c…
$ npm run check:server
✔ GET /records → 200, JSON, the stored wishes
✔ GET /records?view=all → 200 (routing by pathname)
✔ GET /nothing-here → 404, JSON
✔ DELETE /records → 405 with Allow: GET, JSON
✔ Ctrl+C (SIGINT) closes the server and the process ends with code 0
✔ after a restart GET /records answers the same wishes
6 of 6 checks passed
```

## NO-04 — the /v1 records API

Node.js v25.2.1, curl 8.7.1 (macOS). The server was started with `npm start` in one terminal (fresh
`server/data/`), `node try-api.mjs` ran in another, then Ctrl+C. Request ids and the idempotency key are
random and shortened to `…` here. The idempotency keys live in the server's memory: a restart forgets them.

```text
$ node try-api.mjs
== 1. POST /v1/records (Idempotency-Key: …)
{"id":"w-07","name":"%%fixture1Name%% 2","price":30,"acquired":false,"category":"%%homeCategory%%"} → 201
== 2. the same POST retried with the same key
{"id":"w-07","name":"%%fixture1Name%% 2","price":30,"acquired":false,"category":"%%homeCategory%%"} → 201
== 3. PATCH /v1/records/w-01 with an invalid name and price
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required","price":"not-a-number"},"requestId":"…"}} → 400
== 4. GET /v1/records?sort=price&limit=3
{"items":[{"id":"w-06","name":"%%fixture6Name%%","price":18,"acquired":true,"category":"%%homeCategory%%"},{"id":"w-04","name":"%%fixture4Name%%","price":25,"acquired":true,"category":"%%booksCategory%%"},{"id":"w-07","name":"%%fixture1Name%% 2","price":30,"acquired":false,"category":"%%homeCategory%%"}],"nextCursor":"w-07"}
== 5. GET /v1/records?sort=price&limit=3&cursor=w-07
{"items":[{"id":"w-02","name":"%%fixture2Name%%","price":45,"acquired":false,"category":"%%homeCategory%%"},{"id":"w-01","name":"%%fixture1Name%%","price":80,"acquired":false,"category":"%%firstCategory%%"},{"id":"w-03","name":"%%fixture3Name%%","price":240,"acquired":false,"category":"%%sportCategory%%"}],"nextCursor":"w-03"} → 200
--- the server terminal:
Created the data file with the starting wishes: ~/js-course/wishlist/server/data/wishlist.json
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
POST /v1/records → 201
POST /v1/records → 201
PATCH /v1/records/w-01 → 400
GET /v1/records?sort=price&limit=3 → 200
GET /v1/records?sort=price&limit=3&cursor=w-07 → 200
SIGINT received: closing the server…
Server closed. Bye.
$ node -e "…" (the records in the data file)
1 7 w-01 w-02 w-03 w-04 w-05 w-06 w-07
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
1 7 w-01 w-02 w-03 w-04 w-05 w-06 w-07
$ npm start   (a version 1 store, before the migration)
Cannot start: wishlist.json is schemaVersion 1: run "npm run migrate" first
$ node -e "…" (one record in the old v1 shape)
{"id":"w-05","name":"%%fixture5Name%%","price":null,"category":""}
$ npm run migrate
Dry run: 7 wishes, the same ids and wanted total; a second run changes nothing.
Migrated wishlist.json to schemaVersion 2: 7 wishes.
$ node -e "…" (the record w-05 after the migration)
{"id":"w-05","name":"%%fixture5Name%%","price":null,"acquired":false,"category":null}
$ npm run migrate   (again)
wishlist.json is already schemaVersion 2: nothing to migrate.
$ npm run backup
Backup: backups/wishlist.<stamp>.json — 7 wishes, wanted total 395, sha256 …
Verified by a restore into a scratch folder: 7 wishes, the same sha256, ids and wanted total.
$ npm start + node try-api.mjs
== 1. POST /v1/records (Idempotency-Key: …)
{"id":"w-08","name":"%%fixture1Name%% 2","price":30,"acquired":false,"category":"%%homeCategory%%"} → 201
== 2. the same POST retried with the same key
{"id":"w-08","name":"%%fixture1Name%% 2","price":30,"acquired":false,"category":"%%homeCategory%%"} → 201
== 3. PATCH /v1/records/w-01 with an invalid name and price
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required","price":"not-a-number"},"requestId":"…"}} → 400
== 4. GET /v1/records?sort=price&limit=3
{"items":[{"id":"w-06","name":"%%fixture6Name%%","price":18,"acquired":true,"category":"%%homeCategory%%"},{"id":"w-04","name":"%%fixture4Name%%","price":25,"acquired":true,"category":"%%booksCategory%%"},{"id":"w-07","name":"%%fixture1Name%% 2","price":30,"acquired":false,"category":"%%homeCategory%%"}],"nextCursor":"w-07"}
== 5. GET /v1/records?sort=price&limit=3&cursor=w-07
{"items":[{"id":"w-08","name":"%%fixture1Name%% 2","price":30,"acquired":false,"category":"%%homeCategory%%"},{"id":"w-02","name":"%%fixture2Name%%","price":45,"acquired":false,"category":"%%homeCategory%%"},{"id":"w-01","name":"%%fixture1Name%%","price":80,"acquired":false,"category":"%%firstCategory%%"}],"nextCursor":"w-01"} → 200
--- the server terminal:
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
POST /v1/records → 201
POST /v1/records → 201
PATCH /v1/records/w-01 → 400
GET /v1/records?sort=price&limit=3 → 200
GET /v1/records?sort=price&limit=3&cursor=w-07 → 200
SIGINT received: closing the server…
Server closed. Bye.
$ damage (the price/amount of the first record as text) and npm start
The store was damaged: moved aside as wishlist.json.corrupt-<stamp>, restored 7 wishes from wishlist.<stamp>.json
Not in the backup: w-08
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
SIGINT received: closing the server…
Server closed. Bye.
$ ls data
backups
wishlist.json
wishlist.json.corrupt-<stamp>
$ mv data/backups data/backups-aside; damage again; npm start; echo "exit $?"
Cannot start: wishlist.json is damaged and there is no verified backup in ~/js-course/wishlist/server/data/backups: refusing to start
exit 1
$ mv data/backups-aside data/backups; npm start
The store was damaged: moved aside as wishlist.json.corrupt-<stamp>, restored 7 wishes from wishlist.<stamp>.json
Not in the backup: none
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
SIGINT received: closing the server…
Server closed. Bye.
$ npm test
ℹ tests 24
ℹ pass 24
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
$ curl -sS http://127.0.0.1:4311/v1/records -H "content-type: application/json" -d '{"name":"   ","price":1.5,"category":"Подарунки для всієї родини на свята"}'
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required","price":"not-whole","category":"too-long"},"requestId":"…"}}
$ curl -sS http://127.0.0.1:4311/v1/records -H "content-type: application/json" -d '{"__proto__":{"isAdmin":true}}'
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required","__proto__":"unknown-field"},"requestId":"…"}}
$ curl -sS -i -H "x-request-id: support-ticket-0042" http://127.0.0.1:4311/v1/records/w-03
HTTP/1.1 200 OK
x-request-id: support-ticket-0042
Connection: keep-alive
{"id":"w-03","name":"%%fixture3Name%%","price":240,"acquired":false,"category":"%%sportCategory%%"}
--- the server terminal:
Records server listening on http://127.0.0.1:4311
Stop it with Ctrl+C.
{"time":"…","level":"info","requestId":"…","method":"GET","route":"/v1/records","status":200,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":413,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"GET","route":"/v1/records/..%2Fpackage.json","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"GET","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"warn","requestId":"…","method":"POST","route":"/v1/records","status":400,"durationMs":…}
{"time":"…","level":"info","requestId":"support-ticket-0042","method":"GET","route":"/v1/records/w-03","status":200,"durationMs":…}
SIGINT received: closing the server…
Server closed. Bye.
$ npm test
ℹ tests 36
ℹ pass 36
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
{"id":"w-101","name":"%%fixture1Name%% 0","price":null,"acquired":true,"category":"%%firstCategory%%"}
{"id":"w-102","name":"%%fixture2Name%% 1","price":37,"acquired":false,"category":"%%homeCategory%%"}
$ npm run -s import -- data/import.jsonl
Imported 10000 lines in … ms: 10000 new wishes, 0 updated; the store holds 10006.
$ npm run -s import -- data/import.jsonl   (again)
Imported 10000 lines in … ms: 0 new wishes, 10000 updated; the store holds 10006.
$ npm run -s export -- data/export.jsonl
Exported 10006 wishes to data/export.jsonl
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
{"id":"w-01","name":"%%fixture1Name%%","price":80,"acquired":false,"category":"%%firstCategory%%"}
{"id":"w-02","name":"%%fixture2Name%%","price":12.5,"acquired":false,"category":"%%homeCategory%%"}
{"id":"w-03","name":"%%fixture3Name%%"
{"id":"../w-04","name":"Книжка","price":25,"acquired":true,"category":null}
$ curl -sS http://127.0.0.1:4311/v1/import -H "content-type: application/x-ndjson" --data-binary @data/bad.jsonl
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"line 2":"price: notWholeNonNegative","line 3":"not-json","line 4":"id: malformed"},"requestId":"…"}}
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
ℹ tests 46
ℹ pass 46
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
$ curl -sS -i -X OPTIONS http://127.0.0.1:4311/v1/records/w-01 -H "Origin: http://127.0.0.1:4310" -H "Access-Control-Request-Method: PATCH" -H "Access-Control-Request-Headers: content-type"
HTTP/1.1 204 No Content
x-request-id: …
vary: Origin
access-control-allow-origin: http://127.0.0.1:4310
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE
access-control-allow-headers: content-type, idempotency-key
```

In Chrome, http://127.0.0.1:4310/: the summary `Бажань: 6 · Ще хочу на суму: 365 грн · …`; the mark
of w-01 → `285 грн`, and the server log shows `OPTIONS /v1/records/w-01 204` then `PATCH /v1/records/w-01 200`
and the lists read again (`GET /v1/records 200`). With the server stopped and the page reloaded:
`Список не завантажився (немає з’єднання)` (each list request tried three times). After a restart and a
reload: w-01 still marked, `285 грн`; `curl -sS http://127.0.0.1:4311/v1/records/w-01` →
`{"id":"w-01",…,"acquired":true,…}`. `/tests.html` — the user-action tests on the fixture API: all passed.

Wrong on purpose (and put back): `PATCH` left out of `ALLOWED_METHODS` — the Console says
`Access to fetch at 'http://127.0.0.1:4311/v1/records/w-01' from origin 'http://127.0.0.1:4310' has been
blocked by CORS policy: Method PATCH is not allowed by Access-Control-Allow-Methods in preflight response.`,
the server log has the `OPTIONS` and no `PATCH`, and the page says the mark was not saved and puts it back.
`ALLOWED_ORIGINS=http://localhost:4310` — `No 'Access-Control-Allow-Origin' header is present on the
requested resource.` for every list request, while curl gets the same list.

```text
$ npm test        (server/)
ℹ tests 57
ℹ pass 57
ℹ fail 0
```

Native companion (`~/js-course/wishlist-native`): `shared/contract.ts` copied unchanged, `apiBaseUrl(TARGET)`
in `src/devConfig.ts`; `npx tsc --noEmit` and `npm test` pass on the computer. On the target: **not
performed** — no emulator, simulator or phone here (EVIDENCE.md of the native project, section NO-06).

## NO-12 — local production mode

Node.js v25.2.1 (npm 11.6.2) and v22.13.1 (npm 10.9.2), macOS. The whole rehearsal of `server/RUNBOOK.md`, on a
fresh `~/js-course/wishlist-data`; below the run on 25.2.1 (on 22.13.1 the same lines, other counts and times,
and an artifact of 36951 bytes instead of 36933: the same commit packed by another Node and npm gives other
bytes — an artifact is kept, never rebuilt).

```text
$ npm run ci
▶ typecheck: npx tsc -p .
▶ test: node --test tests/*.test.ts
▶ artifact: node scripts/pack.mjs
release/: js-learning-lab-wishlist-server 1.0.0, 37 files (data/wishes.json, domain/wishes.ts, shared/contract.ts, data/model.ts, data/synthetic.js from the web project)
✔ artifacts/js-learning-lab-wishlist-server-1.0.0.tgz (36933 bytes, commit 187cb8c, ci passed)
  sha256 207a8fffe084c3f800f3c40d7e925a43946770e9db92edfadb358a9e5919af1b
✔ CI passed.
$ shasum -a 256 artifacts/js-learning-lab-wishlist-server-1.0.0.tgz
207a8fffe084c3f800f3c40d7e925a43946770e9db92edfadb358a9e5919af1b  artifacts/js-learning-lab-wishlist-server-1.0.0.tgz
$ (cd ~/js-course/wishlist-run/1.0.0/package && PORT=99999 SHUTDOWN_DEADLINE_MS=5 node server/src/server.js); echo "exit $?"
PORT must be a whole number from 1 to 65535, got "99999"
SHUTDOWN_DEADLINE_MS must be a whole number from 100 to 30000, got "5"
exit 1
$ cd ~/js-course/wishlist-run/1.0.0/package && NODE_ENV=production PORT=4311 DATA_DIR=$HOME/js-course/wishlist-data node server/src/server.js
js-learning-lab-wishlist-server 1.0.0 (pid …, NODE_ENV=production) listening on http://127.0.0.1:4311
$ curl -sS http://127.0.0.1:4311/livez; curl -sS http://127.0.0.1:4311/readyz
{"status":"alive"}{"status":"ready"}
$ npm run -s load -- http://127.0.0.1:4311 3
answered {"200":3714,"201":412}, refused 0, broken 0; created (201) 412; p50 1.8 ms, p95 7.6 ms
$ curl -sS http://127.0.0.1:4311/metrics | grep 'route="/v1/records"'
http_requests_total{route="/v1/records",status="200"} 3714
http_requests_total{route="/v1/records",status="201"} 412
http_errors_total{route="/v1/records"} 0
http_request_duration_ms{route="/v1/records",quantile="0.5"} 1.1
http_request_duration_ms{route="/v1/records",quantile="0.95"} 6.6
http_request_duration_ms{route="/v1/records",quantile="0.99"} 8.0
http_request_duration_ms_count{route="/v1/records"} 4126
```

SIGTERM under load: a second `npm run -s load -- http://127.0.0.1:4311 4` and, 1.5 s into it, `kill -TERM <pid>`.
The server: `SIGTERM received: closing the server, waiting at most 5000 ms for the requests in flight…`,
`Server closed. Bye.`, exit code 0. The load: `answered {"200":1104,"201":122}, refused 104, broken 3; created
(201) 122` — refused: new connections after the signal; broken: keep-alive connections that the closing server
cut between two requests (no answer was lost: every 201 is on disk). On disk: 540 wishes = 6 starting + 412 + 122.

```text
$ DATA_DIR=$HOME/js-course/wishlist-data npm run -s backup
Backup: backups/wishlist.2026-10-04T23-04-08-587Z.json — 540 wishes, wanted total 5705, sha256 9a55747e5090…
Verified by a restore into a scratch folder: 540 wishes, the same sha256, ids and wanted total.
$ DATA_DIR=$HOME/js-course/wishlist-data npm run -s restore-drill -- $HOME/js-course/wishlist-drill
Restored backups/wishlist.2026-10-04T23-04-08-587Z.json into ~/js-course/wishlist-drill
live:     540 wishes, wanted total 5705, ids e42b5e440f48
restored: 540 wishes, wanted total 5705, ids e42b5e440f48
✔ the restored store answers the same as the live one
```

The same artifact on the live folder (4311) and on the drill folder (`PORT=4312`): `npm run -s check:deploy` of
both — every line `✔`, both `summary: 540 wishes, wanted total 5705, without a price 1`.

A CPU profile under load (`node --cpu-prof --cpu-prof-dir=… server/src/server.js`, 3 s of load, SIGTERM;
local only — never on a server people use):

```text
$ npm run -s profile:top -- profiles/*.cpuprofile
  1041.7 ms  writeSync node:fs:882
   977.6 ms  (anonymous) src/list.js:21
   216.8 ms  parseStore src/contract.js:101
   188.0 ms  decode node:internal/encoding:440
    55.6 ms  (anonymous) src/contract.js:37
```

The two biggest: the log line written synchronously for every request (`writeSync`), and the name comparator of
`GET /v1/records` (`localeCompare` with the Ukrainian locale) — every list request sorts every wish. Nothing
was changed for it: p95 stayed under 10 ms here; the latency test in `tests/ops.test.ts` guards 20,000 wishes
(measured p95 41–58 ms on this computer, budget 250 ms).

The rollback rehearsal: on a branch, 1.1.0 with a defect in `src/list.ts` (the `acquired` filter inverted).
`npm run ci` → `✖ CI stopped at "test" (exit code 1). No artifact was produced.` — the guard works. Packed by
hand to rehearse the incident: `npm run -s pack` → `✔ artifacts/js-learning-lab-wishlist-server-1.1.0.tgz
(36935 bytes, commit 6289e48, ci skipped)`. Deployed (1.0.0 stopped, 1.1.0 started on the same data):

```text
$ npm run -s check:deploy -- http://127.0.0.1:4311
✔ GET /readyz answers 200
✔ every page of /v1/records keeps the v1 contract (735 wishes)
✖ ?acquired=false answers only wanted wishes — w-04, w-06
✖ ?acquired=true answers only acquired wishes — w-03, w-05, w-01, w-02, w-07 and 728 more
✔ the two filters together are the whole list
✔ ?sort=price goes up, the wishes without a price last
summary: 735 wishes, wanted total 7655, without a price 1
```

Runbook section 7: data check — `schemaVersion 2`, which 1.0.0 knows: no restore. `kill -TERM` 1.1.0 (exit 0);
`shasum -a 256` of the 1.0.0 artifact equals its record; 1.0.0 started from its folder: `/readyz` →
`{"status":"ready"}`, `check:deploy` — every line `✔`. The branch was deleted; both artifacts stay in `artifacts/`.

```text
$ npm test        (server/)
ℹ tests 66
ℹ pass 66
ℹ fail 0
```

## NO-13 — the list page rendered on the server and hydrated

Node.js v25.2.1 and v22.13.1, react and react-dom 19.3.0 (the web project's dependencies: `npm ls react-dom` →
`react-dom@19.3.0`), esbuild 0.28.2, Chrome 154, the Ukrainian workspace. `npm start` in `server/` builds the
client entry (`public/client.js`, development build, 1183087 bytes) and starts the server; the page is
http://127.0.0.1:4311/.

```text
$ curl -sS http://127.0.0.1:4311/ | head -c 330
<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Список бажань</title>
</head>
<body>
<div id="root"><main><h1>Список бажань</h1><p>Бажань: 6 · Ще хочу на суму: 365 ₴</p><ul><li class="card" dat
```

In Chrome, with `public/client.js` held back for 2 s: the server's list is on the page at once (`Бажань: 6 · Ще
хочу на суму: 365 ₴`); a click on "Позначити отриманим: %%fixture1Name%%" before the client entry runs sends nothing
(no `PATCH` in the log); then the Console says `hydrated`, the button is the same DOM node the server sent, and a
click sends `PATCH /v1/records/w-01`, the page reads `/list-data` and shows `285 ₴`. The page source and the
bundle hold no server setting: `grep -c "js-course/wishlist/server/data" public/client.js` → `0`,
`grep -c '"node:' public/client.js` → `0`.

The injected mismatch: `ssr/client.ts` formats the prices itself before hydrating —
`wish.price.toLocaleString(undefined, { style: "currency", currency: "UAH" })`. The Console:

```text
{"level":"warn","kind":"hydration","requestId":"fe1c96a2-…","message":"Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. …
  <WishListPage initial={{...}}>
        <li className="card" data-id="w-01">
          <p>
+           Ціна: UAH 80.00
-           Ціна: 80 ₴
```

`+` is the client, `-` the server; the request id is the page's (`#initial-data`), the same as the
`x-request-id` of GET /; the button was not the server's node any more (React drew the tree again). The cause is
in the initial data's path, not in the component: the client must take `priceText` as the server sent it. Put
back, rebuilt: `hydrated`, no warning.

Also seen: formatting on both sides with the SAME explicit locale (`formatPrice(price, "uk-UA")` in the
component) passes every Node test and still mismatches in Chrome — `+ Ціна: 80 грн` / `- Ціна: 80 ₴`: Node and
Chrome carry different Intl data. Text that must match to the character is formatted once, on the server.
And a script that adds an attribute to a server node before hydration makes React warn `A tree hydrated but some
attributes of the server rendered HTML didn't match the client properties.` — a browser extension can do that.

The artifact 1.2.0 (`npm run ci` → `artifacts/js-learning-lab-wishlist-server-1.2.0.tgz`, 1554181 bytes, react
19.3.0, react-dom 19.3.0 and scheduler 0.28.0 bundled, the client entry minified) started on Node 22.13.1 with no
flag and `NODE_ENV=production`: the same page, `hydrated`, the same node, the toggle works.

```text
$ npm test        (server/)
ℹ tests 74
ℹ pass 74
ℹ fail 0
```
