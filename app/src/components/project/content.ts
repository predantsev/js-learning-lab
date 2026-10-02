// Compiled capstone content (dist/content/capstones/<id>.json, built by scripts/content/capstones.mjs).
import { localizeFiles } from '@shared/exercise.js';
import { ContentError } from '../../lib/content';
import type { CapstoneId, Capabilities, FeedbackRule, L10n, Lang } from '../../lib/types';

export interface CapstoneStep {
  unit: string;
  mode: 'in-platform' | 'local';
  lesson: string | null;
  title: L10n;
  intro: L10n;
  entry: string;
  runtime: 'browser-js';
  capabilities: Capabilities;
  /** HTML; %%key%% placeholders are resolved with the workspace language (resolveText). */
  instructions: L10n;
  instructionsMd: L10n | null;
  nudge: L10n | null;
  testTitles: Record<string, L10n>;
  feedback: FeedbackRule[];
  tests: string | null;
  /** Cumulative strings: CP-START plus every step up to this one. */
  strings: Record<string, L10n>;
  /** The complete project after the step (raw, with %%key%% placeholders), or null. */
  reference: Record<string, string> | null;
}
export interface Capstone {
  id: CapstoneId;
  title: L10n;
  pitch: L10n;
  entry: string;
  contentVersion: string;
  start: { files: Record<string, string>; strings: Record<string, L10n> };
  steps: CapstoneStep[];
}

const cache = new Map<CapstoneId, Promise<Capstone>>();
export function loadCapstone(id: CapstoneId): Promise<Capstone> {
  let cached = cache.get(id);
  if (!cached) {
    cached = (async () => {
      let response: Response;
      try {
        response = await fetch(`/content/capstones/${encodeURIComponent(id)}.json`, { cache: 'no-cache' });
      } catch (error) {
        throw new ContentError('unreachable', `capstone ${id}`, error instanceof Error ? error.message : 'network error');
      }
      if (response.status === 404) throw new ContentError('missing', `capstone ${id}`, `capstone ${id} was not found`);
      if (!response.ok) throw new ContentError('unreachable', `capstone ${id}`, `HTTP ${response.status}`);
      try {
        return (await response.json()) as Capstone;
      } catch {
        throw new ContentError('corrupt', `capstone ${id}`, `capstone ${id} is not valid JSON`);
      }
    })();
    cached.catch(() => cache.delete(id));
    cache.set(id, cached);
  }
  return cached;
}

/** All strings known to the capstone (CP-START + every step), for files that came from any reference. */
export const allStrings = (capstone: Capstone): Record<string, L10n> => capstone.steps.reduce((acc, s) => ({ ...acc, ...s.strings }), { ...capstone.start.strings });

/** Files of CP-START (`unit` null) or of a step reference, with authored UI text in `lang`. */
export function referenceFiles(capstone: Capstone, unit: string | null, lang: Lang): Record<string, string> {
  if (unit === null) return localizeFiles(capstone.start.files, { strings: capstone.start.strings }, lang) as Record<string, string>;
  const step = capstone.steps.find((s) => s.unit === unit);
  if (!step?.reference) return {};
  return localizeFiles(step.reference, { strings: step.strings }, lang) as Record<string, string>;
}

/** References available for download/diff: CP-START, then every step that has one, in order. */
export function referenceList(capstone: Capstone): { unit: string | null; step: CapstoneStep | null }[] {
  return [{ unit: null, step: null }, ...capstone.steps.filter((s) => s.reference).map((s) => ({ unit: s.unit, step: s }))];
}

const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PLACEHOLDER = /%%([a-zA-Z][a-zA-Z0-9_]*)%%/g;

/**
 * Resolve %%key%% in compiled (trusted) HTML with the strings in the *workspace* language: the text
 * the learner is asked to type is the text the checks expect, whatever the interface language.
 */
export function resolveHtml(html: string, strings: Record<string, L10n>, lang: Lang): string {
  return html.replace(PLACEHOLDER, (match, key: string) => (strings[key] ? escapeHtml(strings[key][lang] ?? strings[key].uk) : match));
}
export function resolveText(text: string, strings: Record<string, L10n>, lang: Lang): string {
  return text.replace(PLACEHOLDER, (match, key: string) => (strings[key] ? strings[key][lang] ?? strings[key].uk : match));
}
