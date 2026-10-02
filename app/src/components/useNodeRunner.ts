// React binding for the isolated Node.js executor (POST /api/node/run, docs/platform/SERVER-API.md).
// Same contract as useRunner (state, start, stop, reset, isActive), so the lesson workspace picks one
// by the block's runtime. Output streams into the console as Node prints it; Check runs the block's
// tests.js through the server harness. Every outcome keeps the learner's code and says plainly what
// happened: time limit, output limit, busy, lost connection, unavailable (REQ-022, REQ-023, REQ-032).
import { useCallback, useEffect, useRef, useState } from 'react';
import { NODE_RUN_PATH, NODE_STOP_PATH, isLearnerSyntaxError, nodeRunRequest, parseUncaughtError, testsOutcome, workspaceShortener } from '@shared/node-run.js';
import { api, boot } from '../lib/api';
import type { Key } from '../lib/i18n';
import type { ConsoleEntry, RunError, TestResult } from '../lib/types';
import { app } from '../state/app';
import type { RunState, StartOptions } from './useRunner';

/** A status sentence for outcomes the browser runner does not have (shown instead of the plain status). */
export interface NodeNotice { key: Key; params?: Record<string, string | number> }
export type NodeRunState = RunState & { notice?: NodeNotice | null };

export interface NodeFeature {
  available: boolean;
  reason?: string;
  node?: string;
  osSandbox?: { kind: string | null; active: boolean };
  limits?: { timeoutMs?: { default: number; max: number }; outputBytes?: number; heapMb?: number };
  limitations?: string[];
}
/** What the server proved about Node isolation on this machine (GET /api/bootstrap). */
export const nodeFeature = (): NodeFeature => (app().bootstrap.features.isolatedNode as NodeFeature | undefined) ?? { available: false, reason: 'The local server did not report the Node.js runtime.' };

// Phases of errors reported by the Node runtime (shared/node-run.js); browser errors use others.
const NODE_PHASES = new Set(['uncaught', 'load', 'harness']);

/** Localized guidance for errors only Node reports (codes of the permission model, the platform guard, module resolution). */
export function nodeGuidanceKey(error: RunError): Key | null {
  if (error.code === 'ERR_ACCESS_DENIED') return 'err.guide.node.access';
  if (error.code === 'ERR_JSLL_POLICY') return 'err.guide.node.policy';
  if (error.code === 'ERR_MODULE_NOT_FOUND' || error.code === 'ERR_UNSUPPORTED_DIR_IMPORT' || error.code === 'ERR_UNKNOWN_FILE_EXTENSION') return 'err.guide.node.import';
  if (NODE_PHASES.has(error.phase ?? '') && /does not provide an export named|require is not defined in ES module scope/.test(error.message ?? '')) return 'err.guide.node.import';
  return null;
}

type StreamResult = { kind: 'stream' } | { kind: 'refused'; status: number; data: { error?: string; message?: string } };

/**
 * POST a run and deliver its NDJSON events as they arrive. XMLHttpRequest rather than fetch: Chrome
 * reports a fetch body that a stream reader read to its end as an aborted request whenever the reader
 * finishes before the load completes (measured: net::ERR_ABORTED in the DevTools protocol for a fully
 * read body), while XHR progress events stream the same text and the load completes normally.
 * Resolves `stream` once the response ended (normally or cut off), `refused` (status 0 = the server
 * could not be reached) when no event stream was opened.
 */
function streamRun(body: unknown, onEvent: (event: { type: string; [k: string]: unknown }) => void): Promise<StreamResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let offset = 0;
    let buffer = '';
    let opened = false;
    const consume = () => {
      if (!opened) opened = xhr.status === 200 && (xhr.getResponseHeader('content-type') ?? '').startsWith('application/x-ndjson');
      if (!opened) return;
      const text = xhr.responseText;
      buffer += text.slice(offset);
      offset = text.length;
      let i;
      while ((i = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, i);
        buffer = buffer.slice(i + 1);
        if (line.trim() === '') continue;
        let event: { type: string; [k: string]: unknown } | null = null;
        try {
          event = JSON.parse(line);
        } catch {
          /* not an event line */
        }
        if (event) onEvent(event);
      }
    };
    const settle = () => {
      if (opened) return resolve({ kind: 'stream' });
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        /* not JSON */
      }
      return resolve({ kind: 'refused', status: xhr.status, data });
    };
    xhr.open('POST', NODE_RUN_PATH);
    xhr.setRequestHeader('x-jsll-token', boot.token);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onprogress = consume;
    xhr.onload = () => { consume(); settle(); };
    xhr.onerror = settle;
    xhr.onabort = settle;
    xhr.send(JSON.stringify(body));
  });
}

