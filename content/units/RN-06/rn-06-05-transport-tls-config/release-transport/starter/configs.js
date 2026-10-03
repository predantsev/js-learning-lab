// Transport settings of four builds of the planner app (synthetic).
export const configs = [
  {
    name: 'local debug',
    build: 'debug',
    apiBaseUrl: 'http://10.0.2.2:7310',
    android: { usesCleartextTraffic: true, cleartextDomains: [] },
    ios: { NSAllowsArbitraryLoads: false },
    tls: { trustAllCertificates: false },
  },
  {
    name: 'store release',
    build: 'release',
    apiBaseUrl: 'https://api.planner.example',
    android: { usesCleartextTraffic: false, cleartextDomains: [] },
    ios: { NSAllowsArbitraryLoads: false },
    tls: { trustAllCertificates: false },
  },
  {
    name: 'release with the mock URL left in',
    build: 'release',
    apiBaseUrl: 'http://10.0.2.2:7310',
    android: { usesCleartextTraffic: true, cleartextDomains: [] },
    ios: { NSAllowsArbitraryLoads: false },
    tls: { trustAllCertificates: false },
  },
  {
    name: 'debug that trusts every certificate',
    build: 'debug',
    apiBaseUrl: 'https://staging.planner.example',
    android: { usesCleartextTraffic: true, cleartextDomains: [] },
    ios: { NSAllowsArbitraryLoads: false },
    tls: { trustAllCertificates: true },
  },
];
