# Native evidence — Planner

The declared target is in `~/js-course/native-target.md`. Every check below is about that target.
A check that was not done on it says so: what was not done, why, and what it takes to come back.
It never carries a result.

## RN-01 — hello screen

On the computer (done):

- `npx expo install --check` — Dependencies are up to date
- `npx tsc --noEmit` — no output, exit code 0
- `npm test` — 20 passed, 0 failed
- `npx expo export --platform android` — Android Bundled 2404ms index.ts (583 modules)
- `npx expo export --platform ios` — iOS Bundled 1708ms index.ts (585 modules)

On the target (not performed):

- Check: the hello screen shows t-01 through `formatTaskLabel` and the platform name
- Target: none — this reference was prepared on a computer without an emulator, a simulator or a phone
- Reason: no native target was available
- Revisit: `npm start`, open the app in Expo Go on the declared target, then replace this record with
  Target, Build mode, Expo SDK, Log line and Screenshot from that run
