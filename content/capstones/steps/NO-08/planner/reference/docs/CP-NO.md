# CP-NO — the planner end to end

The checkpoint of the Node.js stage: the web client (127.0.0.1:4310), the local API (127.0.0.1:4311), the file
store, the hardening and the production-mode start, proved with real requests. Run on macOS, Node.js v25.2.1, the
server from the artifact 1.2.0 with `NODE_ENV=production` and a fresh `DATA_DIR`. Every count by day below is for
the FIXED day 2026-03-02 (the starting tasks are dated around it), never for the computer's today.

## The plan

| Requirement | Component | Check | Evidence |
|---|---|---|---|
| a task added in the page with a `dueDate` and a `priority` is stored | web client → `POST /v1/records` → repository | add one due 2026-03-02, priority high | `POST /v1/records 201` in the log, the record in `GET` |
| `done` changed in the page is stored | web client → `PATCH /v1/records/:id` | mark another task (t-02) done | `PATCH /v1/records/t-02 200` in the log, `"done":true` in `GET` |
| both survive a restart | the file store (atomic rename), graceful shutdown | `kill -TERM`, start again, the same `GET` | exit code 0; the same `summary:` line of `check:deploy … 2026-03-02` before and after |
| the due count for the fixed day is the expected one | `countDueTasks(tasks, day)` of `domain/tasks.ts` over the server's list | count for 2026-03-02 before and after | before 2; +1 (the new task) −1 (t-02 done) = 2 after the restart |
| the page shows the server's data after a reload | the cache reads again from the source | reload | the same tasks, the same count |
| invalid input is refused, nothing stored | the edge's validation | a create with an empty title, a day that does not exist, an unknown priority | exactly `400 VALIDATION_FAILED`, never 5xx; the list unchanged |
| without the server the page says so | the HTTP source, errorText | stop the server, reload | "немає з’єднання", no invented list |
| the native companion does the same | the native client | on the declared target | not performed (below) |

## The evidence

`npm test` in `server/` — `ℹ tests 82`, `ℹ pass 82`, `ℹ fail 0`; `tests/checkpoint.test.ts` runs the six checks
through the web client's own HTTP source against the real server process (started with node, stopped with SIGTERM,
started again) and computes the due count for 2026-03-02 with the web app's `countDueTasks` — the expected number is
derived from the list before the changes, not typed in.

In Chrome 154 (the artifact 1.2.0 with `NODE_ENV=production`, `TODAY=2026-03-02`, a fresh `DATA_DIR` on 4311; the web
app with `npm start` on 4310; the page text is Ukrainian): a new task "Полагодити кран", due 2026-03-02, priority
high, and "Позначити виконаною" for t-02. The server log:

```text
OPTIONS /v1/records 204 e1b1f157-…
POST /v1/records 201 7e2f098c-…
OPTIONS /v1/records/t-02 204 444812a5-…
PATCH /v1/records/t-02 200 aeb70154-…
```

Before the restart `check:deploy … 2026-03-02` → `summary: 7 tasks, pending 4, due on or before 2026-03-02 2`;
`kill -TERM` → exit code 0; the same artifact again → the same `summary:` line. The page reloaded shows the same
(the new card is there); `GET /v1/records` holds
`{"id":"t-07","title":"Полагодити кран","dueDate":"2026-03-02","done":false,"priority":"high"}`; a create with `{}` →
`400` (`"title":"required"`, `POST /v1/records 400` in the log); with the server stopped and the page reloaded:
`Список не завантажився (немає з’єднання)`.



The artifact 1.2.0 (`sha256 cbdf3a72…c18d3c9`) started on a loopback port with a fresh `DATA_DIR`:
`js-learning-lab-planner-server 1.2.0 (pid …, NODE_ENV=production) listening on http://127.0.0.1:…`. Before any
change `npm run -s check:deploy -- <address> 2026-03-02` → `summary: 6 tasks, pending 4, due on or before 2026-03-02 2`
(t-01 due 2026-03-02 and t-02 due 2026-03-01; t-03 has no due date, t-05 and t-06 are later or done, t-04 is done).
A create and a mark:

```text
POST /v1/records {"title":"Купити квитки","dueDate":"2026-03-02","done":false,"priority":"high"} → 201
{"id":"t-07","title":"Купити квитки","dueDate":"2026-03-02","done":false,"priority":"high"}
PATCH /v1/records/t-02 {"done":true} → 200
{"id":"t-02","title":"%%fixture2Name%%","dueDate":"2026-03-01","done":true,"priority":"high"}
```

