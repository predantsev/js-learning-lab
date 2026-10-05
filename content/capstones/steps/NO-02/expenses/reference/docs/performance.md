# Performance: one measured fix

How it was measured: `npm start`, then `http://127.0.0.1:4310/?synthetic=5000&profile#/expenses` in Chrome.
`?synthetic=5000` makes the fixture API answer with 5000 generated expenses kept only in memory;
`?profile` makes the `<Profiler id="list">` around the list print `profile list <phase> <ms>` in the
Console after every commit. React is the development build, so the numbers are larger than in
production; what matters is before against after on the same computer.

| What | Before | After |
|---|---|---|
| The list mounts with all 5000 expenses | 337.5 ms | 12.9 ms |

The cause: the list rendered a card for every record at once. The fix: the list shows 50 cards and a
"Show more" button adds the next 50 (focus moves to the first new card); a filter change starts from
the first page. No `memo`, `useMemo` or `useCallback` was added: nothing else was measured as slow.
