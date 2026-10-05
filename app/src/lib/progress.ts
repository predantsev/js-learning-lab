// Progress and evidence rules (REQ-003, REQ-018, REQ-033). Pure functions over the progress document:
// base lesson states (unseen → in-progress → completed, or skipped) are kept apart from evidence
// (self-check passed, exercise passed, hint-assisted, solution viewed, local task confirmed).
import type { Answer, ExerciseProgress, IndexLesson, Lang, Lesson, LessonProgress, ProgressDoc, ReviewDoc, ReviewItemState } from './types';

const now = (): string => new Date().toISOString();

export const emptyLessonProgress = (contentVersion: number): LessonProgress => ({ state: 'in-progress', page: 0, startedAt: now(), contentVersion, questions: {}, exercises: {}, examples: {}, localTasks: {}, seenBlocks: [] });

function withLesson(doc: ProgressDoc, lesson: { id: string; contentVersion?: number }, change: (p: LessonProgress) => LessonProgress): ProgressDoc {
  const current = doc.lessons[lesson.id] ?? emptyLessonProgress(lesson.contentVersion ?? 1);
  const next = change(current);
  return next === current && doc.lessons[lesson.id] ? doc : { ...doc, lessons: { ...doc.lessons, [lesson.id]: next } };
}

/** Which blocks must be done for the base state "completed". */
export function requiredItems(lesson: Lesson): { questions: string[]; exercises: string[]; localTasks: string[] } {
  const questions: string[] = [];
  const exercises: string[] = [];
  const localTasks: string[] = [];
  for (const block of lesson.blocks) {
    if (block.kind === 'prediction') questions.push(block.id);
    else if (block.kind === 'review') for (const item of block.items) questions.push(`${block.id}/${item.id}`);
    else if (block.kind === 'exercise') exercises.push(block.id);
    else if (block.kind === 'local-task') localTasks.push(block.id);
  }
  return { questions, exercises, localTasks };
}

export function isLessonComplete(lesson: Lesson, p: LessonProgress): boolean {
  // A capstone-step lesson completes only through a real platform check of the step in the active
  // project, or — for a local step — the learner's confirmation (mirrored into p.project); reading
  // the lesson, a supplied starter or a native step "not performed" never completes it.
  if (lesson.kind === 'capstone-step') return p.project?.state === 'done' || p.project?.state === 'confirmed';
  const req = requiredItems(lesson);
  const seenAll = lesson.blocks.every((b) => p.seenBlocks.includes(b.id));
  return (
    seenAll &&
    req.questions.every((q) => p.questions[q]) &&
    req.exercises.every((e) => p.exercises[e]?.passedAt) &&
    req.localTasks.every((t) => p.localTasks[t]?.confirmedAt || p.localTasks[t]?.skipped)
  );
}

function settle(lesson: Lesson, p: LessonProgress): LessonProgress {
  // Evidence can turn an in-progress or skipped lesson into a completed one, never the reverse.
  if (p.state !== 'completed' && isLessonComplete(lesson, p)) return { ...p, state: 'completed', completedAt: now() };
  return p;
}

export function visitPage(doc: ProgressDoc, lesson: Lesson, page: number): ProgressDoc {
  return withLesson(doc, lesson, (p) => {
    const blockIds = lesson.pages[page] ?? [];
    const seen = blockIds.filter((id) => !p.seenBlocks.includes(id));
    if (seen.length === 0 && p.page === page) return p;
    return settle(lesson, { ...p, page, seenBlocks: [...p.seenBlocks, ...seen] });
  });
}

export function recordAnswer(doc: ProgressDoc, lesson: Lesson, key: string, correct: boolean): ProgressDoc {
  return withLesson(doc, lesson, (p) => {
    const previous = p.questions[key];
    const entry = { answeredAt: now(), correct: previous?.correct === true || correct, attempts: (previous?.attempts ?? 0) + 1, firstCorrect: previous ? previous.firstCorrect : correct };
    return settle(lesson, { ...p, questions: { ...p.questions, [key]: entry } });
  });
}

