// useReducedMotion.js: reads the setting once and never hears about a change.
import { useEffect, useState } from 'react';
import { SimulatedAccessibilityInfo } from './motionSettings.js';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    SimulatedAccessibilityInfo.isReduceMotionEnabled().then(setReduced);
  }, []);
  return reduced;
}
