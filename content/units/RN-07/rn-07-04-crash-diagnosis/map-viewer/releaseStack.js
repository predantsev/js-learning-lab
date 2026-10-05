// SYNTHETIC release stack of the planner, as a crash reporter receives it: every frame points at
// line 1 of the minified bundle of build 41, so only the column tells the frames apart.
export const crash = {
  message: "TypeError: Cannot read property 'slice' of null",
  build: 'b41',
  frames: [
    { name: 'n', file: 'index.android.bundle', line: 1, column: 48210 },
    { name: 'o', file: 'index.android.bundle', line: 1, column: 51877 },
    { name: 'Ma', file: 'index.android.bundle', line: 1, column: 902114 },
  ],
};
