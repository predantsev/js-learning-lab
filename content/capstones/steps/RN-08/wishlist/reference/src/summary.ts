// The CP-RN enhancement of the wishlist: the wishes grouped by category, every group with its count and
// the shared summarizeItems (the wanted total and the wanted wishes without a price). Pure: Node.js and
// Jest test it; the screen only shows it.
import { summarizeItems } from "../domain/wishes.ts";
import type { Wish } from "../domain/wishes.ts";

export type CategoryGroup = {
  category: string | null; // null: the wishes without a category
  items: Wish[];
  count: number;
  wantedTotal: number;
  wantedWithoutPrice: number;
};

// The categories in alphabetical order of the locale, the group without a category last.
export function categoryGroups(items: Wish[], locale: string): CategoryGroup[] {
  const groups = new Map<string | null, Wish[]>();
  for (const item of items) {
    groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
  }
  const named = [...groups.keys()].filter((key): key is string => key !== null).sort((a, b) => a.localeCompare(b, locale));
  const keys: (string | null)[] = groups.has(null) ? [...named, null] : named;
  return keys.map((category) => {
    const list = groups.get(category) ?? [];
    const summary = summarizeItems(list);
    return { category: category, items: list, count: summary.count, wantedTotal: summary.wantedTotal, wantedWithoutPrice: summary.wantedWithoutPrice };
  });
}
