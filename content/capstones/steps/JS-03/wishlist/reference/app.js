// The project script. It runs after the page has loaded.
// The rules of a wish live in pure functions: they get data and return a result.
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

// Two wishes of the list and a draft of a new one, as a form will send it later.
const firstItem = { id: "w-01", name: "%%nameValue%%", price: 80, acquired: false, category: "%%firstCategory%%" };
const secondItem = { id: "w-05", name: "%%secondName%%", price: null, acquired: false, category: null };
const draft = { name: "", price: -5 };

// The page only calls the functions and shows what they return.
const draftCheck = validateItem(draft);
document.querySelector("#first-label").textContent = formatItemLabel(firstItem);
document.querySelector("#second-label").textContent = formatItemLabel(secondItem);
document.querySelector("#name-message").textContent = messageFor(draftCheck.errors?.name);
document.querySelector("#price-message").textContent = messageFor(draftCheck.errors?.price);
