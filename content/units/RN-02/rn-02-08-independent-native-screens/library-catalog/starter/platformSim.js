// Read-only helper for the checks: picks a value the way Platform.select does on each platform
// (React Native docs): on iOS/Android the platform key, then 'native', then 'default';
// on the web (this preview): 'web', then 'default'.
export function selectFor(os, spec) {
  if (os === 'web') return 'web' in spec ? spec.web : spec.default;
  if (os in spec) return spec[os];
  if ('native' in spec) return spec.native;
  return spec.default;
}
