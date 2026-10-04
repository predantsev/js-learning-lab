// The task store: one JSON file in DATA_DIR, replaced atomically (temp file + rename, as in NO-02).
// Saves run one after another (as in NO-05): two concurrent saves of one temp file would collide.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fixtures, type Task } from './tasks.ts';

export type Store = { list(): Task[]; add(task: Task): Promise<void> };

export async function openStore(dataDir: string): Promise<Store> {
  const file = path.join(dataDir, 'tasks.json');
  await mkdir(dataDir, { recursive: true });
  let tasks: Task[];
  try {
    tasks = JSON.parse(await readFile(file, 'utf8')).records;
  } catch {
    tasks = structuredClone(fixtures);
  }
  let queue: Promise<void> = Promise.resolve();
  const save = () => {
    queue = queue.then(async () => {
      await writeFile(`${file}.tmp`, JSON.stringify({ schemaVersion: 1, records: tasks }));
      await rename(`${file}.tmp`, file);
    });
    return queue;
  };
  await save();
  return {
    list: () => tasks,
    async add(task) {
      tasks.push(task);
      await save();
    },
  };
}
