// ---- reference modules (plain JavaScript; the learner never sees them) ----
const REFERENCE = {
  'plants.js': `const STATUSES = ["ok", "thirsty", "resting"];
const ISO_DATE = /^\\d{4}-\\d{2}-\\d{2}$/;
function addDays(iso, days) {
  const date = new Date(iso + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function isPlant(r) {
  return typeof r === "object" && r !== null &&
    typeof r.id === "string" && r.id.trim() !== "" &&
    typeof r.name === "string" && r.name.trim() !== "" &&
    typeof r.location === "string" &&
    Number.isInteger(r.intervalDays) && r.intervalDays >= 1 && r.intervalDays <= 365 &&
    typeof r.lastWatered === "string" && ISO_DATE.test(r.lastWatered) &&
    STATUSES.includes(r.status);
}
export function parsePlants(input) {
  if (!Array.isArray(input)) return [];
  return input.filter(isPlant).map(({ id, name, location, intervalDays, lastWatered, status }) => ({ id, name, location, intervalDays, lastWatered, status }));
}
export function isDue(plant, today) {
  switch (plant.status) {
    case "resting":
      return false;
    case "thirsty":
      return true;
    default:
      return addDays(plant.lastWatered, plant.intervalDays) <= today;
  }
}
export function dueToday(plants, today) {
  return plants.filter((plant) => isDue(plant, today));
}
export function waterPlants(plants, ids, today) {
  const watered = new Set(ids);
  return plants.map((plant) => (watered.has(plant.id) ? { ...plant, lastWatered: today, status: "ok" } : plant));
}
`,
  'storage.js': `import { parsePlants } from "./plants.js";
export const STORAGE_KEY = "jsll.plants.v1";
export function savePlants(storage, plants) {
  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, plants }));
}
export function loadPlants(storage) {
  const text = storage.getItem(STORAGE_KEY);
  if (text === null) return [];
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  if (typeof data !== "object" || data === null || data.schemaVersion !== 1) return [];
  return parsePlants(data.plants);
}
`,
  'ui.js': `import { dueToday, waterPlants } from "./plants.js";
import { loadPlants, savePlants } from "./storage.js";
export const MARKUP = \`
  <h2 id="due-heading" tabindex="-1">${L.dueHeading}</h2>
  <ul class="due" aria-labelledby="due-heading"></ul>
  <p class="status" role="status"></p>
\`;
function renderDue(list, plants, today) {
  list.replaceChildren();
  for (const plant of dueToday(plants, today)) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.id = plant.id;
    button.textContent = ${JSON.stringify(L.markWatered)} + ": " + plant.name;
    item.append(plant.name + " · " + plant.location, button);
    list.append(item);
  }
}
export function mount(root, storage, today) {
  root.innerHTML = MARKUP;
  const list = root.querySelector(".due");
  const status = root.querySelector(".status");
  const heading = root.querySelector("#due-heading");
  let plants = loadPlants(storage);
  renderDue(list, plants, today);
  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    const position = [...list.querySelectorAll("button")].indexOf(button);
    const plant = plants.find((item) => item.id === button.dataset.id);
    if (!plant) return;
    plants = waterPlants(plants, [plant.id], today);
    savePlants(storage, plants);
    renderDue(list, plants, today);
    status.textContent = plant.name + " — " + ${JSON.stringify(L.wateredNow)};
    const remaining = [...list.querySelectorAll("button")];
    (remaining[Math.min(position, remaining.length - 1)] ?? heading).focus();
  });
}
`,
};
const swap = (path, from, to) => {
  if (!REFERENCE[path].includes(from)) throw new Error(`reference ${path} does not contain: ${from}`);
  return { ...REFERENCE, [path]: REFERENCE[path].replace(from, to) };
};
const BROKEN = {
  restingDue: swap('plants.js', '    case "resting":\n      return false;\n', ''),
  trustingLoad: swap('storage.js', '  let data;\n  try {\n    data = JSON.parse(text);\n  } catch {\n    return [];\n  }', '  const data = JSON.parse(text);'),
  clickNotSaved: swap('ui.js', '    savePlants(storage, plants);\n', ''),
};

const moduleUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
// Other project files keep their sandbox address; "./x.js" may be the learner's x.ts.
const projectKey = (path) => (path.endsWith('.js') && typeof files[path] !== 'string' && typeof files[path.replace(/\.js$/, '.ts')] === 'string' ? `~/${path.replace(/\.js$/, '.ts')}` : `~/${path}`);
const rewrite = (source, urls) => source.replace(/(["'])\.\/([\w./-]+)\1/g, (match, quote, path) => JSON.stringify(urls[path] ?? projectKey(path)));

// Runs plants.test.js once more against the given modules, optionally with the clock frozen at `now`.
async function runSuite(modules, { now = null } = {}) {
  const source = files['plants.test.js'];
  if (typeof source !== 'string') throw new Error('plants.test.js is missing');
  const urls = { 'testing.js': moduleUrl(files['testing.js']) };
  for (const path of ['plants.js', 'storage.js', 'ui.js']) urls[path] = moduleUrl(rewrite(modules[path], urls));
  const hidden = { test: window.test, expect: window.expect };
  const RealDate = window.Date;
  delete window.test;
  delete window.expect;
  if (now !== null) {
    const fixed = new RealDate(now).getTime();
    window.Date = class extends RealDate {
      constructor(...args) {
        super(...(args.length === 0 ? [fixed] : args));
      }
      static now() {
        return fixed;
      }
    };
  }
  try {
    await import(moduleUrl(rewrite(source, urls)));
    const runner = await import(urls['testing.js']);
    return await runner.run({ print: false });
  } finally {
    window.Date = RealDate;
    Object.assign(window, hidden);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
async function expectSuitePasses(options) {
  const results = await runSuite(REFERENCE, options);
  expect(results.length, 'number of tests in plants.test.js').toBeGreaterThan(0);
  expect(failing(results), 'your tests that fail with the reference modules').toEqual([]);
  return results;
}
async function expectSuiteCatches(modules) {
  await expectSuitePasses();
  const results = await runSuite(modules);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the broken version').toBe(true);
}

// ---- the learner's own modules ----
// Literal import() paths: the sandbox resolves "./plants.js" to the learner's plants.ts.
const IMPORTERS = { 'plants.js': () => import('./plants.js'), 'storage.js': () => import('./storage.js'), 'ui.js': () => import('./ui.js') };
const load = async (path, names) => {
  const mod = await IMPORTERS[path]();
  for (const name of names) expect(typeof mod[name], `type of the ${name} export of ${path}`).toBe('function');
  return mod;
};
const TODAY = '2026-05-20';
const plant = (id, status, intervalDays, lastWatered, name = `Plant ${id}`) => ({ id, name, location: 'room', intervalDays, lastWatered, status });
const sample = () => [
  plant('k1', 'ok', 4, '2026-05-16', L.monstera),
  plant('k2', 'ok', 4, '2026-05-17', L.fern),
  plant('k3', 'resting', 2, '2026-04-01', L.cactus),
  plant('k4', 'thirsty', 10, '2026-05-19', L.basil),
  plant('k5', 'ok', 1, '2026-05-10', L.ficus),
];
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
  };
}
const KEY = 'jsll.plants.v1';
async function mounted(storage) {
  const { mount } = await load('ui.js', ['mount']);
  const root = document.createElement('div');
  document.body.append(root);
  mount(root, storage, TODAY);
  return root;
}
const stored = (plants) => fakeStorage({ [KEY]: JSON.stringify({ schemaVersion: 1, plants }) });

test('parsePlants keeps the valid records as six-field copies', async () => {
  const { parsePlants } = await load('plants.js', ['parsePlants']);
  const good = sample()[0];
  const input = [
    { ...good, note: 'extra field' },
    null,
    'k9',
    { ...good, id: '  ' },
    { ...good, id: 'k6', name: '' },
    { ...good, id: 'k7', intervalDays: 0 },
    { ...good, id: 'k8', intervalDays: 2.5 },
    { ...good, id: 'k9', lastWatered: '20 May' },
    { ...good, id: 'k10', status: 'dry' },
    { ...good, id: 'k11', location: 7 },
    sample()[3],
  ];
  const result = parsePlants(input);
  expect(result, 'parsePlants on mixed records').toEqual([good, sample()[3]]);
  expect(result[0] === input[0], 'the kept record is a new object').toBe(false);
});

test('parsePlants gives [] for anything that is not an array', async () => {
  const { parsePlants } = await load('plants.js', ['parsePlants']);
  for (const input of [null, undefined, 'plants', 42, { plants: [] }]) {
    expect(parsePlants(input), `parsePlants(${JSON.stringify(input) ?? 'undefined'})`).toEqual([]);
  }
});

test('isDue follows the status and the interval, the last day included', async () => {
  const { isDue } = await load('plants.js', ['isDue']);
  const [monstera, fern, cactus, basil] = sample();
  expect(isDue(monstera, TODAY), 'ok, interval ends today').toBe(true);
  expect(isDue(fern, TODAY), 'ok, interval ends tomorrow').toBe(false);
  expect(isDue(cactus, TODAY), 'resting, long overdue by date').toBe(false);
  expect(isDue(basil, TODAY), 'thirsty, watered yesterday').toBe(true);
  expect(isDue(plant('m', 'ok', 3, '2026-02-26'), '2026-03-01'), 'ok, interval ends across the end of February').toBe(true);
});

test('dueToday keeps the due plants in their order', async () => {
  const { dueToday } = await load('plants.js', ['dueToday']);
  expect(dueToday(sample(), TODAY).map((item) => item.id), 'ids due on 20 May').toEqual(['k1', 'k4', 'k5']);
  expect(dueToday([], TODAY), 'no plants').toEqual([]);
});

test('waterPlants updates copies and leaves everything passed in unchanged', async () => {
  const { waterPlants } = await load('plants.js', ['waterPlants']);
  const before = sample();
  const ids = ['k2', 'k4', 'nope'];
  const after = waterPlants(before, ids, TODAY);
  expect(after.map((item) => [item.id, item.lastWatered, item.status]), 'id, lastWatered and status after watering').toEqual([
    ['k1', '2026-05-16', 'ok'], ['k2', TODAY, 'ok'], ['k3', '2026-04-01', 'resting'], ['k4', TODAY, 'ok'], ['k5', '2026-05-10', 'ok'],
  ]);
  expect(after[0] === before[0], 'k1 stays the same object').toBe(true);
  expect(before, 'the list passed in').toEqual(sample());
  expect(ids, 'the ids passed in').toEqual(['k2', 'k4', 'nope']);
});

test('waterPlants looks ids up through an index, not a scan per plant', async () => {
  const { waterPlants } = await load('plants.js', ['waterPlants']);
  let reads = 0;
  const plants = Array.from({ length: 2000 }, (_, i) => {
    const record = plant(`x${i}`, 'ok', 3, '2026-05-01');
    const id = record.id;
    Object.defineProperty(record, 'id', { enumerable: true, configurable: true, get: () => { reads += 1; return id; } });
    return record;
  });
  const idList = Array.from({ length: 500 }, (_, i) => `x${i * 4}`);
  const ids = new Proxy(idList, {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) reads += 1;
      return Reflect.get(target, key, receiver);
    },
  });
  const after = waterPlants(plants, ids, TODAY);
  expect(after.filter((item) => item.lastWatered === TODAY).length, 'plants watered').toBe(500);
  expect(reads, 'id reads for 2000 plants and 500 ids').toBeLessThanOrEqual(10000);
});

test('savePlants writes schemaVersion 1 and the plants under jsll.plants.v1', async () => {
  const { savePlants } = await load('storage.js', ['savePlants']);
  const storage = fakeStorage();
  savePlants(storage, sample());
  const text = storage.getItem(KEY);
  expect(typeof text, 'type of the saved value under jsll.plants.v1').toBe('string');
  expect(JSON.parse(text), 'the saved JSON').toEqual({ schemaVersion: 1, plants: sample() });
});

test('loadPlants recovers from missing, broken or foreign stored data', async () => {
  const { loadPlants } = await load('storage.js', ['loadPlants']);
  expect(loadPlants(fakeStorage()), 'nothing saved').toEqual([]);
  expect(loadPlants(fakeStorage({ [KEY]: '{"schemaVersion":1,' })), 'text that is not JSON').toEqual([]);
  expect(loadPlants(fakeStorage({ [KEY]: 'null' })), 'the JSON text null').toEqual([]);
  expect(loadPlants(fakeStorage({ [KEY]: JSON.stringify({ schemaVersion: 2, plants: sample() }) })), 'schemaVersion 2').toEqual([]);
  expect(loadPlants(fakeStorage({ [KEY]: JSON.stringify({ schemaVersion: 1, plants: 'none' }) })), 'plants that is not an array').toEqual([]);
  expect(loadPlants(stored([sample()[0], { id: 'bad' }, sample()[1]])), 'valid and invalid records').toEqual([sample()[0], sample()[1]]);
});

test('mount lists the due plants, each with a named button', async () => {
  const root = await mounted(stored(sample()));
  try {
    const items = [...root.querySelectorAll('.due li')];
    expect(items.length, 'list items on 20 May').toBe(3);
    expect(items[0].textContent, 'first list item').toMatch(`${L.monstera} · room`);
    const buttons = items.map((item) => item.querySelector('button'));
    expect(buttons.every((button) => button !== null && button.tagName === 'BUTTON'), 'every item has a <button>').toBe(true);
    expect(buttons[1].textContent.trim(), 'visible text of the second button').toBe(`${L.markWatered}: ${L.basil}`);
    expect(screen.nameOf(buttons[1]), 'accessible name of the second button').toBe(`${L.markWatered}: ${L.basil}`);
  } finally {
    root.remove();
  }
});

test('pressing a button waters the plant, saves it and announces it', async () => {
  const storage = stored(sample());
  const root = await mounted(storage);
  try {
    await user.click(root.querySelectorAll('.due button')[1]);
    expect([...root.querySelectorAll('.due li')].length, 'list items after watering one').toBe(2);
    const saved = JSON.parse(storage.getItem(KEY) ?? 'null');
    const basil = saved?.plants?.find((item) => item.id === 'k4');
    expect(basil, 'k4 in storage').toMatchObject({ lastWatered: TODAY, status: 'ok' });
    const status = root.querySelector('[role="status"]');
    expect(status?.textContent ?? '', 'text of the status paragraph').toBe(`${L.basil} — ${L.wateredNow}`);
  } finally {
    root.remove();
  }
});

test('focus stays in the list, then moves to the heading when the list empties', async () => {
  const root = await mounted(stored(sample().slice(0, 2)));
  try {
    const only = root.querySelector('.due button');
    expect(only, 'the button of the one due plant').toBeTruthy();
    only.focus();
    await user.click(only);
    expect(document.activeElement, 'focused element after the list emptied').toBe(root.querySelector('#due-heading'));
  } finally {
    root.remove();
  }
  const second = await mounted(stored(sample()));
  try {
    const buttons = second.querySelectorAll('.due button');
    buttons[0].focus();
    await user.click(buttons[0]);
    const now = second.querySelectorAll('.due button')[0];
    expect(document.activeElement, 'focused element after watering the first plant').toBe(now);
  } finally {
    second.remove();
  }
  const third = await mounted(stored(sample()));
  try {
    const buttons = third.querySelectorAll('.due button');
    buttons[2].focus();
    await user.click(buttons[2]);
    const left = third.querySelectorAll('.due button');
    expect(document.activeElement, 'focused element after watering the last plant').toBe(left[left.length - 1]);
  } finally {
    third.remove();
  }
});

test('your tests pass with the reference modules', async () => {
  await expectSuitePasses();
});

test('your tests include unit, integration and user tests', async () => {
  const results = await expectSuitePasses();
  for (const level of ['unit:', 'integration:', 'user:']) {
    expect(results.some((result) => result.name.trim().toLowerCase().startsWith(level)), `a test named "${level} …"`).toBe(true);
  }
});

test('your tests give the same results on any real date', async () => {
  await expectSuitePasses({ now: '2025-01-01T09:00:00' });
  await expectSuitePasses({ now: '2031-07-15T21:00:00' });
});

test('one of your tests fails when a resting plant counts as due', async () => {
  await expectSuiteCatches(BROKEN.restingDue);
});

test('one of your tests fails when loadPlants throws on text that is not JSON', async () => {
  await expectSuiteCatches(BROKEN.trustingLoad);
});

test('one of your tests fails when pressing the button saves nothing', async () => {
  await expectSuiteCatches(BROKEN.clickNotSaved);
});