export function recordExerciseCheck(doc: ProgressDoc, lesson: Lesson, blockId: string, passed: boolean): ProgressDoc {
  return withLesson(doc, lesson, (p) => {
    const previous: ExerciseProgress = p.exercises[blockId] ?? { attempts: 0 };
    const entry: ExerciseProgress = { ...previous, attempts: previous.attempts + 1, lastRunAt: now() };
    if (passed && !previous.passedAt) {
      entry.passedAt = now();
      // Evidence stays honest: a pass after hints or after reading the solution is marked as assisted.
      entry.assistedPass = Boolean(previous.hintNudgeAt || previous.hintExplanationAt || previous.solutionViewedAt);
    }
    return settle(lesson, { ...p, exercises: { ...p.exercises, [blockId]: entry } });
  });
}

export function recordHint(doc: ProgressDoc, lesson: Lesson, blockId: string, level: 'nudge' | 'explanation' | 'solution'): ProgressDoc {
  return withLesson(doc, lesson, (p) => {
    const previous: ExerciseProgress = p.exercises[blockId] ?? { attempts: 0 };
    const field = level === 'nudge' ? 'hintNudgeAt' : level === 'explanation' ? 'hintExplanationAt' : 'solutionViewedAt';
    if (previous[field]) return p;
    return { ...p, exercises: { ...p.exercises, [blockId]: { ...previous, [field]: now() } } };
  });
}

export function recordExampleRun(doc: ProgressDoc, lesson: Lesson, blockId: string): ProgressDoc {
  return withLesson(doc, lesson, (p) => (p.examples[blockId]?.ranAt ? p : { ...p, examples: { ...p.examples, [blockId]: { ranAt: now() } } }));
}

export function confirmLocalTaskItem(doc: ProgressDoc, lesson: Lesson, blockId: string, verifyId: string, checked: boolean): ProgressDoc {
  return withLesson(doc, lesson, (p) => {
    const block = lesson.blocks.find((b) => b.id === blockId);
    if (!block || block.kind !== 'local-task') return p;
    const previous = p.localTasks[blockId] ?? { confirmed: {} };
    const confirmed = { ...previous.confirmed };
    if (checked) confirmed[verifyId] = now();
    else delete confirmed[verifyId];
    const all = block.verify.every((v) => confirmed[v.id]);
    return settle(lesson, { ...p, localTasks: { ...p.localTasks, [blockId]: { confirmed, confirmedAt: all ? (previous.confirmedAt ?? now()) : undefined, skipped: all ? undefined : previous.skipped } } });
  });
}

export function skipLocalTask(doc: ProgressDoc, lesson: Lesson, blockId: string, reason: 'no-native-tooling' | 'later' | null): ProgressDoc {
  return withLesson(doc, lesson, (p) => {
    const previous = p.localTasks[blockId] ?? { confirmed: {} };
    return settle(lesson, { ...p, localTasks: { ...p.localTasks, [blockId]: { ...previous, skipped: reason ? { at: now(), reason } : undefined } } });
  });
}

/** Assessment lessons are never skipped: they are completed only through their exercises. */
export function canSkipLesson(lesson: { kind?: string }): boolean {
  return lesson.kind !== 'assessment';
}

/** "I know this": the lesson becomes skipped (visibly, revisitable); nothing is marked passed. */
export function skipLesson(doc: ProgressDoc, lesson: { id: string; contentVersion?: number; kind?: string }): ProgressDoc {
  if (!canSkipLesson(lesson)) return doc;
  return withLesson(doc, lesson, (p) => (p.state === 'completed' ? p : { ...p, state: 'skipped', skippedAt: now() }));
}

export function unskipLesson(doc: ProgressDoc, lessonId: string): ProgressDoc {
  const p = doc.lessons[lessonId];
  if (!p || p.state !== 'skipped') return doc;
  return { ...doc, lessons: { ...doc.lessons, [lessonId]: { ...p, state: 'in-progress', skippedAt: undefined } } };
}

