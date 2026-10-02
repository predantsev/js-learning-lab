const trimName = (name = "") => name.trim();

const describe = (name, ...tags) => trimName(name) + " [" + tags.length + "]";

// || also replaces 0 and "", which are real results.
const withFallback = (fn, fallback) => (value) => fn(value) || fallback;

const compose = (f, g) => (x) => f(g(x));
