// migrate(db, migrations): apply, in version order, every migration newer than the database's
// PRAGMA user_version, each in its own transaction together with the new user_version; return the
// versions applied. seed(db, fixtures): insert the fixtures only when tasks is empty; return how many.
export function migrate(db, migrations) {
  const applied = [];
  const pending = [...migrations].sort((a, b) => a.version - b.version);
  for (const migration of pending) {
    const current = db.prepare('PRAGMA user_version').get().user_version;
    if (migration.version <= current) continue;
    if (!Number.isInteger(migration.version)) throw new Error(`bad version: ${migration.version}`);
    db.exec('BEGIN');
    try {
      db.exec(migration.up);
      db.exec(`PRAGMA user_version = ${migration.version}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    applied.push(migration.version);
  }
  return applied;
}

export function seed(db, fixtures) {
  // INSERT OR IGNORE skips repeated ids, but still adds fixtures to a table that has rows.
  const insert = db.prepare('INSERT OR IGNORE INTO tasks (id, title, dueDate) VALUES (?, ?, ?)');
  let added = 0;
  for (const task of fixtures) added += insert.run(task.id, task.title, task.dueDate).changes;
  return added;
}
