// SIMULATION for the preview only (read-only). It stands in for how Gradle resolves the release
// signing config from the React Native 0.86 guide ("Publishing to Google Play Store"):
//   storeFile file(MYAPP_UPLOAD_STORE_FILE), storePassword MYAPP_UPLOAD_STORE_PASSWORD, …
// Properties come from android/gradle.properties in the repository and from
// ~/.gradle/gradle.properties (GRADLE_USER_HOME), and the user's file wins.
// A relative storeFile is looked up next to android/app/build.gradle; an absolute one as it is.
export const USER_GRADLE_PROPERTIES = '/Users/learner/.gradle/gradle.properties';

function parseProperties(text = '') {
  const result = {};
  for (const line of text.split('\n')) {
    const match = /^\s*([\w.]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match && !line.trim().startsWith('#')) result[match[1]] = match[2];
  }
  return result;
}

export function releaseSigning(repo, home) {
  const props = {
    ...parseProperties(repo['android/gradle.properties']),
    ...parseProperties(home[USER_GRADLE_PROPERTIES]),
  };
  const storeFile = props.MYAPP_UPLOAD_STORE_FILE;
  if (!storeFile) return { ok: false, problem: 'no-store-file' };
  const absolute = storeFile.startsWith('/') || /^[A-Za-z]:[\\/]/.test(storeFile);
  const found = absolute ? storeFile in home : `android/app/${storeFile}` in repo;
  if (!found) return { ok: false, problem: 'keystore-not-found', storeFile };
  if (!props.MYAPP_UPLOAD_STORE_PASSWORD || !props.MYAPP_UPLOAD_KEY_PASSWORD || !props.MYAPP_UPLOAD_KEY_ALIAS) {
    return { ok: false, problem: 'missing-password' };
  }
  return { ok: true, storeFile };
}
