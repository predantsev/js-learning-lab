// Lesson blocks (explanation column). Every block can be bookmarked and shown in the other
// language in place, without changing the global language or any learner state (REQ-016, REQ-020).
import { type ComponentType, type ReactNode, Suspense, lazy, useId, useMemo, useRef, useState } from 'react';
import { consoleLines, localizeText } from '@shared/exercise.js';
import { prepareRun, runToCompletion, sandboxOriginFor } from '@shared/runner.js';
import { boot } from '../lib/api';
import { type Key, pick } from '../lib/i18n';
import { confirmLocalTaskItem, isAnswerCorrect, recordAnswer, recordHint, recordReview, skipLocalTask } from '../lib/progress';
import { lessonHref } from '../lib/router';
import { useStore } from '../lib/store';
import type { AnalogyBlock, Block, ConsoleEntry, ExampleBlock, ExerciseBlock, ExplanationBlock, Lang, Lesson, LocalTaskBlock, Question, ReviewBlock, TransferBlock, VisualBlock } from '../lib/types';
import { app, blockLang, toggleBlockLang, useActiveCapstone, useLang, useT } from '../state/app';
import { CodeEditor } from './CodeEditor';
import { Dialog, Html, Icon, announce } from './ui';

// The visual player is developed as its own module; the lesson still works (with the full
// text equivalent) when it is absent or fails to load.
type PlayerProps = { visual: string; spec: unknown; lang: Lang; labels: unknown; reducedMotion: boolean };
const visualModules = import.meta.glob<{ VisualPlayer: ComponentType<PlayerProps>; VISUAL_LABELS: Record<Lang, unknown> }>('../visuals/index.{ts,tsx}');
const visualLoader = Object.values(visualModules)[0];
let visualLabels: Record<Lang, unknown> | null = null;
const LazyPlayer = visualLoader
  ? lazy(async () => {
      const mod = await visualLoader();
      visualLabels = mod.VISUAL_LABELS;
      const Player = mod.VisualPlayer;
      return { default: (props: Omit<PlayerProps, 'labels'>) => <Player {...props} labels={visualLabels?.[props.lang]} /> };
    })
  : null;

const blockKey = (lessonId: string, blockId: string): string => `${lessonId}#${blockId}`;
const NO_QUESTIONS: Record<string, { answeredAt: string }> = {};

export function useBlockLang(lessonId: string, blockId: string): Lang {
  const global = useLang();
  const override = useStore(blockLang, (m) => m[blockKey(lessonId, blockId)]);
  return override ?? global;
}

function BlockToolbar({ lessonId, blockId, label, lang }: { lessonId: string; blockId: string; label: string; lang: Lang }) {
  const t = useT();
  const bookmarked = useStore(app().bookmarks.store, (b) => b.items.some((i) => i.lessonId === lessonId && i.blockId === blockId));
  const toggleBookmark = () => {
    app().bookmarks.update((b) => (bookmarked ? { items: b.items.filter((i) => !(i.lessonId === lessonId && i.blockId === blockId)) } : { items: [...b.items, { id: `${Date.now().toString(36)}-${blockId}`, lessonId, blockId, createdAt: new Date().toISOString() }] }));
    announce(t(bookmarked ? 'block.unbookmarked' : 'block.bookmarked'));
  };
  return (
    <div className="block-toolbar">
      <span className="block-label">{label}</span>
      <div className="block-actions">
        <button type="button" className="block-action" aria-pressed={lang === 'en'} onClick={() => toggleBlockLang(blockKey(lessonId, blockId), lang)} aria-label={t(lang === 'uk' ? 'lang.blockToEn' : 'lang.blockToUk')} title={t('lang.blockHint')}>
          <Icon name="lang" size={14} /><span aria-hidden="true">{lang === 'uk' ? 'EN' : 'UA'}</span>
        </button>
        <button type="button" className="block-action" aria-pressed={bookmarked} onClick={toggleBookmark} aria-label={t(bookmarked ? 'block.unbookmark' : 'block.bookmark')}>
          <Icon name="star" size={14} />
        </button>
      </div>
    </div>
  );
}

function BlockFrame({ lessonId, block, label, className, children, lang }: { lessonId: string; block: { id: string }; label: string; className: string; children: ReactNode; lang: Lang }) {
  return (
    <section className={`block ${className}`} id={`block-${block.id}`} data-block={block.id} lang={lang} tabIndex={-1} aria-label={label}>
      <BlockToolbar lessonId={lessonId} blockId={block.id} label={label} lang={lang} />
      {children}
    </section>
  );
}

