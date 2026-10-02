// Checks only that overall equals the sum of the category totals.
export function assertInvariant(totals) {
  let overall = 0;
  for (const total of totals.byCategory.values()) {
    overall = overall + total;
  }
  if (overall !== totals.overall) {
    throw new Error(`%%wrongOverall%% ${totals.overall} ≠ ${overall}`);
  }
}
