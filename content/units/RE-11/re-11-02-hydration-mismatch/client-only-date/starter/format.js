// "2026-03-01" → the date in the reader's browser language, for example "1 березня 2026 р." or
// "March 1, 2026". Plain calendar dates are read and formatted in UTC, so no time zone shifts the day.
export function formatDay(iso) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}
