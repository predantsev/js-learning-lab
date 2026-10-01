// Applying a reference state ("starter") to the platform copy of the project (REQ-003; CURRICULUM.md
// "Before export"): a changed-file preview with per-file diffs, a recovery snapshot first, an explicit
// choice, and provenance — covered steps become "reference applied", never "done".
import { useEffect, useMemo, useState } from 'react';
import { starterChanges, starterCovers } from '@shared/capstone.js';
import type { Doc } from '../../lib/persist';
import type { WorkspaceDoc, WorkspaceSnapshotMeta } from '../../state/app';
import { useT } from '../../state/app';
import { Dialog, Icon } from '../ui';
import { type Capstone, referenceFiles } from './content';
import { DiffView, useStableCallback } from './parts';
import { applyStarter, recordReferenceViewed, workspaceLang } from './workspace';

type Change = { path: string; kind: 'added' | 'modified' | 'unchanged' | 'kept'; before?: string; after?: string };

export function StarterDialog({ doc, capstone, through, onClose, onApplied }: { doc: Doc<WorkspaceDoc>; capstone: Capstone; through: string | null; onClose: () => void; onApplied: (snapshot: WorkspaceSnapshotMeta, covers: string[]) => void }) {
  const t = useT();
  const ws = doc.value;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { changes, covers } = useMemo(() => {
    const reference = referenceFiles(capstone, through, workspaceLang(ws));
    return { changes: (starterChanges(ws.files, reference) as { changes: Change[] }).changes, covers: starterCovers(capstone.steps, ws.steps, through) as string[] };
  }, [capstone, through, ws]);
  const changed = changes.filter((c) => c.kind === 'added' || c.kind === 'modified');
  const ref = through === null ? t('project.ref.start') : t('project.ref.step', { unit: through });
  // The preview shows the reference solution of `through`: a later own pass of it counts as assisted.
  useEffect(() => { if (through !== null) recordReferenceViewed(doc, through); }, [doc, through]);

  const apply = async () => {
    setBusy(true);
    setError(null);
    try {
      const { snapshot, covers: covered } = await applyStarter(doc, capstone, through);
      onApplied(snapshot, covered);
    } catch (e) {
      setError(t('project.starter.failed', { error: e instanceof Error ? e.message : String(e) }));
      setBusy(false);
    }
  };

  const close = useStableCallback(() => { if (!busy) onClose(); });
  return (
    <Dialog wide title={t('project.starter.title', { ref })} onClose={close} actions={<>
      <button type="button" className="btn" onClick={onClose} disabled={busy}>{t('common.cancel')}</button>
      <button type="button" className="btn btn-primary" onClick={() => void apply()} disabled={busy}>{busy ? t('project.starter.applying') : t('project.starter.apply')}</button>
    </>}>
      <p>{t('project.starter.intro')}</p>
      {covers.length > 0 && <p className="banner banner-info starter-covers"><Icon name="info" /> {t('project.starter.covers', { units: covers.join(', ') })}</p>}
      <p className="ws-note">{t('project.starter.platformOnly')}</p>
      <ul className="starter-changes" aria-label={t('project.files')}>
        {changes.map((c) => (
          <li key={c.path} className={`starter-change starter-${c.kind}`}>
            <code>{c.path}</code> <span className={`badge ${c.kind === 'modified' ? 'badge-warn' : c.kind === 'added' ? 'badge-ok' : ''}`}>{t(`project.starter.${c.kind}`)}</span>
            {(c.kind === 'modified' || c.kind === 'added') && (
              <details className="starter-diff" open={changed.length <= 2}>
                <summary>{c.path}</summary>
                <DiffView before={c.before ?? ''} after={c.after ?? ''} label={c.path} />
              </details>
            )}
          </li>
        ))}
      </ul>
      {changed.length === 0 && <p className="ws-note">{t('project.starter.noChanges')}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </Dialog>
  );
}
