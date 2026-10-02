const toggleOf = (id) => screen.$(`#habits li[data-id="${id}"] button[data-action="toggle"]`);
const deleteOf = (id) => screen.$(`#habits li[data-id="${id}"] button[data-action="delete"]`);

test('pausing a habit keeps the focus on its new toggle button', async () => {
  const before = toggleOf('h-02');
  before.focus();
  await user.press('Enter', before);
  const after = toggleOf('h-02');
  expect(after, 'the pause/resume button of habit h-02').toHaveTextContent(L.resume);
  expect(after, 'the new pause/resume button of habit h-02').toHaveFocus();
  // The restored button keeps working: a second Enter resumes the habit and keeps the focus again.
  await user.press('Enter', after);
  const again = toggleOf('h-02');
  expect(again, 'the pause/resume button of habit h-02 after a second Enter').toHaveTextContent(L.pause);
  expect(again, 'the pause/resume button of habit h-02 after a second Enter').toHaveFocus();
});

test('deleting a habit moves the focus to the list heading', async () => {
  const remove = deleteOf('h-01');
  remove.focus();
  await user.press('Enter', remove);
  expect(screen.$('#habits li[data-id="h-01"]'), 'the card of habit h-01').toBeNull();
  expect(screen.$('#habits-title'), 'the list heading #habits-title').toHaveFocus();
});

test('a refresh with the focus outside the list leaves the focus where it was', () => {
  document.activeElement.blur();
  scope.refresh();
  expect(document.activeElement, 'document.activeElement after refresh() with the focus on body').toBe(document.body);
  const heading = screen.$('#habits-title');
  heading.focus();
  scope.refresh();
  expect(heading, 'the list heading after refresh() with the focus on it').toHaveFocus();
});
