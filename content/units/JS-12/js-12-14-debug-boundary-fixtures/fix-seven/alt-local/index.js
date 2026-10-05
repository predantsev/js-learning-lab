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
  let total = 0;
  for (const text of texts) {
    const parsed = parseAmountMinor(text);
    if (!parsed.ok) {
      return null;
    }
    total = total + parsed.value;
  }
  return total;
}

// 2. A quantity field: whole numbers 1–99; an empty field is "required".
function readQuantity(text) {
  if (text.trim() === "") {
    return { ok: false, error: "required" };
  }
  const value = Number(text);
  if (!Number.isInteger(value) || value < 1 || value > 99) {
    return { ok: false, error: "invalid" };
  }
  return { ok: true, value };
}

// 3. true only for a real, finite number of kopiykas.
function isValidAmount(value) {
  return Number.isFinite(value);
}

// 4. true when the text is 1–20 digits. Longer input is refused before matching.
function isDigitsOnly(text) {
  if (text.length > 20) {
    return false;
  }
  return /^\d+$/.test(text);
}

// 5. How many times the query occurs in the text, ignoring case.
function countMatches(text, query) {
  return [...text.matchAll(new RegExp(escapeForRegex(query), "gi"))].length;
}

// 6. A calendar date "YYYY-MM-DD" shown to a viewer in any time zone.
function formatDueDay(date, viewerZone) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", dateStyle: "medium" }).format(new Date(date));
}

// 7. Year, month (1–12) and day → "YYYY-MM-DD", or null when there is no such day.
function toCalendarDate(year, month, day) {
  // Local time on both sides: build local midnight and read the local fields back.
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + mm + "-" + dd;
}

console.log(sumAmountsMinor(["1,5", "2,25"]), readQuantity(""), isValidAmount(Number("12,50")));
console.log(isDigitsOnly("2026"), countMatches("1.5 or 125", "1.5"));
console.log(formatDueDay("2026-03-01", "America/New_York"), toCalendarDate(2026, 4, 31));
