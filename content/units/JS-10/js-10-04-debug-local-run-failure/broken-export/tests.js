// The page must load and show the data; package.json must start a file that exists.
const readPackage = () => JSON.parse(files['package.json']);

test('the page loads without a module error', () => {
  expect(loadError(), 'error while loading the modules').toBeNull();
});

test('the page lists all three expenses', () => {
  const items = screen.$$('#items li').map((item) => item.textContent);
  expect(items, 'list items').toEqual([`${L.groceries} — 845.50`, `${L.transitPass} — 520.00`, `${L.lunch} — 210.50`]);
});

test('the page shows the total', () => {
  expect(screen.$('#summary'), 'the #summary paragraph').toHaveTextContent(`${L.total} 1576.00`);
});

test('npm start runs a file that exists', () => {
  const start = readPackage().scripts?.start;
  expect(typeof start, 'type of scripts.start').toBe('string');
  const match = start.trim().match(/^node\s+(?:\.\/)?(\S+)$/);
  expect(match, 'scripts.start in the form "node <file>"').not.toBeNull();
  expect(Object.keys(files), 'project files').toContain(match[1]);
});
