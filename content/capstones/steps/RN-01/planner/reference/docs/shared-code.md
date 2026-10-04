# Shared code

This native project (`~/js-course/planner-native`) and the React project (`~/js-course/planner`) follow the
same rules. Metro, as the Expo template sets it up, bundles only files inside this folder (an import of
`../planner/domain/tasks.ts` ends with `Unable to resolve module`), so the shared files are **copies**:
copied unchanged, never edited here.

| File here | Copied from | What it is |
|---|---|---|
| `domain/tasks.ts` | `../planner/domain/tasks.ts` | `validateTask`, `formatTaskLabel`, `countDueTasks` and the other rules of a task |
| `data/model.ts` | `../planner/data/model.ts` | the contract: `parseTaskList` checks records that come from outside |
| `data/tasks.json` | `../planner/data/tasks.json` | the starting records t-01 … t-06 |
| `tests/testing.js`, `tests/domain.test.js`, `tests/model.test.js` | `../planner/tests/` | the course test runner and the tests of the two files above |

## Rules

- A rule changes in the React project first and is tested there (`npm test`); then it is copied here again.
- After every copy both commands print nothing:
  `diff -r ../planner/domain domain` and `diff ../planner/data/model.ts data/model.ts`.
- The shared files import nothing from React, React Native, the DOM or a storage. `tsconfig.json` has
  `"lib": ["ESNext"]` without the DOM types, so `npx tsc --noEmit` reports `document` or `window` in them.
- Everything that depends on the platform (screens, storage, formatting for the device) lives outside
  these files.
