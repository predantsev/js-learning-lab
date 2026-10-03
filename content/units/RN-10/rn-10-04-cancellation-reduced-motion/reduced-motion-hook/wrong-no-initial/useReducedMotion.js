// useReducedMotion.js: follows changes, but starts from false even when the setting is already on.
import { useEffect, useState } from 'react';
import { SimulatedAccessibilityInfo } from './motionSettings.js';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const subscription = SimulatedAccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => subscription.remove();
  }, []);
  return reduced;
}
