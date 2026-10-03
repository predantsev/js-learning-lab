// SIMULATED swipes (read-only preview helper). The preview has no finger and no gesture library, so a row
// registers its pan handlers under the id of the record it shows, and swipe() replays a finger: one
// onUpdate({ translationX }) per position, then onEnd({ translationX }) with the last one — the same
// event shape as a Pan gesture of react-native-gesture-handler 2.32.
import { useEffect, useRef } from 'react';

const rows = new Map(); // record id → the latest handlers of the row that shows it

export function useSimulatedPan(recordId, handlers) {
  const latest = useRef(handlers);
  latest.current = handlers;
  useEffect(() => {
    rows.set(recordId, latest);
    return () => {
      if (rows.get(recordId) === latest) rows.delete(recordId);
    };
  }, [recordId]);
}

export function swipe(recordId, positions) {
  const handlers = rows.get(recordId)?.current;
  if (!handlers) return false;
  for (const translationX of positions) handlers.onUpdate({ translationX });
  handlers.onEnd({ translationX: positions[positions.length - 1] });
  return true;
}
