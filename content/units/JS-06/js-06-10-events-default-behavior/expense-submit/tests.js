const form = () => screen.$('#expense-form');
const field = (name) => screen.$(`#${name}`);
const errorText = (name) => screen.$(`#${name}-error`).textContent.trim();
const rows = () => screen.$$('#expenses li').map((item) => item.textContent);
async function fillForm(label, amount, category = 'food') {
  await user.fill(field('label'), label);
  await user.fill(field('amount'), amount);
  await user.select(field('category'), category);
}

test('submitting the form does not reload the page', async () => {
  await fillForm(L.lunch, '210.50');
  const { prevented } = await user.submit(form());
  expect(prevented, 'preventDefault was called during the submit event').toBe(true);
});

test('an empty label shows its message next to the label field', async () => {
  await fillForm('', '45');
  await user.submit(form());
  expect(errorText('label'), 'text of #label-error').toBe(L.required);
  expect(errorText('amount'), 'text of #amount-error').toBe('');
});

test('a zero amount shows its message next to the amount field', async () => {
  await fillForm(L.coffee, '0');
  await user.submit(form());
  expect(errorText('amount'), 'text of #amount-error').toBe(L.notPositive);
  expect(errorText('label'), 'text of #label-error').toBe('');
});

test('a valid expense is added once and the messages are cleared', async () => {
  await fillForm('', '');
  await user.submit(form());
  const before = rows().length;
  await fillForm(L.lunch, '210.50');
  await user.submit(form());
  const after = rows();
  expect(after.length, 'new rows after one valid submission').toBe(before + 1);
  expect(after[after.length - 1], 'the last row').toContain(L.lunch);
  expect(errorText('label'), 'text of #label-error').toBe('');
  expect(errorText('amount'), 'text of #amount-error').toBe('');
});

test('pressing Enter in a field submits through the same listener', async () => {
  const before = rows().length;
  await fillForm(L.coffee, '180');
  await user.press('Enter', field('amount'));
  expect(rows().length, 'new rows after Enter in the amount field').toBe(before + 1);
});
