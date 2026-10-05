# CP-NO — the expense tracker end to end

The checkpoint of the Node.js stage: the web client (127.0.0.1:4310), the local API (127.0.0.1:4311), the file
store, the hardening and the production-mode start, proved with real requests. Run on macOS, Node.js v25.2.1, the
Ukrainian workspace (the page text below is Ukrainian), the server from the artifact 1.2.0 with
`NODE_ENV=production` and a fresh `DATA_DIR`, the web app with `npm start` (`DATA_SOURCE=http`). The requests
without a browser below were sent to the same artifact started on a spare port (4391) with its own fresh
`DATA_DIR`, so they could not touch the store the page uses.

## The plan

| Requirement | Component | Check | Evidence |
|---|---|---|---|
| an expense added in the page is stored | web client → `POST /v1/records` → repository | add one in an existing category (fun, 150,00) | the card, `POST /v1/records 201` in the log, the record in `GET` |
| a change made in the page is stored | web client → `PUT /v1/records/:id` | change an expense's label | `PUT … 200` in the log, the new label in `GET` |
| both survive a restart | the file store (atomic rename), graceful shutdown | `kill -TERM`, start again, the same `GET` | exit code 0; the same `summary:` line before and after |
| the totals are exact | the totals computed from the server's list, integers in `amountMinor` | `check:deploy` before the add, after it, after the restart | total and fun grow by exactly 15000, the other three categories unchanged |
| the page shows the server's data after a reload | the cache reads again from the source | reload | the same card, the same totals |
| invalid input is refused, nothing stored | the edge's validation | an amount with a fraction of a kopiyka | exactly `400 VALIDATION_FAILED`, never 5xx, the same `summary:` |
| without the server the page says so | the HTTP source, errorText | stop the server, reload | "немає з’єднання", no invented list |
| the native companion does the same | the native client | on the declared target | not performed (below) |

## The evidence

`npm test` in `server/` — `ℹ tests 79`, `ℹ fail 0`; `tests/checkpoint.test.ts` runs the six checks through the web
client's own HTTP source against the real server process (started with node, stopped with SIGTERM, started
again): it adds 15000 to fun, changes only the label of e-03, restarts, and compares `summarizeExpenses` of the
new list with the one before plus 15000 in fun — `deepEqual`, no rounding.

In Chrome 154 (the artifact 1.2.0 with `NODE_ENV=production`, a fresh `DATA_DIR` on 4311; the web app with
`npm start` on 4310; the page text is Ukrainian): a new expense "Квитки в музей", 150, 2026-03-02, fun — the totals
line became `Дім: 99,90 грн · Розваги: 630,00 грн · Їжа: 1 056,00 грн · Транспорт: 520,00 грн · Разом: 2 305,90 грн`
(fun 480,00 → 630,00, the total 2 155,90 → 2 305,90). The server log:

```text
OPTIONS /v1/records 204 16703595-…
POST /v1/records 201 ed3fe700-…
```

Before the restart `check:deploy` → `summary: 7 expenses, total 230590, food 105600, transport 52000, home 9990, fun 63000
(amountMinor)`; `kill -TERM` → exit code 0; the same artifact again → the same `summary:` line. The page reloaded
shows the same; `GET /v1/records` holds `{"id":"e-07","label":"Квитки в музей","amountMinor":15000,"date":"2026-03-02","category":"fun"}`;
a create with `{}` → `400`; with the server stopped and the page reloaded: `Список не завантажився (немає з’єднання)`.



Before the add, `npm run -s check:deploy -- http://127.0.0.1:4391` →
`summary: 6 expenses, total 215590, food 105600, transport 52000, home 9990, fun 48000 (amountMinor)`. A create
(sent with `fetch` from a script; `curl` sends the same):

```text
POST /v1/records {"label":"Настолка","amountMinor":15000,"date":"2026-03-02","category":"fun"} → 201
{"id":"e-07","label":"Настолка","amountMinor":15000,"date":"2026-03-02","category":"fun"}
```

`check:deploy` then → `summary: 7 expenses, total 230590, food 105600, transport 52000, home 9990, fun 63000
(amountMinor)`: 215590 + 15000 = 230590 and 48000 + 15000 = 63000; food, transport and home did not move.
`kill -TERM <pid>` → `SIGTERM received: closing the server, waiting at most 5000 ms for the requests in flight…`,
`Server closed. Bye.`, exit code 0; the same artifact started again on the same `DATA_DIR` → the same `summary:`
line, `7 expenses, total 230590, … fun 63000`.

Three requests after the restart:

