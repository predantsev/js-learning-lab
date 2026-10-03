// useReducedMotion.js: two effects — one reads the setting, one follows its changes.
import { useEffect, useState } from 'react';
import { SimulatedAccessibilityInfo } from './motionSettings.js';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    async function readSetting() {
      setReduced(await SimulatedAccessibilityInfo.isReduceMotionEnabled());
    }
    readSetting();
  }, []);

  useEffect(() => {
    const subscription = SimulatedAccessibilityInfo.addEventListener('reduceMotionChanged', (value) => setReduced(value));
    return () => subscription.remove();
  }, []);

  return reduced;
}
