// No default: trimName() calls .trim() on undefined and throws a TypeError.
const trimName = (name) => name.trim();

const describe = (name, ...tags) => trimName(name) + " [" + tags.length + "]";

const withFallback = (fn, fallback) => (value) => fn(value) ?? fallback;

const compose = (f, g) => (x) => f(g(x));
