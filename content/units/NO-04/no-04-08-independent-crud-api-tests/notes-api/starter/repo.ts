// The notes repository (read-only). Every method takes an AbortSignal and stops waiting when it aborts.
// delayMs makes every call slow on purpose, to try deadlines and aborted requests.
import { setTimeout as wait } from 'node:timers/promises';

export type Note = { id: string; title: string; text: string; pinned: boolean };
export type NoteInput = { title: string; text: string; pinned: boolean };

export interface NotesRepo {
  list(signal: AbortSignal): Promise<Note[]>;
  get(id: string, signal: AbortSignal): Promise<Note | undefined>;
  create(input: NoteInput, signal: AbortSignal): Promise<Note>;
  replace(id: string, input: NoteInput, signal: AbortSignal): Promise<Note | undefined>;
  remove(id: string, signal: AbortSignal): Promise<boolean>;
}

export function createNotesRepo(seed: Note[], options: { delayMs?: number } = {}): NotesRepo {
  const notes = seed.map((note) => ({ ...note })); // a fresh copy for every repository
  let nextNumber = notes.length + 1;
  // Waits delayMs; rejects with an AbortError as soon as the signal aborts.
  const pause = (signal: AbortSignal) => wait(options.delayMs ?? 0, undefined, { signal });

  return {
    async list(signal) {
      await pause(signal);
      return notes.map((note) => ({ ...note }));
    },
    async get(id, signal) {
      await pause(signal);
      const note = notes.find((item) => item.id === id);
      return note && { ...note };
    },
    async create(input, signal) {
      await pause(signal);
      const note = { id: `n-${String(nextNumber++).padStart(2, '0')}`, ...input };
      notes.push(note);
      return { ...note };
    },
    async replace(id, input, signal) {
      await pause(signal);
      const index = notes.findIndex((item) => item.id === id);
      if (index === -1) return undefined;
      notes[index] = { id, ...input };
      return { ...notes[index] };
    },
    async remove(id, signal) {
      await pause(signal);
      const index = notes.findIndex((item) => item.id === id);
      if (index === -1) return false;
      notes.splice(index, 1);
      return true;
    },
  };
}
