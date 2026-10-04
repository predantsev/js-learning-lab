// The club's digest: a timer on the server sends the top readers to the club's channel.
// loadConfig() reads the current settings: { language, topCount, everyMs }.
export function createDigest({ loadConfig, summary, send, timers = globalThis }) {
  let config = loadConfig();
  let timer = schedule(config);

  function schedule(settings) {
    return timers.setInterval(() => {
      const top = [...summary()].sort((a, b) => b.pagesRead - a.pagesRead).slice(0, settings.topCount);
      send({ language: settings.language, names: top.map((member) => member.name) });
    }, settings.everyMs);
  }

  return {
    // Called after an admin changed the settings.
    reload() {
      config = loadConfig();
    },
    settings: () => config,
    stop() {
      timers.clearInterval(timer);
    },
  };
}
