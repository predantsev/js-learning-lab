// Sandbox controller (browser side). Prepares a run from learner files and drives the isolated
// frame: start, heartbeat, stop, clean rerun. Framework-agnostic; used by the app and by the
// content validator harness, so validated behavior equals learner-visible behavior.
import { DEFAULT_LOOP_BUDGET_MS, isScriptFile, normalizePath, transformProject, transformScript } from './transform.js';

export const RUN_DEFAULTS = {
  consoleLimit: { entries: 400, bytes: 200_000 },
  testTimeoutMs: 4000,
  settleTimeoutMs: 3000,
  storageLimitBytes: 200_000,
  loopBudgetMs: DEFAULT_LOOP_BUDGET_MS,
  readyTimeoutMs: 8000,
  heartbeatMs: 500,
  unresponsiveAfterMs: 2500,
};

const LIB_SETS = {
  'browser-js': [],
  'browser-react': ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  'concept-preview': ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-native'],
};
const LIB_FILES = {
  react: 'react.js',
  'react-dom': 'react-dom.js',
  'react-dom/client': 'react-dom-client.js',
  'react/jsx-runtime': 'react-jsx-runtime.js',
  'react/jsx-dev-runtime': 'react-jsx-dev-runtime.js',
  'react-native': 'react-native.js',
};

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Former marker for an <img> whose project file does not exist. prepareRun now leaves such a src
 *  untouched and the sandbox runtime reports `missing-file` itself; the runtime still understands
 *  the marker, and components/project imports it. */
export const MISSING_IMAGE_PREFIX = 'about:invalid#jsll-missing-file:';

function defaultHtml(entry, runtime, lang) {
  const root = runtime === 'browser-js' ? '' : '<div id="root"></div>';
  return `<!doctype html>\n<html lang="${lang}">\n<head>\n<meta charset="utf-8">\n<title>${escapeHtml(entry)}</title>\n</head>\n<body>\n${root}\n<script type="module" src="./${entry}"></script>\n</body>\n</html>\n`;
}

/**
 * Build the sandbox payload from project files.
 * @param {{files:Record<string,string>, entry:string, runtime:string, tests?:{path:string, source:string}|null,
 *          storage?:Record<string,string>, options?:object, sandboxOrigin:string, lang?:string}} input
 * @returns {{payload: Record<string, any>, meta: Record<string, any>} | {errors: any[]}}
 */
