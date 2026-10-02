// Expected texts are computed with Intl here, so the checks follow this browser's locale data.
const moneyText = (locale, minor) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'UAH' }).format(minor / 100);
const dayText = (locale, date) => new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date));
const record = () => ({ label: L.lunch, amountMinor: 21050, date: '2026-03-02' });

// Runs `fn` as if this computer were in New York: a formatter without a timeZone gets America/New_York.
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

test('formats the amount in UAH for the locale', () => {
  for (const locale of ['uk-UA', 'en-US']) {
    expect(scope.formatForDisplay(record(), locale).amount, `amount for ${locale}`).toBe(moneyText(locale, 21050));
  }
  expect(scope.formatForDisplay({ ...record(), amountMinor: 125000 }, 'uk-UA').amount, 'amount for 125000 kopiykas').toBe(moneyText('uk-UA', 125000));
});

test('formats the date in the long form for the locale', () => {
  for (const locale of ['uk-UA', 'en-US']) {
    expect(scope.formatForDisplay(record(), locale).date, `date for ${locale}`).toBe(dayText(locale, '2026-03-02'));
  }
});

test('shows the same calendar day on a computer in New York', () => {
  const shown = asIfInNewYork(() => scope.formatForDisplay({ ...record(), date: '2026-03-01' }, 'en-US').date);
  expect(shown, 'date shown in New York').toBe(dayText('en-US', '2026-03-01'));
});

test('keeps the label as it is', () => {
  expect(scope.formatForDisplay(record(), 'en-US').label, 'label').toBe(L.lunch);
});

test('does not change the record', () => {
  const original = record();
  scope.formatForDisplay(original, 'uk-UA');
  scope.formatForDisplay(original, 'en-US');
  expect(original, 'the record after formatting').toEqual(record());
});
