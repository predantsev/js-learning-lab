// A MODEL of the two platform gates for plain HTTP, built from the files that `npx expo prebuild`
// generated for an Expo SDK 57 project while this lesson was prepared:
//   android/app/src/main/AndroidManifest.xml   no usesCleartextTraffic (Android 9+ then blocks cleartext)
//   android/app/src/debug/AndroidManifest.xml  android:usesCleartextTraffic="true"
//   ios/<app>/Info.plist                        NSAllowsArbitraryLoads = false, NSAllowsLocalNetworking = true
export const template = {
  android: { main: { usesCleartextTraffic: undefined }, debug: { usesCleartextTraffic: true } },
  ios: { NSAllowsArbitraryLoads: false, NSAllowsLocalNetworking: true }, // the same Info.plist for debug and release
};

// Android: a debug build merges the debug manifest over the main one; a release build has only the main one.
export function androidAllows(url, build) {
  if (new URL(url).protocol === 'https:') return true;
  const manifest = build === 'debug' ? { ...template.android.main, ...template.android.debug } : template.android.main;
  return manifest.usesCleartextTraffic === true;
}

// iOS App Transport Security: IP addresses are not subject to it (iOS 10+, per Apple's developer forums),
// unqualified names such as localhost and *.local are allowed by NSAllowsLocalNetworking,
// any other name needs HTTPS unless NSAllowsArbitraryLoads is on.
export function iosAllows(url) {
  const { protocol, hostname } = new URL(url);
  if (protocol === 'https:') return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return true;
  if (!hostname.includes('.') || hostname.endsWith('.local')) return template.ios.NSAllowsLocalNetworking;
  return template.ios.NSAllowsArbitraryLoads;
}
