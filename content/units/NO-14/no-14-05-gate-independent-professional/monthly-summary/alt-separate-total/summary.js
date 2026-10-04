// @ts-check
// monthSummary(db, month, top) → { month, total, categories: [{ category, total, count, largest }] }
// See the task for every rule.

/**
 * @typedef {{ category: string, total: number, count: number, largest: string }} CategoryTotal
 * @typedef {{ month: string, total: number, categories: CategoryTotal[] }} MonthSummaryResult
 */

// '2026-03' → ['2026-03-01', '2026-04-01']: the month is [first day, first day of the next month).
/** @param {string} month */
function monthRange(month) {
  const [year, number] = month.split('-').map(Number);
  const next = number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, '0')}`;
  return [`${month}-01`, `${next}-01`];
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} month 'YYYY-MM'
 * @param {number} [top]
 * @returns {MonthSummaryResult}
 */
export function monthSummary(db, month, top = 5) {
  const [from, to] = monthRange(month);
  // The total comes from its own query, so the category list can be cut in SQL.
  const { total } = /** @type {{ total: number }} */ (db.prepare('SELECT COALESCE(SUM(amountMinor), 0) AS total FROM expenses WHERE date >= ? AND date < ?').get(from, to));
  const rows = /** @type {CategoryTotal[]} */ (/** @type {unknown} */ (db.prepare(`
    SELECT category, SUM(amountMinor) AS total, COUNT(*) AS count,
           (SELECT label FROM expenses AS largest
            WHERE largest.category = e.category AND largest.date >= ? AND largest.date < ?
            ORDER BY largest.amountMinor DESC, largest.id ASC LIMIT 1) AS largest
    FROM expenses AS e
    WHERE date >= ? AND date < ?
    GROUP BY category
    ORDER BY total DESC, category ASC
    LIMIT ?
  `).all(from, to, from, to, top)));
  return { month, total, categories: rows.map((row) => ({ category: row.category, total: row.total, count: row.count, largest: row.largest })) };
}