function ExplanationView({ lessonId, block }: { lessonId: string; block: ExplanationBlock }) {
  const t = useT();
  const lang = useBlockLang(lessonId, block.id);
  return (
    <BlockFrame lessonId={lessonId} block={block} label={t('block.explanation')} className="block-explanation" lang={lang}>
      <h2 className="block-title">{block.title[lang]}</h2>
      <Html html={block.body[lang]} lang={lang} className="prose" />
    </BlockFrame>
  );
}

function AnalogyView({ lessonId, block }: { lessonId: string; block: AnalogyBlock }) {
  const t = useT();
  const lang = useBlockLang(lessonId, block.id);
  return (
    <BlockFrame lessonId={lessonId} block={block} label={t('block.analogy')} className="block-analogy" lang={lang}>
      <Html html={block.body[lang]} lang={lang} className="prose" />
      <div className="analogy-limits"><span className="label">{t('block.analogyLimits')}</span><Html html={block.limits[lang]} lang={lang} className="prose" /></div>
    </BlockFrame>
  );
}

function VisualView({ lessonId, block }: { lessonId: string; block: VisualBlock }) {
  const t = useT();
  const lang = useBlockLang(lessonId, block.id);
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const available = LazyPlayer !== null && block.spec !== null;
  return (
    <BlockFrame lessonId={lessonId} block={block} label={t('block.visual')} className="block-visual" lang={lang}>
      <h3 className="block-subtitle">{block.title[lang]}</h3>
      {available && LazyPlayer ? (
        <ErrorBoundary fallback={<p className="ws-note">{t('block.visualUnavailable')}</p>}>
          <Suspense fallback={<p className="ws-empty">{t('app.loading')}</p>}>
            <LazyPlayer visual={block.visual} spec={block.spec} lang={lang} reducedMotion={reducedMotion} />
          </Suspense>
        </ErrorBoundary>
      ) : <p className="ws-note">{t('block.visualUnavailable')}</p>}
      <details className="text-equivalent" open={!available}>
        <summary>{t('block.textEquivalent')}</summary>
        <Html html={block.textEquivalent[lang]} lang={lang} className="prose" />
      </details>
    </BlockFrame>
  );
}

import { Component } from 'react';
class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

// ---------- questions (prediction, review, self-check) ----------
interface QuestionProps { question: Question; lang: Lang; answered: boolean; onAnswer: (correct: boolean) => void; idPrefix: string }

