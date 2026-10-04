// day-utils 1.3.0 — a minor release. Changelog: "isOnOrBefore compares Date objects, which also
// rejects invalid dates". Nothing in the changelog says the same day now counts differently.
export const version = '1.3.0';

export function isOnOrBefore(day, limit) {
  const a = new Date(day);
  const b = new Date(limit);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return a < b;
}
