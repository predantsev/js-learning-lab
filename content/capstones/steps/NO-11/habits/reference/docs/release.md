# Release 1.0.0

## The artifact

`npm run release` builds `releases/1.0.0/` — a complete static site, built from the commit tagged
`v1.0.0` (the folder itself is not in Git: it is rebuilt from the tag). The file names below are from
our Ukrainian build; yours have other hashes.

| File | Size | What it is |
|---|---|---|
| `index.html` | | the page; its script tag names `dist/app-H4WM2F5V.js` |
| `dist/app-H4WM2F5V.js` | 233,053 bytes | the app, minified, React's production build |
| `dist/chunk-JX526QYA.js` | 24,396 bytes | code shared with the lazy route |
| `dist/HabitStreaks-JFN2227D.js` | 926 bytes | the lazy summary route |
| `dist/*.js.map` | | source maps, for reading a stack trace of the minified code |
| `styles.css`, `images/`, `data/habits.json` | | the styles, the image and the starting records (fetched at run time) |

Checks of the artifact: `grep -c "4310" releases/1.0.0/dist/*.js` — `0` in every file (nothing from
`.env` is in the bundle); no file names `react-dom-client.development`; a second `npm run release`
refuses: `releases/1.0.0 exists already: a release is never rebuilt.`

## Local CI

`npm run ci` runs `lint → typecheck → test → release build` (into `releases/ci/`) and stops at the
first failing stage: with a seeded type error it stopped after `tsc -p .` printed
`ui/probe.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.`, and no build
was made. The user-action tests run in the browser, not in this command: `npm start`, then
`http://127.0.0.1:4310/tests.html` — `не пройшли: 0`.

## Cache rules

| Path | `cache-control` | Why |
|---|---|---|
| `/` and `index.html` | `no-cache` | it names the current files, so every visit asks for it again |
| `dist/…-[hash].js` | `public, max-age=31536000, immutable` | the name changes when the content changes |
| everything else | `no-cache` | the names do not change |

Between 0.9.0 and 1.0.0 only the app file changed (`app-3NP4E6BG.js` → `app-H4WM2F5V.js`, it carries the
version); `chunk-JX526QYA.js` and `HabitStreaks-JFN2227D.js` kept their names, so a browser that has them keeps them.

## The walk-through on 1.0.0

`npm run preview` (stop `npm start` first: the same address `http://127.0.0.1:4310`, so the same
saved data), the page says "Версія 1.0.0", no errors in the Console:

| Action | Result |
|---|---|
| Start | 6 cards |
| Create "Реліз 1.0.0" | 7 cards |
| Edit the name, reload | the card "Реліз 1.0.0 (змінено)" |
| Filter "активні" | 6 cards |
| "Серії звичок" for the fixed day 2026-03-02 | "Пити воду — виконано: 25% · серія, днів: 1", … |
| Delete with the confirmation, reload | 6 cards |

## Rollback

1. Stop the preview (Ctrl+C).
2. `npm run preview -- 0.9.0` — serves the previous release folder; nothing is rebuilt.
3. Open `http://127.0.0.1:4310/#/habits`: the page says "Версія 0.9.0".
4. To return: stop it and `npm run preview`.

Rehearsed: a record "Перевірка відкату" saved on 1.0.0 was there on 0.9.0 (7 cards, no errors) and
again on 1.0.0. This works because both releases read the same storage key in the same format; a
release that changed the stored format would need its own way back for the data — not rehearsed.
A lost `releases/0.9.0/` would have to be rebuilt from its source — not rehearsed either.
