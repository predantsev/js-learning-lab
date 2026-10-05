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
  { file: "domain/locker.js", line: 2, problem: "%%styleProblem%%", evidence: "%%styleEvidence%%", suggestion: "%%styleSuggestion%%", blocking: false },
  { file: "domain/locker.js", line: 4, problem: "%%styleProblem%%", evidence: "%%styleEvidence%%", suggestion: "%%styleSuggestion%%", blocking: false },
  { file: "domain/locker.js", line: 19, problem: "%%c3Problem%%", evidence: "%%c3Evidence%%", suggestion: "%%c3Suggestion%%", blocking: true },
];
