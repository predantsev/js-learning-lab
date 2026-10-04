// SIMULATION for the preview only (read-only). It stands in for two real checks that never run here:
// the store's upload check (Google Play Console, App Store Connect) and Android's package installer
// (PackageManager), which refuses a versionCode lower than the installed one.
// It applies the documented rules to plain objects: the id decides "same app or another app",
// the build number decides "newer or not". The user-facing version is never compared.

function appId(platform, release) {
  return platform === 'android' ? release.android.package : release.ios.bundleIdentifier;
}

function buildOf(platform, release) {
  const raw = platform === 'android' ? release.android.versionCode : release.ios.buildNumber;
  if (raw === null || raw === undefined || raw === '') return NaN;
  return Number(raw);
}

// What happens when `next` is shipped to people who have `installed`.
export function shipOutcome(platform, installed, next) {
  const installedBuild = buildOf(platform, installed);
  const nextBuild = buildOf(platform, next);
  if (!appId(platform, next) || !Number.isFinite(installedBuild) || !Number.isFinite(nextBuild)) return 'incomplete';
  if (appId(platform, next) !== appId(platform, installed)) return 'separate-app';
  if (nextBuild < installedBuild) return 'lower-build';
  if (nextBuild === installedBuild) return 'same-build';
  return 'update';
}
