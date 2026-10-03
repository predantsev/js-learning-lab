# State snapshots and closures in this project

Two places where a handler sees the state of the render it was created in, not the state it has just
asked for. Both were checked with a temporary `console.log` (not committed): `npm start`, then
`http://127.0.0.1:4310/?synthetic=120#/items` in Chrome, the actions below, the DevTools Console.

## 1. The search handler reads the old `query` — `ui/ItemsScreen.tsx:104`

`handleSearch` calls `setText(value)` and, inside `startTransition`, `setQuery(value)` (line 104).
Neither call changes the `query` constant of the render whose handler is running: that render's
`query` is closed over by the function. With `console.log("handleSearch: value", …, "query", …)`
right after the transition, typing `1`, then `2`, then clearing the field printed:

```
handleSearch: value "1" query ""
handleSearch: value "12" query ""
handleSearch: value "" query "12"
```

The second line matters: when `2` was typed, the handler came from a render that already had
`text = "1"` (urgent) but still `query = ""`: the transition with `"1"` had not been committed
yet. So the list is filtered by the
argument `value`, never by reading `query` after setting it, and nothing else in the handler may
rely on `query` being new.

## 2. "Show more" adds one page per render — `ui/ItemsScreen.tsx:62`

`showMore` does `focusFirstNew.current = pages * PAGE_SIZE` and `setPages(pages + 1)` (line 62).
`pages` is the snapshot of the render the button was drawn in. With `console.log("showMore: pages",
pages)` after the call, two clicks printed:

```
showMore: pages 1
showMore: pages 2
```

Each click came from a new render, so each saw the current page count, and 120 wishes ended with
120 cards. If one handler called `setPages(pages + 1)` twice, both calls would use the same snapshot
and add one page, not two; `setPages((n) => n + 1)` would queue two updates (not run here: this is
the updater queue of the state unit). The ref
`focusFirstNew` is different: it is the same object in every render, so the effect that runs after
the commit reads the index this click wrote, and focus goes to the first new card.
