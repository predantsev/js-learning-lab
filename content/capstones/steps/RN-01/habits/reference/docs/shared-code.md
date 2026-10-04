# Shared code

This native project (`~/js-course/habits-native`) and the React project (`~/js-course/habits`) follow the
same rules. Metro, as the Expo template sets it up, bundles only files inside this folder (an import of
`../habits/domain/habits.ts` ends with `Unable to resolve module`), so the shared files are **copies**:
copied unchanged, never edited here.

| File here | Copied from | What it is |
|---|---|---|
| `domain/habits.ts` | `../habits/domain/habits.ts` | `validateHabit`, `formatHabitLabel`, `summarizeHabit` and the other rules of a habit |
| `data/model.ts` | `../habits/data/model.ts` | the contract: `parseHabitList` checks records that come from outside |
| `data/habits.json` | `../habits/data/habits.json` | the starting records h-01 … h-06 |
| `tests/testing.js`, `tests/domain.test.js`, `tests/model.test.js` | `../habits/tests/` | the course test runner and the tests of the two files above |

## Rules

- A rule changes in the React project first and is tested there (`npm test`); then it is copied here again.
- After every copy both commands print nothing:
  `diff -r ../habits/domain domain` and `diff ../habits/data/model.ts data/model.ts`.
- The shared files import nothing from React, React Native, the DOM or a storage. `tsconfig.json` has
  `"lib": ["ESNext"]` without the DOM types, so `npx tsc --noEmit` reports `document` or `window` in them.
- Everything that depends on the platform (screens, storage, formatting for the device) lives outside
  these files.
