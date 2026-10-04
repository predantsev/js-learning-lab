# Boundary review: server and client

A design review on paper. Nothing here runs on a server yet: the project is still rendered only in
the browser (`createRoot` in `main.tsx`). The server render and hydration are checked for real in
the Node.js stage (NO-13).

## The component tree

`server` = could render on a server: it only turns the data it is given into markup.
`client` = needs the browser: state, effects, event handlers, browser objects.

```
App                              client  history from location.hash (createHashHistory)
└─ TasksCacheProvider            client  state, effects, AbortController, invalidation
   └─ Router · Routes            client  subscribes to popstate
      ├─ TasksLayout             server  h1, pitch, image; only the outlet below changes
      │  └─ ScreenBoundary       client  an error boundary with a "Try again" button
      ├─ TasksScreen (today)     client  filter, search text, useTransition, mutations
      │  ├─ TaskForm (add)       client  controlled fields, priority <select>, validation
      │  ├─ "due as of" line     server  countDueTasks(list, today) with today passed in
      │  ├─ filter + search      client
      │  ├─ QueryState           client  the retry button
      │  └─ TaskList             server  the cards' markup, given the tasks
      │     └─ TaskCard          server  title, due date, priority text
      │        ├─ done toggle    client  onToggle, optimistic change
      │        └─ delete + confirm client
      ├─ TaskDetail              server  one task (once the task comes as a prop)
      ├─ TaskEdit → TaskForm     client  draft, priority <select>, useBlocker
      ├─ SummaryRoute (today)    client  lazy(), Suspense, retry state
      │  └─ DueToday (today)     server  the tasks due exactly on the day it is given
      └─ NotFound                server
```

The marks describe the design, not today's code. Today every "server" component either reads its
data through a hook (`use…List`) or takes handlers as props, so it runs in the browser; to render on a
server, it would take its tasks as props from a server parent, and the interactive parts (the
toggles, the delete button) would become small client components inside it.

## Never crosses to the client

- **Storage access.** `data/api.ts` (the fixture API, which reads and writes `localStorage` through
  `storage/tasks.ts`) and `storage/` stay where the data lives. A client component gets tasks as data,
  never the store.
- **Any future API key or secret.** Today the project has none. A key would live in `.env`, be read
  with `process.env` on the server only, and never be imported by a file that `main.tsx` imports:
  esbuild bundles every imported file into `dist/`, which is public.
- **Functions as props from a server component.** `onToggle`, `onRemove`, `onSave` and the like are
  created inside client components; a server component passes data only (`Task` objects are plain
  JSON: strings, numbers, booleans, null).
- **Browser-only modules.** `ui/router.tsx` (`location.hash`, `window.history`), `ui/profile.ts` and
  `data/api.ts` (`location.search` and `localStorage` read when the module is loaded) would throw on a
  server. The hash part of an address (`#/planner/…`) is never sent to a server either, so server
  rendering needs path routes (`/planner/…`) first.

## One predicted hydration risk: "today" taken from the clock instead of the passed-in day

Today the day comes in as a prop: `main.tsx` passes `TODAY`, and `TasksScreen`, `SummaryRoute`
and `DueToday` only read it, so a server and a client given the same day render the same text.
The risk is the tempting shortcut `const today = new Date().toISOString().slice(0, 10)` inside a
component. Measured: Node.js on this computer reports the zone `Europe/Madrid`, a Chrome context
can be in `Pacific/Auckland`; `toISOString` is UTC, the readers' calendars are not, and the server
renders minutes or hours before the browser hydrates.

**Prediction:** around midnight (and all day for readers far from the server's zone) the server
counts "due as of" and "due today" for one day and the client for another: `countDueTasks` gives a
different number and React 19 reports a hydration mismatch on that line.
**Way out (to try in NO-13):** keep passing the day in — decided once on the server and sent with
the HTML — and never read the clock during render.

## How NO-13 will check it

Render the same component with the same data in Node.js (`renderToString`), put the HTML into the
page, hydrate it in Chrome with `hydrateRoot`, and read the Console: a mismatch shows as a
recoverable hydration error naming the differing text. Then apply the way out and see the error gone.
Until then this is a prediction (unconfirmed): only the formatter outputs and the zones above were
measured.
