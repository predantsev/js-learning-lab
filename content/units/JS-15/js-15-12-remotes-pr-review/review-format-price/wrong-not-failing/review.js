// Mistake: requests changes, but the named input does not actually fail.
export const review = {
  failingInput: 84550,
  expected: "845.50 UAH",
  defectComment: "I think 84550 is formatted wrongly.",
  question: "Did you test this?",
  decision: "request-changes",
  reason: "It might be wrong for some amounts.",
};
