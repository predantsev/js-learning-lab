import { storage } from './storage.js';

const rowText = (id) => screen.$(`[data-testid="wish-${id}"]`);
async function open(id) {
  await user.click(await waitFor(() => rowText(id)));
  await settle();
}
async function back() {
  scope.stack.headerBack();
  await settle();
}
async function markAcquired(id) {
  await open(id);
  await user.click(screen.byRole('button', { name: L.markAcquired }));
  await waitFor(() => screen.$$('[data-testid="detail-message"]').some((node) => node.textContent === L.savedAcquired));
}

test('returning to the list shows a change made on the detail screen', async () => {
  await markAcquired('w-02');
  await back();
  await sleep(300);
  expect(rowText('w-02'), 'the “Desk lamp” row after going back').toHaveTextContent(`✓ ${L.lamp}`);
});

test('storage is read once per focus, not on every render or blur', async () => {
  await waitFor(() => rowText('w-01'));
  await sleep(200);
  const before = storage.readCount();
  await open('w-01');
  await back();
  await open('w-01');
  await back();
  await sleep(300);
  expect(storage.readCount() - before, 'storage reads after two visits to a detail screen and back').toBe(2);
});

test('a slow read that finishes after leaving does not overwrite newer data', async () => {
  await open('w-03');
  storage.setNextDelays([600]); // the next read (the list's, on return) is slow
  await back();
  await markAcquired('w-03'); // leave at once and change the wish while that read is still running
  await back();
  await sleep(800);
  expect(rowText('w-03'), 'the “Bicycle” row after the slow read finished').toHaveTextContent(`✓ ${L.bicycle}`);
});
