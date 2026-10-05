// The live feed of habit completions. on() registers a handler, off() removes the same handler.
const handlers = new Set();

export const completionFeed = {
  on(handler) {
    handlers.add(handler);
  },
  off(handler) {
    handlers.delete(handler);
  },
  publish(completion) {
    for (const handler of handlers) handler(completion);
  },
  handlerCount: () => handlers.size,
};
