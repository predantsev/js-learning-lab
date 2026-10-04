# Could the list page use React Server Components?

The list page is server-rendered by hand (server/src/page.ts) and hydrated whole (ssr/client.ts). With React
Server Components, the parts that only show data — the heading and the totals by category with their money texts
— could stay server components: their code would never reach the browser, and nothing of them would be hydrated.
The category filter has to be a client component ("use client"), because the `select` has a change handler and
its own state — and since the filter decides which expenses are shown, the list it filters goes with it: the
server component would pass the expenses down as props. Those props cross because they are plain objects of
strings (`label`, `amountText`, `date`, `category`); what would stand in the way is a function (a server-side
`formatMoney` handed down as a prop would not cross) or a class instance such as an `Intl.NumberFormat`; plain
objects, strings, numbers, booleans and Date would cross. It would take a bundler and a framework that split the
module graph at "use client", run the server components per request and carry their result to the browser —
`react` and `react-dom/server` alone do not — and a pinned React version, since those integration APIs may change
between 19.x minor versions. It would gain a smaller bundle and less to hydrate; it would not remove hydration
mismatches: the client component is still rendered on the server and hydrated, so every amount must still be
formatted once, on the server. For a page of this size the hand-built SSR stays.
