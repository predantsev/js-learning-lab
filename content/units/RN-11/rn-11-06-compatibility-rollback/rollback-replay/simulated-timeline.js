// SIMULATION for the preview only (read-only). It replays what happens on ONE phone over time:
// the store installs each build over the previous one, and every build keeps the same on-device
// storage. Nothing is installed or stored for real.
import { migrateToV2 } from './migration-v2.js';
import { readTasks } from './reader-build2.js';

export function replay(v1Tasks) {
  const events = [];
  let stored = { schemaVersion: 1, records: v1Tasks };
  events.push({ build: 1, versionCode: 1, text: 'saved', schema: stored.schemaVersion });

  stored = migrateToV2(stored); // build 3 starts and migrates the data it finds
  events.push({ build: 3, versionCode: 3, text: 'migrated', schema: stored.schemaVersion });

  const read = readTasks(stored); // "rollback": build 2's code shipped as build 4
  const done = read.tasks.filter((task) => task.done).length;
  events.push({ build: 4, versionCode: 4, text: read.status, schema: stored.schemaVersion, count: read.tasks.length, done });
  return events;
}
