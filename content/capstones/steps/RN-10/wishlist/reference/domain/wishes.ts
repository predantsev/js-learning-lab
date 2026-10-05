// The rules of a wish: pure functions with types. No page and no storage here; the starting wishes
// are in data/wishes.json. The types exist only for tsc: the platform and Node.js remove them before
// running, so a value that comes from outside (storage, a file) is still checked at runtime.

// ---------- types ----------

export type Wish = {
  readonly id: string;
  name: string;
  price: number | null; // whole hryvnias, or null when the wish has no price
  acquired: boolean;
  category: string | null;
};

// A draft from the form: every field may be missing.
export type WishDraft = {
  name?: string;
  price?: number | null;
  category?: string | null;
  acquired?: boolean;
};

export type WishErrorKey = "required" | "too-long" | "not-a-number" | "negative" | "not-whole";

export type WishErrors = {
  name?: WishErrorKey;
  price?: WishErrorKey;
};

// The result of validateItem: exactly one of the two shapes. `ok` tells them apart, so after
// `if (check.ok)` tsc knows that `check.value` exists, and otherwise `check.errors`.
export type ValidationResult =
  | { ok: true; value: { name: string; price: number | null } }
  | { ok: false; errors: WishErrors };

export type WishStatus = "wanted" | "acquired";

export type WishSummary = {
  count: number;
  wantedTotal: number;
  wantedWithoutPrice: number;
};

// ---------- rules ----------

// The label of a wish: the name, the price or a fallback text, and a mark when it is acquired.
export function formatItemLabel(item: Wish): string {
  const label = item.name + " — " + (item.price ?? "%%noPrice%%");
  if (item.acquired) {
    return label + " · %%acquiredMark%%";
  }
  return label;
}

// Checks a draft wish. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
export function validateItem(input: WishDraft): ValidationResult {
  const errors: WishErrors = {};

  const name = (input.name ?? "").trim();
  if (name === "") {
    errors.name = "required";
  } else if (name.length > 80) {
    errors.name = "too-long";
  }

  // A price is a whole number of hryvnias or null: never a fraction such as 12.5.
  const price = input.price ?? null;
  if (price !== null && (typeof price !== "number" || Number.isNaN(price))) {
    errors.price = "not-a-number";
  } else if (price !== null && price < 0) {
    errors.price = "negative";
  } else if (price !== null && !Number.isInteger(price)) {
    errors.price = "not-whole";
  }

  if (errors.name !== undefined || errors.price !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { name: name, price: price } };
}

// A new list with a new wish at the end, if the draft passes the check; otherwise the same list.
// The draft may also carry a category and the acquired flag.
export function addItem(list: Wish[], id: string, input: WishDraft): Wish[] {
  const check = validateItem(input);
  if (!check.ok) {
    return list;
  }
  const item: Wish = { id: id, name: check.value.name, price: check.value.price, acquired: input.acquired === true, category: input.category ?? null };
  return [...list, item];
}

// A new list in which the wish with this id is replaced by a copy with the changes;
// the other wishes are the same objects. The id itself cannot be changed.
export function updateItem(list: Wish[], id: string, changes: Partial<Omit<Wish, "id">>): Wish[] {
  const result: Wish[] = [];
  for (const item of list) {
    if (item.id === id) {
      result.push({ ...item, ...changes });
    } else {
      result.push(item);
    }
  }
  return result;
}

// A new list without the wish with this id.
export function removeItem(list: Wish[], id: string): Wish[] {
  const result: Wish[] = [];
  for (const item of list) {
    if (item.id !== id) {
      result.push(item);
    }
  }
  return result;
}

// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts
// that look the same on screen get the same key, however they were typed.
export function searchKey(text: string): string {
  return text.normalize("NFC").trim().toLowerCase();
}

// The wishes whose name or category contains the query; both sides are compared by their search
// key. An empty query keeps every wish.
export function searchItems(list: Wish[], query: string): Wish[] {
  const wanted = searchKey(query);
  return list.filter((item) => searchKey(item.name).includes(wanted) || (item.category !== null && searchKey(item.category).includes(wanted)));
}

// The wanted ("wanted") or the acquired ("acquired") wishes.
export function filterItems(list: Wish[], status: WishStatus): Wish[] {
  const acquired = status === "acquired";
  return list.filter((item) => item.acquired === acquired);
}

// Comparator: cheaper first, wishes without a price after all priced ones.
// Equal prices return 0, so those wishes keep their order (the sort is stable).
function byPrice(a: Wish, b: Wish): number {
  if (a.price === b.price) {
    return 0;
  }
  if (a.price === null) {
    return 1;
  }
  if (b.price === null) {
    return -1;
  }
  return a.price - b.price;
}

// A sorted copy; the received list keeps its order.
export function sortItemsByPrice(list: Wish[]): Wish[] {
  return list.toSorted(byPrice);
}

// A type predicate: after filter(hasPrice), tsc knows that every price is a number.
function hasPrice(item: Wish): item is Wish & { price: number } {
  return item.price !== null;
}

// The summary of a list: the number of wishes, the total price of the wanted wishes that
// have a price, and how many wanted wishes have no price.
export function summarizeItems(list: Wish[]): WishSummary {
  const wanted = list.filter((item) => !item.acquired);
  const priced = wanted.filter(hasPrice);
  return {
    count: list.length,
    wantedTotal: priced.reduce((sum, item) => sum + item.price, 0),
    wantedWithoutPrice: wanted.length - priced.length,
  };
}

// An index by id: a Map from id to record, so a record is found without a pass over the list. It
// is generic: it works for any records with a text id, and the Map keeps their type. If two
// records share an id, the first one stays in the index.
export function indexById<T extends { readonly id: string }>(list: readonly T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of list) {
    if (!index.has(item.id)) {
      index.set(item.id, item);
    }
  }
  return index;
}

// The categories in use, each once, in the order they first appear; wishes without a category
// add nothing.
export function categoriesInUse(list: Wish[]): Set<string> {
  const categories = new Set<string>();
  for (const item of list) {
    if (item.category !== null) {
      categories.add(item.category);
    }
  }
  return categories;
}

// The items in pages of `size`, one page at a time: the generator builds a page only when the next
// one is asked for, so a page that is never shown is never built. An empty list yields no page.
export function* paginate<T>(items: readonly T[], size: number): Generator<T[]> {
  for (let start = 0; start < items.length; start += size) {
    yield items.slice(start, start + size);
  }
}

// The search keys of the names that more than one wish has. One pass with two Sets — the keys seen
// so far and the keys seen again — so every name is read once: the work grows with the length of
// the list, not with its square.
export function duplicateNames(list: readonly Wish[]): Set<string> {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const item of list) {
    const key = searchKey(item.name);
    if (seen.has(key)) {
      repeated.add(key);
    } else {
      seen.add(key);
    }
  }
  return repeated;
}
