// SIMULATED accessibility settings (read-only preview helper). It has the same shape as the reduce-motion
// part of AccessibilityInfo in React Native 0.86: isReduceMotionEnabled() → Promise<boolean>, and
// addEventListener('reduceMotionChanged', handler) → a subscription with remove(). On a device you import
// AccessibilityInfo from 'react-native' instead; there the OS setting changes, not setReduceMotion().
let enabled = false;
const subscriptions = new Set(); // one entry per addEventListener call, even for the same handler

export const SimulatedAccessibilityInfo = {
  isReduceMotionEnabled() {
    return Promise.resolve(enabled);
  },
  addEventListener(eventName, handler) {
    if (eventName !== 'reduceMotionChanged') return { remove() {} };
    const subscription = { handler, remove: () => subscriptions.delete(subscription) };
    subscriptions.add(subscription);
    return subscription;
  },
};

// Preview controls: flip the simulated OS setting, and count the subscriptions that are still active.
export function setReduceMotion(value) {
  enabled = value;
  for (const { handler } of [...subscriptions]) handler(value);
}

export function activeSubscriptions() {
  return subscriptions.size;
}
