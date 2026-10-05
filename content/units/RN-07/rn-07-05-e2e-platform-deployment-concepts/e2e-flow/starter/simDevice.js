// SIMULATION (read-only): a habit tracker running on a device, for the preview's E2E runner.
// The "disk" outlives a restart of the app, as a phone's storage would.
export function createDevice({ persists = true, saveAdds = true } = {}) {
  const disk = { habits: null };
  let app = null;

  function boot() {
    app = { screen: 'list', habits: disk.habits ? [...disk.habits] : ['%%exercise%%', '%%water%%'], draft: '' };
  }
  const visibleTexts = () => (app.screen === 'list' ? [...app.habits, '%%addHabit%%'] : ['%%nameField%%', '%%save%%']);

  return {
    launch: boot,
    restart() {
      app = null; // the process ends; only the disk is left
      boot();
    },
    isVisible: (text) => app !== null && visibleTexts().includes(text),
    tap(label) {
      if (app?.screen === 'list' && label === '%%addHabit%%') {
        app.screen = 'form';
        app.draft = '';
      } else if (app?.screen === 'form' && label === '%%save%%') {
        if (saveAdds && app.draft.trim()) app.habits.push(app.draft.trim());
        if (persists) disk.habits = [...app.habits];
        app.screen = 'list';
      } else {
        throw new Error(`"${label}" — %%noSuchButton%%`);
      }
    },
    type(label, text) {
      if (app?.screen !== 'form' || label !== '%%nameField%%') throw new Error(`"${label}" — %%noSuchField%%`);
      app.draft = String(text);
    },
  };
}
