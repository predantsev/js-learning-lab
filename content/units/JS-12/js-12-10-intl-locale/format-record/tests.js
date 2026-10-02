// Expected texts are computed with Intl here, so the checks follow this browser's locale data.
const moneyText = (locale, minor) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'UAH' }).format(minor / 100);
const dayText = (locale, date) => new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date));
const record = () => ({ label: L.lunch, amountMinor: 21050, date: '2026-03-02' });

// Runs `fn` as if this computer's time zone were `timeZone`: `new Date(y, m, d)`, date-time text
// without a zone, the local getters and setters, and formatters without a `timeZone` all follow it.
// UTC methods are untouched, so code that works only in UTC gives the same result as on a real machine.
function withMachineZone(timeZone, fn) {
  const RealDate = Date;
  const RealFormat = Intl.DateTimeFormat;
  const proto = RealDate.prototype;
  const real = { toLocaleString: proto.toLocaleString, toLocaleDateString: proto.toLocaleDateString, toLocaleTimeString: proto.toLocaleTimeString };
  const parts = new RealFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
  const offsetAt = (ms) => {
    const whole = Math.floor(ms / 1000) * 1000;
    const p = Object.fromEntries(parts.formatToParts(new RealDate(whole)).map((part) => [part.type, Number(part.value)]));
    return (RealDate.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole) / 60000;
  };
  const fromWall = (y, mo, d, h, mi, s, ms) => {
    const wall = RealDate.UTC(y, mo, d, h, mi, s, ms);
    if (!Number.isFinite(wall)) return NaN;
    // As the language does: a repeated wall time takes the earlier instant, a skipped one the offset before the change.
    const before = offsetAt(wall - 864e5);
    const fits = [before, offsetAt(wall + 864e5)].map((offset) => wall - offset * 60000).filter((t) => (wall - t) / 60000 === offsetAt(t));
    return fits.length > 0 ? Math.min(...fits) : wall - before * 60000;
  };
  const wall = (date) => {
    const ms = date.getTime();
    return Number.isFinite(ms) ? new RealDate(ms + offsetAt(ms) * 60000) : new RealDate(NaN);
  };
  const LOCAL_TEXT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
  const parseLocal = (text) => {
    const m = LOCAL_TEXT.exec(text);
    return m ? fromWall(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0), Number((m[7] ?? '0').padEnd(3, '0'))) : null;
  };
  const setLocal = (date, index, values) => {
    const w = wall(date);
    const f = [w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate(), w.getUTCHours(), w.getUTCMinutes(), w.getUTCSeconds(), w.getUTCMilliseconds()];
    values.forEach((value, i) => { f[index + i] = Number(value); });
    return date.setTime(fromWall(...f));
  };
  class ZoneDate extends RealDate {
    constructor(...args) {
      if (args.length >= 2) {
        const [y, mo, d = 1, h = 0, mi = 0, s = 0, ms = 0] = args.map(Number);
        super(fromWall(y, mo, d, h, mi, s, ms));
      } else if (args.length === 1 && typeof args[0] === 'string' && parseLocal(args[0]) !== null) {
        super(parseLocal(args[0]));
      } else {
        super(...args);
      }
    }
    static parse(text) {
      const local = parseLocal(String(text));
      return local === null ? RealDate.parse(text) : local;
    }
    getFullYear() { return wall(this).getUTCFullYear(); }
    getMonth() { return wall(this).getUTCMonth(); }
    getDate() { return wall(this).getUTCDate(); }
    getDay() { return wall(this).getUTCDay(); }
    getHours() { return wall(this).getUTCHours(); }
    getMinutes() { return wall(this).getUTCMinutes(); }
    getSeconds() { return wall(this).getUTCSeconds(); }
    getMilliseconds() { return wall(this).getUTCMilliseconds(); }
    getTimezoneOffset() { return Number.isFinite(this.getTime()) ? -offsetAt(this.getTime()) : NaN; }
    setFullYear(...values) { return setLocal(this, 0, values); }
    setMonth(...values) { return setLocal(this, 1, values); }
    setDate(value) { return setLocal(this, 2, [value]); }
    setHours(...values) { return setLocal(this, 3, values); }
    setMinutes(...values) { return setLocal(this, 4, values); }
    setSeconds(...values) { return setLocal(this, 5, values); }
    setMilliseconds(value) { return setLocal(this, 6, [value]); }
    toString() { return new RealFormat('en-US', { timeZone, dateStyle: 'full', timeStyle: 'long' }).format(this); }
    toDateString() { return new RealFormat('en-US', { timeZone, dateStyle: 'full' }).format(this); }
  }
  const withZone = (options) => ({ ...(options ?? {}), timeZone: options?.timeZone ?? timeZone });
  function ZoneFormat(locales, options) {
    return new RealFormat(locales, withZone(options));
  }
  ZoneFormat.prototype = RealFormat.prototype;
  ZoneFormat.supportedLocalesOf = RealFormat.supportedLocalesOf;
  globalThis.Date = ZoneDate;
  Intl.DateTimeFormat = ZoneFormat;
  for (const name of Object.keys(real)) {
    proto[name] = function (locales, options) { return real[name].call(this, locales, withZone(options)); };
  }
  try {
    return fn();
  } finally {
    globalThis.Date = RealDate;
    Intl.DateTimeFormat = RealFormat;
    Object.assign(proto, real);
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

test('shows the same calendar day on computers in New York and Tokyo', () => {
  const expected = dayText('en-US', '2026-03-01');
  for (const [zone, city] of [['America/New_York', 'New York'], ['Asia/Tokyo', 'Tokyo']]) {
    const shown = withMachineZone(zone, () => scope.formatForDisplay({ ...record(), date: '2026-03-01' }, 'en-US').date);
    expect(shown, `date shown on a computer in ${city}`).toBe(expected);
  }
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
