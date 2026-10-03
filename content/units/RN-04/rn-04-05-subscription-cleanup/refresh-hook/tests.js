import { appStateListenerCount, leaveApp, returnToApp, simulateAppState } from './appStateSim.jsx';

// Each check starts on Home with no Today screen mounted (going back without asking anyone).
async function home() {
  simulateAppState('active');
  const stack = scope.stack;
  while (stack.getState().routes.length > 1) {
    const top = stack.getState().routes.at(-1);
    stack.navigationFor(top.key).dispatch({ type: 'GO_BACK', visited: new Set([top.key]) });
  }
  await settle();
}
const press = async (name) => {
  await user.click(screen.allByRole('button', { name }).find((node) => node.offsetParent !== null));
  await settle();
};
async function leaveAndReturn() {
  const before = scope.refreshes.length;
  leaveApp('android');
  returnToApp();
  await settle();
  return scope.refreshes.length - before;
}

test('one refresh per return after three visits to another screen', async () => {
  await home();
  await press(L.openToday);
  for (let visit = 0; visit < 3; visit += 1) {
    await press(L.openHistory);
    scope.stack.headerBack();
    await settle();
  }
  expect(await leaveAndReturn(), 'refreshes after one return to the app').toBe(1);
});

test('no refresh while another screen covers Today', async () => {
  await home();
  const base = appStateListenerCount();
  await press(L.openToday);
  await press(L.openHistory);
  expect(appStateListenerCount(), 'subscriptions while History covers Today').toBe(base);
  expect(await leaveAndReturn(), 'refreshes while History covers Today').toBe(0);
});

test('leaving Today removes its subscription', async () => {
  await home();
  const base = appStateListenerCount();
  await press(L.openToday);
  scope.stack.headerBack();
  await settle();
  expect(appStateListenerCount(), 'subscriptions after going back from Today').toBe(base);
  expect(await leaveAndReturn(), 'refreshes after Today was closed').toBe(0);
});

test('the refresh uses the latest onActive', async () => {
  await home();
  await press(L.openToday);
  await press(L.switchHabit);
  await leaveAndReturn();
  expect(scope.refreshes.at(-1), 'habit of the last refresh after switching to “Drink water”').toBe('h-03');
});
