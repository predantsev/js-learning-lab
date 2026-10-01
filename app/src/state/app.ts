// Application state: content, learner documents and derived helpers shared by all screens.
import { useCallback } from 'react';
import { type Bootstrap, api } from '../lib/api';
import { type LessonRef, flattenLessons, loadGlossary, loadIndex } from '../lib/content';
import { type Key, translate } from '../lib/i18n';
import { Doc } from '../lib/persist';
import { Store, useStore } from '../lib/store';
import type { BookmarksDoc, CapstoneId, ContentIndex, DraftsDoc, GlossaryTerm, Lang, Profile, ProgressDoc, ReviewDoc, StyleId } from '../lib/types';

export const STYLE_IDS: StyleId[] = ['calm-studio', 'editorial', 'dev-workspace'];
export const DEFAULT_STYLE: StyleId = 'calm-studio';

/**
 * Step state with provenance (REQ-003, REQ-033, REQ-038): 'done' only with source 'platform-check'
 * after a real check of the learner's files; 'skipped' with source 'starter' when the reference
 * state was supplied instead. See shared/capstone.js.
 */
export interface WorkspaceStep {
  state: 'done' | 'pending' | 'skipped';
  source?: 'platform-check' | 'learner-confirmed' | 'starter';
  checkedAt?: string;
  skippedAt?: string;
  attempts?: number;
  lastCheck?: { at: string; passed: number; total: number; counted: boolean };
  assisted?: boolean;
  nudgeAt?: string;
  referenceViewedAt?: string;
  starterDeclinedAt?: string;
  contentVersion?: string;
}
/** What the platform last put into the files: CP-START at creation, or the reference after `unit`. */
export interface WorkspaceBase { kind: 'start' | 'starter'; unit: string | null; at: string }
export interface WorkspaceSnapshotMeta { id: string; n: number; createdAt: string; reason: 'manual' | 'before-starter' | 'before-restore'; detail?: string; label?: string; fileCount: number }
export interface WorkspaceDoc {
  id: string;
  capstoneId: CapstoneId;
  createdAt: string;
  /** Language of the authored UI text in the files; fixed at creation (files are never rewritten). */
  lang?: Lang;
  contentVersion?: string;
  base?: WorkspaceBase;
  files: Record<string, string>;
  storage: Record<string, string>;
  activeFile?: string;
  steps: Record<string, WorkspaceStep>;
  snapshots?: WorkspaceSnapshotMeta[];
  nextSnapshot?: number;
  exportedAt?: string;
  exports?: { at: string; kind: 'zip' | 'folder'; path?: string; fileCount: number }[];
}
export interface WorkspacesIndex { items: { id: string; capstoneId: CapstoneId; createdAt: string }[] }

export interface AppData {
  bootstrap: Bootstrap;
  index: ContentIndex;
  flat: LessonRef[];
  byId: Map<string, LessonRef>;
  glossary: Map<string, GlossaryTerm>;
  profile: Doc<Profile>;
  progress: Doc<ProgressDoc>;
  bookmarks: Doc<BookmarksDoc>;
  review: Doc<ReviewDoc>;
  workspaces: Doc<WorkspacesIndex>;
  notices: string[];
}

const newProfile = (): Profile => ({ language: 'uk', styleId: DEFAULT_STYLE, appearance: 'system', textSize: 'default', activeWorkspaceId: null, lastLesson: null, onboardingDone: false, createdAt: new Date().toISOString() });

/** Unknown or retired values fall back without touching any other data (REQ-035). */
export function normalizeProfile(data: unknown): Profile {
  const base = newProfile();
  const p = (data && typeof data === 'object' ? data : {}) as Partial<Profile>;
  return {
    ...base,
    ...p,
    language: p.language === 'en' || p.language === 'uk' ? p.language : base.language,
    styleId: STYLE_IDS.includes(p.styleId as StyleId) ? (p.styleId as StyleId) : DEFAULT_STYLE,
    appearance: p.appearance === 'light' || p.appearance === 'dark' ? p.appearance : 'system',
    textSize: p.textSize === 'compact' || p.textSize === 'large' ? p.textSize : 'default',
  };
}

let data: AppData | null = null;
export const app = (): AppData => {
  if (!data) throw new Error('application data is not loaded yet');
  return data;
};

