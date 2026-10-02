const load = async (path) => {
  try {
    return { module: await import(path), error: null };
  } catch (error) {
    return { module: null, error };
  }
};

test('labels.js loads as an ES module', async () => {
  const { error } = await load('./labels.js');
  expect(error ? error.name + ': ' + error.message : null, 'error while loading labels.js').toBeNull();
});

test('labels.js exports loanLabel by name', async () => {
  const { module } = await load('./labels.js');
  expect(typeof module?.loanLabel, 'the named export loanLabel of labels.js').toBe('function');
});

test('loanLabel builds the label with the formatted day', async () => {
  const { module } = await load('./labels.js');
  expect(module?.loanLabel?.({ id: 'l-02', title: L.book2, dueDate: '2026-02-27', returned: false }), 'loanLabel(a loan due 2026-02-27)').toBe(L.book2 + ' — 27.02.2026');
});

test('main.js prints the label', () => {
  expect(loadError(), 'error while the program loaded').toBeNull();
  expect(logs(), 'printed lines').toContain(L.book1 + ' — 05.03.2026');
});
