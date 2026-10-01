// Content loading and compilation: YAML sources + real code files → JSON the app loads.
// Used by build.mjs (compile) and validate.mjs (static + real-browser checks).
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import hljs from 'highlight.js/lib/common';
import { Marked } from 'marked';
import YAML from 'yaml';
import { ROOT } from '../../server/config.mjs';
import { CAPSTONES, GLOSSARY_LINK, Issues, LANGS, STAGES, paginate, unitOfLesson, validateGlossaryTerm, validateLessonSource } from '../../shared/content-schema.js';
import { STRING_PLACEHOLDER, localizeText } from '../../shared/exercise.js';

export const CONTENT_DIR = path.join(ROOT, 'content');
const INLINE_KEYS = new Set(['title', 'text', 'why', 'label', 'name', 'problem']);
const PLAIN_KEYS = new Set(['title', 'name']);
const RAW_KEYS = new Set(['strings', 'spec']);
const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.md', '.txt', '.sql', '.yaml', '.yml', '.svg', '.csv', '.env', '.gitignore', '']);

const exists = (p) => fs.access(p).then(() => true, () => false);
const readYaml = async (file) => YAML.parse(await fs.readFile(file, 'utf8'));
const isLocalized = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && LANGS.every((l) => typeof v[l] === 'string');
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function readTree(dir, base = dir) {
  const out = {};
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, await readTree(full, base));
    else if (TEXT_EXT.has(path.extname(entry.name).toLowerCase())) out[path.relative(base, full).split(path.sep).join('/')] = await fs.readFile(full, 'utf8');
  }
  return out;
}

/** Markdown renderer with glossary links, callouts and build-time syntax highlighting. */
export function createMarkdown(glossary) {
  const highlight = (code, lang) => {
    const language = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', html: 'xml', sh: 'bash', shell: 'bash', text: 'plaintext', txt: 'plaintext', '': 'plaintext' }[lang ?? ''] ?? lang;
    try {
      return hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : escapeHtml(code);
    } catch {
      return escapeHtml(code);
    }
  };
  const termHtml = (id, shown) => {
    const term = glossary.get(id);
    const label = shown ?? term?.term ?? id;
    return `<button type="button" class="term" data-term="${escapeHtml(id)}">${escapeHtml(label)}</button>`;
  };
  const marked = new Marked({
    gfm: true,
    breaks: false,
    extensions: [
      {
        name: 'glossaryLink',
        level: 'inline',
        start: (src) => src.indexOf('[['),
        tokenizer(src) {
          const m = /^\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/.exec(src);
          return m ? { type: 'glossaryLink', raw: m[0], id: m[1], shown: m[2] } : undefined;
        },
        renderer: (token) => termHtml(token.id, token.shown),
      },
    ],
    renderer: {
      code({ text, lang }) {
        const language = (lang ?? '').trim().split(/\s+/)[0];
        return `<pre class="code" data-lang="${escapeHtml(language)}"><code>${highlight(text, language)}</code></pre>\n`;
      },
      blockquote({ tokens }) {
        const html = this.parser.parse(tokens);
        const m = /^<p>\[!(note|tip|warning|important)\]\s*/i.exec(html);
        if (m) return `<aside class="callout callout-${m[1].toLowerCase()}">${html.replace(m[0], '<p>')}</aside>\n`;
        return `<blockquote>${html}</blockquote>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:/i.test(href);
        return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer" data-external="true"' : ''}>${text}</a>`;
      },
      table(token) {
        const header = token.header.map((c) => `<th scope="col">${this.parser.parseInline(c.tokens)}</th>`).join('');
        const rows = token.rows.map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`).join('');
        return `<div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
    },
  });
  return {
    block: (md) => marked.parse(String(md)).trim(),
    inline: (md) => marked.parseInline(String(md)).trim(),
    plain: (md) => String(md).replace(GLOSSARY_LINK, (_, id, shown) => shown ?? glossary.get(id)?.term ?? id),
    highlight,
  };
}

/** Convert every bilingual markdown string inside a value to HTML ({uk, en} → {uk, en}). */
function renderLocalized(value, md, key = '') {
  if (isLocalized(value)) {
    if (PLAIN_KEYS.has(key)) return Object.fromEntries(LANGS.map((l) => [l, md.plain(value[l])]));
    const render = INLINE_KEYS.has(key) ? md.inline : md.block;
    return Object.fromEntries(LANGS.map((l) => [l, render(value[l])]));
  }
  if (Array.isArray(value)) return value.map((v) => renderLocalized(v, md, key));
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, RAW_KEYS.has(k) ? v : renderLocalized(v, md, k)]));
  return value;
}

