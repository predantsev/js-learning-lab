import { resetSim, returnToForeground, sim } from './permissionSim.js';

const stateText = () => screen.$('[data-testid="gate-state"]')?.textContent;
async function stateBecomes(expected) {
  try {
    await waitFor(() => stateText() === expected);
  } catch {
    /* the expectation below reports what was shown instead */
  }
  expect(stateText(), 'the state the screen shows').toBe(expected);
}
async function freshStart() {
  resetSim();
  returnToForeground();
  await stateBecomes('ask');
}
async function pressAsk() {
  await user.click(screen.$('[data-testid="ask"]'));
}

test('opening the screen checks but does not ask', async () => {
  await stateBecomes('ask');
  expect(sim.requests, 'permission requests made by just opening the screen').toBe(0);
});

test('a first denial gives denied, a final one gives blocked', async () => {
  await freshStart();
  sim.nextAnswer = 'denied';
  await pressAsk();
  await stateBecomes('denied');
  sim.nextAnswer = 'denied-forever';
  await pressAsk();
  await stateBecomes('blocked');
});

test('a grant gives granted', async () => {
  await freshStart();
  sim.nextAnswer = 'granted';
  await pressAsk();
  await stateBecomes('granted');
});

test('a change in the settings is noticed on return to the foreground', async () => {
  await freshStart();
  sim.status = 'granted';
  returnToForeground();
  await stateBecomes('granted');
  sim.status = 'denied'; // revoked in the system settings
  returnToForeground();
  await stateBecomes('denied');
});

test('a device without a camera gives unavailable', async () => {
  await freshStart();
  sim.available = false;
  returnToForeground();
  await stateBecomes('unavailable');
});
