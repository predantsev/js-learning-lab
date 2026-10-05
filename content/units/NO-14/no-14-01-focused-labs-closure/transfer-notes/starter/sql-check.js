// Check 1 (SQL, NO-09): a parameterized join with an aggregate over fresh synthetic habit data.
import { DatabaseSync } from 'node:sqlite';

export function openHabitDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE habits (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE checkins (
      habitId TEXT NOT NULL REFERENCES habits(id),
      day TEXT NOT NULL,
      PRIMARY KEY (habitId, day)
    );
  `);
  const addHabit = db.prepare('INSERT INTO habits (id, name) VALUES (?, ?)');
  addHabit.run('h-11', `%%stretch%%`);
  addHabit.run('h-12', `%%journal%%`);
  addHabit.run('h-13', `%%noPhone%%`);
  const addCheckin = db.prepare('INSERT INTO checkins (habitId, day) VALUES (?, ?)');
  for (const [habitId, day] of [['h-11', '2026-04-29'], ['h-11', '2026-05-02'], ['h-11', '2026-05-03'], ['h-12', '2026-05-03']]) {
    addCheckin.run(habitId, day);
  }
  return db;
}

// Every habit with the number of check-ins on or after `since`, zero included; most done first.
export function doneSince(db, since) {
  const rows = db.prepare(`
    SELECT h.name AS name, COUNT(c.day) AS done
    FROM habits h
    LEFT JOIN checkins c ON c.habitId = h.id AND c.day >= ?
    GROUP BY h.id
    ORDER BY done DESC, h.id
  `).all(since);
  return rows.map((row) => ({ name: row.name, done: row.done }));
}
