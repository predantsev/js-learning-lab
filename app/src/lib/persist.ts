// Learner documents: load once, mutate in memory, save with a short debounce, and tell the
// truth about it (REQ-024): "saved" only after the server confirmed a durable write.
import { ApiError, api, boot } from './api';
import { Store } from './store';

export type SaveState = 'saved' | 'pending' | 'saving' | 'failed' | 'conflict';
export interface SaveStatus { state: SaveState; failedDocs: string[]; conflictDocs: string[]; lastSavedAt: string | null; lastError: string | null }

export const saveStatus = new Store<SaveStatus>({ state: 'saved', failedDocs: [], conflictDocs: [], lastSavedAt: null, lastError: null });

const DEBOUNCE_MS = 500;
const RETRY_MS = [1500, 4000, 10000];
const docs = new Map<string, Doc<unknown>>();

function recompute(lastError: string | null = null): void {
  const all = [...docs.values()];
  const failedDocs = all.filter((d) => d.state === 'failed').map((d) => d.id);
  const conflictDocs = all.filter((d) => d.state === 'conflict').map((d) => d.id);
  const state: SaveState = conflictDocs.length > 0 ? 'conflict' : failedDocs.length > 0 ? 'failed' : all.some((d) => d.state === 'saving') ? 'saving' : all.some((d) => d.state === 'pending') ? 'pending' : 'saved';
  const previous = saveStatus.get();
  saveStatus.set({ state, failedDocs, conflictDocs, lastSavedAt: state === 'saved' && previous.state !== 'saved' ? new Date().toISOString() : previous.lastSavedAt, lastError: lastError ?? (state === 'saved' ? null : previous.lastError) });
}

export class Doc<T> {
  readonly store: Store<T>;
  state: SaveState = 'saved';
  recovered = false;
  private rev: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retry = 0;
  private dirty = false;
  private inFlight = false;

  private constructor(readonly id: string, value: T) {
    this.store = new Store(value);
  }

  /** Load a document, creating it in memory (not on disk) from `initial` when it does not exist. */
  static async load<T>(id: string, initial: () => T, migrate?: (data: unknown) => T): Promise<Doc<T>> {
    const existing = docs.get(id);
    if (existing) return existing as Doc<T>;
    const result = await api<{ exists: boolean; rev?: number; data?: unknown; recovered?: boolean }>('GET', `/api/store/doc?id=${encodeURIComponent(id)}`);
    const doc = new Doc<T>(id, result.exists ? (migrate ? migrate(result.data) : (result.data as T)) : initial());
    doc.rev = result.exists ? (result.rev ?? null) : null;
    doc.recovered = result.recovered === true;
    docs.set(id, doc as Doc<unknown>);
    return doc;
  }

  get value(): T {
    return this.store.get();
  }

  update(mutator: (current: T) => T): void {
    const next = mutator(this.store.get());
    if (Object.is(next, this.store.get())) return;
    this.store.set(next);
    this.dirty = true;
    if (this.state !== 'conflict') this.state = 'pending';
    recompute();
    this.schedule(DEBOUNCE_MS);
  }

  private schedule(ms: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), ms);
  }

  async flush({ keepalive = false, force = false } = {}): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (!this.dirty || this.inFlight || (this.state === 'conflict' && !force)) return;
    this.inFlight = true;
    this.dirty = false;
    this.state = 'saving';
    recompute();
    try {
      const result = await api<{ rev: number }>('PUT', `/api/store/doc?id=${encodeURIComponent(this.id)}`, { baseRev: this.rev, data: this.store.get(), force }, { keepalive });
      this.rev = result.rev;
      this.retry = 0;
      this.state = this.dirty ? 'pending' : 'saved';
      recompute();
      if (this.dirty) this.schedule(DEBOUNCE_MS);
    } catch (error) {
      this.dirty = true;
      const apiError = error instanceof ApiError ? error : new ApiError(0, 'unknown', String(error));
      if (apiError.code === 'conflict') this.state = 'conflict';
      else {
        this.state = 'failed';
        this.schedule(RETRY_MS[Math.min(this.retry, RETRY_MS.length - 1)]);
        this.retry += 1;
      }
      recompute(`${apiError.code}: ${apiError.message}`);
    } finally {
      this.inFlight = false;
    }
  }

  /** Conflict resolution: keep this tab's version (overwrite) … */
  async overwrite(): Promise<void> {
    await this.flush({ force: true });
  }

  /** … or take the version on disk and drop this tab's unsaved changes for the document. */
  async reloadFromDisk(): Promise<void> {
    const result = await api<{ exists: boolean; rev?: number; data?: unknown }>('GET', `/api/store/doc?id=${encodeURIComponent(this.id)}`);
    if (result.exists) {
      this.store.set(result.data as T);
      this.rev = result.rev ?? null;
    }
    this.dirty = false;
    this.state = 'saved';
    recompute();
  }

  get hasUnsavedChanges(): boolean {
    return this.dirty || this.inFlight;
  }
}

export const allDocs = (): Doc<unknown>[] => [...docs.values()];
export const forgetDoc = (id: string): void => { docs.delete(id); };

export function retryFailedSaves(): void {
  for (const doc of docs.values()) if (doc.state === 'failed') void doc.flush();
}

/** Everything not yet saved, for the "download unsaved work" recovery path (REQ-024, REQ-032). */
export function unsavedSnapshot(): { createdAt: string; docs: { id: string; data: unknown }[] } {
  return { createdAt: new Date().toISOString(), docs: [...docs.values()].filter((d) => d.hasUnsavedChanges || d.state === 'failed' || d.state === 'conflict').map((d) => ({ id: d.id, data: d.value })) };
}

function flushAll(): void {
  for (const doc of docs.values()) void doc.flush({ keepalive: true });
}
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll(); });
  window.addEventListener('pagehide', flushAll);
  window.addEventListener('beforeunload', (event) => {
    const s = saveStatus.get().state;
    if (s === 'failed' || s === 'conflict') { event.preventDefault(); event.returnValue = ''; }
  });
}
export const tokenForDownloadName = (): string => String(boot.port);
