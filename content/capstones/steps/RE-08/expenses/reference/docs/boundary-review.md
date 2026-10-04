# Boundary review: server and client

A design review on paper. Nothing here runs on a server yet: the project is still rendered only in
the browser (`createRoot` in `main.tsx`). The server render and hydration are checked for real in
the Node.js stage (NO-13).

## The component tree

`server` = could render on a server: it only turns the data it is given into markup.
`client` = needs the browser: state, effects, event handlers, browser objects.

```
App                              client  history from location.hash (createHashHistory)
└─ ExpensesCacheProvider         client  state, effects, AbortController, invalidation
   └─ Router · Routes            client  subscribes to popstate
      ├─ ExpensesLayout          server  h1, pitch, image; only the outlet below changes
      │  └─ ScreenBoundary       client  an error boundary with a "Try again" button
      ├─ ExpensesScreen          client  category filter, search text, useTransition, mutations
      │  ├─ ExpenseForm (add)    client  amount text → amountMinor, date field, category <select>
      │  ├─ totals line          server  totalsByCategory + totalOf, formatted with formatMoney
      │  ├─ category filter + search client
      │  ├─ QueryState           client  the retry button
      │  └─ ExpenseList          server  the cards' markup, given the expenses
      │     └─ ExpenseCard       server  label, amount, date, category
      │        └─ delete + confirm client  optimistic removal with rollback
      ├─ ExpenseDetail           server  one expense (once the expense comes as a prop)
      ├─ ExpenseEdit → ExpenseForm client  draft, useBlocker
      ├─ SummaryRoute            client  lazy(), Suspense, retry state
      │  └─ CategoryTotals       server  totalsByCategory, totalOf, formatMoney
      └─ NotFound                server
```

The marks describe the design, not today's code. Today every "server" component either reads its
data through a hook (`use…List`) or takes handlers as props, so it runs in the browser; to render on a
server, it would take its expenses as props from a server parent, and the interactive parts (the
toggles, the delete button) would become small client components inside it.

## Never crosses to the client

- **Storage access.** `data/api.ts` (the fixture API, which reads and writes `localStorage` through
  `storage/expenses.ts`) and `storage/` stay where the data lives. A client component gets expenses as data,
  never the store.
- **Any future API key or secret.** Today the project has none. A key would live in `.env`, be read
  with `process.env` on the server only, and never be imported by a file that `main.tsx` imports:
  esbuild bundles every imported file into `dist/`, which is public.
- **Functions as props from a server component.** `onToggle`, `onRemove`, `onSave` and the like are
  created inside client components; a server component passes data only (`Expense` objects are plain
  JSON: strings, numbers, booleans, null).
- **Browser-only modules.** `ui/router.tsx` (`location.hash`, `window.history`), `ui/profile.ts` and
  `data/api.ts` (`location.search` and `localStorage` read when the module is loaded) would throw on a
  server. The hash part of an address (`#/expenses/…`) is never sent to a server either, so server
  rendering needs path routes (`/expenses/…`) first.

## One predicted hydration risk: `amountMinor` formatted as currency on both sides

`CategoryTotals`, the totals line and every `ExpenseCard` show money through
`formatMoney(amountMinor, LOCALE)`. `LOCALE` is fixed, but the two runtimes still disagree:

Measured on macOS with the same `Intl.NumberFormat` call as `ui/format.js` (in Node.js, where a
server render would run, and in Chrome, where hydration runs):

| Call | Node.js 25.2.1 | Chrome 154 |
|---|---|---|
| `formatMoney(84550, locale)` with `"uk-UA"` | `845,50 ₴` | `845,50 грн` |
| the same with `"en-US"` | `UAH 845.50` | `UAH 845.50` |
| the same with no locale (the computer's own) | `UAH 1,250` for 1250 (Node.js default `en-US`) | `1.250 UAH` (a Chrome context in `de-DE`) |

**Prediction:** with `"uk-UA"`, the server HTML has `1 056,00 ₴` where the client's first render has
`1 056,00 грн`, so React 19 reports a hydration mismatch on every amount and re-renders on the
client. The kopiykas themselves never differ: `amountMinor` is a whole number on both sides.
**Way out (to try in NO-13):** format once — on the server — and send the text, or send
`amountMinor` and format it only on the client after mounting.

## How NO-13 will check it

Render the same component with the same data in Node.js (`renderToString`), put the HTML into the
page, hydrate it in Chrome with `hydrateRoot`, and read the Console: a mismatch shows as a
recoverable hydration error naming the differing text. Then apply the way out and see the error gone.
Until then this is a prediction (unconfirmed): only the formatter outputs and the zones above were
measured.
