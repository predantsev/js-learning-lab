// Write four pure arrow functions. None of them prints anything or changes its arguments.

// 1. trimName(name = "") — the name without spaces at its edges; "" when called without a name.
const trimName = (name = "") => name.trim();

// 2. describe(name, ...tags) — the trimmed name and the number of tags: "%%lamp%% [2]".
const describe = (name, ...tags) => trimName(name) + " [" + tags.length + "]";

// 3. withFallback(fn, fallback) — a new function: fn's result, or fallback when it is null or undefined.
const withFallback = (fn, fallback) => (value) => fn(value) ?? fallback;

// 4. compose(f, g) — a new function: compose(f, g)(x) is f(g(x)).
const compose = (f, g) => (x) => f(g(x));
