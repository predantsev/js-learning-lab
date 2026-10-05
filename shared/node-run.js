// How an `isolated-node` block becomes a request to the local Node executor (POST /api/node/run,
// docs/platform/SERVER-API.md) and how the executor's NDJSON events become what the learner sees.
// Shared by the lesson UI and the content validator, so that what authors validate is exactly what
// learners execute (shared/exercise.js is the browser-sandbox counterpart).
import { TESTS_PATH, stringsFor } from './exercise.js';

export const NODE_RUN_PATH = '/api/node/run';
export const NODE_STOP_PATH = '/api/node/stop';

/**
 * Request body for a block. `capabilities` of the block map one to one: `network` ("none" |
 * "loopback"), `workers` (boolean), `timeoutMs` (wall clock of the whole run) and `testTimeoutMs`
 * (per check). Values the server does not accept are sent as they are and rejected there (400), so a
 * wrong declaration is never silently replaced by a default.
 */
export function nodeRunRequest(block, files, { mode = 'run', lang = 'uk' } = {}) {
  const caps = block.capabilities ?? {};
  const capabilities = { network: caps.network ?? 'none', workers: caps.workers ?? false };
  const body = { files, entry: block.entry, mode, capabilities };
  if (caps.timeoutMs !== undefined) body.timeoutMs = caps.timeoutMs;
  if (mode === 'test') {
    body.tests = { path: TESTS_PATH, source: block.tests ?? '' };
    if (caps.testTimeoutMs !== undefined) body.tests.timeoutMs = caps.testTimeoutMs;
    // Checks read the example text in the learner's language from `L`, as in the browser runner.
    body.strings = stringsFor(block, lang);
  }
  return body;
}

/**
 * Request body for a prediction or review question with `runtime: isolated-node`: its `code` (already
 * in the lesson language) runs as `index.js` in run mode, with the question's capabilities.
 */
export function nodeQuestionRequest(question, code) {
  return nodeRunRequest({ entry: 'index.js', capabilities: question.capabilities }, { 'index.js': code }, { mode: 'run' });
}

/**
 * What a run printed, as console lines in the order they were printed (stdout and stderr together),
 * without Node's report of an uncaught error at the end, plus that error (parseUncaughtError) or
 * null. `chunks`: [{ stream: 'stdout' | 'stderr', data }] in event order. This is what a Node
 * prediction's `verify: { logs, error }` is compared with.
 */
export function nodeOutputLines(chunks, cwd) {
  const stderr = chunks.filter((c) => c.stream === 'stderr').map((c) => c.data).join('');
  const error = parseUncaughtError(stderr, cwd);
  // Node writes the report last; it starts at the location block when there is one, else at the
  // "Name: message" line (the first line of error.stack).
  let reportAt = stderr.length;
  if (error) {
    const header = String(stderr.slice(0, TRAILER.exec(stderr).index)).lastIndexOf(`\n${error.name}`) + 1;
    let start = header;
    const before = stderr.slice(0, Math.max(0, header - 1)).split('\n');
    // "<file>:<line>" / source line / caret / blank line above the header.
    if (before.length >= 4 && before[before.length - 1].trim() === '' && CARET_LINE.test(before[before.length - 2]) && LOCATION_LINE.test(before[before.length - 4])) start = before.slice(0, -4).join('\n').length + (before.length > 4 ? 1 : 0);
    else if (header === 0 || stderr.startsWith(error.name)) start = header;
    reportAt = Math.max(0, start);
  }
  let text = '';
  let seenErr = 0;
  for (const c of chunks) {
    if (c.stream === 'stderr') {
      const keep = Math.max(0, Math.min(c.data.length, reportAt - seenErr));
      text += c.data.slice(0, keep);
      seenErr += c.data.length;
    } else text += c.data;
  }
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return { lines, error };
}

/** Read an NDJSON body (a WHATWG ReadableStream of bytes, in browsers and in Node) event by event. */
export async function readNdjson(body, onEvent) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const flush = () => {
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i);
      buffer = buffer.slice(i + 1);
      if (line.trim() !== '') onEvent(JSON.parse(line));
    }
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    flush();
  }
  buffer += decoder.decode();
  flush();
  if (buffer.trim() !== '') onEvent(JSON.parse(buffer));
}

/**
 * Paths inside the run's scratch workspace (the `cwd` of the `start` event) shown relative to the
 * exercise: `file:///…/node-runs/nr-…/index.js:3:7` → `index.js:3:7`. Display only.
 */
