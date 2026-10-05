// Jest test of the CP-RN enhancement as a person sees it: the month's totals in full and the category filter.
import { render, screen, userEvent } from '@testing-library/react-native';
import type { Expense } from '../domain/expenses.ts';
import { createMoneyFormat } from './adapters.ts';
import { SummaryView } from './SummaryView.tsx';

const format = createMoneyFormat('%%formatLocale%%');
const expenses: Expense[] = [
  { id: 'e-01', label: '%%fixture1Name%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: '%%fixture2Name%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-06', label: '%%fixture6Name%%', amountMinor: 21050, date: '2026-03-02', category: 'food' },
  { id: 'e-03', label: '%%fixture3Name%%', amountMinor: 18000, date: '2026-02-28', category: 'fun' },
];

test('the latest month comes first with its totals in full', async () => {
  await render(<SummaryView expenses={expenses} format={format} />);
  expect(screen.getByLabelText('%%totalLabel%%: ' + format.money(157600))).toBeOnTheScreen();
  expect(screen.getByLabelText('%%categoryFood%%: ' + format.money(105600))).toBeOnTheScreen();
  expect(screen.queryByText(/%%fixture3Name%%/)).toBeNull();
});

test('the category filter, found by its label, shows only that category of the month', async () => {
  await render(<SummaryView expenses={expenses} format={format} />);
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: '%%categoryFieldLabel%%: %%categoryTransport%%' }));
  expect(screen.getByText('%%fixture2Name%%, 2026-03-01, ' + format.money(52000))).toBeOnTheScreen();
  expect(screen.queryByText(/%%fixture1Name%%/)).toBeNull();
  await user.press(screen.getByRole('button', { name: '%%monthLabel%%: 2026-02' }));
  expect(screen.getByLabelText('%%totalLabel%%: ' + format.money(18000))).toBeOnTheScreen();
});
