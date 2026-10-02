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

test('display dates are the same calendar day in New York and Tokyo', () => {
  const expected = day('en-US', '2026-03-01');
  for (const [zone, city] of [['America/New_York', 'New York'], ['Asia/Tokyo', 'Tokyo']]) {
    const shown = withMachineZone(zone, () => scope.summarize(fixtures(), 'en-US').display);
    expect(shown[0].date, `date of e-01 on a computer in ${city}`).toBe(expected);
  }
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
