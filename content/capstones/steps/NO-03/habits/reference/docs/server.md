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
