// day-utils 1.2.0 — a small vendored date helper (a copy of a dependency kept in the project).
// Days are 'YYYY-MM-DD' strings, so text order is calendar order.
export const version = '1.2.0';

// Is `day` on or before `limit`?
export function isOnOrBefore(day, limit) {
  return day <= limit;
}
