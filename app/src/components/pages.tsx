// Screens other than the lesson: onboarding, course map, bookmarks, review, glossary, settings, project.
import { type KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { ApiError, api } from '../lib/api';
import { loadLesson } from '../lib/content';
import { type Key, formatDate, pick } from '../lib/i18n';
import { dueReviews, lessonEvidence, recordReview, skipLesson } from '../lib/progress';
import { lessonHref, navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { CapstoneId, IndexLesson, IndexUnit, Lang, Lesson, Question, ReviewItemState, StyleId } from '../lib/types';
import { STYLE_IDS, app, updateProfile, useActiveCapstone, useLang, useProfile, useT } from '../state/app';
import { QuestionView } from './blocks';
import { startProject } from './project/workspace';
import { Html, Icon, downloadText } from './ui';

const STATE_ICON: Record<string, string> = { unseen: '○', 'in-progress': '◐', skipped: '⤼', completed: '✓' };

function EvidenceBadges({ lesson }: { lesson: IndexLesson }) {
  const t = useT();
  const p = useStore(app().progress.store, (s) => s.lessons[lesson.id]);
  const e = lessonEvidence(lesson, p);
  return (
    <span className="evidence">
      {e.selfCheckPassed && <span className="badge badge-ok">{t('evidence.selfCheck')}</span>}
      {e.exercisesTotal > 0 && e.exercisesPassed > 0 && <span className="badge">{t('evidence.exercises', { done: e.exercisesPassed, total: e.exercisesTotal })}</span>}
      {e.hintAssisted && <span className="badge">{t('evidence.hints')}</span>}
      {e.solutionViewed && <span className="badge">{t('evidence.solution')}</span>}
      {e.localTotal > 0 && e.localConfirmed > 0 && <span className="badge">{t('evidence.local', { done: e.localConfirmed, total: e.localTotal })}</span>}
      {e.localUnperformed > 0 && <span className="badge badge-warn">{t('evidence.localUnperformed')}</span>}
    </span>
  );
}

export function LessonRow({ lesson, compact = false, current = false }: { lesson: IndexLesson; compact?: boolean; current?: boolean }) {
  const t = useT();
  const lang = useLang();
  const state = useStore(app().progress.store, (s) => s.lessons[lesson.id]?.state ?? 'unseen');
  const page = useStore(app().progress.store, (s) => s.lessons[lesson.id]?.page ?? 0);
  const label = lesson.authored ? t(`state.${state}` as Key) : t('state.notAuthored');
  const body = (
    <>
      <span className={`state-icon state-${lesson.authored ? state : 'none'}`} aria-hidden="true">{lesson.authored ? STATE_ICON[state] : '·'}</span>
      <span className="lesson-row-title">{pick(lesson.title, lang)}</span>
      <span className="sr-only"> — {label}</span>
      {!compact && lesson.minutes !== null && <span className="lesson-row-meta">{t('course.minutes', { n: lesson.minutes })}</span>}
    </>
  );
  return (
    <li className={`lesson-row ${current ? 'current' : ''} ${lesson.authored ? '' : 'disabled'}`}>
      {lesson.authored ? <a href={lessonHref(lesson.id, state === 'in-progress' ? page : 0)} aria-current={current ? 'page' : undefined}>{body}</a> : <span className="lesson-row-static">{body}</span>}
      {!compact && lesson.authored && <EvidenceBadges lesson={lesson} />}
    </li>
  );
}

function UnitCard({ unit }: { unit: IndexUnit }) {
  const t = useT();
  const lang = useLang();
  const done = useStore(app().progress.store, (s) => unit.lessons.filter((l) => s.lessons[l.id]?.state === 'completed').length);
  const hasOpen = useStore(app().progress.store, (s) => unit.lessons.some((l) => l.authored && !['completed', 'skipped'].includes(s.lessons[l.id]?.state ?? 'unseen')));
  const capstone = useActiveCapstone();
  const skipUnit = () => {
    if (!window.confirm(t('course.skipUnitConfirm'))) return;
    app().progress.update((p) => unit.lessons.filter((l) => l.authored).reduce((doc, l) => skipLesson(doc, { id: l.id }), p));
  };
  return (
    <section className="unit-card" aria-labelledby={`unit-${unit.id}`}>
      <header className="unit-head">
        <div>
          <span className="eyebrow">{unit.id}</span>
          <h3 id={`unit-${unit.id}`}>{pick(unit.title, lang)}</h3>
          {unit.summary && <p className="unit-summary">{pick(unit.summary, lang)}</p>}
        </div>
        <span className="unit-progress">{t('course.stageProgress', { done, total: unit.lessons.length })}</span>
      </header>
      <ol className="lesson-list">{unit.lessons.map((l) => <LessonRow key={l.id} lesson={l} />)}</ol>
      {unit.capstoneStep && (
        <p className="unit-capstone"><Icon name="folder" size={14} /> <strong>{t('course.capstoneStep')}:</strong> <Html inline html={capstone ? unit.capstoneStep.variants[capstone][lang] : pick(unit.capstoneStep.objective, lang)} lang={lang} /></p>
      )}
      {hasOpen && <button type="button" className="btn btn-quiet" onClick={skipUnit}>{t('course.skipUnit')}</button>}
    </section>
  );
}

export function CoursePage() {
  const t = useT();
  const lang = useLang();
  const { index } = app();
  const last = useStore(app().profile.store, (p) => p.lastLesson);
  const lastRef = last ? app().byId.get(last.id) : undefined;
  const first = app().flat.find((r) => r.lesson.authored);
  const target = lastRef?.lesson.authored ? lessonHref(lastRef.lesson.id, last?.page ?? 0) : first ? lessonHref(first.lesson.id) : null;
  return (
    <div className="page">
      <header className="page-heading"><div><h1>{t('course.title')}</h1><p className="page-lead">{t('course.intro')}</p></div>
        {target && <a className="btn btn-primary" href={target}>{t('nav.continue')}{lastRef ? `: ${pick(lastRef.lesson.title, lang)}` : ''} <Icon name="arrowRight" /></a>}
      </header>
      {index.stages.map((stage) => (
        <section key={stage.id} className="stage" aria-labelledby={`stage-${stage.id}`}>
          <h2 id={`stage-${stage.id}`} className="stage-title">{pick(stage.title, lang)}</h2>
          {stage.summary && <p className="page-lead">{pick(stage.summary, lang)}</p>}
          {stage.units.every((u) => u.lessons.length === 0) ? <p className="ws-empty">{t('course.emptyStage')}</p> : <div className="unit-grid">{stage.units.filter((u) => u.lessons.length > 0).map((u) => <UnitCard key={u.id} unit={u} />)}</div>}
        </section>
      ))}
    </div>
  );
}

export function Onboarding() {
  const t = useT();
  const lang = useLang();
  const [choice, setChoice] = useState<CapstoneId | null>(null);
  const [busy, setBusy] = useState(false);
  const start = async () => {
    if (!choice) return;
    setBusy(true);
    await startProject(choice);
    updateProfile({ onboardingDone: true });
    const first = app().flat.find((r) => r.lesson.authored);
    navigate(first ? lessonHref(first.lesson.id) : '#/course');
  };
  return (
    <div className="page onboarding">
      <header className="page-heading"><div><h1>{t('onboarding.title')}</h1><p className="page-lead">{t('onboarding.lead')}</p></div></header>
      <section aria-labelledby="how"><h2 id="how">{t('onboarding.how')}</h2><ul className="how-list"><li>{t('onboarding.how1')}</li><li>{t('onboarding.how2')}</li><li>{t('onboarding.how3')}</li></ul></section>
      <section aria-labelledby="choose"><h2 id="choose">{t('onboarding.choose')}</h2><p className="page-lead">{t('onboarding.chooseLead')}</p>
        <div className="capstone-grid" role="radiogroup" aria-labelledby="choose">
          {app().index.capstones.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={choice === c.id} className={choice === c.id ? 'capstone-card selected' : 'capstone-card'} onClick={() => setChoice(c.id)}>
              <strong>{pick(c.title, lang)}</strong><span>{pick(c.pitch, lang)}</span>{choice === c.id && <span className="badge badge-ok">{t('onboarding.selected')}</span>}
            </button>
          ))}
        </div>
      </section>
      <button type="button" className="btn btn-primary btn-large" disabled={!choice || busy} onClick={() => void start()}>{t('onboarding.start')} <Icon name="arrowRight" /></button>
    </div>
  );
}

