// Display helpers (read-only). Amounts stay integers in minor units; formatting is for display only.
// Category names are stored in both languages; the LOCALE setting picks one.
const CATEGORY_NAMES = {
  food: { uk: 'Їжа', en: 'Food' },
  transport: { uk: 'Транспорт', en: 'Transport' },
  home: { uk: 'Дім', en: 'Home' },
  fun: { uk: 'Розваги', en: 'Fun' },
};
const TOTAL = { uk: 'Разом', en: 'Total' };

function formatMinor(amountMinor, locale) {
  const text = (amountMinor / 100).toFixed(2);
  return locale === 'uk' ? `${text.replace('.', ',')} грн` : `UAH ${text}`;
}

// One line of the summary: "Food: UAH 1056.00".
export function formatLine(categoryId, amountMinor, locale) {
  const name = CATEGORY_NAMES[categoryId]?.[locale] ?? categoryId;
  return `${name}: ${formatMinor(amountMinor, locale)}`;
}

// The last line of the summary: "Total: UAH 2155.90".
export function formatTotal(amountMinor, locale) {
  return `${TOTAL[locale]}: ${formatMinor(amountMinor, locale)}`;
}
