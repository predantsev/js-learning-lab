// Incremental validation (`validate.mjs --since <git-ref>`): which lessons, blocks and capstone steps
// changed since a git ref. Committed, staged, unstaged and untracked files all count, so a lesson an
// author has not committed yet is selected too.
import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Files outside the content tree that change how content executes or compiles: a change there may
// affect any lesson, so the selection falls back to everything.
const PLATFORM_PATHS = /^(sandbox|shared|server|scripts\/content|app\/src\/harness)/;

const git = (cwd, args) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.error || r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || r.error?.message || '').trim()}`);
  return r.stdout.split('\n').filter(Boolean);
};

/** Repository-relative paths changed since `ref` (committed or not) plus untracked files. */
export function changedFilesSince(ref, cwd) {
  const top = git(cwd, ['rev-parse', '--show-toplevel'])[0];
  if (spawnSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { cwd: top }).status !== 0) throw new Error(`"${ref}" is not a commit in this repository (a branch, tag, commit or HEAD~N)`);
  const changed = git(top, ['diff', '--name-only', ref, '--']);
  const untracked = git(top, ['ls-files', '--others', '--exclude-standard']);
  return { top, files: [...new Set([...changed, ...untracked])].sort() };
}

/**
 * Turn changed paths into a selection.
 *   files       repository-relative paths
 *   contentRel  the content root relative to the repository (normally "content")
 *   lessons     Map<lessonId, { source }> of the loaded lessons
 *   stepUnits   capstone step units in teaching order (a step's "state before" is the previous step)
 * Returns { all: true, reason } when platform files changed, otherwise
 * { lessons: Map<lessonId, Set<blockId> | null>, stepUnits: Set<unit>, other: string[] } where null
 * means "the whole lesson" (lesson.yaml or a file outside the block folders changed).
 */
export function selectionFromChanges(files, { contentRel = 'content', lessons, stepUnits = [] }) {
  const platform = files.filter((f) => PLATFORM_PATHS.test(f));
  if (platform.length > 0) return { all: true, reason: `platform files changed: ${platform.slice(0, 3).join(', ')}${platform.length > 3 ? ` and ${platform.length - 3} more` : ''}` };
  const prefix = `${contentRel.split(path.sep).join('/').replace(/\/$/, '')}/`;
  const selected = new Map();
  const steps = new Set();
  const other = [];
  let allSteps = false;
  for (const file of files) {
    if (!file.startsWith(prefix)) continue;
    const rel = file.slice(prefix.length);
    const unitMatch = /^units\/([A-Z]{2}-\d{2})\/([^/]+)\/(.+)$/.exec(rel);
    if (unitMatch) {
      const [, , lessonId, inLesson] = unitMatch;
      const lesson = lessons.get(lessonId);
      if (!lesson) continue; // deleted or not a lesson folder
      if (selected.has(lessonId) && selected.get(lessonId) === null) continue;
      const block = (lesson.source?.blocks ?? []).find((b) => typeof b?.dir === 'string' && (inLesson === b.dir || inLesson.startsWith(`${b.dir.replace(/\/$/, '')}/`)) && (b.kind === 'example' || b.kind === 'exercise'));
      if (inLesson === 'lesson.yaml' || !block) selected.set(lessonId, null);
      else selected.set(lessonId, new Set([...(selected.get(lessonId) ?? []), block.id]));
      continue;
    }
    const stepMatch = /^capstones\/steps\/([A-Z]{2}-\d{2})\//.exec(rel);
    if (stepMatch) {
      steps.add(stepMatch[1]);
      // The next step starts from this step's reference: its "state before" changed too.
      const next = stepUnits[stepUnits.indexOf(stepMatch[1]) + 1];
      if (stepUnits.includes(stepMatch[1]) && next) steps.add(next);
      continue;
    }
    if (/^capstones\//.test(rel) && !rel.endsWith('.md')) allSteps = true; // the start project or the domains
    else other.push(rel);
  }
  return { lessons: selected, stepUnits: allSteps ? new Set(stepUnits) : steps, other };
}
