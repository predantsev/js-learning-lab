// Dates as "YYYY-MM-DD" text. Read-only helpers.

// Today's date on this computer, as "YYYY-MM-DD". Changes every day: code under test takes
// `today` as a parameter instead of calling this.
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// The date `days` days after `iso` (negative goes back): addDays("2026-02-27", 3) is "2026-03-02".
// Works in UTC, so a daylight-saving change never shifts the result.
export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
