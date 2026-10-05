// Lists pending and done tasks through both repositories and prints the storage note.
import { writeTasksFile, createTasksDb } from './fixtures.js';
import { createFileRepo, createSqlRepo, choice } from './repos.js';

await writeTasksFile('tasks.json');
const repos = { file: createFileRepo('tasks.json'), sqlite: createSqlRepo(createTasksDb()) };
for (const [name, repo] of Object.entries(repos)) {
  for (const status of ['pending', 'done']) {
    try {
      const list = await repo.list({ status });
      console.log(`${name} ${status}: ${list.map((t) => `${t.id} ${t.dueDate ?? '—'}`).join(', ')}`);
    } catch (error) {
      console.log(`${name} ${status}: ${error.message}`);
    }
  }
}
console.log('choice:', JSON.stringify(choice));
