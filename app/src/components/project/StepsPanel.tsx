// Project steps of the whole course, grouped by stage: state per step (not done / checked by the
// platform / reference applied / confirmed by the learner / not performed), the selected step's
// task and the offers to supply missing prior work. In-platform steps are checked here; local steps
// (VS Code, terminal, device) are confirmed by the learner, like a lesson's local task.
import { useState } from 'react';
import { isStepConfirmed, isStepDone, isStepNotPerformed, isStepSkipped, missingBefore, startingReference, stepNeedsDevice } from '@shared/capstone.js';
import { type Key, pick } from '../../lib/i18n';
import type { Doc } from '../../lib/persist';
import { useStore } from '../../lib/store';
import type { IndexStage, IndexUnit, L10n } from '../../lib/types';
import { type WorkspaceDoc, type WorkspaceStep, app, useLang, useT } from '../../state/app';
import { Html, Icon, announce } from '../ui';
import { type Capstone, type CapstoneStep, resolveHtml } from './content';
import { dateTime } from './parts';
import { confirmLocalStep, declineStarter, markStepNotPerformed, recordNudge, reopenLocalStep, undoDeclineStarter, workspaceLang } from './workspace';

export interface StepRow { unit: string; unitTitle: L10n; stage: IndexStage; plan: IndexUnit['capstoneStep']; step: CapstoneStep | null }

/** Every project step of the course in teaching order, published or planned, with its stage. */
export function stepRows(capstone: Capstone): StepRow[] {
  return app().index.stages.flatMap((stage) => stage.units
    .map((u) => ({ unit: u.id, unitTitle: u.title, stage, plan: u.capstoneStep, step: capstone.steps.find((s) => s.unit === u.id) ?? null }))
    .filter((r) => r.step !== null || r.plan !== null));
}

type StepStatus = 'done' | 'done-assisted' | 'skipped' | 'confirmed' | 'not-performed' | 'pending' | 'unpublished';
const statusOf = (row: StepRow, record: WorkspaceStep | undefined): StepStatus => {
  if (!row.step) return 'unpublished';
  if (isStepDone(record)) return record?.assisted ? 'done-assisted' : 'done';
  if (isStepConfirmed(record)) return 'confirmed';
  if (isStepNotPerformed(record)) return 'not-performed';
  if (isStepSkipped(record)) return 'skipped';
  return 'pending';
};
const STATUS_ICON: Record<StepStatus, string> = { done: '✓', 'done-assisted': '✓', confirmed: '✓', skipped: '⤼', 'not-performed': '⤼', pending: '○', unpublished: '·' };
const STATUS_KEY: Record<StepStatus, Key> = { done: 'project.step.done', 'done-assisted': 'project.step.doneAssisted', confirmed: 'project.step.confirmed', skipped: 'project.step.skipped', 'not-performed': 'project.step.notPerformed', pending: 'project.step.pending', unpublished: 'project.step.unpublished' };

/** A local step: the learner carries it out outside the platform and confirms it (or, native: has no device). */
function LocalStepActions({ doc, step, status }: { doc: Doc<WorkspaceDoc>; step: CapstoneStep; status: StepStatus }) {
  const t = useT();
  const lang = useLang();
  const record = useStore(doc.store, (w) => w.steps[step.unit]);
  const native = stepNeedsDevice(step);
  const act = (change: () => void, message: Key) => { change(); announce(t(message)); };
  return (
    <div className="step-task step-local">
      <p className="ws-note">{t(native ? 'project.localNativeBody' : 'project.localBody')}</p>
      {status === 'confirmed' && record?.confirmedAt && <p className="local-confirmed"><Icon name="check" /> {t('project.local.confirmedAt', { date: dateTime(record.confirmedAt, lang) })}</p>}
      {status === 'not-performed' && <p className="local-skipped">{t('project.local.notPerformedBody')}</p>}
      {status === 'confirmed' || status === 'not-performed' ? (
        <button type="button" className="btn btn-quiet" onClick={() => act(() => reopenLocalStep(doc, step.unit), 'project.local.reopened')}>{t('local.unskip')}</button>
      ) : (
        <div className="question-actions">
          <button type="button" className="btn" onClick={() => act(() => confirmLocalStep(doc, step.unit), 'project.step.confirmed')}><Icon name="check" /> {t('project.local.confirm')}</button>
          {native && <button type="button" className="btn btn-quiet" onClick={() => act(() => markStepNotPerformed(doc, step.unit), 'project.step.notPerformed')}>{t('local.skipNative')}</button>}
        </div>
      )}
    </div>
  );
}

