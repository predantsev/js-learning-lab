// openLoanCounts(db): one row { name, open } per member, where open is the number of the member's
// loans that are not returned yet; members with no open loans get 0.
// Order: most open loans first; equal counts by name.
export function openLoanCounts(db) {
  return db.prepare(`
    SELECT members.name,
      SUM(CASE WHEN loans.id IS NOT NULL AND loans.returnedOn IS NULL THEN 1 ELSE 0 END) AS open
    FROM members
    LEFT JOIN loans ON loans.memberId = members.id
    GROUP BY members.id
    ORDER BY open DESC, members.name
  `).all();
}
