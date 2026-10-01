// Recovery snapshots of the platform copy of the project: list, create manually, restore with
// confirmation. Every restore first saves the current state as a new snapshot.
import { useCallback, useId, useState } from 'react';
import type { Key } from '../../lib/i18n';
import type { Doc } from '../../lib/persist';
import { useStore } from '../../lib/store';
import { type WorkspaceDoc, type WorkspaceSnapshotMeta, useLang, useT } from '../../state/app';
import { Dialog, announce } from '../ui';
import { ConfirmDialog, dateTime, useStableCallback } from './parts';
import { createSnapshot, restoreSnapshot } from './workspace';

function CreateDialog({ onCreate, onClose }: { onCreate: (label: string) => Promise<void>; onClose: () => void }) {
  const t = useT();
  const id = useId();
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const close = useStableCallback(() => { if (!busy) onClose(); });
  const submit = async () => {
    setBusy(true);
    await onCreate(label.trim());
    setBusy(false);
  };
  return (
    <Dialog title={t('project.snapshotCreate')} onClose={close} actions={<>
      <button type="button" className="btn" onClick={close} disabled={busy}>{t('common.cancel')}</button>
      <button type="button" className="btn btn-primary" onClick={() => void submit()} disabled={busy}>{t('project.snapshotCreate')}</button>
    </>}>
      <form className="path-form" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <label htmlFor={id}>{t('project.snapshotLabel')}</label>
        <input id={id} className="path-input" type="text" value={label} maxLength={80} autoComplete="off" onChange={(e) => setLabel(e.target.value)} />
      </form>
    </Dialog>
  );
}

const NONE: WorkspaceSnapshotMeta[] = [];

export function SnapshotsPanel({ doc }: { doc: Doc<WorkspaceDoc> }) {
  const t = useT();
  const lang = useLang();
  // A stable empty list: useSyncExternalStore must get the same value while nothing changed.
  const snapshots = useStore(doc.store, (w) => w.snapshots ?? NONE);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<WorkspaceSnapshotMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const say = (text: string, error = false) => { setMessage({ text, error }); announce(text); };
  const closeCreate = useCallback(() => setCreating(false), []);
  const closeRestore = useCallback(() => setRestoring(null), []);
  const reason = (s: WorkspaceSnapshotMeta) => t(`project.snapshotReason.${s.reason}` as Key, { detail: s.detail ?? '' });

  const create = async (label: string) => {
    try {
      const meta = await createSnapshot(doc, 'manual', undefined, label || undefined);
      say(t('project.snapshotCreated', { n: meta.n }));
      setCreating(false);
    } catch (e) {
      say(t('project.snapshotFailed', { error: e instanceof Error ? e.message : String(e) }), true);
      setCreating(false);
    }
  };
  const restore = async (meta: WorkspaceSnapshotMeta) => {
    setBusy(true);
    try {
      const { backup } = await restoreSnapshot(doc, meta);
      say(t('project.snapshotRestored', { n: meta.n, m: backup.n }));
    } catch (e) {
      say(t('project.snapshotFailed', { error: e instanceof Error ? e.message : String(e) }), true);
    }
    setBusy(false);
    setRestoring(null);
  };

  return (
    <section className="project-card" aria-labelledby="project-snapshots-title">
      <div className="project-card-head">
        <h2 id="project-snapshots-title" className="project-card-title">{t('project.snapshots')}</h2>
        <button type="button" className="btn" onClick={() => setCreating(true)}>{t('project.snapshotCreate')}</button>
      </div>
      <p className="ws-note">{t('project.snapshotsIntro')}</p>
      {message && <p className={message.error ? 'form-error' : 'ws-note snapshot-message'} role={message.error ? 'alert' : 'status'}>{message.text}</p>}
      {snapshots.length === 0 ? <p className="ws-empty">{t('project.snapshotEmpty')}</p> : (
        <ol className="snapshot-list" reversed>
          {[...snapshots].reverse().map((s) => (
            <li key={s.id} className="snapshot" data-snapshot={s.n}>
              <div>
                <strong>№{s.n}</strong> · {dateTime(s.createdAt, lang)}
                <span className="snapshot-meta">{reason(s)}{s.label ? ` · «${s.label}»` : ''} · {t('project.snapshotFiles', { n: s.fileCount })}</span>
              </div>
              <button type="button" className="btn btn-quiet" onClick={() => setRestoring(s)} aria-label={`${t('project.snapshotRestore')} №${s.n}`}>{t('project.snapshotRestore')}</button>
            </li>
          ))}
        </ol>
      )}
      {creating && <CreateDialog onCreate={create} onClose={closeCreate} />}
      {restoring && (
        <ConfirmDialog title={t('project.snapshotRestoreTitle', { n: restoring.n })} confirmLabel={t('project.snapshotRestore')} busy={busy} onClose={closeRestore} onConfirm={() => void restore(restoring)}>
          <p>{t('project.snapshotRestoreBody')}</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
