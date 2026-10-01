// Block bodies and explicit checks are just as correct as one-line arrows.
const trimName = (name = "") => {
  return name.trim();
};

const describe = (name, ...tags) => {
  const shownName = name.trim();
  return shownName + " [" + tags.length + "]";
};

const withFallback = (fn, fallback) => {
  return (value) => {
    const result = fn(value);
    if (result === null || result === undefined) {
      return fallback;
    }
    return result;
  };
};

const compose = (f, g) => {
  return (x) => {
    const inner = g(x);
    return f(inner);
  };
};
