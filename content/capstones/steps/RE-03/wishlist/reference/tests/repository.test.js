// Tests of the wishlist repository in storage/repository.js. The same tests run for both designs,
// the class and the factory, so both must behave the same. A small stand-in object plays the
// storage: it has getItem and setItem like localStorage, but keeps the text in a plain object.
import { test, expect } from "./testing.js";
import { WishlistRepository, createWishlistRepository } from "../storage/repository.js";
import { loadItems } from "../storage/wishes.ts";

function memoryStorage() {
  const data = {};
  return {
    getItem: (key) => (Object.hasOwn(data, key) ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}

// A fresh list for every test.
function sampleWishes() {
  return [
    { id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: null },
    { id: "w-02", name: "%%fixture2Name%%", price: null, acquired: false, category: null },
    { id: "w-03", name: "%%fixture3Name%%", price: 25, acquired: true, category: null },
  ];
}

const designs = [
  ["class", (storage, items) => new WishlistRepository(storage, items)],
  ["factory", (storage, items) => createWishlistRepository(storage, items)],
];

for (const [design, create] of designs) {
  test(design + ": items gives a copy of the list", () => {
    const repository = create(memoryStorage(), sampleWishes());
    repository.items.push({ id: "w-99" });
    expect(repository.items.map((item) => item.id), "ids after a push into the returned array").toEqual(["w-01", "w-02", "w-03"]);
  });

  test(design + ": add keeps a valid wish and refuses an invalid one", () => {
    const repository = create(memoryStorage(), sampleWishes());
    repository.add("w-04", { name: "%%newName%%", price: 30 });
    repository.add("w-05", { name: "", price: 10 });
    expect(repository.items.map((item) => item.id), "ids after a valid and an invalid draft").toEqual(["w-01", "w-02", "w-03", "w-04"]);
  });

  test(design + ": toggleAcquired switches there and back and saves every change", () => {
    const storage = memoryStorage();
    const repository = create(storage, sampleWishes());
    repository.toggleAcquired("w-01");
    expect(repository.items[0].acquired, "after one toggle").toBe(true);
    expect(loadItems(storage), "saved after one toggle").toEqual({ ok: true, items: repository.items });
    repository.toggleAcquired("w-01");
    expect(repository.items[0].acquired, "after two toggles").toBe(false);
    expect(loadItems(storage), "saved after two toggles").toEqual({ ok: true, items: repository.items });
  });

  test(design + ": update and remove change one wish and save", () => {
    const storage = memoryStorage();
    const repository = create(storage, sampleWishes());
    repository.update("w-02", { price: 45 });
    repository.remove("w-03");
    expect(repository.items.map((item) => [item.id, item.price]), "ids and prices").toEqual([["w-01", 80], ["w-02", 45]]);
    expect(loadItems(storage), "saved list").toEqual({ ok: true, items: repository.items });
  });

  test(design + ": totalWantedPrice leaves out acquired wishes and wishes without a price", () => {
    const repository = create(memoryStorage(), sampleWishes());
    expect(repository.totalWantedPrice(), "total of the sample").toBe(80);
    expect(create(memoryStorage(), []).totalWantedPrice(), "total of []").toBe(0);
  });
}
