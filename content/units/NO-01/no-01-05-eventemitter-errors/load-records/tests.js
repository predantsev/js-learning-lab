// loadRecords gets a fresh EventEmitter in every check; the checks emit the events themselves.
import { EventEmitter } from 'node:events';
import { loadRecords } from './records.js';

const wishes = [{ id: 'w-04', name: L.book }, { id: 'w-06', name: L.mug }];
const own = (emitter) => ['record', 'end', 'error'].map((name) => emitter.listenerCount(name));

test('resolves with the records in order on end', async () => {
  expect(typeof loadRecords, 'type of loadRecords').toBe('function');
  const emitter = new EventEmitter();
  const done = loadRecords(emitter);
  for (const wish of wishes) emitter.emit('record', wish);
  emitter.emit('end');
  expect(await done, 'the resolved records').toEqual(wishes);
});

test('rejects with the emitted error', async () => {
  expect(typeof loadRecords, 'type of loadRecords').toBe('function');
  const emitter = new EventEmitter();
  const done = loadRecords(emitter);
  const failure = new Error('fixture file is broken');
  emitter.emit('record', wishes[0]);
  emitter.emit('error', failure);
  let caught = null;
  await done.catch((error) => { caught = error; });
  expect(caught, 'the rejection reason').toBe(failure);
});

test('removes its listeners after end', async () => {
  expect(typeof loadRecords, 'type of loadRecords').toBe('function');
  const emitter = new EventEmitter();
  const done = loadRecords(emitter);
  emitter.emit('end');
  await done;
  expect(own(emitter), 'listeners of record, end, error after end').toEqual([0, 0, 0]);
});

test('removes its listeners after error', async () => {
  expect(typeof loadRecords, 'type of loadRecords').toBe('function');
  const emitter = new EventEmitter();
  // A listener of the checks catches the error, so emit() does not throw even without yours.
  emitter.on('error', () => {});
  const done = loadRecords(emitter);
  emitter.emit('error', new Error('fixture file is broken'));
  await Promise.race([done.catch(() => {}), sleep(50)]);
  expect(own(emitter), 'listeners of record, end, error after error').toEqual([0, 0, 1]);
});

test('keeps listeners that others added', async () => {
  expect(typeof loadRecords, 'type of loadRecords').toBe('function');
  const emitter = new EventEmitter();
  const seen = [];
  emitter.on('record', (wish) => seen.push(wish.id));
  const done = loadRecords(emitter);
  emitter.emit('record', wishes[0]);
  emitter.emit('end');
  await done;
  emitter.emit('record', wishes[1]);
  expect(seen, 'ids seen by the other listener').toEqual(['w-04', 'w-06']);
});
