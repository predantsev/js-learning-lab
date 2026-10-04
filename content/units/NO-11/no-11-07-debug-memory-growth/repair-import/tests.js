// Checks for the repaired importFile. Each check writes its own input file and gives the import its
// own output: a collecting writable, optionally slow (1 ms per batch) with a small buffer limit.
import { writeFile } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { importFile, progress } from './app.js';

async function habitsFile(name, count, { brokenAt = null } = {}) {
  const file = tmp(name);
  let text = '';
  for (let i = 1; i <= count; i++) {
    if (i === brokenAt) text += '{"id": "h-broken", \n';
    else text += `${JSON.stringify({ id: `h-${i}`, name: `${L.habit} ${i}`, completions: ['2026-03-02', '2026-03-01', '2026-03-02'] })}\n`;
  }
  await writeFile(file, text);
  return file;
}

function collector({ slow = false, highWaterMark = 16 * 1024 } = {}) {
  const output = new Writable({
    highWaterMark,
    writev(chunks, done) {
      for (const { chunk } of chunks) output.text += chunk;
      if (slow) setTimeout(done, 1);
      else done();
    },
  });
  output.text = '';
  output.peak = 0;
  const write = output.write.bind(output);
  output.write = (...args) => {
    const result = write(...args);
    output.peak = Math.max(output.peak, output.writableLength);
    return result;
  };
  return output;
}

const timers = () => activeResources().filter((name) => name === 'Timeout').length;

test('imports every habit with sorted, de-duplicated completions', async () => {
  expect(typeof importFile, 'type of importFile').toBe('function');
  const output = collector();
  const count = await importFile(await habitsFile('ok.jsonl', 300), output);
  expect(count, 'the result for 300 habits').toBe(300);
  const lines = output.text.trim().split('\n');
  expect(lines.length, 'lines written').toBe(300);
  expect(JSON.parse(lines[0]).completions, 'completions of the first habit').toEqual(['2026-03-01', '2026-03-02']);
});

test('the progress object keeps a count, not the lines', async () => {
  expect(typeof importFile, 'type of importFile').toBe('function');
  await importFile(await habitsFile('many.jsonl', 20_000), collector());
  const size = JSON.stringify(progress).length;
  expect(size, 'characters in JSON.stringify(progress) after 20000 habits').toBeLessThan(2000);
});

test('a slow output never holds more than its limit plus one line', async () => {
  expect(typeof importFile, 'type of importFile').toBe('function');
  const output = collector({ slow: true, highWaterMark: 4096 });
  await importFile(await habitsFile('slow.jsonl', 3000), output);
  expect(output.peak, 'most bytes ever waiting in an output with a 4096-byte limit').toBeLessThan(4096 + 300);
});

test('after an abort or a broken line no interval keeps the process alive', async () => {
  expect(typeof importFile, 'type of importFile').toBe('function');
  const before = timers();
  let failure = null;
  await importFile(await habitsFile('abort.jsonl', 500), collector(), { signal: AbortSignal.abort() }).catch((error) => (failure = error));
  expect(failure?.name, 'the rejection with an aborted signal').toBe('AbortError');
  await sleep(20);
  expect(timers() - before, 'timers left holding the process after the abort').toBeLessThanOrEqual(0);
  failure = null;
  await importFile(await habitsFile('broken.jsonl', 500, { brokenAt: 50 }), collector()).catch((error) => (failure = error));
  expect(failure?.name, 'the rejection for a broken line 50').toBe('SyntaxError');
  await sleep(20);
  expect(timers() - before, 'timers left holding the process after the broken line').toBeLessThanOrEqual(0);
});
