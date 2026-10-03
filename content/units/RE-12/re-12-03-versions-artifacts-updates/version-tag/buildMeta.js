// In a real project the bundler writes these values in during the build (`define` in
// vite.config.ts reads package.json and `git rev-parse --short HEAD`). The sandbox has no build
// step, so this module stands in for what the bundler would have written.
export const buildMeta = {
  version: "0.1.0",
  commit: "9010501",
};
