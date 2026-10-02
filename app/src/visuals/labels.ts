// All UI strings of the visual players, in both course languages. Ukrainian keeps the technical
// terms (call stack, heap, microtask, commit …) in English where that is the professional usage.
export type VisualLabels = {
  previous: string; next: string; reset: string; play: string; pause: string;
  stepOf: (n: number, total: number) => string;
  lineN: (n: number) => string;
  stepThrough: string; textVersion: string; changed: string; empty: string; finished: string; truncated: string; uncaught: string;
  code: string; variables: string; callStack: string; heap: string; console: string; microtasks: string; tasks: string; webApis: string;
  uninitialized: string; captured: string; module: string; function: string; block: string; loop: string; catch: string; this: string;
  call: string; returns: string; throws: string; awaits: string; resumes: string; iteration: (n: number) => string;
  hiddenPanels: (parts: string[]) => string; noVariables: string; noCalls: string; noObjects: string;
  reference: (id: string) => string; closureOf: (name: string) => string; moreItems: (n: number) => string;
  input: string; output: string; stage: string; kept: string; dropped: string; waiting: string; mapped: string; consumed: string; moved: string; skipped: string; accumulator: string; initial: string; result: string;
  match: string; nomatch: string; threw: string; pending: string; comparison: (n: number, total: number) => string; aFirst: string; bFirst: string; keepOrder: string;
  nodes: string; edges: string; highlighted: string; dimmed: string; from: string; to: string; message: (n: number, total: number) => string; note: string; actors: string;
  commits: string; branches: string; head: string; detached: string; workingTree: string; modified: string; staged: string; conflicted: string; merging: (branch: string) => string; command: string; orphaned: string; parents: string;
  render: (n: number) => string; commit: string; effects: string; event: (name: string) => string; idle: string; sees: string; actions: string; queued: string; dom: string; cleanup: string; run: string; props: string; state: string; reason: string; timeline: string; renderSees: (n: number) => string; noChange: string;
};

