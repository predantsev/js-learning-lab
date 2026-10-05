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
