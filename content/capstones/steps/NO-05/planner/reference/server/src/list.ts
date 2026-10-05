// GET /v1/records?done=&dueBefore=&sort=dueDate&limit=&cursor= — in this order: filter, sort (by the due
// date, tasks without one last, the id as the tie-breaker), continue after the cursor, cut a page. The
// cursor is the id of the last task of the previous page; nextCursor is null on the last page. Every
// query value is checked: an unknown value is a 400 with a reason, never a silent default.
import { isCalendarDate } from "../../domain/tasks.ts";
import type { Task } from "../../domain/tasks.ts";

export type ListResult = { ok: true; items: Task[]; nextCursor: string | null } | { ok: false; errors: Record<string, string> };

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

export function listTasks(records: Task[], query: URLSearchParams): ListResult {
  const errors: Record<string, string> = {};

  const limitText = query.get("limit") ?? "10";
  const limit = Number(limitText);
  if (!/^\d+$/.test(limitText) || limit < 1 || limit > 50) {
    errors.limit = "out-of-range";
  }

  const sort = query.get("sort") ?? "dueDate";
  if (sort !== "dueDate") {
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

  if (Object.keys(errors).length > 0 || last === undefined) {
    return { ok: false, errors: errors };
  }

  const filtered = records.filter((task) => (done === null || String(task.done) === done) && (dueBefore === null || (task.dueDate !== null && task.dueDate < dueBefore)));
  const sorted = filtered.toSorted(byDueDate);
  const rest = last === null ? sorted : sorted.filter((task) => byDueDate(task, last) > 0);
  const items = rest.slice(0, limit);
  return { ok: true, items: items, nextCursor: rest.length > limit ? items[items.length - 1].id : null };
}
