import * as rules from './swipeRules.js';

// Runs onSwipeEnd for one finished swipe and counts the acquire() calls.
function acquiresFor(event) {
  expect(typeof rules.onSwipeEnd, 'type of onSwipeEnd').toBe('function');
  let calls = 0;
  rules.onSwipeEnd(event, () => { calls += 1; });
  return calls;
}

test('a swipe of at least 120 points to the left acquires once', () => {
  expect(acquiresFor({ translationX: -150, velocityX: -100 }), 'acquire() calls for translationX −150, velocityX −100').toBe(1);
  expect(acquiresFor({ translationX: -120, velocityX: 0 }), 'acquire() calls for translationX −120, velocityX 0').toBe(1);
});

test('a flick of at least 800 points per second to the left acquires once', () => {
  expect(acquiresFor({ translationX: -40, velocityX: -1200 }), 'acquire() calls for translationX −40, velocityX −1200').toBe(1);
  expect(acquiresFor({ translationX: -30, velocityX: -800 }), 'acquire() calls for translationX −30, velocityX −800').toBe(1);
});

test('a short, slow swipe to the left does not acquire', () => {
  expect(acquiresFor({ translationX: -60, velocityX: -300 }), 'acquire() calls for translationX −60, velocityX −300').toBe(0);
  expect(acquiresFor({ translationX: -119, velocityX: -799 }), 'acquire() calls for translationX −119, velocityX −799').toBe(0);
});

test('a row that did not move left never acquires', () => {
  expect(acquiresFor({ translationX: 150, velocityX: 0 }), 'acquire() calls for translationX 150, velocityX 0').toBe(0);
  expect(acquiresFor({ translationX: 40, velocityX: 1500 }), 'acquire() calls for translationX 40, velocityX 1500').toBe(0);
  expect(acquiresFor({ translationX: 40, velocityX: -900 }), 'acquire() calls for translationX 40, velocityX −900').toBe(0);
});

test('the row lists an acquire accessibility action with the given label', () => {
  expect(typeof rules.acquireActionProps, 'type of acquireActionProps').toBe('function');
  const props = rules.acquireActionProps(L.acquire, () => {});
  expect(props.accessibilityActions, 'accessibilityActions').toEqual([{ name: 'acquire', label: L.acquire }]);
});

test('only the acquire action calls acquire()', () => {
  expect(typeof rules.acquireActionProps, 'type of acquireActionProps').toBe('function');
  let calls = 0;
  const props = rules.acquireActionProps(L.acquire, () => { calls += 1; });
  expect(typeof props.onAccessibilityAction, 'type of onAccessibilityAction').toBe('function');
  props.onAccessibilityAction({ nativeEvent: { actionName: 'acquire' } });
  expect(calls, 'acquire() calls after the "acquire" action').toBe(1);
  props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
  expect(calls, 'acquire() calls after an "activate" action').toBe(1);
});
