// The wishlist project after someone followed a signing guide step by step.
// `gitignore`: the lines of .gitignore from the Expo SDK 57 template (comments left out).
export const gitignore = [
  'node_modules/', '.expo/', 'dist/', 'web-build/', 'expo-env.d.ts',
  '.kotlin/', '*.orig.*', '*.jks', '*.p8', '*.p12', '*.key', '*.mobileprovision',
  '.metro-health-check*', 'npm-debug.*', 'yarn-debug.*', 'yarn-error.*',
  '.DS_Store', '*.pem', '.env*.local', '*.tsbuildinfo', '/ios', '/android',
];

// Files inside the repository folder (path → content).
export const repo = {
  '.gitignore': '…',
  'App.tsx': 'export default function App() { … }',
  'app.json': '{ "expo": { "android": { "package": "com.example.jsll.wishlist" } } }',
  'package.json': '{ "name": "wishlist" }',
  'my-upload-key.keystore': '<binary key store>',
  'keystore.properties': 'storeFile=my-upload-key.keystore\nkeyAlias=my-key-alias\nstorePassword=w1sh-l1st-2026\nkeyPassword=w1sh-l1st-2026',
  'android/app/build.gradle': 'android { signingConfigs { … } }',
  'android/app/debug.keystore': '<binary key store>',
  'node_modules/expo/package.json': '{ "name": "expo" }',
};

// Files on your computer outside the repository (absolute path → content).
export const home = {};
