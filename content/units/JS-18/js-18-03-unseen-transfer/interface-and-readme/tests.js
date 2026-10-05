const PUBLIC = ['dueToday', 'loadPlants', 'mount', 'parsePlants', 'savePlants', 'waterPlants'];
const readme = () => (typeof files['README.md'] === 'string' ? files['README.md'] : '');
// One section: from its "## " heading to the next one.
const sections = () => readme().split(/^## /m).slice(1).map((part) => part.trim());

test('plant-care.ts exports exactly the six public functions', async () => {
  const api = await import('./plant-care.js');
  expect(Object.keys(api).sort(), 'runtime exports of plant-care.ts').toEqual(PUBLIC);
});

test('each public export is the function from its own module', async () => {
  const api = await import('./plant-care.js');
  const plants = await import('./plants.js');
  const storage = await import('./storage.js');
  const ui = await import('./ui.js');
  expect(api.parsePlants === plants.parsePlants && api.dueToday === plants.dueToday && api.waterPlants === plants.waterPlants, 'parsePlants, dueToday and waterPlants come from plants.ts').toBe(true);
  expect(api.loadPlants === storage.loadPlants && api.savePlants === storage.savePlants, 'loadPlants and savePlants come from storage.ts').toBe(true);
  expect(api.mount === ui.mount, 'mount comes from ui.ts').toBe(true);
});

test('the README has at least four sections', () => {
  expect(sections().length, 'sections that start with "## "').toBeGreaterThanOrEqual(4);
});

test('the README names every public function', () => {
  for (const name of PUBLIC) expect(readme().includes(name), `the README mentions ${name}`).toBe(true);
});

test('the README describes the plant data', () => {
  for (const field of ['id', 'name', 'location', 'intervalDays', 'lastWatered', 'status', 'ok', 'thirsty', 'resting', 'schemaVersion']) {
    expect(new RegExp(`\\b${field}\\b`).test(readme()), `the README mentions ${field}`).toBe(true);
  }
});

test('the README explains the index choice with measured times', () => {
  const index = sections().find((part) => /\b(Set|Map)\b/.test(part) && /\d+(\.\d+)?\s*ms\b/.test(part));
  expect(Boolean(index), 'a section that names Set or Map and gives times in ms').toBe(true);
  expect((index.match(/\d+(\.\d+)?\s*ms\b/g) ?? []).length, 'measured times in that section').toBeGreaterThanOrEqual(2);
});

test('the README names the test levels and how to run the tests', () => {
  for (const word of ['unit', 'integration', 'user', 'plants.test.js']) {
    expect(readme().toLowerCase().includes(word.toLowerCase()), `the README mentions ${word}`).toBe(true);
  }
});
