# Measuring the long list (RN-10)

How: `SYNTHETIC_COUNT` in `src/devConfig.ts` (1000; 500 for the habit tracker) starts the app with
`makeSyntheticExpenses` in a memory storage, and the list shows a measure button: the fixed scroll script
(600 points every 500 ms, 20 times) runs together with the JS frame meter for 10 seconds. Three runs,
the median. The build is named exactly: release (`npx expo run:android --variant release` or
`npx expo run:ios --configuration Release`) or, in Expo Go, "production JS in Expo Go"
(`npx expo start --no-dev --minify`) — not release.

Target: not measured — this reference was prepared on a computer without an emulator, a simulator or a phone
Dataset: 1000 synthetic records, the 10-second scroll script, started at the top

| Build | JS fps | Long frames | Worst ms | Janky frames (gfxinfo) | Memory (meminfo TOTAL, PSS) |
|---|---|---|---|---|---|
| before the fix | not measured | not measured | not measured | not measured | not measured |
| after the fix | not measured | not measured | not measured | not measured | not measured |

The change in this reference: the "reduce motion" setting is read once per list screen
(`useReducedMotion` in the screen, passed to every `SwipeRow`) instead of one listener per row, and the
swipe runs JavaScript only when the gesture ends. Its effect was not measured here; on a target, measure
first and fix the issue your numbers show.

Not measured: UI frames (no Instruments or gfxinfo run), the other platform.
