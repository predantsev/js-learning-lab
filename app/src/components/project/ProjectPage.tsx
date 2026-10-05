// "My project": the selected capstone workspace (REQ-009–REQ-013). Steps with provenance on the
// left, files and their real result on the right; snapshots, export and other projects around them.
import { useCallback, useEffect, useState } from 'react';
import { currentStep, nextOpenStep } from '@shared/capstone.js';
import { ContentError } from '../../lib/content';
import { formatDate, pick } from '../../lib/i18n';
import type { Doc } from '../../lib/persist';
import { navigate } from '../../lib/router';
import { useStore } from '../../lib/store';
import type { CapstoneId } from '../../lib/types';
import { type WorkspaceDoc, app, loadWorkspace, useLang, useT } from '../../state/app';
import { Dialog, Icon, announce } from '../ui';
import { type Capstone, loadCapstone } from './content';
import { AfterExportPanel, ExportDialog } from './ExportPanel';
import { useStableCallback } from './parts';
import { ProjectEditor } from './ProjectEditor';
import { SnapshotsPanel } from './SnapshotsPanel';
import { StarterDialog } from './StarterDialog';
import { StepsPanel, stepRows } from './StepsPanel';
import { activateWorkspace, startProject, syncStepLessons, workspaceLang } from './workspace';
import '../../styles/project.css';

function CapstonePicker({ choice, onChoose, labelledBy }: { choice: CapstoneId | null; onChoose: (id: CapstoneId) => void; labelledBy: string }) {
  const lang = useLang();
  return (
    <div className="capstone-grid" role="radiogroup" aria-labelledby={labelledBy}>
      {app().index.capstones.map((c) => (
        <button key={c.id} type="button" role="radio" aria-checked={choice === c.id} data-capstone={c.id} className={choice === c.id ? 'capstone-card selected' : 'capstone-card'} onClick={() => onChoose(c.id)}>
          <strong>{pick(c.title, lang)}</strong><span>{pick(c.pitch, lang)}</span>
        </button>
      ))}
    </div>
  );
}

function SwitchDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const [choice, setChoice] = useState<CapstoneId | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const close = useStableCallback(() => { if (!busy) onClose(); });
  const name = choice ? pick(app().index.capstones.find((c) => c.id === choice)?.title, lang) : '';
  const create = async () => {
    if (!choice) return;
    setBusy(true);
    setFailed(false);
    try {
      await startProject(choice);
    } catch {
      setBusy(false);
      setFailed(true);
      return;
    }
    announce(t('project.created', { date: formatDate(new Date().toISOString(), lang) }));
    onClose();
  };
  return (
    <Dialog wide title={choice ? t('project.switchConfirmTitle', { name }) : t('project.switch')} onClose={close} actions={<>
      <button type="button" className="btn" onClick={close} disabled={busy}>{t('common.cancel')}</button>
      <button type="button" className="btn btn-primary" onClick={() => void create()} disabled={!choice || busy}>{busy ? t('project.creating') : t('project.create')}</button>
    </>}>
      <p>{t('project.switchConfirmBody')}</p>
      <h3 id="switch-choose">{t('project.chooseTitle')}</h3>
      <CapstonePicker choice={choice} onChoose={setChoice} labelledBy="switch-choose" />
      {failed && <p className="form-error" role="alert">{t('project.createFailed')}</p>}
    </Dialog>
  );
}

function Chooser() {
  const t = useT();
  const [choice, setChoice] = useState<CapstoneId | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const create = () => {
    if (!choice) return;
    setBusy(true);
    setFailed(false);
    startProject(choice).catch(() => setFailed(true)).finally(() => setBusy(false));
  };
  return (
    <section className="project-chooser" aria-labelledby="choose-project">
      <h2 id="choose-project">{t('project.chooseTitle')}</h2>
      <p className="page-lead">{t('project.chooseLead')}</p>
      <CapstonePicker choice={choice} onChoose={setChoice} labelledBy="choose-project" />
      <button type="button" className="btn btn-primary btn-large" disabled={!choice || busy} onClick={create}>{busy ? t('project.creating') : t('project.create')}</button>
      {failed && <p className="form-error" role="alert">{t('project.createFailed')}</p>}
    </section>
  );
}