export async function loadCompetencies() {
  const data = JSON.parse(await fs.readFile(path.join(ROOT, 'docs', 'competencies.json'), 'utf8'));
  const families = new Map(data.competencies.map((c) => [c.id, { ...c, subskills: new Set(c.subskills), units: new Set(c.units) }]));
  const unitOrder = data.stage_order.flatMap((stage) => data.unit_order[stage].map((unit) => ({ stage, unit })));
  return { families, unitOrder, raw: data };
}

export async function loadGlossary(issues) {
  const dir = path.join(CONTENT_DIR, 'glossary');
  const terms = new Map();
  for (const file of (await fs.readdir(dir).catch(() => [])).filter((f) => f.endsWith('.yaml')).sort()) {
    const list = (await readYaml(path.join(dir, file))) ?? [];
    for (const term of list) {
      const termIssues = validateGlossaryTerm(term);
      issues.push(...termIssues.list.map((i) => ({ ...i, file: `content/glossary/${file}` })));
      if (terms.has(term.id)) issues.push({ path: `glossary ${term.id}`, message: `duplicate term id (also in ${terms.get(term.id).file})`, file: `content/glossary/${file}` });
      terms.set(term.id, { ...term, file });
    }
  }
  for (const term of terms.values()) for (const ref of term.see ?? []) if (!terms.has(ref)) issues.push({ path: `glossary ${term.id}`, message: `"see" points to unknown term "${ref}"`, file: `content/glossary/${term.file}` });
  return terms;
}

export async function loadSyllabus(competencies, issues) {
  const dir = path.join(CONTENT_DIR, 'syllabus');
  const units = new Map();
  for (const { stage, unit } of competencies.unitOrder) {
    const file = path.join(dir, `${unit}.yaml`);
    if (!(await exists(file))) continue;
    try {
      const data = await readYaml(file);
      units.set(unit, { ...data, stage });
    } catch (error) {
      issues.push({ path: `syllabus ${unit}`, message: `cannot parse: ${error.message}`, file: `content/syllabus/${unit}.yaml` });
    }
  }
  return units;
}

/** Load one lesson directory: lesson.yaml plus the files of its workspace and visual blocks. */
export async function loadLesson(dir) {
  const source = await readYaml(path.join(dir, 'lesson.yaml'));
  const assets = {};
  for (const block of source?.blocks ?? []) {
    if (!block || typeof block !== 'object') continue;
    if (block.kind === 'example' && typeof block.dir === 'string') assets[block.id] = { files: await readTree(path.join(dir, block.dir)) };
    else if (block.kind === 'exercise' && typeof block.dir === 'string') {
      const base = path.join(dir, block.dir);
      const variants = {};
      for (const entry of await fs.readdir(base, { withFileTypes: true }).catch(() => [])) {
        if (entry.isDirectory() && /^(alt|wrong)(-[a-z0-9-]+)?$/.test(entry.name)) variants[entry.name] = await readTree(path.join(base, entry.name));
      }
      assets[block.id] = {
        starter: await readTree(path.join(base, 'starter')),
        solution: await readTree(path.join(base, 'solution')),
        tests: await fs.readFile(path.join(base, 'tests.js'), 'utf8').catch(() => null),
        variants,
      };
    }
  }
  return { source, assets, dir };
}

