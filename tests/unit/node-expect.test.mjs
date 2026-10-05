// The Node-stage matcher set mirrors the browser runner (sandbox/runtime.js): names, semantics and
// failure messages. These run in-process; node-run.test.mjs covers them inside a real isolated run.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AssertionError, deepEqual, expect, spy, waitFor } from '../../server/node-harness/expect.mjs';

const failure = (fn) => {
  try {
    fn();
  } catch (error) {
    assert.ok(error instanceof AssertionError, `expected an AssertionError, got ${error}`);
    return error.message;
  }
  assert.fail('expected the matcher to fail');
};

test('passing matchers do not throw', () => {
  expect(2).toBe(2);
  expect({ a: [1, { b: 2 }], u: undefined }).toEqual({ a: [1, { b: 2 }] });
  expect('x').toBeTruthy();
  expect(0).toBeFalsy();
  expect(null).toBeNull();
  expect(undefined).toBeUndefined();
  expect(1).toBeDefined();
  expect(NaN).toBeNaN();
  expect(3).toBeGreaterThan(2);
  expect(3).toBeGreaterThanOrEqual(3);
  expect(1).toBeLessThan(2);
  expect(2).toBeLessThanOrEqual(2);
  expect(0.1 + 0.2).toBeCloseTo(0.3);
  expect(new Map()).toBeInstanceOf(Map);
  expect('s').toBeTypeOf('string');
  expect([1, 2]).toContain(2);
  expect('abc').toContain('b');
  expect([{ id: 1 }]).toContainEqual({ id: 1 });
  expect([1, 2, 3]).toHaveLength(3);
  expect({ a: { b: 1 } }).toHaveProperty('a', { b: 1 });
  expect('hello').toMatch(/ell/);
  expect({ a: 1, b: 2 }).toMatchObject({ a: 1 });
  expect(() => { throw new RangeError('too big'); }).toThrow('too big');
  expect(() => {}).not.toThrow();
  expect(new Set([1, 2])).toEqual(new Set([2, 1]));
  expect(new Date(5)).toEqual(new Date(5));
});

test('failure messages match the browser runner', () => {
  assert.equal(failure(() => expect(4).toBe(5)), 'expected 4 to be 5');
  assert.equal(failure(() => expect({ a: 1 }).toEqual({ a: 2 })), 'expected {"a":1} to equal {"a":2}');
  assert.equal(failure(() => expect(1).not.toBe(1)), 'expected 1 not to be 1');
  assert.equal(failure(() => expect([1]).toHaveLength(2)), 'expected [1] to have length 2 (got 1)');
  assert.equal(failure(() => expect('a', 'greeting').toBe('b')), 'greeting: expected "a" to be "b"');
  assert.equal(failure(() => expect(() => {}).toThrow()), 'expected the function to throw (it did not throw)');
  assert.equal(failure(() => expect(1).toBeTypeOf('string')), 'expected 1 to have type "string" (got "number")');
  const s = spy();
  s(1);
  assert.equal(failure(() => expect(s).toHaveBeenCalledTimes(2)), 'expected [function fn] to have been called 2 time(s) (was called 1)');
});

test('failures carry serialized expected/actual values for diffs', () => {
  try {
    expect([1, 'x']).toEqual([1, 'y']);
  } catch (error) {
    assert.deepEqual(error.actual, { t: 'array', items: [{ t: 'number', v: 1 }, { t: 'string', v: 'x', cut: false }], length: 2 });
    assert.equal(error.expected.items[1].v, 'y');
  }
});

test('.resolves and .rejects await the promise', async () => {
  await expect(Promise.resolve(3)).resolves.toBe(3);
  await expect(Promise.reject(new TypeError('no'))).rejects.toBeInstanceOf(TypeError);
  await assert.rejects(expect(Promise.resolve(1)).rejects.toBe(1), /expected the promise to reject, but it resolved/);
  // .rejects.toThrow checks the rejection reason as a thrown error, as in Jest.
  await expect(Promise.reject(new TypeError('no item'))).rejects.toThrow(TypeError);
  await expect(Promise.reject(new Error('no item here'))).rejects.toThrow('no item');
  await expect(Promise.reject(new Error('no item'))).rejects.toThrow(/^no/);
  await assert.rejects(expect(Promise.reject(new Error('other'))).rejects.toThrow('no item'), AssertionError);
});

test('spies record calls and results; waitFor polls until true', async () => {
  const double = spy((x) => x * 2);
  double(2);
  double(5);
  expect(double).toHaveBeenCalledWith(5);
  assert.deepEqual(double.results, [4, 10]);
  let ready = false;
  setTimeout(() => { ready = true; }, 30);
  assert.equal(await waitFor(() => ready, { timeout: 500 }), true);
  await assert.rejects(waitFor(() => false, { timeout: 60 }), /waitFor: the condition stayed false/);
});

test('deepEqual follows the browser runner rules', () => {
  assert.equal(deepEqual({ a: undefined }, {}), true);
  assert.equal(deepEqual([1, 2], [2, 1]), false);
  assert.equal(deepEqual(new Map([[1, { a: 1 }]]), new Map([[1, { a: 1 }]])), true);
  class A {}
  assert.equal(deepEqual(new A(), {}), false);
});
