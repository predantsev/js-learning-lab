# Test gaps and device checks — Expense tracker

What the tests prove, what only the device can prove, and where every result came from.

## Coverage

| Behaviour | Jest / Node.js | Declared target | Other platform |
|---|---|---|---|
| `summarizeExpenses`: category and overall totals in whole kopiykas | verified (`npm test`) | — | — |
| Stored data: stored JSON with amountMinor 845.5 is refused (`parseExpenseList`); `tsc` refuses text and an unknown category, not a fraction | verified (`npm test`, `npx tsc --noEmit`) | — | — |
| The row: saving an empty form shows every validation message and saves nothing | verified (`npm test`, jest-expo with React Native Testing Library) | — | — |
| Amounts are formatted as hryvnias on the device | not performed | not performed | — |
| Saved expenses survive a full restart | not performed | not performed | — |

Jest runs the components with jest-expo's stand-ins, not on a device: it does not show the real
keyboard, gestures, the screen reader, the device storage, the device's `Intl` data or the other
platform. Those are the device checks below.

## Device checks

1. Claim: Amounts are formatted as hryvnias on the device.
   Action on the target: open the list and the totals on the declared target (Hermes formats with the device's own Intl data).
   Target: the declared target of `~/js-course/native-target.md`.
   Expected observation: the same amounts as in Jest, for example 845,50 ₴ in Ukrainian; differences in spaces or the currency sign are written down.
   Result: not performed — this reference was prepared on a computer without an emulator, a simulator
   or a phone. Revisit: run it on the declared target and write here what you saw.

2. Claim: Saved expenses survive a full restart.
   Action on the target: add an expense, close the app completely, open it again.
   Target: the declared target of `~/js-course/native-target.md`.
   Expected observation: the expense and the new totals are there.
   Result: not performed — this reference was prepared on a computer without an emulator, a simulator
   or a phone. Revisit: run it on the declared target and write here what you saw.
