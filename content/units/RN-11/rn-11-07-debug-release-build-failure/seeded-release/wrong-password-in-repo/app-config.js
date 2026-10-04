// "Keep everything in one place": the signing passwords were copied into the tracked app config.
export const appConfig = {
  name: 'Release lab',
  version: '1.4.0',
  android: { package: 'com.example.jsll.releaselab', versionCode: 5 },
  signing: { storeFile: '/Users/learner/keys/rn11-lab-upload.keystore', storePassword: 'r3lease-lab', keyPassword: 'r3lease-lab' },
};
