// Driver (read-only): builds the initial-data script for the page and prints it.
import { expenses } from './expenses.js';
import { toInitialData, serializeForHtml } from './payload.js';

const json = serializeForHtml({ expenses: toInitialData(expenses) });
console.log(`<script id="initial-data" type="application/json">${json}</script>`);
console.log(`JSON.parse → ${JSON.stringify(JSON.parse(json).expenses.map((expense) => expense.label))}`);
