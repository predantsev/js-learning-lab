// Types for compiled content (dist/content/*.json) and learner data documents.
export type Lang = 'uk' | 'en';
export type L10n = Record<Lang, string>;
export type StageId = 'JS' | 'RE' | 'RN' | 'NO';
export type CapstoneId = 'wishlist' | 'planner' | 'habits' | 'expenses';
export type StyleId = 'calm-studio' | 'editorial' | 'dev-workspace';
export type RuntimeKind = 'browser-js' | 'browser-react' | 'concept-preview' | 'isolated-node' | 'local-web' | 'local-native' | 'local-node';

export interface IndexLessonBlock { id: string; kind: BlockKind; title: L10n | null; mode: string | null; runtime: RuntimeKind | null }
export interface IndexLesson { id: string; title: L10n; kind: string; minutes: number | null; authored: boolean; prerequisites: string[]; selfCheck: string[]; pages: number; blocks: IndexLessonBlock[] }
export interface IndexUnit { id: string; title: L10n; summary: L10n | null; competencies: string[]; capstoneStep: { mode: 'in-platform' | 'local'; objective: L10n; variants: Record<CapstoneId, L10n> } | null; lessons: IndexLesson[] }
export interface IndexStage { id: StageId; title: L10n; summary?: L10n; units: IndexUnit[] }
export interface ContentIndex {
  contentVersion: string;
  builtAt: string;
  capstones: { id: CapstoneId; title: L10n; pitch: L10n }[];
  stages: IndexStage[];
  redirects: Record<string, string>;
  counts: { lessonsAuthored: number; lessonsPlanned: number; glossaryTerms: number };
}

export type BlockKind = 'explanation' | 'analogy' | 'visual' | 'prediction' | 'example' | 'exercise' | 'transfer' | 'local-task' | 'review';

export interface AnswerOption { id: string; text?: L10n; code?: L10n; codeHtml?: L10n; why?: L10n }
export type Answer =
  | { type: 'choice' | 'multi'; options: AnswerOption[]; correct: string[] }
  | { type: 'text'; accept: Record<Lang, string[]>; caseSensitive?: boolean; placeholder?: L10n }
  | { type: 'order'; items: AnswerOption[] };
export interface Question { id?: string; prompt: L10n; code?: L10n; codeHtml?: L10n; answer: Answer; explanation: L10n; from?: string; runnable?: boolean }

interface BlockBase { id: string; kind: BlockKind; title?: L10n }
export interface ExplanationBlock extends BlockBase { kind: 'explanation'; title: L10n; body: L10n }
export interface AnalogyBlock extends BlockBase { kind: 'analogy'; body: L10n; limits: L10n }
export interface VisualBlock extends BlockBase { kind: 'visual'; visual: string; title: L10n; textEquivalent: L10n; spec: unknown }
export interface PredictionBlock extends BlockBase, Omit<Question, 'id'> { kind: 'prediction' }
export interface ReviewBlock extends BlockBase { kind: 'review'; title: L10n; items: (Question & { id: string; from: string })[] }
/** Browser runtimes: network none | lab, loopBudgetMs, settleTimeoutMs. isolated-node: network none | loopback, workers, timeoutMs. Both: testTimeoutMs. */
export interface Capabilities { network?: 'none' | 'lab' | 'loopback'; loopBudgetMs?: number; testTimeoutMs?: number; settleTimeoutMs?: number; workers?: boolean; timeoutMs?: number }
export interface ExampleBlock extends BlockBase { kind: 'example'; title: L10n; body: L10n; tryIt?: L10n; runtime: RuntimeKind; entry: string; files: Record<string, string>; strings?: Record<string, L10n>; limits?: L10n; capabilities?: Capabilities; expectError?: boolean; preview?: boolean }
export interface FeedbackRule { when: { test?: string; error?: string }; message: L10n }
export interface ExerciseBlock extends BlockBase {
  kind: 'exercise';
  title: L10n;
  instructions: L10n;
  mode: 'guided' | 'debug' | 'independent';
  assessment?: boolean;
  runtime: RuntimeKind;
  entry: string;
  files: Record<string, string>;
  solution: Record<string, string>;
  tests: string;
  editable: string[];
  testTitles: Record<string, L10n>;
  strings?: Record<string, L10n>;
  hints?: { nudge: L10n; explanation: L10n };
  solutionNote: L10n;
  feedback?: FeedbackRule[];
  limits?: L10n;
  capabilities?: Capabilities;
  preview?: boolean;
}
export interface TransferBlock extends BlockBase { kind: 'transfer'; body: L10n; capstoneStep?: string; checkpoint?: string }
export interface LocalTaskBlock extends BlockBase {
  kind: 'local-task';
  title: L10n;
  intro: L10n;
  runtime: RuntimeKind;
  tools: { name: string; version?: string; note?: L10n }[];
  steps: { text: L10n; command?: string; expect?: L10n }[];
  verify: { id: string; text: L10n }[];
  troubleshooting: { problem: L10n; fix: L10n }[];
  recovery: L10n;
  nativeOnly?: boolean;
}
export type Block = ExplanationBlock | AnalogyBlock | VisualBlock | PredictionBlock | ReviewBlock | ExampleBlock | ExerciseBlock | TransferBlock | LocalTaskBlock;

