// paths.js: one press of "Mark done" in two architectures, as this lesson models it.
// The press reads the habit's streak from a native module and updates the label on the screen.
// Sources: React Native 0.86 docs (the-new-architecture/landing-page, native-modules-lifecycle)
// and the 0.82 release post (the legacy architecture can no longer be turned on).
//
// Each step says where the work happens and what crosses between JavaScript and native code:
//   crossing: 'message' — a JSON message put into the bridge's asynchronous queue
//   crossing: 'jsi'     — a direct call through JSI (no JSON, no queue)
//   crossing: null      — work on one side only
export const paths = {
  legacy: {
    label: '%%legacyLabel%%',
    steps: [
      { side: 'js', crossing: 'message', text: '%%l1%%' },
      { side: 'native', crossing: null, text: '%%l2%%' },
      { side: 'native', crossing: 'message', text: '%%l3%%' },
      { side: 'js', crossing: 'message', text: '%%l4%%' },
      { side: 'native', crossing: null, text: '%%l5%%' },
    ],
  },
  newArch: {
    label: '%%newLabel%%',
    steps: [
      { side: 'js', crossing: 'jsi', text: '%%n1%%' },
      { side: 'native', crossing: null, text: '%%n2%%' },
      { side: 'js', crossing: 'jsi', text: '%%n3%%' },
      { side: 'native', crossing: null, text: '%%n4%%' },
    ],
  },
};
