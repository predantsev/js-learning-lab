// Same-project export to VS Code (REQ-012) and what the platform offers afterwards (REQ-013):
// local files are authoritative; references are separate downloads with readable diffs and
// manual backup/merge guidance. Nothing is ever synced to or written over the learner's folder.
import { useMemo, useState } from 'react';
import { changedPaths, previousReferenceIndex } from '@shared/capstone.js';
import { MANIFEST_PATH, buildProjectExport, buildReferenceArchive, zipProject } from '@shared/project-export.js';
import { ApiError, api } from '../../lib/api';
import { pick } from '../../lib/i18n';
import type { Doc } from '../../lib/persist';
import { saveStatus } from '../../lib/persist';
import { useStore } from '../../lib/store';
import { type WorkspaceDoc, app, useLang, useT } from '../../state/app';
import { Dialog, Icon, announce } from '../ui';
import { type Capstone, referenceFiles, referenceList, resolveText } from './content';
import { DiffView, dateTime, downloadBytes, today, useStableCallback } from './parts';
import { recordExport, workspaceLang } from './workspace';

/** Folder export is optional: the server announces it as features.export (or exportFolder). */
export function folderExportAvailable(): boolean {
  const f = app().bootstrap.features ?? {};
  return Boolean(f.export?.available || f.exportFolder?.available);
}

async function bundleFor(ws: WorkspaceDoc, capstone: Capstone) {
  const lang = workspaceLang(ws);
  return buildProjectExport({ workspace: { ...ws, lang }, title: pick(capstone.title, lang), contentVersion: app().index.contentVersion, platformVersion: app().bootstrap.version });
}

export function ExportDialog({ doc, capstone, onClose }: { doc: Doc<WorkspaceDoc>; capstone: Capstone; onClose: () => void }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ text: string; error: boolean } | null>(null);
  const unsaved = useStore(saveStatus, (s) => s.state !== 'saved');
  const folder = folderExportAvailable();
  const close = useStableCallback(() => { if (!busy) onClose(); });
  const done = (text: string, error = false) => { setResult({ text, error }); announce(text); };

  const exportZip = async () => {
    setBusy(true);
    setResult(null);
    try {
      // doc.value holds every typed edit, including ones the debounced save has not written yet.
      const bundle = await bundleFor(doc.value, capstone);
      const files = { ...bundle.files, [MANIFEST_PATH]: bundle.manifestText };
      const name = `${bundle.name}-${today()}.zip`;
      downloadBytes(name, zipProject(bundle.name, files), 'application/zip');
      recordExport(doc, { kind: 'zip', fileCount: Object.keys(files).length });
      done(t('project.exportZipDone', { name, n: Object.keys(files).length }));
    } catch (e) {
      done(t('project.exportFailed', { error: e instanceof Error ? e.message : String(e) }), true);
    }
    setBusy(false);
  };

  const exportFolder = async () => {
    setBusy(true);
    setResult(null);
    try {
      const bundle = await bundleFor(doc.value, capstone);
      // The endpoint writes jsll-manifest.json itself (format, exportedAt, per-file SHA-256) and
      // keeps these descriptive fields.
      const { files: _files, format: _format, formatVersion: _version, exportedAt: _at, ...manifest } = bundle.manifest;
      const response = await api<{ path: string; fileCount: number }>('POST', '/api/export/folder', { name: bundle.name, files: bundle.files, manifest });
      recordExport(doc, { kind: 'folder', path: response.path, fileCount: response.fileCount });
      done(t('project.exportFolderDone', { path: response.path, n: response.fileCount }));
    } catch (e) {
      done(t('project.exportFailed', { error: e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e) }), true);
    }
    setBusy(false);
  };

  return (
    <Dialog wide title={t('project.exportTitle')} onClose={close} actions={<button type="button" className="btn" onClick={close} disabled={busy}>{t('common.close')}</button>}>
      <p>{t('project.exportIntro')}</p>
      {unsaved && <p className="ws-note">{t('project.exportUnsaved')}</p>}
      <div className="export-actions">
        <button type="button" className="btn btn-primary" onClick={() => void exportZip()} disabled={busy}><Icon name="arrowRight" /> {t('project.exportZip')}</button>
        {folder ? (
          <button type="button" className="btn" onClick={() => void exportFolder()} disabled={busy}><Icon name="folder" /> {t('project.exportFolder')}</button>
        ) : <p className="ws-note">{t('project.exportFolderUnavailable')}</p>}
      </div>
      {folder && <p className="ws-note">{t('project.exportFolderNote', { dir: app().bootstrap.exportsDir })}</p>}
      {busy && <p className="ws-note" role="status">{t('project.exportBusy')}</p>}
      {result && <p className={result.error ? 'form-error export-result' : 'export-result export-ok'} role={result.error ? 'alert' : 'status'}>{result.text}</p>}
    </Dialog>
  );
}

