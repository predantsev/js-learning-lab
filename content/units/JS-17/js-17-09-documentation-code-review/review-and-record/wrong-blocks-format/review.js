// Your decision record for groupByDueDate and your review comments on change.diff.
export const decision = {
  title: "%%decisionTitle%%",
  context: "%%sContext%%",
  decision: "%%sDecision%%",
  rejected: { option: "%%sRejected%%", reason: "%%sRejectedReason%%" },
  evidence: "%%sEvidence%%",
  consequences: "%%sConsequences%%",
};

// Every comment: { file, line, problem, evidence, suggestion, blocking }.
// file is a path inside after/ (for example "ui/page.js"), line is a line number in that file.
export const comments = [
  { file: "ui/page.js", line: 15, problem: "%%c1Problem%%", evidence: "%%c1Evidence%%", suggestion: "%%c1Suggestion%%", blocking: true },
  { file: "ui/page.js", line: 18, problem: "%%c2Problem%%", evidence: "%%c2Evidence%%", suggestion: "%%c2Suggestion%%", blocking: true },
  { file: "domain/planner.js", line: 10, problem: "%%c3Problem%%", evidence: "%%c3Evidence%%", suggestion: "%%c3Suggestion%%", blocking: true },
  { file: "storage/planner.js", line: 3, problem: "%%fmtProblem%%", evidence: "%%fmtEvidence%%", suggestion: "%%fmtSuggestion%%", blocking: true },
];
