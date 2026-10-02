const trimName = (name = "") => name.trim();

const describe = (name, ...tags) => trimName(name) + " [" + tags.length + "]";

const withFallback = (fn, fallback) => (value) => fn(value) ?? fallback;

// The order is reversed: f runs first, then g.
const compose = (f, g) => (x) => g(f(x));
