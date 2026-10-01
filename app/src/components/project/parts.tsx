// Small building blocks of the project screen: confirmation and path dialogs, a readable line
// diff and binary downloads. Dialogs use the shared accessible <Dialog> (keyboard, focus, Escape).
import { type FormEvent, type ReactNode, useCallback, useId, useMemo, useRef, useState } from 'react';
import { TEXT_FILE_EXTENSIONS, lineDiff } from '@shared/capstone.js';
import { type Key, formatDate } from '../../lib/i18n';
import type { Lang } from '../../lib/types';
import { useT } from '../../state/app';
import { Dialog } from '../ui';

export function downloadBytes(filename: string, bytes: Uint8Array, type: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const today = (): string => new Date().toISOString().slice(0, 10);

/** Date and time for check, snapshot and export lines. */
export const dateTime = (iso: string, lang: Lang): string => `${formatDate(iso, lang)}, ${new Date(iso).toLocaleTimeString(lang === 'uk' ? 'uk-UA' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}`;

/**
 * A callback with a stable identity that always calls the latest `fn`. <Dialog> reopens when its
 * onClose changes, so dialogs must not receive a new function on every render.
 */
export function useStableCallback<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: A) => ref.current(...args), []);
}

/** Localized explanation of a path problem from shared/capstone.js. */
export function usePathMessage(): (problem: { code: string; segment?: string }) => string {
  const t = useT();
  return useCallback((problem) => t(`project.path.${problem.code}` as Key, { segment: problem.segment ?? '', ext: TEXT_FILE_EXTENSIONS.map((e: string) => `.${e}`).join(', ') }), [t]);
}

export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onClose, busy = false, danger = false }: { title: string; children: ReactNode; confirmLabel: string; onConfirm: () => void; onClose: () => void; busy?: boolean; danger?: boolean }) {
  const t = useT();
  const close = useStableCallback(() => { if (!busy) onClose(); });
  return (
    <Dialog title={title} onClose={close} actions={<>
      <button type="button" className="btn" onClick={onClose} disabled={busy}>{t('common.cancel')}</button>
      <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
    </>}>
      {children}
    </Dialog>
  );
}

/** Ask for a project file path; `onSubmit` returns an error message or null when it succeeded. */
export function PathDialog({ title, initial, submitLabel, onSubmit, onClose }: { title: string; initial: string; submitLabel: string; onSubmit: (path: string) => string | null; onClose: () => void }) {
  const t = useT();
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const close = useStableCallback(onClose);
  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    setError(onSubmit(value.trim()));
  };
  return (
    <Dialog title={title} onClose={close} actions={<>
      <button type="button" className="btn" onClick={onClose}>{t('common.cancel')}</button>
      <button type="button" className="btn btn-primary" onClick={() => submit()}>{submitLabel}</button>
    </>}>
      <form className="path-form" onSubmit={submit}>
        <label htmlFor={inputId}>{t('project.pathLabel')}</label>
        <input id={inputId} className="path-input" type="text" value={value} autoComplete="off" spellCheck={false} aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`} aria-invalid={error ? true : undefined} onChange={(e) => { setValue(e.target.value); setError(null); }} />
        <p id={hintId} className="ws-note">{t('project.pathHint', { ext: TEXT_FILE_EXTENSIONS.map((e: string) => `.${e}`).join(', ') })}</p>
        {error && <p id={errorId} className="form-error" role="alert">{error}</p>}
      </form>
    </Dialog>
  );
}

/** Readable line diff of one file; long unchanged runs are folded. */
export function DiffView({ before, after, label }: { before: string; after: string; label: string }) {
  const t = useT();
  const lines = useMemo(() => {
    const all = lineDiff(before, after) as { kind: 'add' | 'del' | 'same'; text: string }[];
    const out: ({ kind: 'add' | 'del' | 'same'; text: string } | { kind: 'fold'; count: number })[] = [];
    for (let i = 0; i < all.length; i += 1) {
      if (all[i].kind !== 'same') { out.push(all[i]); continue; }
      let j = i;
      while (j < all.length && all[j].kind === 'same') j += 1;
      const run = all.slice(i, j);
      // Keep three lines of context next to each change and fold the rest of an unchanged run.
      const head = i === 0 ? 0 : 3;
      const tail = j === all.length ? 0 : 3;
      if (run.length > head + tail + 1) out.push(...run.slice(0, head), { kind: 'fold', count: run.length - head - tail }, ...run.slice(run.length - tail));
      else out.push(...run);
      i = j - 1;
    }
    return out;
  }, [before, after]);
  return (
    <pre className="diff" aria-label={label} tabIndex={0}>
      {lines.map((line, i) => line.kind === 'fold'
        ? <span key={i} className="diff-line diff-fold">⋯ {line.count}</span>
        : <span key={i} className={`diff-line diff-${line.kind}`}><span className="diff-mark" aria-hidden="true">{line.kind === 'add' ? '+' : line.kind === 'del' ? '−' : ' '}</span>{line.kind !== 'same' && <span className="sr-only">{t(line.kind === 'add' ? 'project.diff.added' : 'project.diff.removed')}: </span>}{line.text}{'\n'}</span>)}
    </pre>
  );
}
