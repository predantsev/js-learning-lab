// Project files and their real result: a multi-file editor (create, rename, delete with
// confirmation, unsafe paths rejected), the live preview, console, step checks and storage.
// Runs use the same sandbox runner as lessons (useRunner → shared/runner.js).
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { sortPaths } from '@shared/capstone.js';
import { MISSING_IMAGE_PREFIX } from '@shared/runner.js';
import { type Key } from '../../lib/i18n';
import type { Doc } from '../../lib/persist';
import { useStore } from '../../lib/store';
import type { ConsoleEntry, Lang, TestResult } from '../../lib/types';
import { type WorkspaceDoc, useLang, useT } from '../../state/app';
import { CodeEditor, type EditorIssue } from '../CodeEditor';
import { Html, Icon, announce } from '../ui';
import { AUTO_STOP_AFTER_MS, type RunnableBlock, useRunner } from '../useRunner';
import { ConsoleView, ErrorCard } from '../Workspace';
import { type Capstone, type CapstoneStep, allStrings, resolveHtml } from './content';
import { ConfirmDialog, PathDialog, usePathMessage } from './parts';
import { addFile, recordCheck, removeFile, renameFile, restoreFile, setActiveFile, setStorage, updateFile, workspaceLang } from './workspace';

type Tab = 'preview' | 'console' | 'checks' | 'storage';
type Outcome = { unit: string; passed: number; total: number; counted: boolean; newlyDone: boolean; supplied: boolean };

/** A missing project image is reported by the sandbox as a blocked resource; say what is missing. */
const explainEntries = (entries: ConsoleEntry[]): ConsoleEntry[] => entries.map((e) => (e.level === 'system' && e.code === 'resource-blocked' && e.detail?.startsWith(MISSING_IMAGE_PREFIX) ? { ...e, code: 'missing-file', detail: e.detail.slice(MISSING_IMAGE_PREFIX.length) } : e));

