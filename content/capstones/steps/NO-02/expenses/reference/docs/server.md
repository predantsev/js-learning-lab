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
