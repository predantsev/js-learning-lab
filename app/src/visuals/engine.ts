// One shared step engine for every visual kind: Previous / Next / Reset / Play / Pause, keyboard
// (← → Home End when the player has focus), autoplay off by default, any manual action pauses.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

export const AUTOPLAY_MS = 1600;

export type StepEngine = {
  index: number;
  total: number;
  playing: boolean;
  /** Increments on every step change; players key one-shot highlights on it. */
  tick: number;
  go: (i: number, manual?: boolean) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  togglePlay: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

export function useStepEngine({ total, initialStep = 0, onStep }: { total: number; initialStep?: number; onStep?: (index: number) => void }): StepEngine {
  const clamp = useCallback((i: number) => Math.min(Math.max(0, i), Math.max(0, total - 1)), [total]);
  const [index, setIndex] = useState(() => clamp(initialStep));
  const [playing, setPlaying] = useState(false);
  const [tick, setTick] = useState(0);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  const go = useCallback((i: number, manual = true) => {
    const target = clamp(i);
    if (manual) setPlaying(false);
    setIndex((current) => {
      if (current === target) return current;
      setTick((t) => t + 1);
      return target;
    });
  }, [clamp]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);
  const reset = useCallback(() => go(0), [go]);
  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (p) return false;
      if (index >= total - 1) { go(0, false); }
      return true;
    });
  }, [go, index, total]);

  useEffect(() => { onStepRef.current?.(index); }, [index]);
  useEffect(() => { setIndex((i) => clamp(i)); }, [clamp]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (current >= total - 1) { setPlaying(false); return current; }
        setTick((t) => t + 1);
        return current + 1;
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [playing, total]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case 'ArrowRight': go(index + 1); break;
      case 'ArrowLeft': go(index - 1); break;
      case 'Home': go(0); break;
      case 'End': go(total - 1); break;
      default: return;
    }
    event.preventDefault();
  }, [go, index, total]);

  return { index, total, playing, tick, go, next, prev, reset, togglePlay, onKeyDown };
}

/** True when the OS asks for reduced motion (live). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}
