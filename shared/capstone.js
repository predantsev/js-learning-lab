// Capstone project rules shared by the platform UI, the content compiler/validator and tests.
// Pure functions, no I/O: safe project paths, step order and provenance, the starter (reference)
// plan and readable diffs. Background: docs/CURRICULUM.md "Checkpoints and dependency bypass",
// content/capstones/README.md.
import { createTwoFilesPatch, diffLines } from 'diff';

export const CAPSTONE_IDS = ['wishlist', 'planner', 'habits', 'expenses'];

// ---------- safe project paths ----------
// Same rules as the folder export (server/api/lib/project-files.mjs), so the editor never accepts a
// name that the export would reject later: exports are opened in VS Code on macOS, Linux and Windows.
const FORBIDDEN_CHARS = /[\u0000-\u001f\u007f<>:"|?*\\]/;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
export const MAX_PATH_LENGTH = 240;
/** Extensions of files a learner may create in the platform (text files only). */
export const TEXT_FILE_EXTENSIONS = ['html', 'css', 'js', 'mjs', 'jsx', 'ts', 'tsx', 'json', 'md', 'txt', 'svg', 'csv', 'xml'];
/** Paths the export writes itself; learner files may not use them. */
export const RESERVED_PATHS = ['jsll-manifest.json'];

/**
 * Why `p` is not a safe relative project path, or null when it is.
 * @returns {null | { code: string, segment?: string }}
 */
export function pathProblem(p) {
  if (typeof p !== 'string' || p.length === 0) return { code: 'empty' };
  if (p.length > MAX_PATH_LENGTH) return { code: 'too-long' };
  if (FORBIDDEN_CHARS.test(p)) return { code: 'bad-char' };
  if (p.startsWith('/')) return { code: 'absolute' };
  for (const segment of p.split('/')) {
    if (segment === '') return { code: 'empty-segment' };
    if (segment === '.' || segment === '..') return { code: 'dot-segment' };
    if (/[. ]$/.test(segment) || segment.startsWith(' ')) return { code: 'edge-char', segment };
    if (WINDOWS_RESERVED.test(segment)) return { code: 'reserved', segment };
    if (segment.toLowerCase() === '.git') return { code: 'git' };
  }
  return null;
}

/** Folders that contain `p` ("a/b/c.js" → ["a", "a/b"]). */
const parentFolders = (p) => p.split('/').slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join('/'));

/**
 * Problem with creating (or renaming another file to) `p` next to `existing` paths, or null.
 * `except` is the current name of a file being renamed.
 * @param {string} p
 * @param {string[]} existing
 * @param {{ except?: string | null }} [options]
 * @returns {null | { code: string, segment?: string }}
 */
export function newFileProblem(p, existing, { except = null } = {}) {
  const basic = pathProblem(p);
  if (basic) return basic;
  const others = existing.filter((x) => x !== except);
  const lower = p.toLowerCase();
  if (RESERVED_PATHS.includes(lower)) return { code: 'reserved-name' };
  if (others.includes(p)) return { code: 'exists' };
  if (others.some((x) => x.toLowerCase() === lower)) return { code: 'case-collision' };
  const othersLower = new Set(others.map((x) => x.toLowerCase()));
  if (parentFolders(lower).some((folder) => othersLower.has(folder)) || others.some((x) => parentFolders(x.toLowerCase()).includes(lower))) return { code: 'folder-conflict' };
  const name = p.slice(p.lastIndexOf('/') + 1);
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
  if (name !== '.gitignore' && !TEXT_FILE_EXTENSIONS.includes(ext)) return { code: 'extension' };
  return null;
}

/** Problem with a whole file map (export safety), or null. */
export function filesProblem(files) {
  const seen = new Map();
  for (const p of Object.keys(files)) {
    const problem = pathProblem(p);
    if (problem) return { ...problem, path: p };
    const key = p.toLowerCase();
    if (seen.has(key)) return { code: 'case-collision', path: p };
    seen.set(key, p);
  }
  for (const key of seen.keys()) for (const folder of parentFolders(key)) if (seen.has(folder)) return { code: 'folder-conflict', path: seen.get(folder) };
  return null;
}

/** Files in display order: the entry first, then folders after top-level files, alphabetically. */
export function sortPaths(paths, entry = 'index.html') {
  return [...paths].sort((a, b) => {
    if (a === entry) return -1;
    if (b === entry) return 1;
    const da = a.includes('/') ? 1 : 0;
    const db = b.includes('/') ? 1 : 0;
    return da !== db ? da - db : a.localeCompare(b);
  });
}

// ---------- steps and provenance ----------
// A step record lives in the workspace document under steps[<UNIT>]:
//   { state: 'done', source: 'platform-check', checkedAt }  — a real check passed on the learner's files
//   { state: 'skipped', source: 'starter', skippedAt }      — the reference state was supplied instead
//   { state: 'done', source: 'learner-confirmed', confirmedAt }   — a local step (VS Code, terminal,
//                                                             device) the learner says they carried out;
//                                                             the platform saw nothing (never "checked")
//   { state: 'skipped', source: 'no-native-tooling', skippedAt }  — a native local step not performed:
//                                                             no emulator or device (revisitable)
//   { state: 'pending' } or no record                         — not done yet
// The workspace "base" records what the platform last put into the files: CP-START at creation
// ({ kind: 'start', unit: null }) or the reference after a step ({ kind: 'starter', unit }).

export const START_BASE = Object.freeze({ kind: 'start', unit: null });