const initial: NodeRunState = { status: 'idle', mode: null, console: [], errors: [], compileErrors: [], tests: null, harnessError: null, unresponsive: false, failure: null, runCount: 0, live: false, notice: null };
const MAX_CONSOLE = 1000;
const STDERR_KEEP = 256 * 1024;

interface ActiveRun {
  runId: string | null;
  cwd: string;
  shorten: (text: string) => string;
  partial: { stdout: string; stderr: string };
  stderr: string;
  tests: unknown;
  /** The learner pressed Stop (or a newer run replaced this one): no outcome, no progress record. */
  stopped: boolean;
  /** Replaced or unmounted: drain the stream silently. */
  detached: boolean;
  finished: boolean;
}

export function useNodeRunner() {
  const [state, setState] = useState<NodeRunState>(initial);
  const active = useRef<ActiveRun | null>(null);

  const stopRemote = (run: ActiveRun) => {
    // Ending the run through the API lets its stream finish normally (no aborted request).
    if (run.runId) void api('POST', NODE_STOP_PATH, { runId: run.runId }).catch(() => {});
  };

  /** Leave the current run: stop its process if it still runs, ignore what it still sends. */
  const teardown = useCallback(() => {
    const run = active.current;
    active.current = null;
    if (!run || run.finished) return;
    run.detached = true;
    run.stopped = true;
    stopRemote(run); // without a runId yet, the "start" handler stops it as soon as it arrives
  }, []);

  useEffect(() => teardown, [teardown]);

  const stop = useCallback(() => {
    const run = active.current;
    if (!run || run.finished) return;
    run.stopped = true;
    stopRemote(run);
    // The stream still delivers the last output and the exit event; the status is final already.
    setState((s) => ({ ...s, status: 'stopped', notice: null }));
  }, []);

  const start = useCallback((options: StartOptions) => {
    teardown();
    const mode = options.mode;
    const feature = nodeFeature();
    if (!feature.available) {
      setState((s) => ({ ...initial, runCount: s.runCount + 1, mode, status: 'failed', notice: { key: 'ws.nodeUnavailable', params: { reason: feature.reason ?? '' } } }));
      return;
    }
    const run: ActiveRun = { runId: null, cwd: '', shorten: (text) => text, partial: { stdout: '', stderr: '' }, stderr: '', tests: null, stopped: false, detached: false, finished: false };
    active.current = run;
    setState((s) => ({ ...initial, runCount: s.runCount + 1, mode, status: mode === 'test' ? 'checking' : 'running', live: true }));
    const body = nodeRunRequest(options.block, options.files, { mode, lang: options.lang });
    const timeoutS = Math.round((options.block.capabilities?.timeoutMs ?? feature.limits?.timeoutMs?.default ?? 10_000) / 1000);
    const mine = () => active.current === run && !run.detached;
    const end = (patch: Partial<NodeRunState>) => {
      run.finished = true;
      if (mine()) setState((s) => ({ ...s, live: false, ...(run.stopped ? { status: 'stopped', notice: null } : patch) }));
    };

    const lines = (stream: 'stdout' | 'stderr', text: string): ConsoleEntry[] => text.split('\n').map((line) => ({ level: stream === 'stderr' ? 'error' : 'log', args: [{ t: 'string', v: run.shorten(line) }], at: Date.now() }));
    const append = (entries: ConsoleEntry[]) => {
      if (entries.length > 0 && mine()) setState((s) => ({ ...s, console: [...s.console, ...entries].slice(-MAX_CONSOLE) }));
    };
    const output = (stream: 'stdout' | 'stderr', data: string) => {
      if (stream === 'stderr') run.stderr = (run.stderr + data).slice(-STDERR_KEEP);
      const other = stream === 'stdout' ? 'stderr' : 'stdout';
      const entries: ConsoleEntry[] = [];
      // A half line of the other stream is shown first, so the order of the two streams holds.
      if (run.partial[other] !== '') {
        entries.push(...lines(other, run.partial[other]));
        run.partial[other] = '';
      }
      const parts = (run.partial[stream] + data).split('\n');
      run.partial[stream] = parts.pop() ?? '';
      if (parts.length > 0) entries.push(...lines(stream, parts.join('\n')));
      append(entries);
    };
    const flushPartials = () => {
      const entries: ConsoleEntry[] = [];
      for (const stream of ['stdout', 'stderr'] as const) {
        if (run.partial[stream] !== '') entries.push(...lines(stream, run.partial[stream]));
        run.partial[stream] = '';
      }
      append(entries);
    };

    const conclude = (exit: { code: number | null; signal: string | null; reason: string; error?: string }) => {
      flushPartials();
      if (run.stopped || exit.reason === 'stopped') return end({ status: 'stopped', notice: null });
      if (exit.reason !== 'exited') {
        const limits = feature.limits ?? {};
        const notice: NodeNotice = {
          timeout: { key: 'ws.node.timeout', params: { s: timeoutS } } as NodeNotice,
          'output-limit': { key: 'ws.node.outputLimit', params: { kb: Math.round((limits.outputBytes ?? 200 * 1024) / 1024) } } as NodeNotice,
          'workspace-limit': { key: 'ws.node.workspaceLimit' } as NodeNotice,
          crashed: { key: 'ws.node.crashed', params: { signal: exit.signal ?? '?' } } as NodeNotice,
          'spawn-failed': { key: 'ws.node.spawnFailed', params: { detail: exit.error ?? '' } } as NodeNotice,
        }[exit.reason] ?? { key: 'ws.node.disconnected' };
        const limit = exit.reason === 'timeout' || exit.reason === 'output-limit' || exit.reason === 'workspace-limit';
        end({ status: limit ? 'auto-stopped' : 'failed', notice });
        // A check ended by a limit or a crash is a real failed attempt: the learner's code caused it.
        if (mode === 'test' && exit.reason !== 'disconnected' && exit.reason !== 'spawn-failed') options.onTests?.([], { name: 'HarnessError', message: exit.reason }, []);
        return undefined;
      }
      if (mode === 'run') {
        const error = exit.code !== 0 ? (parseUncaughtError(run.stderr, run.cwd) as RunError | null) : null;
        if (error?.kind === 'syntax') return end({ status: 'compile-error', compileErrors: [error] });
        if (error) return end({ status: 'done', errors: [error] });
        return end({ status: 'done', notice: exit.code !== 0 && exit.code !== null ? { key: 'ws.node.exitCode', params: { code: exit.code } } : null });
      }
      const outcome = testsOutcome(run.tests, run.shorten);
      const harnessError = outcome.harnessError as RunError | null;
      const errors = outcome.errors as RunError[];
      // A parse error in a learner file: the code could not start (as a compile error in the browser).
      const syntax = [harnessError, ...errors].find((e) => isLearnerSyntaxError(e));
      if (syntax) return end({ status: 'compile-error', compileErrors: [{ ...syntax, kind: 'syntax' }] });
      const results = outcome.results as TestResult[];
      end({ status: 'done', tests: results, harnessError, errors });
      options.onTests?.(results, harnessError, errors);
      return undefined;
    };

    const received: { exit: Parameters<typeof conclude>[0] | null; any: boolean } = { exit: null, any: false };
    const onEvent = (event: { type: string; [k: string]: unknown }) => {
      received.any = true;
      if (event.type === 'start') {
        run.runId = String(event.runId);
        run.cwd = String(event.cwd ?? '');
        run.shorten = workspaceShortener(run.cwd);
        if (run.stopped) stopRemote(run);
      } else if (event.type === 'stdout' || event.type === 'stderr') output(event.type, String(event.data ?? ''));
      else if (event.type === 'tests') run.tests = event;
      else if (event.type === 'exit') received.exit = event as unknown as Parameters<typeof conclude>[0];
    };
    void streamRun(body, onEvent).then((response) => {
      if (response.kind === 'refused') {
        const { status, data } = response;
        if (status === 0) return end({ status: 'failed', notice: { key: 'ws.node.unreachable' } });
        if (status === 429) return end({ status: 'failed', notice: { key: 'ws.node.busy' } });
        if (status === 501) return end({ status: 'failed', notice: { key: 'ws.nodeUnavailable', params: { reason: data.message ?? '' } } });
        if (status === 400 || status === 413) return end({ status: 'failed', notice: { key: 'ws.node.rejected', params: { detail: data.message ?? `HTTP ${status}` } } });
        return end({ status: 'failed', notice: { key: 'ws.node.serverError', params: { detail: `HTTP ${status}${data.message ? `: ${data.message}` : ''}` } } });
      }
      if (received.exit === null) {
        flushPartials();
        return end({ status: 'failed', notice: { key: received.any ? 'ws.node.disconnected' : 'ws.node.unreachable' } });
      }
      return conclude(received.exit);
    });
  }, [teardown]);

  const reset = useCallback(() => { teardown(); setState(initial); }, [teardown]);
  return { state, start, stop, reset, isActive: state.status === 'running' || state.status === 'checking' };
}
