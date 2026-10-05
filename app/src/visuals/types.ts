// Compiled visual specs (output of shared/visuals/index.js compileVisual) as consumed by the players.
export type Lang = 'uk' | 'en';
export type Localized = Record<Lang, string>;
export type VisualKind = 'code-trace' | 'memory-graph' | 'pipeline' | 'event-loop' | 'diagram' | 'sequence' | 'git-graph' | 'render-timeline';

// ---- values (same shape as sandbox/trace-runtime.js) ----
export type TraceValue =
  | { t: 'null' } | { t: 'undefined' } | { t: 'uninit' } | { t: 'empty' } | { t: 'opaque' } | { t: 'accessor' }
  | { t: 'string'; v: string; cut?: boolean } | { t: 'number'; v: number | string } | { t: 'boolean'; v: boolean }
  | { t: 'bigint'; v: string } | { t: 'symbol'; v: string } | { t: 'ref'; id: number | string };

export type HeapEntry =
  | { t: 'object'; ctor: string | null; props: [string, TraceValue][]; more: number }
  | { t: 'array'; length: number; items: TraceValue[]; more: number }
  | { t: 'function' | 'class'; name: string; arrow?: boolean; scope: number | string | null; scopeName?: string | null }
  | { t: 'map'; size: number; entries: [TraceValue, TraceValue][] }
  | { t: 'set'; size: number; items: TraceValue[] }
  | { t: 'error'; name: string; message: string }
  | { t: 'date' | 'regexp'; v: string }
  | { t: 'promise' } | { t: 'opaque' };

export type Heap = Record<string, HeapEntry>;

export type TraceVar = { name: string; kind: string; value?: TraceValue; uninit?: boolean };
export type TraceScope = { id: number; kind: string; name: string; parent: number | null; vars: TraceVar[] };
export type TraceFrame = { id: number; name: string; line: number; scope: number | null; kind?: 'module' | 'function'; file?: string };
export type TraceEvent =
  | { type: 'call'; name: string; args: { name: string; value: TraceValue }[]; from: number | null }
  | { type: 'return'; name: string; value: TraceValue; implicit?: boolean }
  | { type: 'throw'; error: { name: string; message: string }; uncaught?: boolean }
  | { type: 'await' | 'resume'; name: string }
  | { type: 'end' };
export type TraceStep = {
  i: number; line: number; col: number; endLine: number; kind: string; file: string;
  frames: TraceFrame[]; frameId: number | null; scope: number | null; scopes: Record<string, TraceScope>; heap: Heap; heapTruncated: boolean; event?: TraceEvent;
};

export type ConsoleEntry = { level: string; text: string };

// ---- per kind ----
export type StepBase = { caption: Localized | null };

export type CodeTraceSpec = {
  kind: 'code-trace'; file: string; code: string; language: string; mode: 'captioned' | 'all'; totalSteps: number; truncated: boolean;
  /** Run-time traces of a project: every traced file (path → code); the player shows each step's file. */
  files?: Record<string, string>;
  maxSteps?: number | null;
  error: { name: string; message: string } | null; console: ConsoleEntry[];
  steps: (StepBase & { trace: TraceStep; logged: number })[];
};

export type MemoryBinding = { name: string; kind: string; scope: string | null; value: TraceValue };
export type MemoryGraphSpec = {
  kind: 'memory-graph'; code: string | null; language: string;
  steps: (StepBase & { line: number | null; bindings: MemoryBinding[]; heap: Heap; changed: string[] })[];
};

export type PipelineStatus = 'in' | 'waiting' | 'kept' | 'dropped' | 'mapped' | 'consumed' | 'moved' | 'skipped' | 'match' | 'nomatch' | 'error';
/** An item label: one text, or one per language (a bilingual `show`). */
export type PipelineLabel = string | Localized;
export type PipelineItem = { id: string; label: PipelineLabel; status: PipelineStatus };
export type PipelineOutput =
  | { kind: 'list'; items: { id: string; label: PipelineLabel; from: string }[] }
  | { kind: 'value'; label: PipelineLabel; initial?: PipelineLabel }
  | { kind: 'pending' }
  | { kind: 'error'; name: string; message: string };
/** One comparator call of a sort/toSorted stage (perComparison). */
export type PipelineCompare = { a: string; b: string; result: string; order: 'a-first' | 'b-first' | 'keep' | 'error'; index: number; count: number };
export type PipelineSpec = {
  kind: 'pipeline'; code: string | null; language: string; input: { label: Localized }; stages: { op: string; fn: string; source: string }[]; resultLabel: Localized | null;
  steps: (StepBase & { stage: number; focus?: string; compare?: PipelineCompare; items: PipelineItem[]; output: PipelineOutput | null })[];
};

export type EventLoopSpec = {
  kind: 'event-loop'; file: string; code: string; language: string; console: ConsoleEntry[]; verified: boolean;
  steps: (StepBase & { line: number | null; stack: string[]; microtasks: string[]; tasks: string[]; webApis: string[]; logged: number })[];
};

export type DiagramNode = { id: string; label: Localized; group: string | null; shape: 'box' | 'round' | 'pill' | 'cylinder' | 'note'; x: number; y: number; w: number; h: number };
export type DiagramSpec = {
  kind: 'diagram'; layout: { width: number; height: number };
  groups: { id: string; label: Localized; x: number; y: number; w: number; h: number }[];
  nodes: DiagramNode[];
  edges: { id: string; from: string; to: string; label: Localized | null; kind: 'arrow' | 'both' | 'line' | 'dashed' }[];
  steps: (StepBase & { highlight: string[]; dim: string[]; hidden: string[]; annotate: { id: string; text: Localized }[] })[];
};

export type SequenceSpec = {
  kind: 'sequence'; actors: { id: string; label: Localized }[];
  messages: { id: string; from: string; to: string; label: Localized; kind: 'sync' | 'async' | 'return' | 'note'; note: Localized | null }[];
  steps: (StepBase & { message: number })[];
};

export type GitCommit = { id: string; parents: string[]; message: string; files: string[]; lane: number; x: number; orphaned: boolean };
export type GitGraphSpec = {
  kind: 'git-graph';
  steps: (StepBase & {
    command: string; changed: string[]; commits: GitCommit[]; branches: { name: string; at: string | null; lane: number; current: boolean }[];
    head: { branch: string } | { detached: string }; workingTree: { modified: string[]; staged: string[]; conflicted: string[] }; merging: string | null;
  })[];
};

export type RenderSnapshot = { props: Record<string, unknown>; state: Record<string, unknown> };
export type RenderTimelineSpec = {
  kind: 'render-timeline'; code: string | null; language: string; component: string; screen?: 'dom' | 'native'; renders: number[];
  steps: (StepBase & {
    phase: 'render' | 'commit' | 'effect' | 'event' | 'idle'; render: number; line: number | null; reason?: Localized; snapshot: RenderSnapshot | null; dom: string | null;
    cleanup?: string[]; run?: string[]; event?: { name: string; sees: Record<string, unknown>; actions: string[]; queued: Record<string, unknown> | null };
  })[];
};

export type VisualSpec = CodeTraceSpec | MemoryGraphSpec | PipelineSpec | EventLoopSpec | DiagramSpec | SequenceSpec | GitGraphSpec | RenderTimelineSpec;

/** A visual whose block has a strings table: one compiled spec per language (same steps in both). */
export type LocalizedVisualSpec = { kind: VisualKind; byLang: Record<Lang, VisualSpec> };
export type CompiledVisualSpec = VisualSpec | LocalizedVisualSpec;
