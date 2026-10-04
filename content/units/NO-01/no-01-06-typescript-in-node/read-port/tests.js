// readPort is called with hand-made environments; Node strips the types of port.ts first.
import { readPort } from './port.ts';

test('returns 3000 when PORT is unset', () => {
  expect(typeof readPort, 'type of readPort').toBe('function');
  expect(readPort({}), 'readPort({})').toBe(3000);
});

test('returns PORT as a number', () => {
  expect(typeof readPort, 'type of readPort').toBe('function');
  for (const [text, port] of [['8080', 8080], ['1', 1], ['65535', 65535]]) {
    expect(readPort({ PORT: text }), `readPort({ PORT: "${text}" })`).toBe(port);
  }
});

test('throws a RangeError that names an invalid PORT', () => {
  expect(typeof readPort, 'type of readPort').toBe('function');
  // '1e3' is a whole number for Number() (1000), but it is not made of digits only.
  for (const text of ['abc', '0', '70000', '30.5', '8080abc', '', '1e3']) {
    let thrown = null;
    try {
      readPort({ PORT: text });
    } catch (error) {
      thrown = error;
    }
    expect(thrown instanceof RangeError, `a RangeError for PORT "${text}"`).toBe(true);
    expect(thrown.message, `the message for PORT "${text}"`).toContain(`"${text}"`);
  }
});
