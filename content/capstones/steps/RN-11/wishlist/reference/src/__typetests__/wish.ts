// Type tests: `npx tsc --noEmit` checks this file, nothing runs it. Every `@ts-expect-error` must meet a
// real type error on the next line; when the type stops refusing it, tsc reports the unused directive.
import type { Wish } from '../../domain/wishes.ts';

export const valid: Wish = { id: 'w-01', name: 'Headphones', price: 80, acquired: false, category: null };

// @ts-expect-error a price is a number or null, never text
export const textPrice: Wish = { id: 'w-01', name: 'Headphones', price: '80', acquired: false, category: null };

// @ts-expect-error a wish always says whether it is acquired
export const noAcquired: Wish = { id: 'w-01', name: 'Headphones', price: 80, category: null };
