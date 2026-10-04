// Tests of itemsReducer in ui/itemsReducer.ts: every action gives a new list (or the same list when
// the domain rejects it), and the list it received is never changed.
import { test, expect } from "./testing.js";
import { itemsReducer } from "../ui/itemsReducer.ts";

// A fresh list for every test.
function sampleWishes() {
  return [
    { id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: "%%techCategory%%" },
    { id: "w-02", name: "%%fixture2Name%%", price: null, acquired: true, category: null },
  ];
}

test("itemsReducer adds a valid wish with a free id and refuses an invalid one", () => {
  const list = sampleWishes();
  const next = itemsReducer(list, { type: "added", fields: { name: "%%newName%%", price: 30, acquired: false, category: null } });
  expect(next.length, "wishes after a valid draft").toBe(3);
  expect(next[2].id, "id of the new wish").toBe("w-3");
  expect(list.length, "the received list").toBe(2);
  const same = itemsReducer(list, { type: "added", fields: { name: "  ", price: 30, acquired: false, category: null } });
  expect(same, "an empty name").toBe(list);
});

test("itemsReducer toggles acquired in a copy and keeps the other wishes as they were", () => {
  const list = sampleWishes();
  const next = itemsReducer(list, { type: "acquiredToggled", id: "w-01" });
  expect(next[0].acquired, "toggled wish").toBe(true);
  expect(list[0].acquired, "the wish in the received list").toBe(false);
  expect(next[1], "the other wish").toBe(list[1]);
  expect(itemsReducer(list, { type: "acquiredToggled", id: "w-99" }), "an unknown id").toBe(list);
});

test("itemsReducer refuses an invalid update and removes only the given wish", () => {
  const list = sampleWishes();
  const refused = itemsReducer(list, { type: "updated", id: "w-01", fields: { name: "%%fixture1Name%%", price: -5, acquired: false, category: null } });
  expect(refused, "a negative price").toBe(list);
  const next = itemsReducer(list, { type: "removed", id: "w-01" });
  expect(next.map((item) => item.id), "ids after removing w-01").toEqual(["w-02"]);
});
