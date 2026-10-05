// The key store moved out, but the passwords stayed in the tracked android/gradle.properties.
export const gitignore = [
  'node_modules/', '.expo/', 'dist/', 'web-build/', 'expo-env.d.ts',
  '.kotlin/', '*.orig.*', '*.jks', '*.p8', '*.p12', '*.key', '*.mobileprovision',
  '.metro-health-check*', 'npm-debug.*', 'yarn-debug.*', 'yarn-error.*',
  '.DS_Store', '*.pem', '.env*.local', '*.tsbuildinfo',
  'android/app/build/', 'android/.gradle/', 'android/local.properties',
  '*.keystore',
];

export const repo = {
  '.gitignore': '…',
  'App.tsx': 'export default function App() { … }',
  'app.json': '{ "expo": { "android": { "package": "com.example.jsll.habits" } } }',
  'android/app/build.gradle': "signingConfigs { release { if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) { storeFile file(MYAPP_UPLOAD_STORE_FILE) … } } }",
  'android/gradle.properties': [
    'org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m',
    'newArchEnabled=true',
    'MYAPP_UPLOAD_STORE_FILE=/Users/learner/keys/habits-upload.keystore',
    'MYAPP_UPLOAD_KEY_ALIAS=habits-upload',
    'MYAPP_UPLOAD_STORE_PASSWORD=h4bit-tr4cker',
    'MYAPP_UPLOAD_KEY_PASSWORD=h4bit-tr4cker',
  ].join('\n'),
};

export const home = {
  '/Users/learner/Documents/notes.txt': '…',
  '/Users/learner/keys/habits-upload.keystore': '<binary key store>',
};

export const note = {
  keyLocation: '/Users/learner/keys/habits-upload.keystore',
  backup: 'A copy on a USB drive',
  ignored: '*.keystore',
  ifLeaked: 'Make a new upload key and request a reset',
};
