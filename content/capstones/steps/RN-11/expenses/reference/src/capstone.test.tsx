// Jest tests of the native expense tracker, at three levels: a unit test of the shared totals in whole
// kopiykas, a typed-validation test of stored JSON (the other half is src/__typetests__/expense.ts,
// checked by tsc), and a component test of the form's validation messages.
import { render, screen, userEvent } from '@testing-library/react-native';
import { parseExpenseList } from '../data/model.ts';
import { summarizeExpenses } from '../domain/expenses.ts';
import type { Expense } from '../domain/expenses.ts';
import { ExpenseForm } from './ExpenseForm.tsx';

test('the totals of every category and the overall total are whole kopiykas', () => {
  const list: Expense[] = [
    { id: 'e-01', label: '%%fixture1Name%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
    { id: 'e-04', label: '%%fixture4Name%%', amountMinor: 9990, date: '2026-02-27', category: 'home' },
    { id: 'e-06', label: '%%fixture6Name%%', amountMinor: 21050, date: '2026-03-02', category: 'food' },
  ];
  const summary = summarizeExpenses(list);
  expect(summary).toEqual({ total: 115590, byCategory: { food: 105600, transport: 0, home: 9990, fun: 0 } });
  expect(Number.isInteger(summary.total)).toBe(true);
});

test('a stored expense with an amount that is not a whole number of kopiykas is refused by the contract', () => {
  const stored = JSON.parse('[{"id":"e-01","label":"%%fixture1Name%%","amountMinor":845.5,"date":"2026-03-01","category":"food"}]');
  const parsed = parseExpenseList(stored);
  expect(parsed.ok).toBe(false);
  expect(parsed.ok ? null : Object.keys(parsed.errors)).toEqual(['1.amountMinor']);
});

test('saving an empty form shows every validation message and saves nothing', async () => {
  const onSave = jest.fn();
  await render(<ExpenseForm expense={null} onSave={onSave} />);
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: '%%saveLabel%%' }));
  expect(screen.getByText('%%labelRequiredMessage%%')).toBeOnTheScreen();
  expect(screen.getByText('%%invalidMessage%%')).toBeOnTheScreen();
  expect(screen.getByText('%%badDateMessage%%')).toBeOnTheScreen();
  expect(screen.getByText('%%requiredMessage%%')).toBeOnTheScreen();
  expect(onSave).not.toHaveBeenCalled();
});
