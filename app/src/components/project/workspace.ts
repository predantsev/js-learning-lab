// Capstone workspace operations: creation from CP-START, files, step checks with provenance,
// recovery snapshots, starters (reference states) and the capstone-step lesson mirror.
// Rules shared with the compiler and tests live in shared/capstone.js.
import { START_BASE, isStepConfirmed, isStepDone, isStepNotPerformed, isStepSkipped, newFileProblem, passCounts, starterChanges, starterCovers } from '@shared/capstone.js';
import { Doc } from '../../lib/persist';
import { emptyLessonProgress } from '../../lib/progress';
import type { CapstoneId, Lang, LessonProgress, ProgressDoc } from '../../lib/types';
import { type WorkspaceBase, type WorkspaceDoc, type WorkspaceSnapshotMeta, type WorkspaceStep, app, createWorkspace, loadWorkspace, updateProfile } from '../../state/app';
import { type Capstone, loadCapstone, referenceFiles } from './content';

const now = (): string => new Date().toISOString();

export interface SnapshotDoc {
  id: string;
  workspaceId: string;
  n: number;
  createdAt: string;
  reason: WorkspaceSnapshotMeta['reason'];
  detail?: string;
  label?: string;
  files: Record<string, string>;
  storage: Record<string, string>;
  base: WorkspaceBase;
  activeFile?: string;
}

/** A write that must be durable before the next step (a recovery snapshot) did not reach the disk. */
export class NotSavedError extends Error {}

export const workspaceLang = (ws: WorkspaceDoc): Lang => ws.lang ?? 'uk';
export const workspaceBase = (ws: WorkspaceDoc): WorkspaceBase => ws.base ?? { ...START_BASE, at: ws.createdAt };
export const snapshotDocId = (workspaceId: string, snapshotId: string): string => `workspaces/${workspaceId}/${snapshotId}`;

/** Create a project from CP-START, localized in the current interface language, and make it active. */
export async function startProject(capstoneId: CapstoneId): Promise<string> {
  const capstone = await loadCapstone(capstoneId);
  const lang = app().profile.value.language;
  const id = await createWorkspace(capstoneId, {
    lang,
    contentVersion: capstone.contentVersion,
    base: { kind: 'start', unit: null, at: now() },
    files: referenceFiles(capstone, null, lang),
    activeFile: capstone.entry,
    steps: {},
    snapshots: [],
    nextSnapshot: 1,
  });
  await syncStepLessons();
  return id;
}

export async function activateWorkspace(id: string): Promise<void> {
  updateProfile({ activeWorkspaceId: id });
  await syncStepLessons();
}

// ---------- files ----------
export function updateFile(doc: Doc<WorkspaceDoc>, path: string, text: string): void {
  doc.update((w) => (w.files[path] === text ? w : { ...w, files: { ...w.files, [path]: text } }));
}
export function setActiveFile(doc: Doc<WorkspaceDoc>, path: string): void {
  doc.update((w) => (w.activeFile === path ? w : { ...w, activeFile: path }));
}
export function addFile(doc: Doc<WorkspaceDoc>, path: string): { code: string } | null {
  const problem = newFileProblem(path, Object.keys(doc.value.files));
  if (problem) return problem;
  doc.update((w) => ({ ...w, files: { ...w.files, [path]: '' }, activeFile: path }));
  return null;
}
export function renameFile(doc: Doc<WorkspaceDoc>, from: string, to: string): { code: string } | null {
  if (from === to) return null;
  const problem = newFileProblem(to, Object.keys(doc.value.files), { except: from });
  if (problem) return problem;
  doc.update((w) => {
    const files: Record<string, string> = {};
    for (const [p, text] of Object.entries(w.files)) files[p === from ? to : p] = text;
    return { ...w, files, activeFile: w.activeFile === from ? to : w.activeFile };
  });
  return null;
}
export function removeFile(doc: Doc<WorkspaceDoc>, path: string, fallback: string): string {
  const text = doc.value.files[path] ?? '';
  doc.update((w) => {
    const { [path]: _removed, ...files } = w.files;
    return { ...w, files, activeFile: w.activeFile === path ? fallback : w.activeFile };
  });
  return text;
}
export function restoreFile(doc: Doc<WorkspaceDoc>, path: string, text: string): void {
  doc.update((w) => (path in w.files ? w : { ...w, files: { ...w.files, [path]: text }, activeFile: path }));
}
export function setStorage(doc: Doc<WorkspaceDoc>, storage: Record<string, string>): void {
  doc.update((w) => (JSON.stringify(w.storage) === JSON.stringify(storage) ? w : { ...w, storage }));
}

// ---------- step state ----------
const stepOf = (ws: WorkspaceDoc, unit: string): WorkspaceStep => ws.steps[unit] ?? { state: 'pending' };
const withStep = (doc: Doc<WorkspaceDoc>, unit: string, change: (s: WorkspaceStep) => WorkspaceStep): void =>
  doc.update((w) => ({ ...w, steps: { ...w.steps, [unit]: change(stepOf(w, unit)) } }));

