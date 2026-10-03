import { expenses } from './expenses.js';
import { formatterStats } from './format.js';

const row = (id) => screen.$(`[data-testid="row-${id}"]`);
// Intl puts non-breaking spaces into formatted values; compare with every kind of space as a plain one.
const plain = (text) => String(text).replace(/\s/g, ' ');
const rowText = (id) => plain(row(id)?.textContent ?? '');
const reverseButton = () => screen.byRole('button', { name: L.reverse });
const money = (expense) => new Intl.NumberFormat(L.locale, { style: 'currency', currency: 'UAH' }).format(expense.amountMinor / 100);
const day = (expense) => new Intl.DateTimeFormat(L.locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${expense.date}T00:00:00Z`));

test('rows show formatted amounts and dates', async () => {
  await waitFor(() => row('e-001'));
  for (const expense of expenses.slice(0, 3)) {
    expect(rowText(expense.id), `text of row ${expense.id}`).toContain(plain(money(expense)));
    expect(rowText(expense.id), `text of row ${expense.id}`).toContain(plain(day(expense)));
  }
});

test('the whole list builds at most two formatters, even after reordering', async () => {
  await waitFor(() => row('e-001'));
  for (let i = 0; i < 3; i += 1) {
    await user.click(reverseButton());
    await settle();
  }
  expect(formatterStats.created, 'formatters built since the program started').toBeLessThanOrEqual(2);
});

test('after reordering every row still shows its own amount', async () => {
  await waitFor(() => row('e-200'));
  const last = expenses.at(-1);
  expect(rowText(last.id), `text of row ${last.id}`).toContain(plain(money(last)));
});
