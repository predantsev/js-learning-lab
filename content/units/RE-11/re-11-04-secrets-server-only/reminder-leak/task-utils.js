// Shared helpers for tasks. Looks harmless.
import { sendReminder } from "./reminders";

export function remindAbout(taskId) {
  return sendReminder(taskId);
}
