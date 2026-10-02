// Your review of the pull request “Simplify the overlap check”.

// A case the change gets wrong: an existing booking and a request for the same room.
export const failingCase = {
  existing: { id: "b-7", room: "C", start: "2026-09-01", end: "2026-09-03" },
  request: { room: "C", start: "2026-08-30", end: "2026-09-05" },
};

// A review comment on the changed line: what is wrong, on which dates.
export const defectComment =
  "Нова умова дивиться лише на день заїзду. Запит 2026-08-30 – 2026-09-05 повністю накриває бронювання 2026-09-01 – 2026-09-03, але починається раніше за нього, тож його приймуть і кімнату продадуть двічі.";

// Why a test that replaces the rules with a stand-in keeps passing on this change.
export const mockExplanation =
  "У mocked-тесті canBook підмінено функцією, що завжди відповідає однаково, тож справжнє правило перетину там не виконується взагалі — тест бачить лише, що сервіс зберігає дозволене.";

// "approve" or "request-changes".
export const decision = "request-changes";

// A short decision write-up for the pull request: the decision, the evidence, what must change.
export const writeUp =
  "Рішення: request changes. Спрощена overlaps пропускає запити, що починаються до наявного бронювання: 2026-08-30 – 2026-09-05 проти 2026-09-01 – 2026-09-03 приймається. Доказ: unit- та integration-тести падають на гілці й проходять на main, а mocked-тест проходить на обох, бо не викликає справжнього правила. Потрібно повернути двобічну перевірку й лишити нові тести.";
