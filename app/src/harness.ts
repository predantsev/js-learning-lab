// Non-interactive entry to the real runner (same controller + sandbox as the lesson UI).
import { SandboxRun, prepareRun, runToCompletion, sandboxOriginFor } from '@shared/runner.js';

type RunInput = {
  files: Record<string, string>;
  entry: string;
  runtime: string;
  tests?: { path: string; source: string } | null;
  storage?: Record<string, string>;
  options?: Record<string, unknown>;
  timeoutMs?: number;
  lang?: string;
};

const port = Number(location.port);
let stageCount = 0;

async function runProject(input: RunInput) {
  const sandboxOrigin = sandboxOriginFor(port);
  const prepared = prepareRun({ ...input, sandboxOrigin });
  if ('errors' in prepared) return { status: 'compile-error', compileErrors: prepared.errors, console: [], errors: [], tests: null };
  const container = document.createElement('div');
  container.id = `stage-${(stageCount += 1)}`;
  document.getElementById('stage')!.append(container);
  const result = await runToCompletion({ container, sandboxOrigin, prepared, timeoutMs: input.timeoutMs ?? 15000, visible: false });
  setTimeout(() => container.remove(), 600);
  return result;
}

Object.assign(window, { jsll: { runProject, prepareRun, SandboxRun, sandboxOriginFor, port } });
document.documentElement.dataset.harness = 'ready';
