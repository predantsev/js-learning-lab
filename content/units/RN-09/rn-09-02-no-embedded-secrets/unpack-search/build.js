// build.js: imitates what a release build puts into the two app packages (Android .apk, iOS .ipa). Do not edit.
// Real builds do far more; what matters here is WHERE each configured value ends up.

const appCode = 'function u(e){return fetch(n.url+"/photos",{method:"POST",body:e})}';

export function buildPackage(config) {
  // Expo inlines every EXPO_PUBLIC_ variable into the JavaScript bundle as text.
  const inlined = Object.entries(config.env)
    .filter(([name]) => name.startsWith('EXPO_PUBLIC_'))
    .map(([name, value]) => `${JSON.stringify(name)}:${JSON.stringify(value)}`)
    .join(',');
  const bundle = `var n={${inlined}};${appCode}`;

  // iOS: Info.plist travels inside the app as a file.
  const plistEntries = Object.entries(config.ios.infoPlist)
    .map(([key, value]) => `<key>${key}</key><string>${value}</string>`)
    .join('');
  const infoPlist = `<plist><dict>${plistEntries}</dict></plist>`;

  // Android: values passed from Gradle end up as constants in the compiled app code.
  const buildConfig = Object.entries(config.android.buildConfigFields)
    .map(([key, value]) => `public static final String ${key} = "${value}";`)
    .join('\n');

  return {
    'lab.apk/assets/index.android.bundle': bundle,
    'lab.ipa/Payload/Lab.app/main.jsbundle': bundle,
    'lab.ipa/Payload/Lab.app/Info.plist': infoPlist,
    'lab.apk/classes.dex (BuildConfig)': buildConfig,
  };
}
