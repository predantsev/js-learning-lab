// Server-only: the key and the call that uses it live here and nowhere else.
const REMINDER_API_KEY = "demo-REM1-not-a-real-key";

export async function sendReminder(taskId: string): Promise<string> {
  return `sent ${taskId} (key ${REMINDER_API_KEY.slice(0, 4)}…)`;
}
