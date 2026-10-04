// The configuration of the server scripts, read once from the environment at the start. Every value of
// process.env is text or undefined, so loadConfig checks the text and turns it into typed values. It
// returns every problem at once instead of stopping at the first one; the caller prints them and stops.
export type Env = Record<string, string | undefined>;

export type Locale = "uk" | "en";

export type Config = {
  locale: Locale;
  today: string; // a real calendar date "YYYY-MM-DD"
};

export type ConfigResult = { ok: true; value: Config } | { ok: false; errors: string[] };

// True for text of the form YYYY-MM-DD that names a day that exists: the date is built in UTC and
// written back, so 2026-02-31 (which Date would move to March) does not come back the same.
function isRealDate(text: string): boolean {
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

  const today = env.TODAY;
  if (today === undefined) {
    errors.push("TODAY is required, for example TODAY=2026-03-01");
  } else if (!isRealDate(today)) {
    errors.push(`TODAY must be a real date YYYY-MM-DD, got "${today}"`);
  }

  if (errors.length > 0 || today === undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { locale: locale as Locale, today: today } };
}
