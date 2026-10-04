// summarize(argv, env, out) is run with recorded output; openedSources shows what it opened.
import { summarize } from './summary.ts';
import { openedSources } from './expenses-source.js';
import { formatLine, formatTotal } from './money.js';

async function run(argv, env) {
  expect(typeof summarize, 'type of summarize').toBe('function');
  const logs = [];
  const errors = [];
  const before = openedSources.length;
  const code = await summarize(argv, env, { log: (line) => logs.push(line), error: (line) => errors.push(line) });
  return { code, logs, errors, opened: openedSources.slice(before) };
}

const listenersOf = (source) => ['record', 'end', 'error'].map((name) => source.listenerCount(name));

test('prints the three largest categories and the total by default', async () => {
  const { code, logs } = await run([], {});
  expect(logs, 'printed lines with no --limit and no LOCALE').toEqual([
    formatLine('food', 105600, 'uk'),
    formatLine('transport', 52000, 'uk'),
    formatLine('fun', 48000, 'uk'),
    formatTotal(215590, 'uk'),
  ]);
  expect(code, 'exit code of a successful run').toBe(0);
});

test('follows --limit and LOCALE', async () => {
  const { code, logs } = await run(['--limit', '2'], { LOCALE: 'en' });
  expect(logs, 'printed lines for --limit 2 and LOCALE=en').toEqual([formatLine('food', 105600, 'en'), formatLine('transport', 52000, 'en'), formatTotal(215590, 'en')]);
  expect(code, 'exit code of a successful run').toBe(0);
});

test('rejects an invalid --limit with exit code 1 before opening the file', async () => {
  for (const value of ['two', '0', '11', '2.5']) {
    const { code, logs, errors, opened } = await run(['--limit', value], {});
    expect(code, `exit code for --limit ${value}`).toBe(1);
    expect(errors.join('\n'), `error output for --limit ${value}`).toContain(value);
    expect(logs, `printed lines for --limit ${value}`).toEqual([]);
    expect(opened.length, `files opened for --limit ${value}`).toBe(0);
  }
});

test('rejects an invalid LOCALE with exit code 1', async () => {
  const { code, errors, opened } = await run([], { LOCALE: 'ua' });
  expect(code, 'exit code for LOCALE=ua').toBe(1);
  expect(errors.join('\n'), 'error output for LOCALE=ua').toContain('ua');
  expect(opened.length, 'files opened for LOCALE=ua').toBe(0);
});

test('reports a missing data file with exit code 1', async () => {
  const { code, errors, logs } = await run([], { DATA_FILE: 'missing.json' });
  expect(code, 'exit code for DATA_FILE=missing.json').toBe(1);
  expect(errors.join('\n'), 'error output for DATA_FILE=missing.json').toContain('missing.json');
  expect(logs, 'printed lines for a missing file').toEqual([]);
});

test('removes its listeners from the source after end and after error', async () => {
  const ok = await run([], {});
  expect(ok.opened.map(listenersOf), 'record, end, error listeners after a successful run').toEqual([[0, 0, 0]]);
  const failed = await run([], { DATA_FILE: 'missing.json' });
  expect(failed.opened.map(listenersOf), 'record, end, error listeners after a missing file').toEqual([[0, 0, 0]]);
});
