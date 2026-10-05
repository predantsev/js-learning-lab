// useReducedMotion.js: subscribes in the component body, so every render adds one more subscription.
import { useEffect, useState } from 'react';
import { SimulatedAccessibilityInfo } from './motionSettings.js';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  const subscription = SimulatedAccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
  useEffect(() => {
    SimulatedAccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    return () => subscription.remove();
  }, []);
  return reduced;
}
