// Small shared UI pieces: icons, trusted compiled HTML with glossary terms, dialog, live region.
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { app, useT } from '../state/app';
import { pick } from '../lib/i18n';
import type { Lang } from '../lib/types';

const ICONS: Record<string, string> = {
  play: 'M8 5v14l11-7z',
  check: 'M4 12.5l5 5L20 6.5',
  stop: 'M7 7h10v10H7z',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z',
  lang: 'M4 5h9M8.5 3v2M6 5c.6 3.2 2.6 5.6 5.5 7M11 5c-.6 3.6-3 6.4-6.5 7.8M13 20l4-9 4 9M14.4 17h5.2',
  reset: 'M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.300 1 2.100h5c0-.8.4-1.600 1-2.100A6 6 0 0 0 12 3z',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.500 2.500 3.800 5.500 3.800 9s-1.300 6.500-3.800 9c-2.500-2.500-3.800-5.500-3.800-9S9.500 5.500 12 3z',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  gear: 'M12 15.500a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7zM19.400 13.500l1.600 1.300-1.800 3.100-2-.7a7.600 7.600 0 0 1-1.700 1l-.3 2.100h-3.600l-.3-2.100a7.600 7.600 0 0 1-1.700-1l-2 .7-1.800-3.100 1.600-1.300a7.800 7.800 0 0 1 0-2l-1.600-1.300 1.800-3.100 2 .7c.5-.4 1.100-.7 1.700-1l.3-2.100h3.600l.3 2.100c.6.3 1.200.6 1.700 1l2-.7 1.800 3.100-1.600 1.300c.1.700.1 1.300 0 2z',
  code: 'M9 8l-5 4 5 4M15 8l5 4-5 4M13 5l-2 14',
  flask: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.800 3h10.400a2 2 0 0 0 1.800-3l-5-9V3',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  skip: 'M5 5l8 7-8 7zM15 5h3v14h-3z',
  x: 'M6 6l12 12M18 6L6 18',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  terminal: 'M4 5h16v14H4zM7 9l3 3-3 3M12 15h5',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.500v.5',
  warn: 'M12 3l10 18H2zM12 10v5M12 17.500v.5',
  dot: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  steps: 'M4 18h4v-4h4v-4h4V6h4',
};

export function Icon({ name, size = 16 }: { name: keyof typeof ICONS | string; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={ICONS[name] ?? ICONS.dot} />
    </svg>
  );
}

/** Compiled lesson HTML (trusted, built from the repository). Glossary terms open a popover. */
export function Html({ html, lang, className, inline = false }: { html: string; lang: Lang; className?: string; inline?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [term, setTerm] = useState<{ id: string; anchor: HTMLElement } | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const onClick = (event: Event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>('button.term');
      if (button && node.contains(button)) setTerm((current) => (current?.anchor === button ? null : { id: button.dataset.term ?? '', anchor: button }));
    };
    node.addEventListener('click', onClick);
    return () => node.removeEventListener('click', onClick);
  }, []);
  const Tag = inline ? 'span' : 'div';
  return (
    <>
      <Tag ref={ref as never} className={className} lang={lang} dangerouslySetInnerHTML={{ __html: html }} />
      {term && <TermPopover termId={term.id} anchor={term.anchor} lang={lang} onClose={() => { term.anchor.focus(); setTerm(null); }} />}
    </>
  );
}

export function TermPopover({ termId, anchor, lang, onClose }: { termId: string; anchor: HTMLElement; lang: Lang; onClose: () => void }) {
  const t = useT();
  const term = app().glossary.get(termId);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const rect = anchor.getBoundingClientRect();
  useEffect(() => {
    anchor.setAttribute('aria-expanded', 'true');
    anchor.setAttribute('aria-controls', id);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } };
    const onDown = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node) && event.target !== anchor) onClose(); };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDown);
    return () => {
      anchor.removeAttribute('aria-expanded');
      anchor.removeAttribute('aria-controls');
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onDown);
    };
  }, [anchor, id, onClose]);
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - 372));
  const below = rect.bottom + 240 < window.innerHeight;
  return (
    <div ref={ref} id={id} className="term-popover" role="dialog" aria-label={term?.term ?? termId} lang={lang} style={{ left, ...(below ? { top: rect.bottom + 8 } : { bottom: window.innerHeight - rect.top + 8 }) }}>
      <div className="term-popover-head">
        <strong className="term-name">{term?.term ?? termId}</strong>
        {term?.name && <span className="term-local">{pick(term.name, lang)}</span>}
        <button type="button" className="icon-button" onClick={onClose} aria-label={t('term.close')}><Icon name="x" size={14} /></button>
      </div>
      {term ? <div className="prose term-definition" dangerouslySetInnerHTML={{ __html: term.definition[lang] }} /> : <p>{t('term.missing')}</p>}
      {term?.example && <pre className="code term-example"><code dangerouslySetInnerHTML={{ __html: term.example.codeHtml }} /></pre>}
      {term && <a className="term-more" href={`#/glossary/${encodeURIComponent(term.id)}`}>{t('term.more')} <Icon name="arrowRight" size={13} /></a>}
    </div>
  );
}

export function Dialog({ title, children, onClose, actions, wide = false }: { title: string; children: ReactNode; onClose: () => void; actions?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    dialog.showModal();
    const onCancel = (event: Event) => { event.preventDefault(); onClose(); };
    dialog.addEventListener('cancel', onCancel);
    return () => { dialog.removeEventListener('cancel', onCancel); dialog.close(); };
  }, [onClose]);
  return (
    <dialog ref={ref} className={wide ? 'dialog dialog-wide' : 'dialog'} aria-labelledby={titleId}>
      <h2 id={titleId} className="dialog-title">{title}</h2>
      <div className="dialog-body">{children}</div>
      {actions && <div className="dialog-actions">{actions}</div>}
    </dialog>
  );
}

/** Polite announcements for screen readers (status changes, saves, bookmarks). */
let announceImpl: (message: string) => void = () => {};
export const announce = (message: string): void => announceImpl(message);
export function LiveRegion() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    announceImpl = (m) => { setMessage(''); setTimeout(() => setMessage(m), 30); };
    return () => { announceImpl = () => {}; };
  }, []);
  return <div className="sr-only" role="status" aria-live="polite">{message}</div>;
}

export function downloadText(filename: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
