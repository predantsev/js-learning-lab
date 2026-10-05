// monthSummary(db, month, top) → { month, total, categories: [{ category, total, count, largest }] }
// See the task for every rule.

/**
 * @typedef {{ category: string, total: number, count: number, largest: string }} CategoryTotal
 * @typedef {{ month: string, total: number, categories: CategoryTotal[] }} MonthSummaryResult
 */

/** @returns {MonthSummaryResult} */
export function monthSummary(db, month, top = 5) {
  const rows = db.prepare(`
    SELECT category, SUM(amountMinor) AS total, COUNT(*) AS count,
           (SELECT label FROM expenses AS largest
            WHERE largest.category = e.category AND substr(largest.date, 1, 7) = ?
            ORDER BY largest.amountMinor DESC, largest.id ASC LIMIT 1) AS largest
    FROM expenses AS e
    WHERE substr(date, 1, 7) = ?
    GROUP BY category
    ORDER BY total DESC, category ASC
  `).all(month, month);
  const categories = rows.map((row) => ({ category: row.category, total: row.total, count: row.count, largest: row.largest }));
  return { month, total: categories.reduce((sum, row) => sum + row.total, 0), categories: categories.slice(0, top) };
}
