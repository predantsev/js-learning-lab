// Your review of the pull request. Fill in every field.
export const review = {
  failingInput: 300,
  expected: "3.00 UAH",
  defectComment: "A whole price loses its second zero: the new version shows 3.0 instead of 3.00.",
  question: "Why not keep toFixed(2), which already handles this?",
  decision: "request-changes",
  reason: "Prices with zero cents are displayed wrongly, which users will see on every such item.",
};
