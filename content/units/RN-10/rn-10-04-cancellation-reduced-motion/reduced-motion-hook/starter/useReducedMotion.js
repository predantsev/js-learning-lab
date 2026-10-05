// useReducedMotion.js: the current "reduce motion" setting of the OS, kept up to date.
import { useState } from 'react';
import { SimulatedAccessibilityInfo } from './motionSettings.js';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  // TODO: read the setting once, follow its changes, and stop following them when the component unmounts.
  return reduced;
}