export const VISUAL_LABELS: Record<'uk' | 'en', VisualLabels> = {
  uk: {
    previous: '‹ Назад', next: 'Далі ›', reset: 'Спочатку', play: 'Відтворити', pause: 'Пауза',
    stepOf: (n, total) => `Крок ${n} / ${total}`,
    lineN: (n) => `Рядок ${n}`,
    stepThrough: 'Покрокова візуалізація', textVersion: 'Текстова версія стану', changed: 'змінилося', empty: 'порожньо', finished: 'програма завершилася', truncated: 'трасування обрізано (забагато кроків)', uncaught: 'необроблена помилка',
    code: 'Код', variables: 'Змінні', callStack: 'Call stack', heap: 'Heap (об’єкти)', console: 'Console', microtasks: 'Microtasks', tasks: 'Tasks (macrotasks)', webApis: 'Web APIs',
    uninitialized: 'uninitialized (TDZ)', captured: 'захоплений scope', module: 'модуль', function: 'функція', block: 'блок', loop: 'цикл', catch: 'catch', this: 'this',
    call: 'виклик', returns: 'повертає', throws: 'кидає помилку', awaits: 'чекає (await)', resumes: 'продовжує після await', iteration: (n) => `ітерація ${n}`,
    hiddenPanels: (parts) => `Не показано, бо порожні в усіх кроках: ${parts.join(', ')}.`, noVariables: 'змінні (у коді їх немає)', noCalls: 'call stack (жодна функція не викликається)', noObjects: 'heap (жодного об’єкта)',
    reference: (id) => `посилання на об’єкт #${id}`, closureOf: (name) => `замикання: scope «${name}»`, moreItems: (n) => `… ще ${n}`,
    input: 'Вхід', output: 'Результат', stage: 'етап', kept: 'залишено', dropped: 'відкинуто', waiting: 'очікує', mapped: 'перетворено', consumed: 'враховано', moved: 'переставлено', skipped: 'не перевірено', accumulator: 'накопичувач', initial: 'початкове', result: 'результат',
    match: 'true — підходить', nomatch: 'false — не підходить', threw: 'кинуто помилку', pending: 'ще не вирішено', comparison: (n, total) => `порівняння ${n} з ${total}`, aFirst: 'менше нуля: a стає перед b', bFirst: 'більше нуля: b стає перед a', keepOrder: 'нуль: a і b лишаються в тому ж порядку',
    nodes: 'Вузли', edges: 'Зв’язки', highlighted: 'виділено', dimmed: 'приглушено', from: 'від', to: 'до', message: (n, total) => `повідомлення ${n} з ${total}`, note: 'примітка', actors: 'Учасники',
    commits: 'Коміти', branches: 'Гілки', head: 'HEAD', detached: 'detached HEAD', workingTree: 'Робоча директорія', modified: 'змінено', staged: 'staged', conflicted: 'конфлікт', merging: (branch) => `злиття з ${branch} триває`, command: 'команда', orphaned: 'застарілий (після rebase)', parents: 'батьки',
    render: (n) => `Рендер ${n}`, commit: 'Commit', effects: 'Ефекти', event: (name) => `Подія: ${name}`, idle: 'нічого не відбувається', sees: 'обробник бачить', actions: 'виклики', queued: 'у черзі для наступного рендеру', dom: 'Екран (DOM)', cleanup: 'cleanup', run: 'запуск', props: 'props', state: 'state', reason: 'причина', timeline: 'Хронологія рендерів', renderSees: (n) => `Рендер ${n} бачить`, noChange: 'без змін',
  },
  en: {
    previous: '‹ Previous', next: 'Next ›', reset: 'Reset', play: 'Play', pause: 'Pause',
    stepOf: (n, total) => `Step ${n} / ${total}`,
    lineN: (n) => `Line ${n}`,
    stepThrough: 'Step-through visual', textVersion: 'Text version of the state', changed: 'changed', empty: 'empty', finished: 'the program finished', truncated: 'trace cut short (too many steps)', uncaught: 'uncaught error',
    code: 'Code', variables: 'Variables', callStack: 'Call stack', heap: 'Heap (objects)', console: 'Console', microtasks: 'Microtasks', tasks: 'Tasks (macrotasks)', webApis: 'Web APIs',
    uninitialized: 'uninitialized (TDZ)', captured: 'captured scope', module: 'module', function: 'function', block: 'block', loop: 'loop', catch: 'catch', this: 'this',
    call: 'call', returns: 'returns', throws: 'throws', awaits: 'awaits', resumes: 'resumes after await', iteration: (n) => `iteration ${n}`,
    hiddenPanels: (parts) => `Not shown, empty in every step: ${parts.join(', ')}.`, noVariables: 'variables (the code has none)', noCalls: 'call stack (no function is called)', noObjects: 'heap (no objects)',
    reference: (id) => `reference to object #${id}`, closureOf: (name) => `closure: scope “${name}”`, moreItems: (n) => `… ${n} more`,
    input: 'Input', output: 'Output', stage: 'stage', kept: 'kept', dropped: 'dropped', waiting: 'waiting', mapped: 'mapped', consumed: 'consumed', moved: 'reordered', skipped: 'not checked', accumulator: 'accumulator', initial: 'initial', result: 'result',
    match: 'true — matches', nomatch: 'false — does not match', threw: 'threw an error', pending: 'not decided yet', comparison: (n, total) => `comparison ${n} of ${total}`, aFirst: 'below zero: a goes before b', bFirst: 'above zero: b goes before a', keepOrder: 'zero: a and b keep their order',
    nodes: 'Nodes', edges: 'Edges', highlighted: 'highlighted', dimmed: 'dimmed', from: 'from', to: 'to', message: (n, total) => `message ${n} of ${total}`, note: 'note', actors: 'Participants',
    commits: 'Commits', branches: 'Branches', head: 'HEAD', detached: 'detached HEAD', workingTree: 'Working tree', modified: 'modified', staged: 'staged', conflicted: 'conflicted', merging: (branch) => `merge from ${branch} in progress`, command: 'command', orphaned: 'orphaned (after rebase)', parents: 'parents',
    render: (n) => `Render ${n}`, commit: 'Commit', effects: 'Effects', event: (name) => `Event: ${name}`, idle: 'nothing happens', sees: 'the handler sees', actions: 'calls', queued: 'queued for the next render', dom: 'Screen (DOM)', cleanup: 'cleanup', run: 'run', props: 'props', state: 'state', reason: 'reason', timeline: 'Render timeline', renderSees: (n) => `Render ${n} sees`, noChange: 'no change',
  },
};
