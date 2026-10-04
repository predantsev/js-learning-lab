// gaps.js: what your tests replace or cannot see, and the check on the declared target that covers it.
//
// mocked: 'clock' | 'screen-reader' | 'storage' | 'app-state' | 'notifications'
// gap: what the tests do not prove, in your words
// deviceCheck: 'restart' | 'offline' | 'lifecycle' | 'security' | 'a11y' | 'performance'
export const mockGaps = [
  { mocked: 'screen-reader', gap: `%%gapReader%%`, deviceCheck: 'a11y' },
];