/**
 * Record a check of `unit`. Only a real pass on files that are the learner's own counts:
 * a pass of a step whose work came from an applied starter is reported but not recorded (REQ-038).
 */
export function recordCheck(doc: Doc<WorkspaceDoc>, capstone: Capstone, unit: string, passed: number, total: number): { counted: boolean; newlyDone: boolean; supplied: boolean } {
  const ws = doc.value;
  const allPassed = total > 0 && passed === total;
  const supplied = allPassed && !passCounts(capstone.steps, workspaceBase(ws), unit);
  const counted = allPassed && !supplied;
  const previous = stepOf(ws, unit);
  const newlyDone = counted && !isStepDone(previous);
  const at = now();
  withStep(doc, unit, (s) => {
    const next: WorkspaceStep = { ...s, attempts: (s.attempts ?? 0) + 1, lastCheck: { at, passed, total, counted } };
    if (!newlyDone) return next;
    return { ...next, state: 'done', source: 'platform-check', checkedAt: at, contentVersion: capstone.contentVersion, assisted: Boolean(s.nudgeAt || s.referenceViewedAt) };
  });
  if (newlyDone) void syncStepLessons();
  return { counted, newlyDone, supplied };
}
export const recordNudge = (doc: Doc<WorkspaceDoc>, unit: string): void => withStep(doc, unit, (s) => (s.nudgeAt ? s : { ...s, nudgeAt: now() }));
export const recordReferenceViewed = (doc: Doc<WorkspaceDoc>, unit: string): void => withStep(doc, unit, (s) => (s.referenceViewedAt || isStepDone(s) ? s : { ...s, referenceViewedAt: now() }));
export const declineStarter = (doc: Doc<WorkspaceDoc>, unit: string): void => withStep(doc, unit, (s) => ({ ...s, starterDeclinedAt: now() }));
export const undoDeclineStarter = (doc: Doc<WorkspaceDoc>, unit: string): void => withStep(doc, unit, ({ starterDeclinedAt: _d, ...s }) => s);

// ---------- local steps (VS Code, terminal, device): confirmed by the learner, never checked ----------
/** The learner says they carried out a local step: self-reported evidence, like a lesson's local task. */
export function confirmLocalStep(doc: Doc<WorkspaceDoc>, unit: string): void {
  const at = now();
  withStep(doc, unit, ({ skippedAt: _s, ...s }) => ({ ...s, state: 'done', source: 'learner-confirmed', confirmedAt: at }));
  void syncStepLessons();
}
/** A native local step without an emulator or a device: "not performed", never done, revisitable. */
export function markStepNotPerformed(doc: Doc<WorkspaceDoc>, unit: string): void {
  const at = now();
  withStep(doc, unit, ({ confirmedAt: _c, ...s }) => ({ ...s, state: 'skipped', source: 'no-native-tooling', skippedAt: at }));
  void syncStepLessons();
}
/** Back to the task: the confirmation or the "not performed" mark is withdrawn. */
export function reopenLocalStep(doc: Doc<WorkspaceDoc>, unit: string): void {
  withStep(doc, unit, ({ confirmedAt: _c, skippedAt: _s, source: _src, ...s }) => ({ ...s, state: 'pending' }));
  void syncStepLessons();
}

// ---------- snapshots ----------
/** Save the current files as a snapshot document and wait until it is durably written. */
export async function createSnapshot(doc: Doc<WorkspaceDoc>, reason: SnapshotDoc['reason'], detail?: string, label?: string): Promise<WorkspaceSnapshotMeta> {
  const ws = doc.value;
  let n = Math.max(ws.nextSnapshot ?? 1, ...(ws.snapshots ?? []).map((s) => s.n + 1));
  for (let attempt = 0; attempt < 20; attempt += 1, n += 1) {
    const id = `snap-${n}`;
    const createdAt = now();
    const data: SnapshotDoc = { id, workspaceId: ws.id, n, createdAt, reason, ...(detail ? { detail } : {}), ...(label ? { label } : {}), files: ws.files, storage: ws.storage, base: workspaceBase(ws), activeFile: ws.activeFile };
    const snap = await Doc.load<SnapshotDoc>(snapshotDocId(ws.id, id), () => data);
    if (snap.value.createdAt !== createdAt) continue; // this number is already taken on disk (another tab)
    snap.update((s) => ({ ...s }));
    await snap.flush();
    if (snap.state !== 'saved') throw new NotSavedError(`snapshot ${id} was not saved`);
    const meta: WorkspaceSnapshotMeta = { id, n, createdAt, reason, ...(detail ? { detail } : {}), ...(label ? { label } : {}), fileCount: Object.keys(ws.files).length };
    doc.update((w) => ({ ...w, snapshots: [...(w.snapshots ?? []), meta], nextSnapshot: n + 1 }));
    await doc.flush();
    return meta;
  }
  throw new NotSavedError('no free snapshot number');
}

