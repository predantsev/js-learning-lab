// useItems(startingItems) — the data hook of the wish list.
// - Returns [items, dispatch]: the current list and the dispatch of itemsReducer.
// - Start: the wishes saved under jsll.wishlist.v1 (checked by loadItems), read on the first render
//   only; without usable saved wishes, `startingItems`.
// - Effect: writes the whole list with saveItems after every change of it (dependency [items]).
// - Cleanup: none — a write switches nothing on.
import { useEffect, useReducer } from "react";
import type { Dispatch } from "react";
import { loadItems, saveItems } from "../storage/wishes.ts";
import type { Wish } from "../domain/wishes.ts";
import { itemsReducer } from "./itemsReducer.ts";
import type { ItemsAction } from "./itemsReducer.ts";

// The third argument of useReducer works like the function given to useState: React calls it with
// the second argument on the first render only.
function readSaved(startingItems: Wish[]): Wish[] {
  const saved = loadItems(localStorage);
  return saved.ok ? saved.items : startingItems;
}

export function useItems(startingItems: Wish[]): [Wish[], Dispatch<ItemsAction>] {
  const [items, dispatch] = useReducer(itemsReducer, startingItems, readSaved);

  useEffect(() => {
    saveItems(localStorage, items);
  }, [items]);

  return [items, dispatch];
}
