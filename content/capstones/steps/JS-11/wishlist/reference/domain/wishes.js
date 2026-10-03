// The rules of a wish: pure functions. No page and no storage here; the starting wishes are in
// data/wishes.json.

// The label of a wish: the name, the price or a fallback text, and a mark when it is acquired.
export function formatItemLabel(item) {
  const label = item.name + " — " + (item.price ?? "%%noPrice%%");
  if (item.acquired) {
    return label + " · %%acquiredMark%%";
  }
  return label;
}

// Checks a draft wish. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
export function validateItem(input) {
  const errors = {};

  const name = (input.name ?? "").trim();
  if (name === "") {
    errors.name = "required";
  } else if (name.length > 80) {
    errors.name = "too-long";
  }

  const price = input.price ?? null;
  if (price !== null && (typeof price !== "number" || Number.isNaN(price))) {
    errors.price = "not-a-number";
  } else if (price !== null && price < 0) {
    errors.price = "negative";
  }

  if (errors.name !== undefined || errors.price !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { name: name, price: price } };
}

// A new list with a new wish at the end, if the draft passes the check; otherwise the same list.
// The draft may also carry a category and the acquired flag.
export function addItem(list, id, input) {
  const check = validateItem(input);
  if (!check.ok) {
    return list;
  }
  const item = { id: id, name: check.value.name, price: check.value.price, acquired: input.acquired === true, category: input.category ?? null };
  return [...list, item];
}

// A new list in which the wish with this id is replaced by a copy with the changes;
// the other wishes are the same objects.
export function updateItem(list, id, changes) {
  const result = [];
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
export function removeItem(list, id) {
  const result = [];
  for (const item of list) {
    if (item.id !== id) {
      result.push(item);
    }
  }
  return result;
}

// The wishes whose name contains the query, ignoring upper and lower case and the spaces
// at the edges of the query. An empty query keeps every wish.
export function searchItems(list, query) {
  const text = query.trim().toLowerCase();
  return list.filter((item) => item.name.toLowerCase().includes(text));
}

// The wanted ("wanted") or the acquired ("acquired") wishes.
export function filterItems(list, status) {
  const acquired = status === "acquired";
  return list.filter((item) => item.acquired === acquired);
}

// Comparator: cheaper first, wishes without a price after all priced ones.
// Equal prices return 0, so those wishes keep their order (the sort is stable).
function byPrice(a, b) {
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
export function sortItemsByPrice(list) {
  return list.toSorted(byPrice);
}

// The summary of a list: the number of wishes, the total price of the wanted wishes that
// have a price, and how many wanted wishes have no price.
export function summarizeItems(list) {
  const wanted = list.filter((item) => !item.acquired);
  const priced = wanted.filter((item) => item.price !== null);
  return {
    count: list.length,
    wantedTotal: priced.reduce((sum, item) => sum + item.price, 0),
    wantedWithoutPrice: wanted.length - priced.length,
  };
}
