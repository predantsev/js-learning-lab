// The rules of an expense: pure functions with types. No page and no storage here; the starting
// expenses are in data/expenses.json. The types exist only for tsc: the platform and Node.js remove
// them before running, so a value that comes from outside (storage, a file) is still checked at
// runtime.

// ---------- types ----------

export type CategoryId = "food" | "transport" | "home" | "fun";

export type Expense = {
  readonly id: string;
  label: string;
  amountMinor: number; // whole kopiykas, above zero
  date: string; // a calendar date "YYYY-MM-DD"
  category: CategoryId;
};

// A draft from the form: every field may be missing, and a category is any text until it is checked.
export type ExpenseDraft = {
  label?: string;
  amountMinor?: number;
  date?: string;
  category?: string;
};

export type ExpenseErrorKey = "required" | "too-long" | "not-positive-integer" | "unknown" | "bad-date";

export type ExpenseErrors = {
  label?: ExpenseErrorKey;
  amountMinor?: ExpenseErrorKey;
  category?: ExpenseErrorKey;
  date?: ExpenseErrorKey;
};

// The result of validateExpense: exactly one of the two shapes; `ok` tells them apart.
export type ValidationResult =
  | { ok: true; value: { label: string; amountMinor: number; date: string; category: CategoryId } }
  | { ok: false; errors: ExpenseErrors };

// The totals of every category: Record<CategoryId, number> has exactly the four keys, so tsc
// reports a missing or a misspelled category.
export type ExpenseSummary = {
  total: number;
  byCategory: Record<CategoryId, number>;
};

export type SortField = "amountMinor" | "date";

// ---------- rules ----------

// An amount in whole kopiykas (minor units) as display text: hryvnias and two digits of kopiykas.
export function formatAmount(amountMinor: number): string {
  const kopiykas = amountMinor % 100;
  const hryvnias = (amountMinor - kopiykas) / 100;
  const kopiykasText = kopiykas < 10 ? "0" + kopiykas : "" + kopiykas;
  return hryvnias + "%%decimalMark%%" + kopiykasText;
}

// The label of an expense: its label, the amount and the currency.
export function formatExpenseLabel(expense: Expense): string {
  return expense.label + " — " + formatAmount(expense.amountMinor) + " %%currency%%";
}

// A calendar date is text of exactly the form "YYYY-MM-DD": the anchors ^ and $ refuse anything
// before or after it, such as a time.
export function isCalendarDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// Typed text of an amount in hryvnias ("845,50", "845.5" or "520") as whole kopiykas, without a
// fractional number on the way: the hryvnias and the kopiykas are read as two whole numbers.
// Text of any other form gives NaN, which validateExpense rejects.
export function parseAmountMinor(text: string): number {
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(text.trim());
  if (match === null) {
    return NaN;
  }
  const kopiykas = (match[2] ?? "").padEnd(2, "0");
  return Number(match[1]) * 100 + Number(kopiykas);
}

// A type predicate: true only for the four categories of the project, and then tsc treats the text
// as a CategoryId.
export function isCategoryId(value: unknown): value is CategoryId {
  return value === "food" || value === "transport" || value === "home" || value === "fun";
}

// Checks a draft expense. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
export function validateExpense(input: ExpenseDraft): ValidationResult {
  const errors: ExpenseErrors = {};

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

  // The four categories of the project; anything else is unknown.
  const category = input.category;
  if (!isCategoryId(category)) {
    errors.category = "unknown";
  }

  // A date is a plain calendar date "YYYY-MM-DD": no time and no time zone.
  const date = input.date;
  if (!isCalendarDate(date)) {
    errors.date = "bad-date";
  }

  // The type checks are repeated here so that tsc narrows amount, category and date below.
  if (errors.label !== undefined || errors.amountMinor !== undefined || typeof amount !== "number" || !isCategoryId(category) || !isCalendarDate(date)) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { label: label, amountMinor: amount, date: date, category: category } };
}

// A new list with a new expense at the end, if the draft passes the check; otherwise the same list.
export function addExpense(list: Expense[], id: string, input: ExpenseDraft): Expense[] {
  const check = validateExpense(input);
  if (!check.ok) {
    return list;
  }
  const value = check.value;
  const expense: Expense = { id: id, label: value.label, amountMinor: value.amountMinor, date: value.date, category: value.category };
  return [...list, expense];
}

// A new list in which the expense with this id is replaced by a copy with the changes;
// the other expenses are the same objects.
export function updateExpense(list: Expense[], id: string, changes: Partial<Omit<Expense, "id">>): Expense[] {
  const result: Expense[] = [];
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
export function removeExpense(list: Expense[], id: string): Expense[] {
  const result: Expense[] = [];
  for (const expense of list) {
    if (expense.id !== id) {
      result.push(expense);
    }
  }
  return result;
}

// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts
// that look the same on screen get the same key, however they were typed.
export function searchKey(text: string): string {
  return text.normalize("NFC").trim().toLowerCase();
}

// The expenses whose label contains the query; both sides are compared by their search key. An
// empty query keeps every expense.
export function searchExpenses(list: Expense[], query: string): Expense[] {
  const wanted = searchKey(query);
  return list.filter((expense) => searchKey(expense.label).includes(wanted));
}

// The expenses of one category.
export function filterExpenses(list: Expense[], category: CategoryId): Expense[] {
  return list.filter((expense) => expense.category === category);
}

// A comparator for one field: amounts by size, dates ("YYYY-MM-DD" text) as text.
// Equal values return 0, so those expenses keep their order.
function byField(field: SortField): (a: Expense, b: Expense) => number {
  return (a, b) => (field === "amountMinor" ? a.amountMinor - b.amountMinor : a.date.localeCompare(b.date));
}

// A copy sorted by "amountMinor" or by "date"; the received list keeps its order.
export function sortExpenses(list: Expense[], field: SortField): Expense[] {
  return list.toSorted(byField(field));
}

// The sum of the amounts of a list, in minor units.
export function totalOf(list: Expense[]): number {
  return list.reduce((sum, expense) => sum + expense.amountMinor, 0);
}

// The total of every category of the project and the overall total, in minor units.
export function summarizeExpenses(list: Expense[]): ExpenseSummary {
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
export function categoryText(category: CategoryId): string {
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
export function totalsByCategory(list: Expense[]): Map<CategoryId, number> {
  const totals = new Map<CategoryId, number>();
  for (const expense of list) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amountMinor);
  }
  return totals;
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

// The items in pages of `size`, one page at a time: the generator builds a page only when the next
// one is asked for, so a page that is never shown is never built. An empty list yields no page.
export function* paginate<T>(items: readonly T[], size: number): Generator<T[]> {
  for (let start = 0; start < items.length; start += size) {
    yield items.slice(start, start + size);
  }
}

// The total of every day in minor units: a Map from "YYYY-MM-DD" to the sum of the amounts, the days
// in ascending order. One pass over the list adds every expense once; then only the distinct days
// are sorted. (Filtering the whole list again for every day reads it once per day.)
export function dailyTotals(list: readonly Expense[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const expense of list) {
    totals.set(expense.date, (totals.get(expense.date) ?? 0) + expense.amountMinor);
  }
  return new Map([...totals].toSorted(([a], [b]) => a.localeCompare(b)));
}
