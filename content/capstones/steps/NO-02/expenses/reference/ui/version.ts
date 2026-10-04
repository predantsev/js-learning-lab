// The version of the running build. The release build (scripts/release.mjs) replaces APP_VERSION with
// the version from package.json; the development build (`npm run build`) has no such name, so the
// page says "dev" there.
declare const APP_VERSION: string | undefined;

export const VERSION: string = typeof APP_VERSION === "string" ? APP_VERSION : "dev";
