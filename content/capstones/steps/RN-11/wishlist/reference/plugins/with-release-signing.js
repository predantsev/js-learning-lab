// Config plugin: on every `npx expo prebuild`, adds the release signing config from the
// React Native 0.86 guide to android/app/build.gradle. The values come from ~/.gradle/gradle.properties.
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_SIGNING = `        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') throw new Error('with-release-signing: build.gradle is not Groovy');
    let gradle = mod.modResults.contents;
    if (!gradle.includes('MYAPP_UPLOAD_STORE_FILE')) {
      gradle = gradle.replace('    signingConfigs {\n', (start) => start + RELEASE_SIGNING);
    }
    gradle = gradle.replace(
      /(buildTypes \{[\s\S]*?\n        release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release',
    );
    // Fail loudly instead of silently signing release with the debug key if the template changed.
    if (!gradle.includes('MYAPP_UPLOAD_STORE_FILE') || !gradle.includes('signingConfig signingConfigs.release')) {
      throw new Error('with-release-signing: the template of build.gradle changed; release signing was not added');
    }
    mod.modResults.contents = gradle;
    return mod;
  });
};
