import { assertReleaseTransport } from './transport.js';

const safeRelease = () => ({
  name: 'test release',
  build: 'release',
  apiBaseUrl: 'https://api.planner.example',
  android: { usesCleartextTraffic: false, cleartextDomains: [] },
  ios: { NSAllowsArbitraryLoads: false },
  tls: { trustAllCertificates: false },
});
const devDebug = () => ({ ...safeRelease(), name: 'test debug', build: 'debug', apiBaseUrl: 'http://10.0.2.2:7310', android: { usesCleartextTraffic: true, cleartextDomains: ['10.0.2.2'] } });

function messageOf(config) {
  try {
    assertReleaseTransport(config);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : `not an Error: ${String(error)}`;
  }
}

test('a safe release and a local debug build pass', () => {
  expect(typeof assertReleaseTransport, 'type of assertReleaseTransport').toBe('function');
  expect(messageOf(safeRelease()), 'error for an https release without exceptions').toBeNull();
  expect(messageOf(devDebug()), 'error for a debug build using plain HTTP to the mock service').toBeNull();
});

test('a release build with an http address fails and names apiBaseUrl', () => {
  expect(typeof assertReleaseTransport, 'type of assertReleaseTransport').toBe('function');
  const message = messageOf({ ...safeRelease(), apiBaseUrl: 'http://10.0.2.2:7310' });
  expect(message, 'error message for apiBaseUrl http://10.0.2.2:7310 in release').toMatch(/apiBaseUrl/);
});

test('release cleartext exceptions fail and are named', () => {
  expect(typeof assertReleaseTransport, 'type of assertReleaseTransport').toBe('function');
  const release = safeRelease();
  expect(messageOf({ ...release, android: { usesCleartextTraffic: true, cleartextDomains: [] } }), 'error for usesCleartextTraffic: true in release').toMatch(/usesCleartextTraffic/);
  expect(messageOf({ ...release, android: { usesCleartextTraffic: false, cleartextDomains: ['10.0.2.2'] } }), "error for cleartextDomains: ['10.0.2.2'] in release").toMatch(/cleartextDomains/);
  expect(messageOf({ ...release, ios: { NSAllowsArbitraryLoads: true } }), 'error for NSAllowsArbitraryLoads: true in release').toMatch(/NSAllowsArbitraryLoads/);
});

test('trusting every certificate fails in every build', () => {
  expect(typeof assertReleaseTransport, 'type of assertReleaseTransport').toBe('function');
  expect(messageOf({ ...safeRelease(), tls: { trustAllCertificates: true } }), 'error for trustAllCertificates in release').toMatch(/trustAllCertificates/);
  expect(messageOf({ ...devDebug(), tls: { trustAllCertificates: true } }), 'error for trustAllCertificates in debug').toMatch(/trustAllCertificates/);
});
