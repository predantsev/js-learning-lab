import { appStateListenerCount, leaveApp, returnToApp, simulateAppState } from './appStateSim.jsx';
import { refreshLog } from './HabitScreens.jsx';
import { sendLink } from './linkingSim.jsx';

async function toList() {
  simulateAppState('active');
  while (scope.stack.getState().routes.length > 1) scope.stack.headerBack();
  await settle();
}
const visibleName = () => screen.$$('[data-testid="detail-name"]').find((node) => node.offsetParent !== null);

test('one return to the app refreshes the list once after several visits', async () => {
  await toList();
  for (let visit = 0; visit < 3; visit += 1) {
    await user.click(screen.byText(L.reading));
    await settle();
    scope.stack.headerBack();
    await settle();
  }
  const before = refreshLog.length;
  leaveApp('android');
  returnToApp();
  await settle();
  expect(refreshLog.length - before, 'refreshes after one return to the app').toBe(1);
});

test('the list has no AppState subscription while the detail covers it', async () => {
  await toList();
  await user.click(screen.byText(L.reading));
  await settle();
  expect(appStateListenerCount(), 'AppState subscriptions while Detail is on top').toBe(0);
});

test('a row opens Detail with only the habit id', async () => {
  await toList();
  await user.click(screen.byText(L.exercise));
  await settle();
  expect(scope.stack.describe().at(-1), 'the screen on top and its params').toEqual({ name: 'Detail', params: { id: 'h-01' } });
  expect(visibleName(), 'name on the detail screen').toHaveTextContent(L.exercise);
});

test('a link with an id opens the habit', async () => {
  await toList();
  sendLink('courselab://habit/h-01');
  await settle();
  expect(visibleName(), 'name on the detail screen opened from the link').toHaveTextContent(L.exercise);
});
