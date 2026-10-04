// Builds the workshop database with your migrations and seed, then prints your queries and the plan.
import { DatabaseSync } from 'node:sqlite';
import { attendeeQuery } from './data.js';
import * as workshop from './workshop.js';

const attempt = (label, work) => {
  try {
    console.log(label, '→', JSON.stringify(work()));
  } catch (error) {
    console.log(label, '→', error.message);
  }
};
const db = new DatabaseSync(':memory:');
attempt('migrate', () => workshop.migrate(db));
attempt('seed', () => workshop.seed(db));
attempt('version', () => db.prepare('PRAGMA user_version').get().user_version);
attempt('sessionsWithRoom 2026-04-10', () => workshop.sessionsWithRoom(db, '2026-04-10'));
attempt('bookingsPerSession', () => workshop.bookingsPerSession(db));
attempt('fullSessions', () => workshop.fullSessions(db));
attempt('plan before your index', () => db.prepare(`EXPLAIN QUERY PLAN ${attendeeQuery}`).all().map((r) => r.detail));
attempt('indexSql', () => db.exec(workshop.indexSql));
attempt('plan after your index', () => db.prepare(`EXPLAIN QUERY PLAN ${attendeeQuery}`).all().map((r) => r.detail));
attempt('report', () => workshop.report);
