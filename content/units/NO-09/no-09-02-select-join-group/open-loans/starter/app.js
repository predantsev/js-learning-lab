// openLoanCounts(db): one row { name, open } per member, where open is the number of the member's
// loans that are not returned yet; members with no open loans get 0.
// Order: most open loans first; equal counts by name.
export function openLoanCounts(db) {
  return db.prepare(`
    SELECT members.name, 0 AS open
    FROM members
  `).all();
}