export function BookmarksPage() {
  const t = useT();
  const lang = useLang();
  const items = useStore(app().bookmarks.store, (b) => b.items);
  const { index, byId } = app();
  const resolve = (lessonId: string, blockId: string) => {
    const redirected = index.redirects[`${lessonId}#${blockId}`] ?? index.redirects[lessonId];
    const [l, b] = redirected ? (redirected.includes('#') ? redirected.split('#') : [redirected, blockId]) : [lessonId, blockId];
    const ref = byId.get(l);
    const block = ref?.lesson.blocks.find((x) => x.id === b);
    return { ref, block, moved: Boolean(redirected), lessonId: l, blockId: b };
  };
  return (
    <div className="page">
      <header className="page-heading"><div><h1>{t('bookmarks.title')}</h1><p className="page-lead">{t('bookmarks.intro')}</p></div></header>
      {items.length === 0 ? <p className="ws-empty">{t('bookmarks.empty')}</p> : (
        <ul className="bookmark-list">
          {items.map((item) => {
            const r = resolve(item.lessonId, item.blockId);
            return (
              <li key={item.id} className="bookmark">
                <div>
                  <strong>{r.ref ? pick(r.ref.lesson.title, lang) : item.lessonId}</strong>
                  <span className="bookmark-block">{r.block ? `${t(`block.${r.block.kind === 'local-task' ? 'localTask' : r.block.kind}` as Key)}${r.block.title ? ` · ${pick(r.block.title, lang)}` : ''}` : item.blockId}</span>
                  {r.moved && r.block && <p className="ws-note">{t('bookmarks.moved')}</p>}
                  {!r.block && <p className="ws-note" role="status">{t('bookmarks.missing')}</p>}
                </div>
                <div className="bookmark-actions">
                  {r.block ? <a className="btn" href={lessonHref(r.lessonId, 0, r.blockId)}>{t('bookmarks.open')}</a> : r.ref?.lesson.authored ? <a className="btn" href={lessonHref(r.lessonId)}>{t('bookmarks.openLesson')}</a> : null}
                  <button type="button" className="btn btn-quiet" onClick={() => app().bookmarks.update((b) => ({ items: b.items.filter((x) => x.id !== item.id) }))}>{t('bookmarks.remove')}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ReviewCard({ item, lang, onDone }: { item: ReviewItemState; lang: Lang; onDone: () => void }) {
  const t = useT();
  const [lesson, setLesson] = useState<Lesson | null | 'missing'>(null);
  useMemo(() => { loadLesson(item.lessonId).then(setLesson, () => setLesson('missing')); }, [item.lessonId]);
  if (lesson === null) return <p className="ws-empty">{t('app.loading')}</p>;
  const block = lesson === 'missing' ? undefined : lesson.blocks.find((b) => b.id === item.blockId);
  const question: Question | undefined = block?.kind === 'review' ? block.items.find((i) => i.id === item.itemId) : block?.kind === 'prediction' ? block : undefined;
  if (!question) return <p className="ws-note">{t('bookmarks.missing')}</p>;
  return (
    <div className="block block-review">
      <QuestionView key={`${item.lessonId}${item.blockId}${item.itemId}${item.attempts}`} question={question} lang={lang} answered={false} idPrefix={`rv-${item.itemId}-${item.attempts}`} onAnswer={(correct) => { app().review.update((r) => recordReview(r, item.lessonId, item.blockId, item.itemId, correct)); onDone(); }} />
      <a className="review-from" href={lessonHref(item.lessonId)}>{t('review.openLesson')}</a>
    </div>
  );
}

export function ReviewPage() {
  const t = useT();
  const lang = useLang();
  const doc = useStore(app().review.store);
  const [all, setAll] = useState(false);
  const [answered, setAnswered] = useState<string[]>([]);
  const session = useMemo(() => (all ? Object.values(doc.items) : dueReviews(doc)).map((i) => `${i.lessonId}#${i.blockId}/${i.itemId}`), [all]); // eslint-disable-line react-hooks/exhaustive-deps
  const queue = session.map((k) => doc.items[k]).filter(Boolean);
  const total = Object.keys(doc.items).length;
  return (
    <div className="page">
      <header className="page-heading"><div><h1>{t('review.title')}</h1><p className="page-lead">{t('review.intro')}</p></div></header>
      <p><strong>{t('review.due', { n: dueReviews(doc).length })}</strong> · {t('review.all', { n: total })} {total > 0 && !all && <button type="button" className="btn btn-quiet" onClick={() => setAll(true)}>{t('review.practiceAll')}</button>}</p>
      {queue.length === 0 ? <p className="ws-empty">{total === 0 ? t('review.none') : t('review.done')}</p> : (
        <ol className="review-queue">{queue.map((item) => { const key = `${item.lessonId}#${item.blockId}/${item.itemId}`; return (
          <li key={key}><ReviewCard item={item} lang={lang} onDone={() => setAnswered((a) => [...a, key])} />{answered.includes(key) && <p className="ws-note">{t('review.nextAt', { date: formatDate(doc.items[key].nextAt, lang) })}</p>}</li>
        ); })}</ol>
      )}
    </div>
  );
}

export function GlossaryPage({ term }: { term: string | null }) {
  const t = useT();
  const lang = useLang();
  const [query, setQuery] = useState('');
  const terms = useMemo(() => [...app().glossary.values()], []);
  const q = query.trim().toLowerCase();
  const shown = terms.filter((x) => !q || x.term.toLowerCase().includes(q) || pick(x.name, lang).toLowerCase().includes(q) || (x.aliases ?? []).some((a) => a.toLowerCase().includes(q)));
  // A link to one term (from a lesson popover or "see also") lands on that term, not the page top.
  useEffect(() => {
    const target = term ? document.getElementById(`term-${term}`) : null;
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'center' });
  }, [term]);
  return (
    <div className="page">
      <header className="page-heading"><div><h1>{t('glossary.title')}</h1><p className="page-lead">{t('glossary.intro')}</p></div></header>
      {term && !app().glossary.has(term) && <p className="ws-note" role="status">{t('term.missing')}</p>}
      <label className="search"><span className="sr-only">{t('glossary.search')}</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('glossary.search')} /></label>
      {shown.length === 0 ? <p className="ws-empty">{t('glossary.empty')}</p> : (
        <dl className="glossary">
          {shown.map((x) => (
            <div key={x.id} id={`term-${x.id}`} tabIndex={-1} className={x.id === term ? 'glossary-item current' : 'glossary-item'}>
              <dt><span className="term-name" lang="en">{x.term}</span>{x.name && <span className="term-local"> · {pick(x.name, lang)}</span>}</dt>
              <dd>
                <Html html={x.definition[lang]} lang={lang} className="prose" />
                {x.context && <Html html={x.context[lang]} lang={lang} className="prose term-context" />}
                {x.example && <div><span className="label">{t('glossary.example')}</span><pre className="code" lang="en"><code dangerouslySetInnerHTML={{ __html: x.example.codeHtml }} /></pre>{x.example.note && <Html html={x.example.note[lang]} lang={lang} className="prose" />}</div>}
                {x.aliases && x.aliases.length > 0 && <p className="term-aliases">{t('glossary.aliases')}: {x.aliases.join(', ')}</p>}
                {x.see && x.see.length > 0 && <p className="term-see">{t('glossary.see')}: {x.see.map((id, i) => <span key={id}>{i > 0 && ', '}<a href={`#/glossary/${id}`}>{app().glossary.get(id)?.term ?? id}</a></span>)}</p>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

interface BackupPreview { ok: boolean; problems: string[]; summary?: { total: number; new: number; replacing: number; unchanged: number } }

export function SettingsPage() {
  const t = useT();
  const profile = useProfile();
  const { bootstrap, index } = app();
  const [backup, setBackup] = useState<{ data: unknown; preview: BackupPreview } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canBackup = Boolean(bootstrap.features.backup?.available);
  const createBackup = async () => {
    try {
      const data = await api<Record<string, unknown>>('POST', '/api/backup/create', {});
      downloadText(`js-learning-lab-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data));
    } catch (e) { setMessage(e instanceof ApiError ? e.message : String(e)); }
  };
  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    try {
      const data = JSON.parse(await file.text());
      setBackup({ data, preview: await api<BackupPreview>('POST', '/api/backup/preview', { backup: data }) });
    } catch (e) { setBackup(null); setMessage(`${t('settings.restoreProblems')} ${e instanceof Error ? e.message : String(e)}`); }
  };
  const apply = async () => {
    if (!backup) return;
    try {
      await api('POST', '/api/backup/apply', { backup: backup.data, mode: 'replace' });
      setMessage(t('settings.restoreDone'));
      setTimeout(() => location.reload(), 900);
    } catch (e) { setMessage(e instanceof ApiError ? e.message : String(e)); }
  };
  // ARIA radio group: one tab stop (the selected option); arrow keys move and select.
  const onRadioKey = <T extends string>(event: KeyboardEvent<HTMLDivElement>, value: T, options: T[], onChange: (v: T) => void) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const index = (options.indexOf(value) + delta + options.length) % options.length;
    onChange(options[index]);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[index]?.focus();
  };
  const radio = <T extends string>(name: string, value: T, options: T[], labelKey: (v: T) => Key, onChange: (v: T) => void) => (
    <div className="segmented" role="radiogroup" aria-label={name} onKeyDown={(e) => onRadioKey(e, value, options, onChange)}>{options.map((o) => <button key={o} type="button" role="radio" aria-checked={value === o} tabIndex={value === o ? 0 : -1} className={value === o ? 'segment active' : 'segment'} onClick={() => onChange(o)}>{t(labelKey(o))}</button>)}</div>
  );
  return (
    <div className="page settings">
      <header className="page-heading"><div><h1>{t('settings.title')}</h1></div></header>
      <section><h2>{t('settings.language')}</h2>{radio(t('settings.language'), profile.language, ['uk', 'en'], (v) => `lang.${v}` as Key, (v) => updateProfile({ language: v }))}<p className="ws-note">{t('settings.languageNote')}</p></section>
      <section><h2>{t('settings.style')}</h2>{radio<StyleId>(t('settings.style'), profile.styleId, STYLE_IDS, (v) => `settings.style.${v}` as Key, (v) => updateProfile({ styleId: v }))}<p className="ws-note">{t('settings.styleNote')}</p></section>
      <section><h2>{t('settings.appearance')}</h2>{radio(t('settings.appearance'), profile.appearance, ['system', 'light', 'dark'], (v) => `settings.appearance.${v}` as Key, (v) => updateProfile({ appearance: v }))}</section>
      <section><h2>{t('settings.textSize')}</h2>{radio(t('settings.textSize'), profile.textSize, ['compact', 'default', 'large'], (v) => `settings.textSize.${v}` as Key, (v) => updateProfile({ textSize: v }))}</section>
      <section><h2>{t('settings.data')}</h2><p>{t('settings.dataBody', { dir: bootstrap.dataDir })}</p>
        {canBackup ? (
          <div className="settings-actions">
            <button type="button" className="btn" onClick={() => void createBackup()}>{t('settings.backup')}</button>
            <label className="btn">{t('settings.restore')}<input className="sr-only" type="file" accept="application/json,.json" onChange={(e) => void pickFile(e.target.files?.[0])} /></label>
          </div>
        ) : <p className="ws-note">{t('settings.backupUnavailable')}</p>}
        {backup && (backup.preview.ok && backup.preview.summary ? (
          <div className="banner banner-info"><p>{t('settings.restorePreview', { total: backup.preview.summary.total, added: backup.preview.summary.new, replaced: backup.preview.summary.replacing, same: backup.preview.summary.unchanged })}</p><button type="button" className="btn btn-primary" onClick={() => void apply()}>{t('settings.restoreApply')}</button></div>
        ) : <div className="banner banner-danger" role="alert"><p>{t('settings.restoreProblems')}</p><ul>{backup.preview.problems.map((p, i) => <li key={i}>{p}</li>)}</ul></div>)}
        {message && <p role="status" className="ws-note">{message}</p>}
      </section>
      <section><h2>{t('settings.runtime')}</h2><p>{t('settings.runtimeBody')}</p></section>
      <section><h2>{t('settings.about')}</h2><p>{t('settings.aboutBody', { version: bootstrap.version, node: bootstrap.node, content: index.contentVersion })}</p></section>
    </div>
  );
}

// The project screen lives in ./project (capstone workspace, steps, snapshots, export).
export { ProjectPage } from './project/ProjectPage';
