// Full-profile backup and restore (REQ-025, adopted). Format "jsll-backup" v1:
//   { format, formatVersion, schemaVersion, appVersion, createdAt, docs: [{ id, rev, updatedAt, data }], unreadable, checksum }
// The checksum is SHA-256 (hex) of the canonical JSON of `docs` (object keys sorted, no spaces).
// Preview never changes anything; apply snapshots the current documents first and puts them back
// if any write fails.
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DATA_SCHEMA_VERSION, ROOT } from '../config.mjs';
import { HttpError, readJson } from '../http-util.mjs';
import { MAX_DOC_BYTES, isValidDocId } from '../store.mjs';

export const FORMAT = 'jsll-backup';
export const FORMAT_VERSION = 1;
const MAX_DOCS = 20_000;
const MAX_BODY_BYTES = 128 * 1024 * 1024;

export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    const text = JSON.stringify(value);
    return text === undefined ? 'null' : text;
  }
  if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v)).join(',')}]`;
  const keys = Object.keys(value).filter((k) => value[k] !== undefined && typeof value[k] !== 'function').sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
}

export const checksumOf = (docs) => createHash('sha256').update(canonicalJson(docs), 'utf8').digest('hex');

export async function createBackup(store, { appVersion = null, now = new Date() } = {}) {
  const docs = [];
  const unreadable = [];
  for (const { id } of await store.list()) {
    try {
      const envelope = await store.get(id);
      if (envelope) docs.push({ id, rev: envelope.rev, updatedAt: envelope.updatedAt, data: envelope.data });
    } catch (error) {
      unreadable.push({ id, reason: error.code === 'corrupt' ? 'damaged, no readable backup copy' : 'could not be read' });
    }
  }
  docs.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const backup = { format: FORMAT, formatVersion: FORMAT_VERSION, schemaVersion: store.meta.schemaVersion, appVersion, createdAt: now.toISOString(), docs, unreadable, checksum: checksumOf(docs) };
  if (store.meta.token && JSON.stringify(backup).includes(store.meta.token)) {
    throw new HttpError(500, 'backup-unsafe', 'A document contains the local API token; the backup was not created.');
  }
  return backup;
}

/** Structural and integrity checks. Returns a list of { code, message, id? } (empty when valid). */
export function validateBackup(backup) {
  const problems = [];
  const add = (code, message, extra = {}) => problems.push({ code, message, ...extra });
  if (backup === null || typeof backup !== 'object' || Array.isArray(backup)) {
    add('not-a-backup', 'The file is not a js-learning-lab backup.');
    return problems;
  }
  if (backup.format !== FORMAT) add('wrong-format', `Expected format "${FORMAT}", found ${JSON.stringify(backup.format ?? null)}.`);
  if (!Number.isInteger(backup.formatVersion)) add('bad-format-version', 'The backup has no valid format version.');
  else if (backup.formatVersion > FORMAT_VERSION) add('newer-format', `The backup uses format version ${backup.formatVersion}; this version of the platform reads up to ${FORMAT_VERSION}. Update the platform first.`);
  if (!Number.isInteger(backup.schemaVersion) || backup.schemaVersion < 1) add('bad-schema-version', 'The backup has no valid data schema version.');
  else if (backup.schemaVersion > DATA_SCHEMA_VERSION) add('newer-schema', `The backup was made with data schema ${backup.schemaVersion}; this platform understands up to ${DATA_SCHEMA_VERSION}. Update the platform first.`);
  else if (backup.schemaVersion < DATA_SCHEMA_VERSION) add('older-schema', `The backup uses data schema ${backup.schemaVersion}, which this platform cannot migrate on import.`);
  if (!Array.isArray(backup.docs)) {
    add('bad-docs', 'The backup has no document list.');
    return problems;
  }
  if (backup.docs.length > MAX_DOCS) add('too-many-docs', `The backup holds ${backup.docs.length} documents; the limit is ${MAX_DOCS}.`);
  const seen = new Set();
  for (const doc of backup.docs) {
    if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
      add('bad-doc', 'A document entry is not an object.');
      continue;
    }
    const { id } = doc;
    if (!isValidDocId(id)) {
      add('bad-id', `Unsafe or invalid document id ${JSON.stringify(id)}.`, { id: typeof id === 'string' ? id.slice(0, 200) : null });
      continue;
    }
    if (seen.has(id)) add('duplicate-id', `Document ${id} appears more than once.`, { id });
    seen.add(id);
    if (!Number.isInteger(doc.rev) || doc.rev < 1) add('bad-rev', `Document ${id} has an invalid revision.`, { id });
    if (typeof doc.updatedAt !== 'string' || Number.isNaN(Date.parse(doc.updatedAt))) add('bad-date', `Document ${id} has an invalid update time.`, { id });
    if (!('data' in doc)) add('bad-doc', `Document ${id} has no data.`, { id });
    else if (Buffer.byteLength(JSON.stringify({ rev: doc.rev, updatedAt: doc.updatedAt, schema: DATA_SCHEMA_VERSION, data: doc.data }) ?? '') > MAX_DOC_BYTES) add('too-large', `Document ${id} exceeds ${MAX_DOC_BYTES} bytes.`, { id });
  }
  if (typeof backup.checksum !== 'string') add('no-checksum', 'The backup has no checksum.');
  else if (backup.checksum !== checksumOf(backup.docs)) add('checksum-mismatch', 'The backup checksum does not match its contents: the file is damaged or was edited.');
  return problems;
}

async function plan(store, backup, mode) {
  const local = new Set((await store.list()).map((d) => d.id));
  const summary = { mode, total: backup.docs.length, new: 0, replacing: 0, unchanged: 0, keptLocal: 0, localOnly: 0, removing: 0 };
  const writes = [];
  for (const doc of backup.docs) {
    let current = null;
    let unreadableLocal = false;
    if (local.has(doc.id)) {
      try {
        current = await store.get(doc.id);
      } catch {
        unreadableLocal = true;
      }
    }
    if (!current && !unreadableLocal) {
      summary.new += 1;
      writes.push(doc);
    } else if (current && canonicalJson(current.data) === canonicalJson(doc.data)) {
      summary.unchanged += 1;
    } else if (mode === 'merge' && current && Date.parse(current.updatedAt) >= Date.parse(doc.updatedAt)) {
      summary.keptLocal += 1; // the local copy is at least as new as the backup's
    } else {
      summary.replacing += 1;
      writes.push(doc);
    }
  }
  const inBackup = new Set(backup.docs.map((d) => d.id));
  const removals = [...local].filter((id) => !inBackup.has(id));
  summary.localOnly = removals.length;
  if (mode === 'replace') summary.removing = removals.length;
  return { summary, writes, removals: mode === 'replace' ? removals : [] };
}

export async function previewBackup(store, backup, mode = 'merge') {
  const problems = validateBackup(backup);
  if (problems.some((p) => ['not-a-backup', 'bad-docs'].includes(p.code))) return { ok: false, problems, summary: null, summaries: null };
  const merge = await plan(store, backup, 'merge');
  const replace = await plan(store, backup, 'replace');
  return { ok: problems.length === 0, problems, summary: (mode === 'replace' ? replace : merge).summary, summaries: { merge: merge.summary, replace: replace.summary } };
}

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

export async function applyBackup(store, backup, mode, { onWrite } = {}) {
  if (mode !== 'replace' && mode !== 'merge') throw new HttpError(400, 'bad-request', '"mode" must be "replace" or "merge".');
  if (store.state !== 'ready') throw new HttpError(409, 'store-not-ready', `Learner data is ${store.state}; a backup cannot be applied now.`);
  const problems = validateBackup(backup);
  if (problems.length > 0) throw new HttpError(422, 'invalid-backup', 'The backup was rejected; nothing was changed.', { problems });
  const { summary, writes, removals } = await plan(store, backup, mode);

  const snapshotName = `pre-restore-${timestamp()}-${randomBytes(3).toString('hex')}`;
  const snapshot = path.join(store.dataDir, 'snapshots', snapshotName);
  await fs.mkdir(path.dirname(snapshot), { recursive: true });
  await fs.cp(store.docsDir, snapshot, { recursive: true, errorOnExist: true, force: false });
  try {
    for (const doc of writes) {
      await store.put(doc.id, doc.data, { force: true });
      onWrite?.(doc.id);
    }
    for (const id of removals) await store.remove(id);
  } catch (error) {
    let restored = false;
    try {
      await fs.rm(store.docsDir, { recursive: true, force: true });
      await fs.cp(snapshot, store.docsDir, { recursive: true });
      restored = true;
    } catch {
      /* reported below */
    }
    throw new HttpError(500, 'restore-failed', restored
      ? `Applying the backup failed (${error.message}); your previous data was put back from the snapshot.`
      : `Applying the backup failed (${error.message}) and the automatic rollback also failed. Your previous documents are in ${path.join('snapshots', snapshotName)} inside the data folder.`, { restored, snapshot: path.posix.join('snapshots', snapshotName) });
  }
  return { ok: true, mode, summary, written: writes.length, removed: removals.length, snapshot: path.posix.join('snapshots', snapshotName) };
}

export async function register(api) {
  const { store } = api;
  let appVersion = null;
  try {
    appVersion = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8')).version;
  } catch {
    /* unknown */
  }
  let applying = false;
  api.features.backup = { available: true, format: FORMAT, formatVersion: FORMAT_VERSION, schemaVersion: DATA_SCHEMA_VERSION };

  api.route('POST', '/api/backup/create', async () => createBackup(store, { appVersion }));
  api.route('POST', '/api/backup/preview', async ({ req }) => {
    const body = await readJson(req, MAX_BODY_BYTES);
    const mode = body.mode ?? 'merge';
    if (mode !== 'replace' && mode !== 'merge') throw new HttpError(400, 'bad-request', '"mode" must be "replace" or "merge".');
    return previewBackup(store, body.backup, mode);
  });
  api.route('POST', '/api/backup/apply', async ({ req }) => {
    const body = await readJson(req, MAX_BODY_BYTES);
    if (applying) throw new HttpError(409, 'busy', 'Another restore is in progress.');
    applying = true;
    try {
      return await applyBackup(store, body.backup, body.mode);
    } finally {
      applying = false;
    }
  });
}
