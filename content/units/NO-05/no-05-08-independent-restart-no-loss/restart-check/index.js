// Tries checkInvariants on three made-up results of a restart. (check.mjs itself starts and kills
// processes, so it runs only in your terminal.)
import { checkInvariants } from './invariants.js';

const book = (id, room, date) => ({ id, room, date, guests: 2, note: '' });

const cases = {
  '%%healthy%%': {
    bookings: [book('c-0', 'A', '2027-01-01'), book('c-1', 'B', '2027-01-01'), book('c-2', 'C', '2027-01-01')],
    confirmed: ['c-0', 'c-1'], // c-2 was stored, but the kill came before its 201 was sent
  },
  '%%lost%%': {
    bookings: [book('c-0', 'A', '2027-01-01')],
    confirmed: ['c-0', 'c-1', 'c-2'],
  },
  '%%doubleBooked%%': {
    bookings: [book('c-0', 'A', '2027-01-01'), book('c-6', 'A', '2027-01-01')],
    confirmed: ['c-0', 'c-6'],
  },
};

for (const [name, { bookings, confirmed }] of Object.entries(cases)) {
  const problems = checkInvariants(bookings, confirmed);
  console.log(`${name}: ${problems.length === 0 ? 'ok' : problems.join('; ')}`);
}
