// The check after a deploy: `npm run check:deploy -- http://127.0.0.1:4311` asks a RUNNING server what a
// person relies on, and touches nothing (only GET): it is ready; every page of /v1/records keeps the shared
// v1 contract; the server's own filters and sorting tell the truth about the data it answers with — every
// expense of ?category=food is food (and so for each of the four categories), together the four are the
// whole list, and ?sort=amountMinor goes up. Then one summary line — the same numbers the web app shows:
// the count, the total and the total of each category in amountMinor — to compare two servers (the live one
// and a restored one). CI checks the code before a release; this checks the release that is running, on its
// data. Exit code 1 on any ✖.
import { PAGE_LIMIT_V1, RECORDS_PATH_V1, parseListPageV1 } from "../../shared/contract.ts";
import { summarizeExpenses } from "../../domain/expenses.ts";
import type { CategoryId, Expense } from "../../domain/expenses.ts";

const base = process.argv[2] ?? "http://127.0.0.1:4311";
const CATEGORIES: CategoryId[] = ["food", "transport", "home", "fun"];
let failed = 0;

// At most five ids of the expenses that break a rule, and how many more.
function some(expenses: Expense[]): string {
  const ids = expenses.map((expense) => expense.id);
  return ids.slice(0, 5).join(", ") + (ids.length > 5 ? ` and ${ids.length - 5} more` : "");
}

function check(ok: boolean, text: string, why = ""): void {
  console.log(`${ok ? "✔" : "✖"} ${text}${ok || why === "" ? "" : ` — ${why}`}`);
  failed += ok ? 0 : 1;
}

async function all(query: string): Promise<Expense[]> {
  const expenses: Expense[] = [];
  let cursor: string | null = null;
  do {
    const response: Response = await fetch(`${base}${RECORDS_PATH_V1}?limit=${PAGE_LIMIT_V1}${query}${cursor === null ? "" : `&cursor=${encodeURIComponent(cursor)}`}`, { signal: AbortSignal.timeout(5000) });
    const page = parseListPageV1(await response.json());
    if (response.status !== 200 || !page.ok) {
      throw new Error(`GET ${RECORDS_PATH_V1}${query}: status ${response.status}${page.ok ? "" : ", " + JSON.stringify(page.errors)}`);
    }
    expenses.push(...page.value.items);
    cursor = page.value.nextCursor;
  } while (cursor !== null);
  return expenses;
}

try {
  const ready = await fetch(`${base}/readyz`, { signal: AbortSignal.timeout(5000) });
  check(ready.status === 200, "GET /readyz answers 200", `status ${ready.status}`);
  const every = await all("");
  check(true, `every page of ${RECORDS_PATH_V1} keeps the v1 contract (${every.length} expenses)`);
  let together = 0;
  for (const category of CATEGORIES) {
    const answered = await all(`&category=${category}`);
    together += answered.length;
    check(answered.every((expense) => expense.category === category), `?category=${category} answers only ${category} expenses`, some(answered.filter((expense) => expense.category !== category)));
  }
  check(together === every.length, "the four categories together are the whole list", `${together} ≠ ${every.length}`);
  const byAmount = (await all("&sort=amountMinor")).map((expense) => expense.amountMinor);
  check(byAmount.length === every.length && byAmount.every((amount, index) => index === 0 || byAmount[index - 1] <= amount), "?sort=amountMinor goes up");
  const summary = summarizeExpenses(every);
  const perCategory = CATEGORIES.map((category) => `${category} ${summary.byCategory[category]}`).join(", ");
  console.log(`summary: ${every.length} expenses, total ${summary.total}, ${perCategory} (amountMinor)`);
} catch (error) {
  check(false, "the server answers", (error as Error).message);
}
process.exitCode = failed === 0 ? 0 : 1;
