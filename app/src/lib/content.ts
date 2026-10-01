// Compiled course content: one small index, lessons loaded on demand and cached.
import type { ContentIndex, GlossaryTerm, IndexLesson, IndexUnit, Lesson, StageId } from './types';

export class ContentError extends Error {
  constructor(public code: 'missing' | 'corrupt' | 'unreachable', public target: string, message: string) {
    super(message);
  }
}

async function getJson<T>(path: string, target: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { cache: 'no-cache' });
  } catch (error) {
    throw new ContentError('unreachable', target, error instanceof Error ? error.message : 'network error');
  }
  if (response.status === 404) throw new ContentError('missing', target, `${target} was not found`);
  if (!response.ok) throw new ContentError('unreachable', target, `HTTP ${response.status}`);
  try {
    return (await response.json()) as T;
  } catch {
    throw new ContentError('corrupt', target, `${target} is not valid JSON`);
  }
}

const lessonCache = new Map<string, Promise<Lesson>>();
export const loadIndex = (): Promise<ContentIndex> => getJson<ContentIndex>('/content/index.json', 'course index');
export const loadGlossary = async (): Promise<Map<string, GlossaryTerm>> => new Map((await getJson<{ terms: GlossaryTerm[] }>('/content/glossary.json', 'glossary')).terms.map((t) => [t.id, t]));
export function loadLesson(id: string): Promise<Lesson> {
  let cached = lessonCache.get(id);
  if (!cached) {
    cached = getJson<Lesson>(`/content/lessons/${encodeURIComponent(id)}.json`, `lesson ${id}`);
    cached.catch(() => lessonCache.delete(id));
    lessonCache.set(id, cached);
  }
  return cached;
}

export interface LessonRef { lesson: IndexLesson; unit: IndexUnit; stage: StageId; index: number }
export function flattenLessons(index: ContentIndex): LessonRef[] {
  const out: LessonRef[] = [];
  for (const stage of index.stages) for (const unit of stage.units) for (const lesson of unit.lessons) out.push({ lesson, unit, stage: stage.id, index: out.length });
  return out;
}
