// Real TypeScript type checking for learner files (POST /api/typecheck).
// The installed typescript@7 is the native compiler and has no JavaScript API, so each request
// writes the files and a generated tsconfig into a scratch folder and runs the compiler binary.
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../config.mjs';
import { HttpError, readJson } from '../http-util.mjs';
import { randomId, validateFiles, writeFiles } from './lib/project-files.mjs';

const CONFIG_NAME = 'tsconfig.jsll.json';
const TIMEOUT_MS = 20_000;
const MAX_CONCURRENT = 2;
const MAX_DIAGNOSTICS = 500;
const LIB_NAME = /^[A-Za-z0-9.]{2,40}$/;
const TYPES_DIR = path.join(ROOT, 'node_modules', '@types');

/** Locate the compiler: the native executable when the package exposes it, else the JS launcher run by this Node. */
export async function locateCompiler(root = ROOT) {
  const pkgFile = path.join(root, 'node_modules', 'typescript', 'package.json');
  if (!existsSync(pkgFile)) return null;
  const version = JSON.parse(readFileSync(pkgFile, 'utf8')).version;
  try {
    const { default: getExePath } = await import(pathToFileURL(path.join(root, 'node_modules', 'typescript', 'lib', 'getExePath.js')).href);
    const exe = getExePath();
    if (existsSync(exe)) return { command: exe, prefix: [], version };
  } catch {
    /* older layout: fall back to the launcher */
  }
  const launcher = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  if (existsSync(launcher)) return { command: process.execPath, prefix: [launcher], version };
  return null;
}

/** Parse `tsc --pretty false` output: `file(line,col): error TS1234: text`, indented continuation lines, and file-less config errors. */
export function parseDiagnostics(output, { mapFile = (f) => f } = {}) {
  const diagnostics = [];
  const located = /^(.+?)\((\d+),(\d+)\): (error|warning|message|suggestion) TS(\d+): (.*)$/;
  const global = /^(error|warning|message|suggestion) TS(\d+): (.*)$/;
  for (const raw of String(output).split(/\r?\n/)) {
    if (raw.trim() === '') continue;
    let m = located.exec(raw);
    if (m) {
      diagnostics.push({ file: mapFile(m[1]), line: Number(m[2]), column: Number(m[3]), code: Number(m[5]), category: m[4] === 'error' ? 'error' : 'warning', message: m[6] });
      continue;
    }
    m = global.exec(raw);
    if (m) {
      diagnostics.push({ file: null, line: null, column: null, code: Number(m[2]), category: m[1] === 'error' ? 'error' : 'warning', message: m[3] });
      continue;
    }
    // Continuation of a chained message ("  Property 'x' is missing…"), or anything unexpected.
    const last = diagnostics[diagnostics.length - 1];
    if (last && /^\s/.test(raw)) last.message += `\n${raw.replace(/^\s{2}/, '')}`;
    else if (!/^Found \d+ errors?/.test(raw)) diagnostics.push({ file: null, line: null, column: null, code: null, category: 'error', message: raw });
  }
  return diagnostics;
}

export function buildTsconfig({ strict = true, jsx = false, lib } = {}) {
  const libs = lib ?? ['ES2022', 'DOM', 'DOM.Iterable'];
  const at = (...p) => path.join(TYPES_DIR, ...p);
  return {
    compilerOptions: {
      noEmit: true,
      strict,
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      skipLibCheck: true,
      isolatedModules: true,
      ...(jsx ? { jsx: 'react-jsx' } : {}),
      lib: libs,
      types: [],
      // Absolute so React typings resolve wherever the runtime folder lives.
      typeRoots: [TYPES_DIR],
      paths: { react: [at('react')], 'react/*': [at('react', '*')], 'react-dom': [at('react-dom')], 'react-dom/*': [at('react-dom', '*')] },
    },
    include: ['**/*'],
    exclude: [],
  };
}

function validateOptions(options) {
  if (options === undefined || options === null) return {};
  if (typeof options !== 'object' || Array.isArray(options)) throw new HttpError(400, 'bad-request', '"options" must be an object.');
  const out = {};
  if (options.strict !== undefined) {
    if (typeof options.strict !== 'boolean') throw new HttpError(400, 'bad-request', '"options.strict" must be a boolean.');
    out.strict = options.strict;
  }
  if (options.jsx !== undefined) {
    if (typeof options.jsx !== 'boolean') throw new HttpError(400, 'bad-request', '"options.jsx" must be a boolean.');
    out.jsx = options.jsx;
  }
  if (options.lib !== undefined) {
    if (!Array.isArray(options.lib) || options.lib.length === 0 || options.lib.length > 20 || !options.lib.every((l) => typeof l === 'string' && LIB_NAME.test(l))) {
      throw new HttpError(400, 'bad-request', '"options.lib" must be a list of TypeScript library names such as "ES2022" or "DOM".');
    }
    out.lib = options.lib;
  }
  return out;
}

