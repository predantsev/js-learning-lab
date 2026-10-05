// SIMULATION for the preview only (read-only): what a debug build sees on a device.
// The real bundler replaces every process.env.EXPO_PUBLIC_… expression written with a dot
// by its value from .env at build time. Any other name is left in the code and has no value on the device.
globalThis.__DEV__ = true;
globalThis.process = { env: { EXPO_PUBLIC_EXPENSES_URL: 'http://192.168.1.20:4000' } };
