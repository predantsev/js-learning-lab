import { LAN_ADDRESS, mockBaseUrl } from './devConfig.js';
import { loadRecords } from './loadRecords.js';
import { networkSecurityConfig } from './networkSecurityConfig.js';
import { cleartextPermitted } from './policy.js';

const xml = () => networkSecurityConfig;
const hostOf = (target) => new URL(mockBaseUrl(target)).hostname;
const abortError = () => Object.assign(new Error('Aborted'), { name: 'AbortError' });

function within(promise, ms) {
  return Promise.race([promise, sleep(ms).then(() => { throw new Error(`still waiting after ${ms} ms`); })]);
}

test('each target gets a host it can reach', () => {
  expect(typeof mockBaseUrl, 'type of mockBaseUrl').toBe('function');
  expect(hostOf('android-emulator'), "host for 'android-emulator'").toBe('10.0.2.2');
  expect(['127.0.0.1', 'localhost'], "host for 'ios-simulator'").toContain(hostOf('ios-simulator'));
  expect(['127.0.0.1', 'localhost'], "host for 'android-usb' (after adb reverse)").toContain(hostOf('android-usb'));
  expect(hostOf('phone-wifi'), "host for 'phone-wifi'").toBe(LAN_ADDRESS);
});

test('the debug config permits plain HTTP to the Android development hosts', () => {
  expect(typeof mockBaseUrl, 'type of mockBaseUrl').toBe('function');
  for (const target of ['android-emulator', 'android-usb']) {
    expect(cleartextPermitted(xml(), hostOf(target)), `plain HTTP to ${hostOf(target)} (${target})`).toBe(true);
  }
});

test('the debug config permits plain HTTP to nothing else', () => {
  for (const host of ['api.expenses.example', 'example.com']) {
    expect(cleartextPermitted(xml(), host), `plain HTTP to ${host}`).toBe(false);
  }
});

test('a silent service ends in a TimeoutError and an aborted request', async () => {
  expect(typeof loadRecords, 'type of loadRecords').toBe('function');
  let passedSignal = null;
  const silentFetch = (url, { signal } = {}) => {
    passedSignal = signal;
    return new Promise((resolve, reject) => signal?.addEventListener('abort', () => reject(abortError())));
  };
  let name = 'no error';
  try {
    await within(loadRecords('http://10.0.2.2:7310/records/expenses', { fetchFn: silentFetch, timeoutMs: 100 }), 800);
  } catch (error) {
    name = error.name === 'Error' ? error.message : error.name;
  }
  expect(name, 'what loadRecords rejected with (timeoutMs: 100)').toBe('TimeoutError');
  expect(passedSignal?.aborted, 'the signal passed to fetchFn is aborted').toBe(true);
});

test('a working service still loads the records', async () => {
  expect(typeof loadRecords, 'type of loadRecords').toBe('function');
  const okFetch = async () => new Response(JSON.stringify([{ id: 'e-01', label: L.groceries }]), { status: 200 });
  const records = await within(loadRecords('http://10.0.2.2:7310/records/expenses', { fetchFn: okFetch, timeoutMs: 500 }), 1500);
  expect(records.map((record) => record.label), 'labels of the loaded records').toEqual([L.groceries]);
});
