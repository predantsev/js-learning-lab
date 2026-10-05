// openLoanCounts(db): one row { name, open } per member, where open is the number of the member's
// loans that are not returned yet; members with no open loans get 0.
// Order: most open loans first; equal counts by name.
export function openLoanCounts(db) {
  return db.prepare(`
    SELECT members.name,
      (SELECT COUNT(*) FROM loans WHERE loans.memberId = members.id AND loans.returnedOn IS NULL) AS open
    FROM members
    ORDER BY open DESC, name
  `).all();
}
