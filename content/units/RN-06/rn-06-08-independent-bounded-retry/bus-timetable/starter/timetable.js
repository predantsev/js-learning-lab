// The bus-timetable feed of a synthetic bus stop. The rules are in the task.

export function isValidTimetable(body) {
  return false;
}

export async function loadTimetable(url, { fetchFn, timeoutMs = 3000, maxAttempts = 3, baseDelayMs = 300, signal } = {}) {
  return { status: 'offline' };
}
