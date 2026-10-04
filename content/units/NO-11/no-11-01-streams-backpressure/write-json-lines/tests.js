// Checks for writeJsonLines. Every check builds its own slow writer (1 KiB buffer limit, 1 ms per
// batch) that keeps what it received, and watches writableLength right after every write() call.
import { Writable } from 'node:stream';
import { writeJsonLines } from './app.js';

function slowWriter() {
  const writer = new Writable({
    highWaterMark: 1024,
    writev(chunks, done) {
      for (const { chunk } of chunks) writer.received.push(String(chunk));
      setTimeout(done, 1);
    },
  });
  writer.received = [];
  writer.peak = 0;
  const write = writer.write.bind(writer);
  writer.write = (...args) => {
    const result = write(...args);
    writer.peak = Math.max(writer.peak, writer.writableLength);
    return result;
  };
  return writer;
}

function* wishes(count) {
  for (let i = 1; i <= count; i++) yield { id: `w-${i}`, name: `${L.wish} ${i}`, price: i, acquired: false };
}

test('writes every record as one JSON line, in order, exactly once', async () => {
  expect(typeof writeJsonLines, 'type of writeJsonLines').toBe('function');
  const records = [...wishes(300)];
  const writer = slowWriter();
  await writeJsonLines(records, writer);
  await waitFor(() => writer.writableLength === 0);
  const lines = writer.received.join('').split('\n');
  expect(lines.at(-1), 'text after the last newline').toBe('');
  expect(lines.length - 1, 'number of lines written for 300 records').toBe(300);
  expect(lines.slice(0, -1).map((line) => JSON.parse(line)), 'the parsed lines').toEqual(records);
});

test('never lets more than the buffer limit pile up in a slow writer', async () => {
  expect(typeof writeJsonLines, 'type of writeJsonLines').toBe('function');
  const writer = slowWriter();
  await writeJsonLines(wishes(5000), writer);
  await waitFor(() => writer.writableLength === 0);
  // One line may land on top of a full buffer: that is the write() that answers false.
  expect(writer.peak, 'most bytes ever waiting in a writer with a 1024-byte limit').toBeLessThan(1024 + 200);
});

test('resolves only after the writer has finished', async () => {
  expect(typeof writeJsonLines, 'type of writeJsonLines').toBe('function');
  const writer = slowWriter();
  await writeJsonLines(wishes(500), writer);
  expect(writer.writableFinished, 'writer.writableFinished when the promise resolved').toBe(true);
});
