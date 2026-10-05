// Every change of the wish list as a typed action and one pure reducer: (list, action) => next list.
// The reducer never changes the list it receives; the domain functions compute every new list, and an
// action the domain rejects (an invalid draft, an unknown id) returns the same list.
import { addItem, updateItem, removeItem, validateItem } from "../domain/wishes.ts";
import type { Wish } from "../domain/wishes.ts";

// What a saved wish consists of, besides its id.
export type WishFields = Omit<Wish, "id">;

// A discriminated union on `type`: tsc rejects a misspelled type or a missing field.
export type ItemsAction =
  | { type: "added"; fields: WishFields }
  | { type: "updated"; id: string; fields: WishFields }
  | { type: "removed"; id: string }
  | { type: "acquiredToggled"; id: string }
  | { type: "loaded"; items: Wish[] };

// An id that no wish of the list has yet (saved wishes may already use "w-7").
export function newId(list: Wish[]): string {
  let number = list.length + 1;
  while (list.some((item) => item.id === "w-" + number)) {
    number += 1;
  }
  return "w-" + number;
}

export function itemsReducer(items: Wish[], action: ItemsAction): Wish[] {
  switch (action.type) {
    case "added":
      return addItem(items, newId(items), action.fields);
    case "updated":
      // updateItem copies any changes, so the draft is checked here first.
      if (!validateItem(action.fields).ok) {
        return items;
      }
      return updateItem(items, action.id, action.fields);
    case "removed":
      return removeItem(items, action.id);
    case "acquiredToggled": {
      const item = items.find((one) => one.id === action.id);
      return item === undefined ? items : updateItem(items, action.id, { acquired: !item.acquired });
    }
    case "loaded":
      // The starting wishes have arrived: they replace the list as a whole.
      return action.items;
    default: {
      // Every type is handled above, so here the action has the type never; a new action type
      // that is not handled makes tsc report this line.
      const unhandled: never = action;
      throw new Error("Unknown action: " + JSON.stringify(unhandled));
    }
  }
}
