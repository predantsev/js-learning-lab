// Your review of the pull request. Fill in every field.
export const review = {
  failingInput: 5,
  expected: "0.05 UAH",
  defectComment: "Для 5 копійок нова версія показує 0.5 UAH, тобто в десять разів більше.",
  question: "Чи є тест на суми, менші за 10 копійок?",
  decision: "request-changes",
  reason: "Ціни показуються неправильно, а це помилка, а не питання стилю.",
};
