// File-backed learner document store (DEC-02). One JSON file per document under <dataDir>/docs.
// Writes are atomic (temp file + fsync + rename), the previous version is kept as .bak for
// recovery, and optimistic revisions stop one browser tab from silently overwriting another.
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { DATA_SCHEMA_VERSION } from './config.mjs';

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,80}(\/[a-z0-9][a-z0-9._-]{0,120}){0,2}$/;
export const MAX_DOC_BYTES = 5 * 1024 * 1024;

export class StoreError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.code = code;
    Object.assign(this, extra);
  }
}

export const isValidDocId = (id) => typeof id === 'string' && ID_PATTERN.test(id) && !id.includes('..');

export class Store {
  constructor(dataDir, { migrations = [] } = {}) {
    this.dataDir = dataDir;
    this.docsDir = path.join(dataDir, 'docs');
    this.migrations = migrations;
    this.fault = null; // test hook: 'write-fail' | 'disk-full'
    this.state = 'closed';
    this.meta = null;
    this.locks = new Map();
  }

  async open() {
    await fs.mkdir(this.docsDir, { recursive: true });
    const metaPath = path.join(this.dataDir, 'meta.json');
    let meta = null;
    try {
      meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw new StoreError('meta-corrupt', `Cannot read ${metaPath}: ${error.message}`);
    }
    if (meta === null) {
      meta = { schemaVersion: DATA_SCHEMA_VERSION, createdAt: new Date().toISOString(), token: randomBytes(24).toString('hex') };
      await this.#atomicWrite(metaPath, JSON.stringify(meta, null, 2));
    }
    if (meta.schemaVersion > DATA_SCHEMA_VERSION) {
      this.meta = meta;
      this.state = 'newer-schema';
      return this;
    }
    this.meta = meta;
    this.state = 'ready';
    if (meta.schemaVersion < DATA_SCHEMA_VERSION) await this.#migrate(metaPath);
    return this;
  }

  async #migrate(metaPath) {
    const from = this.meta.schemaVersion;
    const snapshot = path.join(this.dataDir, 'snapshots', `pre-migration-v${from}-${Date.now()}`);
    await fs.mkdir(path.dirname(snapshot), { recursive: true });
    await fs.cp(this.docsDir, snapshot, { recursive: true });
    try {
      for (const m of this.migrations.filter((x) => x.to > from && x.to <= DATA_SCHEMA_VERSION).sort((a, b) => a.to - b.to)) {
        await m.run(this);
        this.meta.schemaVersion = m.to;
      }
      this.meta.schemaVersion = DATA_SCHEMA_VERSION;
      await this.#atomicWrite(metaPath, JSON.stringify(this.meta, null, 2));
    } catch (error) {
      // Restore the untouched snapshot; the learner keeps the pre-migration data.
      await fs.rm(this.docsDir, { recursive: true, force: true });
      await fs.cp(snapshot, this.docsDir, { recursive: true });
      this.meta.schemaVersion = from;
      this.state = 'migration-failed';
      this.migrationError = String(error.message);
    }
  }

  #file(id) {
    if (!isValidDocId(id)) throw new StoreError('bad-id', `Invalid document id "${id}".`);
    return path.join(this.docsDir, `${id}.json`);
  }

  async #atomicWrite(file, text) {
    if (this.fault === 'write-fail') throw new StoreError('write-failed', 'Simulated write failure (test hook).');
    if (this.fault === 'disk-full') throw Object.assign(new StoreError('disk-full', 'No space left on device (test hook).'), { errno: 'ENOSPC' });
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
    const handle = await fs.open(tmp, 'w');
    try {
      await handle.writeFile(text, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      await fs.rename(tmp, file);
    } catch (error) {
      await fs.rm(tmp, { force: true });
      throw error;
    }
  }

  async #readEnvelope(file) {
    let text;
    try {
      text = await fs.readFile(file, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw new StoreError('read-failed', error.message);
    }
    try {
      const envelope = JSON.parse(text);
      if (typeof envelope.rev !== 'number' || !('data' in envelope)) throw new Error('not a document envelope');
      return envelope;
    } catch (error) {
      try {
        const backup = JSON.parse(await fs.readFile(`${file}.bak`, 'utf8'));
        return { ...backup, recovered: true };
      } catch {
        throw new StoreError('corrupt', `Document file is damaged and no backup copy is readable: ${path.basename(file)}`, { file });
      }
    }
  }

  async get(id) {
    const envelope = await this.#readEnvelope(this.#file(id));
    return envelope;
  }

  /** Serialize writers per document so read-compare-write stays consistent inside this process. */
  async #withLock(id, task) {
    const previous = this.locks.get(id) ?? Promise.resolve();
    const next = previous.then(task, task);
    this.locks.set(id, next.catch(() => {}));
    return next;
  }

  async put(id, data, { baseRev = null, force = false } = {}) {
    if (this.state !== 'ready') throw new StoreError('not-ready', `Store is ${this.state}.`);
    const file = this.#file(id);
    return this.#withLock(id, async () => {
      let current = null;
      try {
        current = await this.#readEnvelope(file);
      } catch (error) {
        if (error.code !== 'corrupt' || !force) throw error;
      }
      const currentRev = current ? current.rev : 0;
      if (!force && current && baseRev !== currentRev) {
        throw new StoreError('conflict', 'The document changed since it was loaded.', { currentRev, updatedAt: current.updatedAt });
      }
      const envelope = { rev: currentRev + 1, updatedAt: new Date().toISOString(), schema: DATA_SCHEMA_VERSION, data };
      const text = JSON.stringify(envelope);
      if (Buffer.byteLength(text) > MAX_DOC_BYTES) throw new StoreError('too-large', `Document exceeds ${MAX_DOC_BYTES} bytes.`);
      if (current && !current.recovered) await fs.copyFile(file, `${file}.bak`).catch(() => {});
      await this.#atomicWrite(file, text);
      return { rev: envelope.rev, updatedAt: envelope.updatedAt };
    });
  }

  async remove(id) {
    const file = this.#file(id);
    await fs.rm(file, { force: true });
    await fs.rm(`${file}.bak`, { force: true });
  }

  async list(prefix = '') {
    const out = [];
    const walk = async (dir, rel) => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const relPath = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) await walk(path.join(dir, entry.name), relPath);
        else if (entry.name.endsWith('.json')) {
          const id = relPath.slice(0, -'.json'.length);
          if (!id.startsWith(prefix)) continue;
          const stat = await fs.stat(path.join(dir, entry.name));
          out.push({ id, bytes: stat.size, modifiedAt: stat.mtime.toISOString() });
        }
      }
    };
    await walk(this.docsDir, '');
    return out.sort((a, b) => a.id.localeCompare(b.id));
  }
}
