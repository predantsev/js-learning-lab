// Everything about reminders in one module — public values and the secret side by side.
export const APP_NAME = "%%appName%%";
export const MAX_REMINDERS = 3;
export const REMINDER_API_KEY = "demo-REM1-not-a-real-key";

export async function sendReminder(taskId: string): Promise<string> {
  // A pretend call to the reminder service, which checks the key.
  return `sent ${taskId} (key ${REMINDER_API_KEY.slice(0, 4)}…)`;
}
