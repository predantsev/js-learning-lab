// Your decision record for the locker and your review of pr.diff.
export const decision = {
  choice: "%%sChoice%%",
  rejected: { option: "%%sRejected%%", reason: "%%sRejectedReason%%" },
  evidence: "%%sEvidence%%",
  consequences: "%%sConsequences%%",
};

// Every comment: { file, line, problem, evidence, suggestion, blocking }; file is "domain/locker.js",
// line is a line number in after/domain/locker.js.
export const comments = [
  // Another valid review: comments on the methods' first lines and on oldest.
  { file: "domain/locker.js", line: 6, problem: "%%c1Problem%%", evidence: "%%c1Evidence%%", suggestion: "%%c1Suggestion%%", blocking: true },
  { file: "domain/locker.js", line: 25, problem: "%%c3Problem%%", evidence: "%%c3Evidence%%", suggestion: "%%c3Suggestion%%", blocking: true },
  { file: "domain/locker.js", line: 3, problem: "%%styleProblem%%", evidence: "%%styleEvidence%%", suggestion: "%%styleSuggestion%%", blocking: false },
];
