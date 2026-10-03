const STATUS_BAR = 59; // the simulated top inset of the portrait frame (DeviceFrame.jsx)

function screenOf(frame) {
  const r = frame.getBoundingClientRect();
  return { left: r.left + frame.clientLeft, top: r.top + frame.clientTop };
}
function glyphs(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}
const ready = () => waitFor(() => screen.$('[data-testid="title-input"]'));

test('the new-task field is tall enough for its text at 200 %', async () => {
  await ready();
  const input = screen.$('[data-testid="title-input"]');
  const style = getComputedStyle(input);
  const needed = parseFloat(style.fontSize) * 1.15 + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  expect(input.clientHeight, `inner height of the field (its text and padding need about ${Math.round(needed)})`).toBeGreaterThanOrEqual(needed);
});

test('the field text still follows the system text size', async () => {
  await ready();
  const size = parseFloat(getComputedStyle(screen.$('[data-testid="title-input"]')).fontSize);
  expect(size, 'font size of the field at 200 % (16 × 2)').toBeGreaterThanOrEqual(32);
});

test('the header text sits below the status bar', async () => {
  await ready();
  const area = screenOf(screen.$('[data-testid="frame-portrait"]'));
  expect(glyphs(screen.$('[data-testid="title"]')).top, 'top of the header text').toBeGreaterThanOrEqual(area.top + STATUS_BAR - 0.5);
});

test('the header background still reaches the top edge', async () => {
  await ready();
  const area = screenOf(screen.$('[data-testid="frame-portrait"]'));
  expect(screen.$('[data-testid="header"]').getBoundingClientRect().top, 'top of the header background').toBeLessThanOrEqual(area.top + 0.5);
});

test('every delete button is announced as a button with its task', async () => {
  await ready();
  const rows = screen.$$('[data-testid="task"]');
  expect(rows.length, 'number of tasks').toBe(2);
  for (const row of rows) {
    const button = row.querySelector('[data-testid="delete"]');
    const title = row.textContent.replace('✕', '').trim();
    expect(screen.roleOf(button), `role of the delete button for "${title}"`).toBe('button');
    expect(screen.nameOf(button), `name of the delete button for "${title}"`).toContain(title);
  }
});

test('a delete button still removes its task', async () => {
  await ready();
  const before = screen.$$('[data-testid="task"]').length;
  await user.click(screen.$('[data-testid="delete"]'));
  await waitFor(() => screen.$$('[data-testid="task"]').length === before - 1);
  expect(screen.$$('[data-testid="task"]').length, 'number of tasks after one delete').toBe(before - 1);
});
