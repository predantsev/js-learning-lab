// Reads a .cpuprofile (the JSON that `node --cpu-prof` writes) and writes a profiling note.

export function topSelfTime(profile, n) {
  // TODO: the n functions with the most self time, largest first
  return [];
}

export function profilingNote({ command, before, after, p95Before, p95After }) {
  // TODO: a short text with the command, both top lists and the p95 change
  return '';
}
