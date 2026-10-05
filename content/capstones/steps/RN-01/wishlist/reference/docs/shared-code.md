# Shared code

This native project (`~/js-course/wishlist-native`) and the React project (`~/js-course/wishlist`) follow the
same rules. Metro, as the Expo template sets it up, bundles only files inside this folder (an import of
`../wishlist/domain/wishes.ts` ends with `Unable to resolve module`), so the shared files are **copies**:
copied unchanged, never edited here.

| File here | Copied from | What it is |
|---|---|---|
| `domain/wishes.ts` | `../wishlist/domain/wishes.ts` | `validateItem`, `formatItemLabel`, `summarizeItems` and the other rules of a wish |
| `data/model.ts` | `../wishlist/data/model.ts` | the contract: `parseItemList` checks records that come from outside |
| `data/wishes.json` | `../wishlist/data/wishes.json` | the starting records w-01 … w-06 |
| `tests/testing.js`, `tests/domain.test.js`, `tests/model.test.js` | `../wishlist/tests/` | the course test runner and the tests of the two files above |

## Rules

- A rule changes in the React project first and is tested there (`npm test`); then it is copied here again.
- After every copy both commands print nothing:
  `diff -r ../wishlist/domain domain` and `diff ../wishlist/data/model.ts data/model.ts`.
- The shared files import nothing from React, React Native, the DOM or a storage. `tsconfig.json` has
  `"lib": ["ESNext"]` without the DOM types, so `npx tsc --noEmit` reports `document` or `window` in them.
- Everything that depends on the platform (screens, storage, formatting for the device) lives outside
  these files.
