// Two designs of the same wishlist repository. Both keep { schemaVersion, records } in one JSON
// file and replace it atomically (temp file + rename). They differ in WHEN they write.
//
// kill() is the harness's crash switch: after it, no write may reach the file any more, the way
// SIGKILL would stop the process. Where this differs from a real kill: everything runs in one
// process, so kill() can only stop a write between two awaits (a real SIGKILL can also stop it
// inside writeFile, which leaves a .tmp file next to the store — the atomic rename tolerates
// that); and a power cut, which can lose data the operating system has not yet put on disk
// (fsync), is not simulated at all.
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { rename, writeFile } from 'node:fs/promises';

function fileStore(file) {
  let killed = false;
  return {
    kill() {
      killed = true;
    },
    read() {
      return JSON.parse(readFileSync(file, 'utf8')).records;
    },
    async write(records) {
      const temp = `${file}.${randomUUID()}.tmp`;
      await writeFile(temp, JSON.stringify({ schemaVersion: 1, records }));
      if (killed) throw new Error('killed');
      await rename(temp, file);
    },
  };
}

// Write-through: every add writes the file, one at a time, and resolves only after the rename.
export function writeThrough(file) {
  const store = fileStore(file);
  const records = store.read();
  let tail = Promise.resolve();
  return {
    kill: store.kill,
    add(item) {
      const done = tail.then(async () => {
        records.push(item);
        await store.write(records);
        return item;
      });
      tail = done.catch(() => {});
      return done;
    },
  };
}

// Write-behind cache: add changes memory and resolves at once; a timer flushes every flushMs.
export function cached(file, flushMs) {
  const store = fileStore(file);
  const records = store.read();
  let dirty = false;
  const timer = setInterval(async () => {
    if (!dirty) return;
    dirty = false;
    try {
      await store.write([...records]);
    } catch {
      // killed in the middle of a flush
    }
  }, flushMs);
  return {
    kill() {
      clearInterval(timer);
      store.kill();
    },
    async add(item) {
      records.push(item);
      dirty = true;
      return item;
    },
  };
}

export function readBack(file) {
  return fileStore(file).read();
}