export interface Lesson {
  id: string;
  unit: string;
  stage: StageId;
  title: L10n;
  kind: string;
  minutes: number;
  objectives: L10n[];
  purpose?: L10n;
  prerequisites?: string[];
  selfCheck?: string[];
  contentVersion: number;
  blocks: Block[];
  pages: string[][];
}

export interface GlossaryTerm { id: string; term: string; name?: L10n; definition: L10n; context?: L10n; aliases?: string[]; see?: string[]; example?: { code: string; codeHtml: string; note?: L10n } }

// ---------- learner data ----------
export interface Profile {
  language: Lang;
  styleId: StyleId;
  appearance: 'system' | 'light' | 'dark';
  textSize: 'compact' | 'default' | 'large';
  activeWorkspaceId: string | null;
  lastLesson: { id: string; page: number } | null;
  onboardingDone: boolean;
  createdAt: string;
}
export interface QuestionProgress { answeredAt: string; correct: boolean; attempts: number; firstCorrect: boolean }
export interface ExerciseProgress { attempts: number; passedAt?: string; lastRunAt?: string; hintNudgeAt?: string; hintExplanationAt?: string; solutionViewedAt?: string; assistedPass?: boolean }
export interface LocalTaskProgress { confirmed: Record<string, string>; confirmedAt?: string; skipped?: { at: string; reason: 'no-native-tooling' | 'later' } }
export interface LessonProgress {
  state: 'in-progress' | 'skipped' | 'completed';
  page: number;
  startedAt: string;
  completedAt?: string;
  skippedAt?: string;
  selfCheck?: { passedAt?: string; attempts: number };
  contentVersion: number;
  questions: Record<string, QuestionProgress>;
  exercises: Record<string, ExerciseProgress>;
  examples: Record<string, { ranAt?: string }>;
  localTasks: Record<string, LocalTaskProgress>;
  seenBlocks: string[];
  /** Capstone-step lessons only: the step state of the active project, mirrored by components/project. */
  project?: { workspaceId: string | null; state: 'done' | 'skipped' | 'pending'; at: string };
}
export interface ProgressDoc { lessons: Record<string, LessonProgress> }
// `files` is present once the learner edited code (it then keeps `lang`); an entry may hold only the
// selected file or sandbox storage, which leaves the starter fresh. Keys are block ids; self-check
// attempts use `selfcheck:<block id>` so they never touch the lesson draft.
export interface DraftsDoc { blocks: Record<string, { files?: Record<string, string>; lang?: Lang; activeFile?: string; storage?: Record<string, string>; updatedAt: string }> }
export interface Bookmark { id: string; lessonId: string; blockId: string; createdAt: string; label?: string }
export interface BookmarksDoc { items: Bookmark[] }
export interface ReviewItemState { lessonId: string; blockId: string; itemId: string; box: number; lastAt: string; nextAt: string; lastCorrect: boolean; attempts: number }
export interface ReviewDoc { items: Record<string, ReviewItemState> }

export interface ConsoleValue { t: string; v?: unknown; [k: string]: unknown }
/** `stack`: the call stack of a console.trace() entry (level "trace"), one "at …" frame per line. */
export interface ConsoleEntry { level: string; args: ConsoleValue[]; at: number; code?: string; detail?: string; stack?: string }
/** `atLoad`: thrown while the program loaded, before checks could run (both runtimes mark it). */
/** `causes`: the error's `cause` chain, outermost first (sandbox runtime `causeChain`). */
export interface RunError { name: string; message: string; stack?: string; file?: string | null; line?: number | null; column?: number | null; phase?: string; loopBudgetMs?: number | null; kind?: string; frame?: string | null; code?: string; atLoad?: boolean; causes?: ConsoleValue[] }
export interface TestResult { name: string; status: 'pass' | 'fail'; message?: string; ms?: number; errorName?: string; stack?: string }