export function prepareRun(input) {
  const { entry, runtime, tests = null, sandboxOrigin, lang = 'uk' } = input;
  const options = { ...RUN_DEFAULTS, network: 'none', ...(input.options ?? {}) };
  const files = { ...input.files };
  const errors = [];
  const allowed = LIB_SETS[runtime] ?? [];
  const resolution = runtime === 'browser-js' ? 'strict' : 'bundler';
  if (!Object.prototype.hasOwnProperty.call(files, entry)) {
    return { errors: [{ kind: 'project', file: entry, message: `Entry file "${entry}" does not exist.`, code: 'missing-entry' }] };
  }

  const htmlPath = entry.endsWith('.html') ? entry : null;
  const htmlSource = htmlPath ? files[htmlPath] : defaultHtml(entry, runtime, lang);
  const baseDir = htmlPath && htmlPath.includes('/') ? htmlPath.slice(0, htmlPath.lastIndexOf('/')) : '';
  const fromHtml = (ref) => normalizePath(`${baseDir}/${ref}`);
  const doc = new DOMParser().parseFromString(htmlSource, 'text/html');
  const classicScripts = {};
  const inlineModules = {};
  const entryModules = [];
  let inlineCount = 0;

  for (const link of [...doc.querySelectorAll('link[rel~="stylesheet"][href]')]) {
    const href = link.getAttribute('href');
    if (/^[a-z]+:|^\/\//i.test(href)) continue; // external: blocked by the sandbox policy at run time
    const target = fromHtml(href);
    if (target !== null && Object.prototype.hasOwnProperty.call(files, target)) {
      const style = doc.createElement('style');
      style.setAttribute('data-file', target);
      style.textContent = files[target];
      link.replaceWith(style);
    } else errors.push({ kind: 'project', file: htmlPath ?? entry, message: `Stylesheet "${href}" was not found in the project.`, code: 'missing-file' });
  }

  // Project images (SVG files are text) are inlined as data: URLs, because the sandbox loads no
  // resources from the network: in <img src> and in url(...) of styles (an inline <style> resolves
  // against the page, an inlined stylesheet file against its own folder). A reference that matches
  // no project file stays exactly as written — a broken image shows its alt text, as in a real
  // browser — and the sandbox runtime explains in the console which file is missing.
  const svgData = (path) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(files[path])}`;
  const projectSvg = (ref, base) => {
    if (/^[a-z]+:|^\/\/|^#/i.test(ref)) return null;
    const target = normalizePath(`${base}/${ref.split(/[?#]/)[0]}`);
    return target !== null && Object.prototype.hasOwnProperty.call(files, target) && /\.svg$/i.test(target) ? target : null;
  };
  for (const img of [...doc.querySelectorAll('img[src]')]) {
    const target = projectSvg(img.getAttribute('src').trim(), baseDir);
    if (target) img.setAttribute('src', svgData(target));
  }
  for (const style of [...doc.querySelectorAll('style')]) {
    const file = style.getAttribute('data-file');
    const base = file === null ? baseDir : file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '';
    style.textContent = style.textContent.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (match, _quote, ref) => {
      const target = projectSvg(ref.trim(), base);
      return target ? `url("${svgData(target)}")` : match;
    });
  }

  for (const script of [...doc.querySelectorAll('script')]) {
    const type = (script.getAttribute('type') ?? '').trim().toLowerCase();
    if (type !== '' && type !== 'module' && type !== 'text/javascript') continue; // data blocks stay as they are
    const src = script.getAttribute('src');
    const isModule = type === 'module';
    if (src !== null && /^[a-z]+:|^\/\//i.test(src)) continue;
    if (src !== null) {
      const target = fromHtml(src);
      if (target === null || !Object.prototype.hasOwnProperty.call(files, target)) {
        errors.push({ kind: 'project', file: htmlPath ?? entry, message: `Script "${src}" was not found in the project.`, code: 'missing-file' });
        continue;
      }
      if (isModule) {
        script.removeAttribute('src');
        script.textContent = `import "~/${target}";`;
        entryModules.push(`~/${target}`);
      } else {
        const result = transformScript(target, files[target], { files, resolution, loopBudgetMs: options.loopBudgetMs, classic: true });
        if (result.error) errors.push(result.error);
        else {
          classicScripts[target] = result.code;
          script.setAttribute('src', `%%JSLL_CLASSIC:${target}%%`);
        }
      }
    } else if (script.textContent.trim() !== '') {
      inlineCount += 1;
      const virtual = `${htmlPath ?? 'index.html'}.inline-${inlineCount}.js`;
      if (isModule) {
        inlineModules[virtual] = script.textContent;
        script.textContent = `import "~/${virtual}";`;
        entryModules.push(`~/${virtual}`);
      } else {
        const result = transformScript(virtual, script.textContent, { files, resolution, loopBudgetMs: options.loopBudgetMs, classic: true });
        if (result.error) errors.push({ ...result.error, file: htmlPath ?? entry });
        else script.textContent = result.code.replace(/<\/script/gi, '<\\/script');
      }
    }
  }

  const moduleFiles = { ...files, ...inlineModules };
  if (tests) moduleFiles[tests.path] = tests.source;
  const scriptEntries = Object.keys(moduleFiles).filter((p) => isScriptFile(p) && !(tests && p === tests.path) && !Object.prototype.hasOwnProperty.call(classicScripts, p));
  const transformed = transformProject(
    Object.fromEntries(Object.entries(moduleFiles).filter(([p]) => !Object.prototype.hasOwnProperty.call(classicScripts, p))),
    { resolution, loopBudgetMs: options.loopBudgetMs, exportScopeFor: scriptEntries, allowedExternals: allowed, extraPlugins: options.extraPlugins ?? [] },
  );
  errors.push(...transformed.errors);
  if (errors.length > 0) return { errors };

  const libs = Object.fromEntries(allowed.map((spec) => [spec, `${sandboxOrigin}/sandbox/libs/${LIB_FILES[spec]}`]));
  const html = `<!doctype html>\n${doc.documentElement.outerHTML}`;
  const scopeFile = htmlPath ? scriptEntries.find((p) => !p.includes('.inline-')) ?? scriptEntries[0] : entry;
  return {
    payload: {
      html,
      modules: transformed.modules,
      classicScripts,
      libs,
      files,
      entryModules,
      scopeFile,
      tests: tests ? { path: tests.path } : null,
      storage: { local: input.storage ?? {} },
      options: {
        consoleLimit: options.consoleLimit,
        testTimeoutMs: options.testTimeoutMs,
        settleTimeoutMs: options.settleTimeoutMs,
        storageLimitBytes: options.storageLimitBytes,
        network: options.network,
        offscreen: options.offscreen === true,
        trace: options.trace === true,
        strings: options.strings ?? {},
        labOrigins: [sandboxOrigin],
      },
    },
    meta: { network: options.network, heartbeatMs: options.heartbeatMs, unresponsiveAfterMs: options.unresponsiveAfterMs, readyTimeoutMs: options.readyTimeoutMs },
  };
}

let frameCounter = 0;
let siteGeneration = 0;
// Some browsers (embedded browser panes among them) cannot load *.localhost subdomains. Then the
// sandbox moves to the IP host: 127.0.0.1 is never an application host (the server redirects it to
// localhost), so the sandbox stays a different site from the app at localhost or
// js-learning-lab.localhost.
let ipSandbox = false;
let sandboxSeen = false; // a sandbox frame said "ready" in this page, so its host works here
/** A frame that finished loading without the sandbox saying "ready" shows an error or blocked page. */
const LOADED_WITHOUT_READY_MS = 2000;

/**
 * Pick the sandbox origin. Each generation is a different *site* (jsll-run-N.localhost), so a frame
 * whose renderer got stuck never shares a process with the next run (spike: docs/evidence/M1).
 */
export function sandboxOriginFor(port, { ipFallback = false } = {}) {
  return ipFallback || ipSandbox ? `http://127.0.0.1:${port}` : `http://jsll-run-${siteGeneration}.localhost:${port}`;
}
export const nextSandboxSite = () => { siteGeneration += 1; };
/**
 * Call after a run failed with `sandbox-unreachable`. When the failing host was a *.localhost
 * sandbox host that never worked in this page, switch to the IP host and return true: the caller
 * prepares the run again (the payload names the origin) and retries once.
 */
export function fallBackToIpSandbox(failedOrigin) {
  if (ipSandbox || sandboxSeen || !/\.localhost:\d+$/.test(failedOrigin)) return false;
  ipSandbox = true;
  return true;
}

/**
 * One execution in a fresh frame.
 * events: ready | loaded | console | error | storage | tests | done | navigate | unresponsive | responsive | reloaded | failed
 */
export class SandboxRun {
  constructor({ container, sandboxOrigin, prepared, onEvent, visible = true, title = 'Result' }) {
    this.container = container;
    this.sandboxOrigin = sandboxOrigin;
    this.prepared = prepared;
    this.onEvent = onEvent;
    this.visible = visible;
    this.title = title;
    this.frameId = `f${Date.now().toString(36)}${(frameCounter += 1)}`;
    this.runId = this.frameId;
    this.nonce = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    this.state = 'idle'; // idle → booting → running → done | stopped | failed
    this.lastPong = 0;
    this.unresponsive = false;
    this.listener = (event) => this.#onMessage(event);
  }

  start() {
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts allow-forms');
    frame.setAttribute('title', this.title);
    frame.className = this.visible ? 'runner-frame' : 'runner-frame runner-frame-hidden';
    if (!this.visible) frame.setAttribute('aria-hidden', 'true');
    frame.src = `${this.sandboxOrigin}/sandbox/frame.html?id=${this.frameId}&net=${this.prepared.meta.network}`;
    this.frame = frame;
    this.state = 'booting';
    window.addEventListener('message', this.listener);
    // The sandbox says "ready" while its page is still parsing; a page that finished loading without
    // it is an error or blocked page (the host could not be reached): report that quickly.
    frame.addEventListener('load', () => {
      if (this.state !== 'booting' || this.frame !== frame) return;
      clearTimeout(this.loadTimer);
      this.loadTimer = setTimeout(() => { if (this.state === 'booting') this.#fail('sandbox-unreachable'); }, LOADED_WITHOUT_READY_MS);
    });
    this.container.replaceChildren(frame);
    this.readyTimer = setTimeout(() => {
      if (this.state === 'booting') this.#fail('sandbox-unreachable');
    }, this.prepared.meta.readyTimeoutMs);
  }

  #emit(type, data = {}) {
    this.onEvent?.({ type, runId: this.runId, ...data });
  }

  #fail(code) {
    this.state = 'failed';
    this.#cleanupTimers();
    this.#emit('failed', { code });
  }

  #cleanupTimers() {
    clearTimeout(this.readyTimer);
    clearTimeout(this.loadTimer);
    clearInterval(this.heartbeat);
  }

  #onMessage(event) {
    if (!this.frame || event.source !== this.frame.contentWindow) return;
    const message = event.data;
    if (!message || message.jsll !== 1) return;
    if (message.type === 'ready') {
      if (this.state === 'booting' && message.frameId === this.frameId) {
        clearTimeout(this.readyTimer);
        clearTimeout(this.loadTimer);
        sandboxSeen = true;
        this.state = 'running';
        this.lastPong = performance.now();
        this.frame.contentWindow.postMessage({ jsll: 1, frameId: this.frameId, type: 'run', payload: { ...this.prepared.payload, runId: this.runId, nonce: this.nonce } }, '*');
        let seq = 0;
        this.heartbeat = setInterval(() => {
          if (this.state !== 'running' && this.state !== 'done') return;
          const silent = performance.now() - this.lastPong;
          if (!this.unresponsive && silent > this.prepared.meta.unresponsiveAfterMs) {
            this.unresponsive = true;
            this.#emit('unresponsive', { silentMs: Math.round(silent) });
          }
          try {
            this.frame.contentWindow.postMessage({ jsll: 1, frameId: this.frameId, type: 'ping', seq: (seq += 1) }, '*');
          } catch {
            /* frame is gone */
          }
        }, this.prepared.meta.heartbeatMs);
        this.#emit('ready');
      } else if (this.state === 'running' || this.state === 'done') {
        // The frame document was replaced by a real navigation that slipped through.
        this.#emit('reloaded');
      }
      return;
    }
    if (message.frameId !== this.frameId || message.nonce !== this.nonce) return;
    if (message.type === 'pong') {
      this.lastPong = performance.now();
      if (this.unresponsive) {
        this.unresponsive = false;
        this.#emit('responsive');
      }
      return;
    }
    this.lastPong = performance.now();
    if (message.type === 'console') this.#emit('console', { entries: message.entries });
    else if (message.type === 'error') this.#emit('error', { error: message.error, phase: message.phase });
    else if (message.type === 'storage') this.#emit('storage', { local: message.local });
    else if (message.type === 'tests') this.#emit('tests', { results: message.results, harnessError: message.harnessError ?? null });
    else if (message.type === 'loaded') this.#emit('loaded');
    else if (message.type === 'trace') this.#emit('trace', { trace: message.trace });
    else if (message.type === 'navigate') this.#emit('navigate', { path: message.path });
    else if (message.type === 'done') {
      this.state = 'done';
      this.#emit('done');
    }
  }

  /**
   * Stop the run. Navigating to about:blank first makes Chrome drop a stuck renderer within ~1 s
   * (plain removal leaves it spinning for several seconds — spike-runner-kill.json).
   */
  stop({ keepFrame = false } = {}) {
    const wasStuck = this.unresponsive;
    this.#cleanupTimers();
    window.removeEventListener('message', this.listener);
    const frame = this.frame;
    this.frame = null;
    if (this.state !== 'failed') this.state = 'stopped';
    if (frame && !keepFrame) {
      try {
        frame.src = 'about:blank';
      } catch {
        /* ignore */
      }
      setTimeout(() => frame.remove(), 350);
      frame.style.display = 'none';
    }
    if (wasStuck) nextSandboxSite();
    return { wasStuck };
  }
}

