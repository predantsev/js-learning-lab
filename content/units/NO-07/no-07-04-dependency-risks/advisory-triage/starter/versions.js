// compareVersions(a, b) for plain "MAJOR.MINOR.PATCH" versions (read-only):
// a negative number when a is older, 0 when equal, a positive number when a is newer.
export function compareVersions(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}