export function StepsPanel({ doc, capstone, rows, selected, current, onSelect, onStarter }: {
  doc: Doc<WorkspaceDoc>;
  capstone: Capstone;
  rows: StepRow[];
  selected: string | null;
  current: string | null;
  onSelect: (unit: string) => void;
  /** Open the starter dialog for the reference after `through` (null = CP-START). */
  onStarter: (through: string | null) => void;
}) {
  const t = useT();
  const lang = useLang();
  const ws = useStore(doc.store);
  const wsLang = workspaceLang(ws);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const row = rows.find((r) => r.unit === selected) ?? null;
  const step = row?.step ?? null;
  const record = selected ? ws.steps[selected] : undefined;
  const status = row ? statusOf(row, record) : 'unpublished';
  const missing = step && step.mode === 'in-platform' ? (missingBefore(capstone.steps, ws.steps, step.unit) as string[]) : [];
  const noFiles = Object.keys(ws.files).length === 0;
  const variant = row?.plan?.variants?.[capstone.id];
  const stages = app().index.stages.filter((stage) => rows.some((r) => r.stage.id === stage.id));
  const stepButton = (r: StepRow) => {
    const st = statusOf(r, ws.steps[r.unit]);
    return (
      <li key={r.unit}>
        <button type="button" className={`project-step-button step-${st}`} aria-current={r.unit === selected ? 'step' : undefined} data-unit={r.unit} data-mode={r.step?.mode ?? r.plan?.mode ?? undefined} onClick={() => onSelect(r.unit)}>
          <span className="step-icon" aria-hidden="true">{STATUS_ICON[st]}</span>
          <span className="step-name"><span className="step-unit">{r.unit}</span> {r.step ? pick(r.step.title, lang) : pick(r.unitTitle, lang)}</span>
          <span className="step-state">{t(STATUS_KEY[st])}{r.step?.mode === 'local' ? ` · ${t('project.step.local')}` : ''}{r.unit === current && st === 'pending' ? ` · ${t('project.step.current')}` : ''}</span>
        </button>
      </li>
    );
  };

  return (
    <>
      <section className="project-card" aria-labelledby="project-steps-title">
        <h2 id="project-steps-title" className="project-card-title">{t('project.stepsTitle')}</h2>
        {stages.map((stage) => {
          const own = rows.filter((r) => r.stage.id === stage.id);
          const published = own.filter((r) => r.step);
          const planned = own.filter((r) => !r.step);
          const holdsSelected = own.some((r) => r.unit === selected);
          return (
            <details key={stage.id} className="project-stage" data-stage={stage.id} open={holdsSelected || (selected === null && stage.id === stages[0]?.id)}>
              <summary><span className="project-stage-title">{pick(stage.title, lang)}</span> <span className="project-stage-count">{t('project.stageCount', { done: published.filter((r) => ['done', 'done-assisted', 'confirmed'].includes(statusOf(r, ws.steps[r.unit]))).length, total: published.length })}</span></summary>
              <ol className="project-steps">{published.map(stepButton)}</ol>
              {planned.length > 0 && (
                <details className="planned-steps" open={planned.some((r) => r.unit === selected)}>
                  <summary>{t('project.plannedSteps', { n: planned.length })}</summary>
                  <ol className="project-steps project-steps-planned">{planned.map(stepButton)}</ol>
                </details>
              )}
            </details>
          );
        })}
      </section>

      {noFiles && (
        <section className="banner banner-info" role="status">
          <div><strong>{t('project.noFilesTitle')}</strong><p>{t('project.noFilesBody')}</p></div>
          <button type="button" className="btn btn-primary" onClick={() => onStarter(null)}>{t('project.noFilesApply')}</button>
        </section>
      )}

      {selected && (
        <section className="project-card project-step-detail" aria-labelledby="project-step-title" data-step={selected}>
          <div className="project-step-head">
            <span className="eyebrow">{selected}{row ? ` · ${pick(row.stage.title, lang)}` : ''}</span>
            <span className={`badge step-badge step-${status}`} data-status={status}>{t(STATUS_KEY[status])}</span>
          </div>
          <h2 id="project-step-title" className="project-card-title">{step ? pick(step.title, lang) : row ? pick(row.unitTitle, lang) : selected}</h2>
          {!step && (
            <>
              <p className="ws-note">{t('project.unpublishedBody')}</p>
              {variant && <p>{pick(variant, lang)}</p>}
            </>
          )}
          {step && step.mode === 'in-platform' && missing.length > 0 && !noFiles && (
            record?.starterDeclinedAt ? (
              <p className="ws-note starter-declined">{t('project.missingDeclined')} <button type="button" className="btn btn-quiet" onClick={() => undoDeclineStarter(doc, step.unit)}>{t('project.missingReconsider')}</button></p>
            ) : (
              <div className="banner banner-info starter-offer" role="status">
                <div><strong>{t('project.missingTitle')}</strong><p>{t('project.missingBody', { units: missing.join(', ') })}</p></div>
                <div className="banner-actions">
                  <button type="button" className="btn btn-primary" onClick={() => onStarter(startingReference(capstone.steps, step.unit))}>{t('project.missingPreview')}</button>
                  <button type="button" className="btn" onClick={() => declineStarter(doc, step.unit)}>{t('project.missingKeep')}</button>
                </div>
              </div>
            )
          )}
          {step && (
            <>
              <details className="step-about" open={!record?.attempts && status === 'pending'}>
                <summary>{t('project.aboutStep')}</summary>
                <Html html={step.intro[lang]} lang={lang} className="prose step-intro" />
              </details>
              <div className="step-task">
                <h3>{t('project.stepTask')}</h3>
                <Html html={resolveHtml(step.instructions[lang], step.strings, wsLang)} lang={lang} className="prose" />
                {step.nudge && (nudgeOpen || record?.nudgeAt ? (
                  <div className="hint"><span className="label">{t('project.nudge')}</span><Html html={resolveHtml(step.nudge[lang], step.strings, wsLang)} lang={lang} className="prose" /></div>
                ) : (
                  <button type="button" className="btn btn-quiet hint-toggle" onClick={() => { recordNudge(doc, step.unit); setNudgeOpen(true); }}><Icon name="bulb" /> {t('project.nudgeShow')}</button>
                ))}
                {step.mode === 'in-platform' && record?.lastCheck && <p className="ws-note">{t('project.lastCheck', { date: dateTime(record.lastCheck.at, lang), passed: record.lastCheck.passed, total: record.lastCheck.total })}</p>}
                {step.mode === 'in-platform' && status === 'pending' && !noFiles && <button type="button" className="btn btn-quiet skip-step" onClick={() => onStarter(step.unit)}>{t('project.skipStep')}</button>}
              </div>
              {step.mode === 'local' && <LocalStepActions doc={doc} step={step} status={status} />}
            </>
          )}
        </section>
      )}
    </>
  );
}
