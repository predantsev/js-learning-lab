// formatDay("2026-03-05") → "05.03.2026"
export function formatDay(day) {
  return day.slice(8, 10) + "." + day.slice(5, 7) + "." + day.slice(0, 4);
}
