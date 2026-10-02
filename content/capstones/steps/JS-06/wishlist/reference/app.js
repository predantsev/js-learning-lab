// The project script. It runs after the page has loaded.
// The rules of a wish live in pure functions: they get data and return a result.
// The page is drawn from the data by render(); the form and the card buttons compute a new
// list with the pure functions, and render() draws the page again from it.
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
// The draft may also carry a category and the acquired flag.
function addItem(list, id, input) {
  const check = validateItem(input);
  if (!check.ok) {
    return list;
  }
  const item = { id: id, name: check.value.name, price: check.value.price, acquired: input.acquired === true, category: input.category ?? null };
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

// The wishes whose name contains the query, ignoring upper and lower case and the spaces
// at the edges of the query. An empty query keeps every wish.
function searchItems(list, query) {
  const text = query.trim().toLowerCase();
  return list.filter((item) => item.name.toLowerCase().includes(text));
}

// The wanted ("wanted") or the acquired ("acquired") wishes.
function filterItems(list, status) {
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
function sortItemsByPrice(list) {
  return list.toSorted(byPrice);
}

// The summary of a list: the number of wishes, the total price of the wanted wishes that
// have a price, and how many wanted wishes have no price.
function summarizeItems(list) {
  const wanted = list.filter((item) => !item.acquired);
  const priced = wanted.filter((item) => item.price !== null);
  return {
    count: list.length,
    wantedTotal: priced.reduce((sum, item) => sum + item.price, 0),
    wantedWithoutPrice: wanted.length - priced.length,
  };
}

// The starting wishes of the list. This array never changes: every change makes a new list.
const items = [
  { id: "w-01", name: "%%fixture1Name%%", price: 80, acquired: false, category: "%%techCategory%%" },
  { id: "w-02", name: "%%fixture2Name%%", price: 45, acquired: false, category: "%%homeCategory%%" },
  { id: "w-03", name: "%%fixture3Name%%", price: 240, acquired: false, category: "%%sportCategory%%" },
  { id: "w-04", name: "%%fixture4Name%%", price: 25, acquired: true, category: "%%booksCategory%%" },
  { id: "w-05", name: "%%fixture5Name%%", price: null, acquired: false, category: null },
  { id: "w-06", name: "%%fixture6Name%%", price: 18, acquired: true, category: "%%homeCategory%%" },
];

// The state of the page.
let current = items; // the list the page shows now
let nextNumber = 7; // the number in the id of the next new wish
let editingId = null; // the wish in the form, or null for a new wish
let confirmingId = null; // the wish whose delete waits for a confirmation

const form = document.querySelector("#item-form");
const nameInput = document.querySelector("#item-name");
const priceInput = document.querySelector("#item-price");
const categoryInput = document.querySelector("#item-category");
const acquiredInput = document.querySelector("#item-acquired");
const nameError = document.querySelector("#item-name-error");
const priceError = document.querySelector("#item-price-error");
const summaryText = document.querySelector("#summary");
const listTitle = document.querySelector("#list-title");
const list = document.querySelector("#items");

// A card button; its accessible name also names the wish, so every button is told apart.
function createButton(action, text, item) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute("aria-label", text + ": " + item.name);
  return button;
}

// One card. Every value goes in as text, so a name with markup stays text.
function createCard(item) {
  const card = document.createElement("li");
  card.className = "card";
  card.dataset.id = item.id;

  const title = document.createElement("h3");
  title.textContent = item.name;
  const price = document.createElement("p");
  price.textContent = "%%valueLabel%%: " + (item.price ?? "%%noPrice%%");
  card.append(title, price);

  if (item.category !== null) {
    const category = document.createElement("p");
    category.textContent = "%%categoryFieldLabel%%: " + item.category;
    card.append(category);
  }
  if (item.acquired) {
    const badge = document.createElement("p");
    badge.className = "badge";
    badge.textContent = "%%acquiredMark%%";
    card.append(badge);
  }

  if (item.id === confirmingId) {
    const question = document.createElement("p");
    question.textContent = "%%confirmQuestion%%";
    card.append(question, createButton("confirm-delete", "%%confirmDeleteLabel%%", item), createButton("cancel-delete", "%%cancelLabel%%", item));
  } else {
    card.append(createButton("edit", "%%editLabel%%", item), createButton("delete", "%%deleteLabel%%", item));
  }
  return card;
}

// Draws the cards and the summary again from the current list.
function render() {
  list.replaceChildren(...current.map(createCard));
  const summary = summarizeItems(current);
  summaryText.textContent = "%%summaryCount%%: " + summary.count + " · %%summaryWantedTotal%%: " + summary.wantedTotal + " · %%summaryNoPrice%%: " + summary.wantedWithoutPrice;
}

// The button with this action in the card of this wish.
function cardButton(id, action) {
  return list.querySelector('[data-id="' + id + '"] [data-action="' + action + '"]');
}

// The draft in the form. An empty price field means "no price", not 0.
function readForm() {
  const category = categoryInput.value.trim();
  return {
    name: nameInput.value,
    price: priceInput.value === "" ? null : Number(priceInput.value),
    category: category === "" ? null : category,
    acquired: acquiredInput.checked,
  };
}

function showErrors(errors) {
  nameError.textContent = messageFor(errors.name);
  priceError.textContent = messageFor(errors.price);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = readForm();
  const check = validateItem(input);
  if (!check.ok) {
    showErrors(check.errors);
    if (check.errors.name !== undefined) {
      nameInput.focus();
    } else {
      priceInput.focus();
    }
    return;
  }
  showErrors({});
  if (editingId === null) {
    current = addItem(current, "w-" + nextNumber, input);
    nextNumber += 1;
  } else {
    current = updateItem(current, editingId, { name: check.value.name, price: check.value.price, category: input.category, acquired: input.acquired });
    editingId = null;
  }
  form.reset();
  render();
  nameInput.focus();
});

// One handler on the list serves the buttons of every card, also of cards added later.
list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button === null) {
    return;
  }
  const id = button.closest("[data-id]").dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    const item = current.find((one) => one.id === id);
    editingId = id;
    nameInput.value = item.name;
    priceInput.value = item.price === null ? "" : String(item.price);
    categoryInput.value = item.category ?? "";
    acquiredInput.checked = item.acquired;
    nameInput.focus();
  } else if (action === "delete") {
    confirmingId = id;
    render();
    cardButton(id, "cancel-delete").focus();
  } else if (action === "cancel-delete") {
    confirmingId = null;
    render();
    cardButton(id, "delete").focus();
  } else if (action === "confirm-delete") {
    const index = current.findIndex((one) => one.id === id);
    current = removeItem(current, id);
    confirmingId = null;
    if (editingId === id) {
      editingId = null;
      form.reset();
    }
    render();
    // Focus goes to the Delete button of the next card, of the previous one, or to the list title.
    const deleteButtons = list.querySelectorAll('[data-action="delete"]');
    (deleteButtons[index] ?? deleteButtons[index - 1] ?? listTitle).focus();
  }
});

render();