export async function loadAll() {
  const issues = [];
  const competencies = await loadCompetencies();
  const glossary = await loadGlossary(issues);
  const syllabus = await loadSyllabus(competencies, issues);
  const course = (await exists(path.join(CONTENT_DIR, 'course.yaml'))) ? await readYaml(path.join(CONTENT_DIR, 'course.yaml')) : { stages: {} };
  const domains = await readYaml(path.join(CONTENT_DIR, 'capstones', 'domains.yaml'));
  const lessons = new Map();
  const unitsDir = path.join(CONTENT_DIR, 'units');
  for (const { unit } of competencies.unitOrder) {
    const unitDir = path.join(unitsDir, unit);
    for (const entry of (await fs.readdir(unitDir, { withFileTypes: true }).catch(() => [])).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(unitDir, entry.name);
      if (!(await exists(path.join(dir, 'lesson.yaml')))) continue;
      const rel = path.relative(ROOT, dir);
      try {
        const lesson = await loadLesson(dir);
        if (lesson.source?.id !== entry.name) issues.push({ path: `lesson ${entry.name}`, message: `directory name must equal the lesson id (found id "${lesson.source?.id}")`, file: rel });
        lessons.set(entry.name, lesson);
      } catch (error) {
        issues.push({ path: `lesson ${entry.name}`, message: `cannot load: ${error.message}`, file: rel });
      }
    }
  }
  // Teaching order: syllabus order inside each unit; authored lessons missing from the syllabus go last.
  const order = [];
  for (const { stage, unit } of competencies.unitOrder) {
    const planned = (syllabus.get(unit)?.lessons ?? []).map((l) => l.id);
    const authored = [...lessons.keys()].filter((id) => unitOfLesson(id) === unit);
    for (const id of planned) order.push({ id, unit, stage, planned: true, authored: lessons.has(id) });
    for (const id of authored.filter((a) => !planned.includes(a)).sort()) {
      order.push({ id, unit, stage, planned: false, authored: true });
      if (syllabus.has(unit)) issues.push({ path: `lesson ${id}`, message: `not listed in content/syllabus/${unit}.yaml (add it there so the unit order is explicit)`, file: `content/units/${unit}/${id}` });
    }
  }
  const lessonOrder = new Map(order.map((o, i) => [o.id, i]));
  return { issues, competencies, glossary, syllabus, course, domains, lessons, order, lessonOrder };
}

/** Effective file sets of an exercise: solution/variants overlay the starter. */
export function exerciseFileSets(assets) {
  const sets = { starter: assets.starter, solution: { ...assets.starter, ...assets.solution } };
  for (const [name, files] of Object.entries(assets.variants)) sets[name] = { ...assets.starter, ...files };
  return sets;
}

export function staticIssuesForLesson(lesson, ctx) {
  const { source, assets } = lesson;
  // Terms that the syllabus plans for lessons not authored yet are accepted until release.
  const known = new Set(ctx.glossary.keys());
  if (!ctx.release) for (const unit of ctx.syllabus.values()) for (const l of unit.lessons ?? []) for (const term of l.glossary ?? []) known.add(term);
  const result = validateLessonSource(source, { glossary: known, lessonOrder: ctx.lessonOrder, competencies: ctx.competencies.families });
  const issues = [...result.list];
  const add = (p, message) => issues.push({ path: `lesson ${source?.id} › ${p}`, message });
  for (const block of source?.blocks ?? []) {
    const a = assets[block.id];
    if (block.kind === 'example') {
      if (!a || Object.keys(a.files).length === 0) add(`block "${block.id}"`, `no files found in "${block.dir}"`);
      else if (!(block.entry in a.files)) add(`block "${block.id}".entry`, `"${block.entry}" does not exist in "${block.dir}"`);
    } else if (block.kind === 'exercise') {
      if (!a) continue;
      if (Object.keys(a.starter).length === 0) add(`block "${block.id}"`, `missing ${block.dir}/starter/ files`);
      if (Object.keys(a.solution).length === 0) add(`block "${block.id}"`, `missing ${block.dir}/solution/ files`);
      if (a.tests === null) add(`block "${block.id}"`, `missing ${block.dir}/tests.js`);
      if (!(block.entry in a.starter)) add(`block "${block.id}".entry`, `"${block.entry}" does not exist in ${block.dir}/starter/`);
      for (const f of block.editable ?? []) if (!(f in a.starter)) add(`block "${block.id}".editable`, `"${f}" does not exist in the starter`);
      for (const f of Object.keys(a.solution)) if (!(f in a.starter) && !(block.allowNewFiles === true)) add(`block "${block.id}"`, `solution adds "${f}" which is not in the starter (set allowNewFiles: true if the learner must create files)`);
      if (!Object.keys(a.variants).some((v) => v.startsWith('wrong'))) add(`block "${block.id}"`, `needs at least one deliberately failing fixture directory ${block.dir}/wrong/ (or wrong-<name>/)`);
    }
    // Every %%key%% used in code must exist in the block's strings table.
    const texts = block.kind === 'example' ? Object.values(a?.files ?? {}) : block.kind === 'exercise' && a ? [...Object.values(a.starter), ...Object.values(a.solution), a.tests ?? '', ...Object.values(a.variants).flatMap((v) => Object.values(v))] : [block.code ?? '', ...(block.items ?? []).map((i) => i.code ?? '')];
    for (const text of texts) for (const m of String(text).matchAll(STRING_PLACEHOLDER)) if (!(block.strings && m[1] in block.strings)) add(`block "${block.id}"`, `placeholder %%${m[1]}%% has no entry in strings`);
  }
  return issues;
}

