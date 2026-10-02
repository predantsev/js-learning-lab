// Reference lending.js and the two defective versions the learner's tests must catch.
const REFERENCE = `export function heldDepositsMinor(loans) {
  let total = 0;
  for (const loan of loans) {
    if (loan.returnedOn === null) total += Math.round(loan.depositUah * 100);
  }
  return total;
}
export function returnTool(loans, id, day) {
  return loans.map((loan) => (loan.id === id ? { ...loan, returnedOn: day } : loan));
}
export function isOverdue(loan, today) {
  return loan.returnedOn === null && loan.dueDate < today;
}
export function overdueLoans(loans, today) {
  return loans.filter((loan) => isOverdue(loan, today));
}
`;
const swap = (from, to) => {
  if (!REFERENCE.includes(from)) throw new Error(`reference does not contain: ${from}`);
  return REFERENCE.replace(from, to);
};
const BROKEN = {
  cutDown: swap('total += Math.round(loan.depositUah * 100);\n  }\n  return total;', 'total += loan.depositUah;\n  }\n  return Math.floor(total * 100);'),
  returnedOverdue: swap('return loan.returnedOn === null && loan.dueDate < today;', 'return !loan.returned && loan.dueDate < today;'),
};

const moduleUrl = (code) => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
const rewrite = (source, urls) => source.replace(/(["'])\.\/([\w./-]+)\1/g, (match, quote, path) => JSON.stringify(urls[path] ?? `~/${path}`));

// Runs lending.test.js once more with the given lending.js (fresh copies of every module).
async function runSuite(lendingSource) {
  const source = files['lending.test.js'];
  if (typeof source !== 'string') throw new Error('lending.test.js is missing');
  const urls = { 'testing.js': moduleUrl(files['testing.js']), 'loans.js': moduleUrl(files['loans.js']) };
  urls['lending.js'] = moduleUrl(lendingSource);
  const hidden = { test: window.test, expect: window.expect };
  delete window.test;
  delete window.expect;
  try {
    await import(moduleUrl(rewrite(source, urls)));
    const runner = await import(urls['testing.js']);
    return await runner.run({ print: false });
  } finally {
    Object.assign(window, hidden);
  }
}
const failing = (results) => results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`);
async function expectSuitePasses() {
  const results = await runSuite(REFERENCE);
  expect(results.length, 'number of tests in lending.test.js').toBeGreaterThan(0);
  expect(failing(results), 'your tests that fail with the reference lending.js').toEqual([]);
}
async function expectSuiteCatches(lendingSource) {
  await expectSuitePasses();
  const results = await runSuite(lendingSource);
  expect(results.some((result) => !result.passed), 'at least one of your tests fails with the defective version').toBe(true);
}

const load = async (names) => {
  const mod = await import('./lending.js');
  for (const name of names) expect(typeof mod[name], `type of the ${name} export of lending.js`).toBe('function');
  return mod;
};
const loan = (id, depositUah, dueDate, returnedOn = null) => ({ id, tool: 'x', depositUah, dueDate, returnedOn });

test('heldDepositsMinor gives the exact kopiykas of the loans not returned', async () => {
  const { heldDepositsMinor } = await load(['heldDepositsMinor']);
  const { LOANS } = await import('./loans.js');
  expect(heldDepositsMinor(LOANS), 'heldDepositsMinor(LOANS)').toBe(57830);
  expect(heldDepositsMinor([loan('A', 0.7, '2026-03-12'), loan('B', 0.1, '2026-03-12')]), 'deposits 0.7 and 0.1').toBe(80);
  expect(heldDepositsMinor([loan('A', 19.99, '2026-03-12'), loan('B', 5, '2026-03-12', '2026-03-09')]), 'one returned loan of two').toBe(1999);
  expect(heldDepositsMinor([]), 'no loans').toBe(0);
});

test('a returned loan is never overdue, even after its due date', async () => {
  const { isOverdue, returnTool } = await load(['isOverdue', 'returnTool']);
  const { LOANS } = await import('./loans.js');
  expect(isOverdue(loan('A', 10, '2026-03-05', '2026-03-07'), '2026-03-10'), 'returned on 7 March, due 5 March').toBe(false);
  const drill = returnTool(LOANS, 'L-01', '2026-03-10').find((item) => item.id === 'L-01');
  expect(isOverdue(drill, '2026-03-10'), 'L-01 after returnTool').toBe(false);
});

test('a loan not returned is overdue only after its due date', async () => {
  const { isOverdue } = await load(['isOverdue']);
  expect(isOverdue(loan('A', 10, '2026-03-09'), '2026-03-10'), 'due 9 March, today 10 March').toBe(true);
  expect(isOverdue(loan('A', 10, '2026-03-10'), '2026-03-10'), 'due today').toBe(false);
  expect(isOverdue(loan('A', 10, '2026-03-11'), '2026-03-10'), 'due tomorrow').toBe(false);
});

test('your tests pass with the reference lending.js', async () => {
  await expectSuitePasses();
});

test('one of your tests fails when the deposit total is cut down to whole kopiykas', async () => {
  await expectSuiteCatches(BROKEN.cutDown);
});

test('one of your tests fails when a returned loan counts as overdue', async () => {
  await expectSuiteCatches(BROKEN.returnedOverdue);
});
