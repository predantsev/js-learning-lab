// The bookmarks store on disk: <dir>/bookmarks.json = { schemaVersion: 1, records: [...] }. Read-only.
import { readFile } from 'node:fs/promises';

export async function readBookmarks(dir) {
  return JSON.parse(await readFile(`${dir}/bookmarks.json`, 'utf8')).records;
}

// The summary a person sees: how many bookmarks, how many of them archived.
export function summaryOf(records) {
  return { total: records.length, archived: records.filter((b) => b.archived).length };
}
