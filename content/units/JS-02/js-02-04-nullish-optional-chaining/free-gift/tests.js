const lineFor = (name) => logs().find((text) => text.startsWith(name));

test('a free wish shows its price 0', () => {
  expect(lineFor(L.mug), 'the travel mug line').toBe(`${L.mug} — 0 · ${L.home}`);
});

test('a wish without a price still says so', () => {
  expect(lineFor(L.tickets), 'the tickets line').toBe(`${L.tickets} — ${L.noPrice} · ${L.noCategory}`);
});

test('an empty category still gets the default', () => {
  expect(lineFor(L.phoneCase), 'the phone case line').toBe(`${L.phoneCase} — 12 · ${L.noCategory}`);
});

test('prints all four labels in order', () => {
  expect(logs()).toEqual([
    `${L.mug} — 0 · ${L.home}`,
    `${L.lamp} — 45 · ${L.home}`,
    `${L.tickets} — ${L.noPrice} · ${L.noCategory}`,
    `${L.phoneCase} — 12 · ${L.noCategory}`,
  ]);
});
