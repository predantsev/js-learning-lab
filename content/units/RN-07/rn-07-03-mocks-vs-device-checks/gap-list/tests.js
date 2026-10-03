import { gaps } from './gaps.js';
import { declaredTarget } from './claims.js';

const list = () => (Array.isArray(gaps) ? gaps : []);
const listed = () => list().map((gap) => gap?.claim).sort();
const filled = (value) => typeof value === 'string' && value.trim().length >= 10;

test('every claim the mocks cannot prove is listed', () => {
  for (const id of ['c4', 'c5', 'c6', 'c7']) expect(listed(), `claims in gaps (looking for ${id})`).toContain(id);
});

test('no claim the mocked tests already prove is listed', () => {
  for (const id of ['c1', 'c2', 'c3']) expect(listed().includes(id), `${id} is in gaps`).toBe(false);
});

test('every gap says what to do and what to observe', () => {
  expect(list().length, 'number of gaps').toBeGreaterThan(0);
  for (const gap of list()) {
    expect(filled(gap?.check), `check of ${gap?.claim} has at least 10 characters`).toBe(true);
    expect(filled(gap?.expected), `expected of ${gap?.claim} has at least 10 characters`).toBe(true);
  }
});

test('every gap names the declared target', () => {
  expect(list().length, 'number of gaps').toBeGreaterThan(0);
  for (const gap of list()) expect(gap?.target, `target of ${gap?.claim}`).toBe(declaredTarget);
});
