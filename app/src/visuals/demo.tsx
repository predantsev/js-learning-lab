// Demo page: renders every compiled sample (dist/content/visuals/samples.json, built by
// scripts/content/compile-visual-samples.mjs) with language, style, appearance, reduced-motion
// and column-width switches. Query params preset the switches (used by tests):
//   ?lang=en&style=editorial&appearance=dark&reduced=1&width=420&only=code-trace
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';
import { VISUAL_LABELS, VisualPlayer, type Lang, type VisualKind, type VisualSpec } from './index';

type Sample = { file: string; id: string; visual: VisualKind; title: Record<Lang, string>; textEquivalent: Record<Lang, string>; spec: VisualSpec };

const params = new URLSearchParams(location.search);
const STYLES = ['calm-studio', 'editorial', 'dev-workspace'] as const;
const APPEARANCES = ['system', 'light', 'dark'] as const;
const WIDTHS = ['420', '600', '760', 'auto'] as const;

const UI = {
  uk: { lang: 'Мова', style: 'Стиль', appearance: 'Вигляд', width: 'Ширина колонки', reduced: 'Менше руху', loading: 'Завантаження семплів…', failed: 'Не вдалося завантажити samples.json. Запустіть: node scripts/content/compile-visual-samples.mjs', textEq: 'Текстовий еквівалент', system: 'системний', light: 'світлий', dark: 'темний', auto: 'авто' },
  en: { lang: 'Language', style: 'Style', appearance: 'Appearance', width: 'Column width', reduced: 'Reduced motion', loading: 'Loading samples…', failed: 'Could not load samples.json. Run: node scripts/content/compile-visual-samples.mjs', textEq: 'Text equivalent', system: 'system', light: 'light', dark: 'dark', auto: 'auto' },
};

function Demo() {
  const [lang, setLang] = useState<Lang>(params.get('lang') === 'en' ? 'en' : 'uk');
  const [style, setStyle] = useState<string>(STYLES.includes(params.get('style') as never) ? (params.get('style') as string) : 'calm-studio');
  const [appearance, setAppearance] = useState<string>(APPEARANCES.includes(params.get('appearance') as never) ? (params.get('appearance') as string) : 'system');
  const [width, setWidth] = useState<string>(WIDTHS.includes(params.get('width') as never) ? (params.get('width') as string) : 'auto');
  const [reduced, setReduced] = useState(params.get('reduced') === '1');
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<string, number>>({});
  const only = params.get('only');
  const t = UI[lang];

  useEffect(() => {
    document.documentElement.dataset.style = style;
    if (appearance === 'system') delete document.documentElement.dataset.appearance; else document.documentElement.dataset.appearance = appearance;
    document.documentElement.lang = lang;
  }, [style, appearance, lang]);

  useEffect(() => {
    fetch('/content/visuals/samples.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { samples: Sample[] }) => { setSamples(data.samples); document.documentElement.dataset.demo = 'ready'; })
      .catch((e: Error) => { setError(e.message); document.documentElement.dataset.demo = 'failed'; });
  }, []);

  const shown = samples ? samples.filter((s) => !only || s.visual === only || s.id === only) : [];
  return (
    <div className="demo">
      <header className="demo-bar" role="group" aria-label="Demo controls">
        <label>{t.lang} <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} data-control="lang"><option value="uk">Українська</option><option value="en">English</option></select></label>
        <label>{t.style} <select value={style} onChange={(e) => setStyle(e.target.value)} data-control="style">{STYLES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
        <label>{t.appearance} <select value={appearance} onChange={(e) => setAppearance(e.target.value)} data-control="appearance">{APPEARANCES.map((a) => <option key={a} value={a}>{t[a]}</option>)}</select></label>
        <label>{t.width} <select value={width} onChange={(e) => setWidth(e.target.value)} data-control="width">{WIDTHS.map((w) => <option key={w} value={w}>{w === 'auto' ? t.auto : `${w}px`}</option>)}</select></label>
        <label><input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} data-control="reduced" /> {t.reduced}</label>
      </header>
      <main className="demo-main" style={{ width: width === 'auto' ? undefined : `${width}px` }} data-width={width}>
        {error ? <p role="alert">{t.failed} ({error})</p> : null}
        {!samples && !error ? <p>{t.loading}</p> : null}
        {shown.map((sample) => (
          <article key={sample.id} className="demo-sample" data-visual={sample.visual} data-sample={sample.id}>
            <h2>{sample.title[lang]} <code className="demo-kind">{sample.visual}</code></h2>
            <VisualPlayer visual={sample.visual} spec={sample.spec} lang={lang} labels={VISUAL_LABELS[lang]} reducedMotion={reduced} title={sample.title[lang]} initialStep={steps[sample.id] ?? 0} onStep={(i) => setSteps((s) => (s[sample.id] === i ? s : { ...s, [sample.id]: i }))} />
            <details className="demo-text"><summary>{t.textEq}</summary><p>{sample.textEquivalent[lang]}</p></details>
          </article>
        ))}
      </main>
    </div>
  );
}

createRoot(document.getElementById('app')!).render(<Demo />);
