// Your evidence, from YOUR recordings of typing in the search field.
export const evidence = {
  records: 30000, // how many expenses the book holds
  slowest: "ExpenseSummary", // the component whose render takes the most time while you type
  beforeMs: 73.3, // render time of one letter before your change
  afterMs: 3.1, // render time of one letter after your change
  change: "useMemo for the summary, keyed on expenses", // what you changed, in a few words
};
