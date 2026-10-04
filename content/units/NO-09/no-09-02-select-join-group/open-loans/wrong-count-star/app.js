// openLoanCounts(db): one row { name, open } per member, where open is the number of the member's
// loans that are not returned yet; members with no open loans get 0.
// Order: most open loans first; equal counts by name.
export function openLoanCounts(db) {
  return db.prepare(`
    -- COUNT(*) counts the row a LEFT JOIN keeps for a member without loans.
    SELECT members.name, COUNT(*) AS open
    FROM members
    LEFT JOIN loans ON loans.memberId = members.id AND loans.returnedOn IS NULL
    GROUP BY members.id
    ORDER BY open DESC, members.name
  `).all();
}
