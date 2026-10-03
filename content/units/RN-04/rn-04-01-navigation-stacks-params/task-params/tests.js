// Checks drive the simulated stack: they press rows and buttons, and read the stack through scope.stack.
async function backToList() {
  while (scope.stack.getState().routes.length > 1) scope.stack.headerBack();
  await settle();
}
const topScreen = () => scope.stack.describe().at(-1);
const visibleDetailTitle = () => screen.$$('[data-testid="detail-title"]').find((node) => node.offsetParent !== null);

test('opening a task pushes Detail with only its id', async () => {
  await backToList();
  await user.click(screen.byText(L.books));
  await settle();
  expect(topScreen(), 'the screen on top of the stack and its params').toEqual({ name: 'Detail', params: { id: 't-02' } });
});

test('the detail screen shows the task the row was pressed for', async () => {
  await backToList();
  await user.click(screen.byText(L.dentist));
  const title = await waitFor(() => visibleDetailTitle());
  expect(title, 'title on the detail screen').toHaveTextContent(L.dentist);
});

test('after editing, going back shows the new title on the detail screen', async () => {
  await backToList();
  await user.click(screen.byText(L.plants));
  await waitFor(() => visibleDetailTitle());
  await user.click(screen.allByRole('button', { name: L.edit }).find((node) => node.offsetParent !== null));
  const field = await waitFor(() => screen.allByRole('textbox').find((node) => node.offsetParent !== null));
  await user.fill(field, L.changedTitle);
  await user.click(screen.allByRole('button', { name: L.save }).find((node) => node.offsetParent !== null));
  await settle();
  expect(topScreen()?.name, 'the screen on top after saving').toBe('Detail');
  expect(visibleDetailTitle(), 'title on the detail screen after going back').toHaveTextContent(L.changedTitle);
});

test('an unknown id shows the not-found message', async () => {
  await backToList();
  const { routes } = scope.stack.getState();
  scope.stack.navigationFor(routes[0].key).push('Detail', { id: 't-99' });
  await settle();
  expect(screen.text(), 'text of the preview').toContain(L.notFound);
});
