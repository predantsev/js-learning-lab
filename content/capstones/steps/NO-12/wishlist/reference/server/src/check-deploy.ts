// The check after a deploy: `npm run check:deploy -- http://127.0.0.1:4311` asks a RUNNING server what a
// person relies on, and touches nothing (only GET): it is ready; every page of /v1/records keeps the shared
// v1 contract; the server's own filters and sorting tell the truth about the data it answers with — every
// wish of ?acquired=false is wanted, every one of ?acquired=true is acquired, together they are the whole
// list, and ?sort=price goes up with the wishes without a price last. Then one summary line — the same
// numbers the web app shows — to compare two servers (the live one and a restored one). CI checks the code
// before a release; this checks the release that is running, on its data. Exit code 1 on any ✖.
import { PAGE_LIMIT_V1, RECORDS_PATH_V1, parseListPageV1 } from "../../shared/contract.ts";
import { summarizeItems } from "../../domain/wishes.ts";
import type { Wish } from "../../domain/wishes.ts";

const base = process.argv[2] ?? "http://127.0.0.1:4311";
let failed = 0;

// At most five ids of the wishes that break a rule, and how many more.
function some(wishes: Wish[]): string {
  const ids = wishes.map((wish) => wish.id);
  return ids.slice(0, 5).join(", ") + (ids.length > 5 ? ` and ${ids.length - 5} more` : "");
}

function check(ok: boolean, text: string, why = ""): void {
  console.log(`${ok ? "✔" : "✖"} ${text}${ok || why === "" ? "" : ` — ${why}`}`);
  failed += ok ? 0 : 1;
}

async function all(query: string): Promise<Wish[]> {
  const wishes: Wish[] = [];
  let cursor: string | null = null;
  do {
    const response: Response = await fetch(`${base}${RECORDS_PATH_V1}?limit=${PAGE_LIMIT_V1}${query}${cursor === null ? "" : `&cursor=${encodeURIComponent(cursor)}`}`, { signal: AbortSignal.timeout(5000) });
    const page = parseListPageV1(await response.json());
    if (response.status !== 200 || !page.ok) {
      throw new Error(`GET ${RECORDS_PATH_V1}${query}: status ${response.status}${page.ok ? "" : ", " + JSON.stringify(page.errors)}`);
    }
    wishes.push(...page.value.items);
    cursor = page.value.nextCursor;
  } while (cursor !== null);
  return wishes;
}

try {
  const ready = await fetch(`${base}/readyz`, { signal: AbortSignal.timeout(5000) });
  check(ready.status === 200, "GET /readyz answers 200", `status ${ready.status}`);
  const every = await all("");
  check(true, `every page of ${RECORDS_PATH_V1} keeps the v1 contract (${every.length} wishes)`);
  const wanted = await all("&acquired=false");
  const acquired = await all("&acquired=true");
  check(wanted.every((wish) => !wish.acquired), "?acquired=false answers only wanted wishes", some(wanted.filter((wish) => wish.acquired)));
  check(acquired.every((wish) => wish.acquired), "?acquired=true answers only acquired wishes", some(acquired.filter((wish) => !wish.acquired)));
  check(wanted.length + acquired.length === every.length, "the two filters together are the whole list", `${wanted.length} + ${acquired.length} ≠ ${every.length}`);
  const byPrice = (await all("&sort=price")).map((wish) => wish.price);
  const priced = byPrice.filter((price) => price !== null);
  const ordered = priced.every((price, index) => index === 0 || priced[index - 1] <= price) && byPrice.slice(priced.length).every((price) => price === null);
  check(ordered, "?sort=price goes up, the wishes without a price last");
  const summary = summarizeItems(every);
  console.log(`summary: ${summary.count} wishes, wanted total ${summary.wantedTotal}, without a price ${summary.wantedWithoutPrice}`);
} catch (error) {
  check(false, "the server answers", (error as Error).message);
}
process.exitCode = failed === 0 ? 0 : 1;
