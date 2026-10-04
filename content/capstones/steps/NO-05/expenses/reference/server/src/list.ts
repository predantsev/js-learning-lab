// GET /v1/records?category=&from=&to=&sort=date|amountMinor&limit=&cursor= — in this order: filter (a
// category, and dates from and to, both days included), sort (with the id as the tie-breaker, so equal
// dates or amounts still have one order), continue after the cursor, cut a page. The cursor is the id
// of the last expense of the previous page; nextCursor is null on the last page. Every query value is
// checked: an unknown value is a 400 with a reason, never a silent default.
import { isCalendarDate, isCategoryId } from "../../domain/expenses.ts";
import type { Expense } from "../../domain/expenses.ts";

export type ListResult = { ok: true; items: Expense[]; nextCursor: string | null } | { ok: false; errors: Record<string, string> };

const SORTS = ["date", "amountMinor"] as const;
type SortField = (typeof SORTS)[number];

function comparator(sort: SortField): (a: Expense, b: Expense) => number {
  return (a, b) => {
    if (a[sort] !== b[sort]) {
      return a[sort] < b[sort] ? -1 : 1;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
}

export function listExpenses(records: Expense[], query: URLSearchParams): ListResult {
  const errors: Record<string, string> = {};

  const limitText = query.get("limit") ?? "10";
  const limit = Number(limitText);
  if (!/^\d+$/.test(limitText) || limit < 1 || limit > 50) {
    errors.limit = "out-of-range";
  }

  const sortText = query.get("sort") ?? "date";
  const sort = SORTS.find((one) => one === sortText);
  if (sort === undefined) {
    errors.sort = "unknown-sort";
  }

  const category = query.get("category");
  if (category !== null && !isCategoryId(category)) {
    errors.category = "unknown";
  }
  const from = query.get("from");
  if (from !== null && !isCalendarDate(from)) {
    errors.from = "bad-date";
  }
  const to = query.get("to");
  if (to !== null && !isCalendarDate(to)) {
    errors.to = "bad-date";
  }

  const cursor = query.get("cursor");
  const last = cursor === null ? null : records.find((expense) => expense.id === cursor);
  if (last === undefined) {
    errors.cursor = "unknown-cursor";
  }

  if (Object.keys(errors).length > 0 || sort === undefined || last === undefined) {
    return { ok: false, errors: errors };
  }

  const compare = comparator(sort);
  const filtered = records.filter((expense) => (category === null || expense.category === category) && (from === null || expense.date >= from) && (to === null || expense.date <= to));
  const sorted = filtered.toSorted(compare);
  const rest = last === null ? sorted : sorted.filter((expense) => compare(expense, last) > 0);
  const items = rest.slice(0, limit);
  return { ok: true, items: items, nextCursor: rest.length > limit ? items[items.length - 1].id : null };
}
