// Checks of capstone step JS-03, wishlist variant: the pure functions formatItemLabel and
// validateItem (domain contract: { ok: true, value } or { ok: false, errors: { field: key } }),
// and the page that only shows their results. Text comes from L (the project's language).
const norm = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
/** `text` contains every part, in this order (case and extra spaces do not matter). */
function inOrder(text, ...parts) {
  const t = norm(text);
  let from = 0;
  for (const part of parts.map(norm)) {
    const at = t.indexOf(part, from);
    if (at < 0) return false;
    from = at + part.length;
  }
  return true;
}
const shown = (...parts) => [...(screen.$('main')?.querySelectorAll('*') ?? [])].some((node) => inOrder(node.textContent, ...parts));
const wish = (fields) => ({ id: 'w-90', name: 'Desk lamp', price: 45, acquired: false, category: null, ...fields });
/** A value as it would be written in code, for check messages. */
const show = (value) => (value === undefined ? 'missing' : Number.isNaN(value) ? 'NaN' : JSON.stringify(value));

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the labels and the draft messages', () => {
  expect(shown(L.nameValue, L.firstCheck), `a line with "${L.nameValue}" and then "${L.firstCheck}"`).toBe(true);
  expect(shown(L.secondName, L.noPrice), `a line with "${L.secondName}" and then "${L.noPrice}"`).toBe(true);
  expect(shown(L.requiredMessage), `a line with "${L.requiredMessage}"`).toBe(true);
  expect(shown(L.invalidMessage), `a line with "${L.invalidMessage}"`).toBe(true);
});

test('formatItemLabel returns the name and the price', () => {
  const label = scope.formatItemLabel(wish({ name: 'Desk lamp', price: 45 }));
  expect(typeof label, 'the type of what formatItemLabel returns').toBe('string');
  expect(inOrder(label, 'Desk lamp', '45'), `formatItemLabel(name "Desk lamp", price 45) returned ${show(label)}`).toBe(true);
});

test('formatItemLabel uses the no-price text only for a missing price', () => {
  const missing = scope.formatItemLabel(wish({ name: 'Tickets', price: null }));
  expect(inOrder(missing, 'Tickets', L.noPrice), `price null: ${show(missing)}`).toBe(true);
  const free = scope.formatItemLabel(wish({ name: 'Gift card', price: 0 }));
  expect(inOrder(free, 'Gift card', '0') && !inOrder(free, L.noPrice), `price 0: ${show(free)}`).toBe(true);
});

test('formatItemLabel marks acquired wishes', () => {
  const acquired = scope.formatItemLabel(wish({ acquired: true }));
  const wanted = scope.formatItemLabel(wish({ acquired: false }));
  expect(inOrder(acquired, 'Desk lamp', L.acquiredMark), `acquired true: ${show(acquired)}`).toBe(true);
  expect(inOrder(wanted, L.acquiredMark), `acquired false: ${show(wanted)}`).toBe(false);
});

test('validateItem accepts a valid wish and trims its name', () => {
  const result = scope.validateItem({ name: '  Desk lamp  ', price: 45 });
  expect(result?.ok, `validateItem({ name: "  Desk lamp  ", price: 45 }).ok`).toBe(true);
  expect(result.value?.name, 'value.name').toBe('Desk lamp');
  expect(result.value?.price, 'value.price').toBe(45);
  expect(scope.validateItem({ name: 'Gift card', price: 0 })?.ok, 'a price of 0 is valid').toBe(true);
  expect(scope.validateItem({ name: 'x'.repeat(80), price: 1 })?.ok, 'a name of exactly 80 characters is valid').toBe(true);
});

test('validateItem turns a missing price into null', () => {
  const withNull = scope.validateItem({ name: 'Tickets', price: null });
  expect(withNull?.ok, 'price null is valid').toBe(true);
  expect(withNull.value?.price, 'value.price for price null').toBeNull();
  const withoutField = scope.validateItem({ name: 'Tickets' });
  expect(withoutField?.ok, 'a draft without a price field is valid').toBe(true);
  expect(withoutField.value?.price, 'value.price for a draft without a price field').toBeNull();
});

test('validateItem requires a name', () => {
  for (const name of ['', '   ', undefined]) {
    const result = scope.validateItem({ name, price: 10 });
    expect(result?.ok, `name ${show(name)}: ok`).toBe(false);
    expect(result.errors?.name, `name ${show(name)}: errors.name`).toBe('required');
  }
});

test('validateItem rejects a name longer than 80 characters', () => {
  const result = scope.validateItem({ name: 'x'.repeat(81), price: 1 });
  expect(result?.ok, 'a name of 81 characters: ok').toBe(false);
  expect(result.errors?.name, 'a name of 81 characters: errors.name').toBe('too-long');
  expect(scope.validateItem({ name: `  ${'x'.repeat(80)}  `, price: 1 })?.ok, '80 characters plus spaces at the edges is valid').toBe(true);
});

test('validateItem rejects a negative price', () => {
  for (const price of [-1, -0.5]) {
    const result = scope.validateItem({ name: 'Desk lamp', price });
    expect(result?.ok, `price ${price}: ok`).toBe(false);
    expect(result.errors?.price, `price ${price}: errors.price`).toBe('negative');
  }
});

test('validateItem rejects a price that is not a number', () => {
  for (const price of ['45', Number.NaN]) {
    const result = scope.validateItem({ name: 'Desk lamp', price });
    expect(result?.ok, `price ${show(price)}: ok`).toBe(false);
    expect(result.errors?.price, `price ${show(price)}: errors.price`).toBe('not-a-number');
  }
});

test('validateItem lists every field with a problem and only those', () => {
  const both = scope.validateItem({ name: '', price: -5 });
  expect(both?.ok, 'empty name and price -5: ok').toBe(false);
  expect(both.errors, 'empty name and price -5: errors').toEqual({ name: 'required', price: 'negative' });
  const one = scope.validateItem({ name: 'Desk lamp', price: -5 });
  expect(one.errors, 'a good name and price -5: errors').toEqual({ price: 'negative' });
});

test('the functions only return values', () => {
  // Data no other check uses, so that a write to the page shows up as a change; every branch is
  // visited (a valid and an invalid draft, a wanted and an acquired wish).
  const page = screen.$('main')?.innerHTML;
  const printed = logs().length;
  const items = [wish({ name: 'Purity probe', price: 7 }), wish({ name: 'Purity probe', price: null, acquired: true })];
  const drafts = [{ name: '  Purity probe ', price: 7 }, { name: ' ', price: -7 }];
  for (const item of items) {
    const label = scope.formatItemLabel(item);
    expect(scope.formatItemLabel(item), `formatItemLabel called twice with ${show(item)}`).toBe(label);
  }
  for (const draft of drafts) {
    const result = scope.validateItem(draft);
    expect(scope.validateItem(draft), `validateItem called twice with ${show(draft)}`).toEqual(result);
  }
  expect(items, 'the wishes after formatItemLabel').toEqual([wish({ name: 'Purity probe', price: 7 }), wish({ name: 'Purity probe', price: null, acquired: true })]);
  expect(drafts, 'the drafts after validateItem').toEqual([{ name: '  Purity probe ', price: 7 }, { name: ' ', price: -7 }]);
  expect(logs().length - printed, 'lines printed by the functions').toBe(0);
  expect(screen.$('main')?.innerHTML, 'the page after calling the functions').toBe(page);
});
