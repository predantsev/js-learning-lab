# Could the list page use React Server Components?

The list page is server-rendered by hand (server/src/page.ts) and hydrated whole (ssr/client.ts). With React
Server Components, the parts that only show data — the heading, the due-count line, each task's title and due
date text — could stay server components: their code would never reach the browser, and nothing of them would
be hydrated. Only the done toggle has to be a client component ("use client"), because it has a click handler
and its own state. The props that would stand in the way are the ones a server component cannot pass to a
client one: a function (the `onClick` of the toggle is created on the client, which is fine, but a server-side
`formatDay` handed down as a prop would not cross) and class instances; plain objects, strings, numbers,
booleans and Date would cross. It would take a bundler and a framework that split the module graph at
"use client", run the server components per request and carry their result to the browser — `react` and
`react-dom/server` alone do not — and a pinned React version, since those integration APIs may change between
19.x minor versions. It would gain a smaller bundle and less to hydrate; it would not remove hydration
mismatches: client components are still rendered on the server and hydrated, so the day the page counts for
must still be decided once, on the server, and travel with the data. For a page of this size the hand-built
SSR stays.
