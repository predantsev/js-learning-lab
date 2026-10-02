const visible = (node) => node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden';
// The visible text of the <label> elements connected to a field (by for/id or by wrapping).
const labelText = (field) => [...(field?.labels ?? [])].filter(visible).map((label) => label.textContent.replace(/\s+/g, ' ').trim()).join(' ').trim();
const nameField = () => screen.$$('form input').find((input) => input.type === 'text');
const priceField = () => screen.$('form input[type="number"]');

test('the name field has a visible label', () => {
  const field = nameField();
  expect(field, 'a text field <input> in the form').toBeDefined();
  expect(labelText(field).length, 'text of the <label> connected to the name field').toBeGreaterThan(0);
});

test('the name field is required', () => {
  const field = nameField();
  expect(field, 'a text field <input> in the form').toBeDefined();
  field.value = '';
  expect(field.validity.valueMissing, 'the empty name field counts as missing').toBe(true);
});

test('the price field is a number field with a visible label', () => {
  const field = priceField();
  expect(field, 'an <input type="number"> in the form').toBeInTheDocument();
  expect(labelText(field).length, 'text of the <label> connected to the price field').toBeGreaterThan(0);
});

test('the price field does not accept negative numbers', () => {
  const field = priceField();
  expect(field, 'an <input type="number"> in the form').toBeInTheDocument();
  field.value = '-5';
  expect(field.validity.rangeUnderflow, 'the price -5 is reported as too small').toBe(true);
  field.value = '0';
  expect(field.validity.rangeUnderflow, 'the price 0 (a free gift) is reported as too small').toBe(false);
  field.value = '';
});

test('the price hint is connected to the price field', () => {
  const field = priceField();
  expect(field, 'an <input type="number"> in the form').toBeInTheDocument();
  const ids = (field.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  expect(ids, 'ids listed in aria-describedby of the price field').toContain('price-hint');
  expect(document.getElementById('price-hint')?.textContent.trim().length ?? 0, 'text of the hint').toBeGreaterThan(0);
});

test('the category list has a visible label', () => {
  const list = screen.$('form select');
  expect(list, 'the <select> in the form').toBeInTheDocument();
  expect(labelText(list).length, 'text of the <label> connected to the category list').toBeGreaterThan(0);
});

test('the acquired checkbox has a visible label', () => {
  const box = screen.$('form input[type="checkbox"]');
  expect(box, 'an <input type="checkbox"> in the form').toBeInTheDocument();
  expect(labelText(box).length, 'text of the <label> connected to the checkbox').toBeGreaterThan(0);
});
