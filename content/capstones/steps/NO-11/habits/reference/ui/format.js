// Display text for the page. The stored values stay canonical (a completion is "YYYY-MM-DD" text);
// only the page turns them into text, in the language of the project.

// The language of dates on the page.
export const LOCALE = "%%formatLocale%%";

// A calendar date "YYYY-MM-DD" as a long date, for example "1 березня 2026 р." (uk-UA) or
// "March 1, 2026" (en-US). new Date("YYYY-MM-DD") is midnight in UTC, so the formatter also uses
// UTC: then every computer shows the same day, whatever its time zone.
export function formatDay(day, locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(day));
}
