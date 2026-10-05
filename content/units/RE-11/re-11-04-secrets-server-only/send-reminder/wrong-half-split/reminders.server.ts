// Server-only: never imported by client code.
const REMINDER_API_KEY = "demo-REM1-not-a-real-key";

export async function sendReminder(taskId: string): Promise<string> {
  return `sent ${taskId} (key ${REMINDER_API_KEY.slice(0, 4)}…)`;
}
