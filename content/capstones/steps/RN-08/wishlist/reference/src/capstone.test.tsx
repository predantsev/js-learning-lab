// Jest tests of the native wishlist, at three levels: a unit test of the shared rule, a typed-validation
// test of stored JSON (the other half is src/__typetests__/wish.ts, checked by tsc), and a component test
// of the row's main action, found by its accessible name as a person finds it.
import { useState } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { parseItemList } from '../data/model.ts';
import { summarizeItems } from '../domain/wishes.ts';
import type { Wish } from '../domain/wishes.ts';
import { itemsReducer } from '../ui/itemsReducer.ts';
import { createPriceFormat } from './adapters.ts';
import { ItemRow } from './ItemRow.tsx';

const headphones: Wish = { id: 'w-01', name: '%%fixture1Name%%', price: 80, acquired: false, category: null };

test('the wanted total adds only wanted wishes with a price and counts the ones without a price', () => {
  const list: Wish[] = [
    headphones,
    { id: 'w-04', name: '%%fixture4Name%%', price: 25, acquired: true, category: null },
    { id: 'w-05', name: '%%fixture5Name%%', price: null, acquired: false, category: null },
    { id: 'w-06', name: '%%fixture6Name%%', price: 0, acquired: false, category: null },
  ];
  expect(summarizeItems(list)).toEqual({ count: 4, wantedTotal: 80, wantedWithoutPrice: 1 });
});

test('a stored wish whose price was saved as text is refused by the contract', () => {
  const stored = JSON.parse('[{"id":"w-01","name":"%%fixture1Name%%","price":"80","acquired":false,"category":null}]');
  const parsed = parseItemList(stored);
  expect(parsed.ok).toBe(false);
  expect(parsed.ok ? null : parsed.errors).toEqual({ '1.price': 'notWholeNonNegative' });
});

// The row with the list's state around it, so that the press goes through the real reducer.
function RowWithState() {
  const [list, setList] = useState<Wish[]>([headphones]);
  return (
    <ItemRow
      item={list[0]}
      format={createPriceFormat('%%formatLocale%%', '%%noPrice%%')}
      confirming={false}
      onOpen={() => {}}
      onToggle={() => setList((current) => itemsReducer(current, { type: 'acquiredToggled', id: 'w-01' }))}
      onDelete={() => {}}
      onConfirmDelete={() => {}}
      onCancelDelete={() => {}}
    />
  );
}

test('pressing the acquired toggle, found by its label, marks the wish acquired', async () => {
  await render(<RowWithState />);
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: '%%markAcquiredLabel%%' }));
  expect(screen.getByText('%%acquiredMark%%')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: '%%markWantedLabel%%' })).toBeOnTheScreen();
});
