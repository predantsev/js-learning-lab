// The planner store: data/<dir>/tasks.json, replaced atomically (temp file + rename).
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';

export async function readTasks(dir) {
  return JSON.parse(await readFile(`${dir}/tasks.json`, 'utf8')).records;
}

export async function writeTasks(dir, records) {
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/tasks.json.tmp`, JSON.stringify({ schemaVersion: 1, records }));
  await rename(`${dir}/tasks.json.tmp`, `${dir}/tasks.json`);
}
