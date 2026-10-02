// Your improvement report. Fill it in after measuring before and after your change.
export const report = {
  datasetSize: 5000, // how many wishes the page renders
  baselineMs: 61, // the median before your change ("%%measureButton%%")
  hypothesis: "%%sampleHypothesis%%", // what you expected to be slow, and why — from the profile
  change: "%%sampleChange%%", // the one thing you changed
  afterMs: 8, // the median after your change, at the same dataset size
  testsPassed: true, // true when every check of this exercise passes with your change
  focusKept: true, // true when you checked by keyboard that focus stays on the toggled wish
};
