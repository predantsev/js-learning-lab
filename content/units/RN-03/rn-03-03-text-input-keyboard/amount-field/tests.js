const field = () => screen.byLabel(L.amountLabel);
const saveButton = () => screen.byRole('button', { name: L.save });
const savedLines = () => logs().filter((line) => line.startsWith('saved'));

async function typeAmount(text) {
  const input = await waitFor(field);
  await user.clear(input);
  if (text) await user.type(input, text);
  return input;
}

test('the field asks for the decimal keyboard', async () => {
  const input = await waitFor(field);
  expect(input.getAttribute('inputmode'), 'keyboard of the amount field').toBe('decimal');
});

test('the field keeps exactly the text that was typed', async () => {
  const input = await typeAmount('12,50');
  expect(input, 'the amount field').toHaveValue('12,50');
});

test('saving 12,50 passes 1250 to onSave', async () => {
  await typeAmount('12,50');
  const before = savedLines().length;
  await user.click(saveButton());
  expect(savedLines().slice(before), 'what onSave received').toEqual(['saved 1250']);
});

test('saving abc shows the localized error and saves nothing', async () => {
  await typeAmount('abc');
  const before = savedLines().length;
  await user.click(saveButton());
  await waitFor(() => screen.text().includes(L.amountInvalid));
  expect(savedLines().slice(before), 'calls of onSave').toEqual([]);
});

test('saving an empty field shows the required message', async () => {
  await typeAmount('');
  await user.click(saveButton());
  await waitFor(() => screen.text().includes(L.amountRequired));
  expect(screen.text(), 'the screen text').toContain(L.amountRequired);
});
