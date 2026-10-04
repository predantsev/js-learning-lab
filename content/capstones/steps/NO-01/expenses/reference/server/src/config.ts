// The configuration of the server scripts, read once from the environment at the start. Every value of
// process.env is text or undefined, so loadConfig checks the text and turns it into typed values. It
// returns every problem at once instead of stopping at the first one; the caller prints them and stops.
export type Env = Record<string, string | undefined>;

export type Locale = "uk" | "en";

export type Config = {
  locale: Locale;
};

export type ConfigResult = { ok: true; value: Config } | { ok: false; errors: string[] };

export function loadConfig(env: Env): ConfigResult {
  const errors: string[] = [];

  const locale = env.LOCALE ?? "uk";
  if (locale !== "uk" && locale !== "en") {
    errors.push(`LOCALE must be uk or en, got "${locale}"`);
  }

  if (errors.length > 0) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { locale: locale as Locale } };
}
