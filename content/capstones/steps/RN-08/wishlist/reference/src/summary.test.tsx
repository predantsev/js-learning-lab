// Jest test of the CP-RN enhancement as a person sees it: the groups, their numbers and the filter.
import { render, screen, userEvent } from '@testing-library/react-native';
import type { Wish } from '../domain/wishes.ts';
import { createPriceFormat } from './adapters.ts';
import { categoryGroups } from './summary.ts';
import { SummaryView } from './SummaryView.tsx';

const wishes: Wish[] = [
  { id: 'w-01', name: '%%fixture1Name%%', price: 80, acquired: false, category: '%%techCategory%%' },
  { id: 'w-02', name: '%%fixture2Name%%', price: 45, acquired: false, category: '%%homeCategory%%' },
  { id: 'w-05', name: '%%fixture5Name%%', price: null, acquired: false, category: null },
  { id: 'w-06', name: '%%fixture6Name%%', price: 18, acquired: true, category: '%%homeCategory%%' },
];

test('the groups are in alphabetical order with the group without a category last', () => {
  const groups = categoryGroups(wishes, '%%formatLocale%%');
  const named = ['%%techCategory%%', '%%homeCategory%%'].sort((a, b) => a.localeCompare(b, '%%formatLocale%%'));
  expect(groups.map((group) => group.category)).toEqual([...named, null]);
  // The alphabet of the language, not the order of character codes: І comes after Д in Ukrainian, and
  // "apple" before "Banana" in English, although a plain sort() puts them the other way round.
  const named2 = (categories: string[], locale: string) => categoryGroups(categories.map((category, index) => ({ ...wishes[0], id: 'w-9' + index, category: category })), locale).map((group) => group.category);
  expect(named2(['Іграшки', 'Дім'], 'uk-UA')).toEqual(['Дім', 'Іграшки']);
  expect(named2(['Banana', 'apple'], 'en-US')).toEqual(['apple', 'Banana']);
  expect(groups.find((group) => group.category === '%%homeCategory%%')).toMatchObject({ count: 2, wantedTotal: 45, wantedWithoutPrice: 0 });
  expect(groups.at(-1)).toMatchObject({ count: 1, wantedTotal: 0, wantedWithoutPrice: 1 });
});

test('the filter, found by its label, shows one category with its wishes', async () => {
  await render(<SummaryView items={wishes} format={createPriceFormat('%%formatLocale%%', '%%noPrice%%')} locale="%%formatLocale%%" />);
  expect(screen.getByText('%%homeCategory%% · 2')).toBeOnTheScreen();
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: '%%filterLabel%%: %%homeCategory%%' }));
  expect(screen.getByText('%%fixture2Name%%')).toBeOnTheScreen();
  expect(screen.queryByText('%%techCategory%% · 1')).toBeNull();
});
