# Test gaps and device checks — Planner

What the tests prove, what only the device can prove, and where every result came from.

## Coverage

| Behaviour | Jest / Node.js | Declared target | Other platform |
|---|---|---|---|
| `countDueTasks`: the count of pending tasks due on or before a fixed day | verified (`npm test`) | — | — |
| Stored data: stored JSON with the priority "urgent" is refused (`parseTaskList`); `tsc` refuses it in code | verified (`npm test`, `npx tsc --noEmit`) | — | — |
| The row: the done toggle, found by its label, marks the task done | verified (`npm test`, jest-expo with React Native Testing Library) | — | — |
| The deep link to a task opens it | not performed | not performed | — |
| The due count follows the clock after a return to the app | not performed | not performed | — |

Jest runs the components with jest-expo's stand-ins, not on a device: it does not show the real
keyboard, gestures, the screen reader, the device storage, the device's `Intl` data or the other
platform. Those are the device checks below.

## Device checks

1. Claim: The deep link to a task opens it.
   Action on the target: with the app closed, `npx uri-scheme open "exp://<address of npm start>/--/task/t-02" --android` (or `--ios`); then again with the app open.
   Target: the declared target of `~/js-course/native-target.md`.
   Expected observation: the detail of t-02 both times; `…/task/t-99` shows the not-found state.
   Result: not performed — this reference was prepared on a computer without an emulator, a simulator
   or a phone. Revisit: run it on the declared target and write here what you saw.

2. Claim: The due count follows the clock after a return to the app.
   Action on the target: leave the app in the background across midnight (or change the device date), come back.
   Target: the declared target of `~/js-course/native-target.md`.
   Expected observation: the due line shows the new day and its count.
   Result: not performed — this reference was prepared on a computer without an emulator, a simulator
   or a phone. Revisit: run it on the declared target and write here what you saw.
