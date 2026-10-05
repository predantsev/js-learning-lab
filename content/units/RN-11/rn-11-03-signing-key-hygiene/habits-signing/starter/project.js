// The habit tracker. This team commits its native folders, so /android and /ios
// were removed from the template's .gitignore.
export const gitignore = [
  'node_modules/', '.expo/', 'dist/', 'web-build/', 'expo-env.d.ts',
  '.kotlin/', '*.orig.*', '*.jks', '*.p8', '*.p12', '*.key', '*.mobileprovision',
  '.metro-health-check*', 'npm-debug.*', 'yarn-debug.*', 'yarn-error.*',
  '.DS_Store', '*.pem', '.env*.local', '*.tsbuildinfo',
  'android/app/build/', 'android/.gradle/', 'android/local.properties',
];

// Files inside the repository folder (path → content).
export const repo = {
  '.gitignore': '…',
  'App.tsx': 'export default function App() { … }',
  'app.json': '{ "expo": { "android": { "package": "com.example.jsll.habits" } } }',
  'android/app/build.gradle': "signingConfigs { release { if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) { storeFile file(MYAPP_UPLOAD_STORE_FILE) … } } }",
  'android/app/habits-upload.keystore': '<binary key store>',
  'android/gradle.properties': [
    'org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m',
    'newArchEnabled=true',
    'MYAPP_UPLOAD_STORE_FILE=habits-upload.keystore',
    'MYAPP_UPLOAD_KEY_ALIAS=habits-upload',
    'MYAPP_UPLOAD_STORE_PASSWORD=h4bit-tr4cker',
    'MYAPP_UPLOAD_KEY_PASSWORD=h4bit-tr4cker',
  ].join('\n'),
};

// Files on your computer outside the repository (absolute path → content).
export const home = {
  '/Users/learner/Documents/notes.txt': '…',
};

// The key-hygiene note for the team, one line per question.
export const note = {
  keyLocation: '',
  backup: '',
  ignored: '',
  ifLeaked: '',
};
