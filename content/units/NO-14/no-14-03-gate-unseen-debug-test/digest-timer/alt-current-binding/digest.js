// The club's digest: a timer on the server sends the top readers to the club's channel.
// loadConfig() reads the current settings: { language, topCount, everyMs }.
export function createDigest({ loadConfig, summary, send, timers = globalThis }) {
  let config = loadConfig();
  let timer = schedule(config.everyMs);

  // The callback reads `config` — the variable, not a parameter — so every tick sees the latest settings.
  function schedule(everyMs) {
    return timers.setInterval(() => {
      const top = [...summary()].sort((a, b) => b.pagesRead - a.pagesRead).slice(0, config.topCount);
      send({ language: config.language, names: top.map((member) => member.name) });
    }, everyMs);
  }

  return {
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