export function workspaceShortener(cwd) {
  if (typeof cwd !== 'string' || cwd === '') return (text) => text;
  const slashed = cwd.replace(/\\/g, '/');
  const prefixes = [...new Set([
    `file://${encodeURI(slashed.startsWith('/') ? slashed : `/${slashed}`)}/`,
    `file://${slashed.startsWith('/') ? slashed : `/${slashed}`}/`,
    `${cwd}/`,
    `${cwd}\\`,
    `${slashed}/`,
  ])].sort((a, b) => b.length - a.length);
  return (text) => {
    let out = String(text ?? '');
    for (const prefix of prefixes) out = out.split(prefix).join('');
    return out;
  };
}

const LOCATED = /\(?((?:file:\/\/)?(?:\/|[A-Za-z]:[\\/])[^\s()]*?):(\d+):(\d+)\)?\s*$/;
const LOCATION_LINE = /^(.+):(\d+)$/;
const CARET_LINE = /^\s*\^+\s*$/;
const TRAILER = /(?:^|\n)Node\.js v\d+\.\d+\.\d+[^\n]*\s*$/;
const HEADER = /^([A-Za-z_$][\w$]*)(?: \[([A-Z][A-Z0-9_]*)\])?: ([\s\S]*)$/;

/** A path printed by Node → the exercise-relative file, or null when it is outside the workspace. */
function learnerFile(printed, shorten) {
  const shown = shorten(printed);
  if (shown === printed) return null;
  try {
    return decodeURIComponent(shown);
  } catch {
    return shown;
  }
}

/**
 * Error that ended a run, from the stderr Node printed for an uncaught exception. Node's format is the
 * same on every supported version (checked on 22, 24 and 25): an optional location block (the
 * position, the source line, a caret line), then `error.stack`, then the error's own properties as
 * `{ code: …, … }`, then a blank line and `Node.js v<version>`. Without that last line the process
 * did not die of an uncaught error (it called process.exit or set process.exitCode): null.
 * @returns {null | {name:string, message:string, code?:string, file?:string, line?:number, column?:number, kind?:string, frame?:string, stack:string, phase:string}}
 */
