// The server-rendered list page: GET / renders the web project's list component (ui/HabitListPage.ts) with
// react-dom/server, from the habits the repository holds BEFORE rendering, and sends one complete document:
// the markup in #root (nothing else in it, not even a line break — React compares it while hydrating), the
// public initial data in a <script type="application/json"> and the client entry. Only what the page needs
// crosses to the browser: an allowlist of public fields, the day the streaks are counted on (chosen once per
// request, by the server), and every value that must match to the character computed once, here: each streak
// (streakOf for that day) and the day as text. Server settings (the data folder, the port) never do: neither
// in the data nor in the bundle (the client entry imports no server module).
import { renderToString } from "react-dom/server";
import type { Habit } from "../../domain/habits.ts";
import { formatDay, LOCALE } from "../../ui/format.js";
import { clientElement } from "../../ui/HabitListPage.ts";
import type { ListPageData } from "../../ui/HabitListPage.ts";
import { streakOf } from "../../ui/streak.ts";

// The allowlist: new objects with the public fields only — never "everything except a secret".
export function toInitialData(habits: Habit[], requestId: string, today: string): ListPageData {
  const publicHabits = habits.map(({ id, name, completions }) => ({ id: id, name: name, completions: [...completions], streak: streakOf(completions, today), doneToday: completions.includes(today) }));
  return {
    requestId: requestId,
    today: today,
    todayText: formatDay(today, LOCALE),
    habits: publicHabits,
    count: habits.length,
    doneTodayCount: publicHabits.filter((habit) => habit.doneToday).length,
  };
}

// JSON that cannot end the <script> element it sits in: < > & and the two line separators become \u
// escapes. JSON.parse gives back exactly the same value; HTML entities would not work inside <script>.
const ESCAPES: Record<string, string> = { "<": "\\u003c", ">": "\\u003e", "&": "\\u0026", "\u2028": "\\u2028", "\u2029": "\\u2029" };

export function serializeForHtml(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => ESCAPES[char]);
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

export function renderPage(data: ListPageData): string {
  const markup = renderToString(clientElement(data));
  return `<!doctype html>
<html lang="%%htmlLang%%">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%%projectTitle%%</title>
</head>
<body>
<div id="root">${markup}</div>
<script id="initial-data" type="application/json">${serializeForHtml(data)}</script>
<script type="module" src="/client.js"></script>
</body>
</html>
`;
}

// What a render error answers: no error text, no stack — only the request id to find the log line by.
export function fallbackPage(requestId: string): string {
  return `<!doctype html>
<html lang="%%htmlLang%%">
<head><meta charset="utf-8"><title>%%projectTitle%%</title></head>
<body><p>%%listLoadFailedMessage%% (${escapeHtml(requestId)})</p></body>
</html>
`;
}
