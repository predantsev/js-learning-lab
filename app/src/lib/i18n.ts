// UI localization. Ukrainian is the default; switching never touches learner code or progress.
import { en } from '../i18n/en';
import { uk, type Dict } from '../i18n/uk';
import type { L10n, Lang } from './types';

export type Key = keyof Dict;
const dictionaries: Record<Lang, Dict> = { uk, en };

export function translate(lang: Lang, key: Key, params?: Record<string, string | number>): string {
  let text: string = dictionaries[lang][key] ?? dictionaries.uk[key] ?? key;
  if (params) for (const [name, value] of Object.entries(params)) text = text.split(`{${name}}`).join(String(value));
  return text;
}

export const pick = (value: L10n | null | undefined, lang: Lang): string => (value ? value[lang] ?? value.uk ?? '' : '');
export const otherLang = (lang: Lang): Lang => (lang === 'uk' ? 'en' : 'uk');
export const formatDate = (iso: string, lang: Lang): string => new Intl.DateTimeFormat(lang === 'uk' ? 'uk-UA' : 'en-GB', { dateStyle: 'medium' }).format(new Date(iso));
