// For the terminal only: a one-shot client of the API started by serve.mjs.
//   node client.mjs add "<title>" <YYYY-MM-DD>   creates a task
//   node client.mjs list <YYYY-MM-DD>            lists the tasks and the count due by that day
import { createDataLayer, createMemoryStorage, createWebAdapter, countDue } from './system.js';

const [command, ...rest] = process.argv.slice(2);
const data = createDataLayer(createWebAdapter({ baseUrl: process.env.API_BASE_URL ?? 'http://127.0.0.1:7350', storage: createMemoryStorage() }));

if (command === 'add') {
  const [title, dueDate] = rest;
  const task = await data.createRecord({ title, dueDate: dueDate ?? null });
  console.log(`%%created%% ${task.id}: ${task.title} (%%due%% ${task.dueDate})`);
} else if (command === 'list') {
  const { records, stale, failure } = await data.listRecords();
  for (const task of records) console.log(`${task.id}  ${task.done ? '[x]' : '[ ]'} ${task.title}  ${task.dueDate ?? '-'}`);
  console.log(stale ? `%%staleLabel%% ${failure}` : `%%freshDue%% ${rest[0]}: ${countDue(records, rest[0])}`);
} else {
  console.log('%%usage%%: node client.mjs add "<title>" <YYYY-MM-DD> | node client.mjs list <YYYY-MM-DD>');
}
