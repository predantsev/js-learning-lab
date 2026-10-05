# CP-NO — the habit tracker end to end

The checkpoint of the Node.js stage: the web client (127.0.0.1:4310), the local API (127.0.0.1:4311), the file
store, the hardening and the production-mode start, proved with real requests. Run on macOS, Node.js v25.2.1, the
Ukrainian workspace (the page text below is Ukrainian), the server from the artifact 1.2.0 with
`NODE_ENV=production` and a fresh `DATA_DIR`, the web app with `npm start` (`DATA_SOURCE=http`). "Today" is the fixed
day the page passes in, 2026-03-02 (`TODAY` in `main.tsx`); every streak below is counted on that day.

## The plan

| Requirement | Component | Check | Evidence |
|---|---|---|---|
| a day marked in the page is stored | web client → `POST /v1/records/:id/completions` → repository | "done today" on h-01 | `POST /v1/records/h-01/completions 200` in the log, `"2026-03-02"` in its `completions` in `GET` |
| a pause set in the page is stored | web client → `PATCH /v1/records/:id` (`active: false`) | pause h-02 | `PATCH … 200` in the log, `"active":false` and the same days in `GET` |
| both survive a restart | the file store (atomic rename), graceful shutdown | `kill -TERM`, start again, the same `GET` | exit code 0; the same `summary:` line of `check:deploy … 2026-03-02` before and after |
| the streak on the fixed day is the server's | `streakOf` (ui/streak.ts) over the server's days | h-01 on 2026-03-02 | 3 before the mark, 4 after, 4 after the restart; the streak sum 7 → 8 |
| the page shows the server's data after a reload | the cache reads again from the source | reload | the same marks, the same streaks |
| invalid input is refused, nothing stored | the edge's validation | an empty name, a frequency "monthly", the day 2026-02-30 | exactly `400 VALIDATION_FAILED`, never 5xx, the same list |
| without the server the page says so | the HTTP source, errorText | stop the server, reload | "no connection", no invented list |
| the native companion does the same | the native client | on the declared target | not performed (below) |

## The evidence

`npm test` in `server/` — `ℹ tests 89`, `ℹ pass 89`, `ℹ fail 0`; `tests/checkpoint.test.ts` runs the six checks
through the web client's own HTTP source against the real server process (started with node, stopped with SIGTERM,
started again): h-01 marked on 2026-03-02 (twice — kept once), h-02 paused; after the restart h-01's days are the
three before plus 2026-03-02, `streakOf(…, "2026-03-02")` is 4 (it was 3), h-02 is paused with its three days and
its streak 2, h-03…h-06 are unchanged; the refusals are 400 and change nothing; without the server the list and the
mark reject with no connection.

In Chrome 154 (the artifact 1.2.0 with `NODE_ENV=production`, `TODAY=2026-03-02`, a fresh `DATA_DIR` on 4311; the web
app with `npm start` on 4310; the page text is Ukrainian): a new daily habit "Читати 10 сторінок", "Позначити
сьогодні" for h-01 and "Поставити на паузу" for h-02 — the card of h-01 says `Востаннє виконано: 2 березня 2026 р.`
and `Сьогодні виконано`. The server log:

```text
OPTIONS /v1/records 204 b2569a6e-…
POST /v1/records 201 a93dcd09-…
OPTIONS /v1/records/h-01/completions 204 b195d3e8-…
POST /v1/records/h-01/completions 200 34a4f331-…
OPTIONS /v1/records/h-02 204 3d7172f7-…
PATCH /v1/records/h-02 200 4f09797a-…
```

Before the restart `check:deploy … 2026-03-02` → `summary: 7 habits, 11 completion days; streaks on 2026-03-02: sum 8,
longest 4, 1f7a1d6ed3c4`; `kill -TERM` → exit code 0; the same artifact again → the same `summary:` line. The page
reloaded shows the same; a create with `{}` → `400` (`"name":"required"`); with the server stopped and the page
reloaded: `Список не завантажився (немає з’єднання)`.

The artifact 1.2.0 started with `NODE_ENV=production` on a free port and a fresh `DATA_DIR` (requests sent with
`curl`; the page sends the same):

```text
js-learning-lab-habits-server 1.2.0 (pid 32736, NODE_ENV=production) listening on http://127.0.0.1:51008
summary: 6 habits, 10 completion days; streaks on 2026-03-02: sum 7, longest 3, 1353b052a0d2
POST /v1/records/h-01/completions {"day":"2026-03-02"} → 200
{"id":"h-01","name":"%%fixture1Name%%","frequency":"daily","active":true,"completions":["2026-02-27","2026-02-28","2026-03-01","2026-03-02"]}
PATCH /v1/records/h-02 {"active":false} → 200
{"id":"h-02","name":"%%fixture2Name%%","frequency":"daily","active":false,"completions":["2026-02-26","2026-02-28","2026-03-01"]}
summary: 6 habits, 11 completion days; streaks on 2026-03-02: sum 8, longest 4, 22e15d4c4e39
```

