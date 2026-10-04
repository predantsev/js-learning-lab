# Runbook — the habit tracker's records server

Local production mode on this computer: the server runs from a verified artifact, not from `src/`, on
loopback (`127.0.0.1:4311`), with its data in `~/js-course/habits-data`. Every command below was run in the
NO-12 rehearsal (`docs/server.md`, section NO-12). Paths: `~/js-course/habits` is the project,
`~/js-course/habits-run/<version>` an unpacked artifact.

## 1. Release

1. `cd ~/js-course/habits/server && npm run ci` — typecheck, tests, then the artifact
   `artifacts/<name>-<version>.tgz` and its record `<artifact>.release.json` (commit, Node, bytes, sha256,
   `"ci": "passed"`). CI stopped (`✖ CI stopped at …`) — no artifact: fix the cause, never pack around it.
2. Keep every artifact and its record: they are what a rollback starts. An artifact is never rebuilt; a new
   one needs a new version (`npm version patch --no-git-tag-version` in `server/`, then commit).

## 2. Start

1. Check the artifact against its record: `shasum -a 256 artifacts/<artifact>` (Linux: `sha256sum`) prints
   the `sha256` of the record. A different sum — stop: that is not the artifact CI made.
2. `mkdir -p ~/js-course/habits-run/<version> && tar -xzf artifacts/<artifact> -C ~/js-course/habits-run/<version>`
3. `cd ~/js-course/habits-run/<version>/package && NODE_ENV=production PORT=4311 DATA_DIR=$HOME/js-course/habits-data node server/src/server.js`
4. The start line names the version and the pid: `js-learning-lab-habits-server <version> (pid …, NODE_ENV=production) listening on http://127.0.0.1:4311`.
   An invalid setting stops the start with every problem and exit code 1 — read the lines, fix `.env`/the
   command, start again.
5. `curl -sS http://127.0.0.1:4311/readyz` → `{"status":"ready"}`; `npm run -s check:deploy -- http://127.0.0.1:4311 2026-03-01`
   (in `~/js-course/habits/server`; the second argument is the fixed day the streaks are counted on — use the
   same day every time you compare) — every line `✔`.

## 3. Stop

`kill -TERM <pid>` (or Ctrl+C in its terminal). `/readyz` turns 503 at once, new connections are refused,
the requests in flight finish. `echo $?` in the server's terminal: `0` — drained; `1` — the deadline
(`SHUTDOWN_DEADLINE_MS`, 5000 ms by default) passed and connections were cut: look in the log for the
requests without a final line and repeat them if they were writes with an `Idempotency-Key`.

## 4. Watch

- `GET /livez` — the process answers. `GET /readyz` — it can serve (the store reads, no shutdown).
- `GET /metrics` — per route: `http_requests_total{route,status}`, `http_errors_total{route}` (5xx),
  `http_request_duration_ms{route,quantile="0.5"|"0.95"|"0.99"}`; and `habit_completions_recorded_total` — the
  days "done" really added (a day sent again is answered 200 but not counted): it stops growing while
  `http_requests_total{route="/v1/records/:id/completions",status="200"}` grows — people press, nothing is
  recorded — look at the log of those requests. Alert: errors / requests of a one-minute
  window above 0.05 in two windows in a row (and at least 20 requests in the window). A slow p95 on one route:
  take the request id of a slow request from the log (`durationMs`) before changing any code; a CPU profile
  (`node --cpu-prof --cpu-prof-dir=profiles server/src/server.js`, then `npm run profile:top -- <file>`) is
  evidence, a guess is not. Never `--inspect` on a server people use: a pause stops everyone.

## 5. Backup and the restore drill

1. With no writes going on: `DATA_DIR=$HOME/js-course/habits-data npm run -s backup` (in `server/`) — a copy
   with a manifest in `<DATA_DIR>/backups/`, verified by a restore into a scratch folder.
2. The drill, into a NEW folder, never over the live one, on a fixed day:
   `TODAY=2026-03-01 DATA_DIR=$HOME/js-course/habits-data npm run -s restore-drill -- $HOME/js-course/habits-drill`
   — the live store and the restored one must answer the same: count, ids, completion days and the streak of
   every habit on that day. Without `TODAY` the drill refuses: a streak counted on two different days differs.
3. Start the same artifact on the restored folder on `PORT=4312` and compare
   `npm run -s check:deploy -- http://127.0.0.1:4311 2026-03-01` with `… http://127.0.0.1:4312 2026-03-01`: the
   same `summary:` line.
   Stop the drill server; delete the drill folder.

## 6. Upgrade

One change per version, on a branch: change, `npm version minor|patch --no-git-tag-version` in `server/`,
commit, `npm run ci`, then section 2 for the new artifact, and `npm run -s check:deploy -- <address> <day>` right
after the start.
The previous artifact and its unpacked folder stay where they are until the new one has run a day.

## 7. Incident — "the list of active habits shows paused ones" (a symptom after a deploy)

**Signal.** `npm run check:deploy` after a start prints `✖ ?active=true answers only active habits`, or a
person sees paused habits under the "active" filter, or `http_errors_total` grows on a route.

**Checks, in order — look, change nothing yet:**
1. `curl -sS http://127.0.0.1:4311/readyz` — ready? (503 "not ready": the store; see section 5.)
2. The log lines of the failing requests: their request id, route, status — a 5xx or a 200 with wrong data?
3. The release record of the running version: which commit, `"ci"` — `"passed"` or `"skipped"`? When did it
   start? Is the previous artifact still in `artifacts/` with its record?

**Decision.** The previous version worked and is kept → roll back now, fix forward later on a branch. No
previous artifact → fix forward (a new version through CI).

**Data check before the rollback.** Rolling the code back does not roll the data back. `node -e` or a look at
`<DATA_DIR>/habits.json`: `"schemaVersion"` must be one the previous version knows (1.0.0 knows 2). A newer
version → restore the backup taken before the upgrade, and only if nothing was written since; otherwise fix
forward.

**Rollback.**
1. `kill -TERM <pid of the new version>`; `echo $?` → 0.
2. `shasum -a 256 artifacts/<previous artifact>` equals the `sha256` of its record.
3. Restore the data only if the data check said so.
4. Start the previous version from its folder (section 2, step 3).

**Confirm recovery.** `/readyz` 200; `npm run -s check:deploy -- http://127.0.0.1:4311 2026-03-01` — every line `✔`; the
error rate of the next full window below 0.05. Write down what happened, when, and what brought it back.
