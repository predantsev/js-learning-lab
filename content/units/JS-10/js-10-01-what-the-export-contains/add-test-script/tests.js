// package.json is data that npm reads with a JSON parser, so the checks read it the same way.
const readPackage = () => JSON.parse(files['package.json']);

test('package.json is valid JSON', () => {
  expect(() => readPackage(), 'JSON.parse of package.json').not.toThrow();
});

test('npm start still runs serve.mjs with node', () => {
  const start = readPackage().scripts?.start;
  expect(typeof start, 'type of scripts.start').toBe('string');
  expect(start.trim(), 'scripts.start').toMatch(/^node\s+(\.\/)?serve\.mjs$/);
});

test('npm test runs run-tests.js with node', () => {
  const testScript = readPackage().scripts?.test;
  expect(typeof testScript, 'type of scripts.test').toBe('string');
  expect(testScript.trim(), 'scripts.test').toMatch(/^node\s+(\.\/)?run-tests\.js$/);
});

test('name and type stay as exported', () => {
  const pkg = readPackage();
  expect(pkg.name, 'name').toBe('js-learning-lab-habits');
  expect(pkg.type, 'type').toBe('module');
});
