# Shared code

This native project (`~/js-course/expenses-native`) and the React project (`~/js-course/expenses`) follow the
same rules. Metro, as the Expo template sets it up, bundles only files inside this folder (an import of
`../expenses/domain/expenses.ts` ends with `Unable to resolve module`), so the shared files are **copies**:
copied unchanged, never edited here.

| File here | Copied from | What it is |
|---|---|---|
| `domain/expenses.ts` | `../expenses/domain/expenses.ts` | `validateExpense`, `formatExpenseLabel`, `summarizeExpenses` and the other rules of an expense |
| `data/model.ts` | `../expenses/data/model.ts` | the contract: `parseExpenseList` checks records that come from outside |
| `data/expenses.json` | `../expenses/data/expenses.json` | the starting records e-01 … e-06 |
| `ui/expensesReducer.ts` | `../expenses/ui/expensesReducer.ts` | every change of the list as an action, and the pure reducer that applies it |
| `tests/testing.js`, `tests/domain.test.js`, `tests/model.test.js`, `tests/reducer.test.js` | `../expenses/tests/` | the course test runner and the tests of the three files above |
| `tools/mock-service.mjs` | `~/js-course/rn06-mock/mock-service.mjs` | the course's mock service (port 7310); the tests start it on a free port |

## Rules

- A rule changes in the React project first and is tested there (`npm test`); then it is copied here again.
- After every copy these commands print nothing: `diff -r ../expenses/domain domain`,
  `diff ../expenses/data/model.ts data/model.ts` and `diff ../expenses/ui/expensesReducer.ts ui/expensesReducer.ts`.
- The comments of the copies speak about the React project (its API, its pages): they stay as they are.
- The shared files import nothing from React, React Native, the DOM or a storage. `tsconfig.json` has
  `"lib": ["ESNext"]` without the DOM types, so `npx tsc --noEmit` reports `document` or `window` in them.
- Everything that depends on the platform (screens, storage, formatting for the device) lives outside
  these files.
