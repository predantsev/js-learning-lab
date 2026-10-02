import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/Shell';
import { ApiError } from './lib/api';
import { ContentError } from './lib/content';
import { translate } from './lib/i18n';
import { initApp } from './state/app';
import './styles/tokens.css';
import './styles/app.css';

const root = createRoot(document.getElementById('app')!);

function Fatal({ error }: { error: unknown }) {
  // Before the profile loads the interface language is unknown: show both.
  const key = error instanceof ContentError ? (error.code === 'corrupt' ? 'error.contentCorrupt' : error.code === 'missing' ? 'error.contentMissing' : 'error.serverUnreachable') : error instanceof ApiError && error.code === 'corrupt' ? 'error.storeCorrupt' : 'error.serverUnreachable';
  const params = { doc: error instanceof ApiError ? String(error.body.file ?? '') : '' };
  return (
    <div className="state-card fatal" role="alert">
      <h1>{translate('uk', 'error.title')} / {translate('en', 'error.title')}</h1>
      <p lang="uk">{translate('uk', key, params)}</p>
      <p lang="en">{translate('en', key, params)}</p>
      <details><summary>{translate('uk', 'error.details')} / {translate('en', 'error.details')}</summary><pre>{error instanceof Error ? error.message : String(error)}</pre></details>
      <button type="button" className="btn btn-primary" onClick={() => location.reload()}>{translate('uk', 'error.reload')} / {translate('en', 'error.reload')}</button>
    </div>
  );
}

root.render(<p className="ws-empty" role="status">{translate('uk', 'app.loading')}</p>);
initApp().then(
  () => root.render(<StrictMode><App /></StrictMode>),
  (error) => root.render(<Fatal error={error} />),
);