/** Compile one lesson to its runtime JSON. `visuals` is the optional shared/visuals module. */
export async function compileLesson(lesson, ctx) {
  const { source, assets, dir } = lesson;
  const md = ctx.md;
  const issues = [];
  const blocks = [];
  for (const block of source.blocks) {
    const { dir: _dir, ...rest } = block;
    let compiled;
    if (block.kind === 'visual') {
      const { spec, ...meta } = rest;
      compiled = renderLocalized(meta, md);
      if (ctx.visuals) {
        try {
          const out = await ctx.visuals.compileVisual(block.visual, spec, { readFile: (rel) => fs.readFile(path.join(dir, rel), 'utf8'), mdInline: md.inline, langs: LANGS });
          compiled.spec = out.spec;
          for (const i of out.issues ?? []) issues.push({ path: `lesson ${source.id} › block "${block.id}".spec${i.path ? ` › ${i.path}` : ''}`, message: i.message });
        } catch (error) {
          issues.push({ path: `lesson ${source.id} › block "${block.id}".spec`, message: `visual failed to compile: ${error.message}` });
          compiled.spec = null;
        }
      } else compiled.spec = spec;
    } else compiled = renderLocalized(rest, md);
    if (block.kind === 'prediction' || block.kind === 'review') {
      // Code shown in questions is resolved per language (authored UI text follows the lesson language).
      const perLang = (text) => Object.fromEntries(LANGS.map((l) => [l, localizeText(String(text), block, l)]));
      const decorate = (item, target) => {
        if (typeof item.code === 'string') {
          target.code = perLang(item.code);
          target.codeHtml = Object.fromEntries(LANGS.map((l) => [l, md.highlight(target.code[l], item.lang ?? 'js')]));
        }
        for (const [i, option] of (item.answer?.options ?? item.answer?.items ?? []).entries()) {
          if (option.code !== undefined) {
            const t = (target.answer.options ?? target.answer.items)[i];
            t.code = perLang(option.code);
            t.codeHtml = Object.fromEntries(LANGS.map((l) => [l, md.highlight(t.code[l], item.lang ?? 'js')]));
          }
        }
        if (target.answer?.type === 'text') target.answer.accept = Object.fromEntries(LANGS.map((l) => [l, item.answer.accept.map((a) => localizeText(String(a), block, l))]));
      };
      if (block.kind === 'prediction') decorate(block, compiled);
      else block.items.forEach((item, i) => decorate(item, compiled.items[i]));
    }
    if (block.kind === 'example') compiled.files = assets[block.id]?.files ?? {};
    if (block.kind === 'exercise') {
      const a = assets[block.id];
      compiled.files = a?.starter ?? {};
      compiled.solution = a?.solution ?? {};
      compiled.tests = a?.tests ?? '';
      compiled.editable = block.editable ?? Object.keys(a?.starter ?? {});
    }
    blocks.push(compiled);
  }
  const { blocks: _b, ...meta } = source;
  return {
    lesson: { ...renderLocalized(meta, md), stage: source.id.slice(0, 2).toUpperCase(), blocks, pages: paginate(source.blocks) },
    issues,
  };
}

export const sha = (text) => createHash('sha256').update(text).digest('hex');

