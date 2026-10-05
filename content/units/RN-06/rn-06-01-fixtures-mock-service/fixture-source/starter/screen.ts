// Screen code: it asks a source for the tasks and never looks at where they come from.
import type { RecordsSource } from './source.ts';
import type { Task } from './types.ts';

export async function pendingTitles(source: RecordsSource<Task>): Promise<string[]> {
  const tasks = await source.list();
  return tasks.filter((task) => !task.done).map((task) => task.title);
}
