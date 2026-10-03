import { LAN_ADDRESS, MOCK_PORT, mockBaseUrl } from './devConfig.js';
import { createMockSource } from './source.js';
import { fetchFrom } from './targetSim.js';
import { habits } from './main.jsx';

async function loads(target, routes) {
  const list = await createMockSource(target, fetchFrom(target, { ...routes, records: habits })).list();
  return list.length;
}

test('the Android emulator reaches the computer without adb reverse', async () => {
  expect(typeof mockBaseUrl, 'type of mockBaseUrl').toBe('function');
  expect(mockBaseUrl('android-emulator'), "mockBaseUrl('android-emulator')").toBe(`http://10.0.2.2:${MOCK_PORT}`);
  expect(await loads('android-emulator', {}), 'habits loaded on the emulator without adb reverse').toBe(3);
});

test('the iOS simulator and the USB phone use the loopback address', async () => {
  expect(typeof mockBaseUrl, 'type of mockBaseUrl').toBe('function');
  for (const target of ['ios-simulator', 'android-usb']) {
    expect([`http://localhost:${MOCK_PORT}`, `http://127.0.0.1:${MOCK_PORT}`], `mockBaseUrl('${target}')`).toContain(mockBaseUrl(target));
  }
  expect(await loads('ios-simulator', {}), 'habits loaded on the iOS simulator').toBe(3);
  expect(await loads('android-usb', { reversed: true }), 'habits loaded on the USB phone after adb reverse').toBe(3);
});

test('a phone over Wi-Fi uses the LAN address', async () => {
  expect(typeof mockBaseUrl, 'type of mockBaseUrl').toBe('function');
  expect(mockBaseUrl('phone-wifi'), "mockBaseUrl('phone-wifi')").toBe(`http://${LAN_ADDRESS}:${MOCK_PORT}`);
  expect(await loads('phone-wifi', { lan: true }), 'habits loaded on the Wi-Fi phone').toBe(3);
});

test('an unknown target throws an error instead of guessing', () => {
  expect(typeof mockBaseUrl, 'type of mockBaseUrl').toBe('function');
  expect(() => mockBaseUrl('android-emulater'), "mockBaseUrl('android-emulater') (a typo)").toThrow();
});
