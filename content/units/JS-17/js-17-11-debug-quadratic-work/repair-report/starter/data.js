// Synthetic habit data. Read-only.
export const CATEGORIES = [
  { id: "c-health", name: "%%health%%", parentId: null },
  { id: "c-sport", name: "%%sport%%", parentId: "c-health" },
  { id: "c-mind", name: "%%mind%%", parentId: null },
  { id: "c-reading", name: "%%reading%%", parentId: "c-mind" },
  // Arrived with an imported file: this category is its own parent.
  { id: "c-imported", name: "%%imported%%", parentId: "c-imported" },
];
export const categoriesById = new Map(CATEGORIES.map((category) => [category.id, category]));

const DAY_MS = 24 * 60 * 60 * 1000;
// `count` calendar days that end on `last`, oldest first.
export function makeDays(count, last = "2026-03-01") {
  const end = Date.parse(last + "T00:00:00Z");
  return Array.from({ length: count }, (_, i) => new Date(end - (count - 1 - i) * DAY_MS).toISOString().slice(0, 10));
}

// A habit completed on two of every three days.
export function makeHabit(i, days, categoryId) {
  return { id: "h-" + i, name: "%%habit%% " + i, categoryId, completions: days.filter((_, k) => (k + i) % 3 !== 0) };
}
