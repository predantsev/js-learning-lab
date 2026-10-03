// What the browser may do: ask OUR server, which adds the key itself (you will write it in the
// Node.js stage). Here the answer is pretended.
export async function requestReminder(taskId) {
  console.log(`POST /api/reminders { taskId: "${taskId}" }`);
  return `queued ${taskId}`;
}