export function QuestionView({ question, lang, answered, onAnswer, idPrefix }: QuestionProps) {
  const t = useT();
  const a = question.answer;
  const name = useId();
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState('');
  const shuffled = useMemo(() => (a.type === 'order' ? [...a.items].sort((x, y) => (hash(x.id + idPrefix) < hash(y.id + idPrefix) ? -1 : 1)).map((i) => i.id) : []), [a, idPrefix]);
  const [order, setOrder] = useState<string[]>(shuffled);
  const [result, setResult] = useState<null | boolean>(null);
  const [output, setOutput] = useState<{ lines: string[]; error: string | null } | null>(null);
  const hiddenHost = useRef<HTMLDivElement>(null);
  const done = result !== null;
  const canSubmit = a.type === 'text' ? text.trim() !== '' : a.type === 'order' ? true : picked.length > 0;

  const submit = () => {
    const given = a.type === 'text' ? text : a.type === 'order' ? order : picked;
    const correct = isAnswerCorrect(question, given, lang);
    setResult(correct);
    onAnswer(correct);
    announce(t(correct ? 'q.correct' : 'q.incorrect'));
  };
  const runCode = async () => {
    if (!question.code || !hiddenHost.current) return;
    const sandboxOrigin = sandboxOriginFor(boot.port);
    const prepared = prepareRun({ files: { 'index.js': question.code[lang] }, entry: 'index.js', runtime: 'browser-js', sandboxOrigin, lang });
    if ('errors' in prepared) { setOutput({ lines: [], error: prepared.errors[0].message }); return; }
    const r = (await runToCompletion({ container: hiddenHost.current, sandboxOrigin, prepared, timeoutMs: 8000 })) as { console: ConsoleEntry[]; errors: { name: string; message: string }[] };
    setOutput({ lines: consoleLines(r.console), error: r.errors[0] ? `${r.errors[0].name}: ${r.errors[0].message}` : null });
  };
  const move = (index: number, delta: number) => setOrder((o) => { const next = [...o]; const j = index + delta; if (j < 0 || j >= next.length) return o; [next[index], next[j]] = [next[j], next[index]]; return next; });
  const optionById = (id: string) => (a.type === 'order' ? a.items : a.type === 'text' ? [] : a.options).find((o) => o.id === id);
  const optionLabel = (id: string) => { const o = optionById(id); return o?.codeHtml ? <code className="option-code" dangerouslySetInnerHTML={{ __html: o.codeHtml[lang] }} /> : <Html inline html={o?.text?.[lang] ?? ''} lang={lang} />; };

  return (
    <div className="question">
      <Html html={question.prompt[lang]} lang={lang} className="prose question-prompt" />
      {question.codeHtml && <pre className="code"><code dangerouslySetInnerHTML={{ __html: question.codeHtml[lang] }} /></pre>}
      <fieldset className="question-answer" disabled={done}>
        <legend className="sr-only">{t('q.yourAnswer')}</legend>
        {(a.type === 'choice' || a.type === 'multi') && (
          <>
            {a.type === 'multi' && <p className="question-hint">{t('q.chooseMulti')}</p>}
            {a.options.map((o) => {
              const checked = picked.includes(o.id);
              const mark = done ? (a.correct.includes(o.id) ? 'option-correct' : checked ? 'option-wrong' : '') : '';
              return (
                <label key={o.id} className={`option ${mark} ${checked ? 'option-picked' : ''}`}>
                  <input type={a.type === 'choice' ? 'radio' : 'checkbox'} name={name} value={o.id} checked={checked} onChange={(e) => setPicked(a.type === 'choice' ? [o.id] : e.target.checked ? [...picked, o.id] : picked.filter((x) => x !== o.id))} />
                  <span className="option-text">{optionLabel(o.id)}{done && a.correct.includes(o.id) && <span className="sr-only"> — {t('q.correctAnswer')}</span>}</span>
                  {done && checked && o.why && <Html html={o.why[lang]} lang={lang} className="option-why" inline />}
                </label>
              );
            })}
          </>
        )}
        {a.type === 'text' && <input className="text-answer" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={a.placeholder ? a.placeholder[lang] : t('q.textPlaceholder')} aria-label={t('q.yourAnswer')} autoComplete="off" spellCheck={false} onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit && !done) submit(); }} />}
        {a.type === 'order' && (
          <ol className="order-list" aria-label={t('q.order')}>
            {order.map((id, i) => (
              <li key={id} className="order-item">
                <span className="order-text">{optionLabel(id)}</span>
                <button type="button" className="icon-button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('q.moveUp')}><Icon name="up" size={14} /></button>
                <button type="button" className="icon-button" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={t('q.moveDown')}><Icon name="down" size={14} /></button>
              </li>
            ))}
          </ol>
        )}
      </fieldset>
      {!done ? (
        <div className="question-actions">
          <button type="button" className="btn btn-primary" onClick={submit} disabled={!canSubmit}>{t('q.submit')}</button>
          {!canSubmit && !answered && <span className="question-hint">{t('q.choose')}</span>}
        </div>
      ) : (
        <div className={`question-result ${result ? 'result-ok' : 'result-no'}`} role="status">
          <p className="result-title"><Icon name={result ? 'check' : 'info'} /> {t(result ? 'q.correct' : 'q.incorrect')}</p>
          {a.type === 'text' && !result && <p>{t('q.correctAnswer')}: <code>{a.accept[lang][0]}</code></p>}
          {a.type === 'order' && !result && <div><span className="label">{t('q.correctAnswer')}</span><ol className="order-correct">{a.items.map((i) => <li key={i.id}>{optionLabel(i.id)}</li>)}</ol></div>}
          <Html html={question.explanation[lang]} lang={lang} className="prose" />
          <div className="question-actions">
            {question.code && question.runnable !== false && <button type="button" className="btn" onClick={() => void runCode()}><Icon name="play" /> {t('q.run')}</button>}
            {!result && <button type="button" className="btn btn-quiet" onClick={() => { setResult(null); setPicked([]); setText(''); }}>{t('q.tryAgain')}</button>}
          </div>
          {output && <div className="real-output"><span className="label">{t('q.realOutput')}</span><pre lang="en">{[...output.lines, ...(output.error ? [output.error] : [])].join('\n') || '—'}</pre></div>}
        </div>
      )}
      <div ref={hiddenHost} className="hidden-frame-host" aria-hidden="true" />
    </div>
  );
}
function hash(s: string): number { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; }

