// support.js: what three synthetic libraries say about their support, copied from their READMEs.
// The libraries are invented for this lesson. A support row covers a range of React Native versions
// (major.minor, both ends included) and says what each platform gets:
//   'new'         — works on the New Architecture
//   'legacy-flag' — old architecture only: the README says to set newArchEnabled=false
//   'interop'     — old architecture only, and the flag is ignored: it can run only through the interop layer
//   null          — the platform is not supported
export const libraries = [
  {
    name: 'habit-calendar@4.2.0',
    rows: [{ from: '0.76', to: '0.99', android: 'new', ios: 'new' }],
  },
  {
    name: 'step-sensor-legacy@1.9.0',
    rows: [
      { from: '0.70', to: '0.81', android: 'legacy-flag', ios: 'legacy-flag' },
      // From 0.82 on, newArchEnabled=false is ignored (React Native 0.82 release post).
      { from: '0.82', to: '0.99', android: 'interop', ios: 'interop' },
    ],
  },
  {
    name: 'face-unlock@2.0.0',
    rows: [{ from: '0.76', to: '0.99', android: null, ios: 'new' }],
  },
];
