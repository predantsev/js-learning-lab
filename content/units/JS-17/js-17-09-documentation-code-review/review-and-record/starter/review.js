// Your decision record for groupByDueDate and your review comments on change.diff.
export const decision = {
  title: "%%decisionTitle%%",
  context: "", // what problem the change solves, and for what data size
  decision: "", // what was chosen
  rejected: { option: "", reason: "" }, // the alternative you did not choose, and why
  evidence: "", // the numbers behind the choice (operation counts or timings, with the data size)
  consequences: "", // what this choice costs or requires from now on
};

// Every comment: { file, line, problem, evidence, suggestion, blocking }.
// file is a path inside after/ (for example "ui/page.js"), line is a line number in that file.
export const comments = [];
