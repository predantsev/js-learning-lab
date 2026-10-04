// The planner lab's repository: the whole list in one JSON file { schemaVersion, records },
// replaced atomically (temp file + rename, NO-02), one change at a time (single-writer queue, NO-05).
import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';

export function openRepository(file) {
  let tail = Promise.resolve();
  const read = async () => JSON.parse(await readFile(file, 'utf8'));
  const save = async (store) => {
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(store));
    await rename(temp, file);
  };
  // change(fn): read the store, let fn change it, save it — queued behind every earlier change.
  const change = (fn) => {
    const result = tail.then(async () => {
      const store = await read();
      const value = fn(store);
      await save(store);
      return value;
    });
    tail = result.catch(() => {});
    return result;
  };
  return {
    async list() {
      return (await read()).records;
    },
    add(task) {
      return change((store) => {
        store.records.push(task);
        return task;
      });
    },
  };
}
