// Your review of the pull request. Fill in every field.
export const review = {
  failingTasks: [
    { title: "Полити квіти", done: false, dueDate: "2026-03-02" },
    { title: "Написати бабусі", done: false, dueDate: null },
    { title: "Оплатити інтернет", done: true, dueDate: "2026-02-27" },
    { title: "Здати книжки", done: false, dueDate: "2026-02-28" },
  ],
  today: "2026-03-02",
  expected: 2,
  defectComment: "Для today = 2026-03-02 нова версія дає 1 замість 2: справа з терміном саме сьогодні не рахується.",
  question: "Навіщо змінювати порівняння, якщо мета була лише переписати filter на цикл?",
  decision: "request-changes",
  reason: "Лічильник неправильний на граничному дні, тож злиття зламає головну цифру планувальника.",
};
