// useReducedMotion.js: subscribes, but never removes the subscription.
import { useEffect, useState } from 'react';
import { SimulatedAccessibilityInfo } from './motionSettings.js';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    SimulatedAccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    SimulatedAccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
  }, []);
  return reduced;
}
