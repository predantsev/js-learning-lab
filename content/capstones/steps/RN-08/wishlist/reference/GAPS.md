# Test gaps and device checks — Wishlist

What the tests prove, what only the device can prove, and where every result came from.

## Coverage

| Behaviour | Jest / Node.js | Declared target | Other platform |
|---|---|---|---|
| `summarizeItems`: the wanted total of wanted wishes with a price; wishes without a price counted apart | verified (`npm test`) | — | — |
| Stored data: stored JSON with the price as text is refused (`parseItemList`); `tsc` refuses a text price in code | verified (`npm test`, `npx tsc --noEmit`) | — | — |
| The row: the acquired toggle, found by its label, marks the wish acquired | verified (`npm test`, jest-expo with React Native Testing Library) | — | — |
| Saved wishes survive a full restart | not performed | not performed | — |
| The swipe and its accessibility action | not performed | not performed | — |

Jest runs the components with jest-expo's stand-ins, not on a device: it does not show the real
keyboard, gestures, the screen reader, the device storage, the device's `Intl` data or the other
platform. Those are the device checks below.

## Device checks

1. Claim: Saved wishes survive a full restart.
   Action on the target: mark a wish acquired, close the app completely (remove it from the recent apps), open it again.
   Target: the declared target of `~/js-course/native-target.md`.
   Expected observation: the wish is still acquired; the list is the saved one, not the starting one.
   Result: not performed — this reference was prepared on a computer without an emulator, a simulator
   or a phone. Revisit: run it on the declared target and write here what you saw.

2. Claim: The swipe and its accessibility action.
   Action on the target: swipe a wish to the left; with TalkBack or VoiceOver, use the action in the row's actions menu.
   Target: the declared target of `~/js-course/native-target.md`.
   Expected observation: the same change both ways, with the undo bar.
   Result: not performed — this reference was prepared on a computer without an emulator, a simulator
   or a phone. Revisit: run it on the declared target and write here what you saw.