/** Convenience for non-interactive callers: run to completion (or timeout) and collect everything. */
export function runToCompletion({ container, sandboxOrigin, prepared, timeoutMs = 15000, visible = false }) {
  if (!visible) prepared.payload.options.offscreen = true;
  return new Promise((resolve) => {
    const result = { console: [], errors: [], tests: null, harnessError: null, storage: null, status: 'running', loaded: false };
    let timer = null;
    const run = new SandboxRun({
      container,
      sandboxOrigin,
      prepared,
      visible,
      onEvent: (event) => {
        if (event.type === 'console') result.console.push(...event.entries);
        else if (event.type === 'error') result.errors.push({ ...event.error, phase: event.phase });
        else if (event.type === 'storage') result.storage = event.local;
        else if (event.type === 'loaded') result.loaded = true;
        else if (event.type === 'tests') {
          result.tests = event.results;
          result.harnessError = event.harnessError;
        } else if (event.type === 'done' || event.type === 'failed' || event.type === 'unresponsive') {
          result.status = event.type === 'done' ? 'done' : event.type === 'failed' ? `failed:${event.code}` : 'unresponsive';
          clearTimeout(timer);
          // Give trailing async console output a moment to arrive before tearing the frame down.
          setTimeout(() => { run.stop(); resolve(result); }, event.type === 'done' ? 30 : 0);
        }
      },
    });
    timer = setTimeout(() => {
      result.status = 'timeout';
      run.stop();
      resolve(result);
    }, timeoutMs);
    run.start();
  });
}
