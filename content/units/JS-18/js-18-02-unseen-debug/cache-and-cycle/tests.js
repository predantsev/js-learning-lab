const load = async (path, names) => {
  const mod = await import(`./${path}`);
  for (const name of names) expect(typeof mod[name], `type of the ${name} export of ${path}`).toBe('function');
  return mod;
};

test('the report loads without an error', () => {
  expect(loadError()?.message ?? null, 'error while the report loads').toBeNull();
});

test('catalog.js still exports the four tools', async () => {
  const { TOOLS } = await import('./catalog.js');
  expect(Array.isArray(TOOLS), 'TOOLS is an array').toBe(true);
  expect(TOOLS.map((tool) => tool.id), 'ids in TOOLS').toEqual(['drill', 'ladder', 'washer', 'sewing']);
});

test('feeFor gives the fee for the number of days', async () => {
  const { feeFor } = await load('fees.js', ['feeFor']);
  expect(feeFor('washer', 2), 'feeFor("washer", 2)').toBe(18000);
  expect(feeFor('drill', 1), 'feeFor("drill", 1)').toBe(4000);
});

test('describeTool shows the name and the daily fee', async () => {
  const { describeTool } = await load('catalog.js', ['describeTool']);
  expect(describeTool('ladder'), 'describeTool("ladder")').toBe(`${L.ladder} — 25.00 ${L.perDay}`);
});

test('a repeated question is computed only once', async () => {
  const { freeUnits, stats } = await load('availability.js', ['freeUnits']);
  const before = stats.computed;
  expect(freeUnits('drill', '2026-03-11'), 'freeUnits("drill", "2026-03-11")').toBe(1);
  expect(freeUnits('drill', '2026-03-11'), 'the same question again').toBe(1);
  expect(stats.computed - before, 'computations for two identical questions').toBe(1);
});

test('different questions get their own answers', async () => {
  const { freeUnits } = await load('availability.js', ['freeUnits']);
  expect(freeUnits('sewing', '2026-03-12'), 'freeUnits("sewing", "2026-03-12")').toBe(3);
  expect(freeUnits('sewing', '2026-03-10'), 'freeUnits("sewing", "2026-03-10")').toBe(1);
  expect(freeUnits('ladder', '2026-03-12'), 'freeUnits("ladder", "2026-03-12")').toBe(1);
});
