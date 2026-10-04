import { readFile } from 'node:fs/promises';
import { profilingNote, topSelfTime } from './report.js';

const guard = () => {
  expect(typeof topSelfTime, 'type of topSelfTime').toBe('function');
  expect(typeof profilingNote, 'type of profilingNote').toBe('function');
};

// A tiny hand-made profile: frame(name, url, line) builds a node; samples list node ids,
// timeDeltas the microseconds of each sample.
function profileOf(frames, samples, timeDeltas) {
  return {
    nodes: frames.map(([functionName, url, lineNumber], i) => ({ id: i + 1, callFrame: { functionName, url, lineNumber, columnNumber: 0 }, hitCount: 0 })),
    samples,
    timeDeltas,
  };
}
const brief = (top) => top.map((f) => [f.name, f.selfMs]);

test('adds up the sample times of each function, largest first', () => {
  guard();
  const profile = profileOf(
    [['(root)', '', -1], ['handler', 'service.js', 20], ['sortByName', 'service.js', 9], ['stringify', 'service.js', 30]],
    [3, 2, 3, 4, 3, 2],
    [1000, 500, 1500, 300, 1000, 700],
  );
  expect(brief(topSelfTime(profile, 3)), '[name, selfMs] of the top 3').toEqual([['sortByName', 3.5], ['handler', 1.2], ['stringify', 0.3]]);
});

test('one function reached through two call paths is counted once', () => {
  guard();
  const profile = profileOf(
    [['(root)', '', -1], ['compareNames', 'service.js', 5], ['listAll', 'service.js', 40], ['compareNames', 'service.js', 5], ['parse', 'service.js', 50]],
    [2, 4, 4, 5, 5],
    [1000, 1000, 1000, 1000, 1000],
  );
  expect(brief(topSelfTime(profile, 2)), '[name, selfMs] of the top 2').toEqual([['compareNames', 3], ['parse', 2]]);
});

test('functions with the same name in different places stay apart', () => {
  guard();
  const profile = profileOf(
    [['(root)', '', -1], ['', 'service.js', 12], ['', 'load.js', 3], ['format', 'service.js', 60]],
    [2, 2, 3, 3, 4, 4, 4],
    [1000, 1000, 1000, 1000, 1500, 1500, 1500],
  );
  const top = topSelfTime(profile, 3);
  expect(brief(top), '[name, selfMs] of the top 3').toEqual([['format', 4.5], ['(anonymous)', 2], ['(anonymous)', 2]]);
  expect(top.slice(1).map((f) => `${f.url}:${f.line}`).sort(), 'places of the two anonymous functions').toEqual(['load.js:4', 'service.js:13']);
});

test('time when the process was idle is not counted', () => {
  guard();
  const profile = profileOf(
    [['(root)', '', -1], ['(idle)', '', -1], ['handler', 'service.js', 20]],
    [2, 2, 2, 3],
    [5000, 5000, 5000, 400],
  );
  expect(brief(topSelfTime(profile, 3)), '[name, selfMs] of the top 3').toEqual([['handler', 0.4]]);
});

test('each entry has name, url, line counted from 1 and selfMs', () => {
  guard();
  const profile = profileOf([['(root)', '', -1], ['sortByName', 'service.js', 9]], [2, 2], [600, 600]);
  expect(topSelfTime(profile, 1), 'the top 1').toEqual([{ name: 'sortByName', url: 'service.js', line: 10, selfMs: 1.2 }]);
});

test('the recorded profile before the fix is led by sortByName', async () => {
  guard();
  const before = JSON.parse(await readFile('before.cpuprofile.json', 'utf8'));
  const top = topSelfTime(before, 3);
  expect(top.map((f) => f.name), 'names of the top 3 before the fix').toEqual(['sortByName', 'compareNames', 'compileForInternalLoader']);
  expect(top[0].selfMs, 'self time of sortByName before the fix').toBeCloseTo(1439.2, 0);
});

test('the profiling note names the command, both top lists and both p95 values', () => {
  guard();
  const beforeTop = [{ name: 'sortByName', url: 'service.js', line: 10, selfMs: 1439.2 }, { name: 'compareNames', url: 'service.js', line: 6, selfMs: 243.9 }];
  const afterTop = [{ name: 'readFile', url: 'node:fs/promises', line: 1, selfMs: 41.3 }, { name: 'sortByName', url: 'service.js', line: 10, selfMs: 64 }];
  const note = String(profilingNote({ command: 'node --cpu-prof lab.mjs --load', before: beforeTop, after: afterTop, p95Before: 19.8, p95After: 2.6 }));
  expect(note, 'the note').toContain('node --cpu-prof lab.mjs --load');
  for (const f of [...beforeTop, ...afterTop]) {
    expect(note, 'the note').toContain(f.name);
    expect(note, 'the note').toContain(String(f.selfMs));
  }
  expect(note, 'the note').toContain('19.8');
  expect(note, 'the note').toContain('2.6');
});
