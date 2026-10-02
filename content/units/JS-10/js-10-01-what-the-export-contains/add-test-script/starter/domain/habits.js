// A short piece of the habit tracker's domain module, as it was exported.

// The share of planned days that were done, as a whole percent; no planned days gives 0.
export function completionRate(done, planned) {
  if (planned === 0) {
    return 0;
  }
  return Math.round((done / planned) * 100);
}
