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
rehearse:export: bad option: -n
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
`server/data/`), `sh try-api` ran in another, then Ctrl+C. Request ids and the idempotency key are
random and shortened to `…` here. The idempotency keys live in the server's memory: a restart forgets them.

```text
$ sh try-api
== 1. POST /v1/records (Idempotency-Key: …)
{"id":"w-07","name":"Навушники 2","price":30,"acquired":false,"category":"Дім"} → 201
== 2. the same POST retried with the same key
{"id":"w-07","name":"Навушники 2","price":30,"acquired":false,"category":"Дім"} → 201
== 3. PATCH /v1/records/w-01 with an invalid name and price
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required","price":"not-a-number"},"requestId":"…"}} → 400
== 4. GET /v1/records?sort=price&limit=3
{"items":[{"id":"w-06","name":"%%fixture6Name%%","price":18,"acquired":true,"category":"%%homeCategory%%"},{"id":"w-04","name":"%%fixture4Name%%","price":25,"acquired":true,"category":"%%booksCategory%%"},{"id":"w-07","name":"Навушники 2","price":30,"acquired":false,"category":"Дім"}],"nextCursor":"w-07"}
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
$ npm start + sh try-api
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
