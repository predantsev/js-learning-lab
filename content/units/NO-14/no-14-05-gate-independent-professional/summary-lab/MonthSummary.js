// The shared month summary component (read-only): the heading, the month’s total and the
// categories with their totals, counts and largest expense.
import { createElement as h } from './mini-react.js';

const CATEGORY = { food: `%%food%%`, transport: `%%transport%%`, home: `%%home%%`, fun: `%%fun%%` };
const money = (minor) => (minor / 100).toFixed(2);

export function MonthSummary({ summary }) {
  return h('section', null,
    h('h1', null, `%%heading%% `, summary.month),
    h('p', null, `%%total%%: `, money(summary.total)),
    h('ul', null, summary.categories.map((row) =>
      h('li', { key: row.category }, CATEGORY[row.category] ?? row.category, ' — ', money(row.total), ' (', row.count, ') · ', row.largest))));
}
