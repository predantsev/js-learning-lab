// `--locale <tag>` for the content scripts (validate.mjs, smoke.mjs): headless Chrome reports en-US
// unless told otherwise, so Intl-dependent content (dates, numbers, localeCompare) is checked under
// one locale only. With --locale, Chrome starts with --lang=<tag> and the page (and the sandbox
// frames inside it) get that locale for Intl, navigator.language and Accept-Language.

const LOCALE_TAG = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-([A-Z]{2}|\d{3}))?$/;

/** The --locale value of a command line, or null. Throws on a malformed tag. */
export function localeArg(args) {
  const i = args.indexOf('--locale');
  if (i === -1) return null;
  const tag = args[i + 1];
  if (!tag || !LOCALE_TAG.test(tag)) throw new Error(`--locale needs a language tag such as uk-UA or en-US (got ${JSON.stringify(tag ?? '')})`);
  return tag;
}

/** Options for chromium.launch and browser.newPage under a locale (both unchanged without one). */
export function localeOptions(locale) {
  return {
    launch: locale ? { args: [`--lang=${locale}`] } : {},
    page: locale ? { locale } : {},
  };
}
