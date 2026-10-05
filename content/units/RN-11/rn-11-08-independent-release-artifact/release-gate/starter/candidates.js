// SUPPLIED (read-only): the installed build of the library-loans app and two release candidates,
// as read back from their artifacts. `bundleStrings` is a sample of text found in the embedded bundle.
export const installed = {
  id: 'com.example.jsll.loans',
  versionCode: 12,
  signer: 'SHA-256 6F:21:…:D4',
  minAndroidApi: 24,
};

export const candidateA = {
  id: 'com.example.jsll.loans',
  versionCode: 13,
  signer: 'SHA-256 6F:21:…:D4',
  minAndroidApi: 24,
  debuggable: false,
  usesCleartextTraffic: false,
  bundleStrings: ['%%heading%%', '%%overdue%%', 'l-01', 'l-02'],
};

export const candidateB = {
  id: 'com.example.jsll.loans',
  versionCode: 12,
  signer: 'SHA-256 6F:21:…:D4',
  minAndroidApi: 26,
  debuggable: false,
  usesCleartextTraffic: true,
  bundleStrings: ['%%heading%%', '[dev] loans from the mock service', 'http://10.0.2.2:7310'],
};
