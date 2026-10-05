// useReducedMotion.js: the current "reduce motion" setting of the OS, kept up to date.
import { useEffect, useState } from 'react';
import { SimulatedAccessibilityInfo } from './motionSettings.js';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    SimulatedAccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const subscription = SimulatedAccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
