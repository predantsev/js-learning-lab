// Records which modules have run: a module's top-level code runs once, when it is loaded.
export const loadedModules = [];

export function markLoaded(file) {
  loadedModules.push(file);
}
