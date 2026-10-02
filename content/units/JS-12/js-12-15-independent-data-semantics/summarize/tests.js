// Fixtures of the checks: emoji labels, a decomposed letter, a repeated id and the input "0,10".
const fixtures = () => [
  { id: 'e-01', label: 'Продукти на тиждень', amountText: '845,50', date: '2026-03-01' },
  { id: 'e-02', label: 'Чай і кава 🍵☕', amountText: '0,10', date: '2026-02-28' },
  { id: 'e-03', label: '🎟️🎟️ Квитки в кіно на вечірній сеанс', amountText: '300', date: '2026-02-27' },
  { id: 'e-02', label: 'Повтор із тим самим id', amountText: '999,99', date: '2026-03-02' },
  { id: 'e-04', label: 'Лампочки', amountText: '99.9', date: '2026-03-31' },
];
const money = (locale, minor) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'UAH' }).format(minor / 100);
const day = (locale, date) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(date));

// Runs `fn` as if this computer were in New York: a date formatter without a timeZone gets America/New_York.
function asIfInNewYork(fn) {
  const RealFormat = Intl.DateTimeFormat;
  const realToLocaleDateString = Date.prototype.toLocaleDateString;
  const realToLocaleString = Date.prototype.toLocaleString;
  const withZone = (options) => ({ timeZone: 'America/New_York', ...(options ?? {}) });
  function FakeFormat(locales, options) {
    return new RealFormat(locales, withZone(options));
  }
  FakeFormat.prototype = RealFormat.prototype;
  FakeFormat.supportedLocalesOf = RealFormat.supportedLocalesOf;
  Intl.DateTimeFormat = FakeFormat;
  Date.prototype.toLocaleDateString = function (locales, options) {
    return realToLocaleDateString.call(this, locales, withZone(options));
  };
  Date.prototype.toLocaleString = function (locales, options) {
    return realToLocaleString.call(this, locales, withZone(options));
  };
  try {
    return fn();
  } finally {
    Intl.DateTimeFormat = RealFormat;
    Date.prototype.toLocaleDateString = realToLocaleDateString;
    Date.prototype.toLocaleString = realToLocaleString;
  }
}

test('byId is a Map in which the first record of a repeated id wins', () => {
  const list = fixtures();
  const summary = scope.summarize(list, 'uk-UA');
  expect(summary.byId, 'summary.byId').toBeInstanceOf(Map);
  expect(summary.byId.size, 'summary.byId.size').toBe(4);
  expect(summary.byId.get('e-02'), 'summary.byId.get("e-02")').toBe(list[1]);
  expect(summary.count, 'summary.count').toBe(4);
});

test('totalMinor is an exact whole number of kopiykas', () => {
  const summary = scope.summarize(fixtures(), 'uk-UA');
  expect(summary.totalMinor, 'summary.totalMinor').toBe(84550 + 10 + 30000 + 9990);
  expect(Number.isInteger(summary.totalMinor), 'totalMinor is a whole number').toBe(true);
});

test('"0,10" is ten kopiykas', () => {
  const summary = scope.summarize([{ id: 'x-1', label: 'x', amountText: '0,10', date: '2026-03-01' }], 'en-US');
  expect(summary.totalMinor, 'totalMinor for "0,10"').toBe(10);
});

test('display amounts and dates follow the locale', () => {
  for (const locale of ['uk-UA', 'en-US']) {
    const shown = scope.summarize(fixtures(), locale).display;
    expect(shown.map((row) => row.id), `display ids for ${locale}`).toEqual(['e-01', 'e-02', 'e-03', 'e-04']);
    expect(shown[0].amount, `amount of e-01 for ${locale}`).toBe(money(locale, 84550));
    expect(shown[3].amount, `amount of e-04 for ${locale}`).toBe(money(locale, 9990));
    expect(shown[1].date, `date of e-02 for ${locale}`).toBe(day(locale, '2026-02-28'));
  }
});

test('display dates are the same calendar day in New York', () => {
  const shown = asIfInNewYork(() => scope.summarize(fixtures(), 'en-US').display);
  expect(shown[0].date, 'date of e-01 shown in New York').toBe(day('en-US', '2026-03-01'));
});

test('long labels are cut at 20 code points without breaking an emoji', () => {
  const shown = scope.summarize(fixtures(), 'uk-UA').display;
  expect(shown[0].label, 'a label that fits').toBe('Продукти на тиждень');
  expect(shown[2].label, 'a long label with emoji').toBe([...'🎟️🎟️ Квитки в кіно на вечірній сеанс'].slice(0, 20).join('') + '…');
  const lone = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
  expect(lone.test(shown[2].label), 'the cut label has a broken surrogate').toBe(false);
});

test('search ignores case, spaces and how letters were typed', () => {
  const summary = scope.summarize(fixtures(), 'uk-UA');
  expect(summary.search('ЧАЙ'), 'search("ЧАЙ")').toEqual(['e-02']);
  expect(summary.search(' Чай '), 'search(" Чай ") with a one-code-point й').toEqual(['e-02']);
  expect(summary.search('квитки'), 'search("квитки")').toEqual(['e-03']);
  expect(summary.search('повтор'), 'search("повтор"), a dropped duplicate').toEqual([]);
  expect(summary.search(''), 'search("")').toEqual(['e-01', 'e-02', 'e-03', 'e-04']);
});

test('switching the locale leaves the records unchanged', () => {
  const list = fixtures();
  scope.summarize(list, 'uk-UA');
  scope.summarize(list, 'en-US');
  expect(list, 'records after two summaries').toEqual(fixtures());
});
