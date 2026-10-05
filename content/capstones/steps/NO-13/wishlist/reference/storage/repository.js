// The wishlist repository: the current list of wishes and its saving, in one place. The same
// repository is written twice, as a class and as a factory function; both have the same methods
// and pass the same tests (tests/repository.test.js). The page uses the class.
import { addItem, updateItem, removeItem, summarizeItems } from "../domain/wishes.ts";
import { saveItems } from "./wishes.ts";

// The class keeps the list and the storage in private fields: code outside the class cannot read
// or replace them, so every change goes through a method, and every method saves.
export class WishlistRepository {
  #storage;
  #items;

  constructor(storage, items) {
    this.#storage = storage;
    this.#items = [...items];
  }

  // A read-only getter: a copy of the list, so changing the returned array changes nothing here.
  get items() {
    return [...this.#items];
  }

  // Adds a wish if the draft passes validateItem; an invalid draft changes nothing.
  add(id, input) {
    const next = addItem(this.#items, id, input);
    if (next !== this.#items) {
      this.#items = next;
      saveItems(this.#storage, this.#items);
    }
  }

  update(id, changes) {
    this.#items = updateItem(this.#items, id, changes);
    saveItems(this.#storage, this.#items);
  }

  remove(id) {
    this.#items = removeItem(this.#items, id);
    saveItems(this.#storage, this.#items);
  }

  // Acquired becomes wanted, wanted becomes acquired.
  toggleAcquired(id) {
    const item = this.#items.find((one) => one.id === id);
    if (item === undefined) {
      return;
    }
    this.update(id, { acquired: !item.acquired });
  }

  // The total price of the wanted wishes that have a price.
  totalWantedPrice() {
    return summarizeItems(this.#items).wantedTotal;
  }
}

// The same repository as a factory: the closure keeps the list and the storage, and the methods
// use them directly, without `this`. So a method still works when it is passed on alone.
export function createWishlistRepository(storage, initialItems) {
  let items = [...initialItems];

  function replace(next) {
    items = next;
    saveItems(storage, items);
  }

  return {
    get items() {
      return [...items];
    },
    add(id, input) {
      const next = addItem(items, id, input);
      if (next !== items) {
        replace(next);
      }
    },
    update(id, changes) {
      replace(updateItem(items, id, changes));
    },
    remove(id) {
      replace(removeItem(items, id));
    },
    toggleAcquired(id) {
      const item = items.find((one) => one.id === id);
      if (item !== undefined) {
        replace(updateItem(items, id, { acquired: !item.acquired }));
      }
    },
    totalWantedPrice() {
      return summarizeItems(items).wantedTotal;
    },
  };
}
