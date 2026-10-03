// "This file runs on the server": it talks to the reminder service with a key.
// The key is made up — but a real one would leak exactly like this.
const REMINDER_API_KEY = "demo-REM1-not-a-real-key";

export async function sendReminder(taskId) {
  // A pretend call to the reminder service, which checks the key.
  return `sent ${taskId} (key ${REMINDER_API_KEY.slice(0, 4)}…)`;
}
