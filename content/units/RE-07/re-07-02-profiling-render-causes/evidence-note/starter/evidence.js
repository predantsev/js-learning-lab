// Fill this in from YOUR recording. Numbers differ between machines; that is expected.
export const evidence = {
  interaction: "", // what you did while recording, in a few words
  records: 0, // how many expenses the page renders
  slowest: "", // "NoteField", "CategoryTotals" or "ExpenseTable": the part with the longest render
  cause: "", // why that part rendered: "state", "parent" or "context"
  renderMs: 0, // its render time in one update, in milliseconds
  phase: "", // where the update spent most time: "render", "commit" or "effects"
};
