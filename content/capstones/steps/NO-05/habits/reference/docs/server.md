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