function WorkspaceList() {
  const t = useT();
  const lang = useLang();
  const items = useStore(app().workspaces.store, (w) => w.items);
  const activeId = useStore(app().profile.store, (p) => p.activeWorkspaceId);
  if (items.length === 0) return null;
  const title = (id: CapstoneId) => pick(app().index.capstones.find((c) => c.id === id)?.title, lang);
  return (
    <section className="project-card" aria-labelledby="project-workspaces">
      <h2 id="project-workspaces" className="project-card-title">{t('project.workspaces')}</h2>
      <ul className="workspace-list">
        {items.map((w) => (
          <li key={w.id} className="workspace-item" data-workspace={w.id}>
            <div><strong>{title(w.capstoneId)}</strong><span className="snapshot-meta">{t('project.created', { date: formatDate(w.createdAt, lang) })}</span></div>
            {w.id === activeId ? <span className="badge badge-ok">{t('project.active')}</span> : <button type="button" className="btn" onClick={() => void activateWorkspace(w.id)}>{t('project.open')}</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectWorkspace({ doc, capstone, unit }: { doc: Doc<WorkspaceDoc>; capstone: Capstone; unit: string | null }) {
  const t = useT();
  const lang = useLang();
  const ws = useStore(doc.store);
  const rows = stepRows(capstone);
  const current = currentStep(capstone.steps, ws.steps) as string | null;
  // Without a step in the address: the current in-platform step, else the first step still open
  // (local ones included), else the first one.
  const [selected, setSelected] = useState<string | null>(unit ?? current ?? (nextOpenStep(capstone.steps, ws.steps) as string | null) ?? rows[0]?.unit ?? null);
  const [starter, setStarter] = useState<{ through: string | null } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { if (unit) setSelected(unit); }, [unit]);
  const closeStarter = useCallback(() => setStarter(null), []);
  const closeExport = useCallback(() => setExporting(false), []);
  const step = capstone.steps.find((s) => s.unit === selected) ?? null;
  const select = (u: string) => { setSelected(u); navigate(`#/project/${encodeURIComponent(u)}`); };
  const wsLang = workspaceLang(ws);

  return (
    <>
      <header className="page-heading project-heading">
        <div>
          <span className="eyebrow">{t('project.title')}</span>
          <h1>{pick(capstone.title, lang)}</h1>
          <p className="page-lead">{pick(capstone.pitch, lang)}</p>
          <p className="ws-note project-lang" title={t('project.langNote', { lang: t(`lang.${wsLang}`) })}>{t('project.workspaceLang', { lang: t(`lang.${wsLang}`) })} · {t('project.created', { date: formatDate(ws.createdAt, lang) })}</p>
        </div>
        <div className="banner-actions">
          <button type="button" className="btn btn-primary" onClick={() => setExporting(true)}><Icon name="folder" /> {t('project.export')}</button>
          <ProjectSwitchButton />
        </div>
      </header>
      {wsLang !== lang && <p className="banner banner-info project-lang-note" role="note">{t('project.langNote', { lang: t(`lang.${wsLang}`) })}</p>}
      {message && <p className="banner banner-info" role="status">{message}</p>}
      <div className="project-layout">
        <div className="project-side">
          <StepsPanel doc={doc} capstone={capstone} rows={rows} selected={selected} current={current} onSelect={select} onStarter={(through) => setStarter({ through })} />
          <SnapshotsPanel doc={doc} />
          <AfterExportPanel doc={doc} capstone={capstone} />
          <WorkspaceList />
        </div>
        <div className="project-main">
          <ProjectEditor doc={doc} capstone={capstone} step={step} />
        </div>
      </div>
      {starter && (
        <StarterDialog doc={doc} capstone={capstone} through={starter.through} onClose={closeStarter} onApplied={(snapshot) => {
          setStarter(null);
          const text = t('project.starter.applied', { n: snapshot.n });
          setMessage(text);
          announce(text);
        }} />
      )}
      {exporting && <ExportDialog doc={doc} capstone={capstone} onClose={closeExport} />}
    </>
  );
}

function ProjectSwitchButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)}>{t('project.switch')}</button>
      {open && <SwitchDialog onClose={close} />}
    </>
  );
}

export function ProjectPage({ unit }: { unit: string | null }) {
  const t = useT();
  const activeId = useStore(app().profile.store, (p) => p.activeWorkspaceId);
  const [state, setState] = useState<{ id: string; doc: Doc<WorkspaceDoc>; capstone: Capstone } | { id: string; error: unknown } | null>(null);

  useEffect(() => {
    if (!activeId) { setState(null); return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const doc = await loadWorkspace(activeId);
        const capstone = await loadCapstone(doc.value.capstoneId);
        // Older workspace documents get their metadata once; their files are never rewritten.
        if (!doc.value.lang || !doc.value.base) doc.update((w) => ({ ...w, lang: w.lang ?? app().profile.value.language, base: w.base ?? { kind: 'start', unit: null, at: w.createdAt }, snapshots: w.snapshots ?? [], nextSnapshot: w.nextSnapshot ?? 1 }));
        if (!cancelled) setState({ id: activeId, doc, capstone });
        void syncStepLessons();
      } catch (error) {
        if (!cancelled) setState({ id: activeId, error });
      }
    })();
    return () => { cancelled = true; };
  }, [activeId]);

  let body;
  if (!activeId) body = <Chooser />;
  else if (!state || state.id !== activeId) body = <p className="ws-empty" role="status">{t('project.loading')}</p>;
  else if ('error' in state) {
    body = (
      <div className="state-card" role="alert">
        <h2>{t('error.title')}</h2>
        <p>{state.error instanceof ContentError ? t(state.error.code === 'corrupt' ? 'error.contentCorrupt' : 'error.contentMissing') : t('project.loadFailed')}</p>
        <details><summary>{t('error.details')}</summary><pre>{state.error instanceof Error ? state.error.message : String(state.error)}</pre></details>
        <WorkspaceList />
      </div>
    );
  } else body = <ProjectWorkspace key={state.id} doc={state.doc} capstone={state.capstone} unit={unit} />;

  return <div className="page project">{!activeId && <header className="page-heading"><div><h1>{t('project.title')}</h1><p className="page-lead">{t('project.none')}</p></div></header>}{body}</div>;
}
