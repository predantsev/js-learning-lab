// Practice pane: editor + real result (page, console, checks, storage) for an example or exercise.
// Learner files are never overwritten by feedback, hints or the solution (REQ-018, REQ-019).
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { localizeFiles } from '@shared/exercise.js';
import type { Doc } from '../lib/persist';
import { type Key } from '../lib/i18n';
import { recordExampleRun, recordExerciseCheck } from '../lib/progress';
import { useStore } from '../lib/store';
import type { ConsoleEntry, ConsoleValue, DraftsDoc, ExampleBlock, ExerciseBlock, Lang, Lesson, RunError, TestResult } from '../lib/types';
import { app, useT } from '../state/app';
import { CodeEditor, type EditorIssue } from './CodeEditor';
import { Html, Icon, announce } from './ui';
import { AUTO_STOP_AFTER_MS, type RunState, useRunner } from './useRunner';

type WsBlock = ExampleBlock | ExerciseBlock;
type Tab = 'preview' | 'console' | 'tests' | 'storage';

const hasPreview = (block: WsBlock): boolean => block.preview ?? (block.entry.endsWith('.html') || block.runtime === 'browser-react' || block.runtime === 'concept-preview');

function Value({ v, nested = false }: { v: ConsoleValue; nested?: boolean }) {
  switch (v.t) {
    case 'string': return <span className={nested ? 'cv-string' : undefined}>{nested ? JSON.stringify(v.v) : String(v.v)}</span>;
    case 'number': case 'bigint': return <span className="cv-number">{String(v.v)}</span>;
    case 'boolean': return <span className="cv-number">{String(v.v)}</span>;
    case 'null': case 'undefined': return <span className="cv-dim">{v.t}</span>;
    case 'symbol': case 'date': case 'regexp': return <span className="cv-number">{String(v.v)}</span>;
    case 'function': return <span className="cv-fn">{v.cls ? `class ${String(v.name)}` : `ƒ ${String(v.name) || '(anonymous)'}()`}</span>;
    case 'array': {
      const items = v.items as ConsoleValue[];
      return <span>[{items.map((x, i) => <span key={i}>{i > 0 && ', '}<Value v={x} nested /></span>)}{(v.length as number) > items.length && ', …'}]</span>;
    }
    case 'object': {
      const entries = v.entries as [string, ConsoleValue][];
      return <span>{v.ctor && v.ctor !== 'Object' ? <span className="cv-dim">{String(v.ctor)} </span> : null}{'{'}{entries.map(([k, x], i) => <span key={k}>{i > 0 && ', '}<span className="cv-key">{k}</span>: <Value v={x} nested /></span>)}{v.more ? ', …' : ''}{'}'}</span>;
    }
    case 'map': return <span><span className="cv-dim">Map({String(v.size)}) </span>{'{'}{(v.entries as [ConsoleValue, ConsoleValue][]).map(([k, x], i) => <span key={i}>{i > 0 && ', '}<Value v={k} nested /> =&gt; <Value v={x} nested /></span>)}{'}'}</span>;
    case 'set': return <span><span className="cv-dim">Set({String(v.size)}) </span>{'{'}{(v.items as ConsoleValue[]).map((x, i) => <span key={i}>{i > 0 && ', '}<Value v={x} nested /></span>)}{'}'}</span>;
    case 'error': return <span className="cv-error">{String(v.name)}: {String(v.message)}</span>;
    case 'node': return <span className="cv-key">{String(v.v)}</span>;
    case 'typed': return <span><span className="cv-dim">{String(v.name)}({String(v.length)}) </span>[{(v.items as number[]).join(', ')}]</span>;
    case 'promise': return <span className="cv-dim">Promise</span>;
    case 'circular': return <span className="cv-dim">[Circular]</span>;
    case 'empty': return <span className="cv-dim">&lt;empty&gt;</span>;
    case 'accessor': return <span className="cv-dim">[Getter/Setter]</span>;
    default: return <span className="cv-dim">{String(v.name ?? v.t)}</span>;
  }
}