export function parseUncaughtError(stderr, cwd) {
  const text = String(stderr ?? '');
  const trailer = TRAILER.exec(text);
  if (!trailer) return null;
  const shorten = workspaceShortener(cwd);
  const lines = text.slice(0, trailer.index).replace(/\s+$/, '').split('\n');
  let end = lines.length;

  // Own properties printed after the stack (`… {` … `}`): code, resource, permission…
  const props = {};
  let propLines = [];
  if (end > 0 && lines[end - 1] === '}') {
    let open = end - 2;
    while (open >= 0 && !/ \{$/.test(lines[open])) open -= 1;
    if (open >= 0) {
      propLines = lines.slice(open + 1, end - 1).map((l) => l.trim()).filter(Boolean);
      for (const line of propLines) {
        const m = /^([A-Za-z_$][\w$]*): (.*?),?$/.exec(line);
        if (m) props[m[1]] = m[2].replace(/^'(.*)'$/, '$1');
      }
      lines[open] = lines[open].replace(/ \{$/, '');
      end = open + 1;
    }
  }

  // The stack: consecutive "    at …" lines that end the printout.
  let stackStart = end;
  while (stackStart > 0 && /^\s+at /.test(lines[stackStart - 1])) stackStart -= 1;
  const stackLines = lines.slice(stackStart, end);

  // The location block above the message: "<where>:<line>", the source line, the caret line.
  let caret = -1;
  for (let i = stackStart - 1; i >= Math.max(0, stackStart - 60); i -= 1) {
    if (CARET_LINE.test(lines[i]) && i >= 2 && LOCATION_LINE.test(lines[i - 2])) {
      caret = i;
      break;
    }
  }
  let messageLines;
  if (caret >= 0) messageLines = lines.slice(caret + 1, stackStart);
  else {
    // No location block: the message is the paragraph right above the stack.
    let start = stackStart;
    while (start > 0 && lines[start - 1].trim() !== '') start -= 1;
    messageLines = lines.slice(start, stackStart);
  }
  messageLines = messageLines.filter((l) => !/^\(Use `node --trace-uncaught/.test(l));
  while (messageLines.length > 0 && messageLines[0].trim() === '') messageLines.shift();
  while (messageLines.length > 0 && messageLines[messageLines.length - 1].trim() === '') messageLines.pop();
  const header = messageLines.join('\n');
  const parsed = HEADER.exec(header);
  const name = parsed ? parsed[1] : 'Error';
  const code = parsed?.[2] ?? (props.code && /^[A-Z][A-Z0-9_]*$/.test(props.code) ? props.code : undefined);
  const message = shorten(parsed ? parsed[3] : header || 'The program stopped because of an uncaught error.');

  // Where in the learner's files: the first stack frame inside the workspace, otherwise the location
  // block (a parse error has no learner frame, only the location of the bad token).
  let where = null;
  for (const line of stackLines) {
    const m = LOCATED.exec(line);
    const file = m ? learnerFile(m[1], shorten) : null;
    if (file) {
      where = { file, line: Number(m[2]), column: Number(m[3]) };
      break;
    }
  }
  let frame;
  let atBlock = null;
  if (caret >= 0) {
    const m = LOCATION_LINE.exec(lines[caret - 2]);
    const file = learnerFile(m[1], shorten);
    if (file) {
      atBlock = { file, line: Number(m[2]), column: lines[caret].indexOf('^') + 1 };
      frame = `${lines[caret - 1]}\n${lines[caret]}`;
    }
  }
  const kind = name === 'SyntaxError' && where === null && atBlock !== null && !isModuleLinkMessage(message) ? 'syntax' : undefined;
  where = where ?? atBlock;
  if (frame === undefined && propLines.length > 0) frame = shorten(propLines.map((l) => l.replace(/,$/, '')).join('\n'));
  return {
    name,
    message,
    ...(code ? { code } : {}),
    ...(where ?? {}),
    ...(kind ? { kind } : {}),
    ...(frame ? { frame } : {}),
    stack: shorten(stackLines.join('\n')),
    phase: 'uncaught',
  };
}

/** A harness error description (test mode) in the learner's terms: exercise-relative paths. */
export function harnessErrorView(error, shorten = (t) => t, phase = 'load') {
  if (!error) return null;
  const out = { name: String(error.name ?? 'Error'), message: shorten(String(error.message ?? '')), phase };
  if (typeof error.code === 'string') out.code = error.code;
  if (typeof error.file === 'string') out.file = error.file;
  if (Number.isFinite(error.line)) out.line = error.line;
  if (Number.isFinite(error.column)) out.column = error.column;
  if (typeof error.stack === 'string') out.stack = shorten(error.stack);
  return out;
}

/**
 * The message of a module-linking SyntaxError: an import names an export the module does not have.
 * Node words it in two ways (measured on 22.13.1, 22.23.3 and 25.2.1): "The requested module './x.js'
 * does not provide an export named 'y'" for an ES module, and "Named export 'y' not found. The
 * requested module './x.cjs' is a CommonJS module, …" for a CommonJS module — on Node 22 always, on
 * Node 25 when the import sits in the entry file (an imported module gets the first wording there).
 */
export function isModuleLinkMessage(message) {
  return /does not provide an export named|^Named export '[^']*' not found\. The requested module /.test(String(message ?? ''));
}

/**
 * A parse error in a learner file (not in the checks): the code could not start, which the browser
 * runner reports before running ("compile error"). A missing export is a link problem, not a parse
 * error, and stays a load error.
 */
export function isLearnerSyntaxError(error) {
  return Boolean(error) && error.name === 'SyntaxError' && typeof error.file === 'string' && error.file !== TESTS_PATH && !isModuleLinkMessage(error.message);
}

/**
 * The `tests` event of a check run, with exercise-relative paths. `errors` lists every error outside
 * the checks in the order the learner should read them: uncaught errors while the program loaded,
 * then the entry's own import error, then later uncaught errors. Errors of the loading phase carry
 * `atLoad: true` (the browser runner marks errors before its `loaded` event the same way).
 */
export function testsOutcome(event, shorten = (t) => t) {
  const results = (event?.results ?? []).map((r) => ({
    name: String(r.name),
    status: r.status === 'pass' ? 'pass' : 'fail',
    ...(r.message !== undefined ? { message: shorten(String(r.message)) } : {}),
    ...(r.errorName !== undefined ? { errorName: r.errorName } : {}),
    ...(r.stack !== undefined ? { stack: shorten(String(r.stack)) } : {}),
    ...(Number.isFinite(r.ms) ? { ms: r.ms } : {}),
  }));
  const loadError = harnessErrorView(event?.loadError, shorten, 'load');
  const uncaught = (event?.errors ?? []).map((e) => ({ ...harnessErrorView(e, shorten, e.phase === 'load' ? 'load' : 'uncaught'), ...(e.phase === 'load' ? { atLoad: true } : {}) }));
  const errors = [...uncaught.filter((e) => e.atLoad), ...(loadError ? [{ ...loadError, atLoad: true }] : []), ...uncaught.filter((e) => !e.atLoad)];
  return { results, harnessError: harnessErrorView(event?.harnessError, shorten, 'harness'), loadError, errors };
}