function ChecksView({ step, tests, outcome, uiLang, wsLang, notRun }: { step: CapstoneStep; tests: TestResult[] | null; outcome: Outcome | null; uiLang: Lang; wsLang: Lang; notRun: boolean }) {
  const t = useT();
  if (notRun) return <p className="ws-note">{t('project.checkNotRun')}</p>;
  if (!tests) return <p className="ws-empty">{t('project.checksEmpty')}</p>;
  const title = (name: string) => (step.testTitles[name] ? resolveHtml(step.testTitles[name][uiLang], step.strings, wsLang) : name);
  const feedback = (name: string) => step.feedback.find((f) => f.when.test === name)?.message ?? null;
  const summary = outcome && outcome.unit === step.unit
    ? outcome.counted ? t(outcome.newlyDone ? 'project.checkPassed' : 'project.checkPassedAgain', { unit: step.unit }) : outcome.supplied ? t('project.checkSupplied') : t('project.checkFailed', { passed: outcome.passed, total: outcome.total })
    : null;
  return (
    <div className="tests">
      {summary && <p className={outcome?.counted ? 'tests-summary tests-ok' : 'tests-summary'}>{outcome?.counted && <Icon name="check" />} {summary}</p>}
      <ul className="test-list">
        {tests.map((test) => {
          const fb = test.status === 'fail' ? feedback(test.name) : null;
          return (
            <li key={test.name} className={`test test-${test.status}`}>
              <span className="test-mark" aria-hidden="true">{test.status === 'pass' ? '✓' : '✕'}</span>
              <div>
                <Html inline html={title(test.name)} lang={uiLang} className="test-title" />
                <span className="sr-only"> — {t(test.status === 'pass' ? 'ws.testPass' : 'ws.testFail')}</span>
                {test.status === 'fail' && test.message && <pre className="test-message" lang="en">{test.message}</pre>}
                {fb && <Html html={resolveHtml(fb[uiLang], step.strings, wsLang)} lang={uiLang} className="prose test-feedback" />}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="ws-note">{t('project.checkNote')}</p>
    </div>
  );
}

export function ProjectEditor({ doc, capstone, step }: { doc: Doc<WorkspaceDoc>; capstone: Capstone; step: CapstoneStep | null }) {
  const t = useT();
  const uiLang = useLang();
  const pathMessage = usePathMessage();
  const helpId = useId();
  const ws = useStore(doc.store);
  const wsLang = workspaceLang(ws);
  const paths = useMemo(() => sortPaths(Object.keys(ws.files), capstone.entry) as string[], [ws.files, capstone.entry]);
  const active = ws.activeFile && ws.activeFile in ws.files ? ws.activeFile : capstone.entry in ws.files ? capstone.entry : paths[0] ?? null;
  const [tab, setTab] = useState<Tab>('preview');
  const [dialog, setDialog] = useState<null | 'new' | 'rename' | 'delete' | 'clear-storage'>(null);
  const [undo, setUndo] = useState<{ path: string; text: string } | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const runner = useRunner();
  const frameHost = useRef<HTMLDivElement>(null);
  const hiddenHost = useRef<HTMLDivElement>(null);
  const checkable = step !== null && step.mode === 'in-platform' && Boolean(step.tests);
  const runBlock: RunnableBlock = useMemo(() => ({ entry: step?.entry ?? capstone.entry, runtime: 'browser-js', tests: step?.tests ?? '', strings: step?.strings ?? allStrings(capstone), capabilities: step?.capabilities ?? {} }), [step, capstone]);
  const closeDialog = useCallback(() => setDialog(null), []);

  // A different step or workspace means earlier results no longer describe these files.
  useEffect(() => { setOutcome(null); runner.reset(); }, [step?.unit, ws.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (mode: 'run' | 'test', entryOverride?: string) => {
    const container = mode === 'run' ? frameHost.current : hiddenHost.current;
    if (!container || (mode === 'test' && !step)) return;
    setTab(mode === 'run' ? 'preview' : 'checks');
    if (mode === 'test') setOutcome(null);
    runner.start({
      block: runBlock,
      files: doc.value.files,
      mode,
      // Checks start from an empty storage, so they never change the learner's saved data.
      storage: mode === 'run' ? doc.value.storage : {},
      lang: wsLang,
      container,
      title: t('ws.result'),
      entryOverride,
      onStorage: mode === 'run' ? (local) => setStorage(doc, local) : undefined,
      onNavigate: (path) => run('run', path),
      onTests: (results, harnessError) => {
        if (!step) return;
        const passed = harnessError ? 0 : results.filter((r) => r.status === 'pass').length;
        const total = harnessError ? Math.max(1, results.length) : results.length;
        const result = recordCheck(doc, capstone, step.unit, passed, total);
        setOutcome({ unit: step.unit, passed, total, ...result });
        announce(result.counted ? t(result.newlyDone ? 'project.checkPassed' : 'project.checkPassedAgain', { unit: step.unit }) : result.supplied ? t('project.checkSupplied') : t('project.checkFailed', { passed, total }));
      },
    });
  };

  useEffect(() => { if (runner.state.status === 'compile-error') setTab('console'); }, [runner.state.status]);

  const s = runner.state;
  const issues: EditorIssue[] = useMemo(() => [...s.compileErrors, ...s.errors].filter((e) => e.line && active && (e.file ?? '').endsWith(active)).map((e) => ({ line: e.line as number, column: e.column ?? null, message: e.message })), [s.compileErrors, s.errors, active]);
  const statusText = (() => {
    if (s.unresponsive) return t('ws.unresponsive', { s: 2.5 });
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
  const consoleEntries = useMemo(() => explainEntries(s.console), [s.console]);
  const consoleCount = consoleEntries.filter((e) => e.level !== 'system').length + s.errors.length + s.compileErrors.length;
  const storageKeys = Object.keys(ws.storage);
  const tabs: Tab[] = ['preview', 'console', ...(checkable ? (['checks'] as Tab[]) : []), 'storage'];
  const isEntry = active === capstone.entry;

  // Group files by folder for the list: top-level files first, then each folder.
  const groups = useMemo(() => {
    const out: { folder: string | null; files: string[] }[] = [];
    for (const p of paths) {
      const folder = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : null;
      const last = out[out.length - 1];
      if (last && last.folder === folder) last.files.push(p);
      else out.push({ folder, files: [p] });
    }
    return out;
  }, [paths]);

  return (
    <div className="project-work">
      <section className="panel project-files" aria-label={t('project.files')}>
        <div className="panel-top project-files-top">
          <h2 className="panel-title">{t('project.files')}</h2>
          <div className="file-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setDialog('new')}><Icon name="file" size={14} /> {t('project.newFile')}</button>
            <button type="button" className="btn btn-quiet" onClick={() => setDialog('rename')} disabled={!active || isEntry} title={isEntry && active ? t('project.entryLocked', { path: active }) : undefined}>{t('project.rename')}</button>
            <button type="button" className="btn btn-quiet" onClick={() => setDialog('delete')} disabled={!active || isEntry} title={isEntry && active ? t('project.entryLocked', { path: active }) : undefined}>{t('project.delete')}</button>
          </div>
        </div>
        {isEntry && active && <p className="sr-only">{t('project.entryLocked', { path: active })}</p>}
        <div className="project-editor">
          <nav className="file-list" aria-label={t('project.fileList')}>
            <ul>
              {groups.map((g) => (
                <li key={g.folder ?? '.'}>
                  {g.folder && <span className="file-folder"><Icon name="folder" size={13} /> {g.folder}/</span>}
                  <ul>
                    {g.files.map((p) => (
                      <li key={p}>
                        <button type="button" className={p === active ? 'file-item active' : 'file-item'} aria-current={p === active ? 'true' : undefined} data-path={p} onClick={() => setActiveFile(doc, p)}>
                          <Icon name="file" size={13} /> <span>{g.folder ? p.slice(g.folder.length + 1) : p}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            {undo && <button type="button" className="btn btn-quiet undo-delete" onClick={() => { restoreFile(doc, undo.path, undo.text); announce(t('project.fileCreated', { path: undo.path })); setUndo(null); }}>{t('project.undoDelete', { path: undo.path })}</button>}
          </nav>
          <div className="project-code">
            {active !== null ? (
              <CodeEditor key={`${ws.id}:${active}`} path={active} value={ws.files[active] ?? ''} ariaLabel={t('ws.editor', { file: active })} describedBy={helpId} issues={issues} minHeight="22rem" onChange={(value) => updateFile(doc, active, value)} />
            ) : <p className="ws-empty">{t('project.noFilesTitle')}</p>}
            <p id={helpId} className="sr-only">{t('ws.editorHelp')}</p>
          </div>
        </div>
        <div className="ws-actions">
          <button type="button" className="btn btn-primary" onClick={() => run('run')} disabled={(runner.isActive && s.mode === 'run' && !s.unresponsive) || paths.length === 0}><Icon name="play" /> {t('project.run')}</button>
          {checkable && step && <button type="button" className="btn btn-check" onClick={() => run('test')} disabled={s.status === 'checking' || paths.length === 0}><Icon name="check" /> {t('project.checkStep', { unit: step.unit })}</button>}
          {(s.live || runner.isActive) && <button type="button" className="btn" onClick={runner.stop}><Icon name="stop" /> {t('ws.stop')}</button>}
        </div>
        <p className={`ws-status ws-status-${s.unresponsive ? 'warn' : s.status}`} role="status" aria-live="polite">{statusText}</p>
        <p className="runtime-note"><Icon name="info" size={13} /> {t('ws.runtime.browser-js')}</p>
      </section>

      <section className="panel project-result" aria-label={t('ws.result')} data-run={s.runCount} data-mode={s.mode ?? ''} data-status={s.status}>
        <div className="panel-top">
          <div className="result-tabs" role="tablist" aria-label={t('ws.result')}>
            {tabs.map((name) => (
              <button key={name} type="button" role="tab" aria-selected={tab === name} className={tab === name ? 'result-tab active' : 'result-tab'} onClick={() => setTab(name)}>
                {t(`project.${name}` as Key)}
                {name === 'console' && consoleCount > 0 && <span className="tab-count">{consoleCount}</span>}
                {name === 'checks' && s.tests && s.mode === 'test' && <span className={`tab-count ${s.tests.every((x) => x.status === 'pass') ? 'tab-count-ok' : ''}`}>{s.tests.filter((x) => x.status === 'pass').length}/{s.tests.length}</span>}
                {name === 'storage' && storageKeys.length > 0 && <span className="tab-count">{storageKeys.length}</span>}
              </button>
            ))}
          </div>
          {s.live && <span className="live-label"><span className="live-dot" /> live</span>}
        </div>
        <div className="result-body" role="tabpanel">
          <div className={tab === 'preview' ? 'preview project-preview' : 'preview project-preview preview-hidden'}>
            <div ref={frameHost} className="frame-host" />
            {!s.live && (s.status === 'idle' || s.mode === 'test') && tab === 'preview' && <p className="ws-empty preview-empty">{t('ws.previewEmpty')}</p>}
          </div>
          {tab === 'console' && (
            <div className="console-wrap">
              {s.compileErrors.map((e, i) => <ErrorCard key={`c${i}`} error={e} title={t('ws.compileError')} />)}
              <ConsoleView entries={consoleEntries} errors={s.errors} />
              {s.errors.map((e, i) => <ErrorCard key={`r${i}`} error={e} title={t('ws.runtimeError')} />)}
            </div>
          )}
          {tab === 'checks' && step && (
            <>
              {s.mode === 'test' && s.errors.slice(0, 1).map((e, i) => <ErrorCard key={i} error={e} title={t('ws.runtimeError')} />)}
              <ChecksView step={step} tests={s.mode === 'test' ? s.tests : null} outcome={outcome} uiLang={uiLang} wsLang={wsLang} notRun={s.mode === 'test' && s.status === 'compile-error'} />
            </>
          )}
          {tab === 'storage' && (
            <div className="storage">
              <p className="ws-note">{t('project.storageNote')}</p>
              {storageKeys.length === 0 ? <p className="ws-empty">{t('project.storageEmpty')}</p> : (
                <>
                  <table className="storage-table"><tbody>{storageKeys.map((k) => <tr key={k}><th scope="row">{k}</th><td><code>{ws.storage[k]}</code></td></tr>)}</tbody></table>
                  <button type="button" className="btn btn-quiet" onClick={() => setDialog('clear-storage')}>{t('project.storageClear')}</button>
                </>
              )}
            </div>
          )}
        </div>
        <div ref={hiddenHost} className="hidden-frame-host" aria-hidden="true" />
      </section>

      {dialog === 'new' && (
        <PathDialog title={t('project.newFileTitle')} initial="" submitLabel={t('project.create')} onClose={closeDialog} onSubmit={(path) => {
          const problem = addFile(doc, path);
          if (problem) return pathMessage(problem);
          announce(t('project.fileCreated', { path }));
          setDialog(null);
          return null;
        }} />
      )}
      {dialog === 'rename' && active && (
        <PathDialog title={t('project.renameTitle', { path: active })} initial={active} submitLabel={t('project.rename')} onClose={closeDialog} onSubmit={(path) => {
          const problem = renameFile(doc, active, path);
          if (problem) return pathMessage(problem);
          announce(t('project.fileRenamed', { path }));
          setDialog(null);
          return null;
        }} />
      )}
      {dialog === 'delete' && active && (
        <ConfirmDialog title={t('project.deleteTitle', { path: active })} confirmLabel={t('project.delete')} danger onClose={closeDialog} onConfirm={() => {
          const text = removeFile(doc, active, capstone.entry);
          setUndo({ path: active, text });
          announce(t('project.fileDeleted', { path: active }));
          setDialog(null);
        }}>
          <p>{t('project.deleteBody')}</p>
        </ConfirmDialog>
      )}
      {dialog === 'clear-storage' && (
        <ConfirmDialog title={t('project.storageClearTitle')} confirmLabel={t('project.storageClear').replace('…', '')} danger onClose={closeDialog} onConfirm={() => { setStorage(doc, {}); setDialog(null); }}>
          <p>{t('project.storageClearBody')}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
