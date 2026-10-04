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
