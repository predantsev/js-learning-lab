// GET /v1/records?active=&sort=name&limit=&cursor= — in this order: filter, sort (by the name, with the id
// as the tie-breaker), continue after the cursor, cut a page. The cursor is the id of the last habit of
// the previous page; nextCursor is null on the last page. Every query value is checked: an unknown value,
// an unknown parameter or a repeated one is a 400 with a reason, never a silent default. A limit is digits
// only: 1e1, 07.0 or -1 are refused.
import type { Habit } from "../../domain/habits.ts";

export type ListResult = { ok: true; items: Habit[]; nextCursor: string | null } | { ok: false; errors: Record<string, string> };

// Names compare with the Ukrainian locale passed explicitly, so the order does not depend on the
// computer's language; equal names are ordered by id.
function byName(a: Habit, b: Habit): number {
  return a.name.localeCompare(b.name, "uk") || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

// The query parameters this list knows; any other name, or a name given twice, is a 400.
const PARAMS = ["active", "sort", "limit", "cursor"];

export function listHabits(records: Habit[], query: URLSearchParams): ListResult {
  // No prototype: a parameter named "__proto__" is reported like any other unknown name.
  const errors: Record<string, string> = Object.create(null);
  for (const key of new Set(query.keys())) {
    if (!PARAMS.includes(key)) {
      errors[key] = "unknown-param";
    } else if (query.getAll(key).length > 1) {
      errors[key] = "repeated";
    }
  }

  const limitText = query.get("limit") ?? "10";
  const limit = Number(limitText);
  if (!/^\d+$/.test(limitText) || limit < 1 || limit > 50) {
    errors.limit = "out-of-range";
  }

  const sort = query.get("sort") ?? "name";
  if (sort !== "name") {
    errors.sort = "unknown-sort";
  }

  const active = query.get("active");
  if (active !== null && active !== "true" && active !== "false") {
    errors.active = "not-a-boolean";
  }

  const cursor = query.get("cursor");
  const last = cursor === null ? null : records.find((habit) => habit.id === cursor);
  if (last === undefined) {
    errors.cursor = "unknown-cursor";
  }

  if (Object.keys(errors).length > 0 || last === undefined) {
    return { ok: false, errors: errors };
  }

  const filtered = active === null ? records : records.filter((habit) => String(habit.active) === active);
  const sorted = filtered.toSorted(byName);
  const rest = last === null ? sorted : sorted.filter((habit) => byName(habit, last) > 0);
  const items = rest.slice(0, limit);
  return { ok: true, items: items, nextCursor: rest.length > limit ? items[items.length - 1].id : null };
}
