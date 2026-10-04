// SIMULATED gesture arbitration (read-only preview helper). A browser has no finger and no native list
// scrolling, so this module replays finger paths through a model of the rules documented for the Pan
// gesture of react-native-gesture-handler 2.32: the row's pan FAILS when the finger leaves the
// failOffsetY range before the pan activated, and ACTIVATES when the finger leaves the activeOffsetX range.
// The list starts scrolling once the finger has moved LIST_SLOP points vertically while nobody owns the
// touch. LIST_SLOP is an example value: the real one is chosen by the platform.
// Differs from the real library: only activeOffsetX and failOffsetY are modelled (no activeOffsetY,
// failOffsetX, minDistance or velocity); one finger only; positions are replayed at once, not as touch
// events over time; and the list is a plain rule here, not a native scroll view negotiating with the row.
export const LIST_SLOP = 10;

// path: finger positions in points relative to the touch-down point, in time order.
// Returns one entry per position: { x, y, owner } with owner 'nobody' | 'row' | 'list'.
export function arbitrate(path, { activeOffsetX, failOffsetY }) {
  let owner = 'nobody';
  let rowFailed = false;
  return path.map(({ x, y }) => {
    if (owner === 'nobody') {
      // Like the real handler, the fail rule is checked before the activation rule.
      if (!rowFailed && Math.abs(y) > failOffsetY) rowFailed = true;
      if (!rowFailed && Math.abs(x) > activeOffsetX) owner = 'row';
      else if (Math.abs(y) > LIST_SLOP) owner = 'list';
    }
    return { x, y, owner };
  });
}
