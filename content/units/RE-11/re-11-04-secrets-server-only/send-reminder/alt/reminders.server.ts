// Server-only. The key stays in config.ts, which only server code imports now.
import { REMINDER_API_KEY } from "./config";

export async function sendReminder(taskId: string): Promise<string> {
  return `sent ${taskId} (key ${REMINDER_API_KEY.slice(0, 4)}…)`;
}
