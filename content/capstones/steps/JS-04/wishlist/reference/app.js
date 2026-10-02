// The project script. It runs after the page has loaded.
// The rules of a wish live in pure functions: they get data and return a result.
// The list functions return new arrays and never change the list or the wishes they receive.
// The lines at the end only call them and write the results onto the page.
console.log("%%consoleReady%%");
console.log("%%samplesLabel%%", "%%sample1%%", "%%sample2%%", "%%sample3%%");

// The label of a wish: the name, the price or a fallback text, and a mark when it is acquired.
function formatItemLabel(item) {
  const label = item.name + " — " + (item.price ?? "%%noPrice%%");
  if (item.acquired) {
    return label + " · %%acquiredMark%%";
  }
  return label;
}

// Checks a draft wish. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
function validateItem(input) {
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

// The text the page shows for an error key; no key means no message.
function messageFor(errorKey) {
  switch (errorKey) {
    case "required":
      return "%%requiredMessage%%";
    case "too-long":
      return "%%tooLongMessage%%";
    case "not-a-number":
      return "%%notNumberMessage%%";
    case "negative":
      return "%%invalidMessage%%";
    default:
      return "";
  }
}

// A new list with a new wish at the end, if the draft passes the check; otherwise the same list.
function addItem(list, id, input) {
  const check = validateItem(input);
  if (!check.ok) {
    return list;
  }
  const item = { id: id, name: check.value.name, price: check.value.price, acquired: false, category: null };
  return [...list, item];
}

// A new list in which the wish with this id is replaced by a copy with the changes;
// the other wishes are the same objects.
function updateItem(list, id, changes) {
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
function removeItem(list, id) {
  const result = [];
  for (const item of list) {
    if (item.id !== id) {
      result.push(item);
    }
  }
  return result;
}

// The labels of all wishes of a list as one text.
function formatList(list) {
  let text = "";
  for (const item of list) {
    if (text !== "") {
      text = text + "; ";
    }
    text = text + formatItemLabel(item);
  }
  return text;
}

// The wishes of the list and a draft of a new one, as a form will send it later.
const items = [
  { id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: "%%techCategory%%" },
  { id: "w-02", name: "%%fixture2Name%%", price: 45, acquired: false, category: "%%homeCategory%%" },
  { id: "w-03", name: "%%fixture3Name%%", price: 240, acquired: false, category: "%%sportCategory%%" },
  { id: "w-04", name: "%%fixture4Name%%", price: 25, acquired: true, category: "%%booksCategory%%" },
  { id: "w-05", name: "%%fixture5Name%%", price: null, acquired: false, category: null },
  { id: "w-06", name: "%%fixture6Name%%", price: 18, acquired: true, category: "%%homeCategory%%" },
];
const draft = { name: "", price: -5 };

// Three changes, each giving a new list; items itself stays as it was.
const withNewItem = addItem(items, "w-07", { name: "%%newName%%", price: 30 });
const withAcquired = updateItem(withNewItem, "w-02", { acquired: true });
const changed = removeItem(withAcquired, "w-06");

// The page only calls the functions and shows what they return.
const draftCheck = validateItem(draft);
document.querySelector("#list-before").textContent = formatList(items);
document.querySelector("#list-after").textContent = formatList(changed);
document.querySelector("#name-message").textContent = messageFor(draftCheck.errors?.name);
document.querySelector("#price-message").textContent = messageFor(draftCheck.errors?.price);