function ConsoleView({ entries, errors }: { entries: ConsoleEntry[]; errors: RunError[] }) {
  const t = useT();
  if (entries.length === 0 && errors.length === 0) return <p className="ws-empty">{t('ws.consoleEmpty')}</p>;
  return (
    <ol className="console" aria-label={t('ws.console')}>
      {entries.map((entry, i) => entry.level === 'system'
        ? <li key={i} className="console-line console-system"><Icon name="info" size={14} /><span>{t(`sys.${entry.code}` as Key, { detail: entry.detail ?? '' })}</span></li>
        : <li key={i} className={`console-line console-${entry.level}`}>{entry.level === 'alert' && <span className="console-tag">{t('sys.alert')}</span>}{entry.args.map((a, j) => <span key={j} className="console-arg"><Value v={a} /></span>)}</li>)}
    </ol>
  );
}

export function guidanceKey(error: RunError): Key {
  if (error.kind === 'syntax') return 'err.guide.syntax';
  if (error.kind === 'import' || error.kind === 'project') return 'err.guide.import';
  if (error.phase === 'unhandled-rejection') return 'err.guide.unhandled';
  const known = ['ReferenceError', 'TypeError', 'RangeError', 'SyntaxError', 'LoopBudgetError'];
  return (known.includes(error.name) ? `err.guide.${error.name}` : 'err.guide.generic') as Key;
}

/** Localized guidance next to the verbatim diagnostic (REQ-019). */
export function ErrorCard({ error, title }: { error: RunError; title: string }) {
  const t = useT();
  const where = error.file && error.line ? t('ws.atLine', { file: error.file, line: error.line }) : error.file ?? null;
  return (
    <div className="error-card" role="alert">
      <div className="error-card-title"><Icon name="warn" /> {title}{where && <span className="error-where">{where}</span>}</div>
      <p className="error-guide">{t(guidanceKey(error), { ms: error.loopBudgetMs ?? 2000 })}</p>
      <div className="error-original">
        <span className="label">{t('err.original')}</span>
        <pre lang="en">{error.kind ? error.message : `${error.name}: ${error.message}`}{error.frame ? `\n\n${error.frame}` : ''}</pre>
      </div>
    </div>
  );
}

function TestsView({ block, state, lang }: { block: ExerciseBlock; state: RunState; lang: Lang }) {
  const t = useT();
  if (state.status === 'compile-error') return <p className="ws-empty">{t('ws.notRunByError')}</p>;
  if (state.harnessError) return <><p className="ws-note">{t('ws.harnessError')}</p><ErrorCard error={state.harnessError} title={t('ws.runtimeError')} /></>;
  if (!state.tests) return <p className="ws-empty">{state.status === 'checking' ? t('ws.checking') : t('ws.previewEmpty')}</p>;
  const passed = state.tests.filter((x) => x.status === 'pass').length;
  const all = passed === state.tests.length && state.tests.length > 0;
  const feedbackFor = (test: TestResult) => block.feedback?.find((f) => f.when.test === test.name)?.message ?? null;
  const errorFeedback = state.errors.map((e) => block.feedback?.find((f) => f.when.error === e.name)?.message).find(Boolean) ?? null;
  return (
    <div className="tests">
      <p className={all ? 'tests-summary tests-ok' : 'tests-summary'}>{all ? <><Icon name="check" /> {t('ws.passedAll')}</> : t('ws.passedSome', { passed, total: state.tests.length })}</p>
      {errorFeedback && <Html html={errorFeedback[lang]} lang={lang} className="prose test-feedback" />}
      <ul className="test-list">
        {state.tests.map((test) => {
          const fb = test.status === 'fail' ? feedbackFor(test) : null;
          return (
            <li key={test.name} className={`test test-${test.status}`}>
              <span className="test-mark" aria-hidden="true">{test.status === 'pass' ? '✓' : '✕'}</span>
              <div>
                <span className="test-title">{block.testTitles[test.name]?.[lang] ?? test.name}</span>
                <span className="sr-only"> — {t(test.status === 'pass' ? 'ws.testPass' : 'ws.testFail')}</span>
                {test.status === 'fail' && test.message && <pre className="test-message" lang="en">{test.message}</pre>}
                {fb && <Html html={fb[lang]} lang={lang} className="prose test-feedback" />}
              </div>
            </li>
          );
        })}
      </ul>
      {!all && <p className="ws-note">{t('ws.keepCode')}</p>}
    </div>
  );
}

