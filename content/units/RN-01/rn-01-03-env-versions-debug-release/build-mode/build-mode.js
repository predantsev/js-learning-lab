// SIMULATION for the preview only. In a real app you never set __DEV__ yourself:
// the build sets it to true in a debug build and to false in a release build.
export const buildMode = 'debug'; // try 'release'
globalThis.__DEV__ = buildMode === 'debug';
