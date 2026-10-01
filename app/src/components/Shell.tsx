// Application frame: top bar, course sidebar, routed content, save status and failure banners.
import { useEffect, useState } from 'react';
import { type Key, pick } from '../lib/i18n';
import { allDocs, retryFailedSaves, saveStatus, unsavedSnapshot } from '../lib/persist';
import { dueReviews } from '../lib/progress';
import { route } from '../lib/router';
import { useStore } from '../lib/store';
import { app, updateProfile, useLang, useProfile, useT } from '../state/app';
import { LessonView } from './Lesson';
import { BookmarksPage, CoursePage, GlossaryPage, LessonRow, Onboarding, ProjectPage, ReviewPage, SettingsPage } from './pages';
import { Icon, LiveRegion, downloadText } from './ui';

function SaveIndicator() {
  const t = useT();
  const status = useStore(saveStatus);
  return <span className={`save-indicator save-${status.state}`} role="status" aria-live="polite"><span className="save-dot" aria-hidden="true" />{t(`save.${status.state}` as Key)}</span>;
}

function SaveBanners() {
  const t = useT();
  const status = useStore(saveStatus);
  const download = () => downloadText(`js-learning-lab-unsaved-${Date.now()}.json`, JSON.stringify(unsavedSnapshot(), null, 2));
  if (status.state === 'failed') {
    return (
      <div className="banner banner-danger" role="alert">
        <div><strong>{t('save.failedTitle')}</strong><p>{t('save.failedBody')}</p>{status.lastError && <p className="banner-detail">{t('save.detail', { error: status.lastError })}</p>}</div>
        <div className="banner-actions"><button type="button" className="btn btn-primary" onClick={retryFailedSaves}>{t('save.retry')}</button><button type="button" className="btn" onClick={download}>{t('save.download')}</button></div>
      </div>
    );
  }
  if (status.state === 'conflict') {
    const docs = allDocs().filter((d) => status.conflictDocs.includes(d.id));
    return (
      <div className="banner banner-danger" role="alert">
        <div><strong>{t('save.conflictTitle')}</strong><p>{t('save.conflictBody')}</p></div>
        <div className="banner-actions">
          <button type="button" className="btn" onClick={download}>{t('save.download')}</button>
          <button type="button" className="btn" onClick={() => { for (const d of docs) void d.overwrite(); }}>{t('save.keepMine')}</button>
          <button type="button" className="btn btn-primary" onClick={() => { void Promise.all(docs.map((d) => d.reloadFromDisk())); }}>{t('save.takeDisk')}</button>
        </div>
      </div>
    );
  }
  return null;
}

function Sidebar() {
  const t = useT();
  const lang = useLang();
  const r = useStore(route);
  const { index, byId } = app();
  const last = useStore(app().profile.store, (p) => p.lastLesson);
  const due = useStore(app().review.store, (d) => dueReviews(d).length);
  const currentId = r.name === 'lesson' ? r.id : last?.id;
  const currentUnit = currentId ? byId.get(currentId)?.unit.id : index.stages[0]?.units[0]?.id;
  const link = (name: string, href: string, icon: string, label: string, extra?: string) => (
    <a className={r.name === name ? 'side-link active' : 'side-link'} href={href} aria-current={r.name === name ? 'page' : undefined}><Icon name={icon} /> <span>{label}</span>{extra && <span className="side-extra">{extra}</span>}</a>
  );
  return (
    <aside className="app-sidebar">
      <nav aria-label={t('nav.courseOutline')} className="side-course">
        <a className="section-label" href="#/course">{t('nav.yourCourse')}</a>
        {index.stages.map((stage) => {
          const unit = stage.units.find((u) => u.id === currentUnit);
          return (
            <div key={stage.id} className="side-stage">
              <a className={unit ? 'side-stage-title active' : 'side-stage-title'} href="#/course">{unit && <span className="stage-dot" aria-hidden="true" />}{pick(stage.title, lang)}</a>
              {unit && (
                <>
                  <span className="side-unit">{pick(unit.title, lang)}</span>
                  <ol className="side-lessons">{unit.lessons.map((l) => <LessonRow key={l.id} lesson={l} compact current={r.name === 'lesson' && r.id === l.id} />)}</ol>
                </>
              )}
            </div>
          );
        })}
      </nav>
      <nav aria-label={t('nav.main')} className="side-bottom">
        {link('project', '#/project', 'folder', t('nav.project'))}
        {link('bookmarks', '#/bookmarks', 'star', t('nav.bookmarks'))}
        {link('review', '#/review', 'repeat', t('nav.review'), due > 0 ? t('nav.reviewDue', { n: due }) : undefined)}
        {link('glossary', '#/glossary', 'book', t('nav.glossary'))}
        {link('settings', '#/settings', 'gear', t('nav.settings'))}
      </nav>
    </aside>
  );
}

