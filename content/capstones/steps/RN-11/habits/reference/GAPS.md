# Test gaps and device checks — Habit tracker

What the tests prove, what only the device can prove, and where every result came from.

## Coverage

| Behaviour | Jest / Node.js | Declared target | Other platform |
|---|---|---|---|
| `streakOf, completeHabit`: the streak ending on a fixed day; completions unique and sorted | verified (`npm test`) | — | — |
| Stored data: stored JSON with the frequency "monthly" is refused (`parseHabitList`); `tsc` refuses it in code | verified (`npm test`, `npx tsc --noEmit`) | — | — |
| The row: the completion button, found by its label, marks today and disappears | verified (`npm test`, jest-expo with React Native Testing Library) | — | — |
| Reduce motion removes the movement, not the result | not performed | not performed | — |
| Saved habits survive a full restart | not performed | not performed | — |

Jest runs the components with jest-expo's stand-ins, not on a device: it does not show the real
keyboard, gestures, the screen reader, the device storage, the device's `Intl` data or the other
platform. Those are the device checks below.

## Device checks

1. Claim: Reduce motion removes the movement, not the result.
   Action on the target: turn on reduce motion in the system settings, swipe an active habit.
   Target: the declared target of `~/js-course/native-target.md`.
   Expected observation: the row only fades, and it is marked for today.
   Result: not performed — this reference was prepared on a computer without an emulator, a simulator
   or a phone. Revisit: run it on the declared target and write here what you saw.

2. Claim: Saved habits survive a full restart.
   Action on the target: mark a habit for today, close the app completely, open it again.
   Target: the declared target of `~/js-course/native-target.md`.
   Expected observation: "Completed today" is still there.
   Result: not performed — this reference was prepared on a computer without an emulator, a simulator
   or a phone. Revisit: run it on the declared target and write here what you saw.
