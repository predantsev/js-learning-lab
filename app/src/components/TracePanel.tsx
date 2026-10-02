// "Steps" result tab: the learner's own code, run with the execution tracer, in the code-trace
// player (content/VISUALS.md, section 4.1 "Run time"). Loaded lazily with the visual players.
import { type ReactNode, useMemo } from 'react';
import { traceToSpec } from '@shared/visuals/kinds/code-trace.js';
import type { Lang } from '../lib/types';
import { useT } from '../state/app';
import { VISUAL_LABELS, VisualPlayer, type CodeTraceSpec } from '../visuals';
import type { RunState } from './useRunner';

export default function TracePanel({ state, files, entry, lang, children }: { state: RunState; files: Record<string, string> | null; entry: string; lang: Lang; children?: ReactNode }) {
  const t = useT();
  // Project files plus the inline module scripts of an HTML page (virtual paths, see prepareRun).
  const spec = useMemo(() => {
    if (!state.trace || !files) return null;
    const sources = (state.trace as { sources?: Record<string, string> }).sources ?? {};
    return traceToSpec(state.trace, { ...files, ...sources }, entry) as CodeTraceSpec;
  }, [state.trace, files, entry]);
  if (state.status === 'compile-error') {
    const syntax = state.compileErrors.some((e) => e.kind === 'syntax');
    return <div className="trace-panel" data-trace="not-run"><p className="ws-note" role="status">{t(syntax ? 'ws.traceSyntax' : 'ws.traceNotRun')}</p>{children}</div>;
  }
  if (state.status === 'running' && !spec) return <p className="ws-empty" role="status" data-trace="running">{t('ws.traceRunning')}</p>;
  if (state.status === 'failed') return <p className="ws-note" role="status" data-trace="failed">{t('ws.sandboxUnreachable')}</p>;
  if (state.status === 'auto-stopped' || state.status === 'stopped' || state.status === 'reloaded') return <p className="ws-note" role="status" data-trace="stopped">{t('ws.traceStopped')}</p>;
  if (!spec) return state.status === 'done' ? <p className="ws-note" role="status" data-trace="none">{t('ws.traceNone')}</p> : null;
  if (spec.steps.length === 0) return <p className="ws-note" role="status" data-trace="none">{t('ws.traceNone')}</p>;
  return (
    <div className="trace-panel" data-trace="ready">
      {spec.truncated ? <p className="ws-note" role="status" data-role="trace-truncated">{t('ws.traceTruncated', { n: spec.steps.length })}</p> : null}
      {spec.error ? <p className="ws-note" data-role="trace-error">{t('ws.traceError', { error: `${spec.error.name}: ${spec.error.message}` })}</p> : null}
      {/* A new run starts at its first step. */}
      <VisualPlayer key={state.runCount} visual="code-trace" spec={spec} lang={lang} labels={VISUAL_LABELS[lang]} title={t('ws.steps')} />
    </div>
  );
}
