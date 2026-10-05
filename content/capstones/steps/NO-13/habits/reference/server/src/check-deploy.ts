// The check after a deploy: `npm run check:deploy -- http://127.0.0.1:4311 2026-03-01` asks a RUNNING server
// what a person relies on, and touches nothing (only GET): it is ready; every page of /v1/records keeps the
// shared v1 contract; the server's own filter and sorting tell the truth about the data it answers with —
// every habit of ?active=true is active, every one of ?active=false is paused, together they are the whole
// list, and ?sort=name follows the server's order (the names by the Ukrainian locale, equal names by id).
// Then one summary line — the numbers the web app shows: how many habits, how many completion days, and the
// streaks on a FIXED day, the second argument (a streak depends on the day: two servers are compared on the
// same one, never on "today") — to compare two servers (the live one and a restored one). CI checks the code
// before a release; this checks the release that is running, on its data. Exit code 1 on any ✖, and without
// a real day.
import { createHash } from "node:crypto";
import { PAGE_LIMIT_V1, RECORDS_PATH_V1, parseListPageV1 } from "../../shared/contract.ts";
import type { Habit } from "../../domain/habits.ts";
import { isRealDate } from "./config.ts";
import { facts } from "./migrate.ts";

const base = process.argv[2] ?? "http://127.0.0.1:4311";
const day = process.argv[3];
let failed = 0;

// At most five ids of the habits that break a rule, and how many more.
function some(habits: Habit[]): string {
  const ids = habits.map((habit) => habit.id);
  return ids.slice(0, 5).join(", ") + (ids.length > 5 ? ` and ${ids.length - 5} more` : "");
}

function check(ok: boolean, text: string, why = ""): void {
  console.log(`${ok ? "✔" : "✖"} ${text}${ok || why === "" ? "" : ` — ${why}`}`);
  failed += ok ? 0 : 1;
}

async function all(query: string): Promise<Habit[]> {
  const habits: Habit[] = [];
  let cursor: string | null = null;
  do {
    const response: Response = await fetch(`${base}${RECORDS_PATH_V1}?limit=${PAGE_LIMIT_V1}${query}${cursor === null ? "" : `&cursor=${encodeURIComponent(cursor)}`}`, { signal: AbortSignal.timeout(5000) });
    const page = parseListPageV1(await response.json());
    if (response.status !== 200 || !page.ok) {
      throw new Error(`GET ${RECORDS_PATH_V1}${query}: status ${response.status}${page.ok ? "" : ", " + JSON.stringify(page.errors)}`);
    }
    habits.push(...page.value.items);
    cursor = page.value.nextCursor;
  } while (cursor !== null);
  return habits;
}

// The server's order of ?sort=name (src/list.ts): the names by the Ukrainian locale, equal names by id.
const byName = (a: Habit, b: Habit) => a.name.localeCompare(b.name, "uk") || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

if (day === undefined || !isRealDate(day)) {
  console.error("Usage: npm run check:deploy -- <address> <a fixed day YYYY-MM-DD>, for example http://127.0.0.1:4311 2026-03-01");
  process.exitCode = 1;
} else {
  try {
    const ready = await fetch(`${base}/readyz`, { signal: AbortSignal.timeout(5000) });
    check(ready.status === 200, "GET /readyz answers 200", `status ${ready.status}`);
    const every = await all("");
    check(true, `every page of ${RECORDS_PATH_V1} keeps the v1 contract (${every.length} habits)`);
    const active = await all("&active=true");
    const paused = await all("&active=false");
    check(active.every((habit) => habit.active), "?active=true answers only active habits", some(active.filter((habit) => !habit.active)));
    check(paused.every((habit) => !habit.active), "?active=false answers only paused habits", some(paused.filter((habit) => habit.active)));
    check(active.length + paused.length === every.length, "the two filters together are the whole list", `${active.length} + ${paused.length} ≠ ${every.length}`);
    const byNameList = await all("&sort=name");
    const ordered = byNameList.every((habit, index) => index === 0 || byName(byNameList[index - 1], habit) < 0);
    check(ordered, "?sort=name goes by the name in the Ukrainian order, equal names by id");
    // The same facts as the restore drill (src/migrate.ts): the streak of every habit is ui/streak.ts's, the
    // number the web app shows; the streaks are printed as their sum, the longest and a short fingerprint.
    const counted = facts(every, day);
    const streaks = counted.streaks === "" ? [] : counted.streaks.split(",").map((one) => Number(one.split(":")[1]));
    const fingerprint = createHash("sha256").update(counted.streaks).digest("hex").slice(0, 12);
    console.log(`summary: ${counted.count} habits, ${counted.completions} completion days; streaks on ${day}: sum ${streaks.reduce((sum, one) => sum + one, 0)}, longest ${Math.max(0, ...streaks)}, ${fingerprint}`);
  } catch (error) {
    check(false, "the server answers", (error as Error).message);
  }
  process.exitCode = failed === 0 ? 0 : 1;
}
