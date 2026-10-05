# Boundary review: server and client

A design review on paper. Nothing here runs on a server yet: the project is still rendered only in
the browser (`createRoot` in `main.tsx`). The server render and hydration are checked for real in
the Node.js stage (NO-13).

## The component tree

`server` = could render on a server: it only turns the data it is given into markup.
`client` = needs the browser: state, effects, event handlers, browser objects.

```
App (today, days)                client  history from location.hash (createHashHistory)
└─ HabitsCacheProvider           client  state, effects, AbortController, invalidation
   └─ Router · Routes            client  subscribes to popstate
      ├─ HabitsLayout            server  h1, pitch, image; only the outlet below changes
      │  └─ ScreenBoundary       client  an error boundary with a "Try again" button
      ├─ HabitsScreen (today, days) client  filter, search text, useTransition, mutations
      │  ├─ HabitForm (add)      client  controlled fields, validation
      │  ├─ rates line           server  formatRates(list, days) with days passed in
      │  ├─ filter + search      client
      │  ├─ QueryState           client  the retry button
      │  └─ HabitList            server  the cards' markup, given the habits
      │     └─ HabitCard         server  name, frequency, completions count
      │        ├─ "mark today"   client  onMarkToday(habit, today), optimistic change
      │        ├─ active toggle  client  pause / resume
      │        └─ delete + confirm client
      ├─ HabitDetail (today)     server  the dated completions (once the habit comes as a prop)
      ├─ HabitEdit → HabitForm   client  draft, useBlocker
      ├─ SummaryRoute (today, days) client  lazy(), Suspense, retry state
      │  └─ HabitStreaks         server  summarizeHabit(habit, days), streakOf(completions, today)
      └─ NotFound                server
```

The marks describe the design, not today's code. Today every "server" component either reads its
data through a hook (`use…List`) or takes handlers as props, so it runs in the browser; to render on a
server, it would take its habits as props from a server parent, and the interactive parts (the
toggles, the delete button) would become small client components inside it.

## Never crosses to the client

- **Storage access.** `data/api.ts` (the fixture API, which reads and writes `localStorage` through
  `storage/habits.ts`) and `storage/` stay where the data lives. A client component gets habits as data,
  never the store.
- **Any future API key or secret.** Today the project has none. A key would live in `.env`, be read
  with `process.env` on the server only, and never be imported by a file that `main.tsx` imports:
  esbuild bundles every imported file into `dist/`, which is public.
- **Functions as props from a server component.** `onToggle`, `onRemove`, `onSave` and the like are
  created inside client components; a server component passes data only (`Habit` objects are plain
  JSON: strings, numbers, booleans, null).
- **Browser-only modules.** `ui/router.tsx` (`location.hash`, `window.history`), `ui/profile.ts` and
  `data/api.ts` (`location.search` and `localStorage` read when the module is loaded) would throw on a
  server. The hash part of an address (`#/habits/…`) is never sent to a server either, so server
  rendering needs path routes (`/habits/…`) first.

## One predicted hydration risk: the streak computed with the client's current day

Today the day comes in as a prop: `main.tsx` passes `TODAY` and `LAST_DAYS`, and
`streakOf(completions, today)` and `summarizeHabit(habit, days)` only read them. The risk is computing
the day inside a component with `new Date()`. Measured: Node.js on this computer reports the zone
`Europe/Madrid`, a Chrome context can be in `Pacific/Auckland`, and the server renders before the
browser hydrates.

**Prediction:** when the two days differ, `streakOf` counts from a different day — a habit last completed
yesterday has streak 1 on the server and 0 on a client that is already one day further — and React
19 reports a hydration mismatch on the streak text.
**Way out (to try in NO-13):** decide the day once on the server, send it with the HTML and pass it
in; never read the clock during render.

## How NO-13 will check it

Render the same component with the same data in Node.js (`renderToString`), put the HTML into the
page, hydrate it in Chrome with `hydrateRoot`, and read the Console: a mismatch shows as a
recoverable hydration error naming the differing text. Then apply the way out and see the error gone.
Until then this is a prediction (unconfirmed): only the formatter outputs and the zones above were
measured.