export function AfterExportPanel({ doc, capstone }: { doc: Doc<WorkspaceDoc>; capstone: Capstone }) {
  const t = useT();
  const lang = useLang();
  const ws = useStore(doc.store);
  const wsLang = workspaceLang(ws);
  const refs = useMemo(() => referenceList(capstone), [capstone]);
  const name = (unit: string | null) => unit ?? 'CP-START';
  // Each reference is compared with the previous one of the same project; a reference that starts a
  // project (the React Native app, a new folder) has nothing to be compared with.
  const previousOf = useMemo(() => refs.map((_, i) => previousReferenceIndex(refs, i)), [refs]);
  const pairs = refs.map((_, i) => i).filter((i) => previousOf[i] >= 0);
  const starts = refs.map((_, i) => i).filter((i) => i > 0 && previousOf[i] < 0);
  const [pair, setPair] = useState(pairs[pairs.length - 1] ?? 0);
  const [error, setError] = useState<string | null>(null);
  if (!ws.exportedAt) return null;

  const download = async (index: number) => {
    setError(null);
    try {
      const { unit, step } = refs[index];
      const from = previousOf[index];
      const previous = from >= 0 ? { name: name(refs[from].unit), files: referenceFiles(capstone, refs[from].unit, wsLang) } : null;
      const archive = await buildReferenceArchive({
        capstoneId: capstone.id,
        projectTitle: pick(capstone.title, wsLang),
        unit,
        stepTitle: step ? pick(step.title, wsLang) : null,
        instructionsMd: step?.instructionsMd ? resolveText(step.instructionsMd[wsLang], step.strings, wsLang) : null,
        files: referenceFiles(capstone, unit, wsLang),
        previous,
        startsProject: index > 0 && from < 0 ? refs[index].entry : null,
        lang: wsLang,
        contentVersion: app().index.contentVersion,
      });
      downloadBytes(`${archive.folder}.zip`, zipProject(archive.folder, archive.files), 'application/zip');
    } catch (e) {
      setError(t('project.exportFailed', { error: e instanceof Error ? e.message : String(e) }));
    }
  };

  const from = pairs.includes(pair) ? refs[previousOf[pair]] : undefined;
  const to = pairs.includes(pair) ? refs[pair] : undefined;
  const before = from ? referenceFiles(capstone, from.unit, wsLang) : {};
  const after = to ? referenceFiles(capstone, to.unit, wsLang) : {};
  const changes = changedPaths(before, after) as { added: string[]; removed: string[]; modified: string[] };
  const changed = [...changes.modified, ...changes.added, ...changes.removed].sort();

  return (
    <section className="project-card after-export" aria-labelledby="after-export-title">
      <h2 id="after-export-title" className="project-card-title">{t('project.after.title')}</h2>
      <p>{t('project.after.body', { date: dateTime(ws.exportedAt, lang) })}</p>
      <h3>{t('project.after.references')}</h3>
      <p className="ws-note">{t('project.after.referencesNote')}</p>
      <ul className="reference-list">
        {refs.map((r, i) => (
          <li key={name(r.unit)}>
            <button type="button" className="btn" onClick={() => void download(i)}><Icon name="arrowRight" size={14} /> {t('project.after.download', { name: `${name(r.unit)}${r.step ? ` — ${pick(r.step.title, lang)}` : ''}` })}</button>
          </li>
        ))}
      </ul>
      {error && <p className="form-error" role="alert">{error}</p>}
      {pairs.length > 0 && (
        <>
          <h3>{t('project.after.diffTitle')}</h3>
          <div className="diff-pairs" role="group" aria-label={t('project.after.diffPair')}>
            {pairs.map((i) => (
              <button key={name(refs[i].unit)} type="button" className={pair === i ? 'segment active' : 'segment'} aria-pressed={pair === i} onClick={() => setPair(i)}>{name(refs[previousOf[i]].unit)} → {name(refs[i].unit)}</button>
            ))}
          </div>
          <p className="ws-note">{t('project.after.diffNote')}</p>
          {starts.map((i) => <p key={name(refs[i].unit)} className="ws-note diff-new-project">{t('project.after.diffNewProject', { name: name(refs[i].unit), entry: refs[i].entry })}</p>)}
          {changed.length === 0 ? <p className="ws-empty">{t('project.after.diffNone')}</p> : changed.map((p) => (
            <details key={p} className="reference-diff" open={changes.modified.includes(p) && changed.length <= 3}>
              <summary><code>{p}</code></summary>
              <DiffView before={before[p] ?? ''} after={after[p] ?? ''} label={p} />
            </details>
          ))}
        </>
      )}
      <h3>{t('project.after.mergeTitle')}</h3>
      <ol className="merge-steps">
        {(['project.after.merge1', 'project.after.merge2', 'project.after.merge3', 'project.after.merge4', 'project.after.merge5'] as const).map((k) => <li key={k}>{t(k)}</li>)}
      </ol>
    </section>
  );
}