/** Restore a snapshot; the current state is saved as a new snapshot first, so nothing is lost. */
export async function restoreSnapshot(doc: Doc<WorkspaceDoc>, meta: WorkspaceSnapshotMeta): Promise<{ backup: WorkspaceSnapshotMeta }> {
  const ws = doc.value;
  const snap = await Doc.load<SnapshotDoc>(snapshotDocId(ws.id, meta.id), () => { throw new Error(`snapshot ${meta.id} is missing`); });
  const backup = await createSnapshot(doc, 'before-restore', String(meta.n));
  const restored = snap.value;
  doc.update((w) => ({ ...w, files: restored.files, storage: restored.storage, base: restored.base, activeFile: restored.activeFile && restored.activeFile in restored.files ? restored.activeFile : w.activeFile }));
  await doc.flush();
  return { backup };
}

// ---------- starters (reference states) ----------
/**
 * Apply the reference after `through` (null = CP-START) to the platform copy of the project:
 * snapshot first (durably), then overlay the reference files (other learner files stay), move the
 * base and mark the covered steps "skipped (starter)" — never "done" (REQ-003, CURRICULUM.md).
 */
export async function applyStarter(doc: Doc<WorkspaceDoc>, capstone: Capstone, through: string | null): Promise<{ snapshot: WorkspaceSnapshotMeta; covers: string[] }> {
  const ws = doc.value;
  const reference = referenceFiles(capstone, through, workspaceLang(ws));
  if (Object.keys(reference).length === 0) throw new Error(`no reference for ${through ?? 'CP-START'}`);
  const covers = starterCovers(capstone.steps, ws.steps, through);
  const snapshot = await createSnapshot(doc, 'before-starter', through ?? 'CP-START');
  const at = now();
  doc.update((w) => ({
    ...w,
    files: starterChanges(w.files, reference).files,
    base: { kind: through === null ? 'start' : 'starter', unit: through, at },
    steps: { ...w.steps, ...Object.fromEntries(covers.map((unit) => [unit, { ...stepOf(w, unit), state: 'skipped' as const, source: 'starter' as const, skippedAt: at }])) },
  }));
  await doc.flush();
  await syncStepLessons();
  return { snapshot, covers };
}

// ---------- export ----------
export function recordExport(doc: Doc<WorkspaceDoc>, entry: { kind: 'zip' | 'folder'; path?: string; fileCount: number }): void {
  const at = now();
  doc.update((w) => ({ ...w, exportedAt: at, exports: [...(w.exports ?? []), { at, ...entry }] }));
}

// ---------- capstone-step lessons follow the active project ----------
/** Lessons of kind capstone-step and the unit of their step (from the course index). */
export function stepLessons(): { id: string; unit: string }[] {
  return app().index.stages.flatMap((s) => s.units).flatMap((u) => u.lessons.filter((l) => l.kind === 'capstone-step' && l.authored).map((l) => ({ id: l.id, unit: u.id })));
}

/**
 * Mirror one step into its lesson: completed only after a real check or, for a local step, the
 * learner's confirmation; a starter and a native step "not performed" show as skipped.
 */
export function mirrorStepLesson(doc: ProgressDoc, lesson: { id: string; unit: string }, ws: WorkspaceDoc | null): ProgressDoc {
  const record = ws?.steps[lesson.unit];
  type Mirrored = NonNullable<LessonProgress['project']>['state'];
  const state: Mirrored = isStepDone(record) ? 'done' : isStepConfirmed(record) ? 'confirmed' : isStepNotPerformed(record) ? 'not-performed' : isStepSkipped(record) ? 'skipped' : 'pending';
  const at = (state === 'done' ? record?.checkedAt : state === 'confirmed' ? record?.confirmedAt : state === 'skipped' || state === 'not-performed' ? record?.skippedAt : undefined) ?? now();
  const project = { workspaceId: ws?.id ?? null, state, at };
  const existing = doc.lessons[lesson.id];
  let next: LessonProgress;
  if (!existing) {
    if (state === 'pending') return doc; // never opened and nothing to show: stays unseen
    next = { ...emptyLessonProgress(1), project };
  } else {
    if (existing.project?.state === state && existing.project.workspaceId === project.workspaceId) return doc;
    next = { ...existing, project };
  }
  const wasMirroredSkip = existing?.project?.state === 'skipped' || existing?.project?.state === 'not-performed';
  if (state === 'done' || state === 'confirmed') next = { ...next, state: 'completed', completedAt: at, skippedAt: undefined };
  else if (state === 'skipped' || state === 'not-performed') next = { ...next, state: 'skipped', skippedAt: at, completedAt: undefined };
  else if (next.state === 'completed' || (next.state === 'skipped' && wasMirroredSkip)) next = { ...next, state: 'in-progress', completedAt: undefined, skippedAt: undefined };
  return { ...doc, lessons: { ...doc.lessons, [lesson.id]: next } };
}

export async function syncStepLessons(): Promise<void> {
  const lessons = stepLessons();
  if (lessons.length === 0) return;
  const activeId = app().profile.value.activeWorkspaceId;
  let ws: WorkspaceDoc | null = null;
  if (activeId) {
    try {
      ws = (await loadWorkspace(activeId)).value;
    } catch {
      ws = null;
    }
  }
  app().progress.update((p) => lessons.reduce((acc, lesson) => mirrorStepLesson(acc, lesson, ws), p));
}
