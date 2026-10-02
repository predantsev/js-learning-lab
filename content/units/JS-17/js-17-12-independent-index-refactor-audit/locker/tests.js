import * as lockerModule from './domain/locker.ts';
import { FIXTURES, makeParcels } from './fixtures.js';

const createLocker = () => {
  expect(typeof lockerModule.createLocker, 'type of the createLocker export of domain/locker.ts').toBe('function');
  return lockerModule.createLocker();
};
const filled = () => {
  const locker = createLocker();
  for (const parcel of FIXTURES) locker.arrive({ ...parcel });
  return locker;
};
const thrown = (run) => {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
};
// Parcels whose code reads are counted.
function countedParcels(count, from) {
  const counter = { reads: 0 };
  const parcels = makeParcels(count, from).map(({ code, recipient }) => ({
    recipient,
    get code() {
      counter.reads += 1;
      return code;
    },
  }));
  return { parcels, counter };
}

test('the locker behaves as before: find, pick up, return the oldest', () => {
  const locker = filled();
  expect(locker.findByCode('P-1003')?.recipient, 'findByCode("P-1003")').toBe(L.r3);
  expect(locker.findByCode('P-9999'), 'findByCode of a code that is not waiting').toBe(null);
  expect(locker.pickUp('P-1001')?.code, 'pickUp("P-1001")').toBe('P-1001');
  expect(locker.pickUp('P-1001'), 'pickUp("P-1001") a second time').toBe(null);
  expect(locker.nextToReturn()?.code, 'nextToReturn after P-1001 was picked up').toBe('P-1002');
  expect(locker.oldest(10).map((parcel) => parcel.code), 'oldest(10)').toEqual(['P-1003', 'P-1004']);
  expect(locker.waitingCount(), 'waitingCount').toBe(2);
  expect(locker.nextToReturn()?.code, 'the next return').toBe('P-1003');
  expect(locker.nextToReturn()?.code, 'the last return').toBe('P-1004');
  expect(locker.nextToReturn(), 'nextToReturn of an empty locker').toBe(null);
});

test('a code that is already waiting is refused', () => {
  const locker = filled();
  const error = thrown(() => locker.arrive({ code: 'P-1004', recipient: L.r1 }));
  expect(error instanceof Error, 'arrive with the waiting code P-1004 throws an Error').toBe(true);
  expect(locker.waitingCount(), 'waitingCount after the refused arrival').toBe(4);
  expect(locker.findByCode('P-1004')?.recipient, 'the recipient of P-1004 after the refused arrival').toBe(L.r4);
});

test('oldest returns a new array, oldest first', () => {
  const locker = filled();
  const first = locker.oldest(2);
  first.push({ code: 'X', recipient: 'X' });
  expect(locker.oldest(2).map((parcel) => parcel.code), 'oldest(2) after changing the array it returned').toEqual(['P-1001', 'P-1002']);
});

test('10,000 arrivals and 1,000 lookups read the codes only a few times each', () => {
  const locker = createLocker();
  const { parcels, counter } = countedParcels(10000, 5000);
  for (const parcel of parcels) locker.arrive(parcel);
  expect(counter.reads, 'code reads during 10,000 arrivals').toBeLessThanOrEqual(50000);
  counter.reads = 0;
  for (let i = 0; i < 1000; i++) locker.findByCode('P-' + (5000 + i * 7));
  expect(counter.reads, 'code reads during 1,000 lookups').toBeLessThanOrEqual(5000);
});

test('returning 20,000 parcels moves no arrays around', () => {
  const locker = createLocker();
  for (const parcel of makeParcels(20000, 50000)) locker.arrive(parcel);
  const { shift, splice } = Array.prototype;
  let moves = 0;
  Array.prototype.shift = function (...args) {
    moves += 1;
    return shift.apply(this, args);
  };
  Array.prototype.splice = function (...args) {
    moves += 1;
    return splice.apply(this, args);
  };
  let returned = 0;
  try {
    while (locker.nextToReturn() !== null) returned += 1;
  } finally {
    Array.prototype.shift = shift;
    Array.prototype.splice = splice;
  }
  expect(returned, 'parcels returned').toBe(20000);
  expect(moves, 'shift and splice calls while returning 20,000 parcels').toBeLessThanOrEqual(100);
});

test('the characterization tests in locker.test.js are still green', async () => {
  const { run } = await import('./testing.js');
  const results = await run({ print: false });
  expect(results.length, 'number of tests in locker.test.js').toBeGreaterThan(0);
  expect(results.filter((result) => !result.passed).map((result) => `${result.name} — ${result.message}`), 'tests that fail').toEqual([]);
});

test('the code field has a visible label', () => {
  const input = screen.$('#lookup');
  const label = screen.$('label[for="lookup"]');
  expect(input !== null && label !== null, 'a <label for="lookup"> for the code field').toBe(true);
  expect(label.textContent.trim().length, 'the text of the label').toBeGreaterThan(0);
});

test('the result of a lookup is announced', async () => {
  const status = screen.$('#status');
  const live = status?.getAttribute('role') === 'status' || ['polite', 'assertive'].includes(status?.getAttribute('aria-live'));
  expect(live, '#status is a live region (role="status" or aria-live)').toBe(true);
  await user.fill(screen.$('#lookup'), 'P-1003');
  await user.submit(screen.$('#lookup-form'));
  expect(status.textContent.includes('P-1003'), 'the status text after looking up P-1003').toBe(true);
});

test('every hand-out button is a button whose name includes its code', () => {
  const buttons = screen.$$('#waiting button');
  expect(buttons.length, 'hand-out buttons in the list').toBeGreaterThan(0);
  for (const button of buttons) {
    const code = button.closest('li')?.textContent.match(/P-\d+/)?.[0];
    expect(screen.nameOf(button).includes(code), `the name of the hand-out button of ${code}`).toBe(true);
  }
});

test('after a hand-out the focus stays in the list', async () => {
  const first = screen.$('#waiting button');
  expect(first, 'a hand-out button on the page').toBeTruthy();
  await user.click(first);
  const focused = document.activeElement;
  const inList = focused?.closest('#waiting') !== null && focused?.tagName === 'BUTTON';
  expect(inList || focused?.id === 'waiting-heading', 'focus after the hand-out is on a hand-out button or the list heading').toBe(true);
});