export async function register(api) {
  const compiler = await locateCompiler();
  const typecheckRoot = path.join(api.config.runtimeDir, 'typecheck');
  let active = 0;
  let available = compiler !== null;
  let reason = compiler === null ? 'The typescript package is not installed (run npm install).' : undefined;
  if (compiler) {
    // Prove the binary starts on this machine.
    const ok = await new Promise((resolve) => {
      const child = spawn(compiler.command, [...compiler.prefix, '--version'], { stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: process.env.PATH ?? '', NO_COLOR: '1' }, windowsHide: true });
      let out = '';
      child.stdout.on('data', (c) => { out += c; });
      child.on('error', () => resolve(false));
      child.on('close', (code) => resolve(code === 0 && out.includes('Version')));
    });
    if (!ok) {
      available = false;
      reason = 'The TypeScript compiler did not start on this machine.';
    }
  }
  api.features.typecheck = { available, tsVersion: compiler?.version ?? null, ...(reason ? { reason } : {}), limits: { timeoutMs: TIMEOUT_MS, concurrent: MAX_CONCURRENT }, nodeTypes: existsSync(path.join(TYPES_DIR, 'node')) };

  api.route('POST', '/api/typecheck', async ({ req }) => {
    if (!available) throw new HttpError(501, 'typecheck-unavailable', reason);
    const body = await readJson(req);
    const entries = validateFiles(body.files ?? {}, { maxFiles: 200, maxBytes: 2 * 1024 * 1024, reserved: [CONFIG_NAME] });
    const options = validateOptions(body.options);
    if (active >= MAX_CONCURRENT) throw new HttpError(429, 'busy', `At most ${MAX_CONCURRENT} type checks can run at once.`);
    active += 1;
    let dir = path.join(typecheckRoot, randomId('tc'));
    const started = performance.now();
    try {
      await fs.mkdir(dir, { recursive: true });
      dir = await fs.realpath(dir);
      await writeFiles(dir, entries);
      await fs.writeFile(path.join(dir, CONFIG_NAME), JSON.stringify(buildTsconfig(options), null, 2));
      const result = await new Promise((resolve, reject) => {
        const child = spawn(compiler.command, [...compiler.prefix, '-p', CONFIG_NAME, '--pretty', 'false'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: process.env.PATH ?? '', NO_COLOR: '1' }, windowsHide: true });
        let out = '';
        let err = '';
        let timedOut = false;
        child.stdout.on('data', (c) => { if (out.length < 4_000_000) out += c; });
        child.stderr.on('data', (c) => { if (err.length < 200_000) err += c; });
        const timer = setTimeout(() => {
          timedOut = true;
          child.kill('SIGKILL');
        }, TIMEOUT_MS);
        child.on('error', (error) => {
          clearTimeout(timer);
          reject(new HttpError(500, 'typecheck-failed', `The TypeScript compiler could not start: ${error.message}`));
        });
        child.on('close', (code) => {
          clearTimeout(timer);
          resolve({ code, out, err, timedOut });
        });
      });
      if (result.timedOut) throw new HttpError(504, 'typecheck-timeout', `Type checking took longer than ${TIMEOUT_MS / 1000} s and was stopped.`);
      const mapFile = (file) => {
        const abs = path.resolve(dir, file);
        if (abs.startsWith(dir + path.sep)) return path.relative(dir, abs).split(path.sep).join('/');
        if (abs.startsWith(ROOT + path.sep)) return path.relative(ROOT, abs).split(path.sep).join('/');
        return path.basename(abs);
      };
      let diagnostics = parseDiagnostics(result.out + (result.err ? `\n${result.err}` : ''), { mapFile });
      // Our generated config is an implementation detail; "no inputs" means no TypeScript files were sent.
      diagnostics = diagnostics.map((d) => (d.code === 18003 ? { ...d, file: null, line: null, column: null, message: 'No TypeScript files to check (send .ts or .tsx files).' } : d));
      if (result.code !== 0 && diagnostics.length === 0) throw new HttpError(500, 'typecheck-failed', `The TypeScript compiler exited with code ${result.code} without diagnostics.`);
      const truncated = diagnostics.length > MAX_DIAGNOSTICS;
      return { diagnostics: diagnostics.slice(0, MAX_DIAGNOSTICS), truncated, durationMs: Math.round(performance.now() - started), tsVersion: compiler.version };
    } finally {
      active -= 1;
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  });
}
