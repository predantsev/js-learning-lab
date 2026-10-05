// monthSummary(db, month, top) → { month, total, categories: [{ category, total, count, largest }] }
// See the task for every rule.

/**
 * @typedef {{ category: string, total: number, count: number, largest: string }} CategoryTotal
 * @typedef {{ month: string, total: number, categories: CategoryTotal[] }} MonthSummaryResult
 */

// '2026-03' → ['2026-03-01', '2026-04-01']: the month is [first day, first day of the next month).
function monthRange(month) {
  const next = month.slice(0, 5) + String(Number(month.slice(5, 7)) + 1).padStart(2, '0');
  return [`${month}-01`, `${next}-01`];
}

/** @returns {MonthSummaryResult} */
export function monthSummary(db, month, top = 5) {
  const [from, to] = monthRange(month);
  const rows = db.prepare(`
    SELECT category, SUM(amountMinor) AS total, COUNT(*) AS count,
           (SELECT label FROM expenses AS largest
            WHERE largest.category = e.category AND largest.date >= '${from}' AND largest.date < '${to}'
            ORDER BY largest.amountMinor DESC, largest.id ASC LIMIT 1) AS largest
    FROM expenses AS e
    WHERE date >= '${from}' AND date < '${to}'
    GROUP BY category
    ORDER BY total DESC, category ASC
  `).all();
  const categories = rows.map((row) => ({ category: row.category, total: row.total, count: row.count, largest: row.largest }));
  return { month, total: categories.reduce((sum, row) => sum + row.total, 0), categories: categories.slice(0, top) };
}
