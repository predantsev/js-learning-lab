const trimName = (name = "") => name.trim();

// describe prints while it works: a side effect in a function that should be pure.
const describe = (name, ...tags) => {
  const text = trimName(name) + " [" + tags.length + "]";
  console.log(text);
  return text;
};

const withFallback = (fn, fallback) => (value) => fn(value) ?? fallback;

const compose = (f, g) => (x) => f(g(x));
