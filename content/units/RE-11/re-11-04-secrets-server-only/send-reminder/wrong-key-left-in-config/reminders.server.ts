// Server-only: never imported by client code. But config.ts was left as it was, so the key still
// sits in an unmarked module too — one future client import away from the bundle.
const REMINDER_API_KEY = "demo-REM1-not-a-real-key";

export async function sendReminder(taskId: string): Promise<string> {
  // A pretend call to the reminder service, which checks the key.
  return `sent ${taskId} (key ${REMINDER_API_KEY.slice(0, 4)}…)`;
}
