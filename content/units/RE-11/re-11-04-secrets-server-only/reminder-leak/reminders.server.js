// The same code, marked server-only by its name: a client import of this file stops the build.
const REMINDER_API_KEY = "demo-REM1-not-a-real-key";

export async function sendReminder(taskId) {
  return `sent ${taskId} (key ${REMINDER_API_KEY.slice(0, 4)}…)`;
}
