const sample = () => [
  { id: "e-01", label: L.groceries, amountMinor: 84550 },
  { id: "e-02", label: L.transit, amountMinor: 52000 },
  { id: "e-03", label: L.coffee, amountMinor: 18000 },
];

// Records whose fields count how often they are read, to see where a check stops.
const counted = (records, field) => {
  let reads = 0;
  const list = records.map((record) => {
    const copy = { ...record };
    const value = copy[field];
    delete copy[field];
    Object.defineProperty(copy, field, { enumerable: true, get() { reads += 1; return value; } });
    return copy;
  });
  return { list, reads: () => reads };
};

test('allLabeled is true when every expense has a label', () => {
  expect(scope.allLabeled(sample()), 'allLabeled(three labeled expenses)').toBe(true);
});

test('one empty label makes allLabeled false', () => {
  const list = sample();
  list[1] = { ...list[1], label: '' };
  expect(scope.allLabeled(list), 'allLabeled with one empty label').toBe(false);
});

test('an empty list counts as all labeled', () => {
  expect(scope.allLabeled([]), 'allLabeled([])').toBe(true);
});

test('allLabeled stops at the first expense without a label', () => {
  const list = sample();
  list[0] = { ...list[0], label: '' };
  const probe = counted(list, 'label');
  const result = scope.allLabeled(probe.list);
  const reads = probe.reads();
  expect(result, 'allLabeled when the first label is empty').toBe(false);
  expect(reads, 'labels read before answering').toBeLessThanOrEqual(2);
});

test('anyOverLimit finds an expense above the limit', () => {
  expect(scope.anyOverLimit(sample(), 60000), 'anyOverLimit(list, 60000)').toBe(true);
});

test('anyOverLimit is false when no amount is above the limit', () => {
  expect(scope.anyOverLimit(sample(), 90000), 'anyOverLimit(list, 90000)').toBe(false);
});

test('an amount equal to the limit is not over it', () => {
  expect(scope.anyOverLimit(sample(), 84550), 'anyOverLimit(list, 84550)').toBe(false);
});

test('an empty list has nothing over the limit', () => {
  expect(scope.anyOverLimit([], 0), 'anyOverLimit([], 0)').toBe(false);
});

test('anyOverLimit stops at the first expense over the limit', () => {
  const probe = counted(sample(), 'amountMinor');
  const result = scope.anyOverLimit(probe.list, 60000);
  const reads = probe.reads();
  expect(result, 'anyOverLimit(list, 60000)').toBe(true);
  expect(reads, 'amounts read before answering').toBeLessThanOrEqual(2);
});
