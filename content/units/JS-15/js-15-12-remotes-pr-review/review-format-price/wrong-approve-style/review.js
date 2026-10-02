// Mistake: a style-only review that approves without finding a failing input.
export const review = {
  failingInput: 1250,
  expected: "12.50 UAH",
  defectComment: "Nice refactor. I would rename cents to minor for 1250-like amounts.",
  question: "Could you use const everywhere?",
  decision: "approve",
  reason: "The code is easier to read now.",
};
