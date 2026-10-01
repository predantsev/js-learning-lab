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

export interface WorkspaceDoc {
  id: string;
  capstoneId: CapstoneId;
  createdAt: string;
  files: Record<string, string>;
  storage: Record<string, string>;
  steps: Record<string, { state: 'done' | 'pending'; checkedAt?: string; source?: 'platform-check' | 'learner-confirmed' | 'starter'; assisted?: boolean }>;
  exportedAt?: string;
  snapshots?: { id: string; createdAt: string; reason: string }[];
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

/** Choosing or changing a capstone always creates a separate workspace; older ones stay (REQ-009). */
export async function createWorkspace(capstoneId: CapstoneId, starterFiles: Record<string, string> = {}): Promise<string> {
  const id = `${capstoneId}-${Date.now().toString(36)}`;
  const createdAt = new Date().toISOString();
  const doc = Doc.load<WorkspaceDoc>(`workspaces/${id}`, () => ({ id, capstoneId, createdAt, files: starterFiles, storage: {}, steps: {} }));
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
