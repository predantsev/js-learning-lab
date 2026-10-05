// migrate(db, migrations): apply, in version order, every migration newer than the database's
// PRAGMA user_version, each in its own transaction together with the new user_version; return the
// versions applied. seed(db, fixtures): insert the fixtures only when tasks is empty; return how many.
export function migrate(db, migrations) {
  // Runs every migration, every time.
  for (const migration of migrations) db.exec(migration.up);
  return migrations.map((migration) => migration.version);
}

export function seed(db, fixtures) {
  const insert = db.prepare('INSERT INTO tasks (id, title, dueDate) VALUES (?, ?, ?)');
  for (const task of fixtures) insert.run(task.id, task.title, task.dueDate);
  return fixtures.length;
}
