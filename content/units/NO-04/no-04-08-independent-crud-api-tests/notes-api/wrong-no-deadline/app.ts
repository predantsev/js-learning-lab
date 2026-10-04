// The notes API: /v1 CRUD with validation, an error model, cursor pages, idempotent creates,
// a deadline per request and cancellation on client abort; /v2 renames title to heading.
import http from 'node:http';
import { createHash } from 'node:crypto';
import { readBodyText, sendJson } from './http-helpers.js';
import { seedNotes } from './notes.ts';
import { createNotesRepo } from './repo.ts';
import type { Note, NoteInput, NotesRepo } from './repo.ts';

type Answer = { status: number; body?: unknown; headers?: Record<string, string> };
type Options = { repo?: NotesRepo; deadlineMs?: number };

const MAX_BODY_BYTES = 1024;
const FIELDS = ['title', 'text', 'pinned'];

class ApiError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown>;
  headers: Record<string, string>;
  constructor(status: number, code: string, details: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.details = details;
    this.headers = headers;
  }
}

function validateNote(input: unknown): NoteInput {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw new ApiError(400, 'VALIDATION_FAILED', { body: 'notObject' });
  const value = input as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (typeof value.title !== 'string' || value.title.trim() === '') errors.title = 'required';
  else if (value.title.trim().length > 60) errors.title = 'tooLong';
  if (value.text !== undefined && (typeof value.text !== 'string' || value.text.length > 500)) errors.text = 'invalid';
  if (value.pinned !== undefined && typeof value.pinned !== 'boolean') errors.pinned = 'notBoolean';
  for (const key of Object.keys(value)) if (!FIELDS.includes(key)) errors[key] = 'unknownField';
  if (Object.keys(errors).length > 0) throw new ApiError(400, 'VALIDATION_FAILED', errors);
  return { title: (value.title as string).trim(), text: (value.text as string | undefined) ?? '', pinned: (value.pinned as boolean | undefined) ?? false };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, 'MALFORMED_JSON');
  }
}

export function createApp({ repo = createNotesRepo(seedNotes), deadlineMs = 1000 }: Options = {}): http.Server {
  const replies = new Map<string, { hash: string; answer: Answer }>();

  async function listNotes(url: URL, signal: AbortSignal): Promise<Answer> {
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const pinned = url.searchParams.get('pinned');
    const cursor = url.searchParams.get('cursor');
    const errors: Record<string, string> = {};
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) errors.limit = 'outOfRange';
    if (pinned !== null && pinned !== 'true' && pinned !== 'false') errors.pinned = 'notBoolean';
    if (Object.keys(errors).length > 0) throw new ApiError(400, 'VALIDATION_FAILED', errors);

    const rest = (await repo.list(signal))
      .filter((note) => pinned === null || String(note.pinned) === pinned) // 1. filter
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) // 2. sort by id (unique)
      .filter((note) => cursor === null || note.id > cursor); // 3. after the cursor
    const items = rest.slice(0, limit); // 4. one page
    return { status: 200, body: { items, nextCursor: rest.length > limit ? items[items.length - 1].id : null } };
  }

  async function createNote(request: http.IncomingMessage, signal: AbortSignal): Promise<Answer> {
    const text = await readBodyText(request, MAX_BODY_BYTES);
    const key = request.headers['idempotency-key'];
    const hash = createHash('sha256').update(text).digest('hex');
    if (typeof key === 'string' && replies.has(key)) {
      const saved = replies.get(key)!;
      if (saved.hash !== hash) throw new ApiError(422, 'IDEMPOTENCY_KEY_REUSED');
      return saved.answer;
    }
    const note = await repo.create(validateNote(parseJson(text)), signal);
    const answer = { status: 201, body: note };
    if (typeof key === 'string') replies.set(key, { hash, answer });
    return answer;
  }

  async function oneNote(request: http.IncomingMessage, id: string, signal: AbortSignal): Promise<Answer> {
    const method = request.method;
    if (!['GET', 'PUT', 'PATCH', 'DELETE'].includes(method ?? '')) throw new ApiError(405, 'METHOD_NOT_ALLOWED', {}, { allow: 'GET, PUT, PATCH, DELETE' });
    const text = method === 'PUT' || method === 'PATCH' ? await readBodyText(request, MAX_BODY_BYTES) : '';
    const current = await repo.get(id, signal);
    if (!current) throw new ApiError(404, 'NOT_FOUND', { id });
    if (method === 'GET') return { status: 200, body: current };
    if (method === 'DELETE') {
      await repo.remove(id, signal);
      return { status: 204 };
    }
    const { id: _id, ...fields } = current;
    const input = validateNote(method === 'PUT' ? parseJson(text) : { ...fields, ...(parseJson(text) as object) });
    return { status: 200, body: await repo.replace(id, input, signal) };
  }

  async function route(request: http.IncomingMessage, signal: AbortSignal): Promise<Answer> {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const parts = url.pathname.split('/').filter((part) => part !== '');
    if (parts[0] === 'v1' && parts[1] === 'notes' && parts.length === 2) {
      if (request.method === 'GET') return listNotes(url, signal);
      if (request.method === 'POST') return createNote(request, signal);
      throw new ApiError(405, 'METHOD_NOT_ALLOWED', {}, { allow: 'GET, POST' });
    }
    if (parts[0] === 'v1' && parts[1] === 'notes' && parts.length === 3) return oneNote(request, parts[2], signal);
    if (parts[0] === 'v2' && parts[1] === 'notes' && parts.length === 3 && request.method === 'GET') {
      const note: Note | undefined = await repo.get(parts[2], signal);
      if (!note) throw new ApiError(404, 'NOT_FOUND', { id: parts[2] });
      return { status: 200, body: { id: note.id, heading: note.title, text: note.text, pinned: note.pinned } };
    }
    throw new ApiError(404, 'NOT_FOUND', { path: url.pathname });
  }

  return http.createServer(async (request, response) => {
    const controller = new AbortController();
    const deadline = new ApiError(503, 'DEADLINE_EXCEEDED');
    // Misconception: a request with no deadline will eventually fail on its own.
    const timer = setTimeout(() => {}, 0);
    // The client went away before the answer was sent: stop the work.
    response.on('close', () => {
      if (!response.writableFinished) controller.abort(new Error('client closed the connection'));
    });
    let answer: Answer;
    try {
      answer = await route(request, controller.signal);
    } catch (error) {
      if (controller.signal.aborted) answer = controller.signal.reason === deadline ? { status: 503, body: { error: { code: 'DEADLINE_EXCEEDED', details: {} } } } : { status: 0 };
      else if (error instanceof ApiError) answer = { status: error.status, body: { error: { code: error.code, details: error.details } }, headers: error.headers };
      else if ((error as { status?: number }).status === 413) answer = { status: 413, body: { error: { code: 'PAYLOAD_TOO_LARGE', details: { maxBytes: MAX_BODY_BYTES } } } };
      else {
        console.error(error); // the details stay in the server's log
        answer = { status: 500, body: { error: { code: 'INTERNAL', details: {} } } };
      }
    } finally {
      clearTimeout(timer);
    }
    if (response.destroyed || answer.status === 0) return; // nobody is listening any more
    if (answer.body === undefined) {
      response.writeHead(answer.status, answer.headers ?? {});
      response.end();
    } else sendJson(response, answer.status, answer.body, answer.headers ?? {});
  });
}
