// Your decision record for the locker and your review of pr.diff.
export const decision = {
  choice: "", // which structures you chose for lookups by code and for returns in arrival order
  rejected: { option: "", reason: "" }, // the alternative you did not choose, and why
  evidence: "", // your measurements at 1,000, 10,000 and 100,000 parcels
  consequences: "", // what the choice costs or requires from now on
};

// Every comment: { file, line, problem, evidence, suggestion, blocking }; file is "domain/locker.js",
// line is a line number in after/domain/locker.js.
export const comments = [];
