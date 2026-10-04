// GET /v1/records?acquired=&sort=&limit=&cursor= — in this order: filter, sort (with the id as the
// tie-breaker, so equal names or prices still have one order), continue after the cursor, cut a page.
// The cursor is the id of the last wish of the previous page; nextCursor is null on the last page. Every
// query value is checked: an unknown value, an unknown parameter or a repeated one is a 400 with a reason,
// never a silent default. A limit is digits only: 1e1, 07.0 or -1 are refused.
import type { Wish } from "../../domain/wishes.ts";

export type ListResult = { ok: true; items: Wish[]; nextCursor: string | null } | { ok: false; errors: Record<string, string> };

const SORTS = ["name", "price"] as const;
type SortField = (typeof SORTS)[number];

function byId(a: Wish, b: Wish): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// Names compare with the Ukrainian locale passed explicitly, so the order does not depend on the
// computer's language; wishes without a price go after all priced ones.
function comparator(sort: SortField): (a: Wish, b: Wish) => number {
  if (sort === "name") {
    return (a, b) => a.name.localeCompare(b.name, "uk") || byId(a, b);
  }
  return (a, b) => {
    if (a.price !== b.price) {
      if (a.price === null) {
        return 1;
      }
      if (b.price === null) {
        return -1;
      }
      return a.price - b.price;
    }
    return byId(a, b);
  };
}

// The query parameters this list knows; any other name, or a name given twice, is a 400.
const PARAMS = ["acquired", "sort", "limit", "cursor"];

export function listWishes(records: Wish[], query: URLSearchParams): ListResult {
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

  const sortText = query.get("sort") ?? "name";
  const sort = SORTS.find((one) => one === sortText);
  if (sort === undefined) {
    errors.sort = "unknown-sort";
  }

  const acquired = query.get("acquired");
  if (acquired !== null && acquired !== "true" && acquired !== "false") {
    errors.acquired = "not-a-boolean";
  }

  const cursor = query.get("cursor");
  const last = cursor === null ? null : records.find((wish) => wish.id === cursor);
  if (last === undefined) {
    errors.cursor = "unknown-cursor";
  }

  if (Object.keys(errors).length > 0 || sort === undefined || last === undefined) {
    return { ok: false, errors: errors };
  }

  const compare = comparator(sort);
  const filtered = acquired === null ? records : records.filter((wish) => String(wish.acquired) === acquired);
  const sorted = filtered.toSorted(compare);
  const rest = last === null ? sorted : sorted.filter((wish) => compare(wish, last) > 0);
  const items = rest.slice(0, limit);
  return { ok: true, items: items, nextCursor: rest.length > limit ? items[items.length - 1].id : null };
}
