// resolveBaseUrl for every target and both server bindings.
import { resolveBaseUrl } from './base-url.js';

const loopback = { port: 7331, bindHost: '127.0.0.1', lanAddress: '192.168.1.20' };
const lan = { port: 7331, bindHost: '0.0.0.0', lanAddress: '192.168.1.20' };
const resolve = (target, config) => {
  expect(typeof resolveBaseUrl, 'type of resolveBaseUrl').toBe('function');
  return resolveBaseUrl(target, config);
};
const errorOf = (fn) => {
  try {
    return { value: fn() };
  } catch (error) {
    return { error };
  }
};

test('the browser and the iOS simulator use 127.0.0.1 with the configured port', () => {
  expect(resolve('web', loopback), 'web').toBe('http://127.0.0.1:7331');
  expect(resolve('ios-simulator', loopback), 'ios-simulator').toBe('http://127.0.0.1:7331');
  expect(resolve('web', { ...loopback, port: 8100 }), 'web with port 8100').toBe('http://127.0.0.1:8100');
});

test('the Android emulator uses 10.0.2.2', () => {
  expect(resolve('android-emulator', loopback), 'android-emulator').toBe('http://10.0.2.2:7331');
});

test('a device throws while the server is bound to loopback', () => {
  for (const bindHost of ['127.0.0.1', 'localhost', '::1']) {
    const result = errorOf(() => resolve('device', { ...loopback, bindHost }));
    expect(result.error, `what device gives with bindHost ${bindHost}`).toBeInstanceOf(Error);
  }
});

test('a device uses the LAN address once the server is bound to the network', () => {
  expect(resolve('device', lan), 'device with bindHost 0.0.0.0').toBe('http://192.168.1.20:7331');
});

test('a device throws when the LAN address is missing', () => {
  const result = errorOf(() => resolve('device', { port: 7331, bindHost: '0.0.0.0' }));
  expect(result.error, 'what device gives without lanAddress').toBeInstanceOf(Error);
});

test('an unknown target throws instead of guessing', () => {
  for (const target of ['android', 'iphone', '']) {
    expect(errorOf(() => resolve(target, lan)).error, `what "${target}" gives`).toBeInstanceOf(Error);
  }
});
