# The server part: evidence

What was run in `server/` for each step of the Node.js stage, with the output seen. A step that was
not run says so, with the reason and what it takes to come back.

## NO-01 — the typed summary script

Node.js v25.2.1, npm 11.6.2, TypeScript 7.0.2, @types/node 22.20.5 (macOS). Not run on Node.js 22: on
22.13–22.17 the command is `node --experimental-strip-types src/summary.ts`.

`TODAY=2026-03-02 LOCALE=en npm run summary`:

```text
Pending tasks due on or before 2026-03-02: 2
- %%fixture2Name%% (2026-03-01)
- %%fixture1Name%% (2026-03-02)
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
Created the data file with the starting tasks: ~/js-course/planner/server/data/planner.json
Pending tasks due on or before 2026-03-02: 2
- %%fixture2Name%% (2026-03-01)
- %%fixture1Name%% (2026-03-02)
$ CRASH_BEFORE_RENAME=1 node src/complete-task.ts t-01; echo "exit $?"
exit 137
$ ls data
planner.json
planner.json.4a2bc2a4-894e-4eb0-8476-4866aca05daf.tmp
$ npm run summary
Removed a temp file left by a crash: planner.json.4a2bc2a4-894e-4eb0-8476-4866aca05daf.tmp
Pending tasks due on or before 2026-03-02: 2
- %%fixture2Name%% (2026-03-01)
- %%fixture1Name%% (2026-03-02)
$ node src/complete-task.ts t-01
Saved: t-01 is done
$ npm run summary
Pending tasks due on or before 2026-03-02: 1
- %%fixture2Name%% (2026-03-01)
$ npm run check
8 of 8 checks passed
```
