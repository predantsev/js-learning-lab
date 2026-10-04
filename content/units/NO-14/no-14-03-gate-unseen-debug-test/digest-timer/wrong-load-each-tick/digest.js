// The club's digest: a timer on the server sends the top readers to the club's channel.
// loadConfig() reads the current settings: { language, topCount, everyMs }.
export function createDigest({ loadConfig, summary, send, timers = globalThis }) {
  let config = loadConfig();
  let timer = schedule(config.everyMs);

  function schedule(everyMs) {
    return timers.setInterval(() => {
      const settings = loadConfig(); // reads whatever is stored now, reloaded or not
      const top = [...summary()].sort((a, b) => b.pagesRead - a.pagesRead).slice(0, settings.topCount);
      send({ language: settings.language, names: top.map((member) => member.name) });
    }, everyMs);
  }

  return {
    // Called after an admin changed the settings.
    reload() {
      const before = config.everyMs;
      config = loadConfig();
      if (config.everyMs !== before) {
        timers.clearInterval(timer);
        timer = schedule(config.everyMs);
      }
    },
    settings: () => config,
    stop() {
      timers.clearInterval(timer);
    },
  };
}
