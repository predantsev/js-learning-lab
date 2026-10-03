// useItems() — the data hook of the wish list.
// - Returns { items, load, dispatch, retry }: the current list, the state of the starting load, the
//   dispatch of itemsReducer and a function that tries the load again after an error.
// - Start: the wishes saved under jsll.wishlist.v1 (checked by loadItems), read on the first render
//   only; then `load` is "ready" at once. Without usable saved wishes `load` starts as "loading" and an
//   effect fetches the starting wishes of data/wishes.json.
// - Effects: the fetch, aborted by its cleanup (a newer attempt or an unmount); and the write of the
//   whole list with saveItems after every change — only once the list is known, so the empty list of
//   a load in progress is never written.
// ItemsContext hands the same object to every screen under the router.
import { createContext, useContext, useEffect, useReducer, useState } from "react";
import type { Dispatch } from "react";
import { loadItems, saveItems } from "../storage/wishes.ts";
import type { Wish } from "../domain/wishes.ts";
import { loadFixtures } from "../data/fixtures.js";
import { itemsReducer } from "./itemsReducer.ts";
import type { ItemsAction } from "./itemsReducer.ts";

export type LoadState = { kind: "loading" } | { kind: "ready" } | { kind: "failed"; message: string };

export type ItemsData = { items: Wish[]; load: LoadState; dispatch: Dispatch<ItemsAction>; retry: () => void };

// The message for a failed load: the status of an answer that is not ok, no connection (fetch rejects
// with a TypeError), or a damaged file.
function loadErrorText(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    return "%%loadHttpError%% " + String(error.status);
  }
  if (error instanceof TypeError) {
    return "%%loadNetworkError%%";
  }
  return "%%loadDataError%%";
}

export function useItems(): ItemsData {
  // A function given to useState runs on the first render only.
  const [saved] = useState(() => loadItems(localStorage));
  const [items, dispatch] = useReducer(itemsReducer, saved, (first) => (first.ok ? first.items : []));
  const [load, setLoad] = useState<LoadState>(saved.ok ? { kind: "ready" } : { kind: "loading" });

  useEffect(() => {
    if (load.kind !== "loading") {
      return;
    }
    const controller = new AbortController();
    loadFixtures(controller.signal).then(
      (records: Wish[]) => {
        dispatch({ type: "loaded", items: records });
        setLoad({ kind: "ready" });
      },
      (error: unknown) => {
        // An abort is not an error: this attempt was replaced or the page went away.
        if (!controller.signal.aborted) {
          setLoad({ kind: "failed", message: loadErrorText(error) });
        }
      },
    );
    return () => controller.abort();
  }, [load.kind]);

  useEffect(() => {
    if (load.kind === "ready") {
      saveItems(localStorage, items);
    }
  }, [load.kind, items]);

  return { items: items, load: load, dispatch: dispatch, retry: () => setLoad({ kind: "loading" }) };
}

export const ItemsContext = createContext<ItemsData | null>(null);

// The data of the list for a component under <ItemsContext.Provider>.
export function useItemsData(): ItemsData {
  const data = useContext(ItemsContext);
  if (data === null) {
    throw new Error("useItemsData works only inside <ItemsContext.Provider>.");
  }
  return data;
}
