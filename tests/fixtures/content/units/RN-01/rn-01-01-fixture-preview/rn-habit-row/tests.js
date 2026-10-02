test('each press adds one', async () => {
  const button = await waitFor(() => screen.byRole('button'));
  await user.click(button);
  await user.click(button);
  expect(button, 'the button').toHaveTextContent(`${L.done}: 2`);
});

test('the habit name is a heading', async () => {
  const heading = await waitFor(() => screen.byRole('heading'));
  expect(heading, 'the heading').toHaveTextContent(L.habit);
});