interface Props {
  lesson: Lesson;
  block: WsBlock;
  drafts: Doc<DraftsDoc>;
  lang: Lang;
  /** Self-check mode keeps evidence separate: nothing is written to lesson progress. */
  onChecked?: (passed: boolean) => void;
  recordProgress?: boolean;
}

export function Workspace({ lesson, block, drafts, lang, onChecked, recordProgress = true }: Props) {
  const t = useT();
  const helpId = useId();
  const draft = useStore(drafts.store, (d) => d.blocks[block.id]);
  // Example text in code follows the language the learner started the exercise in; once the
  // learner has a draft, it is theirs and is never rewritten by a language switch (REQ-015).
  const codeLang: Lang = draft?.lang ?? lang;
  const starter = useMemo(() => localizeFiles(block.files, block, codeLang) as Record<string, string>, [block, codeLang]);
  const files = draft?.files ?? starter;
  const storage = draft?.storage ?? {};
  const fileNames = useMemo(() => Object.keys(files).sort((a, b) => (a === block.entry ? -1 : b === block.entry ? 1 : a.localeCompare(b))), [files, block.entry]);
  const [activeFile, setActiveFile] = useState(draft?.activeFile && draft.activeFile in files ? draft.activeFile : (block.kind === 'exercise' ? block.editable[0] : undefined) ?? block.entry);
  const [tab, setTab] = useState<Tab>(hasPreview(block) ? 'preview' : 'console');
  const [undo, setUndo] = useState<Record<string, string> | null>(null);
  const runner = useRunner();
  const frameHost = useRef<HTMLDivElement>(null);
  const hiddenHost = useRef<HTMLDivElement>(null);
  const editable = block.kind === 'exercise' ? block.editable : fileNames;
  const exerciseProgress = useStore(app().progress.store, (p) => (block.kind === 'exercise' ? p.lessons[lesson.id]?.exercises[block.id] : undefined));

  const saveDraft = useCallback((patch: Partial<{ files: Record<string, string>; lang: Lang; activeFile: string; storage: Record<string, string> }>) => {
    drafts.update((d) => ({ blocks: { ...d.blocks, [block.id]: { ...(d.blocks[block.id] ?? { files: starter, lang: codeLang }), ...patch, updatedAt: new Date().toISOString() } } }));
  }, [drafts, block.id, starter, codeLang]);

  const onEdit = useCallback((value: string) => { saveDraft({ files: { ...(drafts.value.blocks[block.id]?.files ?? starter), [activeFile]: value } }); }, [saveDraft, drafts, block.id, starter, activeFile]);

  const run = (mode: 'run' | 'test') => {
    const container = mode === 'run' ? frameHost.current : hiddenHost.current;
    if (!container) return;
    setTab(mode === 'test' ? 'tests' : hasPreview(block) ? 'preview' : 'console');
    runner.start({
      block,
      files: drafts.value.blocks[block.id]?.files ?? starter,
      mode,
      storage: drafts.value.blocks[block.id]?.storage ?? {},
      lang: codeLang,
      container,
      title: t('ws.result'),
      onStorage: (local) => saveDraft({ storage: local }),
      onTests: (results, harnessError, errors) => {
        const passed = !harnessError && results.length > 0 && results.every((r) => r.status === 'pass');
        if (recordProgress && block.kind === 'exercise') app().progress.update((p) => recordExerciseCheck(p, lesson, block.id, passed));
        onChecked?.(passed);
        announce(passed ? t('ws.passedAll') : t('ws.passedSome', { passed: results.filter((r) => r.status === 'pass').length, total: results.length }));
        if (!passed && errors.length > 0 && results.length === 0) setTab('console');
      },
    });
    if (mode === 'run' && recordProgress && block.kind === 'example') app().progress.update((p) => recordExampleRun(p, lesson, block.id));
  };

  // Compile errors and the first runtime error are also marked in the editor gutter.
  const issues: EditorIssue[] = useMemo(() => {
    const s = runner.state;
    const list = [...s.compileErrors, ...s.errors].filter((e) => e.line && (e.file ?? '').endsWith(activeFile));
    return list.map((e) => ({ line: e.line as number, column: e.column ?? null, message: e.message }));
  }, [runner.state, activeFile]);

  useEffect(() => { if (runner.state.status === 'compile-error') setTab('console'); }, [runner.state.status]);

  const s = runner.state;
  const statusText = (() => {
    if (s.unresponsive) return t('ws.unresponsive', { s: Math.round(2.5) });
    switch (s.status) {
      case 'running': return t('ws.running');
      case 'checking': return t('ws.checking');
      case 'done': return s.errors.length > 0 ? t('ws.finishedErrors') : t('ws.finished');
      case 'stopped': return t('ws.stopped');
      case 'auto-stopped': return t('ws.autoStopped', { s: Math.round(AUTO_STOP_AFTER_MS / 1000) });
      case 'failed': return t('ws.sandboxUnreachable');
      case 'reloaded': return t('ws.reloaded');
      case 'compile-error': return t('ws.compileError');
      default: return t('ws.idle');
    }
  })();
  const passedNow = block.kind === 'exercise' && s.tests !== null && !s.harnessError && s.tests.length > 0 && s.tests.every((x) => x.status === 'pass');
  const storageKeys = Object.keys(storage);
  const tabs: Tab[] = [...(hasPreview(block) ? (['preview'] as Tab[]) : []), 'console', ...(block.kind === 'exercise' ? (['tests'] as Tab[]) : []), ...(storageKeys.length > 0 || /localStorage|sessionStorage/.test(Object.values(files).join('\n')) ? (['storage'] as Tab[]) : [])];
  const consoleCount = s.console.filter((e) => e.level !== 'system').length + s.errors.length + s.compileErrors.length;

  return (
    <div className="ws">
      <section className="ws-editor panel" aria-label={t('ws.editor', { file: activeFile })}>
        <div className="panel-top">
          <div className="file-tabs" role="tablist" aria-label={t('ws.files')}>
            {fileNames.map((name) => (
              <button key={name} type="button" role="tab" aria-selected={name === activeFile} className={name === activeFile ? 'file-tab active' : 'file-tab'} onClick={() => { setActiveFile(name); saveDraft({ activeFile: name }); }}>
                <Icon name="file" size={13} /> {name}{!editable.includes(name) && <span className="file-ro"> · {t('ws.readonly')}</span>}
              </button>
            ))}
          </div>
          <span className={`runtime-chip runtime-${block.runtime}`} title={t(`ws.runtime.${block.runtime}` as Key)}>{block.runtime}</span>
        </div>
        <CodeEditor key={`${block.id}:${activeFile}`} path={activeFile} value={files[activeFile] ?? ''} readOnly={!editable.includes(activeFile)} ariaLabel={t('ws.editor', { file: activeFile })} describedBy={helpId} issues={issues} onChange={onEdit} />
        <p id={helpId} className="sr-only">{t('ws.editorHelp')}</p>
        <div className="ws-actions">
          <button type="button" className="btn btn-primary" onClick={() => run('run')} disabled={runner.isActive && s.mode === 'run' && !s.unresponsive}><Icon name="play" /> {t('ws.run')}</button>
          {block.kind === 'exercise' && <button type="button" className="btn btn-check" onClick={() => run('test')} disabled={s.status === 'checking'}><Icon name="check" /> {t('ws.check')}</button>}
          {(s.live || runner.isActive) && <button type="button" className="btn" onClick={runner.stop}><Icon name="stop" /> {t('ws.stop')}</button>}
          <span className="ws-actions-gap" />
          {undo && <button type="button" className="btn btn-quiet" onClick={() => { saveDraft({ files: undo }); setUndo(null); }}>{t('ws.undoReset')}</button>}
          {draft?.files && <button type="button" className="btn btn-quiet" onClick={() => { if (window.confirm(t('ws.resetConfirm'))) { setUndo(draft.files); saveDraft({ files: localizeFiles(block.files, block, lang) as Record<string, string>, lang }); runner.reset(); } }}><Icon name="reset" size={14} /> {t('ws.reset')}</button>}
        </div>
        <p className={`ws-status ws-status-${s.unresponsive ? 'warn' : s.status}`} role="status" aria-live="polite">{statusText}{passedNow && <strong className="ws-passed"> · {exerciseProgress?.assistedPass ? t('ws.exercisePassedAssisted') : t('ws.exercisePassed')}</strong>}</p>
        <p className="runtime-note"><Icon name="info" size={13} /> {t(`ws.runtime.${block.runtime}` as Key)}</p>
        {block.limits && <details className="limits"><summary>{t('ws.limits')}</summary><Html html={block.limits[lang]} lang={lang} className="prose" /></details>}
      </section>

      <section className="ws-result panel" aria-label={t('ws.result')}>
        <div className="panel-top">
          <div className="result-tabs" role="tablist" aria-label={t('ws.result')}>
            {tabs.map((name) => (
              <button key={name} type="button" role="tab" aria-selected={tab === name} className={tab === name ? 'result-tab active' : 'result-tab'} onClick={() => setTab(name)}>
                {t(`ws.${name}` as Key)}{name === 'console' && consoleCount > 0 && <span className="tab-count">{consoleCount}</span>}
                {name === 'tests' && s.tests && <span className={`tab-count ${passedNow ? 'tab-count-ok' : ''}`}>{s.tests.filter((x) => x.status === 'pass').length}/{s.tests.length}</span>}
              </button>
            ))}
          </div>
          {s.live && <span className="live-label"><span className="live-dot" /> live</span>}
        </div>
        <div className="result-body" role="tabpanel">
          <div className={tab === 'preview' ? 'preview' : 'preview preview-hidden'}>
            <div ref={frameHost} className="frame-host" />
            {!s.live && s.status === 'idle' && tab === 'preview' && <p className="ws-empty preview-empty">{t('ws.previewEmpty')}</p>}
          </div>
          {tab === 'console' && (
            <div className="console-wrap">
              {s.compileErrors.map((e, i) => <ErrorCard key={`c${i}`} error={e} title={t('ws.compileError')} />)}
              <ConsoleView entries={s.console} errors={s.errors} />
              {s.errors.map((e, i) => <ErrorCard key={`r${i}`} error={e} title={t('ws.runtimeError')} />)}
            </div>
          )}
          {tab === 'tests' && block.kind === 'exercise' && (
            <>
              {s.errors.length > 0 && s.mode === 'test' && s.errors.slice(0, 1).map((e, i) => <ErrorCard key={i} error={e} title={t('ws.runtimeError')} />)}
              <TestsView block={block} state={s} lang={lang} />
            </>
          )}
          {tab === 'storage' && (
            <div className="storage">
              <p className="ws-note">{t('ws.storageNote')}</p>
              {storageKeys.length === 0 ? <p className="ws-empty">{t('ws.storageEmpty')}</p> : (
                <>
                  <table className="storage-table"><tbody>{storageKeys.map((k) => <tr key={k}><th scope="row">{k}</th><td><code>{storage[k]}</code></td></tr>)}</tbody></table>
                  <button type="button" className="btn btn-quiet" onClick={() => saveDraft({ storage: {} })}>{t('ws.storageClear')}</button>
                </>
              )}
            </div>
          )}
        </div>
        <div ref={hiddenHost} className="hidden-frame-host" aria-hidden="true" />
      </section>
    </div>
  );
}
