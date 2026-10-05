// migrate(db, migrations): apply, in version order, every migration newer than the database's
// PRAGMA user_version, each in its own transaction together with the new user_version; return the
// versions applied. seed(db, fixtures): insert the fixtures only when tasks is empty; return how many.
function inTransaction(db, work) {
  db.exec('BEGIN');
  try {
    work();
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function migrate(db, migrations) {
  const { user_version: current } = db.prepare('PRAGMA user_version').get();
  const pending = migrations.filter((m) => m.version > current).toSorted((a, b) => a.version - b.version);
  for (const { version, up } of pending) {
    inTransaction(db, () => {
      db.exec(up);
      db.exec(`PRAGMA user_version = ${Number(version)}`);
    });
  }
  return pending.map((m) => m.version);
}

export function seed(db, fixtures) {
  let added = 0;
  inTransaction(db, () => {
    if (db.prepare('SELECT 1 FROM tasks LIMIT 1').get() !== undefined) return;
    const insert = db.prepare('INSERT INTO tasks (id, title, dueDate) VALUES (:id, :title, :dueDate)');
    for (const task of fixtures) added += insert.run(task).changes;
  });
  return added;
}
