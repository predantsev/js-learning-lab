const deletes = () => screen.$$('[data-testid="delete"]');
const ready = () => waitFor(() => screen.$('[data-testid="keyboard"]') && deletes().length > 0);

test('every delete button can be pressed on at least 48 × 48', async () => {
  await ready();
  for (const button of deletes()) {
    const box = button.getBoundingClientRect();
    expect(box.width, 'width of the delete button').toBeGreaterThanOrEqual(48);
    expect(box.height, 'height of the delete button').toBeGreaterThanOrEqual(48);
  }
});

test('the delete icon stays 24 × 24', async () => {
  await ready();
  const icon = deletes()[0].querySelector('[data-testid="delete-icon"]');
  expect(icon, 'the element with testID="delete-icon" inside the button').toBeTruthy();
  const box = icon.getBoundingClientRect();
  expect(Math.round(box.width), 'width of the icon').toBe(24);
  expect(Math.round(box.height), 'height of the icon').toBe(24);
});

test('pressing a delete button removes its task', async () => {
  await ready();
  const before = screen.$$('[data-testid="task"]').length;
  await user.click(deletes()[0]);
  await waitFor(() => screen.$$('[data-testid="task"]').length === before - 1);
  expect(screen.$$('[data-testid="task"]').length, 'number of tasks after one delete').toBe(before - 1);
});

test('the save button can be brought above the keyboard', async () => {
  await ready();
  const keyboardTop = screen.$('[data-testid="keyboard"]').getBoundingClientRect().top;
  const save = screen.byRole('button', { name: L.save });
  if (save.getBoundingClientRect().bottom <= keyboardTop + 0.5) return;
  // Otherwise it must sit in a scroll area that can scroll it above the keyboard.
  let area = save.parentElement;
  while (area && !(/(auto|scroll)/.test(getComputedStyle(area).overflowY) && area.scrollHeight > area.clientHeight)) area = area.parentElement;
  expect(Boolean(area), 'a scrolling container around the save button (the button is under the keyboard and nothing can scroll it)').toBe(true);
  const visibleTop = area.getBoundingClientRect().top;
  const start = area.scrollTop;
  area.scrollTop = start + (save.getBoundingClientRect().bottom - keyboardTop);
  await settle();
  const after = save.getBoundingClientRect();
  area.scrollTop = start;
  expect(after.bottom, 'bottom of the save button after scrolling, compared with the top of the keyboard').toBeLessThanOrEqual(keyboardTop + 0.5);
  expect(after.top, 'top of the save button after scrolling, compared with the top of the scroll area').toBeGreaterThanOrEqual(visibleTop - 0.5);
});
