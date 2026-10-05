// A workshop booking database: rooms, sessions and bookings. See the task for every rule.
import { fixtures } from './data.js';

// Version 1 creates the tables; version 2 adds sessions.level. Fill in both.
export const migrations = [
  { version: 1, up: '' },
  { version: 2, up: '' },
];

export function migrate(db) {
  return [];
}

export function seed(db) {
  return false;
}

export function sessionsWithRoom(db, day) {
  return [];
}

export function bookingsPerSession(db) {
  return [];
}

export function fullSessions(db) {
  return [];
}

export const indexSql = '';

export const report = { indexReason: '', storageChoice: '' };
