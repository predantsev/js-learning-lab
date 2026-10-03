// What the browser may call: a request to OUR server, which adds the key itself.
// The server route is pretended here; you will write a real one in the Node.js stage.
export async function requestReminder(taskId: string): Promise<string> {
  console.log(`POST /api/reminders { taskId: "${taskId}" }`);
  return `queued ${taskId}`;
}
