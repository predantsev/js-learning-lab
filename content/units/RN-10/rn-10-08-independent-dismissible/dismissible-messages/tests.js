import { setReduceMotion } from './motionSettings.js';
import * as list from './MessageList.jsx';
import { swipe } from './swipeSim.js';

const row = (id) => screen.$(`[data-testid="row-${id}"]`);
const dismissedCount = (id) => logs().filter((line) => line === `onDismissed(${id})`).length;
function look(id) {
  const style = row(id)?.style;
  const match = /translateX\((-?[\d.]+)px\)/.exec(style?.transform ?? '');
  return { x: match ? Number(match[1]) : 0, opacity: !style || style.opacity === '' ? 1 : Number(style.opacity) };
}
const button = (name) => screen.byRole('button', { name });
// react-native-web does not render accessibilityActions, so the row's own onAccessibilityAction prop is
// read from the React component that drew the row (its fiber) and called as a screen reader would.
function rowProp(id, name) {
  const element = row(id);
  const key = element && Object.keys(element).find((k) => k.startsWith('__reactFiber$'));
  for (let fiber = key ? element[key] : null; fiber; fiber = fiber.return) {
    if (typeof fiber.memoizedProps?.[name] === 'function') return fiber.memoizedProps[name];
  }
  return null;
}

test('a swipe past −120 dismisses the row exactly once, within a second', async () => {
  await waitFor(() => row('m-01'));
  const released = performance.now();
  expect(swipe('m-01', [-40, -90, -150]), 'a row registered a pan for m-01').toBe(true);
  await waitFor(() => dismissedCount('m-01') > 0, { timeout: 2000 });
  expect(performance.now() - released, 'milliseconds from the release to onDismissed(m-01)').toBeLessThan(1000);
  await sleep(300);
  expect(dismissedCount('m-01'), 'onDismissed(m-01) calls').toBe(1);
  expect(row('m-01'), 'the row of m-01 after onDismissed').toBeFalsy();
});

test('a short swipe does not dismiss and the row returns', async () => {
  await waitFor(() => row('m-02'));
  expect(swipe('m-02', [-30, -60]), 'a row registered a pan for m-02').toBe(true);
  await sleep(600);
  expect(dismissedCount('m-02'), 'onDismissed(m-02) calls').toBe(0);
  expect(row('m-02'), 'the row of m-02').toBeTruthy();
  expect(Math.round(look('m-02').x), 'translateX of m-02 600 ms after a short swipe').toBe(0);
});

test('the dismissal slides the row further left while it fades', async () => {
  await waitFor(() => row('m-03'));
  expect(swipe('m-03', [-150]), 'a row registered a pan for m-03').toBe(true);
  await sleep(20);
  const early = look('m-03');
  await sleep(110);
  expect(row('m-03'), 'the row of m-03, 130 ms after release').toBeTruthy();
  const later = look('m-03');
  expect(later.x, 'translateX of m-03 keeps moving left during the dismissal').toBeLessThan(early.x - 10);
  expect(later.opacity, 'opacity of m-03 during the dismissal').toBeLessThan(1);
  await waitFor(() => dismissedCount('m-03') === 1, { timeout: 2000 });
});

test('under reduce motion the row fades without sliding further', async () => {
  setReduceMotion(true);
  try {
    await sleep(50);
    await waitFor(() => row('m-04'));
    expect(swipe('m-04', [-150]), 'a row registered a pan for m-04').toBe(true);
    await sleep(20);
    const early = look('m-04');
    await sleep(110);
    expect(row('m-04'), 'the row of m-04, 130 ms after release').toBeTruthy();
    const later = look('m-04');
    expect(Math.abs(later.x - early.x), 'how far m-04 slid during the dismissal').toBeLessThanOrEqual(1);
    expect(later.opacity, 'opacity of m-04 during the dismissal').toBeLessThan(early.opacity);
    await waitFor(() => dismissedCount('m-04') === 1, { timeout: 2000 });
    await sleep(100);
    expect(row('m-04'), 'the row of m-04 after the fade').toBeFalsy();
  } finally {
    setReduceMotion(false);
  }
});

test('leaving the screen mid-dismissal never dismisses that row', async () => {
  await waitFor(() => row('m-05'));
  await sleep(50);
  expect(swipe('m-05', [-150]), 'a row registered a pan for m-05').toBe(true);
  await sleep(60);
  await user.click(button(L.leave));
  await sleep(500);
  expect(dismissedCount('m-05'), 'onDismissed(m-05) calls after leaving mid-dismissal').toBe(0);
  await user.click(button(L.back));
  await waitFor(() => row('m-05'));
});

test('the dismiss accessibility action does what the swipe does', () => {
  expect(typeof list.dismissActionProps, 'type of dismissActionProps').toBe('function');
  let calls = 0;
  const props = list.dismissActionProps(L.dismiss, () => { calls += 1; });
  expect(props.accessibilityActions, 'accessibilityActions').toEqual([{ name: 'dismiss', label: L.dismiss }]);
  expect(typeof props.onAccessibilityAction, 'type of onAccessibilityAction').toBe('function');
  props.onAccessibilityAction({ nativeEvent: { actionName: 'dismiss' } });
  props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
  expect(calls, 'onDismiss calls after a "dismiss" and an "activate" action').toBe(1);
});

test('avatars are 40 × 40 points and use the 144-pixel variant', async () => {
  await waitFor(() => screen.$('[data-testid="avatar-m-06"]'));
  const avatar = screen.$('[data-testid="avatar-m-06"]');
  const box = avatar.getBoundingClientRect();
  expect(Math.round(box.width), 'width of the m-06 avatar').toBe(40);
  expect(Math.round(box.height), 'height of the m-06 avatar').toBe(40);
  const src = avatar.querySelector('img')?.getAttribute('src') ?? '';
  expect(/width%3D%22(\d+)%22/.exec(src)?.[1], 'pixel width of the avatar variant shown').toBe('144');
});

test("the row's own dismiss action dismisses it like a swipe", async () => {
  await waitFor(() => row('m-02'));
  const action = rowProp('m-02', 'onAccessibilityAction');
  expect(typeof action, 'type of onAccessibilityAction on the row of m-02').toBe('function');
  action({ nativeEvent: { actionName: 'dismiss' } });
  await waitFor(() => dismissedCount('m-02') > 0, { timeout: 2000 });
  await sleep(300);
  expect(dismissedCount('m-02'), 'onDismissed(m-02) calls after the row\'s dismiss action').toBe(1);
  expect(row('m-02'), 'the row of m-02 after its dismiss action').toBeFalsy();
});
