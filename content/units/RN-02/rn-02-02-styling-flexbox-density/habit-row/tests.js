const part = (row, id) => row.querySelector(`[data-testid="${id}"]`);
const box = (el) => el.getBoundingClientRect();
const rows = () => screen.$$('[data-testid="row"]');

test('the name and the count share one line', async () => {
  await waitFor(() => rows().length === 2);
  for (const row of rows()) {
    const name = box(part(row, 'name'));
    const count = box(part(row, 'count'));
    expect(count.left, 'left edge of the count compared with the right edge of the name').toBeGreaterThanOrEqual(name.right - 1);
    expect(count.top, 'top of the count compared with the bottom of the name').toBeLessThan(name.bottom);
  }
});

test('the count sits at the right edge of its line', async () => {
  await waitFor(() => rows().length === 2);
  for (const row of rows()) {
    const line = box(part(row, 'top-line'));
    const count = box(part(row, 'count'));
    expect(count.right, 'right edge of the count').toBeGreaterThanOrEqual(line.right - 1);
    expect(count.right, 'right edge of the count').toBeLessThanOrEqual(line.right + 1);
  }
});

test('the details sit below the name line', async () => {
  await waitFor(() => rows().length === 2);
  for (const row of rows()) {
    const line = box(part(row, 'top-line'));
    const details = box(part(row, 'details'));
    expect(details.top, 'top of the details compared with the bottom of the name line').toBeGreaterThanOrEqual(line.bottom - 1);
  }
});

test('nothing is cut off at 200 % text size', async () => {
  await waitFor(() => rows().length === 2);
  for (const row of rows()) {
    expect(row.scrollHeight, 'height of the row content compared with the row height').toBeLessThanOrEqual(row.clientHeight + 1);
    const outer = box(row);
    expect(box(part(row, 'details')).bottom, 'bottom of the details compared with the bottom of the row').toBeLessThanOrEqual(outer.bottom + 1);
  }
});

test('the row has padding', async () => {
  await waitFor(() => rows().length === 2);
  const style = getComputedStyle(rows()[0]);
  expect(parseFloat(style.paddingLeft), 'left padding of the row').toBeGreaterThanOrEqual(8);
  expect(parseFloat(style.paddingTop), 'top padding of the row').toBeGreaterThanOrEqual(8);
});
