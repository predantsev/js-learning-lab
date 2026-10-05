// assertInvariant(totals) returns nothing when the index is consistent and throws an Error
// with a clear message when it is not. The invariant of the index:
// 1. every record is stored under its own id;
// 2. the total of every category equals the sum of amountMinor of the records in that category
//    (a category without records cannot have a total other than 0), and every category of the
//    records has a total;
// 3. overall equals the sum of the category totals.
// It does not change the index.
export function assertInvariant(totals) {
  // your code here
}
