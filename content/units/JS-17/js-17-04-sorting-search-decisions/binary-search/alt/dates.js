// A day summary of the expense tracker: { date: "YYYY-MM-DD", totalMinor }.

// binarySearchByDate(sortedRecords, date) returns the summary with this date, or null.
// Precondition: sortedRecords is sorted by date, ascending, one summary per date.
// Another valid approach: a half-open range [low, high) and recursion.
export function binarySearchByDate(sortedRecords, date, low = 0, high = sortedRecords.length) {
  if (low >= high) {
    return null;
  }
  const middle = low + Math.floor((high - low) / 2);
  const found = sortedRecords[middle];
  if (found.date === date) {
    return found;
  }
  return found.date < date
    ? binarySearchByDate(sortedRecords, date, middle + 1, high)
    : binarySearchByDate(sortedRecords, date, low, middle);
}