function Breadcrumb() {
  const lang = useLang();
  const t = useT();
  const r = useStore(route);
  const { byId, index } = app();
  if (r.name === 'lesson') {
    const ref = byId.get(r.id);
    if (!ref) return null;
    const stage = index.stages.find((s) => s.id === ref.stage);
    return <div className="breadcrumb">{pick(stage?.title, lang)} <span aria-hidden="true">/</span> {pick(ref.unit.title, lang)}</div>;
  }
  const names: Record<string, Key> = { course: 'nav.course', home: 'nav.course', project: 'nav.project', bookmarks: 'nav.bookmarks', review: 'nav.review', glossary: 'nav.glossary', settings: 'nav.settings' };
  return <div className="breadcrumb">{names[r.name] ? t(names[r.name]) : ''}</div>;
}

export function App() {
  const t = useT();
  const profile = useProfile();
  const r = useStore(route);
  const { bootstrap, notices } = app();
  const [narrow, setNarrow] = useState(window.innerWidth < 1100);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 1100);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => { document.title = `${t('app.name')}`; }, [t]);
  const onboarding = !profile.onboardingDone && r.name !== 'settings';
  let content;
  if (onboarding) content = <Onboarding />;
  else switch (r.name) {
    case 'lesson': content = <LessonView id={r.id} page={r.page} block={r.block} />; break;
    case 'project': content = <ProjectPage />; break;
    case 'bookmarks': content = <BookmarksPage />; break;
    case 'review': content = <ReviewPage />; break;
    case 'glossary': content = <GlossaryPage term={r.term} />; break;
    case 'settings': content = <SettingsPage />; break;
    case 'not-found': content = <div className="state-card"><h1>{t('error.notFound')}</h1><a className="btn" href="#/course">{t('lesson.toCourse')}</a></div>; break;
    default: content = <CoursePage />;
  }
  return (
    <div className="app">
      <a className="skip-link" href="#main">{t('app.skipToContent')}</a>
      <header className="app-top">
        <a className="brand" href="#/course"><span className="brand-mark"><Icon name="code" size={17} /></span><span>js learning lab</span></a>
        <Breadcrumb />
        <div className="top-right">
          <SaveIndicator />
          <div className="lang-switch" role="group" aria-label={t('lang.switch')}>
            <Icon name="globe" size={15} />
            {(['uk', 'en'] as const).map((l) => <button key={l} type="button" className={profile.language === l ? 'lang-option active' : 'lang-option'} aria-pressed={profile.language === l} onClick={() => updateProfile({ language: l })} lang={l}>{l === 'uk' ? 'UA' : 'EN'}</button>)}
          </div>
        </div>
      </header>
      <div className="app-frame">
        {!onboarding && <Sidebar />}
        <main id="main" className="app-main" tabIndex={-1}>
          <SaveBanners />
          {bootstrap.storeState === 'migration-failed' && <div className="banner banner-danger" role="alert"><p>{t('error.storeMigrationFailed', { error: bootstrap.migrationError ?? '' })}</p></div>}
          {bootstrap.storeState === 'newer-schema' && <div className="banner banner-danger" role="alert"><p>{t('error.storeNewer')}</p></div>}
          {notices.map((doc) => <div key={doc} className="banner banner-info" role="status"><p>{t('error.recovered', { doc })}</p></div>)}
          {narrow && <div className="banner banner-info" role="status"><p>{t('error.narrow')}</p></div>}
          {content}
        </main>
      </div>
      <LiveRegion />
    </div>
  );
}