/** Build everything into dist/content. Returns { index, issues }. */
export async function buildContent({ outDir = path.join(ROOT, 'dist', 'content'), quiet = false, release = false } = {}) {
  const all = await loadAll();
  const issues = [...all.issues];
  const md = createMarkdown(all.glossary);
  let visuals = null;
  if (await exists(path.join(ROOT, 'shared', 'visuals', 'index.js'))) visuals = await import(path.join(ROOT, 'shared', 'visuals', 'index.js'));
  const ctx = { ...all, md, visuals, release };
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(path.join(outDir, 'lessons'), { recursive: true });
  await fs.mkdir(path.join(outDir, 'capstones'), { recursive: true });
  const hash = createHash('sha256');
  const compiledMeta = new Map();
  for (const [id, lesson] of all.lessons) {
    const staticIssues = staticIssuesForLesson(lesson, ctx);
    issues.push(...staticIssues.map((i) => ({ ...i, file: path.relative(ROOT, lesson.dir) })));
    try {
      const { lesson: compiled, issues: compileIssues } = await compileLesson(lesson, ctx);
      issues.push(...compileIssues.map((i) => ({ ...i, file: path.relative(ROOT, lesson.dir) })));
      const text = JSON.stringify(compiled);
      hash.update(text);
      await fs.writeFile(path.join(outDir, 'lessons', `${id}.json`), text);
      compiledMeta.set(id, compiled);
    } catch (error) {
      issues.push({ path: `lesson ${id}`, message: `compile failed: ${error.message}`, file: path.relative(ROOT, lesson.dir) });
    }
  }
  const stageMeta = (stage) => all.course.stages?.[stage] ?? { title: { uk: stage, en: stage } };
  const stages = STAGES.map((stage) => ({
    id: stage,
    ...stageMeta(stage),
    units: all.competencies.unitOrder.filter((u) => u.stage === stage).map(({ unit }) => {
      const plan = all.syllabus.get(unit);
      return {
        id: unit,
        title: plan?.title ?? { uk: unit, en: unit },
        summary: plan?.summary ?? null,
        competencies: plan?.competencies ?? [],
        capstoneStep: plan?.capstoneStep ?? null,
        lessons: all.order.filter((o) => o.unit === unit).map((o) => {
          const c = compiledMeta.get(o.id);
          const planned = plan?.lessons?.find((l) => l.id === o.id);
          return c
            ? { id: o.id, title: c.title, kind: c.kind, minutes: c.minutes, authored: true, prerequisites: c.prerequisites ?? [], selfCheck: c.selfCheck ?? [], pages: c.pages.length, blocks: c.blocks.map((b) => ({ id: b.id, kind: b.kind, title: b.title ?? null, mode: b.mode ?? null, runtime: b.runtime ?? null })) }
            : { id: o.id, title: planned?.title ?? { uk: o.id, en: o.id }, kind: planned?.kind ?? 'instructional', minutes: planned?.minutes ?? null, authored: false, prerequisites: planned?.prerequisites ?? [], selfCheck: [], pages: 0, blocks: [] };
        }),
      };
    }),
  }));
  const glossary = [...all.glossary.values()].map(({ file: _file, ...term }) => ({ ...term, definition: renderLocalized(term.definition, md, 'definition'), context: term.context ? renderLocalized(term.context, md, 'context') : undefined, example: term.example ? { ...term.example, codeHtml: md.highlight(term.example.code, term.example.lang ?? 'js'), note: term.example.note ? renderLocalized(term.example.note, md, 'note') : undefined } : undefined })).sort((a, b) => a.term.localeCompare(b.term));
  const glossaryText = JSON.stringify({ terms: glossary });
  hash.update(glossaryText);
  await fs.writeFile(path.join(outDir, 'glossary.json'), glossaryText);
  await fs.writeFile(path.join(outDir, 'capstones', 'domains.json'), JSON.stringify(all.domains));
  let redirects = {};
  if (await exists(path.join(CONTENT_DIR, 'redirects.yaml'))) redirects = (await readYaml(path.join(CONTENT_DIR, 'redirects.yaml'))) ?? {};
  const index = {
    contentVersion: hash.digest('hex').slice(0, 12),
    builtAt: new Date().toISOString(),
    capstones: CAPSTONES.map((id) => ({ id, title: all.domains.capstones[id].title, pitch: all.domains.capstones[id].pitch })),
    stages,
    redirects,
    counts: { lessonsAuthored: compiledMeta.size, lessonsPlanned: all.order.length, glossaryTerms: glossary.length },
  };
  await fs.writeFile(path.join(outDir, 'index.json'), JSON.stringify(index));
  if (!quiet) console.log(`content: ${compiledMeta.size}/${all.order.length} lessons, ${glossary.length} glossary terms, version ${index.contentVersion}, ${issues.length} issue(s)`);
  return { index, issues, all };
}
