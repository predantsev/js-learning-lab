# Native evidence — Habit tracker

The declared target is in `~/js-course/native-target.md`. Every check below is about that target.
A check that was not done on it says so: what was not done, why, and what it takes to come back.
It never carries a result.

## RN-01 — hello screen

On the computer (done):

- `npx expo install --check` — Dependencies are up to date
- `npx tsc --noEmit` — no output, exit code 0
- `npm test` — 18 passed, 0 failed
- `npx expo export --platform android` — Android Bundled 2246ms index.ts (583 modules)
- `npx expo export --platform ios` — iOS Bundled 1669ms index.ts (585 modules)

On the target (not performed):

- Check: the hello screen shows h-01 through `formatHabitLabel` and the platform name
- Target: none — this reference was prepared on a computer without an emulator, a simulator or a phone
- Reason: no native target was available
- Revisit: `npm start`, open the app in Expo Go on the declared target, then replace this record with
  Target, Build mode, Expo SDK, Log line and Screenshot from that run

## RN-02 — native screens

On the computer (done):

- `npx expo install react-native-safe-area-context` — ~5.7.0 in package.json; `npx expo install --check` — Dependencies are up to date
- `npx tsc --noEmit` — no output, exit code 0
- `npm test` — 22 passed, 0 failed
- `npx expo export --platform android` — Android Bundled 1932ms index.ts (598 modules)
- `npx expo export --platform ios` — iOS Bundled 1780ms index.ts (600 modules)

On the target (not performed):

- Check: the header text below the status bar and the notch, the focused field above the keyboard, the labels and the error focus with the screen reader, the rows at the largest system font size
- Target: none — this reference was prepared on a computer without an emulator, a simulator or a phone
- Reason: no native target was available
- Revisit: `npm start` on the declared target with the screen reader (TalkBack or VoiceOver) and the largest font size turned on, then replace this record with what you saw and a screenshot

## RN-03 — native CRUD

On the computer (done):

- `npx tsc --noEmit` — no output, exit code 0
- `npm test` — 30 passed, 0 failed (also under TZ=Pacific/Kiritimati and TZ=Pacific/Pago_Pago, and with the English strings)
- the copies are unchanged: `diff` of `domain/`, `data/model.ts` and the reducer prints nothing
- `npx expo export --platform android` — Android Bundled 2043ms index.ts (602 modules)
- `npx expo export --platform ios` — iOS Bundled 1932ms index.ts (604 modules)

On the target (not performed):

- Check: create, edit, pause/resume, mark today (the device's date) and delete with the confirmation in the FlatList
- Target: none — this reference was prepared on a computer without an emulator, a simulator or a phone
- Reason: no native target was available
- Revisit: `npm start` on the declared target: create, edit, mark and delete records, type with the on-screen keyboard (return key, numeric keyboard), then replace this record with what you saw

## RN-04 — navigation

On the computer (done):

- `npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens` — ^7.5.0, ^7.20.0, ~4.26.0 in package.json; `npx expo install --check` — Dependencies are up to date
- `npx tsc --noEmit` — no output, exit code 0
- `npm test` — 37 passed, 0 failed (links, repository, unsaved-change check)
- `npx expo export --platform android` — Android Bundled 2199ms index.ts (839 modules)
- `npx expo export --platform ios` — iOS Bundled 2235ms index.ts (844 modules)

On the target (not performed):

- Check: the list → detail → edit stack, the question before leaving an edited name or frequency, the synthetic link to h-01 (cold start and while running), today's completion state after a return to the foreground
- Target: none — this reference was prepared on a computer without an emulator, a simulator or a phone
- Reason: no native target was available
- Revisit: `npm start` on the declared target: open the synthetic link from the computer (`npx uri-scheme open "exp://<address of npm start>/--/habit/h-01" --android` or `--ios`), try the header back, Android Back or the iOS swipe on an edited form, send the app to the background and back, then replace this record with what you saw

## RN-05 — persistence

On the computer (done):

- `npx expo install @react-native-async-storage/async-storage` — 2.2.0 in package.json; `npx expo install --check` — Dependencies are up to date
- `npx tsc --noEmit` — no output, exit code 0
- `npm test` — 43 passed, 0 failed (the supplied data/legacy-v0.json migrates; newer, unknown, cut-off and broken snapshots are refused; a damaged one goes under the backup key)
- `npx expo export --platform android` — Android Bundled 2207ms index.ts (848 modules)
- `npx expo export --platform ios` — iOS Bundled 2297ms index.ts (853 modules)

On the target (not performed):

- Check: the records after a full restart of the app, the seeded legacy v0 snapshot shown migrated, the seeded damaged snapshot set aside with the notice and the starting list
- Target: none — this reference was prepared on a computer without an emulator, a simulator or a phone
- Reason: no native target was available
- Revisit: `npm start` on the declared target: change a record and close the app completely, open it again; then SEED = 'legacy-v0' and 'corrupt' in src/seed.ts with a reload (r), and SEED = 'none' again; replace this record with what you saw

## RN-06 — network

On the computer (done):

- `node tools/mock-service.mjs` — Mock service listening on http://127.0.0.1:7310; `curl -sS http://127.0.0.1:7310/health` — {"ok":true}
- `npx tsc --noEmit` — no output, exit code 0
- `npm test` — 50 passed, 0 failed (against the real mock service: success, fail=2 → third attempt, fail=5 → three requests and no data, hang=1 → timeout, invalid=1 and a stopped service → bundled records, an abort stops at once)
- `npx expo export --platform android` — Android Bundled 1946ms index.ts (852 modules)
- `npx expo export --platform ios` — iOS Bundled 1853ms index.ts (857 modules)

On the target (not performed):

- Check: the service screen on the declared target: the records from the service and a [mock] line in the service's log, the bundled records with the service stopped, no data and “try again” with REHEARSAL = "fail=5&key=…", the request aborted when the screen loses the focus
- Target: none — this reference was prepared on a computer without an emulator, a simulator or a phone
- Reason: no native target was available
- Revisit: `node tools/mock-service.mjs` (with `--host 0.0.0.0` for a phone on Wi-Fi), TARGET in src/devConfig.ts, `npm start` on the declared target, open the service screen and rehearse the failures with REHEARSAL; replace this record with what you saw and the service's log lines

## RN-10 — swipe, motion and a measured list

On the computer (done):

- `npx expo install react-native-gesture-handler` — ~2.32.0 in package.json; `npx expo install --check` — Dependencies are up to date
- `npx tsc --noEmit` — no output, exit code 0
- `npm test` — 53 passed, 0 failed (the swipe rule, the undo through the repository, the synthetic records through the contract)
- `npx expo export --platform android` — Android Bundled 2117ms index.ts (945 modules)
- `npx expo export --platform ios` — iOS Bundled 2127ms index.ts (949 modules)

On the target (not performed):

- Check: the swipe on a row and the same action from the screen reader's actions menu, the undo bar, the slide replaced by a fade with reduce motion on, the list still scrolling vertically, the release measurement of docs/PERF.md before and after one fix
- Target: none — this reference was prepared on a computer without an emulator, a simulator or a phone
- Reason: no native target was available
- Revisit: `npm start` on the declared target for the swipe, the undo and reduce motion; SYNTHETIC_COUNT in src/devConfig.ts and a release build (`npx expo run:android --variant release` or `npx expo run:ios --configuration Release`) for docs/PERF.md; replace this record with what you saw and the numbers
