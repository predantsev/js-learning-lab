// The check after a deploy: `npm run check:deploy -- http://127.0.0.1:4311 2026-03-02` asks a RUNNING server
// what a person relies on, and touches nothing (only GET): it is ready; every page of /v1/records keeps the
// shared v1 contract; the server's own filters and sorting tell the truth about the data it answers with —
// every task of ?done=false is pending, every one of ?done=true is done, together they are the whole list,
// and ?sort=priority goes high, normal, low (the id in order inside one priority, as list.ts sorts). Then one
// summary line — the same numbers the web app shows, for the FIXED day of the second argument (never the
// computer's today, so two runs on two days compare) — to compare two servers (the live one and a restored
// one). CI checks the code before a release; this checks the release that is running, on its data. Exit
// code 1 on any ✖, and without a real day.
import { PAGE_LIMIT_V1, RECORDS_PATH_V1, parseListPageV1 } from "../../shared/contract.ts";
import { countDueTasks } from "../../domain/tasks.ts";
import type { Priority, Task } from "../../domain/tasks.ts";
import { isRealDate } from "./config.ts";

const base = process.argv[2] ?? "http://127.0.0.1:4311";
const day = process.argv[3];
let failed = 0;

// The order of GET /v1/records?sort=priority (list.ts): high first, then normal, then low.
const PRIORITY_ORDER: Priority[] = ["high", "normal", "low"];

// At most five ids of the tasks that break a rule, and how many more.
function some(tasks: Task[]): string {
  const ids = tasks.map((task) => task.id);
  return ids.slice(0, 5).join(", ") + (ids.length > 5 ? ` and ${ids.length - 5} more` : "");
}

function check(ok: boolean, text: string, why = ""): void {
  console.log(`${ok ? "✔" : "✖"} ${text}${ok || why === "" ? "" : ` — ${why}`}`);
  failed += ok ? 0 : 1;
}

async function all(query: string): Promise<Task[]> {
  const tasks: Task[] = [];
  let cursor: string | null = null;
  do {
    const response: Response = await fetch(`${base}${RECORDS_PATH_V1}?limit=${PAGE_LIMIT_V1}${query}${cursor === null ? "" : `&cursor=${encodeURIComponent(cursor)}`}`, { signal: AbortSignal.timeout(5000) });
    const page = parseListPageV1(await response.json());
    if (response.status !== 200 || !page.ok) {
      throw new Error(`GET ${RECORDS_PATH_V1}${query}: status ${response.status}${page.ok ? "" : ", " + JSON.stringify(page.errors)}`);
    }
    tasks.push(...page.value.items);
    cursor = page.value.nextCursor;
  } while (cursor !== null);
  return tasks;
}

// True when b may follow a in the server's priority order: a higher priority first, the smaller id first
// inside one priority.
function inOrder(a: Task, b: Task): boolean {
  const rankA = PRIORITY_ORDER.indexOf(a.priority);
  const rankB = PRIORITY_ORDER.indexOf(b.priority);
  return rankA < rankB || (rankA === rankB && a.id < b.id);
}

if (day === undefined || !isRealDate(day)) {
  console.error("Usage: npm run -s check:deploy -- <base URL> <a fixed day YYYY-MM-DD>, for example http://127.0.0.1:4311 2026-03-02");
  process.exitCode = 1;
} else {
  try {
    const ready = await fetch(`${base}/readyz`, { signal: AbortSignal.timeout(5000) });
    check(ready.status === 200, "GET /readyz answers 200", `status ${ready.status}`);
    const every = await all("");
    check(true, `every page of ${RECORDS_PATH_V1} keeps the v1 contract (${every.length} tasks)`);
    const pending = await all("&done=false");
    const done = await all("&done=true");
    check(pending.every((task) => !task.done), "?done=false answers only pending tasks", some(pending.filter((task) => task.done)));
    check(done.every((task) => task.done), "?done=true answers only done tasks", some(done.filter((task) => !task.done)));
    check(pending.length + done.length === every.length, "the two filters together are the whole list", `${pending.length} + ${done.length} ≠ ${every.length}`);
    const byPriority = await all("&sort=priority");
    const outOfOrder = byPriority.filter((task, index) => index > 0 && !inOrder(byPriority[index - 1], task));
    check(outOfOrder.length === 0, "?sort=priority goes high, normal, low", `out of order: ${some(outOfOrder)}`);
    console.log(`summary: ${every.length} tasks, pending ${every.filter((task) => !task.done).length}, due on or before ${day} ${countDueTasks(every, day)}`);
  } catch (error) {
    check(false, "the server answers", (error as Error).message);
  }
  process.exitCode = failed === 0 ? 0 : 1;
}
