// The web client's entry: prepares the store and prints how many tasks are due.
import { countDueTasks } from './domain/tasks.ts';
import { sampleTasks } from './web/sample-tasks.ts';
import { loadTasks, seedTasks } from './web/storage.ts';

seedTasks(sampleTasks);

const today = '2026-03-02';
console.log(`%%dueLabel%%: ${countDueTasks(loadTasks(), today)}`);
