import { version } from 'react';
import { server } from './server';
import { REQUIRES_REACT } from './TaskToggle';

const toggle = () => screen.allByRole('button').find((b) => b.textContent.startsWith(L.library));
const alertText = () => screen.allByRole('alert').map((a) => a.textContent.trim()).join(' | ');
// Waits until no save is in progress, so each check starts from a settled state.
const idle = () => waitFor(() => !screen.$('#root').textContent.includes(L.saving), { timeout: 2000 });
const majorOf = (text) => Number(String(text).split('.')[0]);

test('a click shows the new status at once', async () => {
  server.refuse = false;
  await idle();
  expect(toggle(), `the button "${L.library}: ${L.pending}"`).toHaveTextContent(`${L.library}: ${L.pending}`);
  await user.click(toggle());
  expect(toggle(), 'the button right after the click, before the server answers').toHaveTextContent(`${L.library}: ${L.done}`);
});

test('a refused save shows the old status again and announces why', async () => {
  await idle();
  server.refuse = true;
  const before = toggle().textContent;
  await user.click(toggle());
  await idle();
  server.refuse = false;
  expect(toggle().textContent, 'the button after the refusal').toBe(before);
  expect(alertText(), 'the text of role="alert" after the refusal').toBe(L.saveFailed);
});

test('an accepted save keeps the new status', async () => {
  await idle();
  server.refuse = false;
  const wasDone = toggle().textContent === `${L.library}: ${L.done}`;
  await user.click(toggle());
  await idle();
  expect(toggle(), 'the button after the server accepted').toHaveTextContent(`${L.library}: ${wasDone ? L.pending : L.done}`);
});

test('REQUIRES_REACT names the first version with useOptimistic, and the running React meets it', () => {
  expect(REQUIRES_REACT, 'REQUIRES_REACT').toMatch(/^19(\.0){0,2}$/);
  expect(majorOf(version), `the running React ${version}`).toBeGreaterThanOrEqual(majorOf(REQUIRES_REACT));
});
