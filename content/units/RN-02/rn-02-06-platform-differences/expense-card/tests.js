import { shadowSpec } from './ExpenseCard.jsx';
import { selectFor } from './platformSim.js';

const LAYOUT_KEYS = ['padding', 'paddingHorizontal', 'paddingVertical', 'margin', 'gap', 'borderRadius', 'width', 'height', 'flexDirection', 'backgroundColor'];

test('iOS gets the shadow props', () => {
  const ios = selectFor('ios', shadowSpec) ?? {};
  expect(typeof ios.shadowColor, 'type of shadowColor on iOS').toBe('string');
  expect(ios.shadowOpacity, 'shadowOpacity on iOS').toBeGreaterThan(0);
  expect(ios.shadowRadius, 'shadowRadius on iOS').toBeGreaterThan(0);
  expect(typeof ios.shadowOffset, 'type of shadowOffset on iOS').toBe('object');
});

test('Android gets elevation', () => {
  const android = selectFor('android', shadowSpec) ?? {};
  expect(android.elevation, 'elevation on Android').toBeGreaterThan(0);
  expect(android.shadowOpacity, 'shadowOpacity on Android (it only works on iOS)').toBeUndefined();
});

test('the layout stays out of the platform branches', () => {
  for (const os of ['ios', 'android', 'web']) {
    const branch = selectFor(os, shadowSpec) ?? {};
    const copied = LAYOUT_KEYS.filter((key) => key in branch);
    expect(copied, `layout properties inside the ${os} branch`).toEqual([]);
  }
});

test('the card keeps its shared layout in the preview', async () => {
  const card = await waitFor(() => screen.$('[data-testid="card"]'));
  const style = getComputedStyle(card);
  expect(parseFloat(style.paddingLeft), 'left padding of the card').toBeGreaterThanOrEqual(12);
  expect(parseFloat(style.borderTopLeftRadius), 'corner radius of the card').toBeGreaterThan(0);
});