export const stepIndex = (steps, unit) => steps.findIndex((s) => s.unit === unit);
export const isStepDone = (record) => record?.state === 'done' && record.source === 'platform-check';
export const isStepSkipped = (record) => record?.state === 'skipped';
/** A local step the learner confirmed (self-reported, like a lesson's local task). */
export const isStepConfirmed = (record) => record?.state === 'done' && record.source === 'learner-confirmed';
/** A native local step marked "not performed" for lack of an emulator or a device. */
export const isStepNotPerformed = (record) => record?.state === 'skipped' && record.source === 'no-native-tooling';

/** Local steps of the React Native stage are carried out on an emulator or a device. */
export const stepNeedsDevice = (step) => step?.mode === 'local' && String(step.unit ?? '').startsWith('RN-');

/**
 * The step to show first: the first step, local ones included, that has no final record yet
 * (checked, reference applied, confirmed or not performed), or null when every step has one.
 */
export function nextOpenStep(steps, records) {
  return steps.find((s) => !isStepDone(records[s.unit]) && !isStepSkipped(records[s.unit]) && !isStepConfirmed(records[s.unit]))?.unit ?? null;
}

/** True when the base files already contain the work of `unit` (supplied by a starter, not authored). */
export function coveredByBase(steps, base, unit) {
  if (!base || base.kind !== 'starter' || base.unit === null) return false;
  const b = stepIndex(steps, base.unit);
  const i = stepIndex(steps, unit);
  return b >= 0 && i >= 0 && i <= b;
}

/** A passing check is the learner's own evidence only for steps after the base (REQ-038). */
export const passCounts = (steps, base, unit) => !coveredByBase(steps, base, unit);

/** Earlier in-platform steps that are neither checked nor covered by a starter. */
export function missingBefore(steps, records, unit) {
  const i = stepIndex(steps, unit);
  if (i <= 0) return [];
  return steps.slice(0, i).filter((s) => s.mode === 'in-platform' && !isStepDone(records[s.unit]) && !isStepSkipped(records[s.unit])).map((s) => s.unit);
}

/** The step whose reference is the starting state of `unit` (previous in-platform step), or null for CP-START. */
export function startingReference(steps, unit) {
  const i = stepIndex(steps, unit);
  for (let j = i - 1; j >= 0; j -= 1) if (steps[j].mode === 'in-platform') return steps[j].unit;
  return null;
}

/** The step a learner should work on: the first in-platform step that is neither done nor skipped. */
export function currentStep(steps, records) {
  return steps.find((s) => s.mode === 'in-platform' && !isStepDone(records[s.unit]) && !isStepSkipped(records[s.unit]))?.unit ?? null;
}

/**
 * Applying the reference after `through` (null = CP-START): the in-platform steps up to and including
 * `through` that are not done become "skipped (starter)". Done steps keep their real evidence.
 * @returns {string[]}
 */
export function starterCovers(steps, records, through) {
  if (through === null) return [];
  const last = stepIndex(steps, through);
  return steps.slice(0, last + 1).filter((s) => s.mode === 'in-platform' && !isStepDone(records[s.unit])).map((s) => s.unit);
}

/**
 * File changes when a reference is applied over the learner's files: reference files are added or
 * replace learner files with the same path; other learner files are kept untouched.
 * @returns {{ files: Record<string,string>, changes: { path: string, kind: 'added'|'modified'|'unchanged'|'kept', before?: string, after?: string }[] }}
 */
export function starterChanges(current, reference) {
  const changes = [];
  for (const [path, after] of Object.entries(reference)) {
    if (!Object.prototype.hasOwnProperty.call(current, path)) changes.push({ path, kind: 'added', after });
    else if (current[path] !== after) changes.push({ path, kind: 'modified', before: current[path], after });
    else changes.push({ path, kind: 'unchanged' });
  }
  for (const path of Object.keys(current)) if (!Object.prototype.hasOwnProperty.call(reference, path)) changes.push({ path, kind: 'kept' });
  const order = { modified: 0, added: 1, kept: 2, unchanged: 3 };
  changes.sort((a, b) => order[a.kind] - order[b.kind] || a.path.localeCompare(b.path));
  return { files: { ...current, ...reference }, changes };
}

// ---------- diffs ----------
/** Lines of a readable line diff: [{ kind: 'add' | 'del' | 'same', text }]. */
export function lineDiff(before, after) {
  const out = [];
  for (const part of diffLines(before ?? '', after ?? '')) {
    const kind = part.added ? 'add' : part.removed ? 'del' : 'same';
    const lines = part.value.replace(/\n$/, '').split('\n');
    for (const text of lines) out.push({ kind, text });
  }
  return out;
}

/** Unified diff between two file sets (for CHANGES.md and downloads); identical files are omitted. */
export function unifiedDiff(before, after, { fromLabel = 'a', toLabel = 'b' } = {}) {
  const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  const parts = [];
  for (const path of paths) {
    const a = before[path];
    const b = after[path];
    if (a === b) continue;
    parts.push(createTwoFilesPatch(a === undefined ? '/dev/null' : `${fromLabel}/${path}`, b === undefined ? '/dev/null' : `${toLabel}/${path}`, a ?? '', b ?? '', '', '', { context: 3 }).replace(/^=+\n/m, ''));
  }
  return parts.join('\n');
}

/** Which files differ between two file sets: { added, removed, modified } path lists. */
export function changedPaths(before, after) {
  const added = Object.keys(after).filter((p) => !(p in before)).sort();
  const removed = Object.keys(before).filter((p) => !(p in after)).sort();
  const modified = Object.keys(after).filter((p) => p in before && before[p] !== after[p]).sort();
  return { added, removed, modified };
}
