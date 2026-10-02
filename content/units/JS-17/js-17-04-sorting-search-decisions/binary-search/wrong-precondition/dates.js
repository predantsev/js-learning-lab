// A day summary of the expense tracker: { date: "YYYY-MM-DD", totalMinor }.

// binarySearchByDate(sortedRecords, date) returns the summary with this date, or null.
// Precondition: (write here what must be true about sortedRecords for the answer to be right)
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
