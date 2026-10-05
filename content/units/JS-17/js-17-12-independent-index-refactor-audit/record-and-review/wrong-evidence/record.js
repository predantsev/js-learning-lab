// Your decision record for the locker and your review of pr.diff.
export const decision = {
  choice: "%%sChoice%%",
  rejected: { option: "%%sRejected%%", reason: "%%sRejectedReason%%" },
  evidence: "%%weakEvidence%%",
  consequences: "%%sConsequences%%",
};

// Every comment: { file, line, problem, evidence, suggestion, blocking }; file is "domain/locker.js",
// line is a line number in after/domain/locker.js.
export const comments = [
  { file: "domain/locker.js", line: 7, problem: "%%c1Problem%%", evidence: "%%c1Evidence%%", suggestion: "%%c1Suggestion%%", blocking: true },
  { file: "domain/locker.js", line: 11, problem: "%%c2Problem%%", evidence: "%%c2Evidence%%", suggestion: "%%c2Suggestion%%", blocking: true },
  { file: "domain/locker.js", line: 19, problem: "%%c3Problem%%", evidence: "%%c3Evidence%%", suggestion: "%%c3Suggestion%%", blocking: true },
];
