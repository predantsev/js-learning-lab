// swipeRules.js: when does a finished swipe on a wish row mark the wish acquired?
export const DISTANCE = 120; // points to the left
export const VELOCITY = 800; // points per second to the left

// Called once when the finger leaves the row after a pan. `event` has translationX (how far the row
// moved) and velocityX (how fast the finger moved at release); negative values mean "to the left".
export function onSwipeEnd(event, acquire) {
  // TODO: call acquire() only for a swipe to the left that went far enough or fast enough
}

// Props for the row: a screen-reader action that does what the swipe does, without a gesture.
export function acquireActionProps(label, acquire) {
  // TODO
  return {};
}
