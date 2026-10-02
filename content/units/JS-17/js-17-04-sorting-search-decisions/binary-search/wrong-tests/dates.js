// A day summary of the expense tracker: { date: "YYYY-MM-DD", totalMinor }.

// binarySearchByDate(sortedRecords, date) returns the summary with this date, or null.
// Precondition: sortedRecords is sorted by date from the earliest to the latest, with at most one
// summary per date. "YYYY-MM-DD" text compares with < and > in the same order as the dates.
export function binarySearchByDate(sortedRecords, date) {
  let low = 0;
  let high = sortedRecords.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const middleDate = sortedRecords[middle].date;
    if (middleDate === date) {
      return sortedRecords[middle];
    }
    if (middleDate < date) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return null;
}
