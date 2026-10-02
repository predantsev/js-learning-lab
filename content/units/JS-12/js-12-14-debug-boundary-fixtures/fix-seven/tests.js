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

test('1. typed amounts with a comma add up exactly', () => {
  expect(scope.sumAmountsMinor(['1,5', '2,25']), 'sumAmountsMinor(["1,5", "2,25"])').toBe(375);
  expect(scope.sumAmountsMinor(['845,50', '0,29']), 'sumAmountsMinor(["845,50", "0,29"])').toBe(84579);
  expect(scope.sumAmountsMinor([]), 'sumAmountsMinor([])').toBe(0);
});

test('2. an empty quantity is "required", not zero', () => {
  expect(scope.readQuantity(''), 'readQuantity("")').toEqual({ ok: false, error: 'required' });
  expect(scope.readQuantity('   '), 'readQuantity("   ")').toEqual({ ok: false, error: 'required' });
  expect(scope.readQuantity('0'), 'readQuantity("0")').toEqual({ ok: false, error: 'invalid' });
  expect(scope.readQuantity('12'), 'readQuantity("12")').toEqual({ ok: true, value: 12 });
});

test('3. NaN and Infinity are not valid amounts', () => {
  expect(scope.isValidAmount(Number('12,50')), 'isValidAmount(Number("12,50"))').toBe(false);
  expect(scope.isValidAmount(1 / 0), 'isValidAmount(1 / 0)').toBe(false);
  expect(scope.isValidAmount(1250), 'isValidAmount(1250)').toBe(true);
});

test('4. digits-only refuses input longer than 20 characters', () => {
  expect(scope.isDigitsOnly('2026'), 'isDigitsOnly("2026")').toBe(true);
  expect(scope.isDigitsOnly('12a4'), 'isDigitsOnly("12a4")').toBe(false);
  expect(scope.isDigitsOnly('1'.repeat(20)), 'isDigitsOnly(20 digits)').toBe(true);
  expect(scope.isDigitsOnly('1'.repeat(21)), 'isDigitsOnly(21 digits)').toBe(false);
  expect(scope.isDigitsOnly('1'.repeat(20) + 'x'), 'isDigitsOnly(20 digits + "x")').toBe(false);
});

test('5. the query is searched as plain text', () => {
  expect(scope.countMatches('1.5 or 125', '1.5'), 'countMatches("1.5 or 125", "1.5")').toBe(1);
  expect(scope.countMatches('C++ and c++', 'c++'), 'countMatches("C++ and c++", "c++")').toBe(2);
});

test('6. a calendar date shows the same day in New York', () => {
  const expected = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', dateStyle: 'medium' }).format(new Date('2026-03-01'));
  expect(scope.formatDueDay('2026-03-01', 'America/New_York'), 'formatDueDay in New York').toBe(expected);
  expect(scope.formatDueDay('2026-03-01', 'Asia/Tokyo'), 'formatDueDay in Tokyo').toBe(expected);
});

test('7. calendar dates use months 1–12 and refuse days that do not exist', () => {
  expect(scope.toCalendarDate(2026, 3, 1), 'toCalendarDate(2026, 3, 1)').toBe('2026-03-01');
  expect(scope.toCalendarDate(2026, 12, 31), 'toCalendarDate(2026, 12, 31)').toBe('2026-12-31');
  expect(scope.toCalendarDate(2028, 2, 29), 'toCalendarDate(2028, 2, 29)').toBe('2028-02-29');
  expect(scope.toCalendarDate(2026, 4, 31), 'toCalendarDate(2026, 4, 31)').toBeNull();
  expect(scope.toCalendarDate(2026, 2, 29), 'toCalendarDate(2026, 2, 29)').toBeNull();
  for (const [zone, shown] of [['Etc/GMT-14', 'UTC+14'], ['Etc/GMT+11', 'UTC−11']]) {
    const results = withMachineZone(zone, () => [scope.toCalendarDate(2026, 3, 1), scope.toCalendarDate(2026, 4, 31)]);
    expect(results, `toCalendarDate(2026, 3, 1) and (2026, 4, 31) on a computer in ${shown}`).toEqual(['2026-03-01', null]);
  }
});
