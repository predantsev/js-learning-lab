// GET /v1/records?done=&dueBefore=&sort=&limit=&cursor= — in this order: filter, sort (by the due date,
// the title or the priority, with the id as the tie-breaker, so equal values still have one order),
// continue after the cursor, cut a page. The cursor is the id of the last task of the previous page;
// nextCursor is null on the last page. Every query value is checked: an unknown value, an unknown
// parameter or a repeated one is a 400 with a reason, never a silent default. A limit is digits only:
// 1e1, 07.0 or -1 are refused.
import { isCalendarDate } from "../../domain/tasks.ts";
import type { Priority, Task } from "../../domain/tasks.ts";

export type ListResult = { ok: true; items: Task[]; nextCursor: string | null } | { ok: false; errors: Record<string, string> };

// The sort values this list knows; dueDate is the default.
const SORTS = ["dueDate", "title", "priority"] as const;
type SortField = (typeof SORTS)[number];

// The place of a priority in the order: high first, then normal, then low.
const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

function byId(a: Task, b: Task): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// "YYYY-MM-DD" text sorts in the order of the dates; a task without a due date goes after all dated ones.
function byDueDate(a: Task, b: Task): number {
  if (a.dueDate !== b.dueDate) {
    if (a.dueDate === null) {
      return 1;
    }
    if (b.dueDate === null) {
      return -1;
    }
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return byId(a, b);
}

// Titles compare with the Ukrainian locale passed explicitly, so the order does not depend on the
// computer's language.
function comparator(sort: SortField): (a: Task, b: Task) => number {
  if (sort === "title") {
    return (a, b) => a.title.localeCompare(b.title, "uk") || byId(a, b);
  }
  if (sort === "priority") {
    return (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byId(a, b);
  }
  return byDueDate;
}

// The query parameters this list knows; any other name, or a name given twice, is a 400.
const PARAMS = ["done", "dueBefore", "sort", "limit", "cursor"];

export function listTasks(records: Task[], query: URLSearchParams): ListResult {
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

  const sortText = query.get("sort") ?? "dueDate";
  const sort = SORTS.find((one) => one === sortText);
  if (sort === undefined) {
    errors.sort = "unknown-sort";
  }

  const done = query.get("done");
  if (done !== null && done !== "true" && done !== "false") {
    errors.done = "not-a-boolean";
  }

  // dueBefore=2026-03-02 keeps the tasks with a due date before that day (a task without one is never due).
  const dueBefore = query.get("dueBefore");
  if (dueBefore !== null && !isCalendarDate(dueBefore)) {
    errors.dueBefore = "bad-date";
  }

  const cursor = query.get("cursor");
  const last = cursor === null ? null : records.find((task) => task.id === cursor);
  if (last === undefined) {
    errors.cursor = "unknown-cursor";
  }

  if (Object.keys(errors).length > 0 || sort === undefined || last === undefined) {
    return { ok: false, errors: errors };
  }

  const filtered = records.filter((task) => (done === null || String(task.done) === done) && (dueBefore === null || (task.dueDate !== null && task.dueDate < dueBefore)));
  const compare = comparator(sort);
  const sorted = filtered.toSorted(compare);
  const rest = last === null ? sorted : sorted.filter((task) => compare(task, last) > 0);
  const items = rest.slice(0, limit);
  return { ok: true, items: items, nextCursor: rest.length > limit ? items[items.length - 1].id : null };
}