```text
GET /v1/records?limit=50&category=fun → 200
{"items":[{"id":"e-05","label":"%%fixture5Name%%","amountMinor":30000,…},{"id":"e-03","label":"%%fixture3Name%%","amountMinor":18000,…},{"id":"e-07","label":"Настолка","amountMinor":15000,"date":"2026-03-02","category":"fun"}],"nextCursor":null}
POST /v1/records, amountMinor 150.5 → 400
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"amountMinor":"not-positive-integer"},"requestId":"8c12ec31-…"}}
PUT /v1/records/e-03, amountMinor "18000" (text) → 400
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"amountMinor":"not-positive-integer"},"requestId":"c70281e8-…"}}
```

The log has `POST /v1/records 201` (the first process), `POST /v1/records 400` and `PUT /v1/records/e-03 400`
(the second), no 5xx; `check:deploy` after the refusals → the same `summary:` line. With the server stopped, the
same `GET` from the script → `rejected: TypeError: fetch failed (ECONNREFUSED)` — there is no list to show, and the
page's text for that error is `немає з’єднання` (`ui/expensesCache.tsx`, errorText).

The native companion (`~/js-course/expenses-native`, EVIDENCE.md, section CP-NO): the same add → restart →
reload on the declared target — **not performed**: no emulator, simulator or phone on this computer; to come back,
the RN-11 release on the declared target with `apiBaseUrl(TARGET)` and the records server started as in the runbook.

## Why amounts stay integers end to end

An amount is a whole number of kopiykas, `amountMinor`, everywhere it is stored or summed. The form reads the
typed text ("150", "150,00", "845,5") with `parseAmountMinor` as two whole numbers — hryvnias and kopiykas — and
never through a fractional number; the client sends `amountMinor: 15000`; the API refuses anything that is not a
positive whole number (`150.5`, `"18000"`) with 400 instead of rounding or converting it; the file stores the
integer; `totalOf` and `summarizeExpenses` add integers, and integers below 2^53 add exactly. A fractional
number would not: `0.1 + 0.2` is `0.30000000000000004`, so a sum of hryvnias as decimals can drift by a kopiyka,
and two totals that should match (the page's and `check:deploy`'s, the live store's and a restored one's) would
not compare equal. Division by 100 happens at one edge only — `formatMoney` / `formatAmount` turn a finished
integer into text for the page; nothing is stored or summed after that. That is also why the checkpoint can say
"exact": the expected totals are integer arithmetic (before + 15000), compared with `deepEqual`.

## A decision record — the store

Context: every confirmed change must survive a restart, and the totals must be the sum of exactly the stored
expenses. Options: (1) write through — every change goes to the file before the `201`/`200`, by a temp file and a
rename; (2) keep the records in memory and flush them every 10 seconds. Failure modes: (1) a crash between the
write and the rename leaves the old file and a `*.tmp`, never half a file, and never loses a confirmed change; the
cost is a disk write per change. (2) a crash loses every change of the last 10 s that was already confirmed — the
client was told "saved" about an expense that is gone, and the totals after the restart are lower than the ones
the page showed. Choice: (1). Consequences: one process may write the file (the write queue protects one process
only); every list request reads and checks the whole store (the top self time of the NO-12 profile after the
synchronous log line); a store much bigger than now would need a database (SQLite was named in NO-05 with its own
backup).

## Trade-offs

| Decision | Chosen | Not chosen | Evidence | I would choose otherwise if |
|---|---|---|---|---|
| storage | a JSON file, write-through, atomic rename | a cache flushed on a timer | NO-02's crash rehearsal (`exit 137`, the old file whole); the restart above | many writers or many thousands of expenses |
| cache policy | the client's copy is read again after every write; totals computed from the server's list | adjusting the totals in the client | NO-06: a refused change put back; the totals after a restart equal to the kopiyka | the list were too big to read again after each change |
| errors and retries | reads retried twice (100/200 ms), a create only with one `Idempotency-Key`, a `4xx` never | retrying everything | `tests/client.test.ts` (three attempts, one for a 4xx, one record after a lost answer) | the server could not deduplicate creates |

## The PR description (as it would go to a reviewer)

Connects the expense tracker's web client to the local API and runs the server in production mode. To verify:
`npm test` in `server/` (79 pass); start the artifact (`RUNBOOK.md`, section 2) and the web app; note the
`summary:` of `check:deploy`, add an expense of 150,00 in an existing category, `kill -TERM` the server, start it
again, reload — the expense is there, and `check:deploy` prints the total and that category's total grown by
exactly 15000, the other categories unchanged; a create with `amountMinor: 150.5` is `400`; with the server
stopped the page says "немає з’єднання".

Runbook note (section 7 of `server/RUNBOOK.md`, one more symptom): "the totals changed after a restart" — look
first: the `summary:` of `check:deploy` against the last one written down (which category moved, by how many
`amountMinor`), `GET /v1/records?category=<that one>` for the ids that are missing or new, their log lines
(`POST … 201` with a request id?), then `DATA_DIR` of the start line — a wrong folder is the usual cause.
