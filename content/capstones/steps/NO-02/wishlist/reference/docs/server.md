# The server part: evidence

What was run in `server/` for each step of the Node.js stage, with the output seen. A step that was
not run says so, with the reason and what it takes to come back.

## NO-01 — the typed summary script

Node.js v25.2.1, npm 11.6.2, TypeScript 7.0.2, @types/node 22.20.5 (macOS). Not run on Node.js 22: on
22.13–22.17 the command is `node --experimental-strip-types src/summary.ts`.

`LOCALE=en npm run summary`:

```text
Wishes: 6
Still wanted for: UAH 365
Wanted without a price: 1
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
Created the data file with the starting wishes: ~/js-course/wishlist/server/data/wishlist.json
Wishes: 6
Still wanted for: UAH 365
Wanted without a price: 1
$ CRASH_BEFORE_RENAME=1 node src/acquire.ts w-02; echo "exit $?"
exit 137
$ ls data
wishlist.json
wishlist.json.883e5938-c44b-4aa0-98c0-debac1f29ceb.tmp
$ npm run summary
Removed a temp file left by a crash: wishlist.json.883e5938-c44b-4aa0-98c0-debac1f29ceb.tmp
Wishes: 6
Still wanted for: UAH 365
Wanted without a price: 1
$ node src/acquire.ts w-02
Saved: w-02 is acquired
$ npm run summary
Wishes: 6
Still wanted for: UAH 320
Wanted without a price: 1
$ npm run check
8 of 8 checks passed
```
