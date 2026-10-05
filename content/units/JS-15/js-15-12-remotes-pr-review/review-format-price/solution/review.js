// Your review of the pull request. Fill in every field.
export const review = {
  // An amount in minor units for which the new formatPrice gives a wrong text.
  failingInput: 1205,
  // The text formatPrice should return for that amount.
  expected: "12.05 UAH",
  // For the author: what is wrong and for which input.
  defectComment: "For 1205 the new formatPrice returns \"12.5 UAH\" instead of \"12.05 UAH\": cents below 10 lose their leading zero.",
  // One question about the intent of the change; it ends with a question mark.
  question: "Which amount showed a floating-point problem with toFixed?",
  // "approve" or "request-changes"
  decision: "request-changes",
  // Why you chose that decision.
  reason: "The change shows wrong prices for every amount whose cents are below 10, so it must not be merged as it is.",
};
