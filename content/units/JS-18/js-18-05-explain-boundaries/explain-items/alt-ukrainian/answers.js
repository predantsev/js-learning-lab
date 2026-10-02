// For every boundary: `outcome` — exactly one of the values listed above it,
// `reason` — at least two sentences that justify it and name the code word in brackets.

export const answers = {
  // [fetch] "test-passes-app-breaks" | "test-fails-app-breaks" | "both-pass"
  mock: {
    outcome: "test-passes-app-breaks",
    reason: "Тест підміняє fetch через mockFetch, тож отримує старий масив, який написав автор тесту, хоч би що сервер відповідав тепер. Справжній застосунок викликає справжній fetch, отримує { rooms: [...] } замість масиву, і список ламається.",
  },

  // [let] "undefined-then-ReferenceError" | "ReferenceError-on-first-line" | "undefined-twice" | "5-then-3"
  tdz: {
    outcome: "undefined-then-ReferenceError",
    reason: "Оголошення var створюється зі значенням undefined ще до виконання файла, тому перший рядок друкує undefined. Змінна let теж існує від початку, але до свого рядка перебуває в temporal dead zone, тож читання limit раніше кидає ReferenceError.",
  },

  // [require] "1-then-0" | "1-then-1" | "0-then-0" | "0-then-1"
  modules: {
    outcome: "1-then-0",
    reason: "Імпорт ES-модуля — це жива прив’язка до змінної модуля-експортера, тому після increment() main.mjs читає нове значення 1. У CommonJS require повертає об’єкт exports, а деструктуризація копіює count на ту мить, тож main.cjs і далі друкує 0.",
  },

  // [localStorage] "cookie-only" | "storage-only" | "both" | "neither"
  storage: {
    outcome: "cookie-only",
    reason: "localStorage належить origin, а http://localhost:5173 і http://localhost:8080 — різні origin, бо різні порти. Host-only cookie обмежується хостом і шляхом, але не портом, тож браузер надсилає його й на localhost:8080.",
  },

  // [Access-Control-Allow-Origin] "server-handles-page-cannot-read" | "browser-never-sends" | "server-refuses"
  cors: {
    outcome: "server-handles-page-cannot-read",
    reason: "Браузер надсилає цей простий POST без preflight, і сервер його отримує й обробляє. Без Access-Control-Allow-Origin браузер лише ховає відповідь від скрипту сторінки, тож CORS захищає читача в браузері, а не сервер: сервер має перевіряти запит сам.",
  },

  // [FinalizationRegistry] "maybe-later-or-never" | "right-after-dropped" | "before-dropped"
  finalizer: {
    outcome: "maybe-later-or-never",
    reason: "Присвоєння draft = null лише робить об’єкт недосяжним; чи і коли його прибрати, вирішує збирач сміття. Колбек FinalizationRegistry може виконатися значно пізніше або ніколи, тому правильне прибирання на нього не покладається, а використовує try/finally чи явний close.",
  },
};
