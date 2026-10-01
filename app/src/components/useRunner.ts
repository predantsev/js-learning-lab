// React binding for the sandbox controller: one active run at a time, honest status,
// stop that always works, automatic stop after a declared unresponsive timeout (REQ-022).
import { useCallback, useEffect, useRef, useState } from 'react';
import { runInputForBlock } from '@shared/exercise.js';
import { SandboxRun, prepareRun, sandboxOriginFor } from '@shared/runner.js';
import { boot } from '../lib/api';
import type { ConsoleEntry, ExampleBlock, ExerciseBlock, Lang, RunError, TestResult } from '../lib/types';

export type RunStatus = 'idle' | 'running' | 'checking' | 'done' | 'stopped' | 'auto-stopped' | 'failed' | 'compile-error' | 'reloaded';
export interface RunState {
  status: RunStatus;
  mode: 'run' | 'test' | null;
  console: ConsoleEntry[];
  errors: RunError[];
  compileErrors: RunError[];
  tests: TestResult[] | null;
  harnessError: RunError | null;
  unresponsive: boolean;
  failure: string | null;
  runCount: number;
  live: boolean;
}

export const AUTO_STOP_AFTER_MS = 8000;
const initial: RunState = { status: 'idle', mode: null, console: [], errors: [], compileErrors: [], tests: null, harnessError: null, unresponsive: false, failure: null, runCount: 0, live: false };
const MAX_CONSOLE = 600;

export interface StartOptions {
  block: ExampleBlock | ExerciseBlock;
  files: Record<string, string>;
  mode: 'run' | 'test';
  storage: Record<string, string>;
  lang: Lang;
  container: HTMLElement;
  title: string;
  onStorage?: (local: Record<string, string>) => void;
  onTests?: (results: TestResult[], harnessError: RunError | null, errors: RunError[]) => void;
  onNavigate?: (path: string) => void;
  entryOverride?: string;
}

export function useRunner() {
  const [state, setState] = useState<RunState>(initial);
  const active = useRef<SandboxRun | null>(null);
  const autoStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorsRef = useRef<RunError[]>([]);

  const teardown = useCallback(() => {
    if (autoStop.current) clearTimeout(autoStop.current);
    autoStop.current = null;
    active.current?.stop();
    active.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  const stop = useCallback(() => {
    if (!active.current) return;
    teardown();
    setState((s) => ({ ...s, status: 'stopped', unresponsive: false, live: false }));
  }, [teardown]);

  const start = useCallback(
    (options: StartOptions) => {
      teardown();
      errorsRef.current = [];
      const sandboxOrigin = sandboxOriginFor(boot.port);
      const input = runInputForBlock(options.entryOverride ? { ...options.block, entry: options.entryOverride } : options.block, options.files, { mode: options.mode, storage: options.storage, lang: options.lang });
      const prepared = prepareRun({ ...input, sandboxOrigin });
      if ('errors' in prepared) {
        setState((s) => ({ ...initial, runCount: s.runCount + 1, status: 'compile-error', mode: options.mode, compileErrors: prepared.errors as RunError[] }));
        return;
      }
      const visible = options.mode === 'run';
      if (!visible) prepared.payload.options.offscreen = true;
      setState((s) => ({ ...initial, runCount: s.runCount + 1, status: options.mode === 'test' ? 'checking' : 'running', mode: options.mode, live: true }));
      const run = new SandboxRun({
        container: options.container,
        sandboxOrigin,
        prepared,
        visible,
        title: options.title,
        onEvent: (event: { type: string; [k: string]: unknown }) => {
          if (active.current !== run) return;
          switch (event.type) {
            case 'console':
              setState((s) => ({ ...s, console: [...s.console, ...(event.entries as ConsoleEntry[])].slice(-MAX_CONSOLE) }));
              break;
            case 'error': {
              const error = { ...(event.error as RunError), phase: event.phase as string };
              errorsRef.current = [...errorsRef.current, error];
              setState((s) => ({ ...s, errors: [...s.errors, error].slice(-20) }));
              break;
            }
            case 'storage':
              options.onStorage?.(event.local as Record<string, string>);
              break;
            case 'tests':
              setState((s) => ({ ...s, tests: event.results as TestResult[], harnessError: (event.harnessError as RunError | null) ?? null }));
              options.onTests?.(event.results as TestResult[], (event.harnessError as RunError | null) ?? null, errorsRef.current);
              break;
            case 'navigate':
              options.onNavigate?.(event.path as string);
              break;
            case 'unresponsive':
              setState((s) => ({ ...s, unresponsive: true }));
              autoStop.current = setTimeout(() => {
                if (active.current !== run) return;
                teardown();
                setState((s) => ({ ...s, status: 'auto-stopped', unresponsive: false, live: false }));
              }, AUTO_STOP_AFTER_MS);
              break;
            case 'responsive':
              if (autoStop.current) clearTimeout(autoStop.current);
              setState((s) => ({ ...s, unresponsive: false }));
              break;
            case 'reloaded':
              teardown();
              setState((s) => ({ ...s, status: 'reloaded', live: false }));
              break;
            case 'failed':
              teardown();
              setState((s) => ({ ...s, status: 'failed', failure: event.code as string, live: false }));
              break;
            case 'done':
              // A check run has nothing left to show; an interactive run stays alive for the preview.
              if (options.mode === 'test') { active.current?.stop(); active.current = null; }
              setState((s) => ({ ...s, status: 'done', live: options.mode === 'run' }));
              break;
            default:
              break;
          }
        },
      });
      active.current = run;
      run.start();
    },
    [teardown],
  );

  const reset = useCallback(() => { teardown(); setState(initial); }, [teardown]);
  return { state, start, stop, reset, isActive: state.status === 'running' || state.status === 'checking' };
}
