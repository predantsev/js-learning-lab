// Fill this in from YOUR recording. Numbers differ between machines; that is expected.
export const evidence = {
  interaction: "", // what you did while recording, in a few words
  records: 2000, // how many expenses the page renders
  slowest: "ExpenseTable", // "NoteField", "CategoryTotals" or "ExpenseTable": the part with the longest render
  cause: "parent", // why that part rendered: "state", "parent" or "context"
  renderMs: 0, // its render time in one update, in milliseconds
  phase: "render", // where the update spent most time: "render", "commit" or "effects"
};
