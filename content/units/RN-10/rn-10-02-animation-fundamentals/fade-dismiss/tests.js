import { rowRenders } from './main.jsx';

const row = (id) => screen.$(`[data-testid="row-${id}"]`);
const removeButton = (id) => row(id)?.querySelector('[role="button"]');
const dismissedLines = (id) => logs().filter((line) => line === `onDismissed(${id})`).length;
// The translateX in px and the opacity the preview applied to the row right now.
function rowLook(id) {
  const style = row(id).style;
  const match = /translateX\((-?[\d.]+)px\)/.exec(style.transform);
  return { translateX: match ? Number(match[1]) : 0, opacity: style.opacity === '' ? 1 : Number(style.opacity) };
}

test('the row stays on screen while it animates', async () => {
  await waitFor(() => removeButton('e-01'));
  await user.click(removeButton('e-01'));
  await sleep(100);
  expect(row('e-01'), 'the row of e-01, 100 ms after the press').toBeTruthy();
  expect(dismissedLines('e-01'), 'onDismissed(e-01) calls 100 ms after the press').toBe(0);
});

test('halfway the row has moved left and is partly transparent', async () => {
  await waitFor(() => removeButton('e-02'));
  await user.click(removeButton('e-02'));
  await sleep(110);
  expect(row('e-02'), 'the row of e-02, 110 ms after the press').toBeTruthy();
  const look = rowLook('e-02');
  expect(look.translateX, 'translateX of the row, 110 ms after the press').toBeLessThan(-20);
  expect(look.opacity, 'opacity of the row, 110 ms after the press').toBeLessThan(0.95);
  expect(look.opacity, 'opacity of the row, 110 ms after the press').toBeGreaterThan(0.05);
});

test('onDismissed is called once and removes the row', async () => {
  await waitFor(() => removeButton('e-03'));
  await user.click(removeButton('e-03'));
  await waitFor(() => dismissedLines('e-03') > 0, { timeout: 2000 });
  await sleep(300);
  expect(dismissedLines('e-03'), 'onDismissed(e-03) calls').toBe(1);
  expect(row('e-03'), 'the row of e-03 after onDismissed').toBeFalsy();
});

test('ExpenseRow does not render on every animation frame', async () => {
  await waitFor(() => removeButton('e-04'));
  const before = rowRenders.count;
  await user.click(removeButton('e-04'));
  await waitFor(() => dismissedLines('e-04') > 0, { timeout: 2000 });
  expect(rowRenders.count - before, 'ExpenseRow renders between the press and onDismissed').toBeLessThanOrEqual(2);
});
