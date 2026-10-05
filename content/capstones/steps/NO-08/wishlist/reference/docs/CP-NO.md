# CP-NO — the wishlist end to end

The checkpoint of the Node.js stage: the web client (127.0.0.1:4310), the local API (127.0.0.1:4311), the file
store, the hardening and the production-mode start, proved with real requests. Run on macOS, Node.js v25.2.1, Chrome
154, the Ukrainian workspace (the page text below is Ukrainian), the server from the artifact 1.2.0 with
`NODE_ENV=production` and a fresh `DATA_DIR`, the web app with `npm start` (`DATA_SOURCE=http`).

## The plan

| Requirement | Component | Check | Evidence |
|---|---|---|---|
| a wish added in the page is stored | web client → `POST /v1/records` → repository | add one in the form | the card, `POST /v1/records 201` in the log, the record in `GET` |
| `acquired` changed in the page is stored | web client → `PATCH /v1/records/:id` | mark it acquired | `PATCH … 200` in the log, `"acquired":true` in `GET` |
| both survive a restart | the file store (atomic rename), graceful shutdown | `kill -TERM`, start again, the same `GET` | exit code 0; the same `summary:` line before and after |
| the page shows the server's data after a reload | the cache reads again from the source | reload | the same card, the same total |
| invalid input is refused, nothing stored | the edge's validation | a create with an empty name | exactly `400 VALIDATION_FAILED`, never 5xx |
| without the server the page says so | the HTTP source, errorText | stop the server, reload | "no connection", no invented list |
| the native companion does the same | the native client | on the declared target | not performed (below) |

## The evidence

`npm test` in `server/` — `ℹ tests 76`, `ℹ fail 0`; `tests/checkpoint.test.ts` runs the six checks through the web
client's own HTTP source against the real server process (started with node, stopped with SIGTERM, started again).

In Chrome, http://127.0.0.1:4310/: a new wish "Ліхтарик", 120, then "Позначити отриманим: Ліхтарик" — a card
`Ціна: 120 грн`, and the summary `Бажань: 7 · Ще хочу на суму: 365 грн · Без ціни: 1` (the new wish is acquired, so
the wanted total is the starting one).
The server log (one JSON line per request; method, route, status, request id):

```text
OPTIONS /v1/records 204 da8f0895-…
POST /v1/records 201 ea994dd6-…
OPTIONS /v1/records/w-07 204 d50a411c-…
PATCH /v1/records/w-07 200 56ba31bb-…
```

Before the restart `npm run -s check:deploy -- http://127.0.0.1:4311` → `summary: 7 wishes, wanted total 365, without
a price 1`; `kill -TERM <pid>` → `SIGTERM received: …`, `Server closed. Bye.`, exit code 0; the same artifact started
again → the same `summary:` line. The page reloaded: the card is there, acquired, the same total.

Two requests after the restart (sent with `fetch` from a script; `curl` sends the same):

```text
GET /v1/records?limit=50 → the new record
{"id":"w-07","name":"Ліхтарик","price":120,"acquired":true,"category":null}
POST /v1/records, content-type application/json, body {} → 400
{"error":{"code":"VALIDATION_FAILED","messageKey":"errors.validationFailed","details":{"name":"required"},"requestId":"58f3f4b5-…"}}
```

The log has `POST /v1/records 400`. With the server stopped and the page reloaded: `Список не завантажився (немає
з’єднання)` — the page shows no list rather than an invented one.

The native companion (`~/js-course/wishlist-native`, EVIDENCE.md, section CP-NO): the same create → restart →
reload on the declared target — **not performed**: no emulator, simulator or phone on this computer; to come back,
the RN-11 release on the declared target with `apiBaseUrl(TARGET)` and the records server started as in the runbook.

## Why the server decides `acquired`

Two clients (the page, the native app, a second tab) can change the same wish; each has a copy, and the copies
disagree as soon as one of them changes something. Only one place can say which value is true, and it is the one
that every client asks and that survives a restart: the server's store. So the page sends the change, shows it
optimistically, and then shows what the server answered — on a refusal it puts the old value back, on success it
reads the list again. The wanted total is never kept or adjusted by the client: it is computed from the server's
list every time, so it cannot drift away from the data it sums.

## A decision record — the store

Context: every confirmed change must survive a restart. Options: (1) write through — every change goes to the file
before the `201`/`200`, by a temp file and a rename; (2) keep the records in memory and flush them every 10 seconds.
Failure modes: (1) a crash between the write and the rename leaves the old file and a `*.tmp`, never half a file, and
never loses a confirmed change; the cost is a disk write per change (a sync write is the top self time of the NO-12
profile together with the sort). (2) a crash loses every change of the last 10 s that was already confirmed — the
client was told "saved" about data that is gone. Choice: (1). Consequences: one process may write the file (the
write queue protects one process only); a store much bigger than now would need a database (SQLite was named in
NO-05 with its own backup).

## Trade-offs

| Decision | Chosen | Not chosen | Evidence | I would choose otherwise if |
|---|---|---|---|---|
| storage | a JSON file, write-through, atomic rename | a cache flushed on a timer | NO-02's crash rehearsal (`exit 137`, the old file whole); the restart above | many writers or many thousands of records |
| cache policy | the client's copy is read again after every write | trusting the optimistic copy | NO-06: the wrong `PATCH` put back; the totals after a restart | the list were too big to read again after each change |
| errors and retries | reads retried twice (100/200 ms), a create only with one `Idempotency-Key`, a `4xx` never | retrying everything | `tests/client.test.ts` (three attempts, one for a 4xx, one record after a lost answer) | the server could not deduplicate creates |

## The PR description (as it would go to a reviewer)

Connects the wishlist's web client to the local API and runs the server in production mode. To verify: `npm test`
in `server/` (76 pass); start the artifact (`RUNBOOK.md`, section 2) and the web app; add a wish, mark it acquired,
`kill -TERM` the server, start it again, reload — the wish and its mark are there, and `check:deploy` prints the
same `summary:` before and after; a create with `{}` is `400`; with the server stopped the page says "no connection".

Runbook note (section 7 of `server/RUNBOOK.md`, one more symptom): "wishes vanished after a restart" — look first:
`GET /v1/records` and the `summary:` of `check:deploy` against the last one written down, the log lines of the
missing ids (`POST … 201` with a request id?), then `DATA_DIR` of the start line — a wrong folder is the usual cause.
