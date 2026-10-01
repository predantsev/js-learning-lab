// Lesson screen: explanation and practice side by side, step by step, resumable (REQ-004, REQ-011).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentError, loadLesson } from '../lib/content';
import { type Key, pick } from '../lib/i18n';
import type { Doc } from '../lib/persist';
import { isLessonComplete, recordSelfCheck, requiredItems, skipLesson, unskipLesson, visitPage } from '../lib/progress';
import { lessonHref, navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { Block, DraftsDoc, ExampleBlock, ExerciseBlock, Lesson, Question } from '../lib/types';
import { app, loadDrafts, updateProfile, useLang, useT } from '../state/app';
import { BlockView, ExerciseCard, QuestionView } from './blocks';
import { Dialog, Html, Icon } from './ui';
import { Workspace } from './Workspace';

const isWorkspaceBlock = (b: Block): b is ExampleBlock | ExerciseBlock => b.kind === 'example' || b.kind === 'exercise';

function SelfCheck({ lesson, drafts, onClose }: { lesson: Lesson; drafts: Doc<DraftsDoc>; onClose: (outcome: 'passed' | 'failed' | 'cancelled') => void }) {
  const t = useT();
  const lang = useLang();
  const items = (lesson.selfCheck ?? []).map((id) => lesson.blocks.find((b) => b.id === id)).filter((b): b is Block => Boolean(b));
  const [results, setResults] = useState<Record<string, boolean>>({});
  const done = items.every((b) => b.id in results);
  const passed = done && items.every((b) => results[b.id]);
  const [finished, setFinished] = useState(false);
  return (
    <Dialog wide title={t('skip.selfCheckTitle')} onClose={() => onClose('cancelled')} actions={finished ? (
      <>
        {!passed && <button type="button" className="btn btn-primary" onClick={() => onClose('cancelled')}>{t('skip.goLesson')}</button>}
        <button type="button" className={passed ? 'btn btn-primary' : 'btn'} onClick={() => onClose(passed ? 'passed' : 'failed')}>{passed ? t('common.close') : t('skip.skipAnyway')}</button>
      </>
    ) : (
      <>
        <button type="button" className="btn" onClick={() => onClose('cancelled')}>{t('skip.cancel')}</button>
        <button type="button" className="btn btn-primary" disabled={!done} onClick={() => { app().progress.update((p) => recordSelfCheck(p, lesson, passed)); setFinished(true); }}>{t('skip.finish')}</button>
      </>
    )}>
      {finished ? <p className={passed ? 'result-title result-ok' : 'result-title'}>{t(passed ? 'skip.selfCheckPassed' : 'skip.selfCheckFailed')}</p> : (
        <>
          <p className="ws-note">{t('skip.selfCheckIntro')}</p>
          {items.map((block) => block.kind === 'exercise' ? (
            <div key={block.id} className="selfcheck-exercise">
              <ExerciseCard lesson={lesson} block={block} showHints={false} />
              <Workspace lesson={lesson} block={block} drafts={drafts} lang={lang} recordProgress={false} onChecked={(ok) => setResults((r) => ({ ...r, [block.id]: ok }))} />
            </div>
          ) : block.kind === 'prediction' ? (
            <div key={block.id} className="block block-prediction"><QuestionView question={block as Question} lang={lang} answered={false} idPrefix={`sc-${block.id}`} onAnswer={(ok) => setResults((r) => ({ ...r, [block.id]: r[block.id] ?? ok }))} /></div>
          ) : null)}
        </>
      )}
    </Dialog>
  );
}

function LessonBody({ lesson, drafts, page, focusBlock }: { lesson: Lesson; drafts: Doc<DraftsDoc>; page: number; focusBlock: string | null }) {
  const t = useT();
  const lang = useLang();
  const main = useRef<HTMLDivElement>(null);
  const progress = useStore(app().progress.store, (p) => p.lessons[lesson.id]);
  const [skipOpen, setSkipOpen] = useState(false);
  const [selfCheck, setSelfCheck] = useState(false);
  const pageCount = lesson.pages.length;
  const current = Math.min(page, pageCount - 1);
  const blocks = lesson.pages[current].map((id) => lesson.blocks.find((b) => b.id === id)).filter((b): b is Block => Boolean(b));
  const workspaceBlock = blocks.find(isWorkspaceBlock) ?? null;
  const ref = app().byId.get(lesson.id);
  const next = ref ? app().flat.slice(ref.index + 1).find((r) => r.lesson.authored) : undefined;
  const skipped = progress?.state === 'skipped';

  useEffect(() => {
    if (skipped) return;
    app().progress.update((p) => visitPage(p, lesson, current));
    updateProfile({ lastLesson: { id: lesson.id, page: current } });
  }, [lesson, current, skipped]);

  useEffect(() => {
    const target = focusBlock ? document.getElementById(`block-${focusBlock}`) : main.current;
    if (!target) return;
    target.focus({ preventScroll: true });
    if (focusBlock) target.scrollIntoView({ block: 'start' });
    else document.querySelector('.app-main')?.scrollTo({ top: 0 });
  }, [lesson.id, current, focusBlock]);

  const remaining = useMemo(() => {
    if (!progress || progress.state === 'completed') return [];
    const req = requiredItems(lesson);
    const out: string[] = [];
    const q = req.questions.filter((k) => !progress.questions[k]).length;
    const e = req.exercises.filter((k) => !progress.exercises[k]?.passedAt).length;
    const l = req.localTasks.filter((k) => !progress.localTasks[k]?.confirmedAt && !progress.localTasks[k]?.skipped).length;
    if (!lesson.blocks.every((b) => progress.seenBlocks.includes(b.id))) out.push(t('lesson.remaining.pages'));
    if (q) out.push(t('lesson.remaining.questions', { n: q }));
    if (e) out.push(t('lesson.remaining.exercises', { n: e }));
    if (l) out.push(t('lesson.remaining.local', { n: l }));
    return out;
  }, [lesson, progress, t]);

  const go = (p: number) => navigate(lessonHref(lesson.id, p));
  const doSkip = () => { app().progress.update((p) => skipLesson(p, lesson)); setSkipOpen(false); if (next) navigate(lessonHref(next.lesson.id)); else navigate('#/course'); };
  const complete = progress ? progress.state === 'completed' || isLessonComplete(lesson, progress) : false;

  return (
    <div className="lesson" ref={main} tabIndex={-1} aria-labelledby="lesson-title">
      <header className="page-heading">
        <div>
          <span className="eyebrow">{ref ? `${pick(ref.unit.title, lang)} · ${ref.unit.id}` : lesson.unit}</span>
          <h1 id="lesson-title">{lesson.title[lang]}</h1>
        </div>
        <div className="page-meta">
          <span className="chip">{t(`lesson.kind.${lesson.kind}` as Key)}</span>
          <span className="chip">{t('lesson.minutes', { n: lesson.minutes })}</span>
          <span className="chip chip-steps" aria-current="step">{t('lesson.page', { n: current + 1, total: pageCount })}</span>
        </div>
      </header>

      {skipped && (
        <div className="banner banner-info" role="status">
          <div><strong>{t('lesson.skipped')}</strong>{progress?.selfCheck?.passedAt && <span className="badge badge-ok">{t('evidence.selfCheck')}</span>}<p>{t('lesson.skippedBody')}</p></div>
          <button type="button" className="btn btn-primary" onClick={() => app().progress.update((p) => unskipLesson(p, lesson.id))}>{t('lesson.resume')}</button>
        </div>
      )}

      {current === 0 && (
        <section className="objectives" aria-label={t('lesson.objectives')}>
          {lesson.purpose && <Html html={lesson.purpose[lang]} lang={lang} className="prose" />}
          <span className="label">{t('lesson.objectives')}</span>
          <ul>{lesson.objectives.map((o, i) => <li key={i} dangerouslySetInnerHTML={{ __html: o[lang] }} />)}</ul>
        </section>
      )}

      <div className={workspaceBlock ? 'lesson-columns' : 'lesson-columns lesson-single'}>
        <div className="lesson-left">{blocks.map((block) => <BlockView key={block.id} lesson={lesson} block={block} />)}</div>
        {workspaceBlock && <div className="lesson-right"><Workspace key={workspaceBlock.id} lesson={lesson} block={workspaceBlock} drafts={drafts} lang={lang} /></div>}
      </div>

      <footer className="lesson-footer">
        {!skipped && progress?.state !== 'completed' && <button type="button" className="btn btn-quiet" onClick={() => setSkipOpen(true)}>{t('lesson.known')} <Icon name="skip" size={14} /></button>}
        <nav className="pager" aria-label={t('lesson.page', { n: current + 1, total: pageCount })}>
          <button type="button" className="btn" onClick={() => go(current - 1)} disabled={current === 0}><Icon name="arrowLeft" /> {t('lesson.prev')}</button>
          <ol className="pager-dots" aria-hidden="true">{lesson.pages.map((_, i) => <li key={i} className={i === current ? 'dot current' : i < current || progress?.seenBlocks.includes(lesson.pages[i][0]) ? 'dot seen' : 'dot'} />)}</ol>
          {current < pageCount - 1
            ? <button type="button" className="btn btn-primary" onClick={() => go(current + 1)}>{t('lesson.next')} <Icon name="arrowRight" /></button>
            : next
              ? <a className="btn btn-primary" href={lessonHref(next.lesson.id)}>{t('lesson.nextLesson')} <Icon name="arrowRight" /></a>
              : <a className="btn btn-primary" href="#/course">{t('lesson.toCourse')}</a>}
        </nav>
      </footer>
      {current === pageCount - 1 && !skipped && (
        complete
          ? <p className="lesson-done" role="status"><Icon name="check" /> <strong>{t('lesson.completed')}</strong> {t('lesson.completedBody')}</p>
          : remaining.length > 0 && <p className="lesson-remaining" role="status">{t('lesson.remaining', { items: remaining.join('; ') })}</p>
      )}

      {skipOpen && !selfCheck && (
        <Dialog title={t('skip.title')} onClose={() => setSkipOpen(false)} actions={<>
          <button type="button" className="btn" onClick={() => setSkipOpen(false)}>{t('skip.cancel')}</button>
          <button type="button" className="btn" onClick={doSkip}>{t('skip.without')}</button>
          {(lesson.selfCheck?.length ?? 0) > 0 && <button type="button" className="btn btn-primary" onClick={() => setSelfCheck(true)}>{t('skip.selfCheck')}</button>}
        </>}>
          <p>{t('skip.body')}</p>
        </Dialog>
      )}
      {selfCheck && <SelfCheck lesson={lesson} drafts={drafts} onClose={(outcome) => { setSelfCheck(false); if (outcome === 'cancelled') setSkipOpen(false); else doSkip(); }} />}
    </div>
  );
}

export function LessonView({ id, page, block }: { id: string; page: number; block: string | null }) {
  const t = useT();
  const lang = useLang();
  const [loaded, setLoaded] = useState<{ lesson: Lesson; drafts: Doc<DraftsDoc> } | null>(null);
  const [error, setError] = useState<ContentError | Error | null>(null);
  const ref = app().byId.get(id);

  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    setError(null);
    if (ref && !ref.lesson.authored) return undefined;
    Promise.all([loadLesson(id), loadDrafts(id)]).then(
      ([lesson, drafts]) => { if (!cancelled) setLoaded({ lesson, drafts }); },
      (e) => { if (!cancelled) setError(e); },
    );
    return () => { cancelled = true; };
  }, [id, ref]);

  if (ref && !ref.lesson.authored) {
    return <div className="state-card"><h1>{pick(ref.lesson.title, lang)}</h1><p>{t('lesson.notAuthoredBody')}</p><a className="btn" href="#/course">{t('lesson.toCourse')}</a></div>;
  }
  if (error) {
    const missing = error instanceof ContentError && error.code === 'missing';
    return (
      <div className="state-card" role="alert">
        <h1>{missing ? t('lesson.missingTitle') : t('error.title')}</h1>
        <p>{missing ? t('lesson.missingBody') : error instanceof ContentError && error.code === 'corrupt' ? t('error.contentCorrupt') : t('error.serverUnreachable')}</p>
        <details><summary>{t('error.details')}</summary><pre>{error.message}</pre></details>
        <a className="btn" href="#/course">{t('lesson.toCourse')}</a>
      </div>
    );
  }
  if (!loaded || loaded.lesson.id !== id) return <p className="ws-empty" role="status">{t('app.loading')}</p>;
  // A bookmark or link may name a block: open the page that contains it.
  const blockPage = block ? loaded.lesson.pages.findIndex((p) => p.includes(block)) : -1;
  return <LessonBody lesson={loaded.lesson} drafts={loaded.drafts} page={blockPage >= 0 ? blockPage : page} focusBlock={blockPage >= 0 ? block : null} />;
}
