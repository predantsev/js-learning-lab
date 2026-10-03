// Server-only: never imported by client code.
const REMINDER_API_KEY = "demo-REM1-not-a-real-key";

export async function sendReminder(taskId: string): Promise<string> {
  // A pretend call to the reminder service, which checks the key.
  return `sent ${taskId} (key ${REMINDER_API_KEY.slice(0, 4)}…)`;
}
