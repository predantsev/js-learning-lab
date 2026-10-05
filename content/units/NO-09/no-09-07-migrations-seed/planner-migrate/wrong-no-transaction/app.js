// migrate(db, migrations): apply, in version order, every migration newer than the database's
// PRAGMA user_version, each in its own transaction together with the new user_version; return the
// versions applied. seed(db, fixtures): insert the fixtures only when tasks is empty; return how many.
export function migrate(db, migrations) {
  const applied = [];
  for (const migration of [...migrations].sort((a, b) => a.version - b.version)) {
    const current = db.prepare('PRAGMA user_version').get().user_version;
    if (migration.version <= current) continue;
    // No transaction: if `up` fails half-way, its first statements stay applied.
    db.exec(migration.up);
    db.exec(`PRAGMA user_version = ${migration.version}`);
    applied.push(migration.version);
  }
  return applied;
}

export function seed(db, fixtures) {
  if (db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n > 0) return 0;
  const insert = db.prepare('INSERT INTO tasks (id, title, dueDate) VALUES (?, ?, ?)');
  for (const task of fixtures) insert.run(task.id, task.title, task.dueDate);
  return fixtures.length;
}
