// Two data sources with the same shape: list(signal) returns a promise of the records.
// The screen only calls list(); it never knows which source it got.
import { bundledWishes } from './bundled.js';

// Bundled fixtures: the records ship inside the app. No network, no waiting, no failures.
export const bundledSource = {
  async list() {
    return bundledWishes;
  },
};

// A SIMULATED mock-service answer. This preview cannot reach a service on your computer,
// so it imitates the two things the real mock service adds: a delay and an HTTP status.
export function simulatedMockSource({ delayMs, status }) {
  return {
    list(signal) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (status >= 400) reject(new Error(`HTTP ${status}`));
          else resolve(bundledWishes);
        }, delayMs);
        signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    },
  };
}
