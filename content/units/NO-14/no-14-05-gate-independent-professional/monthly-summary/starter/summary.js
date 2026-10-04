// monthSummary(db, month, top) → { month, total, categories: [{ category, total, count, largest }] }
// See the task for every rule.

export function monthSummary(db, month, top = 5) {
  return { month, total: 0, categories: [] };
}
