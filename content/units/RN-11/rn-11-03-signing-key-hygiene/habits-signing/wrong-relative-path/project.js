// The key store moved out, but the property still names it relative to android/app:
// Gradle can no longer find it.
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
  'android/gradle.properties': 'org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m\nnewArchEnabled=true\n',
};

export const home = {
  '/Users/learner/Documents/notes.txt': '…',
  '/Users/learner/keys/habits-upload.keystore': '<binary key store>',
  '/Users/learner/.gradle/gradle.properties': 'MYAPP_UPLOAD_STORE_FILE=habits-upload.keystore\nMYAPP_UPLOAD_KEY_ALIAS=habits-upload\nMYAPP_UPLOAD_STORE_PASSWORD=h4bit-tr4cker\nMYAPP_UPLOAD_KEY_PASSWORD=h4bit-tr4cker\n',
};

export const note = {
  keyLocation: '/Users/learner/keys/habits-upload.keystore',
  backup: 'A copy on a USB drive',
  ignored: '*.keystore',
  ifLeaked: 'Make a new upload key and request a reset',
};
