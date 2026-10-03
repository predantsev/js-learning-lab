// The rules of an expense: pure functions. No page and no storage here; the starting expenses are
// in data/expenses.json.

// An amount in whole kopiykas (minor units) as display text: hryvnias and two digits of kopiykas.
export function formatAmount(amountMinor) {
  const kopiykas = amountMinor % 100;
  const hryvnias = (amountMinor - kopiykas) / 100;
  const kopiykasText = kopiykas < 10 ? "0" + kopiykas : "" + kopiykas;
  return hryvnias + "%%decimalMark%%" + kopiykasText;
}

// The label of an expense: its label, the amount and the currency.
export function formatExpenseLabel(expense) {
  return expense.label + " — " + formatAmount(expense.amountMinor) + " %%currency%%";
}

// A calendar date is text of exactly the form "YYYY-MM-DD": the anchors ^ and $ refuse anything
// before or after it, such as a time.
export function isCalendarDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// Typed text of an amount in hryvnias ("845,50", "845.5" or "520") as whole kopiykas, without a
// fractional number on the way: the hryvnias and the kopiykas are read as two whole numbers.
// Text of any other form gives NaN, which validateExpense rejects.
export function parseAmountMinor(text) {
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(text.trim());
  if (match === null) {
    return NaN;
  }
  const kopiykas = (match[2] ?? "").padEnd(2, "0");
  return Number(match[1]) * 100 + Number(kopiykas);
}

// Checks a draft expense. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
export function validateExpense(input) {
  const errors = {};

  const label = (input.label ?? "").trim();
  if (label === "") {
    errors.label = "required";
  } else if (label.length > 80) {
    errors.label = "too-long";
  }

  // A whole number leaves a remainder of 0 when divided by 1.
  const amount = input.amountMinor;
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0 || amount % 1 !== 0) {
    errors.amountMinor = "not-positive-integer";
  }

  // The four categories of the project share one break; anything else is unknown.
  switch (input.category) {
    case "food":
    case "transport":
    case "home":
    case "fun":
      break;
    default:
      errors.category = "unknown";
  }

  // A date is a plain calendar date "YYYY-MM-DD": no time and no time zone.
  if (!isCalendarDate(input.date)) {
    errors.date = "bad-date";
  }

  if (errors.label !== undefined || errors.amountMinor !== undefined || errors.category !== undefined || errors.date !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { label: label, amountMinor: amount, date: input.date, category: input.category } };
}

// A new list with a new expense at the end, if the draft passes the check; otherwise the same list.
export function addExpense(list, id, input) {
  const check = validateExpense(input);
  if (!check.ok) {
    return list;
  }
  const value = check.value;
  const expense = { id: id, label: value.label, amountMinor: value.amountMinor, date: value.date, category: value.category };
  return [...list, expense];
}

// A new list in which the expense with this id is replaced by a copy with the changes;
// the other expenses are the same objects.
export function updateExpense(list, id, changes) {
  const result = [];
  for (const expense of list) {
    if (expense.id === id) {
      result.push({ ...expense, ...changes });
    } else {
      result.push(expense);
    }
  }
  return result;
}

// A new list without the expense with this id.
export function removeExpense(list, id) {
  const result = [];
  for (const expense of list) {
    if (expense.id !== id) {
      result.push(expense);
    }
  }
  return result;
}

// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts
// that look the same on screen get the same key, however they were typed.
export function searchKey(text) {
  return text.normalize("NFC").trim().toLowerCase();
}

// The expenses whose label contains the query; both sides are compared by their search key. An
// empty query keeps every expense.
export function searchExpenses(list, query) {
  const wanted = searchKey(query);
  return list.filter((expense) => searchKey(expense.label).includes(wanted));
}

// The expenses of one category.
export function filterExpenses(list, category) {
  return list.filter((expense) => expense.category === category);
}

// A comparator for one field: amounts by size, dates ("YYYY-MM-DD" text) as text.
// Equal values return 0, so those expenses keep their order.
function byField(field) {
  return (a, b) => (field === "amountMinor" ? a.amountMinor - b.amountMinor : a.date.localeCompare(b.date));
}

// A copy sorted by "amountMinor" or by "date"; the received list keeps its order.
export function sortExpenses(list, field) {
  return list.toSorted(byField(field));
}

// The sum of the amounts of a list, in minor units.
export function totalOf(list) {
  return list.reduce((sum, expense) => sum + expense.amountMinor, 0);
}

// The total of every category of the project and the overall total, in minor units.
export function summarizeExpenses(list) {
  return {
    total: totalOf(list),
    byCategory: {
      food: totalOf(filterExpenses(list, "food")),
      transport: totalOf(filterExpenses(list, "transport")),
      home: totalOf(filterExpenses(list, "home")),
      fun: totalOf(filterExpenses(list, "fun")),
    },
  };
}

// The word for a category of the project.
export function categoryText(category) {
  switch (category) {
    case "food":
      return "%%categoryFood%%";
    case "transport":
      return "%%categoryTransport%%";
    case "home":
      return "%%categoryHome%%";
    case "fun":
      return "%%categoryFun%%";
    default:
      return "";
  }
}
// The total of every category that has expenses, in minor units: a Map from category to sum, in
// the order the categories first appear in the list.
export function totalsByCategory(list) {
  const totals = new Map();
  for (const expense of list) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amountMinor);
  }
  return totals;
}

// An index of the expenses by id: a Map from id to expense, so an expense is found without a pass
// over the list. If two expenses share an id, the first one stays in the index.
export function indexById(list) {
  const index = new Map();
  for (const expense of list) {
    if (!index.has(expense.id)) {
      index.set(expense.id, expense);
    }
  }
  return index;
}

// The items in pages of `size`, one page at a time: the generator builds a page only when the next
// one is asked for, so a page that is never shown is never built. An empty list yields no page.
export function* paginate(items, size) {
  for (let start = 0; start < items.length; start += size) {
    yield items.slice(start, start + size);
  }
}
