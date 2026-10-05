// The habit tracker. This team commits its native folders, so /android and /ios
// were removed from the template's .gitignore.
export const gitignore = [
  'node_modules/', '.expo/', 'dist/', 'web-build/', 'expo-env.d.ts',
  '.kotlin/', '*.orig.*', '*.jks', '*.p8', '*.p12', '*.key', '*.mobileprovision',
  '.metro-health-check*', 'npm-debug.*', 'yarn-debug.*', 'yarn-error.*',
  '.DS_Store', '*.pem', '.env*.local', '*.tsbuildinfo',
  'android/app/build/', 'android/.gradle/', 'android/local.properties',
  '*.keystore', // a safety net: no key store is ever committed by accident
];

// Files inside the repository folder (path → content).
export const repo = {
  '.gitignore': '…',
  'App.tsx': 'export default function App() { … }',
  'app.json': '{ "expo": { "android": { "package": "com.example.jsll.habits" } } }',
  'android/app/build.gradle': "signingConfigs { release { if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) { storeFile file(MYAPP_UPLOAD_STORE_FILE) … } } }",
  'android/gradle.properties': [
    'org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m',
    'newArchEnabled=true',
  ].join('\n'),
};

// Files on your computer outside the repository (absolute path → content).
export const home = {
  '/Users/learner/Documents/notes.txt': '…',
  '/Users/learner/keys/habits-upload.keystore': '<binary key store>',
  '/Users/learner/.gradle/gradle.properties': [
    'MYAPP_UPLOAD_STORE_FILE=/Users/learner/keys/habits-upload.keystore',
    'MYAPP_UPLOAD_KEY_ALIAS=habits-upload',
    'MYAPP_UPLOAD_STORE_PASSWORD=h4bit-tr4cker',
    'MYAPP_UPLOAD_KEY_PASSWORD=h4bit-tr4cker',
  ].join('\n'),
};

// The key-hygiene note for the team, one line per question.
export const note = {
  keyLocation: '/Users/learner/keys/habits-upload.keystore, outside the repository; passwords in ~/.gradle/gradle.properties',
  backup: 'An encrypted copy of the keystore and its passwords on a separate USB drive, checked once a release',
  ignored: '*.keystore and *.jks in .gitignore; the passwords never enter the repository at all',
  ifLeaked: 'Stop releasing with it, make a new upload key and ask for an upload key reset in Play Console',
};
