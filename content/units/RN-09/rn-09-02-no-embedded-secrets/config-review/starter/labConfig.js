// labConfig.js: every value the photo lab works with, with what its documentation says. Do not edit.
// All values are synthetic. A value of null is not known at build time: it arrives while the app runs.
export const labConfig = {
  authIssuer: {
    value: 'https://auth.lab.example',
    about: 'The address of the sign-in server. Every installed copy of the app opens it.',
  },
  clientId: {
    value: 'jsll-photo-lab',
    about: 'Names this app to the sign-in server. Its documentation calls it a public identifier: knowing it lets nobody sign in.',
  },
  clientSecret: {
    value: 'cs_lab_9d41e0',
    about: 'Proves to the sign-in server that a request comes from our own backend. Its documentation says: keep it confidential.',
  },
  photoUploadUrl: {
    value: 'https://photos.lab.example/upload',
    about: 'The address photos are uploaded to.',
  },
  accessToken: {
    value: null,
    about: 'Arrives after the person signs in; lets the holder upload photos as that person for 15 minutes, also after an app restart.',
  },
  refreshToken: {
    value: null,
    about: 'Arrives after the person signs in; exchanges for new access tokens until the person signs out.',
  },
  pushServerKey: {
    value: 'psk_lab_77ab',
    about: 'Lets the holder send a notification to every installed copy of the app.',
  },
  webhookSigningSecret: {
    value: 'whsec_lab_31c8',
    about: 'The photo service signs its callbacks to our server with it; whoever has it can forge those callbacks.',
  },
};
