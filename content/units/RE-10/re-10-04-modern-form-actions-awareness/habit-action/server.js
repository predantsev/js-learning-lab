// A pretend server: answers after 400 ms, or refuses while `refuse` is true.
export const server = { refuse: false };

export async function saveName(habitId, name) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (server.refuse) throw new Error(`Saving ${habitId} was refused`);
  return name;
}