export async function initApp(): Promise<AppData> {
  const bootstrap = await api<Bootstrap>('GET', '/api/bootstrap');
  const [index, glossary] = await Promise.all([loadIndex(), loadGlossary()]);
  const [profile, progress, bookmarks, review, workspaces] = await Promise.all([
    Doc.load<Profile>('profile', newProfile, normalizeProfile),
    Doc.load<ProgressDoc>('progress', () => ({ lessons: {} })),
    Doc.load<BookmarksDoc>('bookmarks', () => ({ items: [] })),
    Doc.load<ReviewDoc>('review', () => ({ items: {} })),
    Doc.load<WorkspacesIndex>('workspaces', () => ({ items: [] })),
  ]);
  const flat = flattenLessons(index);
  const notices = [profile, progress, bookmarks, review, workspaces].filter((d) => d.recovered).map((d) => d.id);
  data = { bootstrap, index, flat, byId: new Map(flat.map((r) => [r.lesson.id, r])), glossary, profile, progress, bookmarks, review, workspaces, notices };
  applyPresentation(profile.value);
  profile.store.subscribe(() => applyPresentation(profile.value));
  return data;
}

function applyPresentation(profile: Profile): void {
  const root = document.documentElement;
  root.lang = profile.language;
  root.dataset.style = profile.styleId;
  if (profile.appearance === 'system') delete root.dataset.appearance;
  else root.dataset.appearance = profile.appearance;
  if (profile.textSize === 'default') delete root.dataset.textSize;
  else root.dataset.textSize = profile.textSize;
}

export const useProfile = (): Profile => useStore(app().profile.store);
export const useLang = (): Lang => useStore(app().profile.store, (p) => p.language);
export function useT(): (key: Key, params?: Record<string, string | number>) => string {
  const lang = useLang();
  return useCallback((key, params) => translate(lang, key, params), [lang]);
}
export const updateProfile = (patch: Partial<Profile>): void => app().profile.update((p) => ({ ...p, ...patch }));

// ---- per-lesson drafts (learner code for examples/exercises) ----
const draftDocs = new Map<string, Promise<Doc<DraftsDoc>>>();
export function loadDrafts(lessonId: string): Promise<Doc<DraftsDoc>> {
  let doc = draftDocs.get(lessonId);
  if (!doc) {
    doc = Doc.load<DraftsDoc>(`drafts/${lessonId}`, () => ({ blocks: {} }));
    draftDocs.set(lessonId, doc);
  }
  return doc;
}

// ---- capstone workspaces ----
const workspaceDocs = new Map<string, Promise<Doc<WorkspaceDoc>>>();
export function loadWorkspace(id: string): Promise<Doc<WorkspaceDoc>> {
  let doc = workspaceDocs.get(id);
  if (!doc) {
    doc = Doc.load<WorkspaceDoc>(`workspaces/${id}`, () => { throw new Error(`workspace ${id} does not exist`); });
    workspaceDocs.set(id, doc);
  }
  return doc;
}

/**
 * Choosing or changing a capstone always creates a separate workspace; older ones stay (REQ-009).
 * `init` carries the CP-START files (see components/project/workspace.ts startProject).
 */
export async function createWorkspace(capstoneId: CapstoneId, init: Partial<Omit<WorkspaceDoc, 'id' | 'capstoneId' | 'createdAt'>> = {}): Promise<string> {
  const id = `${capstoneId}-${Date.now().toString(36)}`;
  const createdAt = new Date().toISOString();
  const doc = Doc.load<WorkspaceDoc>(`workspaces/${id}`, () => ({ files: {}, storage: {}, steps: {}, ...init, id, capstoneId, createdAt }));
  workspaceDocs.set(id, doc);
  const ws = await doc;
  ws.update((w) => ({ ...w }));
  await ws.flush();
  app().workspaces.update((w) => ({ items: [...w.items, { id, capstoneId, createdAt }] }));
  updateProfile({ activeWorkspaceId: id });
  return id;
}

export function useActiveCapstone(): CapstoneId | null {
  const activeId = useStore(app().profile.store, (p) => p.activeWorkspaceId);
  const items = useStore(app().workspaces.store, (w) => w.items);
  return items.find((i) => i.id === activeId)?.capstoneId ?? null;
}

// ---- session-only UI state: per-block language overrides survive navigation, not restarts ----
export const blockLang = new Store<Record<string, Lang>>({});
export const toggleBlockLang = (key: string, current: Lang): void => blockLang.set((m) => ({ ...m, [key]: current === 'uk' ? 'en' : 'uk' }));
