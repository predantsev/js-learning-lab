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