`kill -TERM <pid>` → `SIGTERM received: …`, `Server closed. Bye.`, exit code 0; the same artifact started again on
the same folder → `summary: 6 habits, 11 completion days; streaks on 2026-03-02: sum 8, longest 4, 22e15d4c4e39`,
and `GET /v1/records?limit=50` answers h-01 and h-02 exactly as above. Two refusals after the restart:

```text
POST /v1/records, body {} → 400
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required"},"requestId":"c7e4e113-…"}}
POST /v1/records/h-01/completions, body {"day":"2026-02-30"} → 400
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"day":"bad-date"},"requestId":"d8a4fd54-…"}}
```

The log has `POST /v1/records 400` and `POST /v1/records/h-01/completions 400`, and no 5xx; the second exit code 0.

The native companion (`~/js-course/habits-native`, EVIDENCE.md, section CP-NO): the same mark → restart → reload on
the declared target — **not performed**: no emulator, simulator or phone on this computer; to come back, the RN-11
release on the declared target with `apiBaseUrl(TARGET)` and the records server started as in the runbook.

## The streak's date assumptions

- **A day is a string `YYYY-MM-DD`, not a moment.** The completions store calendar days, and `streakOf` compares
  them as strings; the day before is `previousDay`, computed in UTC from midnight, so no time zone and no summer
  time change can skip or repeat a day. A day that is not in the calendar (2026-02-30) is refused by the server
  with `bad-date` before it reaches the store.
- **Whose day it is, is decided by the caller.** Neither the server nor `streakOf` reads the clock: the page
  passes `today` in (`TODAY` in `main.tsx`, the person's local calendar day), and the server stores the day it
  was sent. A person near midnight in another time zone gets the day of their own calendar, not the server's;
  and a check — this test, `check:deploy … 2026-03-02` — counts on a fixed day, so it means the same thing
  whenever it runs and two servers can be compared.
- **A day not completed yet does not break the streak.** While `today` is not marked, the streak counts up to
  yesterday (h-01: 3 on 2026-03-02 before the mark); marking today adds it (4). A day missed before that ends it.
- **Duplicates count once.** The server adds a day through `completeHabit`, which keeps the days unique and in
  order, so a second press or a retried request leaves one entry (the test marks 2026-03-02 twice and finds it
  once); `streakOf` works on a set of days as well.
- **A pause does not touch the days.** h-02 paused keeps its three days and its streak 2; the pause is the
  `active` field, sent by `PATCH`, which merges — a `PUT` without the completions would erase them.

## A decision record — the store

Context: every confirmed change — a marked day, a pause — must survive a restart. Options: (1) write through —
every change goes to the file before the `200`/`201`, by a temp file and a rename; (2) keep the records in memory
and flush them every 10 seconds. Failure modes: (1) a crash between the write and the rename leaves the old file
and a `*.tmp`, never half a file, and never loses a confirmed change; the cost is a disk write per change. (2) a
crash loses every day marked in the last 10 s that was already confirmed — the page said "done today" about a day
that is gone, and the streak shown a moment ago drops on the next read. Choice: (1). Consequences: one process may
write the file (the write queue protects one process only); a store much bigger than now would need a database.

## Trade-offs

| Decision | Chosen | Not chosen | Evidence | I would choose otherwise if |
|---|---|---|---|---|
| storage | a JSON file, write-through, atomic rename | a cache flushed on a timer | the restart above: the same `summary:` line, h-01's four days | many writers or many thousands of records |
| cache policy | the client's copy is read again after every write | trusting the optimistic copy | `markDay` in ui/habitsCache.tsx: a refused day goes back, an accepted one reads the lists again | the list were too big to read again after each change |
| errors and retries | reads retried twice (100/200 ms), a create only with one `Idempotency-Key`, a marked day not retried by the client (the server keeps it once anyway), a `4xx` never | retrying everything | `tests/client.test.ts` (three attempts for a read, one for a 4xx, one record after a lost answer) | the server could not keep a day once |
| "today" | passed in by the caller (the page, the check) | read from the clock in the server or in `streakOf` | the test and `check:deploy` on 2026-03-02 give the same streaks on any day | the server had to decide days for clients that cannot (a scheduled job) |

## The PR description (as it would go to a reviewer)

Connects the habit tracker's web client to the local API and runs the server in production mode. To verify:
`npm test` in `server/` (89 pass); start the artifact (`RUNBOOK.md`, section 2) and the web app; mark h-01 done
today (2026-03-02), pause h-02, `kill -TERM` the server, start it again, reload — the day, the pause and the streak
4 are there, and `check:deploy -- <address> 2026-03-02` prints the same `summary:` before and after; a create with
`{}` is `400`, a day 2026-02-30 is `400`; with the server stopped the page says "no connection".

Runbook note (one more symptom for `server/RUNBOOK.md`): "a marked day vanished after a restart" — look first:
`GET /v1/records/<id>` and the `summary:` of `check:deploy -- <address> <the same fixed day>` against the last one
written down (a different day gives different streaks — that is not a loss), the log lines of the habit
(`POST /v1/records/<id>/completions 200` with a request id?), then `DATA_DIR` of the start line — a wrong folder is
the usual cause.