export function recordSelfCheck(doc: ProgressDoc, lesson: { id: string; contentVersion?: number }, passed: boolean): ProgressDoc {
  return withLesson(doc, lesson, (p) => ({ ...p, selfCheck: { attempts: (p.selfCheck?.attempts ?? 0) + 1, passedAt: passed ? (p.selfCheck?.passedAt ?? now()) : p.selfCheck?.passedAt } }));
}

export type BaseState = 'unseen' | 'in-progress' | 'skipped' | 'completed';
export interface LessonEvidence {
  base: BaseState;
  selfCheckPassed: boolean;
  exercisesPassed: number;
  exercisesTotal: number;
  hintAssisted: boolean;
  solutionViewed: boolean;
  localConfirmed: number;
  localTotal: number;
  localUnperformed: number;
  /** Capstone-step lessons: a local step confirmed by the learner, or not performed. */
  stepConfirmed: boolean;
  stepNotPerformed: boolean;
}

export function lessonEvidence(lesson: IndexLesson, p: LessonProgress | undefined): LessonEvidence {
  const exercises = lesson.blocks.filter((b) => b.kind === 'exercise');
  const locals = lesson.blocks.filter((b) => b.kind === 'local-task');
  const ex = Object.values(p?.exercises ?? {});
  return {
    base: p ? p.state : 'unseen',
    selfCheckPassed: Boolean(p?.selfCheck?.passedAt),
    exercisesPassed: exercises.filter((b) => p?.exercises[b.id]?.passedAt).length,
    exercisesTotal: exercises.length,
    hintAssisted: ex.some((e) => e.hintNudgeAt || e.hintExplanationAt),
    solutionViewed: ex.some((e) => e.solutionViewedAt),
    localConfirmed: locals.filter((b) => p?.localTasks[b.id]?.confirmedAt).length,
    localTotal: locals.length,
    localUnperformed: locals.filter((b) => p?.localTasks[b.id]?.skipped && !p?.localTasks[b.id]?.confirmedAt).length,
    stepConfirmed: p?.project?.state === 'confirmed',
    stepNotPerformed: p?.project?.state === 'not-performed',
  };
}

// ---------- answers ----------
export function isAnswerCorrect(block: { answer: Answer }, given: string[] | string, lang: Lang): boolean {
  const answer = block.answer;
  if (answer.type === 'choice' || answer.type === 'multi') {
    const picked = [...(given as string[])].sort();
    return JSON.stringify(picked) === JSON.stringify([...answer.correct].sort());
  }
  if (answer.type === 'text') {
    const norm = (s: string): string => { const t = s.trim().replace(/\s+/g, ' ').replace(/^["'`]|["'`]$/g, ''); return answer.caseSensitive ? t : t.toLowerCase(); };
    return [...answer.accept[lang], ...answer.accept.uk, ...answer.accept.en].some((a) => norm(a) === norm(String(given)));
  }
  if (answer.type === 'order') return JSON.stringify(given) === JSON.stringify(answer.items.map((i) => i.id));
  return false;
}

// ---------- delayed review (simple, transparent Leitner schedule; DEC-08) ----------
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 21];
export const reviewKey = (lessonId: string, blockId: string, itemId: string): string => `${lessonId}#${blockId}/${itemId}`;

export function recordReview(doc: ReviewDoc, lessonId: string, blockId: string, itemId: string, correct: boolean, at = new Date()): ReviewDoc {
  const key = reviewKey(lessonId, blockId, itemId);
  const previous = doc.items[key];
  const box = correct ? Math.min((previous?.box ?? 0) + 1, REVIEW_INTERVAL_DAYS.length - 1) : 1;
  const next = new Date(at.getTime() + REVIEW_INTERVAL_DAYS[box] * 86_400_000);
  const item: ReviewItemState = { lessonId, blockId, itemId, box, lastAt: at.toISOString(), nextAt: next.toISOString(), lastCorrect: correct, attempts: (previous?.attempts ?? 0) + 1 };
  return { ...doc, items: { ...doc.items, [key]: item } };
}

export const dueReviews = (doc: ReviewDoc, at = new Date()): ReviewItemState[] => Object.values(doc.items).filter((i) => new Date(i.nextAt) <= at).sort((a, b) => a.nextAt.localeCompare(b.nextAt));