Before the restart → `summary: 7 tasks, pending 4, due on or before 2026-03-02 2`; `kill -TERM <pid>` →
`SIGTERM received: closing the server, waiting at most 5000 ms for the requests in flight…`, `Server closed. Bye.`;
the same artifact started again on the same folder → the same `summary:` line, and after its second
`kill -TERM` the exit code was 0. Requests after the restart (sent with `fetch` and `curl`):

```text
GET /v1/records?limit=50 → the two changed records
{"id":"t-02","title":"%%fixture2Name%%","dueDate":"2026-03-01","done":true,"priority":"high"}
{"id":"t-07","title":"Купити квитки","dueDate":"2026-03-02","done":false,"priority":"high"}
POST /v1/records, content-type application/json, body {} → 400
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"title":"required"},"requestId":"54e341cd-…"}}
POST /v1/records, body {"title":"x","dueDate":"2026-02-31","priority":"urgent"} → 400
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"priority":"unknown","dueDate":"bad-date"},"requestId":"0d50c67e-…"}}
```

The restarted server's log has `POST /v1/records 400` twice and no `5xx` line; `check:deploy` after the refusals
prints the same `summary:` line — nothing was stored.

The native companion (`~/js-course/planner-native`, EVIDENCE.md, section CP-NO): the same create → restart → reload
on the declared target — **not performed**: no emulator, simulator or phone on this computer; to come back, the
RN-11 release on the declared target with `apiBaseUrl(TARGET)` and the records server started as in the runbook.

## Why `today` is passed in, not read from the clock

"Due by today" is a function of two things: the tasks and the day. When the function reads the clock itself, the
same tasks give 2 today and 3 tomorrow, so a test passes on Monday and fails on Tuesday, and two runs on two days
cannot be compared: `check:deploy` before and after a restart, the live server and a restored one, the count on the
page and in a test would differ for a reason that is not in the data. Passed in as a `YYYY-MM-DD` string, the day is
one fixed value: `countDueTasks(tasks, "2026-03-02")` is pure, the test above derives its expected number from the
list alone, and the restart check compares like with like. It also names WHOSE day it is: the page gets `today`
from its entry (`main.tsx`) and the server-rendered page from `TODAY` or the server's local date at the edge, so the
server and the browser count the same day and the browser never reads a clock before it has hydrated — instead of
two clocks in two time zones disagreeing around midnight. The clock is read once, at the edge, and only there.

## A decision record — the store

Context: every confirmed change must survive a restart. Options: (1) write through — every change goes to the file
before the `201`/`200`, by a temp file and a rename; (2) keep the tasks in memory and flush them every 10 seconds.
Failure modes: (1) a crash between the write and the rename leaves the old file and a `*.tmp`, never half a file, and
never loses a confirmed change; the cost is a disk write per change. (2) a crash loses every change of the last 10 s
that was already confirmed — the client was told "saved" about a task (or a `done` mark) that is gone. Choice: (1).
Consequences: one process may write the file (the write queue protects one process only); a store much bigger than
now would need a database.

## Trade-offs

| Decision | Chosen | Not chosen | Evidence | I would choose otherwise if |
|---|---|---|---|---|
| storage | a JSON file, write-through, atomic rename | a cache flushed on a timer | NO-02's crash rehearsal (`CRASH_BEFORE_RENAME=1` → `exit 137`, the old file whole, the same due count); the restart above | many writers or many thousands of tasks |
| cache policy | the client's copy is read again after every write | trusting the optimistic copy | the counts after the restart come from the server's list; `tests/client.test.ts` (the counts come from the server's list; a refused change leaves the server's task as it was) | the list were too big to read again after each change |
| errors and retries | reads retried twice (100/200 ms), a create only with one `Idempotency-Key`, a `4xx` never | retrying everything | `tests/client.test.ts` (three attempts, one for a 4xx, one record after a lost answer) | the server could not deduplicate creates |

## The PR description (as it would go to a reviewer)

Connects the planner's web client to the local API and runs the server in production mode. To verify: `npm test`
in `server/` (82 pass); start the artifact (`RUNBOOK.md`, section 2) and the web app; add a task due 2026-03-02 with
priority high, mark t-02 done, `kill -TERM` the server, start it again, reload — the task and the mark are there,
and `npm run -s check:deploy -- http://127.0.0.1:4311 2026-03-02` prints the same `summary:` before and after
(`due on or before 2026-03-02 2`); a create with `{}` is `400`; with the server stopped the page says "немає
з’єднання".

Runbook note (section 7 of `server/RUNBOOK.md`, one more symptom): "tasks vanished or the due count changed after a
restart" — look first: `GET /v1/records` and the `summary:` of `check:deploy` for the SAME fixed day against the last
one written down (a different day is a different count, not a loss), the log lines of the missing ids (`POST … 201`
or `PATCH … 200` with a request id?), then `DATA_DIR` of the start line — a wrong folder is the usual cause.
