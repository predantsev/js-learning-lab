// The configuration of the server scripts, read once from the environment at the start. Every value of
// process.env is text or undefined, so loadConfig checks the text and turns it into typed values. It
// returns every problem at once instead of stopping at the first one; the caller prints them and stops.
import path from "node:path";

export type Env = Record<string, string | undefined>;

export type Locale = "uk" | "en";

export type Config = {
  locale: Locale;
  dataDir: string; // an absolute path: the folder of the data file
  crashBeforeRename: boolean; // a rehearsal switch: stop the process between the temp-file write and the rename
};

export type ConfigResult = { ok: true; value: Config } | { ok: false; errors: string[] };

// server/data, built from this file's folder, so it does not depend on where node was started.
export const DEFAULT_DATA_DIR = path.join(import.meta.dirname, "..", "data");

export function loadConfig(env: Env): ConfigResult {
  const errors: string[] = [];

  const locale = env.LOCALE ?? "uk";
  if (locale !== "uk" && locale !== "en") {
    errors.push(`LOCALE must be uk or en, got "${locale}"`);
  }

  // DATA_DIR lets the checks use their own folder; a relative value is resolved from the working directory.
  const dataDir = path.resolve(env.DATA_DIR ?? DEFAULT_DATA_DIR);

  const crash = env.CRASH_BEFORE_RENAME;
  if (crash !== undefined && crash !== "1") {
    errors.push(`CRASH_BEFORE_RENAME must be 1 or unset, got "${crash}"`);
  }

  if (errors.length > 0) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { locale: locale as Locale, dataDir: dataDir, crashBeforeRename: crash === "1" } };
}