function PredictionView({ lesson, block }: { lesson: Lesson; block: Extract<Block, { kind: 'prediction' }> }) {
  const t = useT();
  const lang = useBlockLang(lesson.id, block.id);
  const answered = useStore(app().progress.store, (p) => Boolean(p.lessons[lesson.id]?.questions[block.id]));
  return (
    <BlockFrame lessonId={lesson.id} block={block} label={t('block.prediction')} className="block-prediction" lang={lang}>
      <QuestionView question={block} lang={lang} answered={answered} idPrefix={block.id} onAnswer={(correct) => {
        app().progress.update((p) => recordAnswer(p, lesson, block.id, correct));
        if (!correct) app().review.update((r) => recordReview(r, lesson.id, block.id, '_', false));
      }} />
    </BlockFrame>
  );
}

function ReviewView({ lesson, block }: { lesson: Lesson; block: ReviewBlock }) {
  const t = useT();
  const lang = useBlockLang(lesson.id, block.id);
  // The fallback must be a stable reference: a fresh object per read makes the store subscription loop.
  const progress = useStore(app().progress.store, (p) => p.lessons[lesson.id]?.questions ?? NO_QUESTIONS);
  return (
    <BlockFrame lessonId={lesson.id} block={block} label={t('block.review')} className="block-review" lang={lang}>
      <h3 className="block-subtitle">{block.title[lang]}</h3>
      {block.items.map((item) => {
        const source = app().byId.get(item.from);
        return (
          <div key={item.id} className="review-item">
            <QuestionView question={item} lang={lang} answered={Boolean(progress[`${block.id}/${item.id}`])} idPrefix={`${block.id}/${item.id}`} onAnswer={(correct) => {
              app().progress.update((p) => recordAnswer(p, lesson, `${block.id}/${item.id}`, correct));
              app().review.update((r) => recordReview(r, lesson.id, block.id, item.id, correct));
            }} />
            {source && <a className="review-from" href={lessonHref(item.from)}>{t('q.from', { lesson: pick(source.lesson.title, lang) })}</a>}
          </div>
        );
      })}
    </BlockFrame>
  );
}

// ---------- practice cards (left column, next to the workspace) ----------
function ExampleCard({ lessonId, block }: { lessonId: string; block: ExampleBlock }) {
  const t = useT();
  const lang = useBlockLang(lessonId, block.id);
  return (
    <BlockFrame lessonId={lessonId} block={block} label={t('block.example')} className="block-task" lang={lang}>
      <h3 className="block-subtitle"><Icon name="flask" /> {block.title[lang]}</h3>
      <Html html={block.body[lang]} lang={lang} className="prose" />
      {block.tryIt && <div className="try-it"><Icon name="pencil" /><Html html={block.tryIt[lang]} lang={lang} className="prose" /></div>}
    </BlockFrame>
  );
}

