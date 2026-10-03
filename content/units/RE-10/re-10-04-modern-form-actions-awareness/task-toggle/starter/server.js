// A pretend server: answers after 300 ms, or refuses while `refuse` is true.
export const server = { refuse: false };

export async function saveTaskDone(taskId, done) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (server.refuse) throw new Error(`Saving ${taskId} was refused`);
  return done;
}
