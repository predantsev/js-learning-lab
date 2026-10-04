// The configuration of the server scripts, read once from the environment at the start. Every value of
// process.env is text or undefined, so loadConfig checks the text and turns it into typed values. It
// returns every problem at once instead of stopping at the first one; the caller prints them and stops.
import path from "node:path";

export type Env = Record<string, string | undefined>;

export type Locale = "uk" | "en";

export type Config = {
  locale: Locale;
  today: string | null; // a real calendar date "YYYY-MM-DD", or null when TODAY is not set
  host: string; // the address the records server listens on: 127.0.0.1 unless HOST says otherwise
  port: number; // the port of the records server
  dataDir: string; // an absolute path: the folder of the data file
  crashBeforeRename: boolean; // a rehearsal switch: stop the process between the temp-file write and the rename
  allowedOrigins: string[]; // the origins whose pages may read the answers (CORS): the web app's by default
  shutdownDeadlineMs: number; // how long a SIGTERM or SIGINT waits for the requests in flight before cutting them
  nodeEnv: "production" | "development" | "test"; // only shown in the start line: the code never branches on it
};

export type ConfigResult = { ok: true; value: Config } | { ok: false; errors: string[] };

// The records server listens next to the web app (npm start, 4310) on its own port.
export const DEFAULT_PORT = 4311;

// The server listens on the loopback interface by default: only this computer can connect. Any other
// address (HOST=0.0.0.0 opens it to the network) is a deliberate choice that the server warns about.
export const DEFAULT_HOST = "127.0.0.1";
export const LOOPBACK_HOSTS = ["127.0.0.1", "::1", "localhost"];

// The warning for a host that is not loopback, or null.
export function hostWarning(host: string): string | null {
  return LOOPBACK_HOSTS.includes(host) ? null : `listening on ${host}, not on loopback: other computers can reach this server`;
}

// The web app of `npm start` in the project folder. ALLOWED_ORIGINS (origins separated by commas) replaces
// the list; an origin is a scheme, a host and a port, with no path and no trailing slash.
export const DEFAULT_ALLOWED_ORIGINS = ["http://127.0.0.1:4310"];

// server/data, built from this file's folder, so it does not depend on where node was started.
export const DEFAULT_DATA_DIR = path.join(import.meta.dirname, "..", "data");

// True for text of the form YYYY-MM-DD that names a day that exists: the date is built in UTC and
// written back, so 2026-02-31 (which Date would move to March) does not come back the same.
export function isRealDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  const date = new Date(text + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

export function loadConfig(env: Env): ConfigResult {
  const errors: string[] = [];

  const locale = env.LOCALE ?? "uk";
  if (locale !== "uk" && locale !== "en") {
    errors.push(`LOCALE must be uk or en, got "${locale}"`);
  }

  // TODAY is optional here (the server does not need it); the scripts that count by day require it.
  const today = env.TODAY ?? null;
  if (today !== null && !isRealDate(today)) {
    errors.push(`TODAY must be a real date YYYY-MM-DD, got "${today}"`);
  }

  const host = env.HOST ?? DEFAULT_HOST;
  if (host.trim() === "" || /\s/.test(host)) {
    errors.push(`HOST must be an address such as 127.0.0.1, got "${host}"`);
  }

  let port = DEFAULT_PORT;
  if (env.PORT !== undefined) {
    port = Number(env.PORT);
    if (!/^\d+$/.test(env.PORT) || port < 1 || port > 65535) {
      errors.push(`PORT must be a whole number from 1 to 65535, got "${env.PORT}"`);
    }
  }

  // DATA_DIR lets the checks use their own folder; a relative value is resolved from the working directory.
  const dataDir = path.resolve(env.DATA_DIR ?? DEFAULT_DATA_DIR);

  const crash = env.CRASH_BEFORE_RENAME;
  if (crash !== undefined && crash !== "1") {
    errors.push(`CRASH_BEFORE_RENAME must be 1 or unset, got "${crash}"`);
  }

  const allowedOrigins = env.ALLOWED_ORIGINS === undefined ? DEFAULT_ALLOWED_ORIGINS : env.ALLOWED_ORIGINS.split(",").map((one) => one.trim());
  for (const origin of allowedOrigins) {
    if (origin === "*" || !URL.canParse(origin) || new URL(origin).origin !== origin) {
      errors.push(`ALLOWED_ORIGINS must be origins such as http://127.0.0.1:4310, separated by commas, got "${origin}"`);
    }
  }

  let shutdownDeadlineMs = 5000;
  if (env.SHUTDOWN_DEADLINE_MS !== undefined) {
    shutdownDeadlineMs = Number(env.SHUTDOWN_DEADLINE_MS);
    if (!/^\d+$/.test(env.SHUTDOWN_DEADLINE_MS) || shutdownDeadlineMs < 100 || shutdownDeadlineMs > 30_000) {
      errors.push(`SHUTDOWN_DEADLINE_MS must be a whole number from 100 to 30000, got "${env.SHUTDOWN_DEADLINE_MS}"`);
    }
  }

  // Node.js itself does not read NODE_ENV; the start line shows it, and a value outside the three is a typo.
  const nodeEnv = env.NODE_ENV ?? "development";
  if (nodeEnv !== "production" && nodeEnv !== "development" && nodeEnv !== "test") {
    errors.push(`NODE_ENV must be production, development or test, got "${nodeEnv}"`);
  }

  if (errors.length > 0) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { locale: locale as Locale, today: today, host: host, port: port, dataDir: dataDir, crashBeforeRename: crash === "1", allowedOrigins: allowedOrigins, shutdownDeadlineMs: shutdownDeadlineMs, nodeEnv: nodeEnv as Config["nodeEnv"] } };
}

// The scripts that count by day call this: TODAY, or null after printing why it is needed.
export function requireToday(config: Config): string | null {
  if (config.today === null) {
    console.error("TODAY is required, for example TODAY=2026-03-01");
  }
  return config.today;
}

// The day the facts of a store are counted on (the streaks depend on it): TODAY when it is set, otherwise
// the local calendar day of `now`. A backup's manifest keeps this day, so a later check counts on the same one.
export function factsDayOf(config: Config, now: Date = new Date()): string {
  if (config.today !== null) {
    return config.today;
  }
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