function Hints({ lesson, block, lang }: { lesson: Lesson; block: ExerciseBlock; lang: Lang }) {
  const t = useT();
  const p = useStore(app().progress.store, (s) => s.lessons[lesson.id]?.exercises[block.id]);
  const [confirming, setConfirming] = useState(false);
  const [solutionFile, setSolutionFile] = useState(Object.keys(block.solution)[0] ?? block.entry);
  const reveal = (level: 'nudge' | 'explanation' | 'solution') => app().progress.update((s) => recordHint(s, lesson, block.id, level));
  const solutionFiles = Object.keys(block.solution);
  return (
    <div className="hints">
      {block.hints ? (
        <>
          {!p?.hintNudgeAt ? (
            <button type="button" className="btn btn-quiet hint-toggle" onClick={() => reveal('nudge')}><Icon name="bulb" /> {t('hint.need')}</button>
          ) : (
            <div className="hint"><span className="label">{t('hint.nudge')}</span><Html html={block.hints.nudge[lang]} lang={lang} className="prose" /></div>
          )}
          {p?.hintNudgeAt && (!p.hintExplanationAt ? (
            <button type="button" className="btn btn-quiet hint-toggle" onClick={() => reveal('explanation')}>{t('hint.more')}</button>
          ) : (
            <div className="hint"><span className="label">{t('hint.explanation')}</span><Html html={block.hints.explanation[lang]} lang={lang} className="prose" /></div>
          ))}
        </>
      ) : <p className="hint-none">{t('hint.none')}</p>}
      {!p?.solutionViewedAt ? (
        <button type="button" className="btn btn-quiet hint-toggle solution-toggle" onClick={() => setConfirming(true)}>{t('hint.solution')}</button>
      ) : (
        <div className="solution">
          <span className="label">{t('hint.solutionTitle')}</span>
          <p className="ws-note">{t('hint.solutionNote')}</p>
          {solutionFiles.length > 1 && <div className="file-tabs">{solutionFiles.map((f) => <button key={f} type="button" className={f === solutionFile ? 'file-tab active' : 'file-tab'} onClick={() => setSolutionFile(f)}>{f}</button>)}</div>}
          <CodeEditor path={solutionFile} value={localizeText(block.solution[solutionFile] ?? '', block, lang)} readOnly ariaLabel={`${t('hint.solutionTitle')}: ${solutionFile}`} minHeight="4rem" />
          <Html html={block.solutionNote[lang]} lang={lang} className="prose" />
        </div>
      )}
      {confirming && (
        <Dialog title={t('hint.solution')} onClose={() => setConfirming(false)} actions={<>
          <button type="button" className="btn" onClick={() => setConfirming(false)}>{t('hint.cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={() => { reveal('solution'); setConfirming(false); }}>{t('hint.solutionShow')}</button>
        </>}>
          <p>{t('hint.solutionConfirm')}</p>
        </Dialog>
      )}
    </div>
  );
}

function ExerciseCard({ lesson, block, showHints = true }: { lesson: Lesson; block: ExerciseBlock; showHints?: boolean }) {
  const t = useT();
  const lang = useBlockLang(lesson.id, block.id);
  const label = block.assessment ? t('block.exercise.assessment') : block.mode === 'debug' ? t('block.exercise.debug') : block.mode === 'independent' ? t('block.exercise.independent') : t('block.exercise');
  return (
    <BlockFrame lessonId={lesson.id} block={block} label={label} className="block-task" lang={lang}>
      <h3 className="block-subtitle"><Icon name="pencil" /> {block.title[lang]}</h3>
      <Html html={block.instructions[lang]} lang={lang} className="prose" />
      {showHints && <Hints lesson={lesson} block={block} lang={lang} />}
    </BlockFrame>
  );
}

function TransferView({ lesson, block }: { lesson: Lesson; block: TransferBlock }) {
  const t = useT();
  const lang = useBlockLang(lesson.id, block.id);
  const capstone = useActiveCapstone();
  const unit = block.capstoneStep ? app().index.stages.flatMap((s) => s.units).find((u) => u.id === block.capstoneStep) : null;
  return (
    <BlockFrame lessonId={lesson.id} block={block} label={t('block.transfer')} className="block-transfer" lang={lang}>
      <Html html={block.body[lang]} lang={lang} className="prose" />
      {unit?.capstoneStep && (capstone ? (
        <div className="transfer-variant"><span className="label">{t('transfer.yourVariant')} · {pick(app().index.capstones.find((c) => c.id === capstone)?.title, lang)}</span><p><Html inline html={unit.capstoneStep.variants[capstone][lang]} lang={lang} /></p></div>
      ) : <p className="ws-note">{t('transfer.noProject')}</p>)}
      <a className="btn" href={block.capstoneStep ? `#/project/${encodeURIComponent(block.capstoneStep)}` : '#/project'}><Icon name="folder" /> {capstone ? t('transfer.open') : t('transfer.choose')}</a>
    </BlockFrame>
  );
}

function CopyButton({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return <button type="button" className="btn btn-quiet copy-button" onClick={() => { void navigator.clipboard.writeText(text).then(() => { setCopied(true); announce(t('local.copied')); setTimeout(() => setCopied(false), 1500); }); }}><Icon name="copy" size={13} /> {copied ? t('local.copied') : t('local.copy')}</button>;
}

function LocalTaskView({ lesson, block }: { lesson: Lesson; block: LocalTaskBlock }) {
  const t = useT();
  const lang = useBlockLang(lesson.id, block.id);
  const p = useStore(app().progress.store, (s) => s.lessons[lesson.id]?.localTasks[block.id]);
  const skipped = p?.skipped && !p.confirmedAt;
  return (
    <BlockFrame lessonId={lesson.id} block={block} label={t('block.localTask')} className="block-local" lang={lang}>
      <h3 className="block-subtitle"><Icon name="terminal" /> {block.title[lang]}</h3>
      <p className="runtime-note"><Icon name="info" size={13} /> {t(`ws.runtime.${block.runtime}` as Key)}</p>
      <Html html={block.intro[lang]} lang={lang} className="prose" />
      <h4>{t('local.tools')}</h4>
      <ul className="tool-list">{block.tools.map((tool) => <li key={tool.name}><strong>{tool.name}</strong>{tool.version && <span className="tool-version"> {tool.version}</span>}{tool.note && <> — <Html inline html={tool.note[lang]} lang={lang} /></>}</li>)}</ul>
      <h4>{t('local.steps')}</h4>
      <ol className="local-steps">
        {block.steps.map((step, i) => (
          <li key={i}>
            <Html html={step.text[lang]} lang={lang} className="prose" />
            {step.command && <div className="command"><pre lang="en"><code>{step.command}</code></pre><CopyButton text={step.command} /></div>}
            {step.expect && <div className="expect"><span className="label">{t('local.expect')}</span><Html html={step.expect[lang]} lang={lang} className="prose" /></div>}
          </li>
        ))}
      </ol>
      <h4>{t('local.verify')}</h4>
      <p className="ws-note">{t('local.verifyNote')}</p>
      <ul className="verify-list">
        {block.verify.map((v) => (
          <li key={v.id}><label className="option"><input type="checkbox" checked={Boolean(p?.confirmed[v.id])} onChange={(e) => app().progress.update((s) => confirmLocalTaskItem(s, lesson, block.id, v.id, e.target.checked))} /><span className="option-text"><Html inline html={v.text[lang]} lang={lang} /></span></label></li>
        ))}
      </ul>
      {p?.confirmedAt && <p className="local-confirmed"><Icon name="check" /> {t('local.confirmed')}</p>}
      {skipped ? (
        <div className="local-skipped"><p>{t(p?.skipped?.reason === 'no-native-tooling' ? 'local.skippedNative' : 'local.skippedLater')}</p><button type="button" className="btn btn-quiet" onClick={() => app().progress.update((s) => skipLocalTask(s, lesson, block.id, null))}>{t('local.unskip')}</button></div>
      ) : !p?.confirmedAt && (
        <div className="question-actions">
          {block.runtime === 'local-native' && <button type="button" className="btn btn-quiet" onClick={() => app().progress.update((s) => skipLocalTask(s, lesson, block.id, 'no-native-tooling'))}>{t('local.skipNative')}</button>}
          <button type="button" className="btn btn-quiet" onClick={() => app().progress.update((s) => skipLocalTask(s, lesson, block.id, 'later'))}>{t('local.skipLater')}</button>
        </div>
      )}
      <details className="troubleshooting"><summary>{t('local.troubleshooting')}</summary>
        <dl>{block.troubleshooting.map((item, i) => <div key={i}><dt><Html inline html={item.problem[lang]} lang={lang} /></dt><dd><Html html={item.fix[lang]} lang={lang} className="prose" /></dd></div>)}</dl>
        <h4>{t('local.recovery')}</h4>
        <Html html={block.recovery[lang]} lang={lang} className="prose" />
      </details>
    </BlockFrame>
  );
}

export function BlockView({ lesson, block }: { lesson: Lesson; block: Block }) {
  switch (block.kind) {
    case 'explanation': return <ExplanationView lessonId={lesson.id} block={block} />;
    case 'analogy': return <AnalogyView lessonId={lesson.id} block={block} />;
    case 'visual': return <VisualView lessonId={lesson.id} block={block} />;
    case 'prediction': return <PredictionView lesson={lesson} block={block} />;
    case 'review': return <ReviewView lesson={lesson} block={block} />;
    case 'example': return <ExampleCard lessonId={lesson.id} block={block} />;
    case 'exercise': return <ExerciseCard lesson={lesson} block={block} />;
    case 'transfer': return <TransferView lesson={lesson} block={block} />;
    case 'local-task': return <LocalTaskView lesson={lesson} block={block} />;
    default: return null;
  }
}
export { ExerciseCard };
