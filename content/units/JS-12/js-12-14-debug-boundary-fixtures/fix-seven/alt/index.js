// ---- Helpers that already work. Use them; do not change them. ----

// "12,50" → { ok: true, value: 1250 }; see lesson js-12-05.
function parseAmountMinor(text) {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: false, error: "required" };
  const parts = trimmed.replace(",", ".").split(".");
  const whole = parts[0];
  const fraction = parts.length > 1 ? parts[1] : "";
  const digits = (part) => [...part].every((char) => char >= "0" && char <= "9");
  if (parts.length > 2 || whole === "" || !digits(whole) || !digits(fraction)) return { ok: false, error: "not-a-number" };
  if (fraction.length > 2) return { ok: false, error: "too-many-decimals" };
  const value = Number(whole) * 100 + (fraction.length === 1 ? Number(fraction) * 10 : Number(fraction));
  return value === 0 ? { ok: false, error: "not-positive" } : { ok: true, value };
}

// Puts "\" before every character that has a special meaning in a pattern.
function escapeForRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---- Seven functions, seven defects. ----

// 1. Total of typed amounts such as ["1,5", "2,25"], in kopiykas.
function sumAmountsMinor(texts) {
  return texts.map(parseAmountMinor).reduce((total, parsed) => total + (parsed.ok ? parsed.value : 0), 0);
}

// 2. A quantity field: whole numbers 1–99; an empty field is "required".
function readQuantity(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "required" };
  }
  const value = Number(trimmed);
  if (Number.isInteger(value) && value >= 1 && value <= 99) {
    return { ok: true, value };
  }
  return { ok: false, error: "invalid" };
}

// 3. true only for a real, finite number of kopiykas.
function isValidAmount(value) {
  return typeof value === "number" && !Number.isNaN(value) && Math.abs(value) !== Infinity;
}

// 4. true when the text is 1–20 digits. Longer input is refused before matching.
function isDigitsOnly(text) {
  return text.length <= 20 && /^[0-9]+$/.test(text);
}

// 5. How many times the query occurs in the text, ignoring case.
function countMatches(text, query) {
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  let count = 0;
  let from = haystack.indexOf(needle);
  while (needle !== "" && from !== -1) {
    count = count + 1;
    from = haystack.indexOf(needle, from + needle.length);
  }
  return count;
}

// 6. A calendar date "YYYY-MM-DD" shown to a viewer in any time zone.
// A calendar date names the same day for every viewer, so viewerZone is not needed.
function formatDueDay(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", { timeZone: "UTC", dateStyle: "medium" });
}

// 7. Year, month (1–12) and day → "YYYY-MM-DD", or null when there is no such day.
function toCalendarDate(year, month, day) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
    return null;
  }
  return String(year).padStart(4, "0") + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

console.log(sumAmountsMinor(["1,5", "2,25"]), readQuantity(""), isValidAmount(Number("12,50")));
console.log(isDigitsOnly("2026"), countMatches("1.5 or 125", "1.5"));
console.log(formatDueDay("2026-03-01", "America/New_York"), toCalendarDate(2026, 4, 31));
